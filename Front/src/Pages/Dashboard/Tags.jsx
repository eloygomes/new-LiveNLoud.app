/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

export default function Tags({
  setlists = [],
  selectedSetlists = [],
  toggleTag,
  handleDeleteSetlist,
  RiDeleteBin6Line,
}) {
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

  const startEditing = () => {
    setPendingRemovals([]);
    setIsEditing(true);
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
      <div>
        <div className="neuphormism-b m-2  p-2 ">
          <div className="flex justify-around items-center ">
            <div className="w-1/2 ">
              <h1 className="px-5 pb-2 text-sm pt-3 font-bold text-md uppercase">
                Tags
              </h1>
            </div>
            <div className="w-1/2 flex justify-end pr-5 gap-2">
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
                    className="text-sm px-4 py-2 rounded-full border transition-colors bg-white text-gray-700 border-gray-300  neuphormism-b-btn-red-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    className="text-sm px-4 py-2 rounded-full border transition-colors  disabled:opacity-60 neuphormism-b-btn-green-save "
                    disabled={pendingRemovals.length === 0}
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Corpo principal */}
          <div className="flex flex-row justify-between px-5 my-5 ">
            <div className="w-full pr-2 ">
              {setlists.length === 0 ? (
                <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
              ) : (
                <div className="flex flex-wrap gap-2  ">
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
                            className={`w-4 h-4 ml-1 ${
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
          </div>
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
    </>
  );
}
