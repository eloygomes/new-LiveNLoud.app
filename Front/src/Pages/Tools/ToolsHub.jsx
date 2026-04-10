import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaGuitar,
  FaMicrochip,
  FaWaveSquare,
} from "react-icons/fa";

const TOOL_LINKS = [
  { to: "/chordlibrary", label: "Chord Library", icon: FaGuitar },
  { to: "/tuner", label: "Tuner", icon: FaWaveSquare },
  { to: "/metronome", label: "Metronome", icon: FaMicrochip },
  { to: "/calendar", label: "Calendar", icon: FaCalendarAlt },
];

export default function ToolsHub() {
  const navigate = useNavigate();
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;

  if (!isTouchLayout) {
    navigate("/chordlibrary", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-3">
      <div className="rounded-[24px] bg-[#e0e0e0] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
        <div className="text-[1.9rem] font-black tracking-tight text-black">
          TOOLS
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-500">
          Open a music tool or jump into your calendar.
        </div>
      </div>

      <div className="mt-5 rounded-t-[30px] bg-[#171717] px-5 pb-8 pt-3 shadow-[0_-12px_24px_rgba(0,0,0,0.18)]">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-[#cfcfcf]" />
        <div className="mt-5 text-[2rem] font-black uppercase text-white">
          TOOLS
        </div>
        <div className="mt-2 text-sm leading-5 text-gray-400">
          Choose a music tool or open your calendar.
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {TOOL_LINKS.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              type="button"
              className="flex min-h-[62px] items-center gap-3 rounded-[18px] bg-black px-4 py-3 text-left shadow-[0_10px_20px_rgba(0,0,0,0.18)]"
              onClick={() => navigate(to)}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[14px] bg-[goldenrod] text-[#111]">
                <Icon className="text-[18px]" />
              </div>
              <div className="flex-1 text-[15px] font-extrabold text-white">
                {label}
              </div>
              <FaChevronRight className="text-[16px] text-[#777]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
