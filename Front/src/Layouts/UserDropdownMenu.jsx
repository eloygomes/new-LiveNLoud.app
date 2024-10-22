import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// logout function
import { logout } from "../authFunctions";
import { useEffect } from "react";
import { useState } from "react";
import UserProfileAvatar from "./UserProfileAvatar";

import userPerfil from "../assets/userPerfil.jpg";

/* eslint-disable react/prop-types */
function UserDropdownMenu({
  userDropdownMenuStatus,
  setUserDropdownMenuStatus,
}) {
  const navigate = useNavigate(); // Initialize navigate here
  const [userName, setUserName] = useState("");

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    setUserName(localStorage.getItem("username"));
  }, []);

  return (
    <>
      {window.innerWidth <= 926 && window.innerWidth > 426 && (
        <div
          className={`${
            userDropdownMenuStatus ? "" : "hidden"
          } flex flex-row absolute right-0 z-10  origin-top-right rounded-md py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none neuphormism-b mx-2`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex="60"
        >
          <Link
            to="/userprofile/1"
            className="block px-4 py-2 my-2 text-sm text-gray-700 hover:bg-gray-300 truncate  mx-2"
            role="menuitem"
            tabIndex="-1"
            id="user-menu-item-0"
            onClick={() => setUserDropdownMenuStatus(false)}
          >
            User Profile
          </Link>

          <Link
            className="block px-4 py-2 my-2 text-sm text-gray-700 hover:bg-gray-300 truncate  mx-2 flex-1"
            role="menuitem"
            tabIndex="-1"
            id="user-menu-item-2"
            onClick={() => {
              handleLogout();
              setUserDropdownMenuStatus(false);
            }}
          >
            Sign out
          </Link>
        </div>
      )}
      {window.innerWidth >= 926 && (
        <div
          className={`${
            userDropdownMenuStatus ? "" : "hidden"
          } w-[400px] absolute top-3 right-0  mt-0 origin-top-right rounded-md bg-white py-0 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none neuphormism-b flex flex-row  `}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex="60"
        >
          <div className="flex flex-rowdivide-x-2 divide-gray-300">
            <Link
              to="/userprofile/1"
              className="block px-4  py-3 text-sm text-gray-700 hover:bg-gray-300 truncate  mx-2 flex-2"
              role="menuitem"
              tabIndex="-1"
              id="user-menu-item-0"
              onClick={() => setUserDropdownMenuStatus(false)}
            >
              User Profile
            </Link>

            <Link
              className="block px-4  py-3 text-sm text-gray-700 hover:bg-gray-300 truncate  mx-2 flex-1 "
              role="menuitem"
              tabIndex="-1"
              id="user-menu-item-2"
              onClick={() => {
                handleLogout();
                setUserDropdownMenuStatus(false);
              }}
            >
              Sign out
            </Link>
          </div>

          <h1 className="mr-4 py-3 px-4 flex-1 truncate  font-extrabold uppercase ">
            {userName}
          </h1>
          <div className="py-2 ">
            <div className="flex items-center space-x-2  relative right-3">
              <img
                className={`w-8 h-8 object-cover neuphormism-b-avatar`}
                alt={`alt`}
                src={userPerfil}
                onClick={() => setUserDropdownMenuStatus(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserDropdownMenu;
