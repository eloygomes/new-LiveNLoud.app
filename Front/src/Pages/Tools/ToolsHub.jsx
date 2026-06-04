import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaGuitar,
  FaMicrochip,
  FaWaveSquare,
} from "react-icons/fa";

const TOOL_LINKS = [
  {
    to: "/chordlibrary",
    label: "Chord Library",
    detail:
      "Browse chord shapes and variations before opening a song. Useful for checking finger positions and comparing alternate voicings.",
    icon: FaGuitar,
    accent: "bg-[goldenrod]",
  },
  {
    to: "/tuner",
    label: "Tuner",
    detail:
      "Use the microphone tuner to tune quickly before rehearsal, practice, or live mode. Works best in a quiet room.",
    icon: FaWaveSquare,
    accent: "bg-black",
  },
  {
    to: "/metronome",
    label: "Metronome",
    detail:
      "Set tempo, tap BPM, and practice with a steady click. Built for repeated practice without leaving the app.",
    icon: FaMicrochip,
    accent: "bg-[#6b7280]",
  },
  {
    to: "/calendar",
    label: "Calendar",
    detail:
      "Keep rehearsals, shows, reminders, and shared music commitments organized in one mobile-friendly view.",
    icon: FaCalendarAlt,
    accent: "bg-[#d9ad26]",
  },
];

export default function ToolsHub() {
  const navigate = useNavigate();
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;

  if (!isTouchLayout) {
    navigate("/chordlibrary", { replace: true });
    return null;
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] overflow-hidden bg-[#f0f0f0] px-3 pb-24 pt-3">
      <div className="mx-auto flex h-full w-full max-w-[760px] flex-col justify-center">
        <section className="flex flex-col justify-center gap-5">
          {TOOL_LINKS.map(({ to, label, detail, icon: Icon, accent }) => (
            <button
              key={to}
              type="button"
              className="neuphormism-b-btn relative flex min-h-[132px] items-center gap-4 overflow-hidden rounded-[26px] px-4 py-4 text-left text-black active:scale-[0.98]"
              onClick={() => navigate(to)}
            >
              <div className={`absolute left-0 top-0 h-full w-1.5 ${accent}`} />
              <div className="neuphormism-b-avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-black">
                <Icon className="text-[1.35rem]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[1.05rem] font-bold leading-tight">
                    {label}
                  </div>
                  <div className="neuphormism-b-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] text-gray-600">
                    <FaChevronRight className="text-[0.8rem]" />
                  </div>
                </div>
                <div className="mt-2 text-[0.82rem] font-semibold leading-[1.1rem] text-gray-600">
                  {detail}
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
