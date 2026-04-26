import { NavLink } from "react-router-dom";

function NavMenuItems() {
  const navItemClassName = ({ isActive }) =>
    `pb-2 text-sm pt-3 font-bold uppercase cursor-pointer ${
      isActive ? "text-[goldenrod]" : "text-gray-500 hover:text-[goldenrod]"
    }`;

  return (
    <>
      {/* {window.innerWidth <= 926 && window.innerWidth > 426 && ( */}
      {window.innerWidth <= 768 && (
        <div className="hidden sm:ml-6 sm:block">
          <div className="flex space-x-4 my-4 ml-2">
            <NavLink
              to="/chordlibrary"
              className={navItemClassName}
            >
              Chord Library
            </NavLink>
            <NavLink
              to="/tuner"
              className={navItemClassName}
            >
              Tuner
            </NavLink>
            <NavLink to="/calendar" className={navItemClassName}>
              Calendar
            </NavLink>
            <NavLink
              to="/metronome"
              className={navItemClassName}
            >
              Metronome
            </NavLink>
          </div>
        </div>
      )}
      {window.innerWidth >= 769 && (
        <div className="hidden sm:ml-6 sm:block">
          <div className="flex space-x-10">
            <NavLink
              to="/chordlibrary"
              className={navItemClassName}
            >
              Chord Library
            </NavLink>
            <NavLink
              to="/tuner"
              className={navItemClassName}
            >
              Tuner
            </NavLink>
            <NavLink to="/calendar" className={navItemClassName}>
              Calendar
            </NavLink>
            <NavLink
              to="/metronome"
              className={navItemClassName}
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
