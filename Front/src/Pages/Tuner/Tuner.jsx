import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { TuningPresets } from "./TuningPresets";

/* ================= TUNINGS ================= */
const TUNING_PRESETS = TuningPresets;
const DEFAULT_PRESET = "Standard (E A D G B E)";

/* =============== Utils & constants =============== */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const log2 = (x) => Math.log(x) / Math.log(2);
const centsBetween = (f, fRef) => 1200 * log2(f / fRef);
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// ===== Constantes de detecção/estabilidade =====
// const MIN_F = 70;
// const MAX_F = 350;

const MIN_F = 27; // A0 = 27.5 Hz
const MAX_F = 4186; // C8 = 4186 Hz

// atualização mais rápida e responsiva
const MEDIAN_WINDOW = 5; // era 7

// histerese levemente mais sensível
const BASE_SWITCH_HYSTERESIS = 4;
const HYSTERESIS_FACTOR = 0.85; // 15% mais sensível
const SWITCH_HYSTERESIS = Math.max(
  1,
  Math.round(BASE_SWITCH_HYSTERESIS * HYSTERESIS_FACTOR)
);

// Gate de volume (mais permissivo para graves)
const RMS_GATE = 0.005; // era 0.01

/* ---------- Octave-normalização ---------- */
const normalizeToRefOctave = (f, fRef) => {
  if (!f || !fRef) return f;
  while (f < fRef / 2) f *= 2;
  while (f > fRef * 2) f /= 2;
  if (Math.abs(f * 2 - fRef) < Math.abs(f - fRef)) f *= 2;
  if (Math.abs(f / 2 - fRef) < Math.abs(f - fRef)) f /= 2;
  return f;
};

/* ---------- Helpers extra para resposta/gravidade ---------- */
const foldIntoRange = (f, low = MIN_F, high = MAX_F) => {
  if (!f) return f;
  while (f > high) f /= 2;
  while (f < low) f *= 2;
  return f;
};
const nearestStringPlain = (f, strings) => {
  let best = strings[0],
    d = Math.abs(f - best.freq);
  for (let i = 1; i < strings.length; i++) {
    const di = Math.abs(f - strings[i].freq);
    if (di < d) {
      d = di;
      best = strings[i];
    }
  }
  return best;
};
const nearestStringWithOctave = (f, strings) => {
  let best = strings[0];
  let bestDelta = Infinity;
  for (const s of strings) {
    const fAdj = normalizeToRefOctave(f, s.freq);
    const d = Math.abs(fAdj - s.freq);
    if (d < bestDelta) {
      bestDelta = d;
      best = s;
    }
  }
  return best;
};

/* =================== Component =================== */
export default function Tuner() {
  const [presetName, setPresetName] = useState(DEFAULT_PRESET);
  const strings = useMemo(() => TUNING_PRESETS[presetName], [presetName]);

  const [mode, setMode] = useState("auto"); // auto | manual
  const [manualTarget, setManualTarget] = useState(strings[0].name);

  const [isTuning, setIsTuning] = useState(false);

  // Display
  const [displayNote, setDisplayNote] = useState("");
  const [displayBar, setDisplayBar] = useState("");
  const [liveFreq, setLiveFreq] = useState(null);
  const [cents, setCents] = useState(0);

  // smoothing
  const freqBufferRef = useRef([]);
  const pendingStringRef = useRef(null);
  const pendingCountRef = useRef(0);
  const currentStringRef = useRef(null);

  // audio/ws
  const socketRef = useRef(null);
  const mediaRef = useRef({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });

  // sampleRate real do navegador para corrigir a frequência do backend (assume 44100)
  const sampleRateRef = useRef(44100);

  // Ref para player de referência
  const refAudioCtx = useRef(null);
  const userEmail = useMemo(() => localStorage.getItem("userEmail"), []);

  /* --------------- Socket IO --------------- */
  useEffect(() => {
    socketRef.current = io("https://api.live.eloygomes.com.br", {
      query: { email: userEmail },
      transports: ["websocket"],
      path: "/socket.io",
    });

    socketRef.current.on("messageFromServer", (data) => {
      let f = data?.frequency;
      if (!f || isNaN(f)) return;

      // correção de sample rate (Python usa 44100)
      const sr = sampleRateRef.current || 44100;
      f = f * (sr / 44100);

      if (mode === "auto") setLiveFreq(f);

      // traga a frequência para o range útil da guitarra
      const fProc = foldIntoRange(f);

      // suavização rápida (menor janela)
      const buf = freqBufferRef.current;
      buf.push(fProc);
      if (buf.length > MEDIAN_WINDOW) buf.shift();
      const fMed = median(buf);
      if (!fMed) return;

      // alvo instantâneo: sempre mostramos a nota mais próxima
      const instantaneousTarget =
        mode === "manual"
          ? strings.find((s) => s.name === manualTarget) || strings[0]
          : nearestStringPlain(fMed, strings);

      // histerese somente para a referência do ponteiro (estabilidade)
      let stableRef = currentStringRef.current;
      if (mode === "manual") {
        stableRef = instantaneousTarget;
        currentStringRef.current = stableRef;
        pendingStringRef.current = null;
        pendingCountRef.current = 0;
      } else {
        const cur = currentStringRef.current?.name || null;
        if (cur !== instantaneousTarget.name) {
          if (pendingStringRef.current !== instantaneousTarget.name) {
            pendingStringRef.current = instantaneousTarget.name;
            pendingCountRef.current = 1;
          } else {
            pendingCountRef.current += 1;
          }
          if (pendingCountRef.current >= SWITCH_HYSTERESIS) {
            currentStringRef.current = instantaneousTarget;
            pendingStringRef.current = null;
            pendingCountRef.current = 0;
            stableRef = instantaneousTarget;
          }
        } else {
          pendingStringRef.current = null;
          pendingCountRef.current = 0;
          stableRef = currentStringRef.current;
        }
      }

      // cents relativos à referência (ajustando oitava por segurança)
      const ref = stableRef || instantaneousTarget;
      const fAdj = normalizeToRefOctave(fMed, ref.freq);
      const c = clamp(centsBetween(fAdj, ref.freq), -50, 50);

      // UI
      setDisplayNote(instantaneousTarget.name);
      setCents(c);
      setDisplayBar(makeAsciiBar(c));
    });

    return () => {
      if (!socketRef.current) return;
      socketRef.current.off("messageFromServer");
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [userEmail, mode, manualTarget, strings]);

  /* --------------- Audio capture --------------- */
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Seu navegador não suporta captura de áudio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // salva sampleRate real para a correção
      sampleRateRef.current = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);
      // buffer menor para latência menor
      const processor = audioContext.createScriptProcessor(2048, 1, 1); // era 4096

      processor.onaudioprocess = (event) => {
        const float32 = event.inputBuffer.getChannelData(0);
        // gate simples por RMS
        let sum = 0;
        for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i];
        const rms = Math.sqrt(sum / float32.length);
        if (rms < RMS_GATE) return;

        const audioBuffer = float32ToInt16(float32);
        socketRef.current?.emit("messageToServer", { audioData: audioBuffer });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      mediaRef.current = { stream, audioContext, source, processor };
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
    } catch {
      /* noop */
    }
    mediaRef.current = {
      stream: null,
      audioContext: null,
      source: null,
      processor: null,
    };

    // limpa estados
    freqBufferRef.current = [];
    pendingStringRef.current = null;
    pendingCountRef.current = 0;
    currentStringRef.current = null;
    setLiveFreq(null);
  };

  const float32ToInt16 = (buffer) => {
    const out = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      let s = buffer[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out.buffer;
  };

  /* --------------- Reference Tone Player --------------- */
  const playReference = (hz) => {
    if (!refAudioCtx.current) {
      refAudioCtx.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const ctx = refAudioCtx.current;

    const osc = ctx.createOscillator();
    osc.type = "triangle";

    const gain = ctx.createGain();
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const attack = 0.01;
    const decay = 1.2;

    osc.frequency.setValueAtTime(hz, now);
    gain.gain.linearRampToValueAtTime(0.7, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.start(now);
    osc.stop(now + decay + 0.05);
  };

  /* --------------- Helpers UI --------------- */
  const needleDeg = useMemo(() => (cents / 50) * 50, [cents]);

  // quando muda preset, reset manual target e estados
  useEffect(() => {
    setManualTarget(TUNING_PRESETS[presetName][0].name);
    freqBufferRef.current = [];
    pendingStringRef.current = null;
    pendingCountRef.current = 0;
    currentStringRef.current = null;
  }, [presetName]);

  /* =================== Render =================== */
  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          {/* Header */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Tuner</h1>

            <div className="ml-auto flex items-center gap-3">
              {/* Preset de afinação */}
              <select
                className="neuphormism-b-se px-3 py-2 text-sm"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                title="Afinação"
              >
                {Object.keys(TUNING_PRESETS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              {/* Modo */}
              <div className="flex items-center gap-2">
                <button
                  className={`neuphormism-b-se px-3 py-2 ${
                    mode === "auto" ? "font-bold" : ""
                  }`}
                  onClick={() => setMode("auto")}
                >
                  Auto
                </button>
                <button
                  className={`neuphormism-b-se px-3 py-2 ${
                    mode === "manual" ? "font-bold" : ""
                  }`}
                  onClick={() => setMode("manual")}
                >
                  Manual
                </button>
              </div>

              {/* Start/Stop */}
              <button
                className="neuphormism-b-se px-4 py-2"
                onClick={() => {
                  if (!isTuning) {
                    setIsTuning(true);
                    startRecording();
                  } else {
                    setIsTuning(false);
                    stopRecording();
                    setDisplayNote("");
                    setDisplayBar("");
                    setCents(0);
                  }
                }}
              >
                {isTuning ? "Stop Listening" : "Start Listening..."}
              </button>
            </div>
          </div>

          {/* Controles Manual + dica */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start w-[90%] mx-auto rounded-md mb-2">
              <div className="p-6 flex flex-col gap-4 w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                {mode === "manual" && (
                  <div className="flex flex-wrap items-center gap-2">
                    {strings.map((s) => (
                      <button
                        key={s.name}
                        className={`neuphormism-b-se px-3 py-2 ${
                          manualTarget === s.name ? "font-bold" : ""
                        }`}
                        onClick={() => {
                          setManualTarget(s.name);
                          playReference(s.freq);
                        }}
                        title={`Alvo: ${s.name} (${s.freq.toFixed(2)} Hz)`}
                      >
                        {s.name}
                      </button>
                    ))}
                    <span className="text-xs opacity-60 ml-2">
                      Clique para selecionar e ouvir a referência
                    </span>
                  </div>
                )}

                <div className="text-xs opacity-60">
                  Toque uma corda por vez e deixe soar. O afinador foca ~70–350
                  Hz e fixa nas cordas da afinação escolhida.
                </div>
              </div>

              {/* ======= DISPLAY ======= */}
              <div className="p-10 w-[90%] mx-auto rounded-md mb-2 neuphormism-b">
                <div className="flex flex-col items-center justify-center select-none">
                  {/* Linha superior */}
                  <div className="flex items-end gap-6 mb-2 text-gray-500">
                    <span className="text-3xl opacity-40">A#</span>
                    <span className="text-4xl opacity-60">B</span>
                    <span className="text-[110px] leading-none text-red-500 font-semibold">
                      {displayNote ? displayNote.replace(/[0-9]/g, "") : "—"}
                    </span>
                    <span className="text-4xl opacity-60">C#</span>
                    <span className="text-3xl opacity-40">D</span>
                  </div>

                  {/* Frequência atual (Auto) ou alvo (Manual) */}
                  <div className="text-lg mb-6 opacity-80">
                    {mode === "auto"
                      ? liveFreq
                        ? `${liveFreq.toFixed(1)} Hz`
                        : "—"
                      : (() => {
                          const s = strings.find(
                            (x) => x.name === manualTarget
                          );
                          return s ? `${s.freq.toFixed(1)} Hz` : "—";
                        })()}
                  </div>

                  {/* Gauge */}
                  <div className="relative w-[320px] h-[170px]">
                    <div className="absolute inset-0 top-[20px] flex items-end justify-center">
                      <div className="w-[300px] h-[150px] rounded-t-[300px] border-t-2 border-l-2 border-r-2 border-gray-600 relative">
                        {[...Array(9)].map((_, i) => {
                          const angle = -50 + (i * 100) / 8;
                          return (
                            <div
                              key={i}
                              className="absolute w-[2px] h-5 bg-gray-500 origin-bottom left-1/2"
                              style={{
                                bottom: -2,
                                transform: `translateX(-50%) rotate(${
                                  (angle / 50) * 50
                                }deg) translateY(-4px)`,
                                opacity: i === 4 ? 1 : 0.6,
                              }}
                            />
                          );
                        })}
                        <div className="absolute left-2 top-2 text-gray-500">
                          ♭
                        </div>
                        <div className="absolute right-2 top-2 text-gray-500">
                          ♯
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-1 text-gray-400">
                          ||
                        </div>
                      </div>
                    </div>

                    <div
                      className="absolute left-1/2 bottom-[10px] w-1 h-[135px] origin-bottom"
                      style={{
                        transform: `translateX(-50%) rotate(${
                          (cents / 50) * 50
                        }deg)`,
                      }}
                    >
                      <div className="w-[2px] h-full bg-red-500" />
                      <div className="w-4 h-4 rounded-full border border-gray-500 bg-transparent absolute -bottom-2 left-1/2 -translate-x-1/2" />
                    </div>
                  </div>

                  <div className="text-[16px] mt-6 font-mono opacity-80">
                    {displayBar || "[-------------|--------------]"}
                  </div>
                </div>
              </div>

              {/* rodapé com as cordas */}
              <div className="w-[90%] mx-auto text-center text-sm opacity-60">
                {strings.map((s, i) => (
                  <span key={s.name} className="mx-2">
                    {s.name}: {s.freq.toFixed(2)} Hz
                    {i < strings.length - 1 ? " •" : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== helpers UI ============== */
function makeAsciiBar(cents, barLength = 31, maxCents = 50) {
  const center = Math.floor(barLength / 2);
  const c = clamp(cents, -maxCents, maxCents);
  const pos = Math.round(((c + maxCents) * (barLength - 1)) / (2 * maxCents));
  const arr = Array.from({ length: barLength }, () => "-");
  arr[center] = "|";
  if (pos >= 0 && pos < barLength) arr[pos] = "*";
  return "[" + arr.join("") + "]";
}
