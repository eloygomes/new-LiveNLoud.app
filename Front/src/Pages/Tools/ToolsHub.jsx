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
    <div className="h-[calc(100vh-11.25rem)] px-3 pt-3 flex items-center justify-center overflow-hidden">
      <div className="flex items-center justify-center h-full w-full overflow-hidden">
        <div className="w-full max-w-[760px] rounded-[30px] bg-[#171717] px-5 pb-8 pt-5 shadow-[0_18px_34px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="text-[2rem] font-black uppercase tracking-tight text-white">
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
    </div>
  );
}
