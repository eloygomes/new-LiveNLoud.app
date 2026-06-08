export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function normalizeName(value = "") {
  return String(value).trim().toLowerCase();
}

export function safeDate(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeId(value) {
  return value?.toString?.() || String(value || "");
}

export function isSongEntry(entry) {
  return Boolean(String(entry?.song || "").trim() && String(entry?.artist || "").trim());
}

export function getDefaultUserSetlists() {
  return ["guitar01", "guitar02", "bass", "keys", "drums", "voice"];
}

export function createDefaultUserProfileSeed({
  email = "",
  username = "",
  fullName = "",
  existing = {},
} = {}) {
  const today = new Date().toISOString().split("T")[0];
  const emptyInstrument = {
    active: "",
    capo: "",
    lastPlay: "",
    link: "",
    progress: "",
    songCifra: "",
    tuning: "",
  };

  return {
    id: 1,
    song: "",
    artist: "",
    progressBar: 0,
    instruments: {
      guitar01: false,
      guitar02: false,
      bass: false,
      keys: false,
      drums: false,
      voice: false,
    },
    guitar01: { ...emptyInstrument },
    guitar02: { ...emptyInstrument },
    bass: { ...emptyInstrument },
    keys: { ...emptyInstrument },
    drums: { ...emptyInstrument },
    voice: { ...emptyInstrument },
    embedVideos: [],
    setlist: getDefaultUserSetlists(),
    addedIn: existing?.addedIn || today,
    updateIn: today,
    email: normalizeEmail(email || existing?.email || ""),
    username: username || existing?.username || "",
    fullName: fullName || existing?.fullName || "",
  };
}
