import axios from "axios";

export const api = axios.create({
  baseURL: "https://api.live.eloygomes.com",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// util: normaliza nomes aceitos pelo backend
function normalizeInstrument(i) {
  const map = {
    keyboard: "keys",
    key: "keys",
  };
  const allowed = ["guitar01", "guitar02", "bass", "keys", "drums", "voice"];
  const norm = map[i] || i;
  return allowed.includes(norm) ? norm : null;
}

/* =========================
   Config & Helpers
   ========================= */

const API_BASE = "https://api.live.eloygomes.com"; // um único lugar p/ trocar host

// axios com baseURL e JSON por padrão
const axiosApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// sempre leia o email “na hora”, para não congelar valor no import
const getUserEmail = () =>
  (typeof window !== "undefined" && localStorage.getItem("userEmail")) || null;

/* =========================
   Endpoints já existentes
   ========================= */

export const requestData = async (email) => {
  try {
    const { data } = await axiosApi.get(`/api/alldata/${email}`);
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error fetching song data:", error);
  }
};

export const fetchAllSongData = async (email, artist, song) => {
  const url = "/api/allsongdata";
  try {
    const { data } = await axiosApi.post(url, { email, artist, song });
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching song data from ${API_BASE + url}`, error);
    throw error;
  }
};

export const deleteOneSong = async (artist, song) => {
  const url = "/api/deleteonesong";
  try {
    const { data } = await axiosApi.post(url, {
      email: getUserEmail(),
      artist,
      song,
    });
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching song data from ${API_BASE + url}`, error);
    throw error;
  }
};

export const allDataFromOneSong = async (artist, song) => {
  const url = "/api/allsongdata";
  try {
    const { data } = await axiosApi.post(url, {
      email: getUserEmail(),
      artist,
      song,
    });
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching song data from ${API_BASE + url}`, error);
    throw error;
  }
};

export const updateSongData = async (updatedData) => {
  const email = getUserEmail(); // pega o email atual
  const artist =
    typeof window !== "undefined" ? localStorage.getItem("artist") : "";
  const song =
    typeof window !== "undefined" ? localStorage.getItem("song") : "";

  const payload = {
    userdata: {
      email,
      artist,
      song,
      ...updatedData,
    },
    databaseComing: "liveNloud_",
    collectionComing: "data",
  };

  try {
    const { data } = await axiosApi.post("/api/newsong", payload);
    return data;
  } catch (error) {
    console.error("Error updating song data:", error);
    throw error;
  }
};

export const updateUserName = async (newName) => {
  const payload = {
    email: getUserEmail(),
    newUsername: newName,
  };

  try {
    const { data } = await axiosApi.put("/api/updateUsername", payload);
    return data;
  } catch (error) {
    console.error("Error updating song data:", error);
    throw error;
  }
};

export const updateLastPlayed = async (song, artist, instrument) => {
  const email =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  if (!email) {
    console.warn("updateLastPlayed: sem email no localStorage.");
    return null;
  }

  const normalizedInstrument = normalizeInstrument(instrument);
  if (!normalizedInstrument) {
    throw new Error(
      `Instrumento inválido: "${instrument}". Use um de: guitar01, guitar02, bass, keys, drums, voice.`
    );
  }

  const payload = { email, song, artist, instrument: normalizedInstrument };

  try {
    const { data } = await api.put("/api/lastPlay", payload);
    return data;
  } catch (error) {
    console.error("[updateLastPlayed:PUT]", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

export const downloadUserData = async () => {
  const email = getUserEmail();
  if (!email) return;

  try {
    const resp = await axiosApi.get(`/api/downloadUserData/${email}`, {
      responseType: "blob",
    });

    const blob = new Blob([resp.data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "userdata.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading user data:", error);
  }
};

export const deleteAllUserSongs = async () => {
  const url = "/api/deleteAllUserSongs";

  try {
    const { data } = await axiosApi.post(url, { email: getUserEmail() });
    return data;
  } catch (error) {
    console.error(
      `Error deleting songs:`,
      error.response?.data?.message || error.message
    );
    throw error;
  }
};

export const deleteUserAccountOnDb = async () => {
  const url = "/api/deleteUserAccount";

  try {
    const { data } = await axiosApi.post(url, { email: getUserEmail() });
    return data;
  } catch (error) {
    console.error(
      `Erro ao deletar a conta do usuário:`,
      error.response?.data?.message || error.message
    );
    throw error;
  }
};

export async function getAllUserSetlists() {
  const email = getUserEmail();
  if (!email) return [];

  try {
    const res = await fetch(`${API_BASE}/api/alldata/${email}`);
    const data = await res.json();

    const allTags = new Set();
    if (Array.isArray(data.userdata)) {
      data.userdata.forEach((songEntry) => {
        if (Array.isArray(songEntry.setlist)) {
          songEntry.setlist.forEach((tag) => allTags.add(tag));
        }
      });
    }

    return Array.from(allTags);
  } catch (error) {
    console.error("Erro ao carregar setlists:", error);
    return [];
  }
}

export async function login(userEmail, userPassword) {
  try {
    const { data } = await axiosApi.post("/api/auth/login", {
      email: userEmail,
      password: userPassword,
    });

    const { accessToken } = data;

    localStorage.setItem("token", accessToken);
    localStorage.setItem("userEmail", userEmail);

    return accessToken;
  } catch (err) {
    console.error("Login failed:", err);
    alert("Login inválido. Verifique e-mail e senha.");
  }
}

/* =========================
   Avatar helpers
   ========================= */

/**
 * Busca a imagem de perfil do usuário e retorna um ObjectURL (string).
 * @param {string} cacheKey - valor para bust de cache (ex.: localStorage.avatarUpdatedAt)
 * @returns {Promise<string|null>} ObjectURL ou null
 */
export async function getProfileImageObjectURL(cacheKey = "0") {
  const email = getUserEmail();
  if (!email) return null;

  const url = `${API_BASE}/api/profileImage/${encodeURIComponent(
    email
  )}?_v=${encodeURIComponent(cacheKey)}`;

  try {
    const resp = await axios.get(url, {
      responseType: "blob",
      headers: { "Cache-Control": "no-cache" },
    });

    if (resp.status === 200) {
      return URL.createObjectURL(resp.data);
    }
    return null;
  } catch (err) {
    // 404 = sem imagem => retorna null silenciosamente
    if (err?.response?.status === 404) return null;
    console.error("Erro ao buscar a imagem de perfil:", err);
    return null;
  }
}

/** Revoga com segurança um ObjectURL previamente criado. */
export function revokeObjectURLSafe(objectUrl) {
  try {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  } catch {}
}

/* =========================
   Setlists helpers
   ========================= */

export const SETLISTS_LS_KEY = "mySelectedSetlists";

/** Lê as setlists selecionadas do localStorage. */
export function loadSelectedSetlists() {
  try {
    const saved = localStorage.getItem(SETLISTS_LS_KEY);
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Salva as setlists selecionadas no localStorage. */
export function saveSelectedSetlists(arr) {
  try {
    localStorage.setItem(SETLISTS_LS_KEY, JSON.stringify(arr || []));
  } catch {}
}

/**
 * Busca no backend todas as setlists distintas do usuário logado.
 * Retorna um array de strings (ordenado).
 */
export async function fetchDistinctSetlists() {
  const email = getUserEmail();
  if (!email) return [];

  try {
    const resp = await fetch(
      `${API_BASE}/api/alldata/${encodeURIComponent(email)}`
    );
    const data = await resp.json();

    const tags = new Set();
    if (Array.isArray(data?.userdata)) {
      data.userdata.forEach((song) => {
        (song.setlist || []).forEach((t) => tags.add(t));
      });
    }
    return Array.from(tags).sort();
  } catch (error) {
    console.error("Erro ao buscar setlists:", error);
    return [];
  }
}

/* =========================
   Songs helpers
   ========================= */

export async function fetchUserSongs() {
  const email = getUserEmail();
  if (!email) {
    return { songs: [], fullName: "", username: "" };
  }

  try {
    const resp = await fetch(
      `${API_BASE}/api/alldata/${encodeURIComponent(email)}`
    );
    const data = await resp.json();

    const songs = (data.userdata || []).filter(
      (item) =>
        item.song?.trim() !== "" &&
        item.artist?.trim() !== "" &&
        item.progressBar !== undefined
    );

    const first = Array.isArray(data.userdata) ? data.userdata[0] ?? {} : {};
    return {
      songs,
      fullName: first.fullName || "",
      username: first.username || "",
    };
  } catch (error) {
    console.error("Erro ao buscar músicas:", error);
    return { songs: [], fullName: "", username: "" };
  }
}

// --- Create New Song --------------------------------------------------
/**
 * Cria uma nova música no backend.
 * @param {Object} params
 * @param {string} params.songName
 * @param {string} params.artistName
 * @param {("guitar01"|"guitar02"|"bass"|"keys"|"drums"|"voice")} params.instrumentName
 * @param {number} [params.geralPercentage=0]
 * @param {string[]} [params.setlist=[]]
 * @param {Object} [params.instrumentFields] - campos do instrumento ativo
 * @param {boolean|string} [params.instrumentFields.active]
 * @param {string} [params.instrumentFields.capo]
 * @param {string} [params.instrumentFields.lastPlay]
 * @param {string} [params.instrumentFields.link]
 * @param {string|number} [params.instrumentFields.progress]
 * @param {string} [params.instrumentFields.songCifra]
 * @param {string} [params.instrumentFields.tuning]
 * @param {string[]} [params.embedLink=[]]
 * @returns {Promise<any>} response.data
 */
export async function createNewSongOnServer({
  songName,
  artistName,
  instrumentName,
  geralPercentage = 0,
  setlist = [],
  instrumentFields = {},
  embedLink = [],
}) {
  const email =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }
  if (!songName || !artistName) {
    throw new Error("songName e artistName são obrigatórios.");
  }

  // Flags dos instrumentos
  const flags = {
    guitar01: instrumentName === "guitar01",
    guitar02: instrumentName === "guitar02",
    bass: instrumentName === "bass",
    keys: instrumentName === "keys",
    drums: instrumentName === "drums",
    voice: instrumentName === "voice",
  };

  // Helper para montar o bloco de cada instrumento
  const block = (name) => ({
    active: `${flags[name] ? instrumentFields.active ?? "" : ""}`,
    capo: `${flags[name] ? instrumentFields.capo ?? "" : ""}`,
    lastPlay: `${flags[name] ? instrumentFields.lastPlay ?? "" : ""}`,
    link: `${flags[name] ? instrumentFields.link ?? "" : ""}`,
    progress: `${flags[name] ? instrumentFields.progress ?? "" : ""}`,
    songCifra: `${flags[name] ? instrumentFields.songCifra ?? "" : ""}`,
    tuning: `${flags[name] ? instrumentFields.tuning ?? "" : ""}`,
  });

  const userdata = {
    song: songName,
    artist: artistName,
    progressBar: geralPercentage || 0,
    setlist,
    instruments: { ...flags },
    guitar01: block("guitar01"),
    guitar02: block("guitar02"),
    bass: block("bass"),
    keys: block("keys"),
    drums: block("drums"),
    voice: block("voice"),
    embedVideos: embedLink || [],
    addedIn: new Date().toISOString().split("T")[0],
    updateIn: new Date().toISOString().split("T")[0],
    email,
    username: "",
    fullName: "",
  };

  const payload = {
    databaseComing: "liveNloud_",
    collectionComing: "data",
    userdata,
  };

  const resp = await axios.post(
    "https://api.live.eloygomes.com/api/newsong",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  return resp.data;
}
