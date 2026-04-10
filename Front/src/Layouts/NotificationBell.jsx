import { useEffect, useMemo, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  fetchCurrentUserProfile,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../Tools/Controllers";

function formatNotificationDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function closeAllModals() {
  window.dispatchEvent(new CustomEvent("close-all-modals"));
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [panelStyle, setPanelStyle] = useState({ top: 76, right: 24 });
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

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener(
        "dashboard-mobile-close-notifications",
        handleForceClose,
      );
    };
  }, []);

  const handleOpen = async () => {
    const button = bellRef.current?.querySelector("button");
    if (button) {
      const rect = button.getBoundingClientRect();
      setPanelStyle({
        top: rect.bottom + 12,
        right: Math.max(window.innerWidth - rect.right, 16),
      });
    }

    if (!open) {
      if (window.innerWidth <= 1024) {
        window.dispatchEvent(
          new CustomEvent("dashboard-mobile-close-filter"),
        );
      }

      try {
        const nextNotifications = await fetchNotifications();
        setNotifications(nextNotifications);
      } catch (error) {
        console.error("Failed to refresh notifications:", error);
      }
    }

    setOpen((current) => !current);
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

  return (
    <div className="relative z-[10001]" ref={bellRef}>
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
          className="fixed w-[340px] max-w-[calc(100vw-2rem)] neuphormism-b p-4 z-[10020] shadow-2xl"
          style={panelStyle}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase">Notifications</h3>
              <p className="text-[11px] text-gray-500">
                Calendar and invitation activity lands here.
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

                    if (notification.type === "calendar_invite" && notification.meta?.eventId) {
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
                    {formatNotificationDate(notification.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
