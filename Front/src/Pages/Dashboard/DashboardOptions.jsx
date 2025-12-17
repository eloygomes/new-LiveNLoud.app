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
import PlaylistExport from "./PlaylistExport";
import SetlistExport from "./SetlistExport";
import Insights from "./Insights";
import SearchBox from "./SearchBox/SearchBox";

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
          <div className="neuphormism-b m-2 pb-5">
            <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          <div className="neuphormism-b m-2  h-auto">
            <Insights dashboardMetrics={dashboardMetrics} />
          </div>
          <div className="neuphormism-b m-2  pb-4">
            <div className="neuphormism-b m-2  h-full">
              <h1 className="px-5 pb-2 text-sm pb-2 pt-3">Tags</h1>
              {/* Corpo principal */}
              <div className="flex flex-row justify-between px-5 ">
                <div className="w-full pr-2 ">
                  {setlists.length === 0 ? (
                    <p className="italic text-sm">
                      Nenhuma setlist cadastrada.
                    </p>
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
                              backgroundColor: isActive
                                ? "goldenrod"
                                : "#9ca3af",
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
        </div>
        <div className="flex flex-col w-1/2">
          <div className="neuphormism-b m-2 ">
            <SetlistExport
              handleExportText={handleExportText}
              visibleSongs={visibleSongs}
              FiFileText={FiFileText}
              handleExportJson={handleExportJson}
              VscJson={VscJson}
            />
          </div>

          <div className="neuphormism-b m-2 ">
            <PlaylistExport
              visibleSongs={visibleSongs}
              onCreateSpotifyPlaylist={(songs) => {
                console.log("Criar playlist Spotify com:", songs);
                // Depois a gente troca isso pela chamada real (auth + criar playlist)
              }}
            />
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
