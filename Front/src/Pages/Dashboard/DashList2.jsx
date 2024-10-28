import { useEffect, useState } from "react";
import DashList2Items from "./DashList2Items";

function DashList2() {
  const [isMobile, setIsMobile] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (window.innerWidth <= 845) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  // Função para lidar com a ordenação
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Alterna entre ascendente e descendente se a mesma coluna for clicada novamente
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Define a nova coluna de ordenação e reseta a ordem para ascendente
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full h-full">
      {isMobile ? (
        <div className="">
          <div className="flex flex-col mt-0">
            {/* Header que ficará fixo no topo */}
            <div className="flex flex-row justify-around neuphormism-b p-3 sticky top-0 bg-white z-40">
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
              <DashList2Items sortColumn={sortColumn} sortOrder={sortOrder} />
            </ul>
          </div>
        </div>
      ) : (
        <div className="container mx-auto">
          <div className="flex flex-col mt-0 h-[97vh]">
            {/* Header que ficará fixo no topo */}
            <div className="flex flex-row justify-around neuphormism-b p-3 sticky top-[68px] bg-white z-30">
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

            <ul className="overflow-auto h-screen mt-16 pb-60">
              <DashList2Items sortColumn={sortColumn} sortOrder={sortOrder} />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashList2;
