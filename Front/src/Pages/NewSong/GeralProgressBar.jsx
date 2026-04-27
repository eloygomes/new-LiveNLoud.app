// eslint-disable-next-line react/prop-types
function GeralProgressBar({ geralPercentage }) {
  return (
    <div className="my-5 mr-5 rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod] pb-5">
            Progress
          </p>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Overall completion based on instrument links.
          </p>
        </div>
        <h1 className="rounded-full px-4 py-2 text-2xl font-black text-black">
          {geralPercentage ? geralPercentage : 0}%
        </h1>
      </div>
      <div className="relative mt-6 w-full">
        <div className="h-4 overflow-hidden rounded-full neuphormism-b-se">
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
