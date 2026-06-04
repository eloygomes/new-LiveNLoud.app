/* eslint-disable react/prop-types */
function GeralProgressBar({ geralPercentage, compact = false }) {
  return (
    <div
      className={`neuphormism-b ${
        compact
          ? "my-2 mr-0 rounded-[20px] px-5 py-3"
          : "my-5 mr-5 rounded-[30px] px-6 py-6"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className={`font-bold uppercase tracking-[0.24em] text-[goldenrod] ${
              compact ? "pb-2 text-[10px]" : "pb-5 text-[11px]"
            }`}
          >
            Progress
          </p>

          <p
            className={`mt-1 font-medium text-gray-500 ${
              compact ? "text-xs leading-5" : "text-sm"
            }`}
          >
            Overall completion based on instrument links.
          </p>
        </div>
        <h1
          className={`rounded-full font-bold text-black ${
            compact ? "px-2 py-1 text-3xl" : "px-4 py-2 text-2xl"
          }`}
        >
          {geralPercentage}%
        </h1>
      </div>
      <div className={`relative w-full ${compact ? "mt-3" : "mt-6"}`}>
        <div
          className={`overflow-hidden rounded-full neuphormism-b-se ${
            compact ? "h-2.5" : "h-4"
          }`}
        >
          <div
            style={{ width: `${geralPercentage}%` }}
            className="h-full rounded-full bg-[linear-gradient(90deg,#d4a017_0%,#f2cf66_100%)]"
          />
        </div>
      </div>
    </div>
  );
}

export default GeralProgressBar;
