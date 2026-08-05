import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaGuitar,
  FaMicrochip,
  FaWaveSquare,
  FaDrum,
} from "react-icons/fa";
import { useCompactAppLayout } from "../../Tools/responsiveLayout";
import CategoryArtwork from "../../components/CategoryArtwork";
import toolCategoryArtwork from "../../assets/tool-category-illustrations.jpg";

const TOOL_LINKS = [
  {
    to: "/drum-machine",
    label: "Drum Machine",
    detail: "Build four-bar grooves with nine synthesized voices, swing, accents, mute and solo — even offline.",
    mobileDetail: "Build grooves, adjust swing, and practice offline.",
    icon: FaDrum,
    artIndex: 0,
    benefits: ["9 voices", "4-bar loops", "Works offline"],
  },
  {
    to: "/chordlibrary",
    label: "Chord Library",
    detail:
      "Browse chord shapes and variations before opening a song. Useful for checking finger positions and comparing alternate voicings.",
    mobileDetail: "Browse chord shapes, fingerings, and variations.",
    icon: FaGuitar,
    artIndex: 1,
    benefits: ["Fingerings", "Variations", "Quick reference"],
  },
  {
    to: "/tuner",
    label: "Tuner",
    detail:
      "Use the microphone tuner to tune quickly before rehearsal, practice, or live mode. Works best in a quiet room.",
    mobileDetail: "Tune quickly with your device microphone.",
    icon: FaWaveSquare,
    artIndex: 2,
    benefits: ["Mic input", "Live feedback", "Fast setup"],
  },
  {
    to: "/metronome",
    label: "Metronome",
    detail:
      "Set tempo, tap BPM, and practice with a steady click. Built for repeated practice without leaving the app.",
    mobileDetail: "Set the tempo, tap BPM, and keep a steady click.",
    icon: FaMicrochip,
    artIndex: 3,
    benefits: ["Tap tempo", "BPM control", "Steady pulse"],
  },
  {
    to: "/calendar",
    label: "Calendar",
    detail:
      "Keep rehearsals, shows, reminders, and shared music commitments organized in one mobile-friendly view.",
    mobileDetail: "Organize rehearsals, shows, and reminders.",
    icon: FaCalendarAlt,
    artIndex: 4,
    benefits: ["Rehearsals", "Shows", "Reminders"],
  },
];

export default function ToolsHub() {
  const navigate = useNavigate();
  const isTouchLayout = useCompactAppLayout();
  const isTabletLayout =
    isTouchLayout && typeof window !== "undefined" && window.innerWidth >= 768;

  if (!isTouchLayout) {
    navigate("/chordlibrary", { replace: true });
    return null;
  }

  if (isTabletLayout) {
    return (
      <div className="tools-hub-viewport overflow-y-auto overflow-x-hidden bg-[#f0f0f0] px-5 py-5 overscroll-contain">
        <div className="flex min-h-full w-full min-w-0 flex-col gap-5">
          <section className="neuphormism-b grid shrink-0 cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-[24px] px-7 py-5">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
                Your practice workspace
              </div>
              <h2 className="mt-2 text-[1.75rem] font-bold leading-tight text-black">
                Everything you need to prepare, play and improve.
              </h2>
              <p className="mt-2 max-w-[52rem] text-[0.95rem] font-semibold leading-[1.45rem] text-gray-600">
                Start a groove, check a chord, tune your instrument, lock in the
                tempo or organize the next rehearsal without leaving your music
                workspace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2" aria-label="Tools overview">
              {[
                ["5", "Utilities"],
                ["1", "Workspace"],
                ["24/7", "Ready"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="min-w-[6.4rem] rounded-[16px] bg-white/60 px-4 py-3 text-center"
                >
                  <div className="text-[1.15rem] font-bold leading-none text-black">
                    {value}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className="grid min-h-[50rem] flex-1 grid-cols-2 gap-4"
            aria-label="Practice tools"
            style={{ gridTemplateRows: "repeat(3, minmax(16rem, 1fr))" }}
          >
            {TOOL_LINKS.map((tool, index) => {
              const Icon = tool.icon;
              const isFeatured = index === 0;

              return (
                <button
                  key={tool.to}
                  type="button"
                  className={`group relative min-h-0 overflow-hidden rounded-[24px] border border-black/[0.055] bg-white/75 text-left text-black shadow-[0_12px_30px_rgba(0,0,0,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(0,0,0,0.1)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod] ${
                    isFeatured ? "row-span-2" : ""
                  }`}
                  onClick={() => navigate(tool.to)}
                  aria-label={`Open ${tool.label}`}
                >
                  <CategoryArtwork
                    src={toolCategoryArtwork}
                    index={tool.artIndex}
                    label={`${tool.label} illustration`}
                    className={`absolute inset-y-0 right-0 rounded-r-[24px] ${
                      isFeatured ? "w-[46%]" : "w-[35%]"
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%] bg-gradient-to-r from-white via-white/70 to-transparent" />

                  <div
                    className={`relative z-10 flex h-full flex-col ${
                      isFeatured ? "w-[62%] p-7" : "w-[72%] p-5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-[14px] bg-[goldenrod]/15 ${
                          isFeatured ? "h-12 w-12" : "h-10 w-10"
                        }`}
                      >
                        <Icon className={isFeatured ? "text-[1.15rem]" : "text-[0.95rem]"} />
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[goldenrod]">
                        {isFeatured ? "Create & play" : "Practice utility"}
                      </div>
                    </div>

                    <h3
                      className={`font-bold leading-tight ${
                        isFeatured ? "mt-5 text-[1.7rem]" : "mt-3 text-[1.2rem]"
                      }`}
                    >
                      {tool.label}
                    </h3>
                    <p
                      className={`mt-2 font-semibold text-gray-600 ${
                        isFeatured
                          ? "text-[0.88rem] leading-[1.35rem]"
                          : "line-clamp-3 text-[0.85rem] leading-[1.2rem]"
                      }`}
                    >
                      {tool.detail}
                    </p>

                    <div className={`flex flex-wrap gap-2 ${isFeatured ? "mt-5" : "mt-3"}`}>
                      {tool.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="rounded-full bg-black/[0.045] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black">
                      Open {tool.label}
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[goldenrod] transition-transform group-hover:translate-x-1">
                        <FaChevronRight className="text-[0.7rem]" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-11.25rem)] overflow-y-auto overflow-x-hidden bg-[#f0f0f0] px-4 pb-4 pt-2 overscroll-contain">
      <div className="mx-auto h-full w-full max-w-[480px]">
        <section
          className="grid h-full grid-rows-[repeat(5,minmax(82px,1fr))] gap-3"
          aria-label="Practice tools"
        >
          {TOOL_LINKS.map(({ to, label, mobileDetail, icon: Icon }) => (
            <button
              key={to}
              type="button"
              className="relative flex min-h-[82px] w-full items-center gap-3 overflow-hidden rounded-[16px] border border-black/5 bg-white/70 px-3 py-3 text-left text-black shadow-[0_6px_16px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
              onClick={() => navigate(to)}
              aria-label={`Open ${label}`}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[goldenrod]/15 text-black"
              >
                <Icon className="text-[1rem]" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col self-stretch py-0.5">
                <div className="text-[0.88rem] font-bold leading-tight">
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
          ))}
        </section>
      </div>
    </div>
  );
}
