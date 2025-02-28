import { useState } from "react";
import { MdAddCircle } from "react-icons/md";

/* eslint-disable react/prop-types */
function EditSongSetlist({
  setlist,
  setSetlist,
  setlistOptions,
  setSetListOptions,
}) {
  const [newSetlistName, setNewSetlistName] = useState("");

  // Alterna a seleção da tag: se já está selecionada, remove; se não, adiciona
  const toggleTag = (tag) => {
    if (setlist.includes(tag)) {
      setSetlist(setlist.filter((item) => item !== tag));
    } else {
      setSetlist([...setlist, tag]);
    }
  };

  // Adiciona uma nova tag: atualiza as opções globais e adiciona à lista da música
  const handleAddNewTag = () => {
    const trimmed = newSetlistName.trim();
    if (!trimmed) return;
    if (!setlistOptions.includes(trimmed)) {
      setSetListOptions([...setlistOptions, trimmed]);
    }
    if (!setlist.includes(trimmed)) {
      setSetlist([...setlist, trimmed]);
    }
    setNewSetlistName("");
  };

  return (
    <div className="edit-song-setlist-container p-3 neuphormism-b p-5 my-5 mr-5">
      <h3 className="text-lg font-bold mb-2">Editar Setlist (Tags)</h3>

      {/* Formulário para criar uma nova tag */}
      <div className="mt-4">
        <label htmlFor="newSetlistName" className="block mb-1 font-semibold">
          Criar novo setlist:
        </label>
        <div className="flex gap-2">
          <input
            id="newSetlistName"
            type="text"
            className="border rounded p-1 w-full"
            placeholder="Ex: Turnê2024"
            value={newSetlistName}
            onChange={(e) => setNewSetlistName(e.target.value)}
          />
          <button
            onClick={handleAddNewTag}
            className="bg-green-600 text-white px-3 py-1 rounded"
            title="Adicionar nova tag"
          >
            <MdAddCircle className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Exibe as tags selecionadas para a música */}
      <div className="mt-4">
        <span className="font-semibold">Setlists selecionados:</span>
        {setlist.length === 0 ? (
          <p className="italic text-sm">Nenhum setlist selecionado.</p>
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

export default EditSongSetlist;
