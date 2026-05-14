/* eslint-disable react/prop-types */
import { FaFileCode } from "react-icons/fa6";

function GuitarProIcon({ active = false, title = "Guitar Pro file" }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-[10px] border px-1.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
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
