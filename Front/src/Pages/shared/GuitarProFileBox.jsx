/* eslint-disable react/prop-types */
import { FaMinus, FaPlus, FaRegFileAlt } from "react-icons/fa";
import GuitarProIcon from "../../components/GuitarPro/GuitarProIcon";
import { GUITAR_PRO_ACCEPT } from "../../constants/guitarPro";
import {
  getGuitarProFiles,
  isValidGuitarProFile,
} from "../../utils/guitarPro/validateGuitarProFile";
import {
  deleteGuitarProFile,
  uploadGuitarProFile,
} from "../../Tools/Controllers";

export default function GuitarProFileBox({
  artistName,
  songName,
  songData,
  onSongDataChange,
  setShowSnackBar,
  setSnackbarMessage,
  setIsDirty,
  compact = false,
}) {
  const guitarProFiles = getGuitarProFiles(songData);
  const hasGuitarProFiles = guitarProFiles.length > 0;

  const notify = (title, message) => {
    setShowSnackBar?.(true);
    setSnackbarMessage?.({ title, message });
  };

  const updateFiles = (nextFiles) => {
    onSongDataChange?.({
      ...(songData || {}),
      guitarProFiles: Array.isArray(nextFiles) ? nextFiles : [],
    });
    setIsDirty?.(true);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isValidGuitarProFile(file)) {
      notify("Error", "Formato de arquivo não suportado.");
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    const artist = (artistName || localStorage.getItem("artist") || "").trim();
    const song = (songName || localStorage.getItem("song") || "").trim();

    if (!email || !artist || !song) {
      notify("Error", "Defina artista e música antes de enviar o arquivo.");
      return;
    }

    try {
      const response = await uploadGuitarProFile({ email, artist, song, file });
      updateFiles(response?.guitarProFiles || []);
      notify("Success", "Arquivo Guitar Pro enviado com sucesso!");
    } catch (error) {
      console.error("Guitar Pro upload failed:", error);
      notify("Error", "Não foi possível enviar o arquivo Guitar Pro.");
    }
  };

  const handleDelete = async () => {
    if (!guitarProFiles.length) {
      notify("Error", "Nenhum arquivo Guitar Pro para remover.");
      return;
    }

    const selectedFile = guitarProFiles[0];
    if (!window.confirm(`Delete this Guitar Pro file?\n${selectedFile.originalName}`)) {
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    const artist = (artistName || localStorage.getItem("artist") || "").trim();
    const song = (songName || localStorage.getItem("song") || "").trim();

    try {
      const response = await deleteGuitarProFile({
        email,
        artist,
        song,
        fileId: selectedFile.id,
      });
      updateFiles(response?.guitarProFiles || []);
      notify("Success", "Arquivo Guitar Pro removido com sucesso!");
    } catch (error) {
      console.error("Guitar Pro delete failed:", error);
      notify("Error", "Não foi possível remover o arquivo.");
    }
  };

  return (
    <div
      className={
        compact
          ? "my-0 rounded-[18px] border border-black/5 bg-white/60 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          : "my-5 rounded-[30px] neuphormism-b px-6 py-6"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`${compact ? "text-[10px] tracking-[0.22em]" : "text-[11px] tracking-[0.24em]"} font-bold uppercase text-[goldenrod]`}>
            Guitar Pro
          </p>
          {compact ? null : (
            <p className="mt-1 text-sm font-medium text-gray-500">
              Add, remove, or open the registered Guitar Pro file.
            </p>
          )}
        </div>
        <div className={compact ? "flex items-center gap-2 rounded-full bg-black/[0.035] px-2.5 py-1.5" : ""}>
          <GuitarProIcon
            active={hasGuitarProFiles}
            compact={compact}
            title={
              hasGuitarProFiles
                ? `${guitarProFiles.length} Guitar Pro file(s)`
                : "No Guitar Pro files"
            }
          />
          {compact ? (
            <span className="text-[9px] font-black uppercase tracking-[0.08em] text-gray-500">
              {guitarProFiles.length} {guitarProFiles.length === 1 ? "file" : "files"}
            </span>
          ) : null}
        </div>
      </div>

      <div className={compact ? "mt-3 flex items-center gap-2.5 rounded-[13px] border border-black/5 bg-white/75 p-2.5 shadow-[0_5px_14px_rgba(0,0,0,0.04)]" : "mt-4 rounded-[16px] neuphormism-b-se px-4 py-3"}>
        {compact ? (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[12px] ${hasGuitarProFiles ? "bg-[goldenrod]/15 text-[goldenrod]" : "bg-black/[0.035] text-gray-400"}`}>
            <FaRegFileAlt aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className={`${compact ? "text-[12px] font-black" : "text-sm font-bold"} truncate text-black`}>
            {hasGuitarProFiles
              ? guitarProFiles[0]?.originalName || "Guitar Pro file"
              : "No file registered"}
          </div>
          {compact ? (
            <div className="mt-0.5 truncate text-[9px] font-semibold text-gray-500">
              {hasGuitarProFiles
                ? "Ready to open"
                : "Supported: GP3, GP4, GP5, GPX and GP"}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${compact ? "mt-2.5 gap-2" : "mt-4 gap-3"} grid grid-cols-2`}>
        <label className={`${compact ? "h-10 rounded-[11px] bg-[goldenrod]/15 text-[11px] shadow-[0_4px_12px_rgba(218,165,32,0.12)]" : "h-11 rounded-[14px] text-sm neuphormism-b-btn"} flex cursor-pointer items-center justify-center gap-1.5 font-bold text-black`}>
          <FaPlus className={compact ? "text-[10px]" : ""} />
          <span>Add</span>
          <input
            type="file"
            accept={GUITAR_PRO_ACCEPT}
            className="hidden"
            onChange={handleUpload}
          />
        </label>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!hasGuitarProFiles}
          className={`${compact ? "h-10 gap-1.5 rounded-[11px] border border-black/5 bg-white/70 text-[11px] shadow-[0_4px_12px_rgba(0,0,0,0.04)]" : "h-11 gap-2 rounded-[14px] text-sm neuphormism-b-btn"} flex items-center justify-center font-bold text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-50`}
        >
          <FaMinus className={compact ? "text-[10px]" : ""} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
}
