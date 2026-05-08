/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FiFileText } from "react-icons/fi";
import { VscJson } from "react-icons/vsc";
import { IoClose } from "react-icons/io5";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import {
  fetchDistinctSetlists,
  updateUserSetlists,
} from "../../Tools/Controllers";
import { lockPageScroll } from "../../Tools/scrollLock";
import PlaylistExport from "./PlaylistExport";
import SetlistExport from "./SetlistExport";
import Insights from "./Insights";
import Tags from "./Tags";

const instrumentLabels = [
  { key: "guitar01", label: "Guitar 1" },
  { key: "guitar02", label: "Guitar 2" },
  { key: "bass", label: "Bass" },
  { key: "keys", label: "Keys" },
  { key: "drums", label: "Drums" },
  { key: "voice", label: "Voice" },
];

const columnOptions = [
  { key: "progression", label: "Progression" },
  { key: "notes", label: "Notes" },
  { key: "tags", label: "Setlists" },
  { key: "videos", label: "Videos" },
  { key: "instruments", label: "Instruments" },
  { key: "addedDate", label: "Date added" },
  { key: "lastPlay", label: "Last play" },
];

function ColumnsData({
  visibleColumns = [],
  onToggleColumn = () => {},
  onMoveColumn = () => {},
  canSelectAllColumns = false,
  maxSelectableColumns = columnOptions.length,
  isColumnLimitedLayout = false,
}) {
  const allColumnsSelected = columnOptions.every((option) =>
    visibleColumns.includes(option.key),
  );
  const maxColumnsReached =
    !canSelectAllColumns && visibleColumns.length >= maxSelectableColumns;
  const orderedColumnOptions = [
    ...visibleColumns
      .map((key) => columnOptions.find((option) => option.key === key))
      .filter(Boolean),
    ...columnOptions.filter((option) => !visibleColumns.includes(option.key)),
  ];

  return (
    <section className="neuphormism-b p-4">
      <div>
        <h1 className="text-sm font-black uppercase">Columns Data</h1>
        <p className="mt-1 text-[11px] font-semibold text-gray-500">
          Select which columns to display in the dashboard.
          {!canSelectAllColumns ? ` Limit: ${maxSelectableColumns}.` : ""}
        </p>
      </div>

      <div
        className={`mt-4 grid gap-2 ${
          isColumnLimitedLayout ? "grid-cols-1" : "sm:grid-cols-2"
        }`}
      >
        {orderedColumnOptions.map(({ key, label }) => {
          const checked = visibleColumns.includes(key);
          const disabled =
            !checked && (allColumnsSelected || maxColumnsReached);
          const visibleIndex = visibleColumns.indexOf(key);

          return (
            <div
              key={key}
              className={`input-neumorfismo flex items-center justify-between rounded-lg px-3 py-2 ${
                disabled ? "opacity-50" : ""
              }`}
            >
              <label
                className={`flex min-w-0 flex-1 items-center justify-between gap-3 ${
                  disabled ? "" : "cursor-pointer"
                }`}
              >
                <span className="truncate text-[12px] font-black uppercase text-gray-700">
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
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full shadow-inner ${
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

              {checked ? (
                <div className="ml-3 flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="neuphormism-b-btn flex h-7 w-7 items-center justify-center rounded-md text-[10px] disabled:opacity-35"
                    disabled={visibleIndex <= 0}
                    onClick={() => onMoveColumn(key, -1)}
                    aria-label={`Move ${label} left`}
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    type="button"
                    className="neuphormism-b-btn flex h-7 w-7 items-center justify-center rounded-md text-[10px] disabled:opacity-35"
                    disabled={visibleIndex === visibleColumns.length - 1}
                    onClick={() => onMoveColumn(key, 1)}
                    aria-label={`Move ${label} right`}
                  >
                    <FaArrowDown />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  selectedSetlists = [],
  setSelectedSetlists = () => {},
  visibleSongs = [],
  visibleColumns = [],
  onToggleColumn = () => {},
  onMoveColumn = () => {},
  canSelectAllColumns = false,
  maxSelectableColumns,
}) {
  const [setlists, setSetlists] = useState([]);
  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 768;
  const isColumnLimitedLayout =
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1366;
  const isMiniTabletOptions =
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    window.innerWidth < 820;

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

  useEffect(() => {
    if (!optStatus) return undefined;
    return lockPageScroll();
  }, [optStatus]);

  // 1) Buscar setlists distintas no backend
  useEffect(() => {
    (async () => {
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    })();
  }, []);

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

  const openFilterClassName = `fixed overflow-hidden ${
    optStatus ? "" : "hidden"
  } ${
    isSmallScreen
      ? "inset-0 z-[12000] bg-black/45"
            : `left-1/2 top-[80px] flex h-[calc(100vh-7rem)] w-[91%] -translate-x-1/2 flex-col justify-between bg-[#9da3af14] ${
                isMiniTabletOptions ? "dashboard-options-mini" : ""
              }`
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
            ? "absolute inset-x-0 bottom-0 flex max-h-[84vh] flex-col overflow-hidden rounded-t-[18px] bg-[#f2f2f2] px-5 pb-3 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)] sm:px-7"
            : ""
        }
      >
        <div
          className={`flex flex-row justify-between ${
            isSmallScreen
              ? "mb-4 items-start"
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
                ? "neuphormism-b-btn flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                : "px-5"
            }
            onClick={closeFilter}
            aria-label="Close filter"
          >
            <IoClose className="h-6 w-6 cursor-pointer" />
          </button>
        </div>

        <div
          className={
            isSmallScreen
              ? "min-h-0 flex-1 overflow-y-auto pb-2"
              : "min-h-0 flex-1 overflow-y-auto rounded-b-lg bg-[#e6e6e6] px-4 py-3"
          }
        >
          <div
            className={
              isSmallScreen ? "flex flex-col gap-3" : "flex flex-col gap-3"
            }
          >
            {isSmallScreen ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="neuphormism-b rounded-lg p-3">
                    <p className="text-[10px] font-black uppercase text-gray-500">
                      Songs
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-900">
                      {dashboardMetrics.totalSongs}
                    </p>
                  </div>
                  <div className="neuphormism-b rounded-lg p-3">
                    <p className="text-[10px] font-black uppercase text-gray-500">
                      Ready
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-900">
                      {dashboardMetrics.readySongs}
                    </p>
                  </div>
                  <div className="neuphormism-b rounded-lg p-3">
                    <p className="text-[10px] font-black uppercase text-gray-500">
                      Avg
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-900">
                      {dashboardMetrics.averageProgress}%
                    </p>
                  </div>
                </div>

                <Tags
                  setlists={setlists}
                  selectedSetlists={selectedSetlists}
                  toggleTag={toggleTag}
                  handleDeleteSetlist={handleDeleteSetlist}
                  handleAddSetlist={handleAddSetlist}
                  RiDeleteBin6Line={RiDeleteBin6Line}
                  isTouchLayout
                />

                <ColumnsData
                  visibleColumns={visibleColumns}
                  onToggleColumn={onToggleColumn}
                  onMoveColumn={onMoveColumn}
                  canSelectAllColumns={canSelectAllColumns}
                  maxSelectableColumns={maxSelectableColumns}
                  isColumnLimitedLayout={isColumnLimitedLayout}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SetlistExport
                    handleExportText={handleExportText}
                    visibleSongs={visibleSongs}
                    FiFileText={FiFileText}
                    handleExportJson={handleExportJson}
                    VscJson={VscJson}
                  />
                  <PlaylistExport visibleSongs={visibleSongs} />
                </div>
              </>
            ) : (
              <>
                <Insights dashboardMetrics={dashboardMetrics} />

                <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] items-stretch gap-3">
                  <div className="h-full [&>section]:h-full">
                    <Tags
                      setlists={setlists}
                      selectedSetlists={selectedSetlists}
                      toggleTag={toggleTag}
                      handleDeleteSetlist={handleDeleteSetlist}
                      handleAddSetlist={handleAddSetlist}
                      RiDeleteBin6Line={RiDeleteBin6Line}
                    />
                  </div>

                  <div className="h-full [&>section]:h-full">
                    <ColumnsData
                      visibleColumns={visibleColumns}
                      onToggleColumn={onToggleColumn}
                      onMoveColumn={onMoveColumn}
                      canSelectAllColumns={canSelectAllColumns}
                      maxSelectableColumns={maxSelectableColumns}
                      isColumnLimitedLayout={isColumnLimitedLayout}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] items-stretch gap-3">
                  <div className="h-full [&>section]:h-full">
                    <SetlistExport
                      handleExportText={handleExportText}
                      visibleSongs={visibleSongs}
                      FiFileText={FiFileText}
                      handleExportJson={handleExportJson}
                      VscJson={VscJson}
                    />
                  </div>

                  <div className="h-full [&>section]:h-full">
                    <PlaylistExport visibleSongs={visibleSongs} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {isSmallScreen ? (
          <div className="border-t border-black/5 bg-[#f2f2f2] px-1 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2">
            <button
              type="button"
              className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[0_5px_12px_rgba(0,0,0,0.04)]"
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
