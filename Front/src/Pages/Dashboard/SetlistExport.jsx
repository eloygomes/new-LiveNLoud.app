/* eslint-disable react/prop-types */

function SetlistExport({
  handleExportText,
  visibleSongs,
  FiFileText,
  handleExportJson,
  VscJson,
}) {
  return (
    <section className="neuphormism-b p-4">
      <div>
        <h1 className="text-sm font-bold uppercase">Export</h1>
        <p className="mt-1 text-[11px] font-semibold text-gray-500">
          Download the visible songs as TXT or JSON.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleExportText}
          disabled={!visibleSongs.length}
          className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition-transform ${
            visibleSongs.length
              ? "hover:bg-[goldenrod] hover:text-black active:scale-95"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          <FiFileText /> TXT
        </button>
        <button
          type="button"
          onClick={handleExportJson}
          disabled={!visibleSongs.length}
          className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition-transform ${
            visibleSongs.length
              ? "hover:bg-[goldenrod] hover:text-black active:scale-95"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          <VscJson /> JSON
        </button>
      </div>
    </section>
  );
}

export default SetlistExport;
