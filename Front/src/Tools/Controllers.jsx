import axios from "axios";

// LocalStorage user email
const userEmail = localStorage.getItem("userEmail");

export const requestData = async () => {
  try {
    const response = await axios.get(
      `https://www.api.live.eloygomes.com.br/api/data/${userEmail}`
    );
    const dataFromUrlNAKED = JSON.stringify(response.data);
    return dataFromUrlNAKED;
  } catch (error) {
    console.error("Error fetching song data:", error);
    console.log("aqui tbm");
  }
};
