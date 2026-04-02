import AsyncStorage from "@react-native-async-storage/async-storage";

// Get list of music

const API_BASE_URL = "https://api.live.eloygomes.com/api";
const AUTH_TOKEN_KEY = "token";
const USER_EMAIL_KEY = "userEmail";

type Props = {
  email: string;
  artist: string;
  song: string;
};

type SignUpPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
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

function createDefaultUserdata(email: string, username: string, fullName: string) {
  const today = new Date().toISOString().split("T")[0];

  return {
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
    addedIn: today,
    updateIn: today,
    email,
    username,
    fullName,
  };
}

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function persistAuthSession(accessToken: string, email: string) {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, accessToken],
    [USER_EMAIL_KEY, email],
  ]);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_EMAIL_KEY]);
}

export async function getStoredUserEmail() {
  return AsyncStorage.getItem(USER_EMAIL_KEY);
}

export function loadSelectedSetlists() {
  return AsyncStorage.getItem("mySelectedSetlists")
    .then((value) => {
      if (!value) return [];
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    })
    .catch(() => []);
}

export function saveSelectedSetlists(setlists: string[]) {
  return AsyncStorage.setItem("mySelectedSetlists", JSON.stringify(setlists ?? []));
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
    }),
  });

  const data = await readJsonOrThrow(response);
  const accessToken = data?.accessToken;

  if (!accessToken) {
    throw new Error("Resposta de login invalida.");
  }

  await persistAuthSession(accessToken, normalizedEmail);
  return data;
}

export async function signUp({
  fullName,
  username,
  email,
  password,
}: SignUpPayload) {
  const normalizedEmail = email.trim().toLowerCase();

  const authResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
    }),
  });

  await readJsonOrThrow(authResponse);

  const userdata = createDefaultUserdata(
    normalizedEmail,
    username.trim(),
    fullName.trim()
  );

  const userResponse = await fetch(`${API_BASE_URL}/newsong`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      databaseComing: "liveNloud_",
      collectionComing: "data",
      userdata,
    }),
  });

  return readJsonOrThrow(userResponse);
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });

  return readJsonOrThrow(response);
}

export async function resetPassword({
  email,
  token,
  newPassword,
}: ResetPasswordPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      newPassword,
    }),
  });

  return readJsonOrThrow(response);
}

export async function updateUserSetlists(setlists: string[]) {
  const email = await getStoredUserEmail();

  if (!email) {
    throw new Error("Usuário não autenticado.");
  }

  const response = await fetch(`${API_BASE_URL}/updateSetlists`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      setlists,
    }),
  });

  return readJsonOrThrow(response);
}

export const getListOfMusic = async ({ email }: Props) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alldata/${email}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data?.userdata) ? data.userdata : [];
  } catch (error) {
    console.error("Erro ao buscar lista de músicas:", error);
    return [];
  }
};

export const getAllUserData = async ({ email }: Props) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alldata/${email}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data?.userdata) ? data.userdata : [];
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    return [];
  }
};

export const getSpecificSongData = async ({ email, artist, song }: Props) => {
  try {
    const response = await fetch(`${API_BASE_URL}/allsongdata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, artist, song }),
    });

    if (!response.ok) {
      const { message } = await response.json();
      throw new Error(message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados da música:", error);
    throw error; // repassa para quem chamou, se quiser tratar lá
  }
};
