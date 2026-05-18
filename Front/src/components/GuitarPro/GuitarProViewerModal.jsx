/* eslint-disable react/prop-types */
import { lazy, Suspense } from "react";
import { IoClose } from "react-icons/io5";

const GuitarProViewer = lazy(() => import("./GuitarProViewer"));

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
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-[#f0f0f0] text-sm font-bold text-gray-500">
              Carregando visualizador Guitar Pro...
            </div>
          }
        >
          <GuitarProViewer
            file={file}
            fileUrl={file.url}
            fileName={file.originalName}
            songTitle={songTitle}
            artistName={artistName}
            instrumentName={instrumentName}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default GuitarProViewerModal;
