import { useState, useEffect } from "react";
import { getAllUserSetlists } from "../../Tools/Controllers";
import { MdAddCircle } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";

/* eslint-disable react/prop-types */
function EditSongSetlist({
  setlist,
  setSetlist,
  setlistOptions,
  setSetListOptions,
}) {
  const [newSetlistName, setNewSetlistName] = useState("");

  // Carrega as opções existentes do usuário na primeira renderização
  useEffect(() => {
    (async () => {
      try {
        const lists = await getAllUserSetlists();
        setSetListOptions(lists);
      } catch (err) {
        console.error("Erro ao buscar setlists:", err);
      }
    })();
  }, []);

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

  // Remove totalmente um setlist
  const handleDeleteSetlist = (tag) => {
    setSetListOptions((prev) => prev.filter((t) => t !== tag));
    setSetlist((prev) => prev.filter((t) => t !== tag));
  };

  return (
    // <div className="edit-song-setlist-container p-3 neuphormism-b p-5 my-5 mr-5">
    //   <h3 className="text-lg font-bold mb-2">Editar Setlist (Tags)</h3>

    //   {/* Formulário para criar uma nova tag */}
    //   <div className="mt-4">
    //     <label htmlFor="newSetlistName" className="block mb-1 font-semibold">
    //       Criar novo setlist:
    //     </label>
    //     <div className="flex gap-2">
    //       <input
    //         id="newSetlistName"
    //         type="text"
    //         className="border rounded p-1 w-full"
    //         placeholder="Ex: Turnê2024"
    //         value={newSetlistName}
    //         onChange={(e) => setNewSetlistName(e.target.value)}
    //       />
    //       <button
    //         onClick={handleAddNewTag}
    //         className="bg-green-600 text-white px-3 py-1 rounded"
    //         title="Adicionar nova tag"
    //       >
    //         <MdAddCircle className="w-7 h-7" />
    //       </button>
    //     </div>
    //   </div>

    //   {/* Exibe as tags selecionadas para a música */}
    //   <div className="mt-4">
    //     <span className="font-semibold">Setlists selecionados:</span>
    //     {setlist.length === 0 ? (
    //       <p className="italic text-sm">Nenhum setlist selecionado.</p>
    //     ) : (
    //       <ul className="list-disc  mt-1">
    //         {setlist.map((tag, index) => {
    //           const isActive = setlist.includes(tag);
    //           return (
    //             <span
    //               key={index}
    //               onClick={() => toggleTag(tag)}
    //               style={{
    //                 padding: "6px 10px",
    //                 borderRadius: "10px",
    //                 margin: "2px",
    //                 cursor: "pointer",
    //                 backgroundColor: isActive ? "goldenrod" : "#9ca3af",
    //                 color: "#fff",
    //                 userSelect: "none",
    //               }}
    //               title={
    //                 isActive
    //                   ? "Clique para remover esta tag"
    //                   : "Clique para adicionar esta tag"
    //               }
    //             >
    //               {tag}
    //             </span>
    //           );
    //         })}
    //       </ul>
    //     )}
    //   </div>
    // </div>

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
            // onBlur={() => handleAddNew()}
            onBlur={() => handleAddNewTag()}
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

export default EditSongSetlist;
