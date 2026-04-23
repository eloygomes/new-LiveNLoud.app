/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { FaUserFriends } from "react-icons/fa";
import userPerfil from "../../assets/userPerfil.jpg";
import UserProfileAvatarBig from "./UserProfileAvatarBig";
import {
  createInvitation,
  deleteAllUserSongs,
  deleteUserAccount,
  downloadUserData,
  fetchCurrentUserProfile,
  fetchInvitations,
  fetchUserLogs,
  respondToInvitation,
  revokeFriendship,
  requestData,
  updatePassword,
  updateUserName,
  logoutUser,
} from "../../Tools/Controllers";
import PasswordResetModal from "./PasswordResetModal";
import UsernameEditModal from "./UsernameEditModal";
import DeleteAccountModal from "./DeleteAccountModal"; // Importar o novo modal
import {
  formatDisplayDate,
  formatDisplayDateTime,
  parseDateValue,
} from "../../Tools/dateFormat";

const MOBILE_MENU_OPTIONS = [
  "USER INFO",
  "USER DATA",
  "FRIENDS",
  "SETTINGS",
  "LOGS",
];

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
  // Estados para os modais
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Novo estado para o modal de exclusão
  const [selectedMobileTab, setSelectedMobileTab] = useState("USER INFO");
  const [mobileLoading, setMobileLoading] = useState(true);
  const [mobileRefreshing, setMobileRefreshing] = useState(false);
  const [mobileProfile, setMobileProfile] = useState(null);
  const [mobileInvitations, setMobileInvitations] = useState([]);
  const [mobileLogs, setMobileLogs] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friendFeedback, setFriendFeedback] = useState("");
  const [friendError, setFriendError] = useState("");
  const [revokingEmail, setRevokingEmail] = useState("");
  const [usbEnabled, setUsbEnabled] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [language, setLanguage] = useState("ENG");
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;

  const loadMobileUserHub = useCallback(async () => {
    const userEmail = localStorage.getItem("userEmail");

    const [result, profile, invitations, logs] = await Promise.all([
      requestData(userEmail),
      fetchCurrentUserProfile().catch(() => null),
      fetchInvitations().catch(() => []),
      fetchUserLogs().catch(() => []),
    ]);

    const parsedResult = JSON.parse(result);

    if (Array.isArray(parsedResult) && parsedResult[0]) {
      setGetFullName(parsedResult[0].fullName || "");
      setGetUsername(parsedResult[0].username || "");
      localStorage.setItem("username", parsedResult[0].username || "");

      const filteredData = parsedResult.filter(
        (item) =>
          item.instruments &&
          Object.values(item.instruments).some((val) => val === true),
      );
      setData(filteredData);
    }

    setMobileProfile(profile);
    setMobileInvitations(Array.isArray(invitations) ? invitations : []);
    setMobileLogs(Array.isArray(logs) ? logs : []);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadMobileUserHub();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setMobileLoading(false);
      }
    };

    fetchData();
  }, [loadMobileUserHub]);

  useEffect(() => {
    const handleOpenUserHubSection = (event) => {
      const nextSection = event.detail?.section;
      if (nextSection && MOBILE_MENU_OPTIONS.includes(nextSection)) {
        setSelectedMobileTab(nextSection);
      }
    };

    window.addEventListener("open-userhub-section", handleOpenUserHubSection);

    return () => {
      window.removeEventListener(
        "open-userhub-section",
        handleOpenUserHubSection,
      );
    };
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
      await updateUserName(newUsername);
      setGetUsername(newUsername); // Atualiza o estado com o novo nome de usuário
      localStorage.setItem("username", newUsername);
      alert("Username atualizado com sucesso!");
      setIsUsernameModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar o nome de usuário:", error);
      alert("Erro ao atualizar o nome de usuário.");
    }
  };

  const handlePasswordSubmit = async (oldPassword, newPassword) => {
    try {
      await updatePassword({
        email: localStorage.getItem("userEmail"),
        currentPassword: oldPassword,
        newPassword,
      });
      alert("Senha alterada com sucesso!");
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao alterar a senha:", error);
      alert(
        error?.response?.data?.message ||
          "Ocorreu um erro ao tentar alterar a senha.",
      );
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
        "https://api.live.eloygomes.com/api/uploadProfileImage",
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete all your songs?")) {
      try {
        const result = await deleteAllUserSongs();
        alert(result.message);
        console.log("Remaining Songs:", result.remainingSongs);
        // Optionally, update your state or UI to reflect the changes
      } catch (error) {
        alert(
          `Failed to delete songs: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleDeleteAccountClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAccount = async (password) => {
    try {
      await deleteUserAccount({ password });
      alert("Sua conta foi deletada com sucesso.");
      logoutUser();

      // Redirecionar o usuário para a página de login
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao deletar a conta:", error);
      alert(
        error?.response?.data?.message ||
          `Erro ao deletar a conta: ${error.message}`,
      );
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const mobileProfileSummary = useMemo(() => {
    const firstSong = data[0] ?? {};
    return {
      username:
        mobileProfile?.username || getUsername || firstSong.username || "user",
      fullName:
        mobileProfile?.fullName ||
        getFullName ||
        firstSong.fullName ||
        "LiveNLoud User",
      email:
        mobileProfile?.email ||
        firstSong.email ||
        localStorage.getItem("userEmail") ||
        "No email found",
      acceptedInvitations: Array.isArray(mobileProfile?.acceptedInvitations)
        ? mobileProfile.acceptedInvitations
        : [],
    };
  }, [data, getFullName, getUsername, mobileProfile]);

  const averageProgression = useMemo(() => {
    if (!data.length) return 0;

    const total = data.reduce((sum, item) => {
      const value =
        typeof item.progressBar === "string"
          ? Number(item.progressBar)
          : item.progressBar ?? 0;
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    return Math.round(total / data.length);
  }, [data]);

  const instrumentMeta = [
    { key: "guitar01", short: "G1" },
    { key: "guitar02", short: "G2" },
    { key: "bass", short: "B" },
    { key: "keys", short: "K" },
    { key: "drums", short: "D" },
    { key: "voice", short: "V" },
  ];

  const songsByInstrument = useMemo(
    () =>
      instrumentMeta.reduce((acc, instrument) => {
        acc[instrument.key] = data.filter(
          (song) => song.instruments?.[instrument.key],
        ).length;
        return acc;
      }, {}),
    [data],
  );

  const incomingInvitations = useMemo(() => {
    return mobileInvitations.filter(
      (invitation) =>
        invitation.receiverEmail?.toLowerCase() ===
          mobileProfileSummary.email.toLowerCase() &&
        invitation.status === "pending",
    );
  }, [mobileInvitations, mobileProfileSummary.email]);

  const sentInvitations = useMemo(() => {
    return mobileInvitations.filter(
      (invitation) =>
        invitation.senderEmail?.toLowerCase() ===
          mobileProfileSummary.email.toLowerCase() &&
        invitation.status === "pending",
    );
  }, [mobileInvitations, mobileProfileSummary.email]);

  const mobileFriends = useMemo(
    () =>
      [...mobileProfileSummary.acceptedInvitations].sort((left, right) =>
        String(left?.counterpartEmail || "").localeCompare(
          String(right?.counterpartEmail || ""),
        ),
      ),
    [mobileProfileSummary.acceptedInvitations],
  );

  const reloadFriendData = useCallback(async () => {
    const [profile, invitations, logs] = await Promise.all([
      fetchCurrentUserProfile(),
      fetchInvitations(),
      fetchUserLogs(),
    ]);
    setMobileProfile(profile);
    setMobileInvitations(Array.isArray(invitations) ? invitations : []);
    setMobileLogs(Array.isArray(logs) ? logs : []);
  }, []);

  const handleMobileRefresh = async () => {
    setMobileRefreshing(true);
    try {
      await loadMobileUserHub();
    } finally {
      setMobileRefreshing(false);
    }
  };

  const handleSendFriendInvite = async () => {
    const normalized = inviteEmail.trim().toLowerCase();
    if (!normalized) {
      setFriendError("Enter a user email.");
      setFriendFeedback("");
      return;
    }

    setFriendActionLoading(true);
    setFriendError("");
    setFriendFeedback("");
    try {
      await createInvitation({ identifier: normalized, message: inviteMessage });
      setInviteEmail("");
      setInviteMessage("");
      setFriendFeedback("Friend request sent.");
      await reloadFriendData();
    } catch (error) {
      setFriendError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send friend request.",
      );
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId, status) => {
    setFriendActionLoading(true);
    setFriendError("");
    setFriendFeedback("");
    try {
      await respondToInvitation(invitationId, status);
      setFriendFeedback(`Friend request ${status}.`);
      await reloadFriendData();
    } catch (error) {
      setFriendError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update request.",
      );
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleRevokeFriendship = async (counterpartEmail) => {
    const confirmed = window.confirm(
      `Remove ${counterpartEmail} from your friends?`,
    );
    if (!confirmed) return;

    setRevokingEmail(counterpartEmail);
    setFriendError("");
    setFriendFeedback("");
    try {
      await revokeFriendship(counterpartEmail);
      setFriendFeedback(`Friendship revoked with ${counterpartEmail}.`);
      await reloadFriendData();
    } catch (error) {
      setFriendError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to revoke friendship.",
      );
    } finally {
      setRevokingEmail("");
    }
  };

  const handleSignOut = () => {
    logoutUser();
    window.location.href = "/login";
  };

  const renderMobileFieldCard = (label, value, onPress) => (
    <div className="rounded-[20px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            {label}
          </div>
          <div className="mt-2 break-words text-[15px] font-bold text-black">
            {value}
          </div>
        </div>
        {onPress ? (
          <button
            type="button"
            className="rounded-full bg-white p-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
            onClick={onPress}
          >
            <FaEdit className="text-black" />
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderMobileUserInfo = () => (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center text-center">
          <label htmlFor="mobileProfileImage" className="cursor-pointer">
            <UserProfileAvatarBig size={120} imageUpdated={imageUpdated} />
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="mobileProfileImage"
          />
          <div className="mt-4 text-[1.15rem] font-black uppercase text-black">
            {mobileProfileSummary.fullName}
          </div>
          <div className="mt-1 text-[13px] font-bold text-gray-500">
            @{mobileProfileSummary.username}
          </div>
          <button
            type="button"
            onClick={handleUpload}
            className="mt-4 rounded-[16px] bg-[goldenrod] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-black shadow-[0_10px_18px_rgba(217,173,38,0.25)]"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
          {uploadError ? (
            <p className="mt-3 text-xs text-red-600">{uploadError}</p>
          ) : null}
        </div>
      </div>

      {renderMobileFieldCard(
        "nickname",
        `@${mobileProfileSummary.username}`,
        handleEditUsernameClick,
      )}
      {renderMobileFieldCard("user email", mobileProfileSummary.email)}
      {renderMobileFieldCard("password", "************", handleEditPasswordClick)}
    </div>
  );

  const renderMobileUserData = () => (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          User Data
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Download the data currently stored for your account in the platform.
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-[16px] bg-white px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-black shadow-[0_8px_16px_rgba(0,0,0,0.05)]"
          onClick={() => downloadUserData()}
        >
          Download
        </button>
      </div>

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Platform User Data
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Remove all songs from your account.
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-[16px] bg-[#f7d7d7] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#8f1d1d]"
          onClick={handleDelete}
        >
          Delete Songs
        </button>
      </div>

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          User Account
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Delete your user account and all platform data.
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-[16px] bg-[#f7d7d7] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#8f1d1d]"
          onClick={handleDeleteAccountClick}
        >
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderMobileFriends = () => (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Invite A Friend
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Send friendship invites by email. Calendar invites only work after the
          user accepts.
        </div>
        <input
          type="email"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value.toLowerCase())}
          placeholder="friend@email.com"
          className="mt-4 w-full rounded-[16px] border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
        />
        <input
          type="text"
          value={inviteMessage}
          onChange={(event) => setInviteMessage(event.target.value)}
          placeholder="Optional message"
          className="mt-3 w-full rounded-[16px] border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          className="mt-4 w-full rounded-[16px] bg-[goldenrod] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-black shadow-[0_10px_18px_rgba(217,173,38,0.25)]"
          disabled={friendActionLoading}
          onClick={handleSendFriendInvite}
        >
          {friendActionLoading ? "Working..." : "Send Invite"}
        </button>
        {friendFeedback ? (
          <p className="mt-3 text-xs text-green-700">{friendFeedback}</p>
        ) : null}
        {friendError ? (
          <p className="mt-3 text-xs text-red-600">{friendError}</p>
        ) : null}
      </div>

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Pending Requests
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {incomingInvitations.length === 0 ? (
            <p className="text-sm text-gray-500">No pending requests.</p>
          ) : (
            incomingInvitations.map((invitation) => (
              <div key={invitation._id} className="rounded-[18px] bg-white p-4">
                <div className="break-all text-sm font-bold text-black">
                  {invitation.senderEmail?.toLowerCase()}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {invitation.senderFullName ||
                    invitation.senderUsername ||
                    "Friend request"}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-[14px] bg-[goldenrod] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black"
                    onClick={() =>
                      handleInvitationResponse(invitation._id, "accepted")
                    }
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-[14px] bg-[#f7d7d7] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8f1d1d]"
                    onClick={() =>
                      handleInvitationResponse(invitation._id, "declined")
                    }
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Sent Requests
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {sentInvitations.length === 0 ? (
            <p className="text-sm text-gray-500">No sent requests.</p>
          ) : (
            sentInvitations.map((invitation) => (
              <div key={invitation._id} className="rounded-[18px] bg-white p-4">
                <div className="break-all text-sm font-bold text-black">
                  {invitation.receiverEmail?.toLowerCase()}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Waiting for response.
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Actual Friends
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {mobileFriends.length === 0 ? (
            <p className="text-sm text-gray-500">No accepted friends yet.</p>
          ) : (
            mobileFriends.map((friend) => (
              <div
                key={`${friend.counterpartEmail}-${friend.invitationId || ""}`}
                className="rounded-[18px] bg-white p-4"
              >
                <div className="break-all text-sm font-bold text-black">
                  {friend.counterpartEmail?.toLowerCase()}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {friend.counterpartFullName ||
                    friend.counterpartUsername ||
                    "Friend"}
                </div>
                <button
                  type="button"
                  className="mt-3 rounded-[14px] bg-[#f7d7d7] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8f1d1d]"
                  disabled={revokingEmail === friend.counterpartEmail}
                  onClick={() => handleRevokeFriendship(friend.counterpartEmail)}
                >
                  {revokingEmail === friend.counterpartEmail
                    ? "Revoking..."
                    : "Revoke"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderMobileSettings = () => (
    <div className="flex flex-col gap-4">
      {[
        {
          title: "USB Devices",
          subtitle: "USB devices connection",
          value: usbEnabled,
          onChange: setUsbEnabled,
        },
        {
          title: "Bluetooth",
          subtitle: "Bluetooth connection",
          value: bluetoothEnabled,
          onChange: setBluetoothEnabled,
        },
      ].map((item) => (
        <div
          key={item.title}
          className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-black uppercase text-black">
                {item.title}
              </div>
              <div className="mt-1 text-sm text-gray-600">{item.subtitle}</div>
            </div>
            <button
              type="button"
              className={`h-8 w-14 rounded-full p-1 transition ${
                item.value ? "bg-[goldenrod]" : "bg-gray-300"
              }`}
              onClick={() => item.onChange(!item.value)}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white transition ${
                  item.value ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      ))}

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Language
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {["ENG", "BRA"].map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-[16px] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] ${
                language === item
                  ? "bg-[goldenrod] text-black"
                  : "bg-white text-gray-500"
              }`}
              onClick={() => setLanguage(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMobileLogs = () => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            Songs
          </div>
          <div className="mt-3 text-[1.4rem] font-black text-black">
            {data.length}
          </div>
        </div>
        <div className="rounded-[20px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            Progress
          </div>
          <div className="mt-3 text-[1.4rem] font-black text-black">
            {averageProgression}%
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
        <div className="text-[16px] font-black uppercase text-black">
          Songs By Instruments
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {instrumentMeta.map((instrument) => (
            <div
              key={instrument.key}
              className="rounded-[16px] bg-white px-3 py-4 text-center"
            >
              <div className="text-[11px] font-black uppercase text-gray-500">
                {instrument.short}
              </div>
              <div className="mt-2 text-lg font-black text-black">
                {songsByInstrument[instrument.key] ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] bg-[#171717] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
        <div className="text-[16px] font-black uppercase text-white">
          Activity Feed
        </div>
        <div className="mt-4 flex max-h-[22rem] flex-col gap-2 overflow-y-auto pr-1">
          {mobileLogs.length === 0 ? (
            <div className="text-sm text-gray-400">No activity logs yet.</div>
          ) : (
            mobileLogs.map((log) => (
              <div
                key={log._id}
                className="rounded-[16px] bg-white/5 px-4 py-3 font-mono text-[12px] leading-5 text-white"
              >
                <span className="text-[goldenrod]">
                  [{formatDisplayDateTime(log.createdAt)}]
                </span>{" "}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderMobileContent = () => {
    switch (selectedMobileTab) {
      case "USER DATA":
        return renderMobileUserData();
      case "FRIENDS":
        return renderMobileFriends();
      case "SETTINGS":
        return renderMobileSettings();
      case "LOGS":
        return renderMobileLogs();
      case "USER INFO":
      default:
        return renderMobileUserInfo();
    }
  };

  console.log(data);

  if (isTouchLayout) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-3">
        <PasswordResetModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handlePasswordSubmit}
        />
        <UsernameEditModal
          isOpen={isUsernameModalOpen}
          onClose={() => setIsUsernameModalOpen(false)}
          onSubmit={handleUsernameSubmit}
        />
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSubmit={handleDeleteAccount}
        />

        <div className="rounded-[24px] bg-[#e0e0e0] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[1.9rem] font-black tracking-tight text-black">
                USER HUB
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-500">
                Hello @{mobileProfileSummary.username}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#f0f0f0]">
              <FaUserFriends className="text-black" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <div className="text-[13px] font-black uppercase tracking-[0.18em] text-black">
            Menu
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {MOBILE_MENU_OPTIONS.map((option) => {
              const active = option === selectedMobileTab;
              return (
                <button
                  key={option}
                  type="button"
                  className={`rounded-[16px] px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] ${
                    active
                      ? "bg-[goldenrod] text-black"
                      : "bg-[#f0f0f0] text-gray-500"
                  }`}
                  onClick={() => setSelectedMobileTab(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          {mobileLoading && !mobileRefreshing ? (
            <div className="rounded-[24px] bg-[#e0e0e0] p-6 text-center text-sm text-gray-500 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
              Loading user hub...
            </div>
          ) : (
            renderMobileContent()
          )}
        </div>

        <div className="mt-4 rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            className="w-full rounded-[16px] bg-white px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-black"
            onClick={handleMobileRefresh}
          >
            {mobileRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            className="mt-3 w-full rounded-[16px] bg-black px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-white"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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
        onSubmit={handleUsernameSubmit}
      />
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSubmit={handleDeleteAccount}
      />
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">User profile</h1>
            <h4 className="ml-auto mt-auto text-sm">Edit your data</h4>
          </div>
          <div className="flex flex-row neuphormism-b p-5">
            <div className="flex flex-col justify-between w-1/2 p-5">
              {/* Seção de imagem de perfil */}
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
              {/* Seção de dados do usuário */}
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
                      {formatDisplayDate(data[0]?.addedIn) || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="text-sm flex flex-col">
                  <div className="mt-2 pt-2 pl-2 text-right">
                    Last time played
                  </div>
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
                            const lastPlayValues = [
                              entry.lastPlayed,
                              entry[instrument]?.lastPlay,
                            ].flat();

                            lastPlayValues.forEach((lastPlay) => {
                              const date = parseDateValue(lastPlay);
                              if (date) allLastPlayDates.push(date);
                            });
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

                        return formatDisplayDate(mostRecentDate);
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
                  <button className="mx-2 border-2 p-2 neuphormism-b-btn text-gray-300">
                    BRA 🇧🇷
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">User Data</h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-3 px-2 w-1/2">All user data</h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This contains all data from user that was stored by the
                    platform
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-sm p-2 w-1/2 truncate flex-1 text-right">
                  <button
                    className="mx-2 border-2 p-2 py-5 neuphormism-b-btn"
                    onClick={() => downloadUserData()}
                  >
                    Download
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">
                Platform User Data
              </h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-3 px-2 w-1/2 whitespace-nowrap">
                    Delete all songs
                  </h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This will delete all songs from your account
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  <button
                    className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold"
                    onClick={() => handleDelete()}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <h2 className="text-md font-bold mb-2 mt-5 p-2">User Account</h2>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col w-1/2">
                  <h2 className="text-[10pt] py-3 px-2 w-1/2 whitespace-nowrap">
                    Delete user account
                  </h2>
                  <h5 className="text-[8pt]  px-2 ">
                    This will delete all data from user account contained on the
                    platform; this cannot be undone
                  </h5>
                </div>
                <div className="flex flex-row justify-end text-[10pt] p-2 w-1/2 truncate flex-1 text-right">
                  {/* Abre o modal para o usuário digitar a senha e confirmar a exclusão */}
                  <button
                    className="mx-2 border-2 p-5 neuphormism-b-btn-red text-white font-semibold"
                    onClick={() => handleDeleteAccountClick()}
                  >
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
