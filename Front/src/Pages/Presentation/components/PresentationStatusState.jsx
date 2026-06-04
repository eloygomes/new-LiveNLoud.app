function PresentationStatusState({
  mode,
  effectiveLiveMode,
  songFromURL,
  artistFromURL,
  instrumentSelected,
  availableInstrumentOptions,
  onSelectInstrument,
}) {
  const isLoading = mode === "loading";
  const isUnavailable = mode === "unavailable";

  if (!isLoading && !isUnavailable) return null;

  if (isLoading) {
    return (
      <div
        className={`flex min-h-[18rem] flex-col items-center justify-center px-4 text-center ${
          effectiveLiveMode ? "text-white" : "text-black"
        }`}
      >
        <div
          className={`text-xs font-bold uppercase tracking-[0.18em] ${
            effectiveLiveMode ? "text-[goldenrod]" : "text-[#a27b13]"
          }`}
        >
          Loading song
        </div>
        <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
          {songFromURL || "Loading..."}
        </h2>
        <p
          className={`mt-2 text-sm font-bold ${
            effectiveLiveMode ? "text-white/70" : "text-black/60"
          }`}
        >
          {artistFromURL || "Preparing presentation"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[18rem] flex-col items-center justify-center px-4 text-center ${
        effectiveLiveMode ? "text-white" : "text-black"
      }`}
    >
      <div className="max-w-xl">
        <div
          className={`text-xs font-bold uppercase tracking-[0.18em] ${
            effectiveLiveMode ? "text-[goldenrod]" : "text-[#a27b13]"
          }`}
        >
          Instrumento indisponível
        </div>
        <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
          Esta música ainda não tem cifra para {instrumentSelected}.
        </h2>
        <p
          className={`mt-3 text-sm font-bold sm:text-base ${
            effectiveLiveMode ? "text-white/70" : "text-black/60"
          }`}
        >
          Abra um dos instrumentos cadastrados com cifra para esta música.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {availableInstrumentOptions.length ? (
            availableInstrumentOptions.map((instrument) => (
              <button
                key={instrument.key}
                type="button"
                className="neuphormism-b-btn-gold px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-black"
                onClick={() => onSelectInstrument(instrument.key)}
              >
                {instrument.label}
              </button>
            ))
          ) : (
            <div
              className={`text-sm font-bold ${
                effectiveLiveMode ? "text-white/60" : "text-black/50"
              }`}
            >
              Nenhum instrumento cadastrado com cifra foi encontrado para esta
              música.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PresentationStatusState;
