/* eslint-disable react/prop-types */
import {
  FaChartLine,
  FaCheckCircle,
  FaHourglassStart,
  FaMusic,
} from "react-icons/fa";
import {
  GiDrumKit,
  GiGuitar,
  GiGuitarBassHead,
  GiMicrophone,
  GiPianoKeys,
} from "react-icons/gi";

const instrumentIcons = {
  guitar01: GiGuitar,
  guitar02: GiGuitar,
  bass: GiGuitarBassHead,
  keys: GiPianoKeys,
  drums: GiDrumKit,
  voice: GiMicrophone,
};

function InsightIcon({ children }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]  text-black shadow-[0_8px_18px_rgba(218,165,32,0.22)]">
      {children}
    </span>
  );
}

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
    <section className="dashboard-insights neuphormism-b p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold uppercase">Insights</h1>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            Current visible song data
          </p>
        </div>
        <div className="rounded-full bg-[goldenrod] px-3 py-1 text-[12px] font-bold text-black">
          {totalSongs} visible songs
        </div>
      </div>

      <div className="dashboard-insights-summary mt-3 grid gap-2 text-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-insight-card neuphormism-b rounded-lg p-3">
          <div className="flex items-start gap-3">
            <InsightIcon>
              <FaChartLine className="h-4 w-4" />
            </InsightIcon>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Progress ratio
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {averageProgress}%
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#DAA520] transition-all duration-300"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        <div className="dashboard-insight-card neuphormism-b rounded-lg p-3">
          <div className="flex items-start gap-3">
            <InsightIcon>
              <FaCheckCircle className="h-4 w-4" />
            </InsightIcon>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Ready songs
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {readySongs}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-gray-500">
                At 100% progression
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-insight-card neuphormism-b rounded-lg p-3">
          <div className="flex items-start gap-3">
            <InsightIcon>
              <FaHourglassStart className="h-4 w-4" />
            </InsightIcon>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Not started
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {emptyProgressSongs}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-gray-500">
                Songs at 0%
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-insight-card neuphormism-b rounded-lg p-3">
          <div className="flex items-start gap-3">
            <InsightIcon>
              <FaMusic className="h-4 w-4" />
            </InsightIcon>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Main instrument
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {topInstrument?.label || "-"}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-gray-500">
                {topInstrument?.count || 0} visible songs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-instrument-summary mt-2 neuphormism-b rounded-lg p-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
          Songs by instrument
        </p>
        <div className="dashboard-instrument-grid mt-2 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {instrumentCounts.map((instrument) =>
            (() => {
              const Icon = instrumentIcons[instrument.key] || FaMusic;
              return (
                <div
                  key={instrument.key}
                  className="input-neumorfismo flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-bold text-gray-800"
                >
                  <Icon className="h-3.5 w-3.5 text-gray-600" />
                  <span>
                    {instrument.label}: {instrument.count}
                  </span>
                </div>
              );
            })(),
          )}
        </div>
      </div>
    </section>
  );
}

export default Insights;
