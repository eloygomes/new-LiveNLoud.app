const extensionApi = globalThis.browser || globalThis.chrome;

const ADMIN_DESTINATION_EMAIL = "eloy.gomes@icloud.com";
const DEFAULT_DESTINATION = "sustenido";
const DESTINATIONS = {
  sustenido: {
    label: "Sustenido",
    apiBase: "https://api.sustenido.eloygomes.com",
    database: "sustenido",
  },
  live: {
    label: "Live",
    apiBase: "https://api.live.eloygomes.com",
    database: "liveNloud_",
  },
};
const NOT_AVAILABLE = "N/A";
const PAGE_RETRY_DELAY_MS = 2000;
const PAGE_RETRY_MAX_ATTEMPTS = 6;
const IDLE_STATUSES = new Set([
  "",
  "Pronto para adicionar.",
  "Pronto para adicionar",
  "Pronto para salvar.",
]);
const STORAGE_KEYS = {
  accessToken: "livenloud_access_token",
  refreshToken: "livenloud_refresh_token",
  email: "livenloud_user_email",
  rememberSession: "livenloud_remember_session",
  destination: "livenloud_destination",
};

const SESSION_STORAGE_KEYS = [
  STORAGE_KEYS.accessToken,
  STORAGE_KEYS.refreshToken,
  STORAGE_KEYS.email,
  STORAGE_KEYS.rememberSession,
];

const emptyInstrument = {
  active: "",
  capo: "",
  lastPlay: "",
  link: "",
  progress: "",
  songCifra: "",
  songTabs: "",
  songChords: "",
  songLyrics: "",
  tuning: "",
};

const emptyPageContext = {
  compatible: false,
  source: "",
  link: "",
  song: "",
  artist: "",
  capo: "",
  tom: "",
  tuning: "",
  lyrics: "",
  cifraText: "",
  defaults: {
    song: NOT_AVAILABLE,
    artist: NOT_AVAILABLE,
    capo: NOT_AVAILABLE,
    tom: NOT_AVAILABLE,
    tuning: NOT_AVAILABLE,
  },
};

const state = {
  pageContext: { ...emptyPageContext },
  selectedInstrument: "guitar01",
  instrumentTouched: false,
  saveMode: "single",
  availableSetlists: [],
  selectedSetlists: [],
  managedInstrumentTags: [],
  detectedInstrumentLinks: {},
  selectedInstrumentLinks: {},
  destination: DEFAULT_DESTINATION,
  sessionEmail: "",
};

const elements = {
  statusCard: document.getElementById("statusCard"),
  statusText: document.getElementById("statusText"),
  destinationCard: document.getElementById("destinationCard"),
  destinationLabel: document.getElementById("destinationLabel"),
  destinationToggle: document.getElementById("destinationToggle"),
  destinationInputs: Array.from(
    document.querySelectorAll("input[name='destination']"),
  ),
  unavailableView: document.getElementById("unavailableView"),
  loginView: document.getElementById("loginView"),
  songView: document.getElementById("songView"),
  successView: document.getElementById("successView"),
  songContent: document.getElementById("songContent"),
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  rememberSessionInput: document.getElementById("rememberSessionInput"),
  userBadge: document.getElementById("userBadge"),
  compatibilityNotice: document.getElementById("compatibilityNotice"),
  copyLinkButtonProxy: document.getElementById("copyLinkButtonProxy"),
  linkValue: document.getElementById("linkValue"),
  instrumentSelect: document.getElementById("instrumentSelect"),
  instrumentLinkSuggestions: document.getElementById(
    "instrumentLinkSuggestions",
  ),
  songValue: document.getElementById("songValue"),
  artistValue: document.getElementById("artistValue"),
  capoValue: document.getElementById("capoValue"),
  tomValue: document.getElementById("tomValue"),
  tunerValue: document.getElementById("tunerValue"),
  progressInput: document.getElementById("progressInput"),
  progressValue: document.getElementById("progressValue"),
  videosInput: document.getElementById("videosInput"),
  setlistTags: document.getElementById("setlistTags"),
  saveButton: document.getElementById("saveButton"),
  discardButton: document.getElementById("discardButton"),
  logoutButton: document.getElementById("logoutButton"),
  finalMessage: document.getElementById("finalMessage"),
  saveModeInputs: Array.from(document.querySelectorAll("input[name='saveMode']")),
  instrumentLinksField: document.querySelector(".instrument-links-field"),
};

const DEBUG_PREFIX = "[#Sustenido Extension]";

function debugLog(step, details) {
  if (details === undefined) {
    console.log(`${DEBUG_PREFIX} ${step}`);
    return;
  }

  console.log(`${DEBUG_PREFIX} ${step}`, details);
}

function debugError(step, error) {
  console.error(`${DEBUG_PREFIX} ${step}`, error);
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

function isAdminDestinationUser(email) {
  return normalizeEmail(email) === ADMIN_DESTINATION_EMAIL;
}

function normalizeDestination(value) {
  return Object.prototype.hasOwnProperty.call(DESTINATIONS, value)
    ? value
    : DEFAULT_DESTINATION;
}

function getDestinationConfig(destination = state.destination) {
  return DESTINATIONS[normalizeDestination(destination)];
}

function getApiBase() {
  return getDestinationConfig().apiBase;
}

async function readStoredDestination() {
  const data = await readFromStorageArea(extensionApi.storage.local, [
    STORAGE_KEYS.destination,
  ]);
  return normalizeDestination(data[STORAGE_KEYS.destination]);
}

async function writeStoredDestination(destination) {
  await writeToStorageArea(extensionApi.storage.local, {
    [STORAGE_KEYS.destination]: normalizeDestination(destination),
  });
}

function renderDestinationControls(email = state.sessionEmail) {
  const canChooseDestination = isAdminDestinationUser(email);
  state.destination = canChooseDestination
    ? normalizeDestination(state.destination)
    : DEFAULT_DESTINATION;

  if (elements.destinationLabel) {
    elements.destinationLabel.textContent = getDestinationConfig().label;
  }

  elements.destinationInputs.forEach((input) => {
    input.checked = input.value === state.destination;
  });

  if (elements.destinationToggle) {
    elements.destinationToggle.classList.toggle("hidden", !canChooseDestination);
  }
}

async function setDestination(destination, options = {}) {
  const nextDestination = normalizeDestination(destination);
  if (nextDestination === state.destination) {
    renderDestinationControls(options.email);
    return;
  }

  state.destination = nextDestination;
  await writeStoredDestination(nextDestination);
  renderDestinationControls(options.email);

  if (options.clearSession) {
    await clearSessionState({ keepDestination: true });
    showLogin();
    setStatus("Destino alterado. Faça login novamente.");
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function normalizeLinkForApi(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "");
    return `${host}${path}`;
  } catch {
    return String(value || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

function getLayoutSongCifra(presentationLayouts) {
  if (!presentationLayouts || typeof presentationLayouts !== "object")
    return "";

  const candidates = [
    presentationLayouts.default?.songCifra,
    presentationLayouts.expanded?.songCifra,
  ];

  return candidates.find((value) => hasText(value)) || "";
}

function hasPresentationContent(instrumentData = {}) {
  return (
    ["songCifra", "songTabs", "songChords", "songLyrics"].some((field) =>
      hasText(instrumentData?.[field]),
    ) || hasText(getLayoutSongCifra(instrumentData?.presentationLayouts))
  );
}

function getPresentationSourceText(scrapedDoc = {}) {
  return (
    scrapedDoc?.songCifra ||
    scrapedDoc?.songLyrics ||
    scrapedDoc?.songChords ||
    scrapedDoc?.songTabs ||
    ""
  );
}

function getPageLyricsFallback(instrumentName, pageContext = state.pageContext) {
  return pageContext?.cifraText || pageContext?.lyrics || "";
}

function withPageLyricsFallback(scrapedDoc, instrumentName, pageContext = state.pageContext) {
  const lyrics = getPageLyricsFallback(instrumentName, pageContext);

  if (!scrapedDoc) {
    if (!hasText(lyrics)) return scrapedDoc;

    return {
      artist: cleanText(pageContext?.artist),
      song: cleanText(pageContext?.song),
      capo: cleanText(pageContext?.capo),
      tuning: cleanText(pageContext?.tuning),
      tom: cleanText(pageContext?.tom),
      link: cleanText(pageContext?.link),
      songCifra: lyrics,
      songTabs: "",
      songChords: "",
      songLyrics: lyrics,
      presentationLayouts: undefined,
    };
  }

  if (hasPresentationContent(scrapedDoc)) return scrapedDoc;
  if (!hasText(lyrics)) return scrapedDoc;

  return {
    ...scrapedDoc,
    songCifra: scrapedDoc.songCifra || lyrics,
    songLyrics: scrapedDoc.songLyrics || lyrics,
  };
}

function setStatus(message) {
  const normalized = cleanText(message);
  debugLog("STATUS", normalized);
  elements.statusText.textContent = normalized;
  elements.statusCard.classList.toggle(
    "is-idle",
    IDLE_STATUSES.has(normalized),
  );

  if (!elements.songView.classList.contains("hidden")) {
    setNotice(normalized);
  }
}

function showFinalMessage(message, type) {
  const normalized = cleanText(message);
  elements.finalMessage.textContent = normalized;
  elements.finalMessage.classList.remove("hidden", "is-success", "is-error");
  if (type) {
    elements.finalMessage.classList.add(
      type === "success" ? "is-success" : "is-error",
    );
  }
}

function hideFinalMessage() {
  elements.finalMessage.textContent = "";
  elements.finalMessage.classList.add("hidden");
  elements.finalMessage.classList.remove("is-success", "is-error");
}

function hideAllViews() {
  elements.unavailableView.classList.add("hidden");
  elements.loginView.classList.add("hidden");
  elements.songView.classList.add("hidden");
  elements.successView.classList.add("hidden");
}

function showFinalOnly(message, type) {
  hideAllViews();
  elements.statusCard.classList.add("hidden");
  elements.successView.classList.remove("hidden");
  showFinalMessage(message, type);
}

function showLogin() {
  hideAllViews();
  elements.statusCard.classList.remove("hidden");
  elements.loginView.classList.remove("hidden");
}

function showSongView() {
  hideAllViews();
  elements.statusCard.classList.remove("hidden");
  elements.songView.classList.remove("hidden");
}

function showUnavailableSite() {
  hideAllViews();
  elements.statusCard.classList.add("hidden");
  elements.unavailableView.classList.remove("hidden");
}

function setStaticValue(element, value, fallback = NOT_AVAILABLE) {
  const normalized = cleanText(value) || fallback;
  element.textContent = normalized;
  element.classList.toggle("is-placeholder", normalized === fallback);
}

function setNotice(message) {
  const normalized = cleanText(message);
  elements.compatibilityNotice.textContent = normalized;
  elements.compatibilityNotice.classList.toggle("hidden", !normalized);
  elements.compatibilityNotice.classList.remove("is-error", "is-success");
}

function setNoticeState(type) {
  elements.compatibilityNotice.classList.remove("is-error", "is-success");
  if (type === "error") {
    elements.compatibilityNotice.classList.add("is-error");
  } else if (type === "success") {
    elements.compatibilityNotice.classList.add("is-success");
  }
}

function shouldForceVoice(pageContext) {
  if (pageContext?.source === "letrasmus") return true;

  if (pageContext?.source === "cifraclub") {
    return getPathSegments(pageContext?.link).includes("letra");
  }

  return false;
}

function getHashParams(link) {
  try {
    const hash = new URL(link).hash.replace(/^#/, "");
    return new URLSearchParams(hash);
  } catch {
    return new URLSearchParams();
  }
}

function getPathSegments(link) {
  try {
    return new URL(link).pathname
      .split("/")
      .map((segment) => segment.toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getUrlFromLink(link) {
  try {
    return new URL(link);
  } catch {
    return null;
  }
}

function getCifraClubInstrumentLinkSuggestions(link) {
  const url = getUrlFromLink(link);
  if (!url) return {};

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "cifraclub.com.br" && host !== "cifralub.com.br") return {};

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return {};

  const artistSlug = segments[0];
  const songSlug = segments[1];
  const origin = `${url.protocol}//${url.hostname}`;
  const basePath = `/${artistSlug}/${songSlug}/`;
  const baseLink = `${origin}${basePath}`;

  if (segments.includes("letra")) {
    return {
      voice: `${origin}${basePath}letra/`,
    };
  }

  return {
    guitar01: baseLink,
    guitar02: baseLink,
    bass: `${origin}${basePath}tabs-baixo/`,
    keys: `${baseLink}#tabs=false&instrument=keyboard`,
    drums: `${origin}${basePath}tabs-bateria/`,
    voice: `${origin}${basePath}letra/`,
  };
}

function getInstrumentDisplayName(instrumentName) {
  const labels = {
    guitar01: "Guitar 01",
    guitar02: "Guitar 02",
    bass: "Bass",
    keys: "Keys",
    drums: "Drums",
    voice: "Voice",
  };

  return labels[instrumentName] || instrumentName;
}

function getInstrumentSetlistTag(instrumentName) {
  const tags = {
    guitar01: "guitar",
    guitar02: "guitar",
    bass: "bass",
    keys: "keys",
    drums: "drums",
    voice: "voice",
  };

  return tags[instrumentName] || cleanText(instrumentName).toLowerCase();
}

function getLetrasMusInstrumentLinkSuggestions(link) {
  const url = getUrlFromLink(link);
  if (!url) return {};

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "letras.mus.br" && host !== "letras.com") return {};

  return {
    voice: cleanText(link),
  };
}

function getUltimateGuitarInstrumentLinkSuggestions(pageContext) {
  const currentLink = cleanText(pageContext?.link);
  const currentInstrument = detectInstrumentFromLink(pageContext);
  if (!currentLink || pageContext?.source !== "ultimate_guitar") return {};

  return {
    [currentInstrument]: currentLink,
  };
}

function buildInstrumentLinkSuggestions(pageContext) {
  const link = cleanText(pageContext?.link);
  if (!link) return {};

  return {
    ...getCifraClubInstrumentLinkSuggestions(link),
    ...getLetrasMusInstrumentLinkSuggestions(link),
    ...getUltimateGuitarInstrumentLinkSuggestions(pageContext),
  };
}

function resetInstrumentLinkSuggestions() {
  state.detectedInstrumentLinks = {};
  state.selectedInstrumentLinks = {};
  renderInstrumentLinkSuggestions();
}

function setDetectedInstrumentLinks(pageContext) {
  const suggestions = buildInstrumentLinkSuggestions(pageContext);
  state.detectedInstrumentLinks = suggestions;
  state.selectedInstrumentLinks = Object.keys(suggestions).reduce(
    (accumulator, instrumentName) => ({
      ...accumulator,
      [instrumentName]: true,
    }),
    {},
  );
  syncInstrumentSetlistTags();
  renderInstrumentLinkSuggestions();
  renderSetlistTags();
}

function toggleDetectedInstrumentLink(instrumentName, checked) {
  state.selectedInstrumentLinks = {
    ...state.selectedInstrumentLinks,
    [instrumentName]: checked,
  };
  syncInstrumentSetlistTags();
  renderSetlistTags();
}

function getConfirmedInstrumentLinks() {
  if (state.saveMode !== "all") {
    const instrumentName = getSelectedInstrument();
    const detectedLink = cleanText(state.detectedInstrumentLinks[instrumentName]);
    const pageLink = cleanText(state.pageContext.link);

    return {
      [instrumentName]: detectedLink || pageLink,
    };
  }

  return Object.entries(state.detectedInstrumentLinks).reduce(
    (accumulator, [instrumentName, link]) => {
      if (state.selectedInstrumentLinks[instrumentName] && cleanText(link)) {
        accumulator[instrumentName] = cleanText(link);
      }
      return accumulator;
    },
    {},
  );
}

function getConfirmedInstrumentSetlistTags() {
  return Object.keys(getConfirmedInstrumentLinks())
    .map((instrumentName) => getInstrumentSetlistTag(instrumentName))
    .filter(Boolean);
}

function renderInstrumentLinkSuggestions() {
  if (!elements.instrumentLinkSuggestions) return;

  const showSuggestions = state.saveMode === "all";
  elements.instrumentLinksField?.classList.toggle("hidden", !showSuggestions);
  if (!showSuggestions) return;

  elements.instrumentLinkSuggestions.innerHTML = "";

  const entries = Object.entries(state.detectedInstrumentLinks).filter(
    ([, link]) => cleanText(link),
  );

  if (!entries.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "setlist-tags-empty";
    emptyState.textContent = "No instrument links detected.";
    elements.instrumentLinkSuggestions.appendChild(emptyState);
    return;
  }

  entries.forEach(([instrumentName, link]) => {
    const label = document.createElement("label");
    label.className = "instrument-link-suggestion";
    label.title = link;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(state.selectedInstrumentLinks[instrumentName]);
    checkbox.addEventListener("change", () => {
      toggleDetectedInstrumentLink(instrumentName, checkbox.checked);
    });

    const content = document.createElement("strong");
    content.textContent = getInstrumentDisplayName(instrumentName);

    const href = document.createElement("span");
    href.textContent = link;

    label.appendChild(checkbox);
    label.appendChild(document.createElement("i"));
    label.appendChild(content);
    label.appendChild(href);
    elements.instrumentLinkSuggestions.appendChild(label);
  });
}

function detectInstrumentFromLink(pageContext) {
  const link = cleanText(pageContext?.link);
  const source = cleanText(pageContext?.source);
  if (!link) return "guitar01";

  if (source === "letrasmus") {
    return "voice";
  }

  const segments = getPathSegments(link);

  if (source === "cifraclub") {
    const instrumentParam = getHashParams(link).get("instrument");
    const normalizedInstrument = cleanText(instrumentParam).toLowerCase();

    if (normalizedInstrument === "keyboard") return "keys";
    if (segments.includes("letra")) return "voice";
    if (segments.includes("tabs-bateria")) return "drums";
    if (segments.includes("tabs-baixo")) return "bass";

    return "guitar01";
  }

  if (source === "ultimate_guitar") {
    const tabSlug = segments[2] || "";

    if (/-bass-\d+$/i.test(tabSlug)) return "bass";
    if (/-drums-\d+$/i.test(tabSlug)) return "drums";
    if (/-keyboard-\d+$/i.test(tabSlug) || /-keys-\d+$/i.test(tabSlug)) {
      return "keys";
    }

    return "guitar01";
  }

  return "guitar01";
}

function syncInstrumentUi(pageContext) {
  const detectedInstrument = detectInstrumentFromLink(pageContext);
  if (!state.instrumentTouched || shouldForceVoice(pageContext)) {
    state.selectedInstrument = detectedInstrument;
  }
  elements.instrumentSelect.value = state.selectedInstrument;
  elements.instrumentSelect.disabled = false;
  syncInstrumentSetlistTags();
}

function setCompatibleLayout(isCompatible) {
  elements.songContent.classList.toggle("hidden", !isCompatible);
}

function isPageSaveable(pageContext) {
  return Boolean(
    pageContext.compatible &&
    cleanText(pageContext.link) &&
    cleanText(pageContext.song) &&
    cleanText(pageContext.artist),
  );
}

function updateSaveButton(pageContext) {
  elements.saveButton.disabled = !isPageSaveable(pageContext);
}

function getSelectedInstrument() {
  return (
    elements.instrumentSelect.value || state.selectedInstrument || "guitar01"
  );
}

function getActiveInstrumentNames() {
  if (state.saveMode !== "all") {
    return [getSelectedInstrument()];
  }

  return Object.keys(getConfirmedInstrumentLinks());
}

function syncInstrumentSetlistTags() {
  const instrumentTags = getActiveInstrumentNames()
    .map((instrumentName) => getInstrumentSetlistTag(instrumentName))
    .filter(Boolean);

  const managedTags = new Set(state.managedInstrumentTags);
  state.selectedSetlists = Array.from(
    new Set([
      ...state.selectedSetlists.filter((tag) => !managedTags.has(tag)),
      ...instrumentTags,
    ]),
  );
  state.managedInstrumentTags = Array.from(new Set(instrumentTags));
}

function setSaveMode(mode) {
  state.saveMode = mode === "all" ? "all" : "single";
  syncInstrumentSetlistTags();
  renderInstrumentLinkSuggestions();
  renderSetlistTags();
}

function getEmptyInstrumentsMap() {
  return {
    guitar01: false,
    guitar02: false,
    bass: false,
    keys: false,
    drums: false,
    voice: false,
  };
}

function getStorageArea(persistent = true) {
  if (!persistent && extensionApi.storage.session) {
    return extensionApi.storage.session;
  }

  return extensionApi.storage.local;
}

function readFromStorageArea(area, keys) {
  return new Promise((resolve) => {
    area.get(keys, resolve);
  });
}

function writeToStorageArea(area, data) {
  return new Promise((resolve) => {
    area.set(data, resolve);
  });
}

function clearFromStorageArea(area, keys) {
  return new Promise((resolve) => {
    area.remove(keys, resolve);
  });
}

function canInjectIntoTab(tab) {
  const url = cleanText(tab?.url);
  if (!tab?.id || !url) return false;

  return /^(https?|file):/i.test(url);
}

function shouldRetryWithInjection(error) {
  const message = cleanText(error?.message || error);
  return /receiving end does not exist/i.test(message);
}

async function injectPageContextScript(tabId) {
  if (!extensionApi.scripting?.executeScript) {
    throw new Error("Content script is unavailable in this browser.");
  }

  await extensionApi.scripting.executeScript({
    target: { tabId },
    files: ["page-context.js"],
  });
}

async function requestPageContext(tabId) {
  return extensionApi.tabs.sendMessage(tabId, {
    type: "GET_PAGE_SONG_CONTEXT",
  });
}

async function readSessionState() {
  const keys = SESSION_STORAGE_KEYS;
  const [sessionData, localData] = await Promise.all([
    extensionApi.storage.session
      ? readFromStorageArea(extensionApi.storage.session, keys)
      : Promise.resolve({}),
    readFromStorageArea(extensionApi.storage.local, keys),
  ]);

  const rememberSession =
    Boolean(localData[STORAGE_KEYS.rememberSession]) &&
    Boolean(localData[STORAGE_KEYS.accessToken]) &&
    Boolean(localData[STORAGE_KEYS.email]);

  const activeStorage = rememberSession ? localData : sessionData;

  return {
    accessToken: activeStorage[STORAGE_KEYS.accessToken] || "",
    refreshToken: activeStorage[STORAGE_KEYS.refreshToken] || "",
    email: activeStorage[STORAGE_KEYS.email] || "",
    rememberSession,
  };
}

async function writeSessionState({
  accessToken,
  refreshToken,
  email,
  rememberSession,
}) {
  const payload = {
    [STORAGE_KEYS.accessToken]: accessToken,
    [STORAGE_KEYS.refreshToken]: refreshToken || "",
    [STORAGE_KEYS.email]: email,
  };

  await Promise.all([
    clearFromStorageArea(
      extensionApi.storage.local,
      SESSION_STORAGE_KEYS,
    ),
    extensionApi.storage.session
      ? clearFromStorageArea(
          extensionApi.storage.session,
          SESSION_STORAGE_KEYS,
        )
      : Promise.resolve(),
  ]);

  if (rememberSession) {
    await writeToStorageArea(extensionApi.storage.local, {
      ...payload,
      [STORAGE_KEYS.rememberSession]: true,
    });
    return;
  }

  await writeToStorageArea(getStorageArea(false), payload);
}

async function clearSessionState() {
  await Promise.all([
    clearFromStorageArea(
      extensionApi.storage.local,
      SESSION_STORAGE_KEYS,
    ),
    extensionApi.storage.session
      ? clearFromStorageArea(
          extensionApi.storage.session,
          SESSION_STORAGE_KEYS,
        )
      : Promise.resolve(),
  ]);
}

async function getActiveTab() {
  const [tab] = await extensionApi.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tab || null;
}

async function getPageContext() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ...emptyPageContext };
  }

  if (!canInjectIntoTab(tab)) {
    return {
      ...emptyPageContext,
      link: cleanText(tab.url),
    };
  }

  try {
    let context;

    try {
      context = await requestPageContext(tab.id);
    } catch (error) {
      if (!shouldRetryWithInjection(error)) {
        throw error;
      }

      debugLog("Injecting page context script", {
        tabId: tab.id,
        url: tab.url,
      });
      await injectPageContextScript(tab.id);
      context = await requestPageContext(tab.id);
    }

    return {
      ...emptyPageContext,
      ...context,
      link: cleanText(context?.link) || cleanText(tab.url),
    };
  } catch (error) {
    debugError("Page context request failed", error);
    return {
      ...emptyPageContext,
      link: cleanText(tab.url),
    };
  }
}

async function loginRequest(email, password) {
  const response = await fetch(`${getApiBase()}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Login failed.");
  }

  return data;
}

function isAuthFailure(response) {
  return response.status === 401 || response.status === 403;
}

async function refreshExtensionAccessToken(session) {
  const refreshToken = cleanText(session?.refreshToken);
  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await fetch(`${getApiBase()}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.accessToken) {
    throw new Error(data?.message || "Could not refresh session.");
  }

  const nextSession = {
    ...session,
    accessToken: data.accessToken,
  };

  session.accessToken = data.accessToken;
  await writeSessionState(nextSession);
  state.sessionEmail = nextSession.email;
  renderDestinationControls(nextSession.email);

  return nextSession;
}

async function fetchWithSessionRefresh(session, url, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (retry && isAuthFailure(response)) {
    const nextSession = await refreshExtensionAccessToken(session);
    return fetchWithSessionRefresh(nextSession, url, options, false);
  }

  return response;
}

async function fetchUserDoc(sessionOrEmail, accessToken) {
  const session =
    typeof sessionOrEmail === "object"
      ? sessionOrEmail
      : { email: sessionOrEmail, accessToken };
  const response = await fetchWithSessionRefresh(
    session,
    `${getApiBase()}/api/alldata/${encodeURIComponent(session.email)}`,
  );

  if (!response.ok) {
    throw new Error("Could not load user data.");
  }

  return response.json();
}

async function fetchDistinctSetlists(session) {
  const data = await fetchUserDoc(session);
  const tags = new Set();

  if (Array.isArray(data?.userdata)) {
    data.userdata.forEach((song) => {
      (song.setlist || []).forEach((tag) => {
        const value = cleanText(tag);
        if (value) tags.add(value);
      });
    });
  }

  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function fillSetlists(setlists) {
  state.availableSetlists = Array.isArray(setlists) ? [...setlists] : [];
  renderSetlistTags();
}

function toggleSetlistTag(tag) {
  const normalizedTag = cleanText(tag);
  if (!normalizedTag) return;

  const isSelected = state.selectedSetlists.includes(normalizedTag);
  state.selectedSetlists = isSelected
    ? state.selectedSetlists.filter((item) => item !== normalizedTag)
    : [...state.selectedSetlists, normalizedTag];

  renderSetlistTags();
}

function renderSetlistTags() {
  if (!elements.setlistTags) return;

  elements.setlistTags.innerHTML = "";

  if (!state.availableSetlists.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "setlist-tags-empty";
    emptyState.textContent = "No tags available.";
    elements.setlistTags.appendChild(emptyState);
    return;
  }

  state.availableSetlists.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `setlist-tag${
      state.selectedSetlists.includes(tag) ? " is-active" : ""
    }`;
    button.textContent = tag;
    button.addEventListener("click", () => toggleSetlistTag(tag));
    elements.setlistTags.appendChild(button);
  });
}

function renderPageContext(pageContext) {
  state.pageContext = {
    ...emptyPageContext,
    ...pageContext,
  };
  syncInstrumentUi(state.pageContext);

  const defaults = state.pageContext.defaults || emptyPageContext.defaults;

  setStaticValue(elements.linkValue, state.pageContext.link, NOT_AVAILABLE);
  setStaticValue(elements.songValue, state.pageContext.song, defaults.song);
  setStaticValue(
    elements.artistValue,
    state.pageContext.artist,
    defaults.artist,
  );
  setStaticValue(elements.capoValue, state.pageContext.capo, defaults.capo);
  setStaticValue(elements.tomValue, state.pageContext.tom, defaults.tom);
  setStaticValue(
    elements.tunerValue,
    state.pageContext.tuning,
    defaults.tuning,
  );

  if (!state.pageContext.compatible) {
    setCompatibleLayout(false);
    setNotice("Extensão não disponivel para esse site");
    setNoticeState("error");
    setStatus("");
  } else if (!isPageSaveable(state.pageContext)) {
    setCompatibleLayout(true);
    setNotice("Buscando informações da página...");
    setStatus("");
  } else {
    setCompatibleLayout(true);
    setNotice("");
    setStatus("");
  }

  if (state.pageContext.compatible) {
    setDetectedInstrumentLinks(state.pageContext);
  } else {
    resetInstrumentLinkSuggestions();
  }

  updateSaveButton(state.pageContext);
}

function getProgressValue() {
  return Number.parseInt(elements.progressInput.value, 10) || 0;
}

function renderProgressValue() {
  elements.progressValue.textContent = `${getProgressValue()}%`;
}

function hasRequiredMetadata(pageContext) {
  return Boolean(cleanText(pageContext.song) && cleanText(pageContext.artist));
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForPageMetadata() {
  let latestContext = { ...state.pageContext };

  if (!latestContext.compatible) {
    return latestContext;
  }

  for (let attempt = 0; attempt < PAGE_RETRY_MAX_ATTEMPTS; attempt += 1) {
    latestContext = await getPageContext();
    renderPageContext(latestContext);

    if (hasRequiredMetadata(latestContext)) {
      return latestContext;
    }

    if (attempt < PAGE_RETRY_MAX_ATTEMPTS - 1) {
      setStatus("Aguardando dados da cifra...");
      await sleep(PAGE_RETRY_DELAY_MS);
    }
  }

  return latestContext;
}

function parseVideoLinks(raw) {
  return Array.from(
    new Set(
      String(raw || "")
        .split(/[\s,\n]+/)
        .map((value) => value.trim())
        .filter((value) => /^https?:\/\//i.test(value)),
    ),
  );
}

function normalizeScrapeDoc(scraped, instrumentName = getSelectedInstrument()) {
  if (!scraped) return null;

  const pythonSongData = scraped?.songData || scraped?.python?.songData || null;
  if (pythonSongData?.artist_name && pythonSongData?.song_title) {
    return {
      artist: cleanText(pythonSongData.artist_name),
      song: cleanText(pythonSongData.song_title),
      capo: cleanText(pythonSongData.capo),
      tuning: cleanText(pythonSongData.tuning),
      tom: cleanText(pythonSongData.tom || pythonSongData.key),
      link: cleanText(pythonSongData.source_url),
      songCifra: pythonSongData.song_cifra || pythonSongData.songLyrics || "",
      songTabs: pythonSongData.songTabs || "",
      songChords: pythonSongData.songChords || "",
      songLyrics: pythonSongData.songLyrics || "",
      presentationLayouts: pythonSongData.presentationLayouts,
    };
  }

  const candidates = [
    scraped?.document,
    scraped?.data,
    scraped?.result,
    scraped?.music,
    scraped?.payload,
    scraped?.item,
    scraped,
  ].filter(Boolean);

  let doc =
    candidates.find((candidate) => candidate?.artist && candidate?.song) ||
    null;
  if (!doc) {
    const nested = candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        Object.values(candidate).some((value) => value?.artist && value?.song),
    );

    if (nested) {
      doc =
        Object.values(nested).find((value) => value?.artist && value?.song) ||
        null;
    }
  }

  if (!doc) return null;

  const instrumentDoc = doc?.[instrumentName] || {};

  const songLyrics = instrumentDoc.songLyrics || doc.songLyrics || "";
  const songCifra = instrumentDoc.songCifra || doc.songCifra || songLyrics || "";

  return {
    artist: cleanText(doc.artist),
    song: cleanText(doc.song),
    capo: cleanText(instrumentDoc.capo || doc.capo),
    tuning: cleanText(instrumentDoc.tuning || doc.tuning),
    tom: cleanText(doc.tom || doc.tone || doc.key),
    link: cleanText(instrumentDoc.link || doc.link),
    songCifra,
    songTabs: instrumentDoc.songTabs || doc.songTabs || "",
    songChords: instrumentDoc.songChords || doc.songChords || "",
    songLyrics,
    presentationLayouts:
      instrumentDoc.presentationLayouts || doc.presentationLayouts,
  };
}

function buildInitialPresentationLayouts(songCifra = "") {
  return {
    default: {
      songCifra,
      fontSizeStep: 0,
      twoColumns: false,
      showProgressionMarkers: false,
      progressionMarkOverrides: {},
    },
    expanded: {
      songCifra,
      fontSizeStep: 0,
      twoColumns: true,
      showProgressionMarkers: false,
      progressionMarkOverrides: {},
    },
  };
}

async function scrapeSong(session, pageContext, options = {}) {
  const progress = getProgressValue();
  const instrumentName = options.instrumentName || getSelectedInstrument();
  const link = cleanText(options.link || pageContext.link);
  const response = await fetchWithSessionRefresh(
    session,
    `${getApiBase()}/api/scrape`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artist: cleanText(pageContext.artist),
        song: cleanText(pageContext.song),
        email: session.email,
        instrument: instrumentName,
        instrument_progressbar: progress,
        link,
        linkNorm: normalizeLinkForApi(link),
      }),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.details || data?.message || "Could not scrape song data.",
    );
  }

  return normalizeScrapeDoc(data, instrumentName);
}

async function fetchExistingSongDoc(session, pageContext, options = {}) {
  const instrumentName = options.instrumentName || getSelectedInstrument();
  const link = cleanText(options.link || pageContext.link);
  const params = new URLSearchParams({
    instrument: instrumentName,
    link,
    artist: cleanText(pageContext.artist),
    song: cleanText(pageContext.song),
  });
  const response = await fetchWithSessionRefresh(
    session,
    `${getApiBase()}/api/generalCifra?${params}`,
  );

  if (response.status === 404) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Could not load existing song data.");
  }

  return normalizeScrapeDoc({ document: data }, instrumentName);
}

async function collectScrapedDocsForConfirmedInstruments(session, pageContext) {
  const confirmedInstrumentLinks = getConfirmedInstrumentLinks();
  const entries = Object.entries(confirmedInstrumentLinks);
  const scrapedDocsByInstrument = {};

  for (const [instrumentName, link] of entries) {
    setNotice(
      `Buscando dados de ${getInstrumentDisplayName(instrumentName)}...`,
    );

    let scrapedDoc = null;
    try {
      scrapedDoc = await fetchExistingSongDoc(session, pageContext, {
        instrumentName,
        link,
      });
    } catch (lookupError) {
      debugError(
        `Existing song lookup failed for ${instrumentName}`,
        lookupError,
      );
    }

    if (!scrapedDoc) {
      try {
        scrapedDoc = await scrapeSong(session, pageContext, {
          instrumentName,
          link,
        });
      } catch (scrapeError) {
        debugError(`Scrape failed for ${instrumentName}`, scrapeError);
        scrapedDoc = null;
      }
    }

    const docWithFallback = withPageLyricsFallback(
      scrapedDoc,
      instrumentName,
      pageContext,
    );

    if (docWithFallback) {
      scrapedDocsByInstrument[instrumentName] = {
        ...docWithFallback,
        link: cleanText(docWithFallback.link) || link,
      };
    }
  }

  return scrapedDocsByInstrument;
}

function buildSongPayload(
  email,
  scrapedDoc = null,
  scrapedDocsByInstrument = {},
) {
  const pageContext = state.pageContext;
  const instrumentName = getSelectedInstrument();
  const confirmedInstrumentLinks = getConfirmedInstrumentLinks();
  const confirmedInstrumentSetlistTags = getConfirmedInstrumentSetlistTags();
  const mergedSong = cleanText(scrapedDoc?.song || pageContext.song);
  const mergedArtist = cleanText(scrapedDoc?.artist || pageContext.artist);
  const mergedLink = cleanText(scrapedDoc?.link || pageContext.link);
  const mergedCapo = cleanText(scrapedDoc?.capo || pageContext.capo);
  const mergedTom = cleanText(scrapedDoc?.tom || pageContext.tom);
  const mergedTuning = cleanText(scrapedDoc?.tuning || pageContext.tuning);
  const embedVideos = parseVideoLinks(elements.videosInput.value);
  const progress = getProgressValue();
  const isAllInstrumentsMode = state.saveMode === "all";
  const today = new Date().toISOString().split("T")[0];
  const selectedInstrumentScrapedDoc =
    withPageLyricsFallback(
      scrapedDocsByInstrument[instrumentName] || scrapedDoc || null,
      instrumentName,
      pageContext,
    );
  const layoutSongCifra = getPresentationSourceText(selectedInstrumentScrapedDoc);
  const selectedInstrumentPayload = {
    active: true,
    capo: mergedCapo,
    lastPlay: "",
    link: mergedLink,
    progress: isAllInstrumentsMode ? 0 : progress,
    songCifra: selectedInstrumentScrapedDoc?.songCifra || "",
    songTabs: selectedInstrumentScrapedDoc?.songTabs || "",
    songChords: selectedInstrumentScrapedDoc?.songChords || "",
    songLyrics: selectedInstrumentScrapedDoc?.songLyrics || "",
    presentationLayouts:
      selectedInstrumentScrapedDoc?.presentationLayouts ||
      (layoutSongCifra.trim()
        ? buildInitialPresentationLayouts(layoutSongCifra)
        : undefined),
    tuning: mergedTuning,
  };

  if (!hasPresentationContent(selectedInstrumentPayload)) {
    throw new Error(
      `${getInstrumentDisplayName(instrumentName)} não carregou conteúdo de apresentação ainda. Aguarde a importação da cifra antes de salvar.`,
    );
  }

  const instruments = getEmptyInstrumentsMap();
  const instrumentBlocks = {
    guitar01: { ...emptyInstrument },
    guitar02: { ...emptyInstrument },
    bass: { ...emptyInstrument },
    keys: { ...emptyInstrument },
    drums: { ...emptyInstrument },
    voice: { ...emptyInstrument },
  };

  Object.entries(confirmedInstrumentLinks).forEach(
    ([linkedInstrument, link]) => {
      instruments[linkedInstrument] = true;
      const linkedScrapedDoc =
        withPageLyricsFallback(
          scrapedDocsByInstrument[linkedInstrument] || null,
          linkedInstrument,
          pageContext,
        );
      const linkedSongCifra = getPresentationSourceText(linkedScrapedDoc);

      instrumentBlocks[linkedInstrument] = {
        ...emptyInstrument,
        active: true,
        capo: cleanText(linkedScrapedDoc?.capo || mergedCapo),
        lastPlay: "",
        link: cleanText(linkedScrapedDoc?.link || link),
        progress: isAllInstrumentsMode
          ? 0
          : linkedInstrument === instrumentName
            ? progress
            : 0,
        songCifra: linkedScrapedDoc?.songCifra || "",
        songTabs: linkedScrapedDoc?.songTabs || "",
        songChords: linkedScrapedDoc?.songChords || "",
        songLyrics: linkedScrapedDoc?.songLyrics || "",
        presentationLayouts:
          linkedScrapedDoc?.presentationLayouts ||
          (linkedSongCifra.trim()
            ? buildInitialPresentationLayouts(linkedSongCifra)
            : undefined),
        tuning: cleanText(linkedScrapedDoc?.tuning || mergedTuning),
      };
    },
  );

  instruments[instrumentName] = true;
  instrumentBlocks[instrumentName] = {
    ...selectedInstrumentPayload,
    link:
      confirmedInstrumentLinks[instrumentName] ||
      selectedInstrumentPayload.link,
  };

  return {
    databaseComing: getDestinationConfig().database,
    collectionComing: "data",
    userdata: {
      song: mergedSong,
      artist: mergedArtist,
      capo: mergedCapo,
      tom: mergedTom,
      tuning: mergedTuning,
      instrumentName,
      progressBar: isAllInstrumentsMode ? progress : 0,
      instruments,
      guitar01: instrumentBlocks.guitar01,
      guitar02: instrumentBlocks.guitar02,
      bass: instrumentBlocks.bass,
      keys: instrumentBlocks.keys,
      drums: instrumentBlocks.drums,
      voice: instrumentBlocks.voice,
      embedVideos,
      setlist: Array.from(
        new Set([...state.selectedSetlists, ...confirmedInstrumentSetlistTags]),
      ),
      addedIn: today,
      updateIn: today,
      email,
    },
  };
}

async function saveSong(payload, session) {
  const response = await fetchWithSessionRefresh(
    session,
    `${getApiBase()}/api/newsong`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Could not save song.");
  }

  return data;
}

async function ensureSession() {
  const storage = await readSessionState();
  const accessToken = storage.accessToken;
  const email = storage.email;
  state.sessionEmail = email;
  renderDestinationControls(email);

  if (!accessToken || !email) {
    showLogin();
    setStatus("Login necessário.");
    return null;
  }

  try {
    await fetchUserDoc(storage);
    return storage;
  } catch (error) {
    debugError("Session validation failed", error);
    await clearSessionState();
    showLogin();
    setStatus("Sessão expirada. Faça login novamente.");
    return null;
  }
}

async function loadSongView(session) {
  setStatus("Carregando página...");
  hideFinalMessage();
  state.sessionEmail = session.email;
  renderDestinationControls(session.email);
  state.selectedSetlists = [];
  state.managedInstrumentTags = [];
  state.instrumentTouched = false;
  state.saveMode = "single";
  elements.saveModeInputs.forEach((input) => {
    input.checked = input.value === state.saveMode;
  });
  resetInstrumentLinkSuggestions();

  const [pageData, setlists] = await Promise.all([
    getPageContext(),
    fetchDistinctSetlists(session),
  ]);

  if (!pageData.compatible) {
    showUnavailableSite();
    return;
  }

  fillSetlists(setlists);
  renderProgressValue();
  showSongView();
  renderPageContext(pageData);
  state.selectedInstrument = shouldForceVoice(pageData)
    ? "voice"
    : getSelectedInstrument();
  syncInstrumentUi(pageData);
  elements.userBadge.textContent = session.email;

  if (pageData.compatible && !hasRequiredMetadata(pageData)) {
    await waitForPageMetadata();
  }
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFinalMessage();
  setStatus("Entrando...");

  try {
    const email = cleanText(elements.emailInput.value);
    const password = elements.passwordInput.value;
    const rememberSession = Boolean(elements.rememberSessionInput.checked);
    state.sessionEmail = email;

    if (!isAdminDestinationUser(email)) {
      state.destination = DEFAULT_DESTINATION;
      await writeStoredDestination(DEFAULT_DESTINATION);
    }

    renderDestinationControls(email);
    const loginData = await loginRequest(email, password);

    await writeSessionState({
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken || "",
      email,
      rememberSession,
    });

    await loadSongView({
      accessToken: loginData.accessToken,
      email,
    });
  } catch (error) {
    debugError("Login flow failed", error);
    setStatus(error.message || "Login failed.");
  }
});

elements.emailInput.addEventListener("input", () => {
  renderDestinationControls(elements.emailInput.value);
});

elements.destinationInputs.forEach((input) => {
  input.addEventListener("change", async () => {
    if (!input.checked) return;

    await setDestination(input.value, {
      email: state.sessionEmail || elements.emailInput.value,
      clearSession: true,
    });
  });
});

elements.progressInput.addEventListener("input", () => {
  renderProgressValue();
});

elements.instrumentSelect.addEventListener("change", () => {
  if (shouldForceVoice(state.pageContext)) {
    elements.instrumentSelect.value = "voice";
    state.selectedInstrument = "voice";
    state.instrumentTouched = false;
    syncInstrumentSetlistTags();
    renderSetlistTags();
    return;
  }
  state.selectedInstrument = getSelectedInstrument();
  state.instrumentTouched = true;
  syncInstrumentSetlistTags();
  renderSetlistTags();
});

elements.saveModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) {
      setSaveMode(input.value);
    }
  });
});

async function copySourceLink() {
  const link = cleanText(state.pageContext.link);
  if (!link) return;

  try {
    await navigator.clipboard.writeText(link);
    setNotice("Link copiado.");
    setNoticeState("success");
  } catch (error) {
    debugError("Copy link failed", error);
    setNotice("Nao foi possivel copiar o link.");
    setNoticeState("error");
  }
}

if (elements.copyLinkButtonProxy) {
  elements.copyLinkButtonProxy.addEventListener("click", copySourceLink);
}

elements.saveButton.addEventListener("click", async () => {
  hideFinalMessage();
  const session = await ensureSession();
  if (!session) return;

  const freshPageContext = await waitForPageMetadata();

  if (!freshPageContext.compatible) {
    showUnavailableSite();
    return;
  }

  if (!isPageSaveable(freshPageContext)) {
    const errorMessage =
      "Não foi possivel adicionar a cifra no momento, tente mais tarde";
    setNotice(errorMessage);
    setNoticeState("error");
    showFinalMessage(errorMessage, "error");
    return;
  }

  setNotice("Buscando dados da cifra...");

  try {
    const scrapedDocsByInstrument =
      await collectScrapedDocsForConfirmedInstruments(
        session,
        freshPageContext,
      );
    const scrapedDoc =
      scrapedDocsByInstrument[getSelectedInstrument()] ||
      Object.values(scrapedDocsByInstrument)[0] ||
      null;
    const payload = buildSongPayload(
      session.email,
      scrapedDoc,
      scrapedDocsByInstrument,
    );
    setNotice("Salvando cifra...");
    await saveSong(payload, session);
    const successMessage = "Cifra adicionada com sucesso";
    setNotice(successMessage);
    setNoticeState("success");
    showFinalOnly(successMessage, "success");
    window.setTimeout(() => {
      window.close();
    }, 5000);
  } catch (error) {
    debugError("Save song failed", error);
    const errorMessage =
      error?.message ||
      "Não foi possivel adicionar a cifra no momento, tente mais tarde";
    setNotice(errorMessage);
    setNoticeState("error");
    showFinalOnly(errorMessage, "error");
    window.setTimeout(() => {
      window.close();
    }, 5000);
  }
});

elements.discardButton.addEventListener("click", () => {
  const discardMessage = "Janela fechando...";
  setNotice(discardMessage);
  setNoticeState("success");
  showFinalMessage(discardMessage, "success");
  window.setTimeout(() => {
    window.close();
  }, 5000);
});

elements.logoutButton.addEventListener("click", async () => {
  await clearSessionState();
  showLogin();
  setStatus("Sessão encerrada.");
});

async function boot() {
  setStatus("");
  state.destination = await readStoredDestination();
  const storedSession = await readSessionState();
  state.sessionEmail = storedSession.email;
  renderDestinationControls(storedSession.email || elements.emailInput.value);
  const initialPageContext = await getPageContext();
  if (!initialPageContext.compatible) {
    showUnavailableSite();
    return;
  }

  renderPageContext(initialPageContext);
  elements.rememberSessionInput.checked = storedSession.rememberSession;
  state.selectedInstrument = getSelectedInstrument();
  renderProgressValue();
  hideFinalMessage();
  const session = await ensureSession();
  if (!session) return;
  await loadSongView(session);
}

boot();
