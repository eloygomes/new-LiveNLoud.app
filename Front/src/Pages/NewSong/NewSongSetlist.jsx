/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from "react";
import { MdAddCircle } from "react-icons/md";

function NewSongSetlist({
  setlistOptions,
  setSetlistOptions,
  setlist,
  setSetlist,
}) {
  // Guardamos o input do usuário para criar um novo setlist
  const [newSetlistName, setNewSetlistName] = useState("");

  const toggleSetlist = (item) => {
    if (setlist.includes(item)) {
      // Se já está no setlist, removemos
      setSetlist((prev) => prev.filter((x) => x !== item));
    } else {
      // Se não está, adicionamos
      setSetlist((prev) => [...prev, item]);
    }
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

  return (
    <div className="my-4 p-3 border rounded   neuphormism-b p-5 my-5 mr-5">
      <h2 className="text-lg font-bold mb-2">Setlist (Tags)</h2>

      {/* Formulário para criar um novo setlist (e já ativar) */}
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
          />

          <button
            onClick={handleAddNew}
            className="bg-green-600 text-white px-3 py-1 rounded"
            title="Adicionar nova tag"
          >
            <MdAddCircle className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Mostramos abaixo quais setlists estão selecionados para esta música */}
      <div className="mt-4">
        <span className="font-semibold">Setlists selecionados:</span>
        {setlist.length === 0 ? (
          <p className="italic text-sm">Nenhum setlist adicionado ainda.</p>
        ) : (
          <ul className="list-disc  mt-1">
            {setlist.map((tag, index) => {
              const isActive = setlist.includes(tag);
              return (
                <span
                  key={index}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "10px",
                    margin: "2px",
                    cursor: "pointer",
                    backgroundColor: isActive ? "goldenrod" : "#9ca3af",
                    color: "#fff",
                    userSelect: "none",
                  }}
                  title={
                    isActive
                      ? "Clique para remover esta tag"
                      : "Clique para adicionar esta tag"
                  }
                >
                  {tag}
                </span>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NewSongSetlist;
