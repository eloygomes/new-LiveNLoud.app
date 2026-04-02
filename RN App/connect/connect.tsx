// Get list of music

const API_BASE_URL = "https://api.live.eloygomes.com/api";

type Props = {
  email: string;
  artist: string;
  song: string;
};

export const getListOfMusic = async ({ email }: Props) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alldata/${email}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
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

    return Array.isArray(data) ? data : [];
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
