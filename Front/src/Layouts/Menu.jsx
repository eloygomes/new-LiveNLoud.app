import { Outlet } from "react-router-dom";
import { useState } from "react";
// IMG
import logoProv from "../assets/logo-provisorio.svg";
// import userIcon from "../assets/user-logo.svg";
import userPerfil from "../assets/userPerfil.jpg";
// CSS
import "../index.css";
import UserDropdownMenu from "./UserDropdownMenu";
import NavMenuItems from "./NavMenuItems";

import UserProfileAvatar from "./UserProfileAvatar";
import { useNavigate } from "react-router-dom";

export default function RootLayouts() {
  const [userDropdownMenuStatus, setUserDropdownMenuStatus] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate(); // Initialize navigate here

  return (
    <>
      <header>
        {/* Turn Right  */}
        {/* {window.innerWidth <= 428 && (

        )} */}
        {/* Mobile  */}
        {window.innerWidth <= 926 && window.innerWidth > 426 && (
          <nav className=" p-4  ">
            <div className="flex justify-between items-center">
              {/* Logo à esquerda */}
              <div className="flex flex-row">
                <img className="h-8 w-auto" src={logoProv} alt="Your Company" />
                <h1
                  className="ml-2 font-bold mr-5 p-1"
                  onClick={() => navigate("/")}
                >
                  Live N Loud
                </h1>
              </div>

              {/* Botão do menu hamburguer à direita */}
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
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
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
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
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

            {/* Menu móvel */}
            {mobileMenuOpen && (
              <div className="flex flex-row justify-between " id="mobile-menu">
                <NavMenuItems />
                <button
                  type="button"
                  className="relative flex rounded-full  text-sm py-2"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                  onClick={() =>
                    setUserDropdownMenuStatus(!userDropdownMenuStatus)
                  }
                >
                  <span className="absolute -inset-1.5"></span>
                  <span className="sr-only">Open user menu</span>
                  {/* SE O USUARIO NAO TIVER FOTO O SRC SERÁ: userIcon */}
                  <UserProfileAvatar src={userPerfil} size={8} />
                </button>
                <UserDropdownMenu
                  userDropdownMenuStatus={userDropdownMenuStatus}
                  setUserDropdownMenuStatus={setUserDropdownMenuStatus}
                />
              </div>
            )}
          </nav>
        )}
        {/* Desktop  */}
        {window.innerWidth >= 926 && (
          <nav className="neuphormism-b fixed w-full z-20">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-row flex-shrink-0 items-center">
                    <img
                      className="h-8 w-auto"
                      src={logoProv}
                      alt="Your Company"
                    />
                    <h1
                      className="ml-2 font-bold mr-5"
                      onClick={() => navigate("/")}
                    >
                      Live N Loud
                    </h1>
                  </div>
                  <NavMenuItems />
                </div>
                <div className="absolute inset-y-0 right-20 top-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {/* <!-- Profile dropdown --> */}
                  <div className="relative ml-3">
                    <div>
                      <button
                        type="button"
                        className="relative flex rounded-full  text-sm "
                        id="user-menu-button"
                        aria-expanded="false"
                        aria-haspopup="true"
                        onClick={() =>
                          setUserDropdownMenuStatus(!userDropdownMenuStatus)
                        }
                      >
                        <span className="absolute -inset-1.5"></span>
                        <span className="sr-only">Open user menu</span>
                        {/* SE O USUARIO NAO TIVER FOTO O SRC SERÁ: userIcon */}
                        <UserProfileAvatar src={userPerfil} size={8} />
                      </button>
                    </div>
                    <UserDropdownMenu
                      userDropdownMenuStatus={userDropdownMenuStatus}
                      setUserDropdownMenuStatus={setUserDropdownMenuStatus}
                    />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
