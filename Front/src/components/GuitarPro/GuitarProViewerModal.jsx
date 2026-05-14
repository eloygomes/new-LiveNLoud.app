/* eslint-disable react/prop-types */
import { IoClose } from "react-icons/io5";
import GuitarProViewer from "./GuitarProViewer";

function GuitarProViewerModal({
  open,
  onClose,
  file,
  songTitle,
  artistName,
  instrumentName,
}) {
  if (!open || !file) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label="Close Guitar Pro viewer"
      />
      <div className="absolute inset-0 overflow-hidden bg-white">
        <button
          type="button"
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm"
          onClick={onClose}
        >
          <IoClose className="h-6 w-6" />
        </button>
        <GuitarProViewer
          file={file}
          fileUrl={file.url}
          fileName={file.originalName}
          songTitle={songTitle}
          artistName={artistName}
          instrumentName={instrumentName}
        />
      </div>
    </div>
  );
}

export default GuitarProViewerModal;
