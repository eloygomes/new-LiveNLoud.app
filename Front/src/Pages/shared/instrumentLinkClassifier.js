const INSTRUMENT_ALIASES = {
  guitar01: "guitar01",
  guitar02: "guitar01",
  guitar: "guitar01",
  violao: "guitar01",
  bass: "bass",
  baixo: "bass",
  keys: "keys",
  keyboard: "keys",
  teclado: "keys",
  drums: "drums",
  batera: "drums",
  bateria: "drums",
  voice: "voice",
  letra: "voice",
  lyrics: "voice",
  vocal: "voice",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function classifyInstrumentLink(rawLink) {
  const link = String(rawLink || "").trim();
  if (!link) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
  } catch {
    return null;
  }

  const host = normalizeText(url.hostname.replace(/^www\./, ""));
  const path = normalizeText(url.pathname);
  const search = normalizeText(url.search);
  const hash = normalizeText(url.hash);
  const full = `${host} ${path} ${search} ${hash}`;

  if (host === "letras.mus.br" || host === "letras.com") return "voice";

  if (host.includes("ultimate-guitar.com")) {
    if (/-bass-\d+/.test(path) || path.includes("bass")) return "bass";
    if (/-ukulele-\d+/.test(path) || path.includes("ukulele")) return "guitar01";
    if (/-drums-\d+/.test(path) || path.includes("drums")) return "drums";
    return "guitar01";
  }

  if (host.includes("cifraclub.com.br")) {
    if (full.includes("tabs-baixo")) return "bass";
    if (full.includes("tabs-bateria")) return "drums";
    if (full.includes("/letra")) return "voice";
    if (full.includes("instrument=keyboard")) return "keys";
    if (full.includes("instrument=cavaco")) return "guitar01";
    if (full.includes("tabs-gaita")) return "guitar01";
    if (full.includes("/partituras/") || full.endsWith(".pdf")) return null;
    return "guitar01";
  }

  return null;
}

export function normalizeInstrumentKey(key) {
  return INSTRUMENT_ALIASES[normalizeText(key)] || key;
}
