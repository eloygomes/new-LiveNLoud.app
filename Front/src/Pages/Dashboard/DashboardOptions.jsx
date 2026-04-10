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
import SearchBox from "./SearchBox/SearchBox";
import Tags from "./Tags";

const instrumentLabels = [
  { key: "guitar01", label: "G1" },
  { key: "guitar02", label: "G2" },
  { key: "bass", label: "B" },
  { key: "keys", label: "K" },
  { key: "drums", label: "D" },
  { key: "voice", label: "V" },
];

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  onFilterChange,
  searchTerm = "",
  setSearchTerm = () => {},
  visibleSongs = [],
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

    return () => {
      window.removeEventListener(
        "dashboard-mobile-close-filter",
        handleCloseFilter,
      );
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

  const closeFilter = () => {
    setOptStatus(false);
  };

  const openFilterClassName = `fixed z-30 overflow-hidden ${
    optStatus ? "" : "hidden"
  } ${
    isSmallScreen
      ? "inset-0 bg-black/25 px-3 pb-24 pt-[5.5rem]"
      : "left-1/2 top-[80px] flex h-fit w-[91%] -translate-x-1/2 flex-col justify-between bg-[#9da3af14]"
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
            ? "relative flex h-full flex-col overflow-hidden rounded-[30px] bg-[#f0f0f0] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            : ""
        }
      >
        <div
          className={`flex flex-row justify-between ${
            isSmallScreen
              ? "border-b border-black/5 px-5 pb-4 pt-4"
              : "rounded-t-lg bg-black/10 py-1"
          }`}
        >
          <div className="min-w-0">
            {isSmallScreen ? (
              <button
                type="button"
                className="mb-3 flex h-8 w-full items-center justify-center"
                onClick={closeFilter}
                aria-label="Close filter"
              >
                <span className="h-1.5 w-12 rounded-full bg-[#c8c8c8]" />
              </button>
            ) : null}

            <h1
              className={`font-bold ${
                isSmallScreen ? "text-[2rem]" : "px-5 text-md"
              }`}
            >
              {isSmallScreen ? "TOOLS" : "OPTIONS"}
            </h1>
            {isSmallScreen ? (
              <p className="mt-2 text-sm text-gray-600">
                Choose filters, inspect metrics, and export the visible songs.
              </p>
            ) : null}
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
              : "flex flex-row gap-3 overflow-hidden rounded-b-lg bg-slate-100 px-5 py-2"
          }
        >
          <div className={isSmallScreen ? "flex flex-col gap-4" : "flex w-1/2 flex-col"}>
            <div className={isSmallScreen ? "rounded-[24px] bg-[#e3e3e3] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]" : "neuphormism-b m-2 pb-5"}>
              <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            <div className={isSmallScreen ? "rounded-[24px] bg-[#e3e3e3] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]" : "neuphormism-b m-2  h-auto"}>
              <Insights dashboardMetrics={dashboardMetrics} />
            </div>

            <div className={isSmallScreen ? "rounded-[24px] bg-[#e3e3e3] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]" : "neuphormism-b m-2  pb-4"}>
              <Tags
                setlists={setlists}
                selectedSetlists={selectedSetlists}
                toggleTag={toggleTag}
                handleDeleteSetlist={handleDeleteSetlist}
                RiDeleteBin6Line={RiDeleteBin6Line}
              />
            </div>
          </div>

          <div className={isSmallScreen ? "mt-4 flex flex-col gap-4" : "flex w-1/2 flex-col"}>
            <div className={isSmallScreen ? "rounded-[24px] bg-[#e3e3e3] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]" : "neuphormism-b m-2 "}>
              <SetlistExport
                handleExportText={handleExportText}
                visibleSongs={visibleSongs}
                FiFileText={FiFileText}
                handleExportJson={handleExportJson}
                VscJson={VscJson}
              />
            </div>

            <div className={isSmallScreen ? "rounded-[24px] bg-[#e3e3e3] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]" : "neuphormism-b m-2 "}>
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
        ) : null}
      </div>
    </div>
  );
}
