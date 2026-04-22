/* eslint-disable react/prop-types */
import { IoClose } from "react-icons/io5";

function SearchBox({
  searchTerm,
  setSearchTerm,
  onClose,
  className = "neuphormism-b m-2 pb-5",
  autoFocus = false,
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between  px-5   ">
        <h1 className="text-sm font-bold uppercase">Search</h1>
        {onClose ? (
          <button
            type="button"
            className="rounded-full p-1 text-gray-700 hover:bg-black/5"
            onClick={onClose}
            aria-label="Close search"
          >
            <IoClose className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div className="px-5">
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar música ou artista..."
              autoFocus={autoFocus}
              className="w-full rounded-md border border-gray-300 bg-white/80 py-2 pl-10 pr-10 text-[16px] text-gray-900 shadow-sm focus:border-[goldenrod] focus:outline-none focus:ring-2 focus:ring-[goldenrod] md:text-sm"
            />
            {searchTerm ? (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <IoClose className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchBox;
