import axios from "axios";

// LocalStorage user email
const userEmail = localStorage.getItem("userEmail");

export const requestData = async () => {
  try {
    const response = await axios.get(
      `https://www.api.live.eloygomes.com.br/api/alldata/${userEmail}`
    );
    const dataFromUrlNAKED = JSON.stringify(response.data);
    return dataFromUrlNAKED;
  } catch (error) {
    console.error("Error fetching song data:", error);
  }
};

export const fetchAllSongData = async (email, artist, song) => {
  const url = "https://www.api.live.eloygomes.com.br/api/allsongdata";
  // console.log("CONTROLLERS", url, email, artist, song);
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
  const url = "https://www.api.live.eloygomes.com.br/api/deleteonesong";
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
