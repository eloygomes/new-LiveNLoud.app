import { useState, useEffect, useMemo } from "react";
import { getAllUserSetlists, updateUserSetlists } from "../../Tools/Controllers";
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
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState([]);

  const tagAnimationStyle = useMemo(
    () =>
      isEditing
        ? {
            animation: "tag-shake 0.45s ease-in-out infinite",
            transformOrigin: "center",
          }
        : {},
    [isEditing],
  );

  // Carrega as opções existentes do usuário na primeira renderização
  useEffect(() => {
    (async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        const lists = await getAllUserSetlists(userEmail);
        setSetListOptions(lists);
      } catch (err) {
        console.error("Erro ao buscar setlists:", err);
      }
    })();
  }, []);

  // Alterna a seleção da tag: se já está selecionada, remove; se não, adiciona
  const toggleTag = (tag) => {
    if (isEditing) return;
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

  const togglePendingRemoval = (tag) => {
    setPendingRemovals((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const cancelEditing = () => {
    setPendingRemovals([]);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!pendingRemovals.length) {
      setIsEditing(false);
      return;
    }
    const nextOptions = setlistOptions.filter((tag) => !pendingRemovals.includes(tag));
    const nextSetlist = setlist.filter((tag) => !pendingRemovals.includes(tag));

    setSetListOptions(nextOptions);
    setSetlist(nextSetlist);

    try {
      await updateUserSetlists(nextOptions);
    } catch (error) {
      console.error("Erro ao sincronizar setlists:", error);
      try {
        const refreshed = await getAllUserSetlists();
        setSetListOptions(refreshed);
      } catch (reloadErr) {
        console.error("Erro ao recarregar setlists:", reloadErr);
      }
    }

    setPendingRemovals([]);
    setIsEditing(false);
  };

  const startEditing = () => {
    setPendingRemovals([]);
    setIsEditing(true);
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold mb-2">Setlists</h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              className="text-sm px-4 py-2 rounded-full border transition-colors neuphormism-b-btn"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                className="text-sm px-4 py-2 rounded-full border transition-colors bg-white text-gray-700 border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="text-sm px-4 py-2 rounded-full border transition-colors bg-emerald-500 text-white border-emerald-500 disabled:opacity-60"
                disabled={pendingRemovals.length === 0}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

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
                const willRemove = pendingRemovals.includes(tag);
                const backgroundColor = willRemove
                  ? "#dc2626"
                  : isActive
                    ? "goldenrod"
                    : "#9ca3af";
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-1 ${
                      willRemove ? "opacity-60 ring-2 ring-red-400" : ""
                    } ${isEditing ? "cursor-default" : ""}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: "10px",
                      margin: "2px",
                      cursor: isEditing ? "default" : "pointer",
                      fontSize: "12px",
                      backgroundColor,
                      border: willRemove ? "1px solid #dc2626" : "1px solid transparent",
                      color: "#fff",
                      userSelect: "none",
                      ...tagAnimationStyle,
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
                    {isEditing && (
                      <RiDeleteBin6Line
                        className={`w-4 h-4 ml-1 ${willRemove ? "text-red-500" : ""}`}
                        title={
                          willRemove
                            ? "Clique para desfazer a remoção"
                            : "Remover setlist do sistema"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePendingRemoval(tag);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tag-shake {
          0% { transform: rotate(-2deg) scale(0.98); }
          25% { transform: rotate(2deg) scale(1.02); }
          50% { transform: rotate(-3deg) scale(0.99); }
          75% { transform: rotate(3deg) scale(1.01); }
          100% { transform: rotate(-2deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default EditSongSetlist;
