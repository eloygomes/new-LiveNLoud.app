import CategoryArtwork from "./CategoryArtwork";
import toolCategoryArtwork from "../assets/tool-category-illustrations.jpg";

export default function TabletToolShell({
  eyebrow = "Practice utility",
  title,
  description,
  artIndex,
  artLabel,
  badges = [],
  actions = null,
  children,
  contentClassName = "",
  compactHeader = false,
}) {
  return (
    <div
      className={`tablet-tool-detail-viewport overflow-hidden bg-[#f0f0f0] ${compactHeader ? "p-4" : "p-5"}`}
      data-testid="tablet-tool-shell"
    >
      <div className={`flex h-full min-h-0 w-full flex-col ${compactHeader ? "gap-4" : "gap-5"}`}>
        <header className={`neuphormism-b relative grid shrink-0 cursor-default overflow-hidden rounded-[24px] ${compactHeader ? "min-h-[8.5rem] grid-cols-[minmax(0,1fr)_15rem]" : "min-h-[11rem] grid-cols-[minmax(0,1fr)_19rem]"}`}>
          <div className={`relative z-10 flex min-w-0 flex-col justify-center ${compactHeader ? "px-6 py-4" : "px-7 py-5"}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
              {eyebrow}
            </p>
            <h1 className={`max-w-[42rem] font-bold leading-[1.05] tracking-[-0.035em] text-black ${compactHeader ? "mt-1.5 text-[1.45rem]" : "mt-2 text-[1.8rem]"}`}>
              {title}
            </h1>
            <p className={`max-w-[44rem] font-semibold text-gray-600 ${compactHeader ? "mt-1.5 text-[0.78rem] leading-[1.05rem]" : "mt-2 text-[0.9rem] leading-[1.35rem]"}`}>
              {description}
            </p>
            {badges.length ? (
              <div className={`${compactHeader ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-2`}>
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full bg-black/[0.045] font-bold uppercase tracking-[0.1em] text-gray-600 ${compactHeader ? "px-2.5 py-1 text-[8px]" : "px-3 py-1.5 text-[9px]"}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative min-h-0 overflow-hidden">
            <CategoryArtwork
              src={toolCategoryArtwork}
              index={artIndex}
              label={artLabel || `${title} illustration`}
              className="absolute inset-0"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f0f0f0] via-[#f0f0f0]/35 to-transparent" />
          </div>

          {actions ? (
            <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2">
              {actions}
            </div>
          ) : null}
        </header>

        <section className={`min-h-0 flex-1 ${contentClassName}`}>
          {children}
        </section>
      </div>
    </div>
  );
}
