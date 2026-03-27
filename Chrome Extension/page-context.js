const extensionApi = globalThis.browser || globalThis.chrome;

const DEBUG_PREFIX = "[LiveNLoud Extension]";
const NOT_AVAILABLE = "The information is not avabiable";
const SUPPORTED_HOSTS = [
  {
    id: "cifraclub",
    pattern: /(^|\.)cifraclub\.com\.br$/i,
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
  const cifraRoot = getCifraRoot();
  const sideAd = getSideAdContainer(cifraRoot);
  const song = cleanText(sideAd?.querySelector("h1")?.textContent);
  const artist = cleanText(
    sideAd?.querySelector("h2 a")?.textContent ||
      sideAd?.querySelector("h2")?.textContent,
  );
  const tom = getFieldValue(cifraRoot, "#cifra_tom");
  const tuning = getFieldValue(cifraRoot, "#cifra_afi");
  const capo = getFieldValue(cifraRoot, "#cifra_capo");

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
