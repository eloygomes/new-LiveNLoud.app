import { NavLink } from "react-router-dom";

function NavMenuItems() {
  return (
    <>
      {/* {window.innerWidth <= 926 && window.innerWidth > 426 && ( */}
      {window.innerWidth <= 768 && (
        <div className="hidden sm:ml-6 sm:block">
          <div className="flex space-x-4 my-4 ml-2">
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
          </div>
        </div>
      )}
      {window.innerWidth >= 769 && (
        <div className="hidden sm:ml-6 sm:block">
          <div className="flex space-x-4">
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
          </div>
        </div>
      )}
    </>
  );
}

export default NavMenuItems;
