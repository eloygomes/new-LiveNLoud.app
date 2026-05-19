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

  const handleView = () => {
    const selectedFile = guitarProFiles[0];
    if (!selectedFile) {
      notify("Error", "Nenhum arquivo Guitar Pro cadastrado.");
      return;
    }
    if (selectedFile.url) {
      window.open(selectedFile.url, "_blank", "noopener,noreferrer");
      return;
    }
    notify("Info", selectedFile.originalName || "Guitar Pro file registered.");
  };

  return (
    <div className="my-5 rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
            Guitar Pro
          </p>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Add, remove, or open the registered Guitar Pro file.
          </p>
        </div>
        <GuitarProIcon
          active={hasGuitarProFiles}
          title={
            hasGuitarProFiles
              ? `${guitarProFiles.length} Guitar Pro file(s)`
              : "No Guitar Pro files"
          }
        />
      </div>

      <div className="mt-4 rounded-[16px] neuphormism-b-se px-4 py-3">
        <div className="truncate text-sm font-black text-black">
          {hasGuitarProFiles
            ? guitarProFiles[0]?.originalName || "Guitar Pro file"
            : "No file registered"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <label className="neuphormism-b-btn flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] text-sm font-black text-black">
          <FaPlus />
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
          className="neuphormism-b-btn flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-black text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60"
        >
          <FaMinus />
          <span>Remove</span>
        </button>
        <button
          type="button"
          onClick={handleView}
          disabled={!hasGuitarProFiles}
          className="neuphormism-b-btn flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-black text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60"
        >
          <FaRegFileAlt />
          <span>View</span>
        </button>
      </div>
    </div>
  );
}
