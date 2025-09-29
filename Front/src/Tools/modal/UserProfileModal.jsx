import * as React from "react";
import { useState, useEffect } from "react";

import UserProfileAvatar from "../../Layouts/UserProfileAvatar";
import userPerfil from "../../assets/userPerfil.jpg";

// import UserInfo from "./modalContent/UserInfo";
import UserInfo from "./modalContent/UserInfo";
import UserData from "./modalContent/UserData";
import Settings from "./modalContent/Settings";
import Logs from "./modalContent/Logs";

export default function UserProfileModal() {
  const [open, setOpen] = useState(false);
  const [modalOptionChoosen, setModalOptionChoose] = useState("USER INFO");
  const username =
    (typeof window !== "undefined" && localStorage.getItem("username")) ||
    "User";

  const [name, setName] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("username");
      if (storedName) {
        setName(storedName);
      }
    }
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleClose}
        >
          <div
            className="w-5/6 h-5/6 relative flex flex-col p-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-row my-4 neuphormism-b py-2 px-5 justify-between">
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold">USER HUB</h1>
                <h4 className="mr-auto mt-auto text-sm">Hello @{username}</h4>
              </div>
              <div>
                <button
                  className="top-2 right-2 text-gray-500 hover:text-gray-700 text-4xl"
                  onClick={handleClose}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="flex flex-row justify-between h-[90%] overflow-y-scroll">
              {/* menu */}
              <div className="w-[20%] h-auto  flex flex-col justify-between  my-2 neuphormism-b py-2 px-5">
                <ul>
                  <h1 className="text-xl font-bold">MENU</h1>
                  <li
                    className={`my-5 text-xs cursor-pointer ${
                      modalOptionChoosen === "USER INFO"
                        ? "neuphormism-b-btn-desactivated "
                        : "neuphormism-b-btn"
                    }    p-2`}
                    onClick={() => setModalOptionChoose("USER INFO")}
                  >
                    USER INFO
                  </li>
                  <li
                    className={`my-5  text-xs cursor-pointer ${
                      modalOptionChoosen === "USER DATA"
                        ? "neuphormism-b-btn-desactivated "
                        : "neuphormism-b-btn"
                    }    p-2`}
                    onClick={() => setModalOptionChoose("USER DATA")}
                  >
                    USER DATA
                  </li>
                  <li
                    className={`my-5  text-xs cursor-pointer ${
                      modalOptionChoosen === "SETTINGS"
                        ? "neuphormism-b-btn-desactivated "
                        : "neuphormism-b-btn"
                    }    p-2`}
                    onClick={() => setModalOptionChoose("SETTINGS")}
                  >
                    SETTINGS
                  </li>
                  <li
                    className={`my-5  text-xs cursor-pointer ${
                      modalOptionChoosen === "LOGS"
                        ? "neuphormism-b-btn-desactivated "
                        : "neuphormism-b-btn"
                    }    p-2`}
                    onClick={() => setModalOptionChoose("LOGS")}
                  >
                    LOGS
                  </li>
                </ul>
                <button
                  className="py-2   text-xs neuphormism-b-btn-gold text-md bottom-0 my-5 cursor-pointer  "
                  onClick={() => signOut()}
                  aria-label="Sign Out"
                >
                  Sign Out
                </button>
              </div>
              <div className="w-[78%]   flex flex-col  my-2 neuphormism-b py-2 px-5 ">
                {modalOptionChoosen === "USER INFO" ? (
                  <UserInfo />
                ) : modalOptionChoosen === "USER DATA" ? (
                  <UserData />
                ) : modalOptionChoosen === "SETTINGS" ? (
                  <Settings />
                ) : modalOptionChoosen === "LOGS" ? (
                  <Logs />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
