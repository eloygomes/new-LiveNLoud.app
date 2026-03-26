const extensionApi = globalThis.browser || globalThis.chrome;

const API_BASE = "https://api.live.eloygomes.com";
const STORAGE_KEYS = {
  accessToken: "livenloud_access_token",
  refreshToken: "livenloud_refresh_token",
  email: "livenloud_user_email",
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

const elements = {
  statusCard: document.getElementById("statusCard"),
  statusText: document.getElementById("statusText"),
  loginView: document.getElementById("loginView"),
  songView: document.getElementById("songView"),
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  userBadge: document.getElementById("userBadge"),
  linkInput: document.getElementById("linkInput"),
  songInput: document.getElementById("songInput"),
  artistInput: document.getElementById("artistInput"),
  capoInput: document.getElementById("capoInput"),
  tomInput: document.getElementById("tomInput"),
  tunerInput: document.getElementById("tunerInput"),
  videosInput: document.getElementById("videosInput"),
  setlistSelect: document.getElementById("setlistSelect"),
  saveButton: document.getElementById("saveButton"),
  discardButton: document.getElementById("discardButton"),
  logoutButton: document.getElementById("logoutButton"),
};

const autoFillState = { requestId: 0 };

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

function setStatus(message) {
  debugLog("STATUS", message);
  elements.statusText.textContent = message;
}

function showLogin() {
  elements.loginView.classList.remove("hidden");
  elements.songView.classList.add("hidden");
}

function showSongView() {
  elements.songView.classList.remove("hidden");
  elements.loginView.classList.add("hidden");
}

function readStorage(keys) {
  return new Promise((resolve) => {
    extensionApi.storage.local.get(keys, resolve);
  });
}

function writeStorage(data) {
  return new Promise((resolve) => {
    extensionApi.storage.local.set(data, resolve);
  });
}

function clearStorage(keys) {
  return new Promise((resolve) => {
    extensionApi.storage.local.remove(keys, resolve);
  });
}

async function getActiveTab() {
  const [tab] = await extensionApi.tabs.query({
    active: true,
    currentWindow: true,
  });

  debugLog("Active tab resolved", tab || null);
  return tab || null;
}

async function getPageContext() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    debugLog("No active tab id found for page context.");
    return {
      link: "",
      song: "",
      artist: "",
      capo: "",
      tom: "",
      tuning: "",
    };
  }

  try {
    debugLog("Requesting page context from content script", {
      tabId: tab.id,
      url: tab.url || "",
    });

    const context = await extensionApi.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_SONG_CONTEXT",
    });

    debugLog("Page context received", context);
    return context;
  } catch (error) {
    debugError("Page context request failed", error);

    const fallback = {
      link: tab.url || "",
      song: "",
      artist: "",
      capo: "",
      tom: "",
      tuning: "",
    };

    debugLog("Using fallback page context", fallback);
    return fallback;
  }
}

async function loginRequest(email, password) {
  debugLog("Sending login request", {
    email,
    endpoint: `${API_BASE}/api/auth/login`,
  });

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  debugLog("Login response received", {
    ok: response.ok,
    status: response.status,
    body: data,
  });

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Login failed.");
  }
  return data;
}

async function fetchUserDoc(email, accessToken) {
  const endpoint = `${API_BASE}/api/alldata/${encodeURIComponent(email)}`;
  debugLog("Fetching user document", {
    email,
    endpoint,
  });

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  debugLog("User document response received", {
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    throw new Error("Could not load user data.");
  }

  const data = await response.json();
  debugLog("User document payload", data);
  return data;
}

async function fetchDistinctSetlists(email, accessToken) {
  const data = await fetchUserDoc(email, accessToken);
  const tags = new Set();

  if (Array.isArray(data?.userdata)) {
    data.userdata.forEach((song) => {
      (song.setlist || []).forEach((tag) => {
        const value = String(tag || "").trim();
        if (value) tags.add(value);
      });
    });
  }

  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function fillSetlists(setlists) {
  debugLog("Filling setlists", setlists);
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

function fillSongForm(songData) {
  debugLog("Filling song form with page data", songData);
  elements.linkInput.value = songData.link || "";
  elements.songInput.value = songData.song || "";
  elements.artistInput.value = songData.artist || "";
  elements.capoInput.value = songData.capo || "";
  elements.tomInput.value = songData.tom || "";
  elements.tunerInput.value = songData.tuning || "";
  elements.videosInput.value = "";
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

function buildSongPayload(email) {
  const song = elements.songInput.value.trim();
  const artist = elements.artistInput.value.trim();
  const link = elements.linkInput.value.trim();
  const capo = elements.capoInput.value.trim();
  const tom = elements.tomInput.value.trim();
  const tuning = elements.tunerInput.value.trim();
  const selectedSetlist = elements.setlistSelect.value.trim();
  const embedVideos = parseVideoLinks(elements.videosInput.value);
  const today = new Date().toISOString().split("T")[0];

  return {
    databaseComing: "liveNloud_",
    collectionComing: "data",
    userdata: {
      song,
      artist,
      capo,
      tom,
      tuning,
      progressBar: 0,
      instruments: {
        guitar01: true,
        guitar02: false,
        bass: false,
        keys: false,
        drums: false,
        voice: false,
      },
      guitar01: {
        active: true,
        capo,
        lastPlay: "",
        link,
        progress: 0,
        songCifra: "",
        tuning,
      },
      guitar02: { ...emptyInstrument },
      bass: { ...emptyInstrument },
      keys: { ...emptyInstrument },
      drums: { ...emptyInstrument },
      voice: { ...emptyInstrument },
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

function normalizeScrapeData(raw) {
  debugLog("Raw scrape response before normalization", raw);

  const source = raw && typeof raw === "object" ? raw : {};
  const payload =
    source.data && typeof source.data === "object"
      ? source.data
      : source.result && typeof source.result === "object"
        ? source.result
        : source;

  debugLog("Scrape payload selected for normalization", payload);

  const normalized = {
    song: firstNonEmpty(
      getNestedValue(payload, [["song"], ["music"], ["title"], ["songTitle"]]),
      getNestedValue(payload, [["userdata", "song"]]),
    ),
    artist: firstNonEmpty(
      getNestedValue(payload, [
        ["artist"],
        ["singer"],
        ["band"],
        ["artistName"],
      ]),
      getNestedValue(payload, [["userdata", "artist"]]),
    ),
    capo: firstNonEmpty(
      getNestedValue(payload, [
        ["capo"],
        ["capotraste"],
        ["guitar01", "capo"],
        ["userdata", "guitar01", "capo"],
      ]),
    ),
    tom: firstNonEmpty(
      getNestedValue(payload, [
        ["tom"],
        ["tone"],
        ["key"],
        ["tonality"],
        ["guitar01", "tom"],
        ["userdata", "guitar01", "tom"],
      ]),
    ),
    tuning: firstNonEmpty(
      getNestedValue(payload, [
        ["tuning"],
        ["afinacao"],
        ["afinação"],
        ["guitar01", "tuning"],
        ["userdata", "guitar01", "tuning"],
      ]),
    ),
  };

  debugLog("Normalized scrape data", normalized);
  return normalized;
}

async function scrapeSongMetadata(link, email, accessToken) {
  const requestBody = {
    email,
    instrument: "guitar",
    artist: "",
    song: "",
    link,
    instrument_progressbar: 0,
  };

  debugLog("Sending scrape request", {
    endpoint: `${API_BASE}/api/scrape`,
    body: requestBody,
  });

  const response = await fetch(`${API_BASE}/api/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json().catch(() => ({}));

  debugLog("Scrape response received", {
    ok: response.ok,
    status: response.status,
    body: data,
  });

  if (!response.ok) {
    throw new Error(
      data?.details || data?.message || "Could not auto-fill song metadata.",
    );
  }

  return normalizeScrapeData(data);
}

function applyAutoFilledSongData(songData) {
  debugLog("Applying auto-filled song data", songData);

  if (songData.song) elements.songInput.value = songData.song;
  if (songData.artist) elements.artistInput.value = songData.artist;
  if (songData.capo) elements.capoInput.value = songData.capo;
  if (songData.tom) elements.tomInput.value = songData.tom;
  if (songData.tuning) elements.tunerInput.value = songData.tuning;

  debugLog("Form values after auto-fill", {
    link: elements.linkInput.value,
    song: elements.songInput.value,
    artist: elements.artistInput.value,
    capo: elements.capoInput.value,
    tom: elements.tomInput.value,
    tuning: elements.tunerInput.value,
  });
}

async function tryAutoFillFromLink(session, link, options = {}) {
  const normalizedLink = String(link || "").trim();
  debugLog("tryAutoFillFromLink called", {
    requestLink: link,
    normalizedLink,
    options,
    email: session?.email || "",
  });

  if (!normalizedLink) {
    debugLog("Auto-fill skipped because link is empty.");
    return;
  }

  const requestId = ++autoFillState.requestId;
  const shouldUpdateStatus = options.updateStatus !== false;

  debugLog("Auto-fill request started", {
    requestId,
    shouldUpdateStatus,
  });

  if (shouldUpdateStatus) {
    setStatus("Auto-filling song metadata...");
  }

  try {
    const scrapedData = await scrapeSongMetadata(
      normalizedLink,
      session.email,
      session.accessToken,
    );

    debugLog("Auto-fill scrape completed", {
      requestId,
      scrapedData,
      latestRequestId: autoFillState.requestId,
    });

    if (requestId !== autoFillState.requestId) {
      debugLog("Auto-fill response ignored because a newer request exists", {
        requestId,
        latestRequestId: autoFillState.requestId,
      });
      return;
    }

    applyAutoFilledSongData(scrapedData);

    if (shouldUpdateStatus) {
      setStatus("Metadata auto-filled.");
    }
  } catch (error) {
    debugError("Auto-fill failed", error);

    if (requestId !== autoFillState.requestId) {
      debugLog("Auto-fill error ignored because a newer request exists", {
        requestId,
        latestRequestId: autoFillState.requestId,
      });
      return;
    }

    if (shouldUpdateStatus) {
      setStatus(error.message || "Could not auto-fill song metadata.");
    }
  }
}

async function ensureSession() {
  const storage = await readStorage(Object.values(STORAGE_KEYS));
  debugLog("Storage snapshot during session check", storage);

  const accessToken = storage[STORAGE_KEYS.accessToken];
  const email = storage[STORAGE_KEYS.email];

  if (!accessToken || !email) {
    debugLog("No valid session found in storage.");
    showLogin();
    setStatus("Login required.");
    return null;
  }

  try {
    await fetchUserDoc(email, accessToken);
    debugLog("Session validated successfully", { email });
    return {
      accessToken,
      email,
    };
  } catch (error) {
    debugError("Session validation failed", error);
    await clearStorage(Object.values(STORAGE_KEYS));
    showLogin();
    setStatus("Session expired. Login again.");
    return null;
  }
}

async function loadSongView(session) {
  debugLog("Loading song view", session);
  setStatus("Loading current page...");

  const [pageData, setlists] = await Promise.all([
    getPageContext(),
    fetchDistinctSetlists(session.email, session.accessToken),
  ]);

  debugLog("Song view dependencies resolved", {
    pageData,
    setlists,
  });

  fillSongForm(pageData);
  fillSetlists(setlists);
  elements.userBadge.textContent = session.email;
  showSongView();

  if (pageData.link) {
    debugLog("Starting auto-fill from current page link", pageData.link);
    await tryAutoFillFromLink(session, pageData.link, { updateStatus: true });
  } else {
    debugLog("No page link found. Song view ready without auto-fill.");
    setStatus("Ready.");
  }
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Signing in...");

  try {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    debugLog("Login form submitted", {
      email,
      hasPassword: Boolean(password),
    });

    const loginData = await loginRequest(email, password);

    await writeStorage({
      [STORAGE_KEYS.accessToken]: loginData.accessToken,
      [STORAGE_KEYS.refreshToken]: loginData.refreshToken || "",
      [STORAGE_KEYS.email]: email,
    });

    debugLog("Session stored after login", {
      email,
      hasAccessToken: Boolean(loginData.accessToken),
      hasRefreshToken: Boolean(loginData.refreshToken),
    });

    const session = {
      accessToken: loginData.accessToken,
      email,
    };

    await loadSongView(session);
  } catch (error) {
    debugError("Login flow failed", error);
    setStatus(error.message || "Login failed.");
  }
});

elements.linkInput.addEventListener("change", async () => {
  debugLog("Link input changed", elements.linkInput.value);

  const session = await ensureSession();
  if (!session) return;

  await tryAutoFillFromLink(session, elements.linkInput.value, {
    updateStatus: true,
  });
});

elements.saveButton.addEventListener("click", async () => {
  debugLog("Save button clicked.");

  const session = await ensureSession();
  if (!session) return;

  const payload = buildSongPayload(session.email);
  debugLog("Built save payload", payload);

  if (
    !payload.userdata.song ||
    !payload.userdata.artist ||
    !payload.userdata.link
  ) {
    debugLog("Save blocked due to missing required fields", {
      song: payload.userdata.song,
      artist: payload.userdata.artist,
      link: payload.userdata.link,
    });
    setStatus("Link, song, and artist are required.");
    return;
  }

  setStatus("Saving song...");

  try {
    await saveSong(payload, session.accessToken);
    debugLog("Song saved successfully.");
    setStatus("Song saved.");
    window.close();
  } catch (error) {
    debugError("Save song failed", error);
    setStatus(error.message || "Could not save song.");
  }
});

elements.discardButton.addEventListener("click", () => {
  window.close();
});

elements.logoutButton.addEventListener("click", async () => {
  debugLog("Logout button clicked.");
  autoFillState.requestId += 1;
  await clearStorage(Object.values(STORAGE_KEYS));
  showLogin();
  setStatus("Logged out.");
});

async function boot() {
  debugLog("Boot started.");
  setStatus("Checking session...");
  const session = await ensureSession();
  if (!session) {
    debugLog("Boot finished without session.");
    return;
  }

  await loadSongView(session);
  debugLog("Boot finished with active session.");
}

boot();
