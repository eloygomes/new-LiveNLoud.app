import axios from "axios";

// LocalStorage user email
const userEmail = localStorage.getItem("userEmail");

export const requestData = async (email) => {
  try {
    const response = await axios.get(
      `https://api.live.eloygomes.com.br/api/alldata/${email}`
    );
    const dataFromUrlNAKED = JSON.stringify(response.data);
    return dataFromUrlNAKED;
  } catch (error) {
    console.error("Error fetching song data:", error);
  }
};

export const fetchAllSongData = async (email, artist, song) => {
  const url = "https://api.live.eloygomes.com.br/api/allsongdata";

  try {
    const response = await axios.post(url, {
      email: email,
      artist: artist,
      song: song,
    });
    const songData = response.data;
    return JSON.stringify(songData);
  } catch (error) {
    console.error(`Error fetching song data from ${url}`, error);
    throw error; // Re-throwing the error if you want to handle it outside this function
  }
};

export const deleteOneSong = async (artist, song) => {
  const url = "https://api.live.eloygomes.com.br/api/deleteonesong";
  try {
    const response = await axios.post(url, {
      email: userEmail,
      artist: artist,
      song: song,
    });
    const songData = response.data;
    return JSON.stringify(songData);
  } catch (error) {
    console.error(`Error fetching song data from ${url}`, error);
    throw error; // Re-throwing the error if you want to handle it outside this function
  }
};

export const allDataFromOneSong = async (artist, song) => {
  const url = "https://api.live.eloygomes.com.br/api/allsongdata";
  try {
    const response = await axios.post(url, {
      email: userEmail,
      artist: artist,
      song: song,
    });
    const songData = response.data;
    return JSON.stringify(songData);
  } catch (error) {
    console.error(`Error fetching song data from ${url}`, error);
    throw error; // Re-throwing the error if you want to handle it outside this function
  }
};

// Função para atualizar os dados da música
export const updateSongData = async (updatedData) => {
  const userEmail = localStorage.getItem("userEmail"); // Pegando o email do usuário
  const artist = localStorage.getItem("artist");
  const song = localStorage.getItem("song");

  console.log("updatedData", updatedData);
  console.log("CONTROLLERS", userEmail, artist, song, updatedData);

  const payload = {
    userdata: {
      email: userEmail,
      artist: artist,
      song: song,
      ...updatedData, // Agora os dados são passados diretamente dentro de userdata
    },
    databaseComing: "liveNloud_", // Nome do banco de dados
    collectionComing: "data", // Nome da coleção
  };

  try {
    const response = await axios.post(
      "https://api.live.eloygomes.com.br/api/newsong", // Atualizado para a rota correta
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating song data:", error);
    throw error;
  }
};

export const updateUserName = async (newName) => {
  const payload = {
    email: userEmail,
    newUsername: newName,
  };

  try {
    const response = await axios.put(
      "https://api.live.eloygomes.com.br/api/updateUsername", // Atualizado para a rota correta
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating song data:", error);
    throw error;
  }
};

export const updateLastPlayed = async (song, artist, instrument) => {
  const payload = {
    email: userEmail,
    song: song,
    artist: artist,
    instrument: instrument,
  };

  try {
    const response = await axios.put(
      "https://api.live.eloygomes.com.br/api/lastPlay",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating song data:", error);
    throw error;
  }
};

// New function to download user data
export const downloadUserData = async () => {
  try {
    const response = await axios.get(
      `https://api.live.eloygomes.com.br/api/downloadUserData/${userEmail}`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/json" });
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

// New function to delete all users songs
export const deleteAllUserSongs = async () => {
  const url = "https://api.live.eloygomes.com.br/api/deleteAllUserSongs";

  try {
    const response = await axios.post(url, { email: userEmail });

    const result = response.data;
    return result;
  } catch (error) {
    console.error(
      `Error deleting songs:`,
      error.response?.data?.message || error.message
    );
    throw error;
  }
};

// Função para deletar a conta completa do usuário
export const deleteUserAccount = async () => {
  const url = "https://api.live.eloygomes.com.br/api/deleteUserAccount";

  try {
    const response = await axios.post(url, { email: userEmail });

    const result = response.data;
    return result;
  } catch (error) {
    console.error(
      `Erro ao deletar a conta do usuário:`,
      error.response?.data?.message || error.message
    );
    throw error;
  }
};
