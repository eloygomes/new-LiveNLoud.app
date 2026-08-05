export default function CategoryArtwork({
  src,
  index = 0,
  label,
  className = "",
}) {
  const safeIndex = Math.min(4, Math.max(0, Number(index) || 0));

  return (
    <div
      className={`overflow-hidden bg-[#f4efe5] ${className}`}
      role="img"
      aria-label={label}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 w-[500%] max-w-none select-none"
        style={{
          transform: `translateX(-${safeIndex * 20}%) translateY(-50%)`,
        }}
      />
    </div>
  );
}
