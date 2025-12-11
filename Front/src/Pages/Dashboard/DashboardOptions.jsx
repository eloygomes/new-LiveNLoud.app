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
} from "../../Tools/Controllers";

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
      0
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
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  // Excluir completamente a tag da lista disponível e das selecionadas
  const handleDeleteSetlist = (tag) => {
    setSetlists((prev) => prev.filter((item) => item !== tag));
    setSelectedSetlists((prev) => prev.filter((item) => item !== tag));
  };

  return (
    <div
      className={`flex flex-col  top-[10px] sticky justify-between   bg-[#9da3af14] overflow-y-hidden ${
        optStatus ? "" : "hidden"
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex flex-row py-1 justify-between rounded-t-lg bg-black/10">
        <h1 className="px-5 font-bold text-md">OPTIONS</h1>
        <div className="px-5" onClick={() => setOptStatus(false)}>
          <IoClose className="w-6 h-6 cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-row py-2 px-5 gap-3">
        <div className="flex flex-col w-1/2">
          <div className="neuphormism-b m-2 pb-5 pt-3 h-auto">
            <h1 className="px-5 pb-2 text-sm">Insights</h1>
            <div className="px-5">
              <div className="grid gap-3 sm:grid-cols-2 text-[11px]">
                <div className="neuphormism-b rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                    Progress ratio
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardMetrics.averageProgress}%
                  </p>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DAA520] transition-all duration-300"
                      style={{
                        width: `${dashboardMetrics.averageProgress}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-600">
                    {dashboardMetrics.totalSongs} song
                    {dashboardMetrics.totalSongs === 1 ? "" : "s"} filtradas
                  </p>
                </div>

                <div className="neuphormism-b rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                    Songs by instrument
                  </p>
                  <div className="grid grid-cols-6 gap-2 mt-3 text-center">
                    {dashboardMetrics.instrumentCounts.map((instrument) => (
                      <div
                        key={instrument.key}
                        className="rounded-xl border border-gray-200 py-2 flex flex-col items-center justify-center"
                      >
                        <span className="text-xs font-semibold">
                          {instrument.label}
                        </span>
                        <span className="text-base font-bold text-gray-900">
                          {instrument.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="neuphormism-b m-2 py-5 h-auto">
            <h1 className="px-5 pb-2 text-sm">Tags</h1>
            {/* Corpo principal */}
            <div className="flex flex-row justify-between px-5 ">
              <div className="w-full pr-2 ">
                {setlists.length === 0 ? (
                  <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 ">
                    {setlists.map((tag, index) => {
                      const isActive = selectedSetlists.includes(tag);
                      return (
                        <div
                          key={`${tag}-${index}`}
                          className="flex items-center gap-1 shadow-sm "
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "7px",
                            margin: "2px",
                            cursor: "pointer",
                            fontSize: "12px",
                            backgroundColor: isActive ? "goldenrod" : "#9ca3af",
                            color: "#fff",
                            userSelect: "none",
                          }}
                        >
                          <span
                            onClick={() => toggleTag(tag)}
                            title={
                              isActive
                                ? "Clique para remover este filtro"
                                : "Clique para adicionar este filtro"
                            }
                          >
                            {tag}
                          </span>
                          <RiDeleteBin6Line
                            className="w-4 h-4 ml-1"
                            title="Remover setlist do sistema"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSetlist(tag);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-1/2">
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

          <div className="neuphormism-b m-2 ">
            <div className="px-5 my-4 flex flex-col">
              <h1 className="text-sm pb-2">Export</h1>
              <p className=" text-[11px] pb-3">
                Use os botões de exportação para baixar a lista de músicas
                visíveis em formato TXT ou JSON.
              </p>
              <div className="flex flex-row">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportText}
                    disabled={!visibleSongs.length}
                    className={`flex items-center gap-2 px-5 py-5 rounded-md text-sm font-semibold text-[9ca3af] transition-transform ${
                      visibleSongs.length
                        ? " border  border-[#9ca3af] hover:bg-[goldenrod] hover:border-[goldenrod] active:scale-95"
                        : "bg-red-400 cursor-not-allowed"
                    }`}
                  >
                    <FiFileText /> TXT
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={!visibleSongs.length}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-[9ca3af] transition-transform ${
                      visibleSongs.length
                        ? " border  border-[#9ca3af] hover:bg-[goldenrod] hover:border-[goldenrod] active:scale-95"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <VscJson /> JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div
        className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer py-0"
        onClick={() => setOptStatus(!optStatus)}
      >
        HIDE OPTIONS
      </div>
    </div>
  );
}
