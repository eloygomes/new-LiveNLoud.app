function UserDropdownMenu({
  userDropdownMenuStatus,
  setUserDropdownMenuStatus,
}) {
  return (
    // This hidden class is hidding the dropdown menu
    <div
      className={` ${
        userDropdownMenuStatus ? "" : "hidden"
      }  absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none neuphormism-b`}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
      tabIndex="60"
    >
      {/* <!-- Active: "bg-gray-100", Not Active: "" --> */}
      <a
        href="#"
        className="block px-4 py-2 my-1 text-sm text-gray-700 hover:bg-gray-300 truncate"
        role="menuitem"
        tabIndex="-1"
        id="user-menu-item-0"
      >
        Your Profile
      </a>
      <a
        href="#"
        className="block px-4 py-2 my-1 text-sm text-gray-700 hover:bg-gray-300 truncate"
        role="menuitem"
        tabIndex="-1"
        id="user-menu-item-1"
      >
        Settings
      </a>
      <a
        href="#"
        className="block px-4 py-2 my-1 text-sm text-gray-700 hover:bg-gray-300 truncate"
        role="menuitem"
        tabIndex="-1"
        id="user-menu-item-2"
      >
        Sign out
      </a>
    </div>
  );
}

export default UserDropdownMenu;
