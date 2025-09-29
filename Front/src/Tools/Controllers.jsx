// import axios from "axios";

// export const api = axios.create({
//   baseURL: "https://api.live.eloygomes.com",
//   headers: { "Content-Type": "application/json" },
// });

// api.interceptors.request.use((config) => {
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // util: normaliza nomes aceitos pelo backend
// function normalizeInstrument(i) {
//   const map = {
//     keyboard: "keys",
//     key: "keys",
//   };
//   const allowed = ["guitar01", "guitar02", "bass", "keys", "drums", "voice"];
//   const norm = map[i] || i;
//   return allowed.includes(norm) ? norm : null;
// }

// /* =========================
//    Config & Helpers
//    ========================= */

// const API_BASE = "https://api.live.eloygomes.com"; // um único lugar p/ trocar host

// // axios com baseURL e JSON por padrão
// const axiosApi = axios.create({
//   baseURL: API_BASE,
//   headers: { "Content-Type": "application/json" },
// });

// // sempre leia o email “na hora”, para não congelar valor no import
// const getUserEmail = () =>
//   (typeof window !== "undefined" && localStorage.getItem("userEmail")) || null;

// /* =========================
//    Endpoints já existentes
//    ========================= */

// export const requestData = async (email) => {
//   try {
//     const { data } = await axiosApi.get(`/api/alldata/${email}`);
//     return JSON.stringify(data);
//   } catch (error) {
//     console.error("Error fetching song data:", error);
//   }
// };

// export const fetchAllSongData = async (email, artist, song) => {
//   const url = "/api/allsongdata";
//   try {
//     const { data } = await axiosApi.post(url, { email, artist, song });
//     return JSON.stringify(data);
//   } catch (error) {
//     console.error(`Error fetching song data from ${API_BASE + url}`, error);
//     throw error;
//   }
// };

// export const deleteOneSong = async (artist, song) => {
//   const url = "/api/deleteonesong";
//   try {
//     const { data } = await axiosApi.post(url, {
//       email: getUserEmail(),
//       artist,
//       song,
//     });
//     return JSON.stringify(data);
//   } catch (error) {
//     console.error(`Error fetching song data from ${API_BASE + url}`, error);
//     throw error;
//   }
// };

// export const allDataFromOneSong = async (artist, song) => {
//   const url = "/api/allsongdata";
//   try {
//     const { data } = await axiosApi.post(url, {
//       email: getUserEmail(),
//       artist,
//       song,
//     });
//     return JSON.stringify(data);
//   } catch (error) {
//     console.error(`Error fetching song data from ${API_BASE + url}`, error);
//     throw error;
//   }
// };

// export const updateSongData = async (updatedData) => {
//   const email = getUserEmail(); // pega o email atual
//   const artist =
//     typeof window !== "undefined" ? localStorage.getItem("artist") : "";
//   const song =
//     typeof window !== "undefined" ? localStorage.getItem("song") : "";

//   const payload = {
//     userdata: {
//       email,
//       artist,
//       song,
//       ...updatedData,
//     },
//     databaseComing: "liveNloud_",
//     collectionComing: "data",
//   };

//   try {
//     const { data } = await axiosApi.post("/api/newsong", payload);
//     return data;
//   } catch (error) {
//     console.error("Error updating song data:", error);
//     throw error;
//   }
// };

// export const updateUserName = async (newName) => {
//   const payload = {
//     email: getUserEmail(),
//     newUsername: newName,
//   };

//   try {
//     const { data } = await axiosApi.put("/api/updateUsername", payload);
//     return data;
//   } catch (error) {
//     console.error("Error updating song data:", error);
//     throw error;
//   }
// };

// export const updateLastPlayed = async (song, artist, instrument) => {
//   const email =
//     typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

//   if (!email) {
//     console.warn("updateLastPlayed: sem email no localStorage.");
//     return null;
//   }

//   const normalizedInstrument = normalizeInstrument(instrument);
//   if (!normalizedInstrument) {
//     throw new Error(
//       `Instrumento inválido: "${instrument}". Use um de: guitar01, guitar02, bass, keys, drums, voice.`
//     );
//   }

//   const payload = { email, song, artist, instrument: normalizedInstrument };

//   try {
//     const { data } = await api.put("/api/lastPlay", payload);
//     return data;
//   } catch (error) {
//     console.error("[updateLastPlayed:PUT]", {
//       status: error?.response?.status,
//       data: error?.response?.data,
//       message: error?.message,
//     });
//     throw error;
//   }
// };

// export const downloadUserData = async () => {
//   const email = getUserEmail();
//   if (!email) return;

//   try {
//     const resp = await axiosApi.get(`/api/downloadUserData/${email}`, {
//       responseType: "blob",
//     });

//     const blob = new Blob([resp.data], { type: "application/json" });
//     const link = document.createElement("a");
//     link.href = window.URL.createObjectURL(blob);
//     link.download = "userdata.json";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   } catch (error) {
//     console.error("Error downloading user data:", error);
//   }
// };

// export const deleteAllUserSongs = async () => {
//   const url = "/api/deleteAllUserSongs";

//   try {
//     const { data } = await axiosApi.post(url, { email: getUserEmail() });
//     return data;
//   } catch (error) {
//     console.error(
//       `Error deleting songs:`,
//       error.response?.data?.message || error.message
//     );
//     throw error;
//   }
// };

// export const deleteUserAccountOnDb = async () => {
//   const url = "/api/deleteUserAccount";

//   try {
//     const { data } = await axiosApi.post(url, { email: getUserEmail() });
//     return data;
//   } catch (error) {
//     console.error(
//       `Erro ao deletar a conta do usuário:`,
//       error.response?.data?.message || error.message
//     );
//     throw error;
//   }
// };

// export async function getAllUserSetlists() {
//   const email = getUserEmail();
//   if (!email) return [];

//   try {
//     const res = await fetch(`${API_BASE}/api/alldata/${email}`);
//     const data = await res.json();

//     const allTags = new Set();
//     if (Array.isArray(data.userdata)) {
//       data.userdata.forEach((songEntry) => {
//         if (Array.isArray(songEntry.setlist)) {
//           songEntry.setlist.forEach((tag) => allTags.add(tag));
//         }
//       });
//     }

//     return Array.from(allTags);
//   } catch (error) {
//     console.error("Erro ao carregar setlists:", error);
//     return [];
//   }
// }

// export async function login(userEmail, userPassword) {
//   try {
//     const { data } = await axiosApi.post("/api/auth/login", {
//       email: userEmail,
//       password: userPassword,
//     });

//     const { accessToken } = data;

//     localStorage.setItem("token", accessToken);
//     localStorage.setItem("userEmail", userEmail);

//     return accessToken;
//   } catch (err) {
//     console.error("Login failed:", err);
//     alert("Login inválido. Verifique e-mail e senha.");
//   }
// }

// /* =========================
//    Avatar helpers
//    ========================= */

// /**
//  * Busca a imagem de perfil do usuário e retorna um ObjectURL (string).
//  * @param {string} cacheKey - valor para bust de cache (ex.: localStorage.avatarUpdatedAt)
//  * @returns {Promise<string|null>} ObjectURL ou null
//  */
// export async function getProfileImageObjectURL(cacheKey = "0") {
//   const email = getUserEmail();
//   if (!email) return null;

//   const url = `${API_BASE}/api/profileImage/${encodeURIComponent(
//     email
//   )}?_v=${encodeURIComponent(cacheKey)}`;

//   try {
//     const resp = await axios.get(url, {
//       responseType: "blob",
//       headers: { "Cache-Control": "no-cache" },
//     });

//     if (resp.status === 200) {
//       return URL.createObjectURL(resp.data);
//     }
//     return null;
//   } catch (err) {
//     // 404 = sem imagem => retorna null silenciosamente
//     if (err?.response?.status === 404) return null;
//     console.error("Erro ao buscar a imagem de perfil:", err);
//     return null;
//   }
// }

// /** Revoga com segurança um ObjectURL previamente criado. */
// export function revokeObjectURLSafe(objectUrl) {
//   try {
//     if (objectUrl) URL.revokeObjectURL(objectUrl);
//   } catch {}
// }

// /* =========================
//    Setlists helpers
//    ========================= */

// export const SETLISTS_LS_KEY = "mySelectedSetlists";

// /** Lê as setlists selecionadas do localStorage. */
// export function loadSelectedSetlists() {
//   try {
//     const saved = localStorage.getItem(SETLISTS_LS_KEY);
//     const parsed = JSON.parse(saved);
//     return Array.isArray(parsed) ? parsed : [];
//   } catch {
//     return [];
//   }
// }

// /** Salva as setlists selecionadas no localStorage. */
// export function saveSelectedSetlists(arr) {
//   try {
//     localStorage.setItem(SETLISTS_LS_KEY, JSON.stringify(arr || []));
//   } catch {}
// }

// /**
//  * Busca no backend todas as setlists distintas do usuário logado.
//  * Retorna um array de strings (ordenado).
//  */
// export async function fetchDistinctSetlists() {
//   const email = getUserEmail();
//   if (!email) return [];

//   try {
//     const resp = await fetch(
//       `${API_BASE}/api/alldata/${encodeURIComponent(email)}`
//     );
//     const data = await resp.json();

//     const tags = new Set();
//     if (Array.isArray(data?.userdata)) {
//       data.userdata.forEach((song) => {
//         (song.setlist || []).forEach((t) => tags.add(t));
//       });
//     }
//     return Array.from(tags).sort();
//   } catch (error) {
//     console.error("Erro ao buscar setlists:", error);
//     return [];
//   }
// }

// /* =========================
//    Songs helpers
//    ========================= */

// export async function fetchUserSongs() {
//   const email = getUserEmail();
//   if (!email) {
//     return { songs: [], fullName: "", username: "" };
//   }

//   try {
//     const resp = await fetch(
//       `${API_BASE}/api/alldata/${encodeURIComponent(email)}`
//     );
//     const data = await resp.json();

//     const songs = (data.userdata || []).filter(
//       (item) =>
//         item.song?.trim() !== "" &&
//         item.artist?.trim() !== "" &&
//         item.progressBar !== undefined
//     );

//     const first = Array.isArray(data.userdata) ? data.userdata[0] ?? {} : {};
//     return {
//       songs,
//       fullName: first.fullName || "",
//       username: first.username || "",
//     };
//   } catch (error) {
//     console.error("Erro ao buscar músicas:", error);
//     return { songs: [], fullName: "", username: "" };
//   }
// }

// // --- Create New Song --------------------------------------------------
// /**
//  * Cria uma nova música no backend.
//  * @param {Object} params
//  * @param {string} params.songName
//  * @param {string} params.artistName
//  * @param {("guitar01"|"guitar02"|"bass"|"keys"|"drums"|"voice")} params.instrumentName
//  * @param {number} [params.geralPercentage=0]
//  * @param {string[]} [params.setlist=[]]
//  * @param {Object} [params.instrumentFields] - campos do instrumento ativo
//  * @param {boolean|string} [params.instrumentFields.active]
//  * @param {string} [params.instrumentFields.capo]
//  * @param {string} [params.instrumentFields.lastPlay]
//  * @param {string} [params.instrumentFields.link]
//  * @param {string|number} [params.instrumentFields.progress]
//  * @param {string} [params.instrumentFields.songCifra]
//  * @param {string} [params.instrumentFields.tuning]
//  * @param {string[]} [params.embedLink=[]]
//  * @returns {Promise<any>} response.data
//  */
// export async function createNewSongOnServer({
//   songName,
//   artistName,
//   instrumentName,
//   geralPercentage = 0,
//   setlist = [],
//   instrumentFields = {},
//   embedLink = [],
// }) {
//   const email =
//     typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

//   if (!email) {
//     throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
//   }
//   if (!songName || !artistName) {
//     throw new Error("songName e artistName são obrigatórios.");
//   }

//   // Flags dos instrumentos
//   const flags = {
//     guitar01: instrumentName === "guitar01",
//     guitar02: instrumentName === "guitar02",
//     bass: instrumentName === "bass",
//     keys: instrumentName === "keys",
//     drums: instrumentName === "drums",
//     voice: instrumentName === "voice",
//   };

//   // Helper para montar o bloco de cada instrumento
//   const block = (name) => ({
//     active: `${flags[name] ? instrumentFields.active ?? "" : ""}`,
//     capo: `${flags[name] ? instrumentFields.capo ?? "" : ""}`,
//     lastPlay: `${flags[name] ? instrumentFields.lastPlay ?? "" : ""}`,
//     link: `${flags[name] ? instrumentFields.link ?? "" : ""}`,
//     progress: `${flags[name] ? instrumentFields.progress ?? "" : ""}`,
//     songCifra: `${flags[name] ? instrumentFields.songCifra ?? "" : ""}`,
//     tuning: `${flags[name] ? instrumentFields.tuning ?? "" : ""}`,
//   });

//   const userdata = {
//     song: songName,
//     artist: artistName,
//     progressBar: geralPercentage || 0,
//     setlist,
//     instruments: { ...flags },
//     guitar01: block("guitar01"),
//     guitar02: block("guitar02"),
//     bass: block("bass"),
//     keys: block("keys"),
//     drums: block("drums"),
//     voice: block("voice"),
//     embedVideos: embedLink || [],
//     addedIn: new Date().toISOString().split("T")[0],
//     updateIn: new Date().toISOString().split("T")[0],
//     email,
//     username: "",
//     fullName: "",
//   };

//   const payload = {
//     databaseComing: "liveNloud_",
//     collectionComing: "data",
//     userdata,
//   };

//   const resp = await axios.post(
//     "https://api.live.eloygomes.com/api/newsong",
//     payload,
//     { headers: { "Content-Type": "application/json" } }
//   );

//   return resp.data;
// }

// // --- Upload Avatar ----------------------------------------------------
// /**
//  * Envia a imagem de perfil do usuário para o backend.
//  * @param {File|Blob} file
//  * @param {{ onProgress?: (percent:number)=>void }} [opts]
//  * @returns {Promise<import('axios').AxiosResponse>}
//  */
// export async function uploadProfileImage(file, opts = {}) {
//   const { onProgress } = opts;
//   const email =
//     typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

//   if (!email) {
//     throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
//   }
//   if (!file) {
//     throw new Error("Nenhum arquivo para upload.");
//   }

//   const formData = new FormData();
//   formData.append("profileImage", file);
//   formData.append("email", email);

//   // para não quebrar nada por causa do API_BASE (.com) do restante.
//   return axios.post(
//     "https://api.live.eloygomes.com/api/uploadProfileImage",
//     formData,
//     {
//       onUploadProgress: (e) => {
//         if (!e.total) return;
//         const percent = Math.round((e.loaded * 100) / e.total);
//         if (typeof onProgress === "function") onProgress(percent);
//       },
//       headers: {
//         // se você usa JWT no restante, já envia aqui também (não é obrigatório se seu endpoint não exigir)
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//       },
//     }
//   );
// }

// // --- Cifra: verificar existência e fazer scrape -----------------------

// /**
//  * Verifica se a cifra já existe no banco.
//  * Retorna:
//  *  - { exists: true, data } se 200
//  *  - { exists: false } se 404
//  *  - lança erro para outros status/erros de rede
//  */
// export async function checkCifraExists({ instrumentName, link }) {
//   try {
//     const res = await axios.get(
//       "https://api.live.eloygomes.com/api/generalCifra",
//       {
//         params: { instrument: instrumentName, link },
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       }
//     );
//     return { exists: true, data: res.data };
//   } catch (err) {
//     if (err?.response?.status === 404) return { exists: false };
//     throw err;
//   }
// }

// /**
//  * Solicita o scrape da cifra no backend.
//  * Lança erro se falhar.
//  */
// export async function scrapeCifra({
//   artist,
//   song,
//   email,
//   instrumentName,
//   progress,
//   link,
// }) {
//   const payload = {
//     artist,
//     song,
//     email,
//     instrument: instrumentName,
//     instrument_progressbar: progress,
//     link,
//   };

//   const res = await axios.post(
//     "https://api.live.eloygomes.com/api/scrape",
//     payload,
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//       },
//     }
//   );

//   return res.data;
// }

// axiosApi.interceptors.request.use((config) => {
//   const t =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   if (t) config.headers.Authorization = `Bearer ${t}`;
//   return config;
// });

// const INSTRUMENT_MAP = { keyboard: "keys", key: "keys" };
// const ALLOWED = ["guitar01", "guitar02", "bass", "keys", "drums", "voice"];

// function normalizeInstrumentX(i) {
//   const norm = (INSTRUMENT_MAP[i] || i || "").toLowerCase();
//   if (!ALLOWED.includes(norm)) {
//     throw new Error(
//       `Instrumento inválido: "${i}". Use um de: ${ALLOWED.join(", ")}.`
//     );
//   }
//   return norm;
// }

// /**
//  * Cria/atualiza uma cifra no banco geral.
//  * Retorna o objeto de resposta do backend.
//  */
// export async function saveToGeneralCifra({
//   song,
//   artist,
//   instrumentName, // ex: "guitar01"
//   link, // URL da cifra
//   songCifra = "", // texto da cifra
//   capo = "",
//   tuning = "",
//   embedVideos = [],
//   setlist = [],
//   email, // opcional: usa o do localStorage se não vier
// }) {
//   if (!song || !artist) {
//     throw new Error("song e artist são obrigatórios.");
//   }
//   const instr = normalizeInstrumentX(instrumentName);

//   // pega email salvo (se não vier por parâmetro)
//   const userEmail =
//     email ||
//     (typeof window !== "undefined" ? localStorage.getItem("userEmail") : "") ||
//     "";

//   // flags instruments
//   const instruments = {
//     guitar01: false,
//     guitar02: false,
//     bass: false,
//     keys: false,
//     drums: false,
//     voice: false,
//     [instr]: true,
//   };

//   // subdoc do instrumento ativo
//   const activeInstrumentDoc = {
//     link: link || "",
//     songCifra: songCifra || "",
//     capo: capo || "",
//     tuning: tuning || "",
//     // NADA de "progress" aqui (o backend ignora/limpa de qualquer forma)
//   };

//   const payload = {
//     song,
//     artist,
//     instruments,
//     [instr]: activeInstrumentDoc,
//     embedVideos: Array.isArray(embedVideos) ? embedVideos : [],
//     setlist: Array.isArray(setlist) ? setlist : [],
//     email: userEmail,
//   };

//   try {
//     const { data } = await axiosApi.post("/api/generalCifra", payload);
//     return data; // 201 criado | 200 atualizado
//   } catch (err) {
//     // repassa info útil p/ o caller
//     const status = err?.response?.status;
//     const msg = err?.response?.data?.message || err.message;
//     console.error("[saveToGeneralCifra]", status, msg, err?.response?.data);
//     throw err;
//   }
// }

// Controllers.js
import axios from "axios";

/* =========================
   Config & HTTP client
   ========================= */

const API_BASE = "https://api.live.eloygomes.com";

const axiosApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// lê token “na hora”
axiosApi.interceptors.request.use((config) => {
  const t =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Alias para compatibilidade (alguns trechos usam `api`)
export const api = axiosApi;

/* =========================
   Helpers
   ========================= */

const INSTRUMENT_MAP = { keyboard: "keys", key: "keys" };
const ALLOWED_INSTRUMENTS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];

function normalizeInstrument(i) {
  const norm = (INSTRUMENT_MAP[i] || i || "").toLowerCase();
  return ALLOWED_INSTRUMENTS.includes(norm) ? norm : null;
}

const getUserEmail = () =>
  (typeof window !== "undefined" && localStorage.getItem("userEmail")) || null;

/** Normaliza link como no backend (host sem www, minúsculo, sem barra final). */
export function normalizeLink(u) {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, ""); // remove barra final
    return `${host}${path}`;
  } catch {
    return String(u)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

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
  const email = getUserEmail();
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
      `Instrumento inválido: "${instrument}". Use um de: ${ALLOWED_INSTRUMENTS.join(
        ", "
      )}.`
    );
  }

  const payload = { email, song, artist, instrument: normalizedInstrument };

  try {
    const { data } = await axiosApi.put("/api/lastPlay", payload);
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
    if (err?.response?.status === 404) return null; // sem imagem
    console.error("Erro ao buscar a imagem de perfil:", err);
    return null;
  }
}

export function revokeObjectURLSafe(objectUrl) {
  try {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  } catch {
    // intentionally empty: safe to ignore errors here
  }
}

/* =========================
   Setlists helpers
   ========================= */

export const SETLISTS_LS_KEY = "mySelectedSetlists";

export function loadSelectedSetlists() {
  try {
    const saved = localStorage.getItem(SETLISTS_LS_KEY);
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSelectedSetlists(arr) {
  try {
    localStorage.setItem(SETLISTS_LS_KEY, JSON.stringify(arr || []));
  } catch {
    // intentionally empty: safe to ignore errors here
  }
}

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

/* =========================
   Create New Song (user DB)
   ========================= */

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

  const flags = {
    guitar01: instrumentName === "guitar01",
    guitar02: instrumentName === "guitar02",
    bass: instrumentName === "bass",
    keys: instrumentName === "keys",
    drums: instrumentName === "drums",
    voice: instrumentName === "voice",
  };

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

  const resp = await axiosApi.post("/api/newsong", payload);
  return resp.data;
}

/* =========================
   Upload Avatar
   ========================= */

export async function uploadProfileImage(file, opts = {}) {
  const { onProgress } = opts;
  const email =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }
  if (!file) {
    throw new Error("Nenhum arquivo para upload.");
  }

  const formData = new FormData();
  formData.append("profileImage", file);
  formData.append("email", email);

  return axios.post(`${API_BASE}/api/uploadProfileImage`, formData, {
    onUploadProgress: (e) => {
      if (!e.total) return;
      const percent = Math.round((e.loaded * 100) / e.total);
      if (typeof onProgress === "function") onProgress(percent);
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });
}

/* =========================
   Cifra: rotas
   ========================= */

/** Checa se a cifra já existe no banco geral (usa link normalizado). */
export async function checkCifraExists({ instrumentName, link }) {
  const linkNorm = normalizeLink(link);
  console.log("[checkCifraExists] →", { instrumentName, link, linkNorm });

  try {
    const res = await axiosApi.get("/api/generalCifra", {
      params: { instrument: instrumentName, link: linkNorm },
    });
    console.log("[checkCifraExists] ✔ encontrado:", res.data);
    return { exists: true, data: res.data };
  } catch (err) {
    if (err?.response?.status === 404) {
      console.log("[checkCifraExists] ✖ 404 (não encontrado)");
      return { exists: false };
    }
    console.error("[checkCifraExists] ⚠ erro:", {
      status: err?.response?.status,
      data: err?.response?.data,
      msg: err?.message,
    });
    throw err;
  }
}

/** Dispara o scraper e envia também `linkNorm` (com logs). */
export async function scrapeCifra({
  artist,
  song,
  email,
  instrumentName,
  progress,
  link,
}) {
  const linkNorm = normalizeLink(link);
  const payload = {
    artist,
    song,
    email,
    instrument: instrumentName,
    instrument_progressbar: progress,
    link,
    linkNorm,
  };

  console.log("[scrapeCifra] → payload", payload);

  const res = await axiosApi.post("/api/scrape", payload);

  console.log("[scrapeCifra] ← resposta", {
    status: res.status,
    data: res.data,
  });

  return res.data;
}

/** Cria/atualiza no banco geral manualmente (se precisar). */
export async function saveToGeneralCifra({
  song,
  artist,
  instrumentName, // "guitar01" | "guitar02" | ...
  link,
  songCifra = "",
  capo = "",
  tuning = "",
  embedVideos = [],
  setlist = [],
  email, // opcional: usa localStorage se ausente
}) {
  if (!song || !artist) {
    throw new Error("song e artist são obrigatórios.");
  }

  const instr = normalizeInstrument(instrumentName);
  if (!instr) {
    throw new Error(
      `Instrumento inválido: "${instrumentName}". Use um de: ${ALLOWED_INSTRUMENTS.join(
        ", "
      )}.`
    );
  }

  const userEmail =
    email ||
    (typeof window !== "undefined" ? localStorage.getItem("userEmail") : "") ||
    "";

  const instruments = {
    guitar01: false,
    guitar02: false,
    bass: false,
    keys: false,
    drums: false,
    voice: false,
    [instr]: true,
  };

  const activeInstrumentDoc = {
    link: link || "",
    songCifra: songCifra || "",
    capo: capo || "",
    tuning: tuning || "",
  };

  const payload = {
    song,
    artist,
    instruments,
    [instr]: activeInstrumentDoc,
    embedVideos: Array.isArray(embedVideos) ? embedVideos : [],
    setlist: Array.isArray(setlist) ? setlist : [],
    email: userEmail,
  };

  try {
    const { data } = await axiosApi.post("/api/generalCifra", payload);
    return data; // 201 criado | 200 atualizado
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err.message;
    console.error("[saveToGeneralCifra]", status, msg, err?.response?.data);
    throw err;
  }
}

// ✅ 1) Exportar um alias compatível com o que o componente espera
export { updateUserName as updateUsername };

// ✅ 2) Implementar updatePassword e exportar
/**
 * Atualiza a senha do usuário.
 * Ajuste a URL conforme o seu backend:
 *   - comum:  /api/updatePassword
 *   - ou:     /api/auth/updatePassword
 */
export async function updatePassword({ email, currentPassword, newPassword }) {
  if (!email) {
    // lê do localStorage se não vier por parâmetro
    email =
      (typeof window !== "undefined" && localStorage.getItem("userEmail")) ||
      null;
  }
  if (!email) throw new Error("Email do usuário não encontrado.");

  const payload = { email, currentPassword, newPassword };

  // 👉 Se sua rota for /api/updatePassword, troque abaixo:
  const url = "/api/auth/updatePassword";

  const { data } = await axiosApi.put(url, payload);
  return data;
}
