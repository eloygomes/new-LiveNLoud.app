const extensionApi = globalThis.browser || globalThis.chrome;

const DEBUG_PREFIX = "[LiveNLoud Extension]";
const NOT_AVAILABLE = "The information is not avabiable";
const SUPPORTED_HOSTS = [
  {
    id: "cifraclub",
    pattern: /(^|\.)cifraclub\.com\.br$/i,
  },
  {
    id: "ultimate_guitar",
    pattern: /(^|\.)ultimate-guitar\.com$/i,
  },
  {
    id: "letrasmus",
    pattern: /(^|\.)letras\.(mus\.br|com)$/i,
  },
];

function debugLog(step, details) {
  if (details === undefined) {
    console.log(`${DEBUG_PREFIX} ${step}`);
    return;
  }

  console.log(`${DEBUG_PREFIX} ${step}`, details);
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSupportedSite(hostname) {
  return SUPPORTED_HOSTS.find((entry) => entry.pattern.test(hostname)) || null;
}

function getCifraRoot() {
  return (
    document.querySelector(".g-1.g-fix.cifra") ||
    document.querySelector(".cifra")
  );
}

function slugToTitle(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function parseUltimateGuitarUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);

    if (segments.length < 3 || segments[0] !== "tab") {
      return null;
    }

    const artistSlug = segments[1];
    const tailParts = segments[2].split("-").filter(Boolean);
    if (tailParts.length < 3) {
      return null;
    }

    return {
      artist: slugToTitle(artistSlug),
      song: slugToTitle(tailParts.slice(0, -2).join("-")),
    };
  } catch (_error) {
    return null;
  }
}

function parseLetrasUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    return {
      artist: slugToTitle(segments[0]),
      song: "",
    };
  } catch (_error) {
    return null;
  }
}

function getMetaContent(selector) {
  return cleanText(document.querySelector(selector)?.content);
}

function getUltimateGuitarSong() {
  const headerTitle = cleanText(
    document.querySelector("h1.tabHeader-h1")?.childNodes?.[0]?.textContent ||
      document.querySelector("h1.tabHeader-h1")?.textContent,
  );
  if (headerTitle) {
    return headerTitle.replace(/\s+by\s+.+$/i, "").trim();
  }

  const ogTitle = getMetaContent('meta[property="og:title"]');
  if (ogTitle) {
    return ogTitle
      .replace(/\s+(chords|tab|tabs|bass|ukulele|official)\s+by\s+.+$/i, "")
      .replace(/\s+@\s+ultimate-guitar\.com$/i, "")
      .trim();
  }

  return parseUltimateGuitarUrl(window.location.href)?.song || "";
}

function getUltimateGuitarArtist() {
  const headerArtist = cleanText(
    document.querySelector("h1.tabHeader-h1 .tabHeader-h2")?.textContent,
  );
  if (headerArtist) {
    return headerArtist;
  }

  const ogTitle = getMetaContent('meta[property="og:title"]');
  const ogArtistMatch = ogTitle.match(/\s+by\s+(.+?)(?:\s+@\s+ultimate-guitar\.com)?$/i);
  if (ogArtistMatch?.[1]) {
    return cleanText(ogArtistMatch[1]);
  }

  return parseUltimateGuitarUrl(window.location.href)?.artist || "";
}

function getUltimateGuitarField(label) {
  const selectors = [
    "ul.tabHeader-info li.tabHeader-item",
    '[class*="tab-info"] li',
    '[data-name="tab-info"] li',
  ];

  for (const selector of selectors) {
    const items = document.querySelectorAll(selector);
    for (const item of items) {
      const text = cleanText(item.textContent);
      if (!text) continue;

      const pattern = new RegExp(`^${label}\\s*:??\\s*(.+)$`, "i");
      const match = text.match(pattern);
      if (match?.[1]) {
        return cleanText(match[1]);
      }
    }
  }

  return "";
}

function getLetrasSong() {
  const title = cleanText(
    document.querySelector("#js-lyricHeader .title-primary h1")?.textContent ||
      document.querySelector("h1.textStyle-primary")?.textContent ||
      document.querySelector(".cnt-head_title h1")?.textContent ||
      document.querySelector("h1")?.textContent,
  );
  return title;
}

function getLetrasArtist() {
  const artist = cleanText(
    document.querySelector("#js-lyricHeader .title-secondary h2")?.textContent ||
      document.querySelector("h2.textStyle-secondary")?.textContent ||
      document.querySelector(".cnt-head_title h2")?.textContent,
  );
  if (artist) return artist;
  return parseLetrasUrl(window.location.href)?.artist || "";
}

function getSideAdContainer(root) {
  return root?.querySelector(".g-side-ad") || null;
}

function getFieldValue(root, selector) {
  const node = root?.querySelector(selector);
  if (!node) return "";

  const linkValue = cleanText(node.querySelector("a")?.textContent);
  if (linkValue) return linkValue;

  const fullText = cleanText(node.textContent);
  const normalizedText = fullText
    .replace(/^tom\s*:\s*/i, "")
    .replace(/^capo\s*:\s*/i, "")
    .replace(/^afinacao\s*:\s*/i, "")
    .replace(/^afinação\s*:\s*/i, "")
    .replace(/^tuning\s*:\s*/i, "")
    .trim();

  return normalizedText;
}

function buildPageContext() {
  const supportedSite = getSupportedSite(window.location.hostname);
  const compatible = Boolean(supportedSite);
  let song = "";
  let artist = "";
  let tom = "";
  let tuning = "";
  let capo = "";

  if (supportedSite?.id === "cifraclub") {
    const cifraRoot = getCifraRoot();
    const sideAd = getSideAdContainer(cifraRoot);
    song = cleanText(sideAd?.querySelector("h1")?.textContent);
    artist = cleanText(
      sideAd?.querySelector("h2 a")?.textContent ||
        sideAd?.querySelector("h2")?.textContent,
    );
    tom = getFieldValue(cifraRoot, "#cifra_tom");
    tuning = getFieldValue(cifraRoot, "#cifra_afi");
    capo = getFieldValue(cifraRoot, "#cifra_capo");
  } else if (supportedSite?.id === "ultimate_guitar") {
    song = getUltimateGuitarSong();
    artist = getUltimateGuitarArtist();
    tom = getUltimateGuitarField("key");
    tuning = getUltimateGuitarField("tuning");
    capo = getUltimateGuitarField("capo");
  } else if (supportedSite?.id === "letrasmus") {
    song = getLetrasSong();
    artist = getLetrasArtist();
    tom = "";
    tuning = "";
    capo = "";
  }

  const context = {
    compatible,
    source: supportedSite?.id || "",
    link: window.location.href,
    song: compatible ? song : "",
    artist: compatible ? artist : "",
    capo: compatible ? capo : "",
    tom: compatible ? tom : "",
    tuning: compatible ? tuning : "",
    defaults: {
      song: NOT_AVAILABLE,
      artist: NOT_AVAILABLE,
      capo: NOT_AVAILABLE,
      tom: NOT_AVAILABLE,
      tuning: NOT_AVAILABLE,
    },
  };

  debugLog("Built page context", context);
  return context;
}

extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "GET_PAGE_SONG_CONTEXT") {
    return false;
  }

  sendResponse(buildPageContext());
  return false;
});
