/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FiFileText } from "react-icons/fi";
import { VscJson } from "react-icons/vsc";
import { IoClose } from "react-icons/io5";

import {
  loadSelectedSetlists,
  saveSelectedSetlists,
  fetchDistinctSetlists,
  updateUserSetlists,
} from "../../Tools/Controllers";
import PlaylistExport from "./PlaylistExport";
import SetlistExport from "./SetlistExport";
import Insights from "./Insights";
import Tags from "./Tags";

const instrumentLabels = [
  { key: "guitar01", label: "G1" },
  { key: "guitar02", label: "G2" },
  { key: "bass", label: "B" },
  { key: "keys", label: "K" },
  { key: "drums", label: "D" },
  { key: "voice", label: "V" },
];

const columnOptions = [
  { key: "progression", label: "Progression" },
  { key: "tags", label: "Tags / Setlists" },
  { key: "videos", label: "Videos" },
  { key: "instruments", label: "Instruments" },
  { key: "addedDate", label: "Date added" },
  { key: "lastPlay", label: "Last play" },
];

function ColumnsData({
  visibleColumns = [],
  onToggleColumn = () => {},
  canSelectAllColumns = false,
}) {
  const allColumnsSelected = columnOptions.every((option) =>
    visibleColumns.includes(option.key),
  );
  const maxColumnsReached =
    !canSelectAllColumns && visibleColumns.length >= columnOptions.length - 1;

  return (
    <section className="neuphormism-b p-4">
      <div>
        <h1 className="text-sm font-black uppercase">Columns Data</h1>
        <p className="mt-1 text-[11px] font-semibold text-gray-500">
          Number, song and artist are always visible
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {columnOptions.map(({ key, label }) => {
          const checked = visibleColumns.includes(key);
          const disabled = !checked && (allColumnsSelected || maxColumnsReached);

          return (
          <label
            key={key}
            className={`input-neumorfismo flex items-center justify-between rounded-lg px-3 py-2 ${
              disabled ? "opacity-50" : "cursor-pointer"
            }`}
          >
            <span className="text-[12px] font-black uppercase text-gray-700">
              {label}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggleColumn(key)}
            />
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full shadow-inner ${
                checked ? "bg-[goldenrod]" : "bg-gray-400"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  checked ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </label>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  onFilterChange,
  visibleSongs = [],
  visibleColumns = [],
  onToggleColumn = () => {},
  canSelectAllColumns = false,
}) {
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlists, setSelectedSetlists] = useState(null);
  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth <= 1024;

  useEffect(() => {
    const handleCloseFilter = () => {
      setOptStatus(false);
    };

    window.addEventListener("dashboard-mobile-close-filter", handleCloseFilter);
    window.addEventListener("close-all-modals", handleCloseFilter);

    return () => {
      window.removeEventListener(
        "dashboard-mobile-close-filter",
        handleCloseFilter,
      );
      window.removeEventListener("close-all-modals", handleCloseFilter);
    };
  }, [setOptStatus]);

  // 1) Carregar setlists selecionadas do localStorage na montagem
  useEffect(() => {
    if (selectedSetlists === null) {
      const initial = loadSelectedSetlists();
      setSelectedSetlists(initial);
    }
  }, [selectedSetlists]);

  // 2) Buscar setlists distintas no backend
  useEffect(() => {
    (async () => {
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    })();
  }, []);

  // 3) Sempre que selectedSetlists mudar, persistir e emitir callback
  useEffect(() => {
    if (selectedSetlists !== null) {
      saveSelectedSetlists(selectedSetlists);
      onFilterChange?.(selectedSetlists);
    }
  }, [selectedSetlists, onFilterChange]);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    if (!visibleSongs.length) return;
    const lines = visibleSongs.map((song, index) => {
      const number = song.number ?? index + 1;
      const title = song.song || "Untitled";
      const artist = song.artist || "Unknown artist";
      return `${number}. ${title} - ${artist}`;
    });
    downloadFile(lines.join("\n"), "setlist.txt", "text/plain");
  };

  const handleExportJson = () => {
    if (!visibleSongs.length) return;
    const payload = JSON.stringify(visibleSongs, null, 2);
    downloadFile(payload, "setlist.json", "application/json");
  };

  const dashboardMetrics = useMemo(() => {
    if (!visibleSongs.length) {
      return {
        totalSongs: 0,
        averageProgress: 0,
        readySongs: 0,
        emptyProgressSongs: 0,
        topInstrument: null,
        instrumentCounts: instrumentLabels.map((item) => ({
          ...item,
          count: 0,
        })),
      };
    }

    const totalSongs = visibleSongs.length;
    const totalProgress = visibleSongs.reduce(
      (sum, song) => sum + Number(song.progressBar || 0),
      0,
    );
    const countsMap = instrumentLabels.reduce((acc, label) => {
      acc[label.key] = 0;
      return acc;
    }, {});

    visibleSongs.forEach((song) => {
      instrumentLabels.forEach(({ key }) => {
        if (song.instruments?.[key]) {
          countsMap[key] += 1;
        }
      });
    });

    return {
      totalSongs,
      averageProgress: Math.round(totalProgress / totalSongs),
      readySongs: visibleSongs.filter(
        (song) => Number(song.progressBar || 0) >= 100,
      ).length,
      emptyProgressSongs: visibleSongs.filter(
        (song) => Number(song.progressBar || 0) === 0,
      ).length,
      topInstrument: instrumentLabels
        .map((item) => ({
          ...item,
          count: countsMap[item.key] || 0,
        }))
        .sort((a, b) => b.count - a.count)[0],
      instrumentCounts: instrumentLabels.map((item) => ({
        ...item,
        count: countsMap[item.key] || 0,
      })),
    };
  }, [visibleSongs, instrumentLabels]);

  // Enquanto `selectedSetlists` for null, ainda estamos carregando
  if (selectedSetlists === null) {
    return <div>Carregando filtros...</div>;
  }

  // Alternar inclusão/remoção da tag
  const toggleTag = (tag) => {
    setSelectedSetlists((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  // Excluir completamente a tag da lista disponível e das selecionadas
  const handleDeleteSetlist = async (tag) => {
    const updatedList = setlists.filter((item) => item !== tag);

    setSetlists(updatedList);
    setSelectedSetlists((prev) => prev.filter((item) => item !== tag));

    try {
      await updateUserSetlists(updatedList);
    } catch (error) {
      console.error("Erro ao atualizar setlists no servidor:", error);
      // Em caso de erro, recarrega lista do backend para evitar estado inconsistente.
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    }
  };

  const handleAddSetlist = async (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    const existingTag = setlists.find(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existingTag) {
      if (!selectedSetlists.includes(existingTag)) {
        setSelectedSetlists((prev) => [...prev, existingTag]);
      }
      return;
    }

    const updatedList = [...setlists, trimmed];
    setSetlists(updatedList);
    setSelectedSetlists((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    );

    try {
      await updateUserSetlists(updatedList);
    } catch (error) {
      console.error("Erro ao adicionar setlist no servidor:", error);
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    }
  };

  const closeFilter = () => {
    setOptStatus(false);
  };

  const openFilterClassName = `fixed z-[10020] overflow-hidden ${
    optStatus ? "" : "hidden"
  } ${
    isSmallScreen
      ? "inset-0 bg-black/25 px-3 pb-24 pt-[5.5rem]"
      : "left-1/2 top-[80px] flex max-h-[calc(100vh-6rem)] w-[91%] -translate-x-1/2 flex-col justify-between bg-[#9da3af14]"
  }`;

  return (
    <div className={openFilterClassName}>
      {isSmallScreen ? (
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Close filter"
          onClick={closeFilter}
        />
      ) : null}

      <div
        className={
          isSmallScreen
            ? "relative flex h-full flex-col overflow-hidden rounded-md bg-[#f0f0f0] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            : ""
        }
      >
        <div
          className={`flex flex-row justify-between ${
            isSmallScreen
              ? "border-b border-black/5 px-4 py-3"
              : " rounded-t-lg px-5 py-2 text-center  text-white font-bold  bg-[#000000]/60 cursor-pointer"
          }`}
        >
          <div className="min-w-0">
            {isSmallScreen ? (
              <button
                type="button"
                className=" flex  w-full items-center justify-center"
                onClick={closeFilter}
                aria-label="Close filter"
              >
                {/* <span className="h-1.5 w-12 rounded-full bg-[#c8c8c8]" /> */}
              </button>
            ) : null}

            <h1
              className={`font-black ${isSmallScreen ? "text-[2rem]" : "text-md"}`}
            >
              {isSmallScreen ? "FILTER" : "OPTIONS"}
            </h1>
            {/* {isSmallScreen ? (
              <p className="mt-2 text-sm text-gray-600">
                Choose filters, inspect metrics, and export the visible songs.
              </p>
            ) : null} */}
          </div>
          <button
            type="button"
            className={
              isSmallScreen
                ? "rounded-full bg-black/5 p-2 text-black shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
                : "px-5"
            }
            onClick={closeFilter}
          >
            <IoClose className="h-6 w-6 cursor-pointer" />
          </button>
        </div>

        <div
          className={
            isSmallScreen
              ? "flex-1 overflow-y-auto px-4 pb-6 pt-4"
              : "overflow-y-auto rounded-b-lg bg-[#e6e6e6] px-5 py-4"
          }
        >
          <div
            className={
              isSmallScreen ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"
            }
          >
            <div className={isSmallScreen ? "hidden" : "col-span-2"}>
              <Insights dashboardMetrics={dashboardMetrics} />
            </div>

            <div>
              <Tags
                setlists={setlists}
                selectedSetlists={selectedSetlists}
                toggleTag={toggleTag}
                handleDeleteSetlist={handleDeleteSetlist}
                handleAddSetlist={handleAddSetlist}
                RiDeleteBin6Line={RiDeleteBin6Line}
              />
            </div>

            <ColumnsData
              visibleColumns={visibleColumns}
              onToggleColumn={onToggleColumn}
              canSelectAllColumns={canSelectAllColumns}
            />

            <div>
              <SetlistExport
                handleExportText={handleExportText}
                visibleSongs={visibleSongs}
                FiFileText={FiFileText}
                handleExportJson={handleExportJson}
                VscJson={VscJson}
              />
            </div>

            <div>
              <PlaylistExport
                visibleSongs={visibleSongs}
                onCreateSpotifyPlaylist={(songs) => {
                  console.log("Criar playlist Spotify com:", songs);
                }}
              />
            </div>
          </div>
        </div>

        {isSmallScreen ? (
          <div className="border-t border-black/5 bg-[#f0f0f0] px-4 pb-5 pt-3">
            <button
              type="button"
              className="w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-black shadow-[0_8px_18px_rgba(0,0,0,0.05)]"
              onClick={closeFilter}
            >
              Close Filter
            </button>
          </div>
        ) : (
          <div
            className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer"
            onClick={closeFilter}
          >
            {optStatus ? "HIDE OPTIONS" : "SHOW OPTIONS"}
          </div>
        )}
      </div>
    </div>
  );
}
