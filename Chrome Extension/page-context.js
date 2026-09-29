const extensionApi = globalThis.browser || globalThis.chrome;

const DEBUG_PREFIX = "[#Sustenido Extension]";
const EXTENSION_READY_EVENT = "livenloud:quick-add-extension-ready";

window.__LIVENLOUD_QUICK_ADD_EXTENSION__ = {
  installed: true,
  name: "#Sustenido Quick Add",
};

window.dispatchEvent(
  new CustomEvent(EXTENSION_READY_EVENT, {
    detail: window.__LIVENLOUD_QUICK_ADD_EXTENSION__,
  }),
);
const NOT_AVAILABLE = "N/A";
const SUPPORTED_HOSTS = [
  {
    id: "cifraclub",
    pattern: /(^|\.)(cifraclub|cifralub)\.com\.br$/i,
  },
  {
    id: "ultimate_guitar",
    pattern: /(^|\.)(ultimate-guitar|ultimateguitar)\.com$/i,
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

function cleanMultilineText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
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
      song: /^\d+$/.test(segments[1]) ? "" : slugToTitle(segments[1]),
    };
  } catch (_error) {
    return null;
  }
}

function getMetaContent(selector) {
  return cleanText(document.querySelector(selector)?.content);
}

function parseCifraClubUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;

    return {
      artist: slugToTitle(segments[0]),
      song: slugToTitle(segments[1]),
    };
  } catch (_error) {
    return null;
  }
}

function getCifraClubTitleParts() {
  const ogTitle = getMetaContent('meta[property="og:title"]');
  const title = ogTitle || cleanText(document.title);
  const match = title.match(/^(.+?)\s+-\s+(.+?)\s+-\s+Cifra Club$/i);

  if (match) {
    return {
      song: cleanText(match[1]),
      artist: cleanText(match[2]),
    };
  }

  return parseCifraClubUrl(window.location.href) || {};
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

function normalizeUltimateGuitarContent(value) {
  const rawContent = String(value || "");
  if (!rawContent.trim()) return "";

  const sectionNames = {
    verse: "Verse",
    chorus: "Chorus",
    bridge: "Bridge",
    intro: "Intro",
    outro: "Outro",
    "pre-chorus": "Pre-Chorus",
    prechorus: "Pre-Chorus",
    solo: "Solo",
    coda: "Coda",
    interlude: "Interlude",
    refrain: "Refrain",
    prelude: "Prelude",
    break: "Break",
    instrumental: "Instrumental",
  };

  // UG sometimes stores a slash chord as two adjacent tags. Recombine it
  // before removing wrappers so Dmaj7/F# can never become two independent
  // fragments. Parenthesized qualities immediately after a tag belong to the
  // same chord for the same reason.
  let structuredContent = rawContent;
  let previousContent = "";
  while (previousContent !== structuredContent) {
    previousContent = structuredContent;
    structuredContent = structuredContent.replace(
      /\[ch\](.*?)\[\/ch\]\s*\/\s*\[ch\](.*?)\[\/ch\]/gi,
      (_match, chord, bass) => `[ch]${chord.trim()}/${bass.trim()}[/ch]`,
    );
  }
  structuredContent = structuredContent
    .replace(
      /\[ch\](.*?)\[\/ch\]\s*\/\s*([A-G](?:#|b)?)(?=\s|$)/gi,
      (_match, chord, bass) => `[ch]${chord.trim()}/${bass.trim()}[/ch]`,
    )
    .replace(
      /\[ch\](.*?)\[\/ch\](\((?:(?:add|maj|min|sus|dim|aug|omit|no|m|M)?[0-9+#bº°-]+)\))/gi,
      (_match, chord, quality) => `[ch]${chord.trim()}${quality}[/ch]`,
    );

  const sourceChords = Array.from(
    structuredContent.matchAll(/\[ch\](.*?)\[\/ch\]/gi),
    (match) => match[1].trim(),
  ).filter(Boolean);

  // Section wrappers carry musical meaning and become visible labels. Chord
  // and tab wrappers are removed without recalculating positions or spaces.
  const contentWithSections = structuredContent
    .replace(
      /\[(verse|chorus|bridge|intro|outro|pre-chorus|prechorus|solo|coda|interlude|refrain|prelude|break|instrumental)(?:=[^\]]*)?\]/gi,
      (_match, section) => `\n[${sectionNames[section.toLowerCase()] || section}]\n`,
    )
    .replace(
      /\[\/(?:verse|chorus|bridge|intro|outro|pre-chorus|prechorus|solo|coda|interlude|refrain|prelude|break|instrumental)\]/gi,
      "\n",
    )
    .replace(/\[\/?(?:tab|ch)(?:=[^\]]*)?\]/gi, "");

  // A textarea decodes entities such as &#039; without interpreting the tab as
  // a visual DOM tree. Reading rendered UG spans is forbidden because it loses
  // the separators between adjacent chord tokens.
  const decoder = document.createElement("textarea");
  decoder.innerHTML = contentWithSections
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:div|p|pre)>/gi, "\n");
  const normalizedContent = cleanMultilineText(decoder.value).trim();

  // Fail closed if even one structured chord is no longer present in the same
  // order. The API scraper can still provide the content; corrupted DOM text
  // must never override it.
  let cursor = 0;
  const preservesEveryChord = sourceChords.every((chord) => {
    const index = normalizedContent.indexOf(chord, cursor);
    if (index < 0) return false;
    cursor = index + chord.length;
    return true;
  });

  return preservesEveryChord ? normalizedContent : "";
}

function getUltimateGuitarStoreSnapshot() {
  const stores = document.querySelectorAll(
    ".js-store[data-content], [data-content*='wiki_tab']",
  );

  for (const store of stores) {
    try {
      const data = JSON.parse(store.getAttribute("data-content") || "");
      const content =
        data?.store?.page?.data?.tab_view?.wiki_tab?.content ||
        data?.page?.data?.tab_view?.wiki_tab?.content ||
        data?.data?.tab_view?.wiki_tab?.content ||
        data?.tab_view?.wiki_tab?.content ||
        data?.wiki_tab?.content;
      const rawContent = String(content || "");
      const normalizedContent = normalizeUltimateGuitarContent(rawContent);
      if (normalizedContent) {
        return { rawContent, normalizedContent };
      }
    } catch (_error) {
      // Some unrelated data-content attributes are not JSON.
    }
  }

  return { rawContent: "", normalizedContent: "" };
}

function getUltimateGuitarCifraText() {
  // Only the structured wiki_tab payload is authoritative. The visual DOM
  // places chord pieces in separate spans and textContent can turn Amaj7 into
  // Aa or Dmaj7/F# into DF#j7. Returning empty lets the backend API take over.
  return getUltimateGuitarStoreSnapshot().normalizedContent;
}

function getLetrasSong() {
  const title = cleanText(
    document.querySelector("#js-lyricHeader .title-primary h1")?.textContent ||
      document.querySelector("h1.textStyle-primary")?.textContent ||
      document.querySelector(".cnt-head_title h1")?.textContent ||
      document.querySelector("h1")?.textContent,
  );
  return title || parseLetrasUrl(window.location.href)?.song || "";
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

function extractParagraphText(container) {
  if (!container) return "";

  const paragraphs = Array.from(container.querySelectorAll("p"))
    .map((paragraph) => cleanMultilineText(paragraph.innerText || paragraph.textContent))
    .filter(Boolean);

  if (paragraphs.length) {
    return cleanMultilineText(paragraphs.join("\n\n"));
  }

  return cleanMultilineText(container.innerText || container.textContent);
}

function extractCifraText(container) {
  if (!container) return "";

  const clone = container.cloneNode(true);
  clone.querySelectorAll("br").forEach((br) => {
    br.replaceWith("\n");
  });

  const parts = [];
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    parts.push(walker.currentNode.nodeValue || "");
  }

  return cleanMultilineText(parts.join(""));
}

function getCifraClubLyrics(root) {
  const lyricsContainer =
    root?.querySelector(".songContent .letra .letra-l") ||
    root?.querySelector(".songContent .letra") ||
    root?.querySelector(".songContent");

  return extractParagraphText(lyricsContainer);
}

function getCifraClubCifraText(root) {
  const candidates = [
    root?.querySelector(".cifra_cnt"),
    document.querySelector("#song-sheet-root"),
    document.querySelector('[data-main] pre'),
    document.querySelector("main#chordPage pre"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const text = extractCifraText(candidate);
    if (text.length >= 40) return text;
  }

  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCifraClubHtmlSnapshot(root) {
  const contentRoot =
    document.querySelector("main#chordPage") ||
    root ||
    document.querySelector("#song-sheet-root");
  if (!contentRoot) return "";

  // Send only the musical page subtree plus stable metadata. This avoids
  // shipping ads, scripts, cookies or the complete browser document while
  // letting the backend reuse its canonical provider parser.
  const title = document.title || "";
  const ogTitle = getMetaContent('meta[property="og:title"]');
  const snapshot = [
    "<!doctype html><html><head>",
    `<title>${escapeHtml(title)}</title>`,
    ogTitle
      ? `<meta property="og:title" content="${escapeHtml(ogTitle)}">`
      : "",
    "</head><body>",
    contentRoot.outerHTML,
    "</body></html>",
  ].join("");

  return snapshot.length <= 1_900_000 ? snapshot : "";
}

function getCifraClubGuitarProFiles() {
  const links = Array.from(
    document.querySelectorAll(
      '.versions[data-v="guitarpro"] a[download], a[href*="gp_partitura_download.php"]',
    ),
  );
  const seenUrls = new Set();

  return links.reduce((files, link, index) => {
    const href = link.getAttribute("href");
    if (!href) return files;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (_error) {
      return files;
    }

    if (seenUrls.has(url.href)) return files;
    seenUrls.add(url.href);

    const fileName = cleanText(url.searchParams.get("arq")) ||
      cleanText(url.pathname.split("/").pop());
    const versionName = cleanText(
      link.querySelector(":scope > span:first-child")?.textContent,
    );
    const extension = fileName.includes(".")
      ? fileName.split(".").pop().toLowerCase()
      : "";

    files.push({
      url: url.href,
      fileName,
      extension,
      versionName: versionName || `Versão ${index + 1}`,
    });
    return files;
  }, []);
}

function buildPageContext() {
  const supportedSite = getSupportedSite(window.location.hostname);
  const compatible = Boolean(supportedSite);
  let song = "";
  let artist = "";
  let tom = "";
  let tuning = "";
  let capo = "";
  let lyrics = "";
  let cifraText = "";
  let cifraRawContent = "";
  let cifraTextSource = "";
  let guitarProFiles = [];

  if (supportedSite?.id === "cifraclub") {
    const cifraRoot = getCifraRoot();
    const titleParts = getCifraClubTitleParts();
    const sideAd = getSideAdContainer(cifraRoot);
    song =
      cleanText(sideAd?.querySelector("h1")?.textContent) ||
      titleParts.song ||
      "";
    artist = cleanText(
      sideAd?.querySelector("h2 a")?.textContent ||
        sideAd?.querySelector("h2")?.textContent,
    ) || titleParts.artist || "";
    tom = getFieldValue(cifraRoot, "#cifra_tom");
    tuning = getFieldValue(cifraRoot, "#cifra_afi");
    capo = getFieldValue(cifraRoot, "#cifra_capo");
    lyrics = getCifraClubLyrics(cifraRoot);
    cifraText = getCifraClubCifraText(cifraRoot);
    cifraRawContent = cifraText ? getCifraClubHtmlSnapshot(cifraRoot) : "";
    cifraTextSource = cifraRawContent ? "cifraclub_html" : "";
    guitarProFiles = getCifraClubGuitarProFiles();
  } else if (supportedSite?.id === "ultimate_guitar") {
    song = getUltimateGuitarSong();
    artist = getUltimateGuitarArtist();
    tom = getUltimateGuitarField("key");
    tuning = getUltimateGuitarField("tuning");
    capo = getUltimateGuitarField("capo");
    const storeSnapshot = getUltimateGuitarStoreSnapshot();
    cifraText = storeSnapshot.normalizedContent;
    cifraRawContent = storeSnapshot.rawContent;
    cifraTextSource = cifraText ? "ultimate_guitar_store" : "";
  } else if (supportedSite?.id === "letrasmus") {
    song = getLetrasSong();
    artist = getLetrasArtist();
    tom = "";
    tuning = "";
    capo = "";
    lyrics = "";
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
    lyrics: compatible ? lyrics : "",
    cifraText: compatible ? cifraText : "",
    cifraRawContent: compatible ? cifraRawContent : "",
    cifraTextSource: compatible ? cifraTextSource : "",
    guitarProFiles: compatible ? guitarProFiles : [],
    defaults: {
      song: NOT_AVAILABLE,
      artist: NOT_AVAILABLE,
      capo: NOT_AVAILABLE,
      tom: NOT_AVAILABLE,
      tuning: NOT_AVAILABLE,
    },
  };

  debugLog("Built page context", {
    ...context,
    cifraText: context.cifraText
      ? `[content: ${context.cifraText.length} chars]`
      : "",
    cifraRawContent: context.cifraRawContent
      ? `[snapshot: ${context.cifraRawContent.length} chars]`
      : "",
  });
  return context;
}

extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SUSTENIDO_SONGS_UPDATED") {
    window.dispatchEvent(
      new CustomEvent("sustenido:songs-updated", {
        detail: message.detail || {},
      }),
    );
    sendResponse({ received: true });
    return false;
  }

  if (message?.type !== "GET_PAGE_SONG_CONTEXT") {
    return false;
  }

  sendResponse(buildPageContext());
  return false;
});
