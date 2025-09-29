/* eslint-disable react/prop-types */
// src/components/User/UserInfo.jsx
import { useEffect, useState } from "react";
import UserProfileAvatarBig from "@/Pages/UserProfile/UserProfileAvatarBig";
import { FaEdit } from "react-icons/fa";
import userPerfil from "@/assets/userPerfil.jpg";
import {
  uploadProfileImage,
  updateUsername,
  updatePassword,
} from "@/Tools/Controllers";

/* ===========================================================
   Reusable Modal Base
   =========================================================== */
function BaseModal({ isOpen, title, children, onClose }) {
  // fecha com ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ===========================================================
   Username Modal
   =========================================================== */
function UsernameModal({ isOpen, onClose, onSaved, currentUsername }) {
  const [value, setValue] = useState(currentUsername || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(currentUsername || "");
      setErr("");
      setOk("");
      setLoading(false);
    }
  }, [isOpen, currentUsername]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setOk("");

    const trimmed = (value || "").trim();
    if (!trimmed) {
      setErr("O nickname não pode ficar vazio.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(trimmed)) {
      setErr("Use 3-20 caracteres: letras, números, . _ -");
      return;
    }

    const email = localStorage.getItem("userEmail");
    if (!email) {
      setErr("Email do usuário não encontrado no dispositivo.");
      return;
    }

    try {
      setLoading(true);
      // >>> ajuste aqui se o seu controller tiver assinatura diferente
      // await updateUsername({ email, username: trimmed });
      await updateUsername(trimmed);
      localStorage.setItem("username", trimmed);
      setOk("Nickname atualizado com sucesso!");
      onSaved?.(trimmed);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Falha ao atualizar nickname."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Editar nickname">
      <form onSubmit={handleSubmit} className="space-y-3 ">
        <label className="block text-sm font-medium text-gray-700">
          Novo nickname
        </label>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-600 "
          placeholder="ex.: eloy_gomes"
          disabled={loading}
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-emerald-600">{ok}</p>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

/* ===========================================================
   Password Modal
   =========================================================== */
function PasswordModal({ isOpen, onClose, onSaved }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setErr("");
      setOk("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setOk("");

    if (!currentPwd) {
      setErr("Informe sua senha atual.");
      return;
    }
    if (newPwd.length < 8) {
      setErr("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setErr("As senhas não coincidem.");
      return;
    }

    const email = localStorage.getItem("userEmail");
    if (!email) {
      setErr("Email do usuário não encontrado no dispositivo.");
      return;
    }

    try {
      setLoading(true);
      // >>> ajuste aqui se o seu controller tiver assinatura diferente
      await updatePassword({
        email,
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      setOk("Senha atualizada com sucesso!");
      onSaved?.();
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Falha ao atualizar senha."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Alterar senha">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Senha atual
          </label>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-600"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nova senha
          </label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-600"
            placeholder="mín. 8 caracteres"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirmar nova senha
          </label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-600"
            disabled={loading}
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-emerald-600">{ok}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

/* ===========================================================
   UserInfo (seu componente)
   =========================================================== */
export default function UserInfo() {
  const [imageUpdated, setImageUpdated] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // %
  const [statusMsg, setStatusMsg] = useState(""); // mensagens p/ usuário

  // const [getUsername, setGetUsername] = useState("");
  // const [data, setData] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [, setPreviewUrl] = useState(userPerfil);

  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

    try {
      setUploading(true);
      setUploadError("");
      setStatusMsg("Enviando...");
      setUploadProgress(0);

      const resp = await uploadProfileImage(file, {
        onProgress: (percent) => {
          setUploadProgress(percent);
          setStatusMsg(`Enviando... ${percent}%`);
        },
      });

      if (resp.status === 200) {
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
        err?.response?.data?.message ||
          err?.message ||
          "Erro ao enviar a imagem."
      );
      setStatusMsg("");
    } finally {
      setUploading(false);
    }
  };

  const handleEditUsernameClick = () => setIsUsernameModalOpen(true);
  const handleEditPasswordClick = () => setIsPasswordModalOpen(true);

  return (
    <>
      <div className="flex flex-col justify-between p-2">
        {/* Seção de imagem de perfil */}
        <div className="flex flex-row">
          <div className="flex flex-row w-full">
            <div className="flex flex-col justify-center w-full">
              <h2 className="text-md font-bold">Select your profile image</h2>

              <div className="mt-2 flex items-center gap-6 neuphormism-b p-5">
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
                    w-[200px] aspect-square
                    rounded-full overflow-hidden
                    cursor-pointer relative
                    
                  "
                  aria-label="Selecionar imagem de perfil"
                  title="Selecionar imagem de perfil"
                >
                  <UserProfileAvatarBig
                    imageUpdated={imageUpdated}
                    fillParent
                  />

                  {uploading && (
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                      <span className="text-white text-sm mb-2">
                        {statusMsg || "Enviando..."}
                      </span>
                      <div className="w-4/5 h-2 bg-white/40 rounded">
                        <div
                          className="h-2 bg-white rounded transition-[width] "
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </label>

                {/* Painel de mensagens à direita */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-col justify-center h-[200px]">
                    <p className="text-sm text-gray-700">
                      {uploading
                        ? statusMsg || "Enviando..."
                        : "Clique no avatar para selecionar e enviar."}
                    </p>

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

                    {uploadError && (
                      <p className="mt-2 text-sm text-red-500">{uploadError}</p>
                    )}

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

        {/* nickname */}
        <div className="bg-red-300 mt-5 mb-2.5 neuphormism-b flex flex-row justify-between items-center rounded-lg">
          <div className="flex flex-col">
            <div className="text-sm mt-2 pt-1 pl-2 font-semibold">nickname</div>
            <div className="flex flex-row justify-between py-3">
              <div className="text-md pb-1 pl-2">
                @{localStorage.getItem("username")}
              </div>
            </div>
          </div>
          <button
            className="flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer p-2"
            onClick={handleEditUsernameClick}
            title="Editar nickname"
            aria-label="Editar nickname"
          >
            <div className=" bg-red-300 neuphormism-b p-4">
              <FaEdit className="text-gray-600 text-lg " />
            </div>
          </button>
        </div>

        {/* email */}
        <div className="bg-red-300  my-2.5 neuphormism-b flex flex-row justify-between items-center rounded-lg">
          <div className="flex flex-col">
            <div className="text-sm mt-2 pt-2 pl-2 font-semibold">
              user email
            </div>
            <div className="flex flex-row justify-between py-3">
              <div className="text-md pb-2 pl-2">
                {localStorage.getItem("userEmail")}
              </div>
            </div>
          </div>
        </div>

        {/* password */}

        <div className="bg-red-300  my-2.5 neuphormism-b flex flex-row justify-between items-center rounded-lg">
          <div className="flex flex-col">
            <div className="text-sm mt-2 pt-1 pl-2 font-semibold">password</div>
            <div className="flex flex-row justify-between py-3">
              <div className="text-md pb-1 pl-2">***********</div>
            </div>
          </div>
          <button
            className="flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer p-2"
            onClick={handleEditPasswordClick}
            title="Alterar senha"
            aria-label="Alterar senha"
          >
            <div className=" bg-red-300 neuphormism-b p-4">
              <FaEdit className="text-gray-600 text-lg " />
            </div>
          </button>
        </div>
      </div>

      {/* Modais */}
      <UsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        currentUsername={localStorage.getItem("username") || ""}
        onSaved={() => {
          // atualiza alguma UI se quiser
          setIsUsernameModalOpen(false);
        }}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSaved={() => {
          setIsPasswordModalOpen(false);
        }}
      />
    </>
  );
}
