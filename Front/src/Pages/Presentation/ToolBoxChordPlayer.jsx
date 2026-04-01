/* eslint-disable react/prop-types */
import CloseIcon from "@mui/icons-material/Close";
import ChordDisplay from "../ChordLibrary/ChordDisplay";

export default function ToolBoxChordPlayer({
  chordPreviewData,
  setChordModalStatus,
  setChordPreviewData,
}) {
  const handleClose = () => {
    setChordModalStatus(false);
    setChordPreviewData(null);
  };

  if (!chordPreviewData) return null;

  const { chordName, chordType, fingering } = chordPreviewData;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
      <div className="drag-handle flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-bold cursor-move select-none">
        <span>Chord</span>
        <button
          type="button"
          className="cursor-pointer"
          aria-label="Close chord window"
          onClick={handleClose}
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 bg-[#f7f7f7] p-5">
        <div className="text-center text-xl font-bold">
          {`${chordName} ${chordType}`.trim()}
        </div>
        <div className="rounded-xl bg-white p-4">
          <ChordDisplay
            fingering={fingering}
            chordName={`${chordName} ${chordType}`.trim()}
          />
        </div>
      </div>
      <div className="drag-handle bg-gray-500 px-3 py-1 text-center text-[8px] font-bold text-white cursor-move select-none">
        Click and hold to drag
      </div>
    </div>
  );
}
