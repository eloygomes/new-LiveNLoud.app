import * as React from "react";
import { useNavigate } from "react-router-dom";

import UserProfileAvatar from "../../Layouts/UserProfileAvatar";
import userPerfil from "../../assets/userPerfil.jpg";

export default function UserProfileModal() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate(); // Hook para navegação

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
            className="relative p-4 rounded bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">@username</h2>

            {/* Botões */}
            <div className="mt-2 text-gray-700">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <button
                    className="relative py-5 px-5 neuphormism-b-btn-gold"
                    onClick={() => navigate("/userprofile/1")}
                    aria-label="Profile"
                  >
                    Profile
                  </button>
                </div>
                <div>
                  <button
                    className="relative py-5 px-5 neuphormism-b-btn-gold"
                    onClick={() => console.log("Settings")}
                    aria-label="Settings"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="mt-2 text-gray-700">
              <div className="flex items-center justify-between">
                <button
                  className="w-full relative py-2 px-5 neuphormism-b-btn-gold"
                  onClick={() => console.log("Sign Out")}
                  aria-label="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Fechar */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={handleClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
