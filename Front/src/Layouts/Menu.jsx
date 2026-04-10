import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaFilter,
  FaListUl,
  FaPlusCircle,
  FaTools,
  FaUser,
} from "react-icons/fa";
import "../index.css";
import NavMenuItems from "./NavMenuItems";
import UserProfileModal from "../Tools/modal/UserProfileModal";
import NotificationBell from "./NotificationBell";

export default function RootLayouts() {
  // ===== ESTADO DA BUSCA (navbar) =====
  const [searchTerm, setSearchTerm] = useState("");
  const [hideMobileChrome, setHideMobileChrome] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardRoute = location.pathname === "/";
  const isPresentationRoute = location.pathname.startsWith("/presentation/");
  const isTouchDashboardLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const mobileTabs = [
    { to: "/", label: "Songlist", icon: FaListUl },
    { to: "/newsong", label: "Plus", icon: FaPlusCircle },
    { to: "/tools", label: "Tools", icon: FaTools },
    { to: "/userprofile/1", label: "User", icon: FaUser },
  ];

  useEffect(() => {
    const handleVisibilityChange = (event) => {
      setHideMobileChrome(Boolean(event.detail?.hidden));
    };

    window.addEventListener(
      "mobile-ui-visibility-change",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "mobile-ui-visibility-change",
        handleVisibilityChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!isPresentationRoute) {
      setHideMobileChrome(false);
    }
  }, [isPresentationRoute, location.pathname]);

  return (
    <>
      {/* HEADER */}
      <header>
        {/* Mobile */}
        {window.innerWidth <= 768 && !isPresentationRoute && (
          <nav className="fixed inset-x-0 top-0 z-[90] bg-[#f0f0f0] px-4 pb-3 pt-4 shadow-[0_10px_24px_rgba(240,240,240,0.96)]">
            <div className="flex items-center justify-between flex-row">
              <div className="flex flex-row">
                <h1
                  className="font-black text-[2rem] tracking-tight"
                  onClick={() => navigate("/")}
                >
                  {location.pathname === "/" ? "SONGLIST" : "SUSTENIDO"}
                </h1>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  className="relative z-[95] mr-5 rounded-full p-3 neuphormism-b-btn"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("dashboard-mobile-close-notifications"),
                    );
                    window.dispatchEvent(
                      new CustomEvent("dashboard-mobile-open-filter"),
                    );
                  }}
                  aria-label="Open filters"
                >
                  <FaFilter size={14} />
                </button>
                <div className="relative z-[95] rounded-[16px] bg-[#efefef] p-0 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                  <NotificationBell />
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Desktop */}
        {window.innerWidth >= 769 && (
          <nav className="neuphormism-b fixed w-full z-20">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-row flex-shrink-0 items-center">
                    <h1 className="font-bold text-3xl">#</h1>
                    <h1
                      className="ml-2 font-bold italic mr-5 text-xl cursor-pointer"
                      onClick={() => navigate("/")}
                    >
                      SUSTENIDO
                    </h1>
                  </div>
                  <NavMenuItems />
                </div>

                {/* ====== Botão + input de busca ====== */}
                <div className="absolute inset-y-0 right-4 top-0 flex items-center gap-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <NotificationBell />
                  <div className="relative ml-3">
                    <UserProfileModal />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* CONTEÚDO */}
      <main className="min-h-screen">
        <div
          data-scroll-removed-mongo-user="true"
          className={`flex-1 ${
            isDashboardRoute && !isTouchDashboardLayout
              ? "overflow-y-hidden"
              : "overflow-y-auto"
          } ${
            isTouchDashboardLayout && !isPresentationRoute
              ? "pt-[5.25rem]"
              : "pt-0"
          } ${
            hideMobileChrome && isPresentationRoute ? "pb-0" : "pb-24"
          } md:pb-0 md:pt-16`}
          style={{ maxHeight: isTouchDashboardLayout ? "none" : "100vh" }}
          // className={`flex-1 overflow-y-hidden pt-0 md:pt-16`}
          // style={{ maxHeight: "100vh" }}
        >
          {/* aqui a magia: passamos searchTerm e setter para as rotas filhas */}
          <Outlet context={{ searchTerm, setSearchTerm }} />
        </div>
      </main>

      {window.innerWidth <= 1024 &&
        !(isPresentationRoute && hideMobileChrome) && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 px-0 pb-0">
          <div className="grid grid-cols-4 bg-black px-2 py-2 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
            {mobileTabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 rounded-[14px] py-2 text-[11px] font-bold ${
                    isActive ? "text-[goldenrod]" : "text-[#9d9d9d]"
                  }`
                }
              >
                <Icon className="text-[18px]" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
