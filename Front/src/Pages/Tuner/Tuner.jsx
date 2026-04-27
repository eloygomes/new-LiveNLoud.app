import { useEffect, useMemo, useRef, useState } from "react";
import {
  INSTRUMENT_TUNINGS,
  MAX_UI_FREQ,
  MIN_UI_FREQ,
  NOTE_FREQS,
} from "./TunerData";

/* ------------------------------------------------------------------
   ⚙️ CAPTURA — parâmetros ajustados p/ agudos + menos latência
   ------------------------------------------------------------------ */
const DEFAULT_CFG = {
  RMS_GATE: 0.0012,
  BUFFER_SIZE: 2048,
  MIN_F_GLOBAL: 16.35,
  MAX_F_GLOBAL: 5000,
  LOWCUT_HZ: 20,
  HIGHCUT_HZ: 5000, // não “mata” agudos
};

/* ------------------------------------------------------------------
   🧪 LOGS (enxutos)
   ------------------------------------------------------------------ */
let LOGS_ENABLED = true;
const warn = (...a) => {
  if (LOGS_ENABLED) console.warn("%c[Tuner]", "color:#e67e22", ...a);
};
const info = (...a) => {
  if (LOGS_ENABLED) console.info("%c[Tuner]", "color:#2ecc71", ...a);
};

/* ------------------------------------------------------------------
   🔧 HELPERS
   ------------------------------------------------------------------ */
function getClosestNote(frequency) {
  let closestNote = null;
  let closestFrequency = null;
  let smallestDistance = Infinity;

  Object.entries(NOTE_FREQS).forEach(([note, noteFrequency]) => {
    const distance = Math.abs(1200 * Math.log2(frequency / noteFrequency));
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestNote = note;
      closestFrequency = noteFrequency;
    }
  });

  return {
    note: closestNote,
    frequency: closestFrequency,
    cents: 1200 * Math.log2(frequency / closestFrequency),
  };
}

function getCleanNoteName(note) {
  if (!note) return "—";
  return note.split("/")[0].replace(/[0-9]/g, "");
}

function getClosestString(frequency, strings) {
  if (!Number.isFinite(frequency) || !strings.length) return null;

  return strings.reduce((closest, string, index) => {
    const centsDistance = Math.abs(1200 * Math.log2(frequency / string.freq));
    if (!closest || centsDistance < closest.centsDistance) {
      return { ...string, index, centsDistance };
    }
    return closest;
  }, null);
}

function getTuneMessage(centsValue, hasSignal) {
  if (!hasSignal) return "Waiting for signal";
  if (Math.abs(centsValue) <= 5) return "In Tune";
  return centsValue < 0 ? "Tune Up" : "Tune Down";
}

/* ------------------------------------------------------------------
   🎛️ COMPONENTE
   ------------------------------------------------------------------ */
export default function Tuner() {
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  // Execução
  const [isTuning, setIsTuning] = useState(false);

  // UI
  const [displayNote, setDisplayNote] = useState("");
  const [liveFreq, setLiveFreq] = useState(null);
  const [cents, setCents] = useState(0);
  const [instrumentType, setInstrumentType] = useState("Guitar");
  const [tuningName, setTuningName] = useState("Standard");
  const [autoDetectString, setAutoDetectString] = useState(true);
  const [selectedStringIndex, setSelectedStringIndex] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Refs principais
  const workerRef = useRef(null);
  const mediaRef = useRef({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });
  const sampleRateRef = useRef(44100);
  const configRef = useRef({ ...DEFAULT_CFG });
  const tunerSettingsRef = useRef({
    autoDetectString: true,
    selectedStringIndex: 1,
    strings: INSTRUMENT_TUNINGS.Guitar.Standard,
  });

  // filtros
  const filtersRef = useRef({ hp: null, lp: null });

  // expor toggle de logs no console
  useEffect(() => {
    window.tunerLogs = (on) => {
      LOGS_ENABLED = !!on;
      console.log("[Tuner] logs:", LOGS_ENABLED ? "ON" : "OFF");
    };
    return () => delete window.tunerLogs;
  }, []);

  const instrumentOptions = useMemo(() => Object.keys(INSTRUMENT_TUNINGS), []);
  const tuningOptions = useMemo(
    () => Object.keys(INSTRUMENT_TUNINGS[instrumentType] || {}),
    [instrumentType],
  );
  const currentStrings = useMemo(
    () => INSTRUMENT_TUNINGS[instrumentType]?.[tuningName] || [],
    [instrumentType, tuningName],
  );
  const targetString = currentStrings[selectedStringIndex] || currentStrings[0];

  useEffect(() => {
    const tunings = INSTRUMENT_TUNINGS[instrumentType] || {};
    if (!tunings[tuningName]) {
      setTuningName(Object.keys(tunings)[0] || "Standard");
    }
    setSelectedStringIndex(0);
  }, [instrumentType, tuningName]);

  useEffect(() => {
    tunerSettingsRef.current = {
      autoDetectString,
      selectedStringIndex,
      strings: currentStrings,
    };
  }, [autoDetectString, currentStrings, selectedStringIndex]);

  /* ------------------------ ÁUDIO ------------------------ */
  const startRecording = async () => {
    const { BUFFER_SIZE, LOWCUT_HZ, HIGHCUT_HZ } = configRef.current;

    if (!window.isSecureContext) {
      alert(
        "A captura de áudio no celular precisa de HTTPS. Abra o app em uma URL https:// ou use localhost no próprio dispositivo.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert(
        "Seu navegador não expôs a captura de áudio. Use Safari/Chrome atualizado e acesse o app por HTTPS.",
      );
      return;
    }

    try {
      info("solicitando microfone…");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 44100,
        },
      });

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      sampleRateRef.current = ctx.sampleRate;
      info("AudioContext sampleRate:", sampleRateRef.current);

      const worker = new Worker(new URL("./audio-worker.js", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;
      worker.postMessage({
        type: "INIT",
        data: {
          sampleRate: ctx.sampleRate,
          bufferSize: BUFFER_SIZE,
        },
      });
      worker.onmessage = (event) => {
        if (event.data?.type !== "FREQUENCY_DETECTED") return;

        const frequency = Number(event.data.data);
        if (
          !Number.isFinite(frequency) ||
          frequency < MIN_UI_FREQ ||
          frequency > MAX_UI_FREQ
        ) {
          return;
        }

        const {
          autoDetectString: autoDetect,
          selectedStringIndex: stringIndex,
          strings,
        } = tunerSettingsRef.current;
        const detectedString = autoDetect
          ? getClosestString(frequency, strings)
          : strings[stringIndex];
        const closest = detectedString || getClosestNote(frequency);
        const targetFrequency = closest.freq || closest.frequency;
        const centsFromTarget = 1200 * Math.log2(frequency / targetFrequency);

        if (autoDetect && detectedString) {
          setSelectedStringIndex(detectedString.index);
        }

        setDisplayNote(closest.note || closest.name);
        setLiveFreq(frequency);
        setCents(Math.max(-50, Math.min(50, centsFromTarget)));
      };

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

      // Filtros FIXOS
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = LOWCUT_HZ;
      hp.Q.value = 0.707;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = HIGHCUT_HZ;
      lp.Q.value = 0.707;

      // Encadeia
      source.connect(hp);
      hp.connect(lp);
      lp.connect(processor);

      filtersRef.current = { hp, lp };
      info("filtros configurados:", { LOWCUT_HZ, HIGHCUT_HZ });
      info("captura iniciada:", {
        BUFFER_SIZE,
      });

      processor.onaudioprocess = (ev) => {
        try {
          const input = ev.inputBuffer.getChannelData(0);
          workerRef.current?.postMessage({
            type: "PROCESS",
            data: new Float32Array(input),
          });
        } catch (e) {
          warn("onaudioprocess error:", e);
        }
      };

      // mantém graph vivo
      processor.connect(ctx.destination);

      mediaRef.current = { stream, audioContext: ctx, source, processor };
      setIsTuning(true);
      setDisplayNote("");
      setLiveFreq(null);
      setCents(0);
    } catch (err) {
      console.error("Erro ao acessar o microfone:", err);
    }
  };

  const stopRecording = () => {
    const { stream, audioContext, source, processor } = mediaRef.current;
    try {
      if (processor) processor.disconnect();
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (workerRef.current) workerRef.current.terminate();
      workerRef.current = null;
      info("captura parada.");
    } catch {}
    mediaRef.current = {
      stream: null,
      audioContext: null,
      source: null,
      processor: null,
    };
    setIsTuning(false);
    setLiveFreq(null);
    setDisplayNote("");
    setCents(0);
  };

  const toggleTuner = () => {
    if (isTuning) {
      stopRecording();
      return;
    }
    startRecording();
  };

  /* ------------------------ RENDER ------------------------ */
  const noteLabel = getCleanNoteName(displayNote || targetString?.name);
  const targetFrequency = targetString?.freq || null;
  const indicatorLeft = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));
  const tuneMessage = getTuneMessage(cents, Boolean(liveFreq));
  const tunerStatus = isTuning ? "Listening" : "Idle";
  const showSettings = !isTouchLayout || settingsOpen;

  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-[#f0f0f0] px-3 pb-10 pt-4 sm:px-5 lg:px-8 ${isTouchLayout ? "pb-28" : ""}`}
    >
      <div className="container mx-auto">
        <div className="w-full pb-10 md:mx-auto md:w-11/12 lg:pb-0 2xl:w-9/12">
          <div className="mb-5 flex items-center gap-6 neuphormism-b p-5">
            <div>
              <h1 className="text-4xl font-bold">TUNER</h1>
            </div>
            <div className="ml-auto">
              <h4 className="max-w-[320px] text-right text-sm">
                Keep it tuned.
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:gap-4">
            <section className="neuphormism-b rounded p-3 sm:p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left lg:hidden"
                onClick={() => setSettingsOpen((prev) => !prev)}
              >
                <span className="text-xs font-black uppercase tracking-[0.28em] text-[goldenrod]">
                  Settings
                </span>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#697180] lg:hidden">
                  {settingsOpen ? "Close" : "Open"}
                </span>
              </button>

              <div className="hidden items-center gap-4 lg:flex">
                <p className="mr-auto text-xs font-black uppercase tracking-[0.28em] text-[goldenrod]">
                  Settings
                </p>
                <div className="grid w-[74%] grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Instrument Type
                    </span>
                    <select
                      className="neuphormism-b-btn h-[42px] w-full rounded-[14px] bg-[#efefef] px-3 text-sm font-bold text-black outline-none"
                      value={instrumentType}
                      onChange={(event) =>
                        setInstrumentType(event.target.value)
                      }
                    >
                      {instrumentOptions.map((instrument) => (
                        <option key={instrument} value={instrument}>
                          {instrument}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Tuning
                    </span>
                    <select
                      className="neuphormism-b-btn h-[42px] w-full rounded-[14px] bg-[#efefef] px-3 text-sm font-bold text-black outline-none"
                      value={tuningName}
                      onChange={(event) => setTuningName(event.target.value)}
                    >
                      {tuningOptions.map((tuning) => (
                        <option key={tuning} value={tuning}>
                          {tuning}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Auto Detect
                    </span>
                    <button
                      type="button"
                      className={`flex h-[42px] w-full items-center justify-between rounded-[14px] px-3 text-sm font-black uppercase tracking-[0.1em] transition active:scale-[0.98] ${
                        autoDetectString
                          ? "neuphormism-b-btn-gold text-black"
                          : "neuphormism-b-btn text-black"
                      }`}
                      onClick={() => setAutoDetectString((prev) => !prev)}
                    >
                      <span>{autoDetectString ? "Auto On" : "Manual"}</span>
                      <span
                        className={`h-4 w-8 rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] ${autoDetectString ? "bg-[goldenrod]" : "bg-white"}`}
                      >
                        <span
                          className={`block h-3 w-3 rounded-full bg-black transition ${autoDetectString ? "translate-x-4" : ""}`}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {showSettings && (
                <div className="mt-3 grid grid-cols-1 gap-3 lg:hidden">
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Instrument Type
                    </span>
                    <select
                      className="neuphormism-b-btn h-[42px] w-full rounded-[14px] bg-[#efefef] px-3 text-sm font-bold text-black outline-none"
                      value={instrumentType}
                      onChange={(event) =>
                        setInstrumentType(event.target.value)
                      }
                    >
                      {instrumentOptions.map((instrument) => (
                        <option key={instrument} value={instrument}>
                          {instrument}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Tuning
                    </span>
                    <select
                      className="neuphormism-b-btn h-[42px] w-full rounded-[14px] bg-[#efefef] px-3 text-sm font-bold text-black outline-none"
                      value={tuningName}
                      onChange={(event) => setTuningName(event.target.value)}
                    >
                      {tuningOptions.map((tuning) => (
                        <option key={tuning} value={tuning}>
                          {tuning}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Auto Detect
                    </span>
                    <button
                      type="button"
                      className={`flex h-[42px] w-full items-center justify-between rounded-[14px] px-3 text-sm font-black uppercase tracking-[0.1em] transition active:scale-[0.98] ${
                        autoDetectString
                          ? "neuphormism-b-btn-gold text-black"
                          : "neuphormism-b-btn text-black"
                      }`}
                      onClick={() => setAutoDetectString((prev) => !prev)}
                    >
                      <span>{autoDetectString ? "Auto On" : "Manual"}</span>
                      <span
                        className={`h-4 w-8 rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] ${autoDetectString ? "bg-[goldenrod]" : "bg-white"}`}
                      >
                        <span
                          className={`block h-3 w-3 rounded-full bg-black transition ${autoDetectString ? "translate-x-4" : ""}`}
                        />
                      </span>
                    </button>
                  </div>

                  {/* <div className="rounded-[14px] bg-[#efefef] px-3 py-2 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#697180]">
                      Current
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <span className="font-bold text-[#697180]">Instrument:</span>
                      <span className="text-right font-black text-black">{instrumentType}</span>
                      <span className="font-bold text-[#697180]">Tuning:</span>
                      <span className="text-right font-black text-black">{tuningName}</span>
                      <span className="font-bold text-[#697180]">String:</span>
                      <span className="text-right font-black text-black">{targetString?.name || "—"}</span>
                    </div>
                  </div> */}
                </div>
              )}
            </section>

            <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100vh-315px)] lg:min-h-[560px] lg:grid-cols-[minmax(150px,20%)_minmax(0,1fr)] lg:gap-5">
              <section className="order-2 neuphormism-b rounded p-3 sm:p-4 lg:order-1 lg:h-full lg:min-h-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#697180]">
                    Strings
                  </p>
                  <p className="hidden text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#697180] lg:block">
                    {autoDetectString ? "Auto" : "Manual"}
                  </p>
                </div>
                <div
                  className="grid gap-3 lg:flex lg:h-[calc(100%-28px)] lg:flex-col lg:gap-3"
                  style={{
                    gridTemplateColumns:
                      currentStrings.length >= 12
                        ? "repeat(6, minmax(0, 1fr))"
                        : `repeat(${Math.max(1, currentStrings.length)}, minmax(0, 1fr))`,
                  }}
                >
                  {currentStrings.map((string, index) => {
                    const isSelected = index === selectedStringIndex;
                    return (
                      <button
                        key={`${string.name}-${index}`}
                        type="button"
                        className={`min-h-[50px] rounded-[14px] px-2 py-2 text-center text-base font-black transition active:scale-[0.98] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:px-0 lg:py-1 ${
                          isSelected
                            ? "neuphormism-b-btn-gold text-black"
                            : "neuphormism-b-btn text-black"
                        }`}
                        onClick={() => {
                          setSelectedStringIndex(index);
                          setDisplayNote(string.name);
                          setCents(0);
                        }}
                      >
                        <span className="block">{string.name}</span>
                        <span className="mt-0.5 block text-[9px] font-bold text-[#697180] sm:text-[10px]">
                          {string.freq.toFixed(2)} Hz
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="order-1 neuphormism-b rounded p-3 sm:p-4 lg:order-2 lg:h-full lg:min-h-0">
                <div className="flex h-full flex-col rounded-[24px] px-4 py-5 text-center shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] sm:px-8 lg:justify-center lg:py-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_6px_12px_rgba(0,0,0,0.06)] neuphormism-b">
                      {tunerStatus}
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-[#697180]">
                      Target: {targetString?.name || "—"}{" "}
                      {targetFrequency
                        ? `${targetFrequency.toFixed(2)} Hz`
                        : ""}
                    </span>
                  </div>

                  <div className="mt-5 text-[4.8rem] font-black leading-none tracking-[-0.08em] text-black sm:text-[7rem] lg:text-[8rem]">
                    {noteLabel}
                  </div>
                  <div className="mt-3 text-xl font-black text-[#697180] sm:text-3xl">
                    {liveFreq
                      ? `${liveFreq.toFixed(2)} Hz`
                      : "No pitch detected"}
                  </div>
                  <div className="mt-2 text-sm font-bold text-[#697180] sm:text-lg">
                    {targetFrequency
                      ? `Target: ${targetFrequency.toFixed(2)} Hz`
                      : "Choose a string"}
                  </div>

                  <div className="mx-auto mt-7 w-full max-w-[820px]">
                    <div className="relative h-8">
                      <div className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 rounded-full bg-white shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]" />
                      {[-50, -25, 0, 25, 50].map((mark) => (
                        <span
                          key={mark}
                          className={`absolute top-0 h-8 w-[3px] rounded-full ${mark === 0 ? "bg-[goldenrod]" : "bg-[#697180]/50"}`}
                          style={{ left: `${((mark + 50) / 100) * 100}%` }}
                        />
                      ))}
                      <span
                        className="absolute top-[-6px] h-11 w-[5px] -translate-x-1/2 rounded-full bg-black transition-all"
                        style={{ left: `${indicatorLeft}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs font-black uppercase tracking-[0.18em] text-[#697180]">
                      <span>Flat</span>
                      <span>{Math.round(cents)} cents</span>
                      <span>Sharp</span>
                    </div>
                  </div>

                  <p
                    className={`mt-5 text-xl font-black sm:text-2xl ${Math.abs(cents) <= 5 && liveFreq ? "text-[goldenrod]" : "text-black"}`}
                  >
                    {tuneMessage}
                  </p>

                  <button
                    className={`mx-auto mt-5 h-[48px] min-w-[180px] rounded-[16px] px-8 text-sm font-black uppercase tracking-[0.18em] transition active:scale-[0.98] ${
                      isTuning
                        ? "bg-black text-[goldenrod] shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                        : "neuphormism-b-btn-gold text-black"
                    }`}
                    type="button"
                    onClick={toggleTuner}
                  >
                    {isTuning ? "Stop" : "Start"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
