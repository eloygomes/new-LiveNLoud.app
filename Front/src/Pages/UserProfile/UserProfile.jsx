/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaSyncAlt } from "react-icons/fa";
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
  uploadProfileImage,
} from "../../Tools/Controllers";
import { setLocalStorageItemSafe } from "../../Tools/storageSafe";
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
  const [friendsView, setFriendsView] = useState("friends");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [usbEnabled, setUsbEnabled] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [language, setLanguage] = useState("ENG");
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;

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
      setLocalStorageItemSafe("username", parsedResult[0].username || "");

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

  useEffect(() => {
    if (!isTouchLayout) return;

    window.scrollTo({ top: 0, behavior: "auto" });
    const routeScroller = document.querySelector(
      '[data-scroll-removed-mongo-user="true"]',
    );
    if (routeScroller) routeScroller.scrollTop = 0;
  }, [isTouchLayout, selectedMobileTab]);

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
      setLocalStorageItemSafe("username", newUsername);
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

    // Obter o email do usuário do localStorage ou de outra fonte de autenticação
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      throw new Error("Email do usuário não encontrado.");
    }

    try {
      setUploading(true);
      setUploadError("");

      const response = await uploadProfileImage(selectedFile, {
        email: userEmail,
      });

      if (response.status >= 200 && response.status < 300) {
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
      setFriendsView("sent");
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
      if (status === "accepted") setFriendsView("friends");
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
    <div className="neuphormism-b rounded-[16px] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {label}
          </div>
          <div className="mt-1 break-words text-[13px] font-bold text-black">
            {value}
          </div>
        </div>
        {onPress ? (
          <button
            type="button"
            className="neuphormism-b-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white"
            onClick={onPress}
            aria-label={`Edit ${label}`}
          >
            <FaEdit className="text-black" />
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderMobileUserInfo = () => (
    <div className="flex flex-col gap-3">
      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="flex items-center gap-3 text-left">
          <label htmlFor="mobileProfileImage" className="cursor-pointer">
            <UserProfileAvatarBig size={96} imageUpdated={imageUpdated} />
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="mobileProfileImage"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold uppercase leading-tight text-black">
              {mobileProfileSummary.fullName}
            </div>
            <div className="mt-1 truncate text-[11px] font-bold text-gray-500">
              @{mobileProfileSummary.username}
            </div>
            <button
              type="button"
              onClick={handleUpload}
              className="neuphormism-b-btn-gold mt-3 rounded-[12px] bg-[goldenrod] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-black"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </div>
        {uploadError ? (
          <p className="mt-2 text-[11px] text-red-600">{uploadError}</p>
        ) : null}
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
    <div className="flex flex-col gap-3">
      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="text-[13px] font-bold uppercase text-black">
          User Data
        </div>
        <div className="mt-1 w-full text-[11px] leading-4 text-gray-600">
          Download a copy of all information currently stored for your account.
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="neuphormism-b-btn rounded-[12px] bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black"
            onClick={() => downloadUserData()}
          >
            Download
          </button>
        </div>
      </div>

      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="text-[13px] font-bold uppercase text-black">
          Platform Data
        </div>
        <div className="mt-1 w-full text-[11px] leading-4 text-gray-600">
          Remove every song saved in your library while keeping your account.
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="neuphormism-b-btn-red rounded-[12px] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
            onClick={handleDelete}
          >
            Delete Songs
          </button>
        </div>
      </div>

      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="text-[13px] font-bold uppercase text-black">
          User Account
        </div>
        <div className="mt-1 w-full text-[11px] leading-4 text-gray-600">
          Permanently delete your account, songs and all associated platform
          data.
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="neuphormism-b-btn-red rounded-[12px] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
            onClick={handleDeleteAccountClick}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderMobileFriends = () => (
    <div className="flex flex-col gap-3">
      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[13px] font-bold uppercase text-black">
              Friends
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Manage your music network.
            </div>
          </div>
          <div className="flex h-9 min-w-9 items-center justify-center rounded-[12px] bg-[goldenrod] text-black">
            <FaUserFriends size={14} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            { value: "friends", label: "Friends", count: mobileFriends.length },
            { value: "incoming", label: "Incoming", count: incomingInvitations.length },
            { value: "sent", label: "Sent", count: sentInvitations.length },
            { value: "invite", label: "Invite", count: "+" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-[11px] px-1 py-2 text-center ${
                friendsView === item.value
                  ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
                  : "neuphormism-b-btn bg-white text-gray-500"
              }`}
              onClick={() => setFriendsView(item.value)}
            >
              <span className="block text-[14px] font-bold leading-none">
                {item.count}
              </span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.04em]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="neuphormism-b rounded-[18px] p-3">
        {friendsView === "invite" ? (
          <>
            <div className="text-[13px] font-bold uppercase text-black">
              Invite A Friend
            </div>
            <div className="mt-1 text-[11px] leading-4 text-gray-600">
              Invite by email. Calendar sharing becomes available after acceptance.
            </div>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) =>
                setInviteEmail(event.target.value.toLowerCase())
              }
              placeholder="friend@email.com"
              className="neuphormism-b-btn mt-3 h-10 w-full rounded-[12px] border-0 bg-white px-3 text-[12px] outline-none"
            />
            <input
              type="text"
              value={inviteMessage}
              onChange={(event) => setInviteMessage(event.target.value)}
              placeholder="Optional message"
              className="neuphormism-b-btn mt-2 h-10 w-full rounded-[12px] border-0 bg-white px-3 text-[12px] outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="neuphormism-b-btn-gold rounded-[12px] bg-[goldenrod] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black"
                disabled={friendActionLoading}
                onClick={handleSendFriendInvite}
              >
                {friendActionLoading ? "Working..." : "Send Invite"}
              </button>
            </div>
          </>
        ) : friendsView === "incoming" ? (
          <>
            <div className="text-[13px] font-bold uppercase text-black">
              Incoming Requests
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {incomingInvitations.length === 0 ? (
                <p className="text-[11px] text-gray-500">No requests waiting.</p>
              ) : (
                incomingInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="neuphormism-b-se rounded-[14px] p-3"
                  >
                    <div className="break-all text-[12px] font-bold text-black">
                      {invitation.senderEmail?.toLowerCase()}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {invitation.senderFullName ||
                        invitation.senderUsername ||
                        "Friend request"}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="neuphormism-b-btn-gold rounded-[11px] bg-[goldenrod] px-3 py-2 text-[9px] font-bold uppercase text-black"
                        onClick={() =>
                          handleInvitationResponse(invitation._id, "accepted")
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="neuphormism-b-btn-red rounded-[11px] px-3 py-2 text-[9px] font-bold uppercase text-white"
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
          </>
        ) : friendsView === "sent" ? (
          <>
            <div className="text-[13px] font-bold uppercase text-black">
              Sent Requests
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {sentInvitations.length === 0 ? (
                <p className="text-[11px] text-gray-500">No sent requests.</p>
              ) : (
                sentInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="neuphormism-b-se rounded-[14px] p-3"
                  >
                    <div className="break-all text-[12px] font-bold text-black">
                      {invitation.receiverEmail?.toLowerCase()}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      Waiting for response.
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-[13px] font-bold uppercase text-black">
              Your Friends
            </div>
            <div className="mt-2 flex max-h-[17rem] flex-col gap-2 overflow-y-auto pr-1">
              {mobileFriends.length === 0 ? (
                <p className="text-[11px] text-gray-500">
                  No friends yet. Use Invite to connect with a musician.
                </p>
              ) : (
                mobileFriends.map((friend) => (
                  <div
                    key={`${friend.counterpartEmail}-${friend.invitationId || ""}`}
                    className="neuphormism-b-se flex items-center gap-2 rounded-[14px] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-bold text-black">
                        {friend.counterpartFullName ||
                          friend.counterpartUsername ||
                          "Friend"}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-gray-500">
                        {friend.counterpartEmail?.toLowerCase()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="neuphormism-b-btn-red shrink-0 rounded-[11px] px-3 py-2 text-[9px] font-bold uppercase text-white"
                      disabled={revokingEmail === friend.counterpartEmail}
                      onClick={() =>
                        handleRevokeFriendship(friend.counterpartEmail)
                      }
                    >
                      {revokingEmail === friend.counterpartEmail
                        ? "Working..."
                        : "Remove"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {friendFeedback ? (
          <p className="mt-3 text-[11px] text-green-700">{friendFeedback}</p>
        ) : null}
        {friendError ? (
          <p className="mt-3 text-[11px] text-red-600">{friendError}</p>
        ) : null}
      </div>
    </div>
  );

  const renderMobileSettings = () => (
    <div className="neuphormism-b rounded-[18px] p-3">
      <div className="text-[13px] font-bold uppercase text-black">
        Connections & Language
      </div>
      <div className="mt-1 text-[11px] leading-4 text-gray-500">
        Choose the connections and interface language used by Sustenido.
      </div>

      <div className="mt-3 divide-y divide-black/5 overflow-hidden rounded-[14px] bg-white/45 px-3">
        {[
          {
            title: "USB Devices",
            subtitle: "Use connected USB controllers",
            value: usbEnabled,
            onChange: setUsbEnabled,
          },
          {
            title: "Bluetooth",
            subtitle: "Use wireless controllers",
            value: bluetoothEnabled,
            onChange: setBluetoothEnabled,
          },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold uppercase text-black">
                {item.title}
              </div>
              <div className="mt-0.5 text-[10px] text-gray-500">
                {item.subtitle}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={item.value}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                item.value
                  ? "bg-[goldenrod]"
                  : "bg-gray-300 shadow-inner"
              }`}
              onClick={() => item.onChange(!item.value)}
              aria-label={`${item.title}: ${item.value ? "on" : "off"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  item.value ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold uppercase text-black">
              Language
            </div>
            <div className="mt-0.5 text-[10px] text-gray-500">
              Interface language
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-1">
            {["ENG", "BRA"].map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-[9px] px-2.5 py-2 text-[9px] font-bold uppercase ${
                  language === item
                    ? "bg-[goldenrod] text-black"
                    : "neuphormism-b-btn bg-white text-gray-500"
                }`}
                onClick={() => setLanguage(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMobileLogs = () => (
    <div className="flex flex-col gap-3">
      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[13px] bg-white/55 px-3 py-2.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">
              Songs
            </div>
            <div className="mt-1 text-[1.1rem] font-bold leading-none text-black">
              {data.length}
            </div>
          </div>
          <div className="rounded-[13px] bg-white/55 px-3 py-2.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">
              Progress
            </div>
            <div className="mt-1 text-[1.1rem] font-bold leading-none text-black">
              {averageProgression}%
            </div>
          </div>
        </div>

        <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">
          Songs by instrument
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {instrumentMeta.map((instrument) => (
            <div
              key={instrument.key}
              className="rounded-[10px] bg-white/55 px-1 py-2 text-center"
            >
              <div className="text-[9px] font-bold uppercase text-gray-500">
                {instrument.short}
              </div>
              <div className="mt-0.5 text-[13px] font-bold text-black">
                {songsByInstrument[instrument.key] ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="neuphormism-b rounded-[18px] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[13px] font-bold uppercase text-black">
              Recent Activity
            </div>
            <div className="mt-0.5 text-[10px] text-gray-500">
              {mobileLogs.length} recorded events
            </div>
          </div>
          {mobileLogs.length > 3 ? (
            <button
              type="button"
              className="neuphormism-b-btn rounded-[10px] bg-white px-3 py-2 text-[9px] font-bold uppercase text-black"
              onClick={() => setShowAllLogs((current) => !current)}
            >
              {showAllLogs ? "Show less" : "View all"}
            </button>
          ) : null}
        </div>
        <div
          className={`mt-3 flex flex-col gap-2 pr-1 ${
            showAllLogs ? "max-h-[16rem] overflow-y-auto" : ""
          }`}
        >
          {mobileLogs.length === 0 ? (
            <div className="text-[11px] text-gray-500">No activity logs yet.</div>
          ) : (
            (showAllLogs ? mobileLogs : mobileLogs.slice(0, 3)).map((log) => (
              <div
                key={log._id}
                className="rounded-[12px] bg-white/55 px-3 py-2.5 text-[11px] leading-4 text-black"
              >
                <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[goldenrod]">
                  {formatDisplayDateTime(log.createdAt)}
                </div>
                <div className="mt-1">{log.message}</div>
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
      <div className="min-h-[calc(100vh-5.25rem)] bg-[#f0f0f0] px-3 pb-4 pt-3">
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

        <div className="mx-auto flex min-h-[calc(100dvh-10.75rem)] w-full max-w-[430px] flex-col">
          <div className="neuphormism-b relative rounded-[18px] bg-[#f0f0f0] p-2.5">
            <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
              Menu
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {MOBILE_MENU_OPTIONS.map((option) => {
                const active = option === selectedMobileTab;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`flex min-h-11 items-center justify-center rounded-[11px] px-1 py-2 text-center text-[8px] font-bold uppercase leading-[1.15] tracking-[0.04em] ${
                      active
                        ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
                        : "neuphormism-b-btn bg-[#f0f0f0] text-gray-500"
                    }`}
                    onClick={() => setSelectedMobileTab(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex-1">
            {mobileLoading && !mobileRefreshing ? (
              <div className="neuphormism-b rounded-[18px] p-5 text-center text-[12px] text-gray-500">
                Loading user hub...
              </div>
            ) : (
              renderMobileContent()
            )}
          </div>

          {selectedMobileTab === "USER INFO" ? (
            <div className="neuphormism-b mt-5 grid grid-cols-2 gap-2 rounded-[18px] p-2.5">
              <button
                type="button"
                className="neuphormism-b-btn flex w-full items-center justify-center gap-2 rounded-[12px] bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black"
                onClick={handleMobileRefresh}
              >
                <FaSyncAlt className={mobileRefreshing ? "animate-spin" : ""} />
                <span>{mobileRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              <button
                type="button"
                className="neuphormism-b-btn w-full rounded-[12px] bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-red-600"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          ) : null}
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
