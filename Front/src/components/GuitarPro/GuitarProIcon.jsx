/* eslint-disable react/prop-types */
import { FaFileCode } from "react-icons/fa6";

function GuitarProIcon({
  active = false,
  compact = false,
  title = "Guitar Pro file",
}) {
  if (compact) {
    return (
      <span
        title={title}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border text-[0.48rem] font-black uppercase leading-none ${
          active
            ? "border-black bg-transparent text-black"
            : "border-gray-300 bg-white/50 text-gray-400"
        }`}
      >
        GP
      </span>
    );
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-[10px] border px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
        active
          ? "border-[goldenrod] bg-[goldenrod]/15 text-[goldenrod]"
          : "border-gray-300 bg-white/60 text-gray-400"
      }`}
    >
      <FaFileCode className="mr-1 text-[11px]" />
      GP
    </span>
  );
}

export default GuitarProIcon;
