/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from "react";
import { MdAddCircle } from "react-icons/md";
import { getAllUserSetlists, updateUserSetlists } from "../../Tools/Controllers";
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

  const toggleTag = (item) => {
    if (isEditing) return;
    if (setlist.includes(item)) {
      // Se já está no setlist, removemos
      setSetlist((prev) => prev.filter((x) => x !== item));
    } else {
      // Se não está, adicionamos
      setSetlist((prev) => [...prev, item]);
    }
  };

  // Remove a tag definitivamente do sistema
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

    setSetlistOptions(nextOptions);
    setSetlist(nextSetlist);

    try {
      await updateUserSetlists(nextOptions);
    } catch (error) {
      console.error("Erro ao sincronizar setlists:", error);
      try {
        const refreshed = await getAllUserSetlists();
        setSetlistOptions(refreshed);
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

  // console.log("setlistOptions", setlistOptions);

  return (
    <div className="my-5 mr-5 rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
            Song Workspace
          </p>
          <h2 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black">Setlist</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Tag this song for rehearsal, show, or collection groups.
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

      <div className="mt-5">
        <label htmlFor="newSetlistName" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
          Criar um novo setlist:
        </label>
        <div className="flex flex-row items-center gap-2">
          <input
            id="newSetlistName"
            type="text"
            className="w-full rounded-[18px] border-0 neuphormism-b-se px-4 py-3 outline-none"
            placeholder="Ex: 'Show2023' ou 'Ensaios'"
            value={newSetlistName}
            onChange={(e) => setNewSetlistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNew();
              }
            }}
          />
          <button
            type="button"
            className="px-3 py-2 text-sm neuphormism-b-btn"
            onClick={handleAddNew}
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h1 className="px-0 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Setlists disponíveis</h1>
        <div className="w-full pr-2">
          {setlistOptions.length === 0 ? (
            <p className="mt-3 italic text-sm text-gray-500">Nenhuma setlist cadastrada.</p>
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

export default NewSongSetlist;
