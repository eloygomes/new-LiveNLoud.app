// youtube/youtube.service.js

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status, reason) {
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;

  // quotaExceeded (403) NÃO adianta retry
  if (status === 403 && reason === "quotaExceeded") return false;

  return false;
}

function pickYouTubeErrorReason(data) {
  const reason = data?.error?.errors?.[0]?.reason;
  return reason || null;
}

async function ytFetch(url, { method = "GET", accessToken, body, attemptMax = 5 } = {}) {
  let attempt = 0;

  while (attempt < attemptMax) {
    attempt += 1;

    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await resp.json().catch(() => ({}));
    const reason = pickYouTubeErrorReason(data);

    if (resp.ok) return data;

    // quotaExceeded: falha imediata
    if (resp.status === 403 && reason === "quotaExceeded") {
      const err = new Error(
        `[YT 403] quotaExceeded: você excedeu a quota do projeto (YouTube Data API).`
      );
      err.status = resp.status;
      err.reason = reason;
      err.data = data;
      throw err;
    }

    // Retry com backoff exponencial + jitter
    if (shouldRetry(resp.status, reason) && attempt < attemptMax) {
      const base = 600 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 400);
      const wait = base + jitter;
      console.log(`[YT] retry ${attempt}/${attemptMax} after ${wait}ms`, {
        status: resp.status,
        reason,
      });
      await sleep(wait);
      continue;
    }

    const msg =
      data?.error?.message ||
      data?.error_description ||
      `HTTP error ${resp.status}`;

    const err = new Error(`[YT ${resp.status}] ${reason || "error"}: ${msg}`);
    err.status = resp.status;
    err.reason = reason;
    err.data = data;
    throw err;
  }
}

async function createPlaylist({ accessToken, title, privacyStatus = "public" }) {
  const url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status";
  return ytFetch(url, {
    method: "POST",
    accessToken,
    body: {
      snippet: { title },
      status: { privacyStatus },
    },
  });
}

async function searchVideoId({ accessToken, q }) {
  // ✅ Melhor: part=id (mais leve) e melhora consistência do id.videoId
  // ✅ Melhorias de qualidade de busca (não obrigatórias, mas ajudam)
  const url =
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      part: "id",
      type: "video",
      maxResults: "1",
      q,
      safeSearch: "none",
      videoEmbeddable: "true",
      order: "relevance",
    }).toString();

  const data = await ytFetch(url, { method: "GET", accessToken });

  const item = data?.items?.[0];
  const videoId = item?.id?.videoId || null;
  return videoId;
}

async function addVideoToPlaylist({ accessToken, playlistId, videoId }) {
  const url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet";
  return ytFetch(url, {
    method: "POST",
    accessToken,
    body: {
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    },
  });
}

/**
 * Exporta uma playlist inteira com delay (pra evitar rate-limit).
 * songs: [{ song, artist }] ou [{ title, artist }]
 */
async function exportPlaylist({
  accessToken,
  playlistName,
  songs = [],
  privacyStatus = "public",
  delayMs = 350,
}) {
  const created = await createPlaylist({
    accessToken,
    title: playlistName,
    privacyStatus,
  });

  const playlistId = created?.id;
  if (!playlistId) {
    const err = new Error("[YT] playlistId_missing_after_create");
    err.data = created;
    throw err;
  }

  let added = 0;
  const notFound = [];

  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];

    const songName = String(s.song || s.title || "").trim();
    const artistName = String(s.artist || "").trim();

    const q = `${songName} ${artistName}`.trim();
    if (!q) {
      notFound.push({ i, q: "" });
      continue;
    }

    // 1) search
    const videoId = await searchVideoId({ accessToken, q });

    if (!videoId) {
      notFound.push({ i, q });
      continue;
    }

    // 2) add
    await addVideoToPlaylist({ accessToken, playlistId, videoId });
    added += 1;

    // 3) delay
    if (delayMs > 0) await sleep(delayMs);
  }

  return { playlistId, added, notFound };
}

module.exports = {
  exportPlaylist,
};