/* eslint-disable react/prop-types */

function SetlistExport({
  handleExportText,
  visibleSongs,
  FiFileText,
  handleExportJson,
  VscJson,
}) {
  return (
    <div className="neuphormism-b m-2 p-2">
      <div className="px-2 py-1 flex flex-col">
        <h1 className="text-sm pb-2">Export</h1>
        <p className=" text-[11px] pb-3">
          Use os botões de exportação para baixar a lista de músicas visíveis em
          formato TXT ou JSON.
        </p>
        <div className="flex flex-row">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportText}
              disabled={!visibleSongs.length}
              className={`flex items-center gap-2 px-5 py-5 rounded-md text-sm font-semibold text-[9ca3af] transition-transform ${
                visibleSongs.length
                  ? " border  border-[#9ca3af] hover:bg-[goldenrod] hover:border-[goldenrod] active:scale-95"
                  : "bg-red-400 cursor-not-allowed"
              }`}
            >
              <FiFileText /> TXT
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={!visibleSongs.length}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-[9ca3af] transition-transform ${
                visibleSongs.length
                  ? " border  border-[#9ca3af] hover:bg-[goldenrod] hover:border-[goldenrod] active:scale-95"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <VscJson /> JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetlistExport;
