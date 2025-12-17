/* eslint-disable react/prop-types */
function Insights({ dashboardMetrics }) {
  const {
    averageProgress = 0,
    totalSongs = 0,
    instrumentCounts = [],
  } = dashboardMetrics || {};

  return (
    <div className="neuphormism-b m-2 pb-4">
      <h1 className="px-5 pb-2 text-sm">Insights</h1>
      <div className="px-5">
        <div className="grid gap-3 sm:grid-cols-2 text-[11px]">
          <div className="neuphormism-b rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Progress ratio
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {averageProgress}%
            </p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#DAA520] transition-all duration-300"
                style={{
                  width: `${averageProgress}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-600">
              {totalSongs} song
              {totalSongs === 1 ? "" : "s"} filtradas
            </p>
          </div>

          <div className="neuphormism-b rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Songs by instrument
            </p>
            <div className="grid grid-cols-6 gap-2 mt-3 text-center">
              {instrumentCounts.map((instrument) => (
                <div
                  key={instrument.key}
                  className="rounded-xl border border-gray-200 py-2 flex flex-col items-center justify-center"
                >
                  <span className="text-xs font-semibold">
                    {instrument.label}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {instrument.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Insights;
