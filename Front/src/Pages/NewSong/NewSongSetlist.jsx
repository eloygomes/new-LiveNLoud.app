/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from "react";
import { MdAddCircle } from "react-icons/md";
import {
  getAllUserSetlists,
  updateUserSetlists,
} from "../../Tools/Controllers";
import { IoClose } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";

function NewSongSetlist({
  setlistOptions = [],
  setSetlistOptions,
  setlist = [],
  setSetlist,
  compact = false,
}) {
  // Guardamos o input do usuário para criar um novo setlist
  const [newSetlistName, setNewSetlistName] = useState("");

  // Guardamos os setlists já existentes
  const [setlists, setSetlists] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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
    const nextOptions = setlistOptions.filter(
      (tag) => !pendingRemovals.includes(tag),
    );
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
    <div className={compact ? "my-0 rounded-[18px] border border-black/5 bg-white/60 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]" : "my-5 rounded-[16px] neuphormism-b px-6 py-6"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`${compact ? "text-[10px] tracking-[0.22em]" : "text-[11px] tracking-[0.24em]"} font-bold uppercase text-[goldenrod]`}>
            Setlist
          </p>
          {compact ? (
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[goldenrod]">
              {setlist.length}/{setlistOptions.length} selected
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-gray-500">Available setlists</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreating((current) => !current)}
            className={`${compact ? "h-8 w-8 rounded-[9px] bg-[goldenrod]/15 p-0 text-[12px] shadow-[0_4px_12px_rgba(218,165,32,0.12)]" : "rounded-[8px] px-4 py-2 text-sm neuphormism-b-btn"} font-bold transition-colors`}
            aria-label="Create setlist"
          >
            +
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              className={`${compact ? "h-8 rounded-[9px] bg-white/75 px-2.5 text-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.04)]" : "rounded-[8px] px-4 py-2 text-sm neuphormism-b-btn"} font-bold transition-colors`}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                className={`${compact ? "h-8 rounded-[9px] bg-white/75 px-2 text-[9px] shadow-[0_4px_12px_rgba(0,0,0,0.04)]" : "rounded-[8px] px-4 py-2 text-sm neuphormism-b-btn"} font-bold transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className={`${compact ? "h-8 rounded-[9px] bg-[goldenrod]/15 px-2 text-[9px] shadow-[0_4px_12px_rgba(218,165,32,0.12)]" : "rounded-[8px] px-4 py-2 text-sm neuphormism-b-btn"} font-bold transition-colors disabled:opacity-60`}
                disabled={pendingRemovals.length === 0}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {isCreating ? (
      <div className={compact ? "mt-3" : "mt-5"}>
        <label
          htmlFor="newSetlistName"
          className={`${compact ? "mb-1.5 text-[9px]" : "mb-2 text-[11px]"} block font-bold uppercase tracking-[0.18em] text-gray-500`}
        >
          Create a new setlist:
        </label>
        <div className="flex flex-row items-center gap-2">
          <input
            id="newSetlistName"
            type="text"
            className={`${compact ? "h-10 rounded-[10px] border border-gray-300 px-3 text-[12px]" : "rounded border-0 px-2 py-1 text-sm"} w-full bg-white outline-none focus:border-[goldenrod]`}
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
            className={`${compact ? "h-10 w-10 rounded-[10px] bg-[goldenrod]/15 p-0 text-[12px]" : "rounded-[8px] px-3 py-2 text-sm neuphormism-b-btn"} font-bold`}
            onClick={handleAddNew}
          >
            +
          </button>
        </div>
      </div>
      ) : null}

      <div className={compact ? "mt-3" : "mt-7"}>
        <div className={compact ? "w-full" : "w-full pr-2"}>
          {setlistOptions.length === 0 ? (
            <p className={`${compact ? "rounded-[12px] border border-dashed border-black/10 bg-white/45 px-3 py-4 text-center text-[11px]" : "mt-3 italic text-sm"} text-gray-500`}>
              Nenhuma setlist cadastrada.
            </p>
          ) : (
            <div className={compact ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
              {setlistOptions.map((tag, index) => {
                const isActive = setlist.includes(tag);
                const willRemove = pendingRemovals.includes(tag);
                return (
                  <button
                    type="button"
                    key={index}
                    className={`setlist-tag-button ${compact ? "!m-0 !h-10 !w-full !min-w-0 !rounded-[11px] !border-black/5 !px-3 !py-2 !text-[11px] !shadow-[0_4px_12px_rgba(0,0,0,0.04)]" : ""} ${
                      isActive ? "setlist-tag-button-active" : ""
                    } ${
                      willRemove
                        ? "setlist-tag-button-removing opacity-60 ring-2 ring-red-400"
                        : ""
                    } ${isEditing ? "setlist-tag-button-editing" : ""}`}
                    onClick={() => toggleTag(tag)}
                    title={
                      isActive
                        ? "Clique para remover este filtro"
                        : "Clique para adicionar este filtro"
                    }
                    style={{
                      ...tagAnimationStyle,
                      ...(compact && !isActive
                        ? { background: "rgba(255, 255, 255, 0.75)" }
                        : {}),
                    }}
                  >
                    <span>{tag}</span>
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
                  </button>
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
