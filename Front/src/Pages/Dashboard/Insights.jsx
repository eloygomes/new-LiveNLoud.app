/* eslint-disable react/prop-types */
function Insights({ dashboardMetrics }) {
  const {
    averageProgress = 0,
    totalSongs = 0,
    instrumentCounts = [],
    readySongs = 0,
    emptyProgressSongs = 0,
    topInstrument = null,
  } = dashboardMetrics || {};

  return (
    <section className="neuphormism-b p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-black uppercase">Insights</h1>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            Current visible song data
          </p>
        </div>
        <div className="rounded-full bg-[goldenrod] px-3 py-1 text-[12px] font-black text-black">
          {totalSongs}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <div className="neuphormism-b rounded-lg p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Progress ratio
          </p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {averageProgress}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#DAA520] transition-all duration-300"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        <div className="neuphormism-b rounded-lg p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Ready songs
          </p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {readySongs}
          </p>
          <p className="mt-3 text-[11px] font-semibold text-gray-500">
            At 100% progression
          </p>
        </div>

        <div className="neuphormism-b rounded-lg p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Not started
          </p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {emptyProgressSongs}
          </p>
          <p className="mt-3 text-[11px] font-semibold text-gray-500">
            Songs at 0%
          </p>
        </div>

        <div className="neuphormism-b rounded-lg p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Main instrument
          </p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {topInstrument?.label || "-"}
          </p>
          <p className="mt-3 text-[11px] font-semibold text-gray-500">
            {topInstrument?.count || 0} visible songs
          </p>
        </div>
      </div>

      <div className="mt-3 neuphormism-b rounded-lg p-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
          Songs by instrument
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          {instrumentCounts.map((instrument) => (
            <div
              key={instrument.key}
              className="input-neumorfismo flex flex-col items-center justify-center rounded-lg py-2"
            >
              <span className="text-xs font-black">{instrument.label}</span>
              <span className="text-base font-black text-gray-900">
                {instrument.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Insights;
