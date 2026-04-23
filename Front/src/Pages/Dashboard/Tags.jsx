/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { FiSend } from "react-icons/fi";
import { fetchCurrentUserProfile, shareSetlists } from "../../Tools/Controllers";

export default function Tags({
  setlists = [],
  selectedSetlists = [],
  importedSetlists = [],
  toggleTag,
  handleDeleteSetlist,
  handleAddSetlist,
  RiDeleteBin6Line,
}) {
  const [activeTab, setActiveTab] = useState("tags");
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [destinationEmail, setDestinationEmail] = useState("");
  const [friends, setFriends] = useState([]);
  const [shareStatus, setShareStatus] = useState("");
  const [shareError, setShareError] = useState("");
  const [sharing, setSharing] = useState(false);

  const exportableSetlists = useMemo(() => {
    const source = selectedSetlists.length ? selectedSetlists : setlists;
    return source.filter(Boolean);
  }, [selectedSetlists, setlists]);

  const canSend =
    exportableSetlists.length > 0 &&
    destinationEmail.trim().length > 0 &&
    !sharing;

  const friendSuggestions = useMemo(() => {
    const query = destinationEmail.trim().toLowerCase();
    if (!query) return friends.slice(0, 5);
    return friends
      .filter((friend) => {
        const email = String(friend.counterpartEmail || "").toLowerCase();
        const username = String(friend.counterpartUsername || "").toLowerCase();
        const fullName = String(friend.counterpartFullName || "").toLowerCase();
        return (
          email.includes(query) ||
          username.includes(query) ||
          fullName.includes(query)
        );
      })
      .slice(0, 5);
  }, [destinationEmail, friends]);

  useEffect(() => {
    let cancelled = false;

    const loadFriends = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        if (cancelled) return;
        setFriends(
          Array.isArray(profile?.acceptedInvitations)
            ? profile.acceptedInvitations
            : [],
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load friends for setlist share:", error);
          setFriends([]);
        }
      }
    };

    loadFriends();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleShareSetlists = async () => {
    const recipientEmail = destinationEmail.trim().toLowerCase();
    if (!recipientEmail || !exportableSetlists.length) return;

    setSharing(true);
    setShareStatus("");
    setShareError("");

    try {
      const share = await shareSetlists({
        recipientEmail,
        setlistNames: exportableSetlists,
      });
      setDestinationEmail("");
      setShareStatus(
        `Shared ${share?.songs?.length || 0} songs with ${recipientEmail}.`,
      );
    } catch (error) {
      setShareError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to share setlist.",
      );
    } finally {
      setSharing(false);
    }
  };

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
        <div className="flex flex-row flex-1 items-start justify-between gap-3 ">
          <div className="w-1/2 flex flex-col">
            <h1 className="text-sm font-black uppercase">Tags / Setlists</h1>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">
              Filter songs by setlist tags.
            </p>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">
              Selected setlists can be exported or shared with accepted friends.
            </p>
          </div>
          <div className="w-1/2 flex flex-row justify-between gap-2">
            <div className="w-1/2"></div>
            <button
              type="button"
              className={`flex-1 rounded-md px-2 py-2 text-sm font-black uppercase transition-colors ${
                activeTab === "tags"
                  ? "neuphormism-b-btn-gold"
                  : "neuphormism-b-btn "
              }`}
              onClick={() => setActiveTab("tags")}
            >
              Tags
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-2 py-2 text-sm font-black uppercase transition-colors ${
                activeTab === "export"
                  ? "neuphormism-b-btn-gold"
                  : "neuphormism-b-btn "
              }`}
              onClick={() => setActiveTab("export")}
            >
              Share
            </button>
          </div>
        </div>

        {activeTab === "tags" ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[11px] font-black uppercase text-gray-600">
                  Filter tags
                </h2>
                <p className="mt-1 text-[11px] font-semibold text-gray-500">
                  Selected tags filter the dashboard and are carried into
                  export.
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
                className="rounded-lg px-6 py-2 text-sm font-black uppercase neuphormism-b-btn-gold"
                onClick={addNewTag}
              >
                +
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
          </div>
        ) : (
          <div className="mt-4">
            {/* <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[11px] font-black uppercase text-gray-600">
                  Export selected setlists
                </h2>
                <p className="mt-1 text-[11px] font-semibold text-gray-500">
                  Uses the active tags first, or all setlists when none are
                  selected.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="neuphormism-b-btn flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-[#9ca3af] transition-transform hover:bg-[goldenrod] hover:text-black active:scale-95"
                >
                  <FiUpload />
                  Import
                </button>
                <button
                  type="button"
                  disabled={!exportableSetlists.length}
                  className={`neuphormism-b-btn flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition-transform ${
                    exportableSetlists.length
                      ? "text-[#9ca3af] hover:bg-[goldenrod] hover:text-black active:scale-95"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <FiDownload />
                  Export
                </button>
              </div>
            </div> */}

            <div className="mt-3 flex min-h-9 flex-wrap gap-2 rounded-lg border border-black/5 bg-white/50 p-2">
              {exportableSetlists.length ? (
                exportableSetlists.map((setlist) => (
                  <span
                    key={setlist}
                    className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold text-gray-700"
                  >
                    {setlist}
                  </span>
                ))
              ) : (
                <p className="text-[11px] font-semibold text-gray-500">
                  No setlists available.
                </p>
              )}
            </div>

            <div className="relative mt-2 grid grid-cols-[1fr,auto] gap-2">
              <div className="relative min-w-0">
                <input
                  type="email"
                  value={destinationEmail}
                  onChange={(event) => {
                    setDestinationEmail(event.target.value.toLowerCase());
                    setShareStatus("");
                    setShareError("");
                  }}
                  className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-[goldenrod]"
                  placeholder="friend@email.com"
                />
                {destinationEmail && friendSuggestions.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {friendSuggestions.map((friend) => (
                      <button
                        key={friend.counterpartEmail}
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100"
                        onClick={() => {
                          setDestinationEmail(
                            String(friend.counterpartEmail || "").toLowerCase(),
                          );
                          setShareStatus("");
                          setShareError("");
                        }}
                      >
                        <span className="font-black text-gray-800">
                          {friend.counterpartEmail}
                        </span>
                        {friend.counterpartFullName ||
                        friend.counterpartUsername ? (
                          <span className="ml-2 font-semibold text-gray-500">
                            {friend.counterpartFullName ||
                              `@${friend.counterpartUsername}`}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!canSend}
                onClick={handleShareSetlists}
                className={`flex min-w-11 items-center justify-center rounded-lg px-3 text-sm font-black transition-transform ${
                  canSend
                    ? "bg-[goldenrod] text-black active:scale-95"
                    : "cursor-not-allowed bg-gray-400 text-white"
                }`}
                aria-label="Send setlist"
              >
                {sharing ? "..." : <FiSend />}
              </button>
            </div>

            {shareStatus ? (
              <p className="mt-2 text-[11px] font-semibold text-green-700">
                {shareStatus}
              </p>
            ) : null}
            {shareError ? (
              <p className="mt-2 text-[11px] font-semibold text-red-600">
                {shareError}
              </p>
            ) : null}

            <p className="mt-3 text-[11px] font-black uppercase text-gray-600">
              Imported
            </p>
            <div className="mt-1 min-h-8 rounded-lg border border-black/5 bg-white/50 p-2">
              {importedSetlists.length ? (
                <div className="flex flex-wrap gap-2">
                  {importedSetlists.map((setlist) => (
                    <span
                      key={setlist}
                      className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold text-gray-700"
                    >
                      {setlist}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-gray-500">
                  No imported setlists yet.
                </p>
              )}
            </div>
          </div>
        )}
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
