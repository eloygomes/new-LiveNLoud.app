/* eslint-disable react/prop-types */

function SetlistExport({
  handleExportText,
  visibleSongs,
  FiFileText,
  handleExportJson,
  VscJson,
  isMobileLayout = false,
}) {
  return (
    <section className={isMobileLayout ? "rounded-[18px] border border-black/5 bg-white/55 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)]" : "neuphormism-b p-4"}>
      <div className={isMobileLayout ? "text-center" : ""}>
        <h1 className={`${isMobileLayout ? "text-xs text-center" : "text-sm"} font-bold uppercase`}>Export</h1>
        <p className="mt-1 text-[11px] font-semibold text-gray-500">
          Download the visible songs as TXT or JSON.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleExportText}
          disabled={!visibleSongs.length}
          className={`${isMobileLayout ? "min-h-24 flex-col rounded-[14px] border border-black/5 bg-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.05)]" : "neuphormism-b-btn rounded-lg"} flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold transition-transform ${
            visibleSongs.length
              ? "hover:bg-[goldenrod] hover:text-black active:scale-95"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          <FiFileText className={isMobileLayout ? "text-2xl text-[goldenrod]" : ""} /> TXT
        </button>
        <button
          type="button"
          onClick={handleExportJson}
          disabled={!visibleSongs.length}
          className={`${isMobileLayout ? "min-h-24 flex-col rounded-[14px] border border-black/5 bg-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.05)]" : "neuphormism-b-btn rounded-lg"} flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold transition-transform ${
            visibleSongs.length
              ? "hover:bg-[goldenrod] hover:text-black active:scale-95"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          <VscJson className={isMobileLayout ? "text-2xl text-[goldenrod]" : ""} /> JSON
        </button>
      </div>
    </section>
  );
}

export default SetlistExport;
