import { useState, useEffect } from "react";

import UserProfileAvatar from "../../Layouts/UserProfileAvatar";
import userPerfil from "../../assets/userPerfil.jpg";

// import UserInfo from "./modalContent/UserInfo";
import UserInfo from "./modalContent/UserInfo";
import UserData from "./modalContent/UserData";
import Settings from "./modalContent/Settings";
import Logs from "./modalContent/Logs";
import Bluetooth from "./modalContent/bluetooth/Bluetooth";
import Invitations from "./modalContent/Invitations";
import SoftVersion from "../../Pages/Dashboard/SoftVersion";

const USER_HUB_MENU = [
  { value: "USER INFO", label: "User Info" },
  { value: "USER DATA", label: "User Data" },
  { value: "FRIENDS", label: "Friends" },
  { value: "SETTINGS", label: "Settings" },
  { value: "BLUETOOTH", label: "Footswitch" },
  { value: "LOGS", label: "Logs" },
];

export default function UserProfileModal() {
  const [open, setOpen] = useState(false);
  const [modalOptionChoosen, setModalOptionChoose] = useState("USER INFO");
  const username =
    (typeof window !== "undefined" && localStorage.getItem("username")) ||
    "User";

  useEffect(() => {
    const handleOpenUserHubSection = (event) => {
      const nextSection = event?.detail?.section || "USER INFO";
      window.dispatchEvent(new CustomEvent("close-all-modals"));
      setModalOptionChoose(nextSection);
      setOpen(true);
      window.dispatchEvent(new CustomEvent("userhub-visibility-change", {
        detail: { open: true },
      }));
    };

    const handleCloseAllModals = () => {
      setOpen(false);
      window.dispatchEvent(new CustomEvent("userhub-visibility-change", {
        detail: { open: false },
      }));
    };

    window.addEventListener("open-userhub-section", handleOpenUserHubSection);
    window.addEventListener("close-all-modals", handleCloseAllModals);
    return () =>
      {
        window.removeEventListener(
          "open-userhub-section",
          handleOpenUserHubSection,
        );
        window.removeEventListener("close-all-modals", handleCloseAllModals);
      };
  }, []);

  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent("close-all-modals"));
    setOpen(true);
    window.dispatchEvent(new CustomEvent("userhub-visibility-change", {
      detail: { open: true },
    }));
  };
  const handleClose = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("userhub-visibility-change", {
      detail: { open: false },
    }));
  };
  const signOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      localStorage.removeItem("artist");
      localStorage.removeItem("avatarUpdatedAt");
      localStorage.removeItem("cifraFROM");
      localStorage.removeItem("fromWHERE");
      localStorage.removeItem("mySelectedSetlists");
      localStorage.removeItem("song");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("cifraFROMDB");
      window.location.href = "/login"; // Redirect to login page
    }
  };

  return (
    <div>
      <button onClick={handleOpen} className="focus:outline-none">
        <UserProfileAvatar src={userPerfil} size={40} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={handleClose}
        >
          <div
            className="relative flex h-[86vh] w-[84vw] min-w-0 max-w-[1600px] flex-col overflow-hidden rounded-[28px] bg-[#ececec] p-4 text-black shadow-[0_24px_80px_rgba(0,0,0,0.36)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 rounded-[22px] neuphormism-b bg-[#ececec] px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[goldenrod]">
                  Account
                </p>
                <h1 className="mt-1 text-4xl font-black uppercase leading-none">
                  User Hub
                </h1>
                <h4 className="mt-1 truncate text-sm font-semibold text-gray-600">
                  Hello @{username}
                </h4>
              </div>
              <button
                type="button"
                className="neuphormism-b-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-3xl font-light leading-none text-gray-600 hover:text-black"
                onClick={handleClose}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 grid min-h-0 flex-1 grid-cols-[minmax(13rem,0.24fr)_minmax(0,1fr)] gap-4 overflow-hidden">
              <aside className="flex min-h-0 flex-col justify-between rounded-[22px] neuphormism-b bg-[#ececec] p-4">
                <div className="min-h-0">
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.28em] text-[goldenrod]">
                    Menu
                  </p>
                  <nav className="mt-4 flex flex-col gap-2">
                    {USER_HUB_MENU.map((item) => {
                      const active = modalOptionChoosen === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`w-full rounded-[14px] px-3 py-3 text-left text-xs font-black uppercase tracking-[0.12em] transition active:scale-[0.98] ${
                            active
                              ? "neuphormism-b-btn-gold text-black"
                              : "neuphormism-b-btn text-gray-600 hover:text-black"
                          }`}
                          onClick={() => setModalOptionChoose(item.value)}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-4 flex shrink-0 flex-col gap-3">
                  <SoftVersion />
                  <button
                    type="button"
                    className="neuphormism-b-btn-gold rounded-[14px] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black active:scale-[0.98]"
                    onClick={() => signOut()}
                    aria-label="Sign Out"
                  >
                    Sign Out
                  </button>
                </div>
              </aside>

              <main className="min-h-0 overflow-hidden rounded-[22px] neuphormism-b bg-[#ececec] p-4">
                {modalOptionChoosen === "USER INFO" ? (
                  <UserInfo />
                ) : modalOptionChoosen === "USER DATA" ? (
                  <UserData />
                ) : modalOptionChoosen === "SETTINGS" ? (
                  <Settings setModalOptionChoose={setModalOptionChoose} />
                ) : modalOptionChoosen === "FRIENDS" ? (
                  <Invitations />
                ) : modalOptionChoosen === "LOGS" ? (
                  <Logs />
                ) : modalOptionChoosen === "BLUETOOTH" ? (
                  <Bluetooth />
                ) : null}
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
