import { useEffect, useState, useCallback, useMemo } from "react";
import DashList2Items from "./DashList2Items";
import DashboardOptions from "./DashboardOptions";
import {
  fetchUserSongs,
  loadSelectedSetlists,
  saveSelectedSetlists,
} from "../../Tools/Controllers";

const DEFAULT_VISIBLE_COLUMNS = ["progression", "notes", "instruments"];
const TABLET_COLUMNS_LIMIT = 3;
const OPTIONAL_COLUMNS = [
  { key: "progression", label: "PROGRESSION", sortable: "progressBar" },
  { key: "notes", label: "NOTES", sortable: "notes" },
  { key: "tags", label: "TAGS", sortable: "tags" },
  { key: "videos", label: "VIDEOS", sortable: "videos" },
  { key: "instruments", label: "INSTRUMENTS", sortable: "instruments" },
  { key: "addedDate", label: "DATE ADDED", sortable: "addedDate" },
  { key: "lastPlay", label: "LAST PLAY", sortable: "lastPlay" },
];

const COLUMN_WIDTHS = {
  progression: "minmax(0, 0.6fr)",
  notes: "minmax(0, 0.38fr)",
  tags: "minmax(0, 0.72fr)",
  videos: "minmax(0, 0.42fr)",
  instruments: "minmax(0, 0.95fr)",
  addedDate: "minmax(0, 0.55fr)",
  lastPlay: "minmax(0, 0.55fr)",
};

function DashList2({ searchTerm = "" }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [optStatus, setOptStatus] = useState(false);
  const [songs, setSongs] = useState([]);
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [selectedSetlists, setSelectedSetlists] = useState(() =>
    loadSelectedSetlists(),
  );
  const [isUserHubOpen, setIsUserHubOpen] = useState(false);
  const isTabletColumnLimited =
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1366;
  const maxSelectableColumns = isTabletColumnLimited
    ? TABLET_COLUMNS_LIMIT
    : OPTIONAL_COLUMNS.length;
  const canSelectAllColumns = maxSelectableColumns >= OPTIONAL_COLUMNS.length;
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
        window.innerWidth >= 768 &&
        window.innerWidth < 1366 &&
        validStored.length > TABLET_COLUMNS_LIMIT
        ? validStored.slice(0, TABLET_COLUMNS_LIMIT)
        : validStored;
    } catch {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  const loadSongs = useCallback(async () => {
    const { songs, fullName, username } = await fetchUserSongs();

    setSongs(songs);
    setSongsLoaded(true);

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
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    const handleOpenMobileFilter = () => {
      if (window.innerWidth < 768) {
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

  useEffect(() => {
    if (!isTabletColumnLimited) return;

    setVisibleColumns((current) => {
      if (current.length <= TABLET_COLUMNS_LIMIT) return current;

      const next = current.slice(0, TABLET_COLUMNS_LIMIT);
      localStorage.setItem("dashboardVisibleColumns", JSON.stringify(next));
      return next;
    });
  }, [isTabletColumnLimited]);

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

      if (next.length > maxSelectableColumns) {
        return current;
      }

      localStorage.setItem("dashboardVisibleColumns", JSON.stringify(next));
      return next;
    });
  };

  const handleMoveColumn = (columnKey, direction) => {
    setVisibleColumns((current) => {
      const currentIndex = current.indexOf(columnKey);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [movedColumn] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, movedColumn);
      localStorage.setItem("dashboardVisibleColumns", JSON.stringify(next));
      return next;
    });
  };

  const orderedVisibleColumns = visibleColumns.filter((key) =>
    OPTIONAL_COLUMNS.some((column) => column.key === key),
  );
  const optionalGridColumns = orderedVisibleColumns
    .map((key) => COLUMN_WIDTHS[key] || "minmax(7rem, 1fr)")
    .join(" ");
  const getTabletColumnWidth = (key) => {
    if (key === "instruments") return "minmax(0, 0.78fr)";
    if (key === "tags") return "minmax(0, 0.7fr)";
    if (key === "addedDate" || key === "lastPlay") return "minmax(0, 0.6fr)";
    return "minmax(0, 0.52fr)";
  };
  const tabletGridColumns = orderedVisibleColumns
    .map((key) => getTabletColumnWidth(key))
    .join(" ");
  const listGridTemplateColumns = isTabletColumnLimited
    ? `2.25rem minmax(0, 1.45fr) minmax(0, 1fr) ${tabletGridColumns}`
    : `2.5rem minmax(0, 1.75fr) minmax(0, 1.2fr)${
        orderedVisibleColumns.length ? ` ${optionalGridColumns}` : ""
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
        onMoveColumn={handleMoveColumn}
        canSelectAllColumns={canSelectAllColumns}
        maxSelectableColumns={maxSelectableColumns}
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
                hasAnySongs={songs.length > 0}
                isLoading={!songsLoaded}
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
            {!optStatus ? (
              <div className="dashboard-column-header z-40 shrink-0">
                <div className="neuphormism-b !bg-[#dddbdb] mt-2">
                  <div
                    className={`grid items-center rounded-t-md ${
                      isTabletColumnLimited
                        ? "gap-1 px-2 py-3 text-[10px] leading-tight"
                        : "gap-2 p-3 text-[clamp(10px,1.35vw,13px)]"
                    }`}
                    style={{
                      gridTemplateColumns: listGridTemplateColumns,
                    }}
                  >
                    <div
                      className="cursor-pointer text-center"
                      onClick={() => handleSort("number")}
                    >
                      N
                      {sortColumn === "number" && (
                        <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>
                      )}
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
                    )
                      .sort(
                        (a, b) =>
                          orderedVisibleColumns.indexOf(a.key) -
                          orderedVisibleColumns.indexOf(b.key),
                      )
                      .map((column) => (
                        <div
                          key={column.key}
                          className="cursor-pointer text-center"
                          onClick={() => handleSort(column.sortable)}
                        >
                          <span>
                            {column.label}
                            {sortColumn === column.sortable ? (
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
            ) : null}

            <ul
              className={`min-h-0 flex-1 overflow-auto z-0 ${
                isTabletColumnLimited ? "pb-8" : "pb-60"
              } ${optStatus ? "mt-[63rem]" : "mt-2"}`}
            >
              <DashList2Items
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                songs={displaySongs}
                hasAnySongs={songs.length > 0}
                isLoading={!songsLoaded}
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
