function SearchBox({ searchTerm, setSearchTerm }) {
  return (
    <div className="neuphormism-b m-2 pb-5">
      <h1 className="px-5 my-4 text-sm">Search</h1>
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
              className="w-full rounded-md border border-gray-300 bg-white/80 pl-10 pr-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 "
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchBox;
