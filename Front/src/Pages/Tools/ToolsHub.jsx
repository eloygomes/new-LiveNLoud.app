import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaGuitar,
  FaMicrochip,
  FaWaveSquare,
  FaDrum,
} from "react-icons/fa";

const TOOL_LINKS = [
  {
    to: "/drum-machine",
    label: "Drum Machine",
    detail: "Build four-bar grooves with nine synthesized voices, swing, accents, mute and solo — even offline.",
    mobileDetail: "Build grooves, adjust swing, and practice offline.",
    icon: FaDrum,
    accent: "bg-[#c89222]",
  },
  {
    to: "/chordlibrary",
    label: "Chord Library",
    detail:
      "Browse chord shapes and variations before opening a song. Useful for checking finger positions and comparing alternate voicings.",
    mobileDetail: "Browse chord shapes, fingerings, and variations.",
    icon: FaGuitar,
    accent: "bg-[goldenrod]",
  },
  {
    to: "/tuner",
    label: "Tuner",
    detail:
      "Use the microphone tuner to tune quickly before rehearsal, practice, or live mode. Works best in a quiet room.",
    mobileDetail: "Tune quickly with your device microphone.",
    icon: FaWaveSquare,
    accent: "bg-black",
  },
  {
    to: "/metronome",
    label: "Metronome",
    detail:
      "Set tempo, tap BPM, and practice with a steady click. Built for repeated practice without leaving the app.",
    mobileDetail: "Set the tempo, tap BPM, and keep a steady click.",
    icon: FaMicrochip,
    accent: "bg-[#6b7280]",
  },
  {
    to: "/calendar",
    label: "Calendar",
    detail:
      "Keep rehearsals, shows, reminders, and shared music commitments organized in one mobile-friendly view.",
    mobileDetail: "Organize rehearsals, shows, and reminders.",
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
    <div className="h-[calc(100dvh-11.25rem)] overflow-y-auto overflow-x-hidden bg-[#f0f0f0] px-4 pb-4 pt-2 overscroll-contain">
      <div className="mx-auto h-full w-full max-w-[480px]">
        <section
          className="grid h-full grid-rows-[repeat(5,minmax(82px,1fr))] gap-3"
          aria-label="Practice tools"
        >
          {TOOL_LINKS.map(
            ({ to, label, mobileDetail, icon: Icon, accent }) => (
            <button
              key={to}
              type="button"
              className="relative flex min-h-[82px] w-full items-center gap-3 overflow-hidden rounded-[16px] border border-black/5 bg-white/70 px-3 py-3 text-left text-black shadow-[0_6px_16px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
              onClick={() => navigate(to)}
              aria-label={`Open ${label}`}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[goldenrod]/15 text-black">
                <Icon className="text-[1rem]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.88rem] font-black leading-tight">
                  {label}
                </div>
                <div className="mt-1 text-[0.72rem] font-semibold leading-[0.95rem] text-gray-500">
                  {mobileDetail}
                </div>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-black/[0.035] text-gray-500">
                <FaChevronRight className="text-[0.72rem]" />
              </div>
            </button>
            ),
          )}
        </section>
      </div>
    </div>
  );
}
