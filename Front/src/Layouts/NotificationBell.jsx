import { useEffect, useMemo, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  fetchCurrentUserProfile,
  fetchSetlistShare,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  respondToSetlistShare,
} from "../Tools/Controllers";
import { formatDisplayDateTime } from "../Tools/dateFormat";

function closeAllModals() {
  window.dispatchEvent(new CustomEvent("close-all-modals"));
}

function SetlistShareModal({
  share,
  loading,
  error,
  responding,
  onClose,
  onRespond,
}) {
  if (!share && !loading && !error) return null;

  const setlistNames = Array.isArray(share?.setlistNames)
    ? share.setlistNames
    : [];
  const songs = Array.isArray(share?.songs) ? share.songs : [];

  return (
    <div
      className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[24px] bg-[#f0f0f0] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase">Import setlist?</h2>
            <p className="mt-1 text-sm font-semibold text-gray-600">
              Add the shared songs to your library with the received setlist
              name.
            </p>
          </div>
          <button
            type="button"
            className="text-2xl font-bold text-gray-500"
            onClick={onClose}
            aria-label="Close setlist share"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-sm font-semibold text-gray-600">
            Loading setlist share...
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        {share ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-[11px] font-black uppercase text-gray-500">
                From
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800">
                {share.senderFullName || share.senderUsername || share.senderEmail}
              </p>
              <p className="text-xs font-semibold text-gray-500">
                {share.senderEmail}
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-[11px] font-black uppercase text-gray-500">
                Setlists
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {setlistNames.map((setlist) => (
                  <span
                    key={setlist}
                    className="rounded-full bg-[goldenrod] px-3 py-1 text-[11px] font-black text-black"
                  >
                    {setlist}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-[11px] font-black uppercase text-gray-500">
                Songs
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800">
                {songs.length} songs will be imported.
              </p>
              <div className="mt-2 max-h-32 overflow-auto text-xs font-semibold text-gray-600">
                {songs.slice(0, 8).map((song, index) => (
                  <p key={`${song.artist}-${song.song}-${index}`}>
                    {index + 1}. {song.song} - {song.artist}
                  </p>
                ))}
                {songs.length > 8 ? <p>+ {songs.length - 8} more</p> : null}
              </div>
            </div>

            {share.status !== "pending" ? (
              <p className="rounded-lg bg-white/70 p-3 text-sm font-bold text-gray-600">
                This share was already {share.status}.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-red-500 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-500 hover:text-white"
                  disabled={responding}
                  onClick={() => onRespond("declined")}
                >
                  No
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[goldenrod] px-4 py-3 text-sm font-black text-black disabled:opacity-60"
                  disabled={responding}
                  onClick={() => onRespond("accepted")}
                >
                  {responding ? "Working..." : "Yes"}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [panelStyle, setPanelStyle] = useState({ top: 76, right: 24 });
  const [setlistShareModal, setSetlistShareModal] = useState({
    open: false,
    share: null,
    loading: false,
    error: "",
    responding: false,
  });
  const bellRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [me, nextNotifications] = await Promise.all([
          fetchCurrentUserProfile(),
          fetchNotifications(),
        ]);
        if (!mounted) return;
        setProfile(me);
        setNotifications(nextNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile?.email) return undefined;

    const socket = io(API_BASE, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      withCredentials: true,
      query: { email: profile.email },
    });

    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current]);
    });

    socket.on("notification:updated", ({ notification }) => {
      setNotifications((current) =>
        current.map((entry) =>
          entry._id === notification._id ? notification : entry,
        ),
      );
    });

    socket.on("notification:read-all", () => {
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
    });

    return () => {
      socket.close();
    };
  }, [profile]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!bellRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleForceClose = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("dashboard-mobile-close-notifications", handleForceClose);
    window.addEventListener("close-all-modals", handleForceClose);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener(
        "dashboard-mobile-close-notifications",
        handleForceClose,
      );
      window.removeEventListener("close-all-modals", handleForceClose);
    };
  }, []);

  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    closeAllModals();

    const button = bellRef.current?.querySelector("button");
    if (button) {
      const rect = button.getBoundingClientRect();
      setPanelStyle({
        top: rect.bottom + 12,
        right: Math.max(window.innerWidth - rect.right, 16),
      });
    }

    try {
      const nextNotifications = await fetchNotifications();
      setNotifications(nextNotifications);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }

    setOpen(true);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      const updated = await markNotificationAsRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === updated._id ? updated : notification,
        ),
      );
      return updated;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return null;
    }
  };

  const openSetlistShare = async (shareId) => {
    if (!shareId) return;

    setSetlistShareModal({
      open: true,
      share: null,
      loading: true,
      error: "",
      responding: false,
    });

    try {
      const share = await fetchSetlistShare(shareId);
      setSetlistShareModal({
        open: true,
        share,
        loading: false,
        error: "",
        responding: false,
      });
    } catch (error) {
      setSetlistShareModal({
        open: true,
        share: null,
        loading: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load setlist share.",
        responding: false,
      });
    }
  };

  const handleSetlistShareResponse = async (status) => {
    const shareId = setlistShareModal.share?._id;
    if (!shareId) return;

    setSetlistShareModal((current) => ({
      ...current,
      responding: true,
      error: "",
    }));

    try {
      const response = await respondToSetlistShare(shareId, status);

      if (status === "accepted") {
        setSetlistShareModal({
          open: false,
          share: null,
          loading: false,
          error: "",
          responding: false,
        });
        window.location.reload();
        return;
      }

      setSetlistShareModal((current) => ({
        ...current,
        share: response.share || current.share,
        responding: false,
        error: "",
      }));
    } catch (error) {
      setSetlistShareModal((current) => ({
        ...current,
        responding: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to respond to setlist share.",
      }));
    }
  };

  return (
    <div className="relative z-[10020]" ref={bellRef}>
      <button
        type="button"
        className="relative neuphormism-b-btn p-3 rounded-full"
        aria-label="Notifications"
        onClick={handleOpen}
      >
        <FaBell className="text-sm" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[goldenrod] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed z-[12000] w-[340px] max-w-[calc(100vw-2rem)] neuphormism-b p-4 shadow-2xl"
          style={panelStyle}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase">Notifications</h3>
              <p className="text-[11px] text-gray-500">
                Calendar, friendship, and setlist activity lands here.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] font-bold uppercase text-[goldenrod]"
              onClick={handleMarkAll}
              disabled={!notifications.length}
            >
              Mark all
            </button>
          </div>

          <div className="mt-4 max-h-[420px] overflow-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-white p-4 text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={async () => {
                    await handleNotificationClick(notification._id);
                    setOpen(false);
                    closeAllModals();

                    if (
                      notification.type === "setlist_share" &&
                      notification.meta?.shareId
                    ) {
                      openSetlistShare(notification.meta.shareId);
                    } else if (notification.type === "calendar_invite" && notification.meta?.eventId) {
                      navigate(`/calendar?inviteEvent=${encodeURIComponent(notification.meta.eventId)}`);
                    } else if (
                      notification.type === "user_invitation" ||
                      notification.type === "invitation_response" ||
                      notification.type === "friend_removed"
                    ) {
                      window.dispatchEvent(
                        new CustomEvent("open-userhub-section", {
                          detail: { section: "FRIENDS" },
                        }),
                      );
                    } else if (notification.meta?.eventId) {
                      navigate(`/calendar?event=${encodeURIComponent(notification.meta.eventId)}`);
                    }
                  }}
                  className={`w-full text-left rounded-2xl p-4 transition ${
                    notification.read
                      ? "bg-white/70"
                      : "bg-white border border-[goldenrod]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase">
                        {notification.title}
                      </p>
                      <p className="text-sm mt-1">{notification.message}</p>
                    </div>
                    {!notification.read ? (
                      <span className="w-2 h-2 rounded-full bg-[goldenrod] mt-2 shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3">
                    {formatDisplayDateTime(notification.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {setlistShareModal.open ? (
        <SetlistShareModal
          share={setlistShareModal.share}
          loading={setlistShareModal.loading}
          error={setlistShareModal.error}
          responding={setlistShareModal.responding}
          onClose={() =>
            setSetlistShareModal({
              open: false,
              share: null,
              loading: false,
              error: "",
              responding: false,
            })
          }
          onRespond={handleSetlistShareResponse}
        />
      ) : null}
    </div>
  );
}
