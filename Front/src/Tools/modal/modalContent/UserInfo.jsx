// src/components/User/UserInfo.jsx
import { useState } from "react";
import axios from "axios";
import UserProfileAvatarBig from "../../../Pages/UserProfile/UserProfileAvatarBig";
import { FaEdit } from "react-icons/fa";
import userPerfil from "../../../assets/userPerfil.jpg";

export default function UserInfo() {
  const [imageUpdated, setImageUpdated] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // %
  const [statusMsg, setStatusMsg] = useState(""); // mensagens p/ usuário

  const [getUsername, setGetUsername] = useState("");
  const [data, setData] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userPerfil);

  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // validações
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Apenas imagens JPG, JPEG, PNG e GIF são permitidas.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("O tamanho da imagem não deve exceder 5MB.");
      return;
    }

    setSelectedFile(file);
    setUploadError("");

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    // inicia upload automaticamente
    handleUpload(file);
  };

  const handleUpload = async (fileArg) => {
    const file = fileArg ?? selectedFile;
    if (!file) {
      setStatusMsg("Selecione uma imagem primeiro.");
      return;
    }

    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setUploadError("Email do usuário não encontrado.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.append("email", userEmail);

    try {
      setUploading(true);
      setUploadError("");
      setStatusMsg("Enviando...");
      setUploadProgress(0);

      const resp = await axios.post(
        "https://api.live.eloygomes.com.br/api/uploadProfileImage",
        formData,
        {
          onUploadProgress: (e) => {
            if (!e.total) return;
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(percent);
            setStatusMsg(`Enviando... ${percent}%`);
          },
        }
      );

      if (resp.status === 200) {
        // Marca versão nova e força re-render sem fechar o modal
        const ts = Date.now();
        localStorage.setItem("avatarUpdatedAt", String(ts));
        setImageUpdated((n) => n + 1);
        setStatusMsg("Upload concluído!");
        setSelectedFile(null);
        setPreviewUrl(userPerfil);
      } else {
        setUploadError("Erro ao enviar a imagem.");
        setStatusMsg("");
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      setUploadError(
        err?.response?.data?.message || "Erro ao enviar a imagem."
      );
      setStatusMsg("");
    } finally {
      setUploading(false);
    }
  };

  const handleEditUsernameClick = () => setIsUsernameModalOpen(true);
  const handleEditPasswordClick = () => setIsModalOpen(true);

  return (
    <>
      <div className="flex flex-col justify-between p-2">
        {/* Seção de imagem de perfil */}
        {/* Seção de imagem de perfil */}
        <div className="flex flex-row">
          <div className="flex flex-row w-full">
            <div className="flex flex-col justify-center w-full">
              <h2 className="text-md font-bold">Select your profile image</h2>

              <div className="mt-2 flex items-center gap-6">
                {/* Input oculto */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profileImage"
                />

                {/* >>> ALVO CLICÁVEL = O PRÓPRIO CÍRCULO <<< */}
                <label
                  htmlFor="profileImage"
                  className="
                            block
                            w-[200px] h-[200px]
                            rounded-full overflow-hidden
                            ring-2 ring-blue-300/60 hover:ring-blue-400
                            cursor-pointer
                            relative
                            "
                  aria-label="Selecionar imagem de perfil"
                  title="Selecionar imagem de perfil"
                >
                  {/* avatar renderiza preenchendo o círculo */}
                  <UserProfileAvatarBig
                    size={200}
                    imageUpdated={imageUpdated}
                  />

                  {/* overlay opcional durante upload */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                      <span className="text-white text-sm mb-2">
                        {statusMsg || "Enviando..."}
                      </span>
                      <div className="w-4/5 h-2 bg-white/40 rounded">
                        <div
                          className="h-2 bg-white rounded transition-[width]"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </label>

                {/* Painel de mensagens à direita: alinhado e “colado” no avatar */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-col justify-center h-[200px]">
                    {/* status principal */}
                    <p className="text-sm text-gray-700">
                      {uploading
                        ? statusMsg || "Enviando..."
                        : "Clique no avatar para selecionar e enviar."}
                    </p>

                    {/* barra de progresso fora do overlay (mostra mesmo sem hover) */}
                    {uploading && (
                      <div className="mt-2 w-full max-w-xs">
                        <div className="w-full h-2 bg-gray-200 rounded">
                          <div
                            className="h-2 rounded bg-gradient-to-r from-gray-400 to-gray-600 transition-[width]"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* erros */}
                    {uploadError && (
                      <p className="mt-2 text-sm text-red-500">{uploadError}</p>
                    )}

                    {/* dicas */}
                    <p className="mt-3 text-[10px] leading-snug text-gray-500 max-w-xs">
                      As imagens de avatar precisam estar em um formato válido
                      (JPG, JPEG, PNG, GIF) e ter no máximo 500x500px.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de dados do usuário */}
        <h2 className="text-md font-bold my-2 p-2">User Data</h2>

        <div className="flex flex-col">
          <div className="text-sm mt-2 pt-2 pl-2">user name</div>
          <div className="flex flex-row justify-between py-3">
            <div className="text-md pb-2 pl-2">
              {localStorage.getItem("fullName") || "N/A"}
            </div>
            <div className="flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
              <div onClick={handleEditUsernameClick}>
                <FaEdit className="text-gray-600 text-lg" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm mt-2 pt-2 pl-2">user name</div>
        <div className="flex flex-row justify-between py-3">
          <div className="text-md pb-2 pl-2">
            @{localStorage.getItem("username")}
          </div>
          <div className="flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
            <div onClick={handleEditUsernameClick}>
              <FaEdit className="text-gray-600 text-lg" />
            </div>
          </div>
        </div>

        <div className="text-sm flex flex-col">
          <div className="mt-2 pt-2 pl-2">user email</div>
          <div className="flex flex-row justify-between py-3">
            <div className="text-md pb-2 pl-2">
              {localStorage.getItem("userEmail")}
            </div>
          </div>
        </div>

        <div className="text-sm flex flex-col">
          <div className="mt-2 pt-2 pl-2">password</div>
          <div className="flex flex-row justify-between py-3">
            <div className="text-md pb-2 pl-2">***********</div>
            <div className="text-md">
              <div className="flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer">
                <div onClick={handleEditPasswordClick}>
                  <FaEdit className="text-gray-600 text-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
