const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v=";
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const SOURCE_FETCH_TIMEOUT_MS = Number(process.env.AUTO_YOUTUBE_SOURCE_TIMEOUT_MS || 8000);
const SEARCH_FETCH_TIMEOUT_MS = Number(process.env.AUTO_YOUTUBE_SEARCH_TIMEOUT_MS || 10000);

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

function normalizeYouTubeUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw, "https://www.youtube.com");
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/").filter(Boolean)[1] || "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        return null;
      }
    }

    if (VIDEO_ID_RE.test(videoId)) return `${YOUTUBE_WATCH_URL}${videoId}`;
  } catch {
    const match = raw.match(/(?:v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match?.[1]) return `${YOUTUBE_WATCH_URL}${match[1]}`;
  }

  return null;
}

function getYouTubeVideoId(value = "") {
  return normalizeYouTubeUrl(value)?.slice(YOUTUBE_WATCH_URL.length) || null;
}

function normalizeVideoList(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map(normalizeYouTubeUrl)
        .filter(Boolean),
    ),
  );
}

function detectSource(sourceUrl = "") {
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "cifraclub.com.br" || host === "cifralub.com.br") return "cifraclub";
    if (host === "ultimate-guitar.com" || host.endsWith(".ultimate-guitar.com")) return "ultimate_guitar";
  } catch {}
  return "unknown";
}

function extractYouTubeCandidatesFromHtml(html = "") {
  const candidates = [];
  const patterns = [
    /https?:\\?\/\\?\/(?:www\.)?youtube\.com\\?\/watch\?v=([a-zA-Z0-9_-]{11})/g,
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
    /https?:\\?\/\\?\/(?:www\.)?youtube\.com\\?\/embed\\?\/([a-zA-Z0-9_-]{11})/g,
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/g,
    /https?:\\?\/\\?\/youtu\.be\\?\/([a-zA-Z0-9_-]{11})/g,
    /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/g,
    /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g,
    /data-video-id=["']([a-zA-Z0-9_-]{11})["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const url = normalizeYouTubeUrl(`${YOUTUBE_WATCH_URL}${match[1]}`);
      if (url && !candidates.includes(url)) candidates.push(url);
    }
  }

  return candidates;
}

async function fetchText(url, timeoutMs) {
  const timer = withTimeout(timeoutMs);
  try {
    const response = await fetch(url, {
      signal: timer.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/134 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!response.ok) {
      const error = new Error(`source_fetch_http_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.text();
  } finally {
    timer.cancel();
  }
}

async function resolveFromSourcePage(sourceUrl = "") {
  if (!sourceUrl) return null;
  const html = await fetchText(sourceUrl, SOURCE_FETCH_TIMEOUT_MS);
  const [primary] = extractYouTubeCandidatesFromHtml(html);
  return primary || null;
}

function scoreSearchItem(item, { artist = "", song = "" } = {}) {
  const text = [
    item.title,
    item.channelTitle,
    item.description,
  ].join(" ").toLowerCase();
  const artistTokens = String(artist).toLowerCase().split(/\s+/).filter(Boolean);
  const songTokens = String(song).toLowerCase().split(/\s+/).filter(Boolean);
  const negativeTerms = [
    "cover",
    "karaoke",
    "backing track",
    "lesson",
    "tutorial",
    "reaction",
    "aula",
    "how to play",
  ];

  let score = 0;
  if (/\bofficial\b|oficial|vevo\b/.test(text)) score += 40;
  if (/\btopic\b|audio\b/.test(text)) score += 25;
  if (/\bmusic video\b|videoclipe|video oficial/.test(text)) score += 18;
  artistTokens.forEach((token) => {
    if (token.length > 2 && text.includes(token)) score += 4;
  });
  songTokens.forEach((token) => {
    if (token.length > 2 && text.includes(token)) score += 5;
  });
  negativeTerms.forEach((term) => {
    if (text.includes(term)) score -= 35;
  });
  return score;
}

async function searchWithDataApi({ artist, song }) {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.YT_API_KEY;
  if (!apiKey) return { status: "skipped", reason: "missing_api_key", items: [] };

  const query = `${artist} ${song}`.trim();
  const url =
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      key: apiKey,
      part: "snippet",
      type: "video",
      maxResults: "8",
      q: query,
      safeSearch: "none",
      videoEmbeddable: "true",
      order: "relevance",
    }).toString();

  const timer = withTimeout(SEARCH_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: timer.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || `youtube_search_http_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return {
      status: "searched",
      items: (data.items || []).map((item) => ({
        videoId: item?.id?.videoId,
        title: item?.snippet?.title || "",
        channelTitle: item?.snippet?.channelTitle || "",
        description: item?.snippet?.description || "",
      })),
    };
  } finally {
    timer.cancel();
  }
}

async function searchWithYouTubeHtml({ artist, song }) {
  const query = `${artist} ${song}`.trim();
  const url = `https://www.youtube.com/results?${new URLSearchParams({ search_query: query })}`;
  const html = await fetchText(url, SEARCH_FETCH_TIMEOUT_MS);
  const ids = [];
  for (const match of html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)) {
    if (!ids.includes(match[1])) ids.push(match[1]);
    if (ids.length >= 8) break;
  }
  return {
    status: "searched",
    items: ids.map((videoId, index) => ({
      videoId,
      title: "",
      channelTitle: "",
      description: "",
      fallbackRank: index,
    })),
  };
}

async function searchYouTube({ artist, song }) {
  const apiResult = await searchWithDataApi({ artist, song });
  if (apiResult.status === "searched") return apiResult;
  return searchWithYouTubeHtml({ artist, song });
}

function pickBestSearchResult(items = [], context = {}) {
  const ranked = items
    .filter((item) => VIDEO_ID_RE.test(item.videoId || ""))
    .map((item) => ({
      ...item,
      score: scoreSearchItem(item, context) - (item.fallbackRank || 0),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return null;

  const hasMetadata = Boolean(best.title || best.channelTitle || best.description);
  if (hasMetadata && best.score < 8) return null;
  return `${YOUTUBE_WATCH_URL}${best.videoId}`;
}

function getPrimarySourceUrl(userdata = {}) {
  for (const instrument of ["guitar01", "guitar02", "bass", "keys", "drums", "voice"]) {
    const link = userdata?.[instrument]?.link;
    if (typeof link === "string" && link.trim()) return link.trim();
  }
  return "";
}

async function resolveAutomaticYouTubeVideo(userdata = {}) {
  const existingVideos = normalizeVideoList(userdata.embedVideos);
  const sourceUrl = getPrimarySourceUrl(userdata);
  const source = detectSource(sourceUrl);
  const meta = {
    status: "not_found",
    source,
    sourceUrl,
    strategy: "none",
    message: "Nenhum video encontrado automaticamente.",
  };

  if (!userdata.artist || !userdata.song) {
    return { videos: existingVideos, meta: { ...meta, status: "skipped", reason: "missing_song_metadata" } };
  }

  try {
    const sourceVideo = await resolveFromSourcePage(sourceUrl);
    if (sourceVideo) {
      return {
        videos: normalizeVideoList([...existingVideos, sourceVideo]),
        meta: {
          ...meta,
          status: existingVideos.includes(sourceVideo) ? "duplicate" : "found",
          strategy: "source_page",
          videoUrl: sourceVideo,
          message: "Video encontrado automaticamente na pagina da cifra.",
        },
      };
    }
  } catch (error) {
    console.warn("[AUTO_YOUTUBE] source page resolution failed", {
      source,
      sourceUrl,
      error: error?.message,
    });
  }

  try {
    const searchResult = await searchYouTube({
      artist: userdata.artist,
      song: userdata.song,
    });
    const videoUrl = pickBestSearchResult(searchResult.items, {
      artist: userdata.artist,
      song: userdata.song,
    });
    if (!videoUrl) return { videos: existingVideos, meta };
    return {
      videos: normalizeVideoList([...existingVideos, videoUrl]),
      meta: {
        ...meta,
        status: existingVideos.includes(videoUrl) ? "duplicate" : "found",
        strategy: "youtube_search",
        videoUrl,
        message: "Video encontrado automaticamente por busca no YouTube.",
      },
    };
  } catch (error) {
    console.warn("[AUTO_YOUTUBE] youtube search failed", {
      artist: userdata.artist,
      song: userdata.song,
      error: error?.message,
    });
    return {
      videos: existingVideos,
      meta: {
        ...meta,
        status: "pending",
        strategy: "youtube_search",
        reason: error?.name === "AbortError" ? "timeout" : "search_failed",
        message: "Resolucao automatica de video pendente.",
      },
    };
  }
}

module.exports = {
  extractYouTubeCandidatesFromHtml,
  getYouTubeVideoId,
  normalizeVideoList,
  normalizeYouTubeUrl,
  pickBestSearchResult,
  resolveAutomaticYouTubeVideo,
};
