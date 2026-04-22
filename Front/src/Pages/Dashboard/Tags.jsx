/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

export default function Tags({
  setlists = [],
  selectedSetlists = [],
  toggleTag,
  handleDeleteSetlist,
  handleAddSetlist,
  RiDeleteBin6Line,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState([]);
  const [newTagName, setNewTagName] = useState("");

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

  const startEditing = () => {
    setPendingRemovals([]);
    setIsEditing(true);
  };

  const addNewTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    await Promise.resolve(handleAddSetlist?.(trimmed));
    setNewTagName("");
  };

  const cancelEditing = () => {
    setPendingRemovals([]);
    setIsEditing(false);
  };

  const togglePendingRemoval = (tag) => {
    setPendingRemovals((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const handleSaveChanges = async () => {
    if (!pendingRemovals.length) {
      setIsEditing(false);
      return;
    }

    for (const tag of pendingRemovals) {
      try {
        await Promise.resolve(handleDeleteSetlist(tag));
      } catch (error) {
        console.error("Erro ao remover setlist:", tag, error);
      }
    }

    setPendingRemovals([]);
    setIsEditing(false);
  };

  return (
    <>
      <section className="neuphormism-b p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-black uppercase">Tags</h1>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">
              Filter songs by setlist tags
            </p>
          </div>
          <div className="flex gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-full px-4 py-2 text-sm font-bold transition-colors neuphormism-b-btn"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-full px-4 py-2 text-sm font-bold transition-colors neuphormism-b-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    className="rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 neuphormism-b-btn-gold"
                    disabled={pendingRemovals.length === 0}
                  >
                    Save
                  </button>
                </>
              )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            className="input-neumorfismo min-w-0 flex-1 rounded-lg border border-transparent bg-[#e0e0e0] px-3 py-2 text-[16px] font-semibold outline-none focus:border-[goldenrod] md:text-sm"
            placeholder="Add new tag"
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addNewTag();
              }
            }}
          />
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-black uppercase neuphormism-b-btn-gold"
            onClick={addNewTag}
          >
            Add
          </button>
        </div>

        <div className="mt-4">
          {setlists.length === 0 ? (
            <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {setlists.map((tag, index) => {
                const isActive = selectedSetlists.includes(tag);
                const willRemove = pendingRemovals.includes(tag);
                const backgroundColor = willRemove
                  ? "#dc2626"
                  : isActive
                    ? "goldenrod"
                    : "#9ca3af";
                return (
                  <div
                    key={`${tag}-${index}`}
                    className={`flex items-center gap-1 shadow-sm ${
                      isEditing ? "cursor-default" : ""
                    } ${willRemove ? "ring-2 ring-red-600" : ""}`}
                    style={{
                      minWidth: "80px",
                      display: "inline-flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: "7px",
                      margin: "2px",
                      cursor: isEditing ? "default" : "pointer",
                      fontSize: "12px",
                      backgroundColor,
                      border: willRemove
                        ? "1px solid #dc2626"
                        : "1px solid transparent",
                      color: "#fff",
                      userSelect: "none",
                      ...tagAnimationStyle,
                    }}
                  >
                    <span
                      onClick={() => !isEditing && toggleTag(tag)}
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
                        className={`ml-1 h-4 w-4 ${
                          willRemove ? "text-red-500" : ""
                        }`}
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
      </section>
      <style>{`
      @keyframes tag-shake {
        0% { transform: rotate(-2deg) scale(0.98); }
        25% { transform: rotate(2deg) scale(1.02); }
        50% { transform: rotate(-3deg) scale(0.99); }
        75% { transform: rotate(3deg) scale(1.01); }
        100% { transform: rotate(-2deg) scale(1); }
      }
    `}</style>
    </>
  );
}
