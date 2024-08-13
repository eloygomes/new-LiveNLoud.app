import { Outlet } from "react-router-dom";
import { useState } from "react";
// IMG
import logoProv from "../assets/logo-provisorio.svg";
import userIcon from "../assets/user-logo.svg";
// CSS
import "../index.css";
import UserDropdownMenu from "./UserDropdownMenu";
import NavMenuItems from "./NavMenuItems";
import UserDropdownMenuItems from "./UserDropdownMenuItems";

export default function RootLayouts() {
  const [userDropdownMenuStatus, setUserDropdownMenuStatus] = useState(false);

  return (
    <>
      <header>
        <nav className="neuphormism-b fixed w-full z-50">
          {/* <nav className="rounded-[12px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"> */}
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* <!-- Mobile menu button--> */}
                <button
                  type="button"
                  className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                >
                  <span className="absolute -inset-0.5"></span>
                  <span className="sr-only">Open main menu</span>
                  {/* <!-- Icon when menu is closed. Menu open: "hidden", Menu closed: "block"  --> */}
                  <svg
                    className="block h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                  {/* <!-- Icon when menu is open. Menu open: "block", Menu closed: "hidden" --> */}
                  <svg
                    className="hidden h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src={logoProv}
                    alt="Your Company"
                  />
                </div>
                <NavMenuItems />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {/* <!-- Profile dropdown --> */}
                <div className="relative ml-3">
                  <div>
                    <button
                      type="button"
                      className="relative flex rounded-full  text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                      id="user-menu-button"
                      aria-expanded="false"
                      aria-haspopup="true"
                      onClick={() =>
                        setUserDropdownMenuStatus(!userDropdownMenuStatus)
                      }
                    >
                      <span className="absolute -inset-1.5"></span>
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={userIcon}
                        alt=""
                      />
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
          {/* <!-- Mobile menu, show/hide based on menu state. --> */}
          <UserDropdownMenuItems />
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
