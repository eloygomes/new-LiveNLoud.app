import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../index.css";
import NavMenuItems from "./NavMenuItems";
import MenuMobileFull from "./MenuMobileFull";
import UserProfileModal from "../Tools/modal/UserProfileModal";

export default function RootLayouts() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ===== ESTADO DA BUSCA (navbar) =====
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardRoute = location.pathname
    .toLowerCase()
    .includes("dashboard");


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
                <div className="absolute inset-y-0 right-4 top-0 flex items-center gap-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
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
          className={`flex-1 ${
            isDashboardRoute ? "overflow-y-hidden" : "overflow-y-auto"
          } pt-0 md:pt-16`}
          style={{ maxHeight: "100vh" }}
        >
          {/* aqui a magia: passamos searchTerm e setter para as rotas filhas */}
          <Outlet context={{ searchTerm, setSearchTerm }} />
        </div>
      </main>
    </>
  );
}
