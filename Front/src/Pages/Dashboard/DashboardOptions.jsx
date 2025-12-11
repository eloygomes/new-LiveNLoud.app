/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoClose } from "react-icons/io5";

import {
  loadSelectedSetlists,
  saveSelectedSetlists,
  fetchDistinctSetlists,
} from "../../Tools/Controllers";

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  onFilterChange,
  searchTerm = "",
  setSearchTerm = () => {},
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
      className={`flex flex-col top-[10px] sticky justify-between   bg-[#9da3af14] overflow-y-hidden ${
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

      <div className="flex flex-row py-2">
        <div className="flex flex-col w-1/2">
          <h1 className="px-5 py-2">TAGS</h1>
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
                        className="flex items-center gap-1"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: "10px",
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
        <div className="flex flex-col w-1/2">
          <h1 className="px-5 py-2">SEARCH</h1>
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
                  className="w-full rounded-md border border-gray-300 bg-white/80 pl-10 pr-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="px-5 mt-4">EXPORT</div>
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
