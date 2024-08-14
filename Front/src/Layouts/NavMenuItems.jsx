import { NavLink } from "react-router-dom";

function NavMenuItems() {
  return (
    <div className="hidden sm:ml-6 sm:block">
      <div className="flex space-x-4">
        {/* <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" --> */}
        <NavLink
          to="/"
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 "
          aria-current="page"
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/newsong"
          className="rounded-md px-3 py-2 text-sm font-medium  text-gray-500 hover:text-gray-900 "
        >
          New Song
        </NavLink>
        <NavLink
          to="/chordlibrary"
          className="rounded-md px-3 py-2 text-sm font-medium  text-gray-500 hover:text-gray-900 "
        >
          Chord Library
        </NavLink>
        <NavLink
          to="/tuner"
          className="rounded-md px-3 py-2 text-sm font-medium  text-gray-500 hover:text-gray-900 "
        >
          Tuner
        </NavLink>
        <NavLink
          to="/metronome"
          className="rounded-md px-3 py-2 text-sm font-medium  text-gray-500 hover:text-gray-900 "
        >
          Metronome
        </NavLink>

        <NavLink
          to="/userregistration"
          className="rounded-md px-3 py-2 text-sm font-medium  text-gray-500 hover:text-gray-900 "
        >
          USER REGISTRATION
        </NavLink>
      </div>
    </div>
  );
}

export default NavMenuItems;
