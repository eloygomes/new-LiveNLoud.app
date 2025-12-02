import { Outlet, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "../index.css";
import NavMenuItems from "./NavMenuItems";
import MenuMobileFull from "./MenuMobileFull";
import UserProfileModal from "../Tools/modal/UserProfileModal";

export default function RootLayouts() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ===== ESTADO DA BUSCA (navbar) =====
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const navigate = useNavigate();

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    function handleClickOutside(event) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSearchOpen]);

  return (
    <>
      {/* HEADER */}
      <header>
        {/* Mobile */}
        {window.innerWidth <= 768 && (
          <>
            {mobileMenuOpen && (
              <div className="absolute w-screen h-screen neuphormism-b z-50">
                <MenuMobileFull setMobileMenuOpen={setMobileMenuOpen} />
              </div>
            )}
            <nav className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-row">
                  <h1 className="font-bold text-3xl">#</h1>
                  <h1
                    className="ml-2 font-bold italic mr-5"
                    onClick={() => navigate("/")}
                  >
                    SUSTENIDO
                  </h1>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-controls="mobile-menu"
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <span className="sr-only">Open main menu</span>
                    {mobileMenuOpen ? (
                      <svg
                        className="block h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="block h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 6h18M3 12h18m-18 6h18"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </nav>
          </>
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
                      className="ml-2 font-bold italic mr-5 cursor-pointer"
                      onClick={() => navigate("/")}
                    >
                      SUSTENIDO
                    </h1>
                  </div>
                  <NavMenuItems />
                </div>

                {/* ====== Botão + input de busca ====== */}
                <div
                  ref={searchWrapperRef}
                  className="absolute inset-y-0 right-4 top-0 flex items-center gap-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
                >
                  <div className="flex items-center gap-2">
                    {/* botão da lupa */}
                    <button
                      type="button"
                      onClick={toggleSearch}
                      className="p-2 rounded-full hover:bg-gray-200/60 transition-colors"
                      aria-label="Buscar músicas"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.5" y1="16.5" x2="21" y2="21" />
                      </svg>
                    </button>

                    {/* campo de busca */}
                    {isSearchOpen && (
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar música ou artista..."
                        className="hidden md:block w-64 rounded-md border border-gray-300 bg-white/80 px-3 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>

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
          data-scroll-root="true"
          className="flex-1 overflow-auto pt-0 md:pt-16"
          style={{ maxHeight: "100vh" }}
        >
          {/* aqui a magia: passamos searchTerm para as rotas filhas */}
          <Outlet context={{ searchTerm }} />
        </div>
      </main>
    </>
  );
}
