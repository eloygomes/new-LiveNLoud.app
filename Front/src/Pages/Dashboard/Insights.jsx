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
    <section className="neuphormism-b p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-black uppercase">Insights</h1>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            Current visible song data
          </p>
        </div>
        <div className="rounded-full bg-[goldenrod] px-3 py-1 text-[12px] font-black text-black">
          {totalSongs} visible songs
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <div className="neuphormism-b rounded-lg p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Progress ratio
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {averageProgress}%
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#DAA520] transition-all duration-300"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        <div className="neuphormism-b rounded-lg p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Ready songs
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {readySongs}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            At 100% progression
          </p>
        </div>

        <div className="neuphormism-b rounded-lg p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Not started
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {emptyProgressSongs}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            Songs at 0%
          </p>
        </div>

        <div className="neuphormism-b rounded-lg p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
            Main instrument
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {topInstrument?.label || "-"}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            {topInstrument?.count || 0} visible songs
          </p>
        </div>
      </div>

      <div className="mt-2 neuphormism-b rounded-lg p-2">
        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
          Songs by instrument
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {instrumentCounts.map((instrument) => (
            <div
              key={instrument.key}
              className="input-neumorfismo flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] font-black text-gray-800"
            >
              {instrument.label}: {instrument.count}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Insights;
