import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaFilter,
  FaListUl,
  FaPlusCircle,
  FaSearch,
  FaTools,
  FaUser,
} from "react-icons/fa";
import "../index.css";
import NavMenuItems from "./NavMenuItems";
import UserProfileModal from "../Tools/modal/UserProfileModal";
import NotificationBell from "./NotificationBell";
import SearchBox from "../Pages/Dashboard/SearchBox/SearchBox";

export default function RootLayouts() {
  // ===== ESTADO DA BUSCA (navbar) =====
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hideMobileChrome, setHideMobileChrome] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardRoute = location.pathname === "/";
  const isToolsRoute = location.pathname === "/tools";
  const isToolDetailRoute = [
    "/chordlibrary",
    "/tuner",
    "/metronome",
    "/calendar",
  ].includes(location.pathname);
  const isNewSongRoute = location.pathname === "/newsong";
  const isEditSongRoute = location.pathname.startsWith("/editsong/");
  const isPresentationRoute = location.pathname.startsWith("/presentation/");
  const isTouchDashboardLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const hasActiveSearch = searchTerm.trim().length > 0;
  const searchButtonClassName = `rounded-full p-3 neuphormism-b-btn ${
    hasActiveSearch
      ? "blinking-icon text-black"
      : ""
  }`;
  const hideFilterOnTouchRoute =
    isToolsRoute || isToolDetailRoute || isNewSongRoute || isEditSongRoute;
  const hideMobileHeader =
    isNewSongRoute || isEditSongRoute || (isPresentationRoute && hideMobileChrome);
  const needsTouchTopOffset =
    isTouchDashboardLayout &&
    !isPresentationRoute &&
    !isToolDetailRoute &&
    !hideMobileHeader;
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

  useEffect(() => {
    if (!isDashboardRoute) {
      setIsSearchOpen(false);
    }
  }, [isDashboardRoute]);

  useEffect(() => {
    const handleCloseAllModals = () => {
      setIsSearchOpen(false);
    };

    window.addEventListener("close-all-modals", handleCloseAllModals);

    return () => {
      window.removeEventListener("close-all-modals", handleCloseAllModals);
    };
  }, []);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("close-all-modals"));
    setIsSearchOpen(true);
  };

  const openFilter = () => {
    window.dispatchEvent(new CustomEvent("close-all-modals"));
    window.dispatchEvent(new CustomEvent("dashboard-mobile-open-filter"));
  };

  return (
    <>
      {/* HEADER */}
      <header>
        {/* Mobile */}
        {window.innerWidth <= 1024 &&
        !isToolDetailRoute &&
        !hideMobileHeader ? (
          <nav className="fixed inset-x-0 top-0 z-[11900] bg-[#f0f0f0] px-4 pb-3 pt-4 shadow-[0_10px_24px_rgba(240,240,240,0.96)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1
                  className="font-black text-[2rem] tracking-tight"
                  onClick={() => navigate("/")}
                >
                  {isDashboardRoute ? "SONGLIST" : "SUSTENIDO"}
                </h1>
              </div>

              {!hideFilterOnTouchRoute ? (
                <div className="flex shrink-0 items-center gap-3">
                  {isDashboardRoute ? (
                    <button
                      type="button"
                      className={`relative z-[95] ${searchButtonClassName}`}
                      onClick={openSearch}
                      aria-label="Open search"
                    >
                      <FaSearch size={14} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="relative z-[95] rounded-full p-3 neuphormism-b-btn"
                    onClick={openFilter}
                    aria-label="Open filters"
                  >
                    <FaFilter size={14} />
                  </button>
                  <div className="relative z-[95]">
                    <NotificationBell />
                  </div>
                </div>
              ) : null}
            </div>
          </nav>
        ) : null}

        {/* Desktop */}
        {window.innerWidth >= 1025 && (
          <nav className="neuphormism-b fixed z-[11900] w-full">
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
                  {isDashboardRoute ? (
                    isSearchOpen ? null : (
                      <button
                        type="button"
                        className={searchButtonClassName}
                        onClick={openSearch}
                        aria-label="Open search"
                      >
                        <FaSearch size={14} />
                      </button>
                    )
                  ) : null}
                  {!(hideFilterOnTouchRoute && isTouchDashboardLayout) ? (
                    <NotificationBell />
                  ) : null}
                  <div className="relative ml-3">
                    <UserProfileModal />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>

      {isDashboardRoute && isSearchOpen ? (
        window.innerWidth <= 1024 ? (
          <div className="fixed inset-0 z-[12100] flex items-center justify-center bg-black/25 px-4">
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close search"
              onClick={() => setIsSearchOpen(false)}
            />
            <SearchBox
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onClose={() => setIsSearchOpen(false)}
              autoFocus
              className="relative z-[12101] w-full max-w-[420px] rounded-[18px] bg-[#f0f0f0] pb-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
            />
          </div>
        ) : (
          <SearchBox
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClose={() => setIsSearchOpen(false)}
            autoFocus
            className="fixed right-[12.5rem] top-[1.0rem] z-[12100] w-[360px] rounded-lg bg-[#f0f0f0] pb-4 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
          />
        )
      ) : null}

      {/* CONTEÚDO */}
      <main className="min-h-screen">
        <div
          data-scroll-removed-mongo-user="true"
          className={`flex-1 ${
            (isDashboardRoute && !isTouchDashboardLayout) ||
            (isToolsRoute && isTouchDashboardLayout)
              ? "overflow-y-hidden"
              : "overflow-y-auto"
          } ${
            needsTouchTopOffset
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
