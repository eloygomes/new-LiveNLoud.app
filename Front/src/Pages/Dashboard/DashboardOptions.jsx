/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoClose } from "react-icons/io5";

const LOCAL_STORAGE_KEY = "mySelectedSetlists";

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  onFilterChange,
}) {
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlists, setSelectedSetlists] = useState(null);

  // 1) Carregar do localStorage na montagem (apenas se selectedSetlists ainda === null)
  useEffect(() => {
    if (selectedSetlists === null) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSelectedSetlists(parsed);
          } else {
            setSelectedSetlists([]);
          }
        } catch (err) {
          console.error("Erro ao ler do localStorage:", err);
          setSelectedSetlists([]);
        }
      } else {
        setSelectedSetlists([]);
      }
    }
  }, [selectedSetlists]);

  // 2) Buscar setlists no backend
  useEffect(() => {
    async function fetchSetlists() {
      const userEmail = localStorage.getItem("userEmail");
      try {
        const response = await fetch(
          `https://api.live.eloygomes.com.br/api/alldata/${userEmail}`
        );
        const data = await response.json();
        const allSetlists = (data.userdata || []).flatMap(
          (song) => song.setlist || []
        );
        const distinctSetlists = [...new Set(allSetlists)];
        setSetlists(distinctSetlists);
      } catch (error) {
        console.error("Erro ao buscar setlists:", error);
      }
    }
    fetchSetlists();
  }, []);

  // 3) Sempre que selectedSetlists mudar (ou seja, o usuário clicou em algo), salva e emite callback
  useEffect(() => {
    if (selectedSetlists !== null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedSetlists));
      if (onFilterChange) {
        onFilterChange(selectedSetlists);
      }
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

  // Excluir completamente a tag
  const handleDeleteSetlist = (tag) => {
    setSetlists((prev) => prev.filter((item) => item !== tag));
    setSelectedSetlists((prev) => prev.filter((item) => item !== tag));
  };
  // console.log("optStatus", optStatus);
  return (
    <div
      className={`flex flex-col top-[67px] sticky justify-between  bg-white h-[150px] ${
        optStatus ? "" : "hidden"
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex flex-row py-1 justify-between rounded-t-md bg-black/10">
        <h1 className="px-5 font-bold text-md">Setlists disponíveis:</h1>
        <div className="px-5" onClick={() => setOptStatus(false)}>
          <IoClose className="w-6 h-6 cursor-pointer" />
        </div>
      </div>

      {/* Corpo principal */}
      <div className="flex flex-row justify-between px-5">
        <div className="w-full pr-2">
          {setlists.length === 0 ? (
            <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {setlists.map((tag, index) => {
                const isActive = selectedSetlists.includes(tag);
                return (
                  <div
                    key={index}
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
