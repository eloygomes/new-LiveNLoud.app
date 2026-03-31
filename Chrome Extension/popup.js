const extensionApi = globalThis.browser || globalThis.chrome;

const API_BASE = "https://api.live.eloygomes.com";
const NOT_AVAILABLE = "The information is not avabiable";
const PAGE_RETRY_DELAY_MS = 2000;
const PAGE_RETRY_MAX_ATTEMPTS = 6;
const IDLE_STATUSES = new Set(["", "Pronto para adicionar.", "Pronto para adicionar", "Pronto para salvar."]);
const STORAGE_KEYS = {
  accessToken: "livenloud_access_token",
  refreshToken: "livenloud_refresh_token",
  email: "livenloud_user_email",
  rememberSession: "livenloud_remember_session",
};

const emptyInstrument = {
  active: "",
  capo: "",
  lastPlay: "",
  link: "",
  progress: "",
  songCifra: "",
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
};

const elements = {
  hero: document.querySelector(".hero"),
  statusCard: document.getElementById("statusCard"),
  statusText: document.getElementById("statusText"),
  loginView: document.getElementById("loginView"),
  songView: document.getElementById("songView"),
  songContent: document.getElementById("songContent"),
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  rememberSessionInput: document.getElementById("rememberSessionInput"),
  userBadge: document.getElementById("userBadge"),
  compatibilityNotice: document.getElementById("compatibilityNotice"),
  copyLinkButton: document.getElementById("copyLinkButton"),
  linkValue: document.getElementById("linkValue"),
  instrumentSelect: document.getElementById("instrumentSelect"),
  songValue: document.getElementById("songValue"),
  artistValue: document.getElementById("artistValue"),
  capoValue: document.getElementById("capoValue"),
  tomValue: document.getElementById("tomValue"),
  tunerValue: document.getElementById("tunerValue"),
  progressInput: document.getElementById("progressInput"),
  progressValue: document.getElementById("progressValue"),
  videosInput: document.getElementById("videosInput"),
  setlistSelect: document.getElementById("setlistSelect"),
  saveButton: document.getElementById("saveButton"),
  discardButton: document.getElementById("discardButton"),
  logoutButton: document.getElementById("logoutButton"),
  finalMessage: document.getElementById("finalMessage"),
};

const DEBUG_PREFIX = "[LiveNLoud Extension]";

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

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function setStatus(message) {
  const normalized = cleanText(message);
  debugLog("STATUS", normalized);
  elements.statusText.textContent = normalized;
  elements.statusCard.classList.toggle("is-idle", IDLE_STATUSES.has(normalized));

  if (!elements.songView.classList.contains("hidden")) {
    setNotice(normalized);
  }
}

function showFinalMessage(message, type) {
  const normalized = cleanText(message);
  elements.finalMessage.textContent = normalized;
  elements.finalMessage.classList.remove("hidden", "is-success", "is-error");
  if (type) {
    elements.finalMessage.classList.add(type === "success" ? "is-success" : "is-error");
  }
}

function hideFinalMessage() {
  elements.finalMessage.textContent = "";
  elements.finalMessage.classList.add("hidden");
  elements.finalMessage.classList.remove("is-success", "is-error");
}

function showFinalOnly(message, type) {
  if (elements.hero) {
    elements.hero.classList.add("hidden");
  }

  elements.statusCard.classList.add("hidden");
  elements.loginView.classList.add("hidden");
  elements.songView.classList.remove("hidden");

  Array.from(elements.songView.children).forEach((child) => {
    if (child !== elements.finalMessage) {
      child.classList.add("hidden");
    }
  });

  showFinalMessage(message, type);
}

function showLogin() {
  elements.loginView.classList.remove("hidden");
  elements.songView.classList.add("hidden");
}

function showSongView() {
  elements.songView.classList.remove("hidden");
  elements.loginView.classList.add("hidden");
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
  return pageContext?.source === "letrasmus";
}

function syncInstrumentUi(pageContext) {
  if (shouldForceVoice(pageContext)) {
    state.selectedInstrument = "voice";
    elements.instrumentSelect.value = "voice";
    elements.instrumentSelect.disabled = true;
    return;
  }

  elements.instrumentSelect.disabled = false;
  elements.instrumentSelect.value = state.selectedInstrument;
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
  return elements.instrumentSelect.value || state.selectedInstrument || "guitar01";
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

async function readSessionState() {
  const keys = Object.values(STORAGE_KEYS);
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

async function writeSessionState({ accessToken, refreshToken, email, rememberSession }) {
  const payload = {
    [STORAGE_KEYS.accessToken]: accessToken,
    [STORAGE_KEYS.refreshToken]: refreshToken || "",
    [STORAGE_KEYS.email]: email,
  };

  await Promise.all([
    clearFromStorageArea(extensionApi.storage.local, Object.values(STORAGE_KEYS)),
    extensionApi.storage.session
      ? clearFromStorageArea(extensionApi.storage.session, Object.values(STORAGE_KEYS))
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
    clearFromStorageArea(extensionApi.storage.local, Object.values(STORAGE_KEYS)),
    extensionApi.storage.session
      ? clearFromStorageArea(extensionApi.storage.session, Object.values(STORAGE_KEYS))
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

  try {
    const context = await extensionApi.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_SONG_CONTEXT",
    });

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
  const response = await fetch(`${API_BASE}/api/auth/login`, {
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

async function fetchUserDoc(email, accessToken) {
  const response = await fetch(
    `${API_BASE}/api/alldata/${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Could not load user data.");
  }

  return response.json();
}

async function fetchDistinctSetlists(email, accessToken) {
  const data = await fetchUserDoc(email, accessToken);
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
  elements.setlistSelect.innerHTML = "";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "No setlist";
  elements.setlistSelect.appendChild(empty);

  setlists.forEach((setlist) => {
    const option = document.createElement("option");
    option.value = setlist;
    option.textContent = setlist;
    elements.setlistSelect.appendChild(option);
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
  setStaticValue(elements.artistValue, state.pageContext.artist, defaults.artist);
  setStaticValue(elements.capoValue, state.pageContext.capo, defaults.capo);
  setStaticValue(elements.tomValue, state.pageContext.tom, defaults.tom);
  setStaticValue(elements.tunerValue, state.pageContext.tuning, defaults.tuning);

  if (!state.pageContext.compatible) {
    setCompatibleLayout(false);
    setNotice("Esse site não é compativel com a extensão");
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

function normalizeScrapeDoc(scraped) {
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
      songCifra:
        pythonSongData.song_cifra || pythonSongData.songLyrics || "",
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

  let doc = candidates.find((candidate) => candidate?.artist && candidate?.song) || null;
  if (!doc) {
    const nested = candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        Object.values(candidate).some((value) => value?.artist && value?.song),
    );

    if (nested) {
      doc = Object.values(nested).find((value) => value?.artist && value?.song) || null;
    }
  }

  if (!doc) return null;

  const instrumentName = getSelectedInstrument();
  const instrumentDoc = doc?.[instrumentName] || {};

  return {
    artist: cleanText(doc.artist),
    song: cleanText(doc.song),
    capo: cleanText(instrumentDoc.capo || doc.capo),
    tuning: cleanText(instrumentDoc.tuning || doc.tuning),
    tom: cleanText(doc.tom || doc.tone || doc.key),
    link: cleanText(instrumentDoc.link || doc.link),
    songCifra: instrumentDoc.songCifra || doc.songCifra || "",
  };
}

async function scrapeSong(session, pageContext) {
  const progress = getProgressValue();
  const instrumentName = getSelectedInstrument();
  const response = await fetch(`${API_BASE}/api/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({
      artist: cleanText(pageContext.artist),
      song: cleanText(pageContext.song),
      email: session.email,
      instrument: instrumentName,
      instrument_progressbar: progress,
      link: cleanText(pageContext.link),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.details || data?.message || "Could not scrape song data.");
  }

  return normalizeScrapeDoc(data);
}

function buildSongPayload(email, scrapedDoc = null) {
  const pageContext = state.pageContext;
  const instrumentName = getSelectedInstrument();
  const mergedSong = cleanText(scrapedDoc?.song || pageContext.song);
  const mergedArtist = cleanText(scrapedDoc?.artist || pageContext.artist);
  const mergedLink = cleanText(scrapedDoc?.link || pageContext.link);
  const mergedCapo = cleanText(scrapedDoc?.capo || pageContext.capo);
  const mergedTom = cleanText(scrapedDoc?.tom || pageContext.tom);
  const mergedTuning = cleanText(scrapedDoc?.tuning || pageContext.tuning);
  const selectedSetlist = cleanText(elements.setlistSelect.value);
  const embedVideos = parseVideoLinks(elements.videosInput.value);
  const progress = getProgressValue();
  const today = new Date().toISOString().split("T")[0];
  const instruments = getEmptyInstrumentsMap();
  instruments[instrumentName] = true;
  const instrumentBlocks = {
    guitar01: { ...emptyInstrument },
    guitar02: { ...emptyInstrument },
    bass: { ...emptyInstrument },
    keys: { ...emptyInstrument },
    drums: { ...emptyInstrument },
    voice: { ...emptyInstrument },
  };

  instrumentBlocks[instrumentName] = {
    active: true,
    capo: mergedCapo,
    lastPlay: "",
    link: mergedLink,
    progress,
    songCifra: scrapedDoc?.songCifra || "",
    tuning: mergedTuning,
  };

  return {
    databaseComing: "liveNloud_",
    collectionComing: "data",
    userdata: {
      song: mergedSong,
      artist: mergedArtist,
      capo: mergedCapo,
      tom: mergedTom,
      tuning: mergedTuning,
      instrumentName,
      progressBar: 0,
      instruments,
      guitar01: instrumentBlocks.guitar01,
      guitar02: instrumentBlocks.guitar02,
      bass: instrumentBlocks.bass,
      keys: instrumentBlocks.keys,
      drums: instrumentBlocks.drums,
      voice: instrumentBlocks.voice,
      embedVideos,
      setlist: selectedSetlist ? [selectedSetlist] : [],
      addedIn: today,
      updateIn: today,
      email,
    },
  };
}

async function saveSong(payload, accessToken) {
  const response = await fetch(`${API_BASE}/api/newsong`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

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

  if (!accessToken || !email) {
    showLogin();
    setStatus("Login required.");
    return null;
  }

  try {
    await fetchUserDoc(email, accessToken);
    return { accessToken, email };
  } catch (error) {
    debugError("Session validation failed", error);
    await clearSessionState();
    showLogin();
    setStatus("Session expired. Login again.");
    return null;
  }
}

async function loadSongView(session) {
  setStatus("Carregando página...");
  hideFinalMessage();

  const [pageData, setlists] = await Promise.all([
    getPageContext(),
    fetchDistinctSetlists(session.email, session.accessToken),
  ]);

  fillSetlists(setlists);
  renderProgressValue();
  showSongView();
  renderPageContext(pageData);
  state.selectedInstrument = shouldForceVoice(pageData) ? "voice" : getSelectedInstrument();
  syncInstrumentUi(pageData);
  elements.userBadge.textContent = session.email;

  if (pageData.compatible && !hasRequiredMetadata(pageData)) {
    await waitForPageMetadata();
  }
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFinalMessage();
  setStatus("Signing in...");

  try {
    const email = cleanText(elements.emailInput.value);
    const password = elements.passwordInput.value;
    const rememberSession = Boolean(elements.rememberSessionInput.checked);
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

elements.progressInput.addEventListener("input", () => {
  renderProgressValue();
});

elements.instrumentSelect.addEventListener("change", () => {
  if (shouldForceVoice(state.pageContext)) {
    elements.instrumentSelect.value = "voice";
    state.selectedInstrument = "voice";
    return;
  }
  state.selectedInstrument = getSelectedInstrument();
});

elements.copyLinkButton.addEventListener("click", async () => {
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
});

elements.saveButton.addEventListener("click", async () => {
  hideFinalMessage();
  const session = await ensureSession();
  if (!session) return;

  const freshPageContext = await waitForPageMetadata();

  if (!freshPageContext.compatible) {
    setNotice("Esse site não é compativel com a extensão");
    setNoticeState("error");
    return;
  }

  if (!isPageSaveable(freshPageContext)) {
    const errorMessage = "Não foi possivel adicionar a cifra no momento, tente mais tarde";
    setNotice(errorMessage);
    setNoticeState("error");
    showFinalMessage(errorMessage, "error");
    return;
  }

  setNotice("Buscando dados da cifra...");

  try {
    const scrapedDoc = await scrapeSong(session, freshPageContext);
    const payload = buildSongPayload(session.email, scrapedDoc);
    setNotice("Salvando cifra...");
    await saveSong(payload, session.accessToken);
    const successMessage = "Cifra adicionada com sucesso";
    setNotice(successMessage);
    setNoticeState("success");
    showFinalOnly(successMessage, "success");
    window.setTimeout(() => {
      window.close();
    }, 5000);
  } catch (error) {
    debugError("Save song failed", error);
    const errorMessage = "Não foi possivel adicionar a cifra no momento, tente mais tarde";
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
  setStatus("Logged out.");
});

async function boot() {
  setStatus("");
  const storedSession = await readSessionState();
  elements.rememberSessionInput.checked = storedSession.rememberSession;
  state.selectedInstrument = getSelectedInstrument();
  renderProgressValue();
  hideFinalMessage();
  const session = await ensureSession();
  if (!session) return;
  await loadSongView(session);
}

boot();
