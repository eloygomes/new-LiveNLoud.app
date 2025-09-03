import { useEffect, useState, useCallback } from "react";
import DashList2Items from "./DashList2Items";
import DashboardOptions from "./DashboardOptions";

function DashList2() {
  const [isMobile, setIsMobile] = useState(false);
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [optStatus, setOptStatus] = useState(false);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);

  // Carrega as músicas da API
  useEffect(() => {
    async function fetchSongs() {
      const userEmail = localStorage.getItem("userEmail");
      console.log("EMAIL DO USUÁRIO:", userEmail); // <- MOVA ISSO PRA CIMA

      try {
        const response = await fetch(
          `https://api.live.eloygomes.com.br/api/alldata/${userEmail}`
        );
        console.log("STATUS:", response.status);

        const data = await response.json();
        console.log("DATA RECEBIDA:", data);

        const songsData = (data.userdata || []).filter(
          (item) =>
            item.song?.trim() !== "" &&
            item.artist?.trim() !== "" &&
            item.progressBar !== undefined
        );

        setSongs(songsData);
        setFilteredSongs(songsData);
      } catch (error) {
        console.error("Erro ao buscar músicas:", error);
      }
    }

    fetchSongs();
  }, []);

  // Detecta se é mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 840);
  }, []);

  // Callback para filtrar músicas conforme as tags selecionadas
  const handleFilterChange = useCallback(
    (filters) => {
      const trimmedFilters = filters.map((f) => f.trim().toLowerCase());
      if (trimmedFilters.length === 0) {
        // Sem filtros => mostra tudo
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

  // Ordenação simples
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
      {/* Monta SEMPRE o DashboardOptions (mesmo se optStatus === false) */}
      <DashboardOptions
        optStatus={optStatus}
        setOptStatus={setOptStatus}
        onFilterChange={handleFilterChange}
        style={{ display: optStatus ? "block" : "none" }}
      />

      {isMobile ? (
        // ----- MODO MOBILE -----
        <div>
          <div className="flex flex-col mt-0">
            {/* Cabeçalho fixo mobile */}
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
            <ul className="overflow-auto h-screen mb-20">
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={filteredSongs}
              />
            </ul>
          </div>
        </div>
      ) : (
        // ----- MODO DESKTOP -----
        <div className="container mx-auto">
          <div className="flex flex-col mt-0 h-[97vh]">
            {/* Botão para mostrar/ocultar painel de filtros */}
            {!optStatus && (
              <div
                className={`flex flex-col top-[67px] sticky justify-around neuphormism-b bg-white z-30 ${
                  optStatus ? "hidden" : "flex"
                }`}
              >
                {/* <div className="flex flex-col top-[67px] sticky justify-around neuphormism-b bg-white z-30"> */}
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
            )}

            <ul className="overflow-auto h-screen mt-16 pb-60">
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={filteredSongs}
              />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashList2;
