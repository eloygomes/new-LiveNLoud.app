/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { getAllUserSetlists } from "../../Tools/Controllers";
import { IoClose } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";

function NewSongSetlist({
  setlistOptions = [],
  setSetlistOptions,
  setlist = [],
  setSetlist,
}) {
  // Guardamos o input do usuário para criar um novo setlist
  const [newSetlistName, setNewSetlistName] = useState("");

  // Guardamos os setlists já existentes
  const [setlists, setSetlists] = useState([]);

  const toggleTag = (item) => {
    if (setlist.includes(item)) {
      // Se já está no setlist, removemos
      setSetlist((prev) => prev.filter((x) => x !== item));
    } else {
      // Se não está, adicionamos
      setSetlist((prev) => [...prev, item]);
    }
  };

  // Remove a tag definitivamente do sistema
  const handleDeleteSetlist = (tag) => {
    setSetlistOptions((prev) => prev.filter((t) => t !== tag));
    setSetlist((prev) => prev.filter((t) => t !== tag));
  };

  // Criar um novo setlist e adicionar ao array de "opções globais" + "setlist" atual
  const handleAddNew = () => {
    const trimmed = newSetlistName.trim();
    if (!trimmed) return;

    // Se não existe em 'setlistOptions', criamos
    if (!setlistOptions.includes(trimmed)) {
      setSetlistOptions((prev) => [...prev, trimmed]);
    }

    // Também ativamos esse novo setlist para a música atual
    if (!setlist.includes(trimmed)) {
      setSetlist((prev) => [...prev, trimmed]);
    }

    setNewSetlistName("");
  };

  // console.log("setlist", setlist);

  console.log("setlistOptions", setlistOptions);

  return (
    <div className="my-4 p-3 border rounded   neuphormism-b p-5 my-5 mr-5">
      <h2 className="text-lg font-bold mb-2">Setlists</h2>

      <div className="mt-4">
        <label htmlFor="newSetlistName" className="block mb-1 font-semibold">
          Criar um novo setlist:
        </label>
        <div className="flex gap-2">
          <input
            id="newSetlistName"
            type="text"
            className="border rounded p-1 w-full"
            placeholder="Ex: 'Show2023' ou 'Ensaios'"
            value={newSetlistName}
            onChange={(e) => setNewSetlistName(e.target.value)}
            onBlur={() => handleAddNew()}
          />
        </div>
      </div>

      <div className="mt-4">
        <h1 className="px-0 font-bold text-md">Setlists disponíveis:</h1>
        <div className="w-full pr-2">
          {setlistOptions.length === 0 ? (
            <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {setlistOptions.map((tag, index) => {
                const isActive = setlist.includes(tag);
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

      {/* Formulário para criar um novo setlist (e já ativar) */}
    </div>
  );
}

export default NewSongSetlist;
