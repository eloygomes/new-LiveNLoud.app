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

  return (
    <div
      className={`fixed left-1/2 top-[80px] z-30 flex h-fit w-[91%] -translate-x-1/2 flex-col justify-between bg-[#9da3af14] overflow-hidden ${
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

      <div className="flex flex-row py-2 px-5 gap-3 overflow-hidden bg-slate-100 rounded-b-lg">
        <div className="flex flex-col w-1/2">
          <div className="neuphormism-b m-2 pb-5">
            <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          <div className="neuphormism-b m-2  h-auto">
            <Insights dashboardMetrics={dashboardMetrics} />
          </div>

          <div className="neuphormism-b m-2  pb-4">
            <Tags
              setlists={setlists}
              selectedSetlists={selectedSetlists}
              toggleTag={toggleTag}
              handleDeleteSetlist={handleDeleteSetlist}
              RiDeleteBin6Line={RiDeleteBin6Line}
            />
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
        className="text-center text-[10px] text-white font-bold rounded-b-md bg-black/60 cursor-pointer py-0"
        onClick={() => setOptStatus(!optStatus)}
      >
        HIDE OPTIONS
      </div>
    </div>
  );
}
