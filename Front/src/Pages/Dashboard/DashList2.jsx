import { useEffect, useState, useCallback, useMemo } from "react";
import DashList2Items from "./DashList2Items";
import DashboardOptions from "./DashboardOptions";
import { fetchUserSongs } from "../../Tools/Controllers";

function DashList2({ searchTerm = "", setSearchTerm = () => {} }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [optStatus, setOptStatus] = useState(false);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);

  // Carrega as músicas da API
  useEffect(() => {
    (async () => {
      const { songs, fullName, username } = await fetchUserSongs();

      setSongs(songs);
      setFilteredSongs(songs);

      localStorage.setItem("fullName", fullName);
      localStorage.setItem("username", username);
    })();
  }, []);

  // Detecta se é mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 840);
  }, []);

  // Filtro por setlists (já existia)
  const handleFilterChange = useCallback(
    (filters) => {
      const trimmedFilters = filters.map((f) => f.trim().toLowerCase());
      if (trimmedFilters.length === 0) {
        setFilteredSongs(songs);
      } else {
        const filtered = songs.filter((song) => {
          const songSetlists = (song.setlist || []).map((s) =>
            s.trim().toLowerCase()
          );
          return trimmedFilters.some((filter) => songSetlists.includes(filter));
        });
        setFilteredSongs(filtered);
      }
    },
    [songs]
  );

  // ===== NOVO: aplica busca em cima de filteredSongs =====
  const displaySongs = useMemo(() => {
    if (!searchTerm) return filteredSongs;

    const term = searchTerm.toLowerCase();

    return filteredSongs.filter((song) => {
      const songName = (song.song || "").toLowerCase();
      const artistName = (song.artist || "").toLowerCase();

      return songName.includes(term) || artistName.includes(term);
    });
  }, [filteredSongs, searchTerm]);

  // Ordenação simples (na DashList2Items a ordenação é reaplicada)
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full h-full">
      <DashboardOptions
        optStatus={optStatus}
        setOptStatus={setOptStatus}
        onFilterChange={handleFilterChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        style={{ display: optStatus ? "block" : "none" }}
      />

      {isMobile ? (
        // ----- MODO MOBILE -----
        <div>
          <div className="flex flex-col mt-0">
            <div className="flex flex-row justify-around neuphormism-b p-3 sticky top-0 bg-white z-40 sm:mt-0 md:mt-14 lg:mt-14 xl:mt-14 2xl:mt-14">
              <div
                className="w-[10%] text-center px-1 cursor-pointer"
                onClick={() => handleSort("number")}
              >
                N
              </div>
              <div
                className="w-full px-5 cursor-pointer"
                onClick={() => handleSort("song")}
              >
                SONGS
                {sortColumn === "song" && (
                  <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                )}
              </div>
              <div
                className="w-full pr-5 cursor-pointer"
                onClick={() => handleSort("artist")}
              >
                ARTISTS
                {sortColumn === "artist" && (
                  <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                )}
              </div>
              <div
                className="w-full text-center px-5 cursor-pointer"
                onClick={() => handleSort("progressBar")}
              >
                PROGRESSION
                {sortColumn === "progressBar" && (
                  <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                )}
              </div>
              <div className="w-full text-center px-5">INSTRUMENTS</div>
            </div>
            <ul className="overflow-auto h-screen mb-40">
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={displaySongs}
              />
            </ul>
          </div>
        </div>
      ) : (
        // ----- MODO DESKTOP -----
        <div className="container mx-auto ">
          <div className="flex flex-col mt-0 h-[100vh] pb-20">
            {!optStatus && (
              <div
                className={`fixed left-1/2 top-[80px] w-[91%] -translate-x-1/2 transform pointer-events-none z-50 ${
                  optStatus ? "hidden" : "block"
                }`}
              >
                <div className="flex flex-col justify-around neuphormism-b bg-white pointer-events-auto">
                  <div className="flex flex-row p-3 rounded-t-md">
                    <div
                      className="w-[10%] text-center px-5 cursor-pointer"
                      onClick={() => handleSort("number")}
                    >
                      N
                    </div>
                    <div
                      className="w-full px-5 cursor-pointer"
                      onClick={() => handleSort("song")}
                    >
                      SONGS
                      {sortColumn === "song" && (
                        <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </div>
                    <div
                      className="w-full pl-5 cursor-pointer"
                      onClick={() => handleSort("artist")}
                    >
                      ARTISTS
                      {sortColumn === "artist" && (
                        <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </div>
                    <div
                      className="w-full text-center pr-5 cursor-pointer"
                      onClick={() => handleSort("progressBar")}
                    >
                      PROGRESSION
                      {sortColumn === "progressBar" && (
                        <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </div>
                    <div className="w-full text-center px-5">INSTRUMENTS</div>
                  </div>

                  <div
                    className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer"
                    onClick={() => setOptStatus(!optStatus)}
                  >
                    {optStatus ? "HIDE OPTIONS" : "SHOW OPTIONS"}
                  </div>
                </div>
              </div>
            )}

            <ul
              className={`overflow-auto h-screen   pb-60 ${
                optStatus ? "mt-2" : "mt-20"
              }`}
            >
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={displaySongs}
              />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashList2;
