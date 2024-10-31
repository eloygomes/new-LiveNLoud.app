/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import userPerfil from "../../assets/userPerfil.jpg";
import UserProfileAvatarBig from "./UserProfileAvatarBig";
import { requestData } from "../../Tools/Controllers";
import PasswordResetModal from "./PasswordResetModal";
import {
  sendPasswordReset,
  reauthenticateUser,
  changeUserPassword,
} from "../../authFunctions";
import UsernameEditModal from "./UsernameEditModal";

function UserProfile() {
  const [data, setData] = useState([]);
  const [getFullName, setGetFullName] = useState("");
  const [getUsername, setGetUsername] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userPerfil);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // Estado para controlar a atualização da imagem
  const [imageUpdated, setImageUpdated] = useState(0);
  // estado para o modal de username
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await requestData(localStorage.getItem("userEmail"));
        const parsedResult = JSON.parse(result);

        setGetFullName(parsedResult[0].fullName);
        setGetUsername(parsedResult[0].username);
        localStorage.setItem("username", parsedResult[0].username);

        if (Array.isArray(parsedResult)) {
          const filteredData = parsedResult.filter(
            (item) =>
              item.instruments &&
              Object.values(item.instruments).some((val) => val === true)
          );
          setData(filteredData);
        } else {
          console.error("Unexpected data structure:", parsedResult);
        }

        // Não é mais necessário definir previewUrl aqui, pois o UserProfileAvatar gerencia isso
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleEditPasswordClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEditUsernameClick = () => {
    setIsUsernameModalOpen(true); // Abre o modal de edição de username
  };

  const handleUsernameSubmit = async (newUsername) => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      await axios.put(
        "https://www.api.live.eloygomes.com.br/api/updateUsername",
        {
          email: userEmail,
          newUsername,
        }
      );
      setGetUsername(newUsername); // Atualiza o estado com o novo nome de usuário
      alert("Username atualizado com sucesso!");
      setIsUsernameModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar o nome de usuário:", error);
      alert("Erro ao atualizar o nome de usuário.");
    }
  };

  const handlePasswordSubmit = async (oldPassword, newPassword) => {
    try {
      // Verifique se o usuário foi autenticado com a senha antiga
      await reauthenticateUser(oldPassword);
      // Atualize a senha para a nova senha
      await changeUserPassword(newPassword);
      alert("Senha alterada com sucesso!");
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao alterar a senha:", error);
      if (error.code === "auth/wrong-password") {
        alert("A senha antiga está incorreta.");
      } else {
        alert("Ocorreu um erro ao tentar alterar a senha.");
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validação do tipo de arquivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setUploadError("Apenas imagens JPG, JPEG, PNG e GIF são permitidas.");
        return;
      }

      // Validação do tamanho do arquivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setUploadError("O tamanho da imagem não deve exceder 5MB.");
        return;
      }

      setSelectedFile(file);
      setUploadError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Por favor, selecione uma imagem para upload.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", selectedFile);

    // Obter o email do usuário do localStorage ou de outra fonte de autenticação
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      throw new Error("Email do usuário não encontrado.");
    }

    // Adicionar o email ao FormData
    formData.append("email", userEmail);

    try {
      setUploading(true);
      setUploadError("");

      const response = await axios.post(
        "https://api.live.eloygomes.com.br/api/uploadProfileImage",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        alert("Imagem enviada com sucesso!");

        // Atualizar o estado para notificar o UserProfileAvatar
        setImageUpdated((prev) => prev + 1);

        // Limpar o arquivo selecionado e o previewUrl
        setSelectedFile(null);
        setPreviewUrl(userPerfil);

        // Forçar o reload da página para garantir que a imagem seja atualizada em todos os componentes
        window.location.reload();
      } else {
        setUploadError("Erro ao enviar a imagem.");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      setUploadError(
        error.response?.data?.message || "Erro ao enviar a imagem."
      );
    } finally {
      setUploading(false);
    }
  };

  // Verifique se data[0] existe antes de renderizar o conteúdo
  if (!data[0]) {
    return (
      <div className="flex justify-center h-screen pt-20">
        <div className="container mx-auto">
          <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
            <div className="flex flex-row my-5 neuphormism-b p-5">
              <h1 className="text-4xl font-bold">User profile</h1>
              <h4 className="ml-auto mt-auto text-sm">Edit your data</h4>
            </div>
            <div className="flex flex-row neuphormism-b p-5">
              <div className="flex flex-col justify-center items-center w-full p-5">
                <h2 className="text-md font-bold my-2 p-2">Loading...</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log(data);

  return (
    <div className="flex justify-center h-screen pt-20">
      <PasswordResetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handlePasswordSubmit} // Passa oldPassword e newPassword
      />
      <UsernameEditModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
      />
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">User profile</h1>
            <h4 className="ml-auto mt-auto text-sm">Edit your data</h4>
          </div>
          <div className="flex flex-row neuphormism-b p-5">
            <div className="flex flex-col justify-between w-1/2 p-5">
              <div className="flex flex-row">
                <div className="flex flex-row p-1 ">
                  <div className="flex flex-col justify-center items-start w-full p-1">
                    <h2 className="text-md font-bold my-2 p-2">
                      Select your profile image
                    </h2>
                    <div className="flex flex-row justify-between">
                      <div className="flex flex-row w-2/3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden w-1/2"
                          id="profileImage"
                        />
                        <label
                          htmlFor="profileImage"
                          className="cursor-pointer"
                        >
                          {/* A imagem será atualizada automaticamente quando upload for realizado */}
                          <UserProfileAvatarBig
                            size={200}
                            imageUpdated={imageUpdated}
                          />
                        </label>
                      </div>
                      <div className="flex flex-col w-1/3">
                        <button
                          onClick={handleUpload}
                          className="neuphormism-b-btn mr-6 p-2 mt-16 mb-5"
                          disabled={uploading}
                        >
                          {uploading ? "Enviando..." : "Upload"}
                        </button>
                        {uploadError && (
                          <p className="text-red-500 text-sm mt-2">
                            {uploadError}
                          </p>
                        )}
                        <p className="text-[10px] ">
                          Clique para selecionar e fazer upload! As imagens de
                          avatar precisam estar em um formato válido como JPG,
                          JPEG, GIF e ter no máximo 500x500px.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-md font-bold my-2 p-2">User Data</h2>
              <div className="flex flex-col">
                <div className="text-sm mt-2 pt-2 pl-2">user name</div>
                <div className="flex flex-row justify-between py-3">
                  <div className=" text-md  pb-2 pl-2">
                    {getUsername || "N/A"}
                  </div>
                  <div className="flex items-center justify-center  bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
                    <div onClick={handleEditUsernameClick}>
                      <FaEdit className="text-gray-600 text-lg" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm flex flex-col">
                <div className=" mt-2 pt-2 pl-2">user email</div>
                <div className="flex flex-row justify-between py-3">
                  <div className=" text-md  pb-2 pl-2">
                    {data[0]?.email || "N/A"}
                  </div>
                </div>
              </div>
              <div className="text-sm flex flex-col">
                <div className=" mt-2 pt-2 pl-2">password</div>
                <div className="flex flex-row justify-between py-3">
                  <div className=" text-md  pb-2 pl-2">***********</div>
                  <div className=" text-md  ">
                    <div className="flex items-center justify-center  bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
                      <div onClick={handleEditPasswordClick}>
                        <FaEdit className="text-gray-600 text-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-between">
                <div className="text-sm flex flex-col">
                  <div className=" mt-2 pt-2 pl-2">Added in</div>
                  <div className="flex flex-row justify-between py-3">
                    <div className=" text-md  pb-2 pl-2">
                      {data[0]?.addedIn || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="text-sm flex flex-col">
                  <div className="mt-2 pt-2 pl-2">Last time played</div>
                  <div className="flex flex-row justify-end py-3">
                    <div className="text-md pb-2 pl-2">
                      {(() => {
                        if (!data || data.length === 0) return "N/A";

                        const instrumentNames = [
                          "guitar01",
                          "guitar02",
                          "bass",
                          "keys",
                          "drums",
                          "voice",
                        ];

                        const allLastPlayDates = [];

                        data.forEach((entry) => {
                          instrumentNames.forEach((instrument) => {
                            let lastPlay = entry[instrument]?.lastPlay;
                            if (lastPlay) {
                              if (Array.isArray(lastPlay)) {
                                // lastPlay é um array
                                lastPlay.forEach((lp) => {
                                  let date;
                                  if (
                                    typeof lp === "string" ||
                                    typeof lp === "number" ||
                                    lp instanceof Date
                                  ) {
                                    date = new Date(lp);
                                  } else if (lp && lp["$date"]) {
                                    date = new Date(lp["$date"]);
                                  }
                                  if (date && !isNaN(date)) {
                                    allLastPlayDates.push(date);
                                  }
                                });
                              } else {
                                // lastPlay é um único valor
                                let date;
                                if (
                                  typeof lastPlay === "string" ||
                                  typeof lastPlay === "number" ||
                                  lastPlay instanceof Date
                                ) {
                                  date = new Date(lastPlay);
                                } else if (lastPlay && lastPlay["$date"]) {
                                  date = new Date(lastPlay["$date"]);
                                }
                                if (date && !isNaN(date)) {
                                  allLastPlayDates.push(date);
                                }
                              }
                            }
                          });
                        });

                        if (allLastPlayDates.length === 0) {
                          return "N/A";
                        }

                        const mostRecentDate = new Date(
                          Math.max(
                            ...allLastPlayDates.map((date) => date.getTime())
                          )
                        );

                        return mostRecentDate.toLocaleString();
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-md font-bold my-2 p-2">Progression</h2>
              <div className="flex flex-row justify-between">
                <h2 className="text-md p-2">average progression</h2>
                <h2 className="text-md p-2">
                  {data[0]?.averageProgression || "0%"}
                </h2>
              </div>

              <div className="flex flex-row justify-between">
                <h2 className="text-md font-bold my-2 px-2 pt-5">
                  Songs by instruments
                </h2>
              </div>

              <div className="flex flex-row justify-between">
                <h2 className="text-sm p-2">Guitar 01</h2>
                <h2 className="text-sm p-2">
                  {data[0]?.songsByInstrument?.guitar01 || "0"} songs
                </h2>
              </div>
              {/* Repita para os outros instrumentos, usando data[0]?.songsByInstrument?.instrumento */}
            </div>
            <div className="flex flex-col justify-start w-1/2 p-5">
              <h2 className="text-md font-bold my-2 p-2">Logs</h2>
              {/* Exemplo de como renderizar logs se estiverem disponíveis */}
              {data[0]?.logs?.length > 0 ? (
                data[0].logs.map((log, index) => (
                  <div className="flex flex-row justify-between" key={index}>
                    <h2 className="text-[10pt] p-2 w-1/2">{log.message}</h2>
                    <h2 className="text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                      {log.time}
                    </h2>
                  </div>
                ))
              ) : (
                <div className="flex flex-row justify-between">
                  <h2 className="text-[10pt] p-2">No logs available</h2>
                </div>
              )}
              <h2 className="text-md font-bold mb-2 mt-5 p-2">User Settings</h2>
              <div className="flex flex-row justify-between">
                <h2 className="text-sm py-5 px-2 w-1/2">Language</h2>
                <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn">
                    ENG 🇺🇸
                  </button>
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn">
                    BRA 🇧🇷
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">User Data</h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-5 px-2 w-1/2">All user data</h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This contains all data from user that was stored by the
                    platform
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn">
                    Download
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">
                Platform User Data
              </h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-5 px-2 w-1/2">All user data</h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This contains all data from user that was stored by the
                    platform (like all songs, playlists, etc.)
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold">
                    Delete
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">User Account</h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-5 px-2 w-1/2 truncate">
                    Delete user account
                  </h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This will delete all data from user account contained on the
                    platform; this cannot be undone
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  <button className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
