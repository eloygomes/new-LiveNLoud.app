// import { useState, useEffect, useMemo } from "react";
// import {
//   getAllUserSetlists,
//   updateUserSetlists,
// } from "../../Tools/Controllers";
// import { MdAddCircle } from "react-icons/md";
// import { RiDeleteBin6Line } from "react-icons/ri";

// /* eslint-disable react/prop-types */
// function EditSongSetlist({
//   setlist,
//   setSetlist,
//   setlistOptions,
//   setSetListOptions,
// }) {
//   const [newSetlistName, setNewSetlistName] = useState("");
//   const [isEditing, setIsEditing] = useState(false);
//   const [pendingRemovals, setPendingRemovals] = useState([]);

//   const tagAnimationStyle = useMemo(
//     () =>
//       isEditing
//         ? {
//             animation: "tag-shake 0.45s ease-in-out infinite",
//             transformOrigin: "center",
//           }
//         : {},
//     [isEditing],
//   );

//   // Carrega as opções existentes do usuário na primeira renderização
//   useEffect(() => {
//     (async () => {
//       try {
//         const userEmail = localStorage.getItem("userEmail");
//         const lists = await getAllUserSetlists(userEmail);
//         setSetListOptions(lists);
//       } catch (err) {
//         console.error("Erro ao buscar setlists:", err);
//       }
//     })();
//   }, []);

//   // Alterna a seleção da tag: se já está selecionada, remove; se não, adiciona
//   const toggleTag = (tag) => {
//     if (isEditing) return;
//     if (setlist.includes(tag)) {
//       setSetlist(setlist.filter((item) => item !== tag));
//     } else {
//       setSetlist([...setlist, tag]);
//     }
//   };

//   // Adiciona uma nova tag: atualiza as opções globais e adiciona à lista da música
//   const handleAddNewTag = () => {
//     const trimmed = newSetlistName.trim();
//     if (!trimmed) return;
//     if (!setlistOptions.includes(trimmed)) {
//       setSetListOptions([...setlistOptions, trimmed]);
//     }
//     if (!setlist.includes(trimmed)) {
//       setSetlist([...setlist, trimmed]);
//     }
//     setNewSetlistName("");
//   };

//   const togglePendingRemoval = (tag) => {
//     setPendingRemovals((prev) =>
//       prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
//     );
//   };

//   const cancelEditing = () => {
//     setPendingRemovals([]);
//     setIsEditing(false);
//   };

//   const handleSaveChanges = async () => {
//     if (!pendingRemovals.length) {
//       setIsEditing(false);
//       return;
//     }
//     const nextOptions = setlistOptions.filter(
//       (tag) => !pendingRemovals.includes(tag),
//     );
//     const nextSetlist = setlist.filter((tag) => !pendingRemovals.includes(tag));

//     setSetListOptions(nextOptions);
//     setSetlist(nextSetlist);

//     try {
//       await updateUserSetlists(nextOptions);
//     } catch (error) {
//       console.error("Erro ao sincronizar setlists:", error);
//       try {
//         const refreshed = await getAllUserSetlists();
//         setSetListOptions(refreshed);
//       } catch (reloadErr) {
//         console.error("Erro ao recarregar setlists:", reloadErr);
//       }
//     }

//     setPendingRemovals([]);
//     setIsEditing(false);
//   };

//   const startEditing = () => {
//     setPendingRemovals([]);
//     setIsEditing(true);
//   };

//   return (
//     <div className="my-5 mr-5 rounded-[30px] neuphormism-b px-6 py-6">
//       <div className="flex items-center justify-between gap-3">
//         <div>
//           <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod] pb-5">
//             Setlist
//           </p>

//           <p className="mt-1 text-sm font-medium text-gray-500">
//             Update song tags without leaving the edit flow.
//           </p>
//         </div>
//         <div className="flex gap-2">
//           {!isEditing ? (
//             <button
//               type="button"
//               onClick={startEditing}
//               className="text-sm px-4 py-2 rounded-full border transition-colors neuphormism-b-btn"
//             >
//               Edit
//             </button>
//           ) : (
//             <>
//               <button
//                 type="button"
//                 onClick={cancelEditing}
//                 className="text-sm px-4 py-2 rounded-full border transition-colors bg-white text-gray-700 border-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={handleSaveChanges}
//                 className="text-sm px-4 py-2 rounded-full border transition-colors bg-emerald-500 text-white border-emerald-500 disabled:opacity-60"
//                 disabled={pendingRemovals.length === 0}
//               >
//                 Save
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       <div className="mt-5">
//         <label
//           htmlFor="newSetlistName"
//           className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500"
//         >
//           Criar um novo setlist:
//         </label>
//         <div className="flex flex-row items-center gap-2">
//           <input
//             id="newSetlistName"
//             type="text"
//             className="w-full rounded border-0  px-2 py-1 outline-none text-sm"
//             placeholder="Ex: 'Show2023' ou 'Ensaios'"
//             value={newSetlistName}
//             onChange={(e) => setNewSetlistName(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") {
//                 e.preventDefault();
//                 handleAddNewTag();
//               }
//             }}
//           />
//           <button
//             type="button"
//             className="px-3 py-2 text-sm neuphormism-b-btn"
//             onClick={handleAddNewTag}
//           >
//             Add
//           </button>
//         </div>
//       </div>

//       <div className="mt-5">
//         <h1 className="px-0 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
//           Setlists disponíveis
//         </h1>
//         <div className="w-full pr-2">
//           {setlistOptions.length === 0 ? (
//             <p className="mt-3 italic text-sm text-gray-500">
//               Nenhuma setlist cadastrada.
//             </p>
//           ) : (
//             <div className="flex flex-wrap gap-2">
//               {setlistOptions.map((tag, index) => {
//                 const isActive = setlist.includes(tag);
//                 const willRemove = pendingRemovals.includes(tag);
//                 const backgroundColor = willRemove
//                   ? "#dc2626"
//                   : isActive
//                     ? "goldenrod"
//                     : "#9ca3af";
//                 return (
//                   <div
//                     key={index}
//                     className={`flex items-center gap-1 ${
//                       willRemove ? "opacity-60 ring-2 ring-red-400" : ""
//                     } ${isEditing ? "cursor-default" : ""}`}
//                     style={{
//                       display: "inline-flex",
//                       alignItems: "center",
//                       padding: "6px 10px",
//                       borderRadius: "10px",
//                       margin: "2px",
//                       cursor: isEditing ? "default" : "pointer",
//                       fontSize: "12px",
//                       backgroundColor,
//                       border: willRemove
//                         ? "1px solid #dc2626"
//                         : "1px solid transparent",
//                       color: "#fff",
//                       userSelect: "none",
//                       ...tagAnimationStyle,
//                     }}
//                   >
//                     <span
//                       onClick={() => toggleTag(tag)}
//                       title={
//                         isActive
//                           ? "Clique para remover este filtro"
//                           : "Clique para adicionar este filtro"
//                       }
//                     >
//                       {tag}
//                     </span>
//                     {isEditing && (
//                       <RiDeleteBin6Line
//                         className={`w-4 h-4 ml-1 ${willRemove ? "text-red-500" : ""}`}
//                         title={
//                           willRemove
//                             ? "Clique para desfazer a remoção"
//                             : "Remover setlist do sistema"
//                         }
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           togglePendingRemoval(tag);
//                         }}
//                       />
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       <style>{`
//         @keyframes tag-shake {
//           0% { transform: rotate(-2deg) scale(0.98); }
//           25% { transform: rotate(2deg) scale(1.02); }
//           50% { transform: rotate(-3deg) scale(0.99); }
//           75% { transform: rotate(3deg) scale(1.01); }
//           100% { transform: rotate(-2deg) scale(1); }
//         }
//       `}</style>
//     </div>
//   );
// }

// export default EditSongSetlist;

import { useEffect, useMemo, useState } from "react";
import {
  getAllUserSetlists,
  updateUserSetlists,
} from "../../Tools/Controllers";
import { RiDeleteBin6Line } from "react-icons/ri";

/* eslint-disable react/prop-types */

const TAG_SHAKE_ANIMATION = "tag-shake 0.45s ease-in-out infinite";

const getUserEmail = () => localStorage.getItem("userEmail");

const getTagBackgroundColor = ({ willRemove, isActive }) => {
  if (willRemove) return "#dc2626";
  if (isActive) return "goldenrod";
  return "#9ca3af";
};

const getTagTitle = (isActive) =>
  isActive
    ? "Clique para remover este filtro"
    : "Clique para adicionar este filtro";

const getRemoveIconTitle = (willRemove) =>
  willRemove ? "Clique para desfazer a remoção" : "Remover setlist do sistema";

const buildTagStyle = ({
  backgroundColor,
  willRemove,
  isEditing,
  tagAnimationStyle,
}) => ({
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
});

function EditSongSetlistWeb({
  setlist,
  setSetlist,
  setlistOptions,
  setSetListOptions,
}) {
  const [newSetlistName, setNewSetlistName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState([]);

  const tagAnimationStyle = useMemo(() => {
    if (!isEditing) return {};

    return {
      animation: TAG_SHAKE_ANIMATION,
      transformOrigin: "center",
    };
  }, [isEditing]);

  useEffect(() => {
    loadUserSetlists();
  }, []);

  const loadUserSetlists = async () => {
    try {
      const userEmail = getUserEmail();
      const lists = await getAllUserSetlists(userEmail);

      setSetListOptions(lists);
    } catch (error) {
      console.error("Erro ao buscar setlists:", error);
    }
  };

  const toggleTag = (tag) => {
    if (isEditing) return;

    const isSelected = setlist.includes(tag);

    if (isSelected) {
      setSetlist(setlist.filter((item) => item !== tag));
      return;
    }

    setSetlist([...setlist, tag]);
  };

  const addNewTag = () => {
    const trimmedName = newSetlistName.trim();

    if (!trimmedName) return;

    addTagToOptions(trimmedName);
    addTagToCurrentSong(trimmedName);
    setNewSetlistName("");
  };

  const addTagToOptions = (tag) => {
    if (setlistOptions.includes(tag)) return;

    setSetListOptions([...setlistOptions, tag]);
  };

  const addTagToCurrentSong = (tag) => {
    if (setlist.includes(tag)) return;

    setSetlist([...setlist, tag]);
  };

  const togglePendingRemoval = (tag) => {
    setPendingRemovals((currentRemovals) => {
      const alreadyPending = currentRemovals.includes(tag);

      if (alreadyPending) {
        return currentRemovals.filter((item) => item !== tag);
      }

      return [...currentRemovals, tag];
    });
  };

  const startEditing = () => {
    setPendingRemovals([]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setPendingRemovals([]);
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!pendingRemovals.length) {
      setIsEditing(false);
      return;
    }

    const nextOptions = setlistOptions.filter(
      (tag) => !pendingRemovals.includes(tag),
    );

    const nextSetlist = setlist.filter((tag) => !pendingRemovals.includes(tag));

    setSetListOptions(nextOptions);
    setSetlist(nextSetlist);

    try {
      await updateUserSetlists(nextOptions);
    } catch (error) {
      console.error("Erro ao sincronizar setlists:", error);
      await reloadSetlistsAfterError();
    }

    setPendingRemovals([]);
    setIsEditing(false);
  };

  const reloadSetlistsAfterError = async () => {
    try {
      const userEmail = getUserEmail();
      const refreshed = await getAllUserSetlists(userEmail);

      setSetListOptions(refreshed);
    } catch (error) {
      console.error("Erro ao recarregar setlists:", error);
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    addNewTag();
  };

  return (
    <div className="my-5 mr-5 rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod] pb-5">
            Setlist
          </p>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Update song tags without leaving the edit flow.
          </p>
        </div>

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
                onClick={saveChanges}
                className="text-sm px-4 py-2 rounded-full border transition-colors bg-emerald-500 text-white border-emerald-500 disabled:opacity-60"
                disabled={pendingRemovals.length === 0}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="newSetlistName"
          className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500"
        >
          Criar um novo setlist:
        </label>

        <div className="flex flex-row items-center gap-2">
          <input
            id="newSetlistName"
            type="text"
            className="w-full rounded border-0  px-2 py-1 outline-none text-sm"
            placeholder="Ex: 'Show2023' ou 'Ensaios'"
            value={newSetlistName}
            onChange={(event) => setNewSetlistName(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />

          <button
            type="button"
            className="px-3 py-2 text-sm neuphormism-b-btn"
            onClick={addNewTag}
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h1 className="px-0 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
          Setlists disponíveis
        </h1>

        <div className="w-full pr-2">
          {setlistOptions.length === 0 ? (
            <p className="mt-3 italic text-sm text-gray-500">
              Nenhuma setlist cadastrada.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {setlistOptions.map((tag) => {
                const isActive = setlist.includes(tag);
                const willRemove = pendingRemovals.includes(tag);
                const backgroundColor = getTagBackgroundColor({
                  willRemove,
                  isActive,
                });

                return (
                  <div
                    key={tag}
                    className={`flex items-center gap-1 ${
                      willRemove ? "opacity-60 ring-2 ring-red-400" : ""
                    } ${isEditing ? "cursor-default" : ""}`}
                    style={buildTagStyle({
                      backgroundColor,
                      willRemove,
                      isEditing,
                      tagAnimationStyle,
                    })}
                  >
                    <span
                      onClick={() => toggleTag(tag)}
                      title={getTagTitle(isActive)}
                    >
                      {tag}
                    </span>

                    {isEditing && (
                      <RiDeleteBin6Line
                        className={`w-4 h-4 ml-1 ${
                          willRemove ? "text-red-500" : ""
                        }`}
                        title={getRemoveIconTitle(willRemove)}
                        onClick={(event) => {
                          event.stopPropagation();
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

function EditSongSetlistMobile({
  setlist,
  setSetlist,
  setlistOptions,
  setSetListOptions,
}) {
  const [newSetlistName, setNewSetlistName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState([]);

  const tagAnimationStyle = useMemo(() => {
    if (!isEditing) return {};

    return {
      animation: TAG_SHAKE_ANIMATION,
      transformOrigin: "center",
    };
  }, [isEditing]);

  useEffect(() => {
    loadUserSetlists();
  }, []);

  const loadUserSetlists = async () => {
    try {
      const userEmail = getUserEmail();
      const lists = await getAllUserSetlists(userEmail);

      setSetListOptions(lists);
    } catch (error) {
      console.error("Erro ao buscar setlists:", error);
    }
  };

  const toggleTag = (tag) => {
    if (isEditing) return;

    const isSelected = setlist.includes(tag);

    if (isSelected) {
      setSetlist(setlist.filter((item) => item !== tag));
      return;
    }

    setSetlist([...setlist, tag]);
  };

  const addNewTag = () => {
    const trimmedName = newSetlistName.trim();

    if (!trimmedName) return;

    if (!setlistOptions.includes(trimmedName)) {
      setSetListOptions([...setlistOptions, trimmedName]);
    }

    if (!setlist.includes(trimmedName)) {
      setSetlist([...setlist, trimmedName]);
    }

    setNewSetlistName("");
  };

  const togglePendingRemoval = (tag) => {
    setPendingRemovals((currentRemovals) => {
      const alreadyPending = currentRemovals.includes(tag);

      if (alreadyPending) {
        return currentRemovals.filter((item) => item !== tag);
      }

      return [...currentRemovals, tag];
    });
  };

  const startEditing = () => {
    setPendingRemovals([]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setPendingRemovals([]);
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!pendingRemovals.length) {
      setIsEditing(false);
      return;
    }

    const nextOptions = setlistOptions.filter(
      (tag) => !pendingRemovals.includes(tag),
    );

    const nextSetlist = setlist.filter((tag) => !pendingRemovals.includes(tag));

    setSetListOptions(nextOptions);
    setSetlist(nextSetlist);

    try {
      await updateUserSetlists(nextOptions);
    } catch (error) {
      console.error("Erro ao sincronizar setlists:", error);

      try {
        const userEmail = getUserEmail();
        const refreshed = await getAllUserSetlists(userEmail);

        setSetListOptions(refreshed);
      } catch (reloadError) {
        console.error("Erro ao recarregar setlists:", reloadError);
      }
    }

    setPendingRemovals([]);
    setIsEditing(false);
  };

  const handleInputKeyDown = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    addNewTag();
  };

  return (
    <div className="my-5 mr-5 rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod] pb-5">
            Setlist
          </p>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Update song tags without leaving the edit flow.
          </p>
        </div>

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
                onClick={saveChanges}
                className="text-sm px-4 py-2 rounded-full border transition-colors bg-emerald-500 text-white border-emerald-500 disabled:opacity-60"
                disabled={pendingRemovals.length === 0}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="newSetlistNameMobile"
          className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500"
        >
          Criar um novo setlist:
        </label>

        <div className="flex flex-row items-center gap-2">
          <input
            id="newSetlistNameMobile"
            type="text"
            className="w-full rounded border-0  px-2 py-1 outline-none text-sm"
            placeholder="Ex: 'Show2023' ou 'Ensaios'"
            value={newSetlistName}
            onChange={(event) => setNewSetlistName(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />

          <button
            type="button"
            className="px-3 py-2 text-sm neuphormism-b-btn"
            onClick={addNewTag}
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h1 className="px-0 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
          Setlists disponíveis
        </h1>

        <div className="w-full pr-2">
          {setlistOptions.length === 0 ? (
            <p className="mt-3 italic text-sm text-gray-500">
              Nenhuma setlist cadastrada.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {setlistOptions.map((tag) => {
                const isActive = setlist.includes(tag);
                const willRemove = pendingRemovals.includes(tag);
                const backgroundColor = getTagBackgroundColor({
                  willRemove,
                  isActive,
                });

                return (
                  <div
                    key={tag}
                    className={`flex items-center gap-1 ${
                      willRemove ? "opacity-60 ring-2 ring-red-400" : ""
                    } ${isEditing ? "cursor-default" : ""}`}
                    style={buildTagStyle({
                      backgroundColor,
                      willRemove,
                      isEditing,
                      tagAnimationStyle,
                    })}
                  >
                    <span
                      onClick={() => toggleTag(tag)}
                      title={getTagTitle(isActive)}
                    >
                      {tag}
                    </span>

                    {isEditing && (
                      <RiDeleteBin6Line
                        className={`w-4 h-4 ml-1 ${
                          willRemove ? "text-red-500" : ""
                        }`}
                        title={getRemoveIconTitle(willRemove)}
                        onClick={(event) => {
                          event.stopPropagation();
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

export { EditSongSetlistWeb, EditSongSetlistMobile };

export default EditSongSetlistWeb;
