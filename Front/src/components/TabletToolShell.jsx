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
}) {
  return (
    <div
      className="tablet-tool-detail-viewport overflow-hidden bg-[#f0f0f0] p-5"
      data-testid="tablet-tool-shell"
    >
      <div className="flex h-full min-h-0 w-full flex-col gap-5">
        <header className="neuphormism-b relative grid min-h-[11rem] shrink-0 cursor-default grid-cols-[minmax(0,1fr)_19rem] overflow-hidden rounded-[24px]">
          <div className="relative z-10 flex min-w-0 flex-col justify-center px-7 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
              {eyebrow}
            </p>
            <h1 className="mt-2 max-w-[42rem] text-[1.8rem] font-bold leading-[1.05] tracking-[-0.035em] text-black">
              {title}
            </h1>
            <p className="mt-2 max-w-[44rem] text-[0.9rem] font-semibold leading-[1.35rem] text-gray-600">
              {description}
            </p>
            {badges.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-black/[0.045] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-gray-600"
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
