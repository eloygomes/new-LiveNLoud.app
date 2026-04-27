import { useEffect, useState, useCallback, useMemo } from "react";
import DashList2Items from "./DashList2Items";
import DashboardOptions from "./DashboardOptions";
import {
  fetchUserSongs,
  loadSelectedSetlists,
  saveSelectedSetlists,
} from "../../Tools/Controllers";

const DEFAULT_VISIBLE_COLUMNS = ["progression", "instruments"];
const OPTIONAL_COLUMNS = [
  { key: "progression", label: "PROGRESSION", sortable: "progressBar" },
  { key: "tags", label: "TAGS" },
  { key: "videos", label: "VIDEOS" },
  { key: "instruments", label: "INSTRUMENTS" },
  { key: "addedDate", label: "DATE ADDED" },
  { key: "lastPlay", label: "LAST PLAY" },
];

function DashList2({ searchTerm = "" }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [optStatus, setOptStatus] = useState(false);
  const [songs, setSongs] = useState([]);
  const [selectedSetlists, setSelectedSetlists] = useState(() =>
    loadSelectedSetlists(),
  );
  const [isUserHubOpen, setIsUserHubOpen] = useState(false);
  const canSelectAllColumns =
    typeof window !== "undefined" && window.innerWidth >= 1280;
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("dashboardVisibleColumns") || "null",
      );
      const validStored = Array.isArray(stored)
        ? stored.filter((key) =>
            OPTIONAL_COLUMNS.some((column) => column.key === key),
          )
        : [];
      if (!validStored.length) return DEFAULT_VISIBLE_COLUMNS;
      return typeof window !== "undefined" &&
        window.innerWidth < 1280 &&
        validStored.length === OPTIONAL_COLUMNS.length
        ? validStored.slice(0, OPTIONAL_COLUMNS.length - 1)
        : validStored;
    } catch {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  const loadSongs = useCallback(async () => {
    const { songs, fullName, username } = await fetchUserSongs();

    setSongs(songs);

    localStorage.setItem("fullName", fullName);
    localStorage.setItem("username", username);
  }, []);

  // Carrega as músicas da API
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  useEffect(() => {
    window.addEventListener("dashboard-refresh-songs", loadSongs);

    return () => {
      window.removeEventListener("dashboard-refresh-songs", loadSongs);
    };
  }, [loadSongs]);

  // Detecta se é mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 840);
  }, []);

  useEffect(() => {
    const handleOpenMobileFilter = () => {
      if (window.innerWidth <= 1024) {
        setOptStatus(true);
      }
    };

    window.addEventListener(
      "dashboard-mobile-open-filter",
      handleOpenMobileFilter,
    );

    return () => {
      window.removeEventListener(
        "dashboard-mobile-open-filter",
        handleOpenMobileFilter,
      );
    };
  }, []);

  useEffect(() => {
    const handleUserHubVisibilityChange = (event) => {
      setIsUserHubOpen(Boolean(event.detail?.open));
    };

    window.addEventListener(
      "userhub-visibility-change",
      handleUserHubVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "userhub-visibility-change",
        handleUserHubVisibilityChange,
      );
    };
  }, []);

  useEffect(() => {
    saveSelectedSetlists(selectedSetlists);
    window.dispatchEvent(
      new CustomEvent("dashboard-filter-state-change", {
        detail: { active: selectedSetlists.length > 0 },
      }),
    );
  }, [selectedSetlists]);

  const filteredSongs = useMemo(() => {
    const trimmedFilters = selectedSetlists.map((filter) =>
      filter.trim().toLowerCase(),
    );

    if (!trimmedFilters.length) return songs;

    return songs.filter((song) => {
      const songSetlists = (song.setlist || []).map((setlist) =>
        setlist.trim().toLowerCase(),
      );
      return trimmedFilters.some((filter) => songSetlists.includes(filter));
    });
  }, [selectedSetlists, songs]);

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

  const toggleOptions = () => {
    if (!optStatus) {
      window.dispatchEvent(new CustomEvent("close-all-modals"));
    }
    setOptStatus((current) => !current);
  };

  const handleToggleColumn = (columnKey) => {
    setVisibleColumns((current) => {
      const isSelected = current.includes(columnKey);
      const next = isSelected
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey];

      if (!canSelectAllColumns && next.length === OPTIONAL_COLUMNS.length) {
        return current;
      }

      localStorage.setItem("dashboardVisibleColumns", JSON.stringify(next));
      return next;
    });
  };

  const orderedVisibleColumns = OPTIONAL_COLUMNS.map(
    (column) => column.key,
  ).filter((key) => visibleColumns.includes(key));
  const listGridTemplateColumns = `0.35fr 1.35fr 1.25fr${
    orderedVisibleColumns.length
      ? ` repeat(${orderedVisibleColumns.length}, minmax(7rem, 1fr))`
      : ""
  }`;

  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <DashboardOptions
        optStatus={optStatus}
        setOptStatus={setOptStatus}
        selectedSetlists={selectedSetlists}
        setSelectedSetlists={setSelectedSetlists}
        visibleSongs={displaySongs}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        canSelectAllColumns={canSelectAllColumns}
        style={{ display: optStatus ? "block" : "none" }}
      />

      {isMobile ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-32">
            <ul>
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={displaySongs}
                visibleColumns={orderedVisibleColumns}
                gridTemplateColumns={listGridTemplateColumns}
              />
            </ul>
          </div>
        </div>
      ) : (
        // ----- MODO DESKTOP -----
        <div className="mx-auto h-[calc(100vh-4rem)] min-h-0 w-full overflow-hidden ">
          <div className="mt-0 flex h-full min-h-0 flex-col overflow-hidden rounded-lg">
            {!optStatus && !isUserHubOpen && (
              <div
                className={`${optStatus ? "hidden" : "block"} sticky top-0 z-40 shrink-0`}
              >
                <div className="flex flex-col justify-around neuphormism-b bg-white">
                  <div
                    className="grid items-center gap-3 rounded-t-md p-3 text-[13px]"
                    style={{
                      gridTemplateColumns: listGridTemplateColumns,
                    }}
                  >
                    <div
                      className="cursor-pointer text-center"
                      onClick={() => handleSort("number")}
                    >
                      N
                    </div>
                    <div
                      className="cursor-pointer px-2"
                      onClick={() => handleSort("song")}
                    >
                      SONGS
                      {sortColumn === "song" && (
                        <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </div>
                    <div
                      className="cursor-pointer px-2"
                      onClick={() => handleSort("artist")}
                    >
                      ARTISTS
                      {sortColumn === "artist" && (
                        <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </div>
                    {OPTIONAL_COLUMNS.filter((column) =>
                      orderedVisibleColumns.includes(column.key),
                    ).map((column) => (
                      <div
                        key={column.key}
                        className="text-center"
                        onClick={() =>
                          column.sortable && handleSort(column.sortable)
                        }
                      >
                        <span
                          className={column.sortable ? "cursor-pointer" : ""}
                        >
                          {column.label}
                          {column.sortable && sortColumn === column.sortable ? (
                            <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer"
                    onClick={toggleOptions}
                  >
                    {optStatus ? "HIDE OPTIONS" : "SHOW OPTIONS"}
                  </div>
                </div>
              </div>
            )}

            <ul
              className={`min-h-0 flex-1 overflow-auto pb-60 z-0 ${
                optStatus ? "mt-[63rem]" : "mt-2"
              }`}
            >
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={displaySongs}
                visibleColumns={orderedVisibleColumns}
                gridTemplateColumns={listGridTemplateColumns}
              />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashList2;
