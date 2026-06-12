import { createNewSongOnServer } from "../../../Tools/Controllers";
import { toPresentationLayoutPayload } from "../presentationLayoutHelpers";

const ALLOWED_INSTRUMENTS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanCifraText(value = "") {
  return String(value || "").replace(/\r\n/g, "\n");
}

export function normalizeBlankPresentationInstrument(value = "guitar01") {
  const instrument = cleanText(value).toLowerCase();
  const normalizedInstrument =
    instrument === "keyboard" || instrument === "key" ? "keys" : instrument;

  return ALLOWED_INSTRUMENTS.includes(normalizedInstrument)
    ? normalizedInstrument
    : "guitar01";
}

export function getBlankPresentationDraftStorageKey({
  artist,
  song,
  instrument,
}) {
  return `blank-presentation-draft::${artist}::${song}::${instrument}`;
}

export function getBlankPresentationSavedStorageKey({
  artist,
  song,
  instrument,
}) {
  return `blank-presentation-saved::${artist}::${song}::${instrument}`;
}

export function buildBlankPresentationLayouts({
  cifra,
  showProgressionMarkers = false,
} = {}) {
  const songCifra = cleanCifraText(cifra);

  return toPresentationLayoutPayload({
    default: {
      songCifra,
      twoColumns: false,
      showProgressionMarkers,
    },
    expanded: {
      songCifra,
      twoColumns: true,
      showProgressionMarkers,
    },
  });
}

export function buildBlankPresentationInstrumentFields({
  cifra,
  showProgressionMarkers = false,
} = {}) {
  const presentationLayouts = buildBlankPresentationLayouts({
    cifra,
    showProgressionMarkers,
  });

  return {
    active: true,
    capo: "",
    lastPlay: "",
    link: "",
    progress: 0,
    songCifra: presentationLayouts.default.songCifra,
    songTabs: "",
    songChords: "",
    songLyrics: "",
    tuning: "",
    presentationLayouts,
  };
}

export function buildBlankPresentationSaveRequest({
  artist,
  song,
  instrument,
  cifra,
  showProgressionMarkers = false,
}) {
  const artistName = cleanText(artist);
  const songName = cleanText(song);
  const instrumentName = normalizeBlankPresentationInstrument(instrument);
  const cleanCifra = cleanCifraText(cifra);

  if (!artistName || !songName) {
    throw new Error("Informe artista e música antes de salvar.");
  }

  if (!cleanCifra.trim()) {
    throw new Error("Adicione a cifra antes de salvar.");
  }

  return {
    songName,
    artistName,
    instrumentName,
    geralPercentage: 0,
    setlist: [],
    instrumentFields: buildBlankPresentationInstrumentFields({
      cifra: cleanCifra,
      showProgressionMarkers,
    }),
    embedLink: [],
    capo: "",
    tom: "",
    tuning: "",
  };
}

export async function saveBlankPresentationCifra({
  artist,
  song,
  instrument,
  cifra,
  showProgressionMarkers = false,
  createSong = createNewSongOnServer,
}) {
  const request = buildBlankPresentationSaveRequest({
    artist,
    song,
    instrument,
    cifra,
    showProgressionMarkers,
  });

  const result = await createSong(request);

  return {
    result,
    request,
    layouts: request.instrumentFields.presentationLayouts,
  };
}
