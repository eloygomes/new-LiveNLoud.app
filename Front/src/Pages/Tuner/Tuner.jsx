// Tuner.jsx — front-only, pronto para o seu backend Node + Python
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { TuningPresets } from "./TuningPresets";

/* ------------------------------------------------------------------
   🔧 AJUSTES FINOS
   ------------------------------------------------------------------ */
const SOCKET_URL = "https://api.live.eloygomes.com.br";
const SOCKET_PATH = "/socket.io";

/** ===================== GRAVES & ESTABILIDADE ====================== */
// [AJUSTE] Gate mais sensível para não cortar cordas graves/fracas
const RMS_GATE = 0.0015; // (antes 0.003)

// [AJUSTE] Acúmulo de amostras MAIOR p/ graves (janela ~0.74s @ 44.1k)
const BUFFER_SIZE = 4096; // (antes 2048)
const SEND_BLOCK_SIZE = 32768; // (antes 8192)

// [AJUSTE] Suavização e confirmação de nota
const EMA_ALPHA = 0.25; // suavização (0.2–0.35)
const MEDIAN_WINDOW = 7; // mediana (5–9)
const FRAMES_TO_CONFIRM_NOTE = 2; // troca mais rápida

// [NOVO] Se o pitch ficar muito longe do alvo atual por alguns frames, força troca
const DEV_CENTS_TO_FORCE_SWITCH = 120; // ~ 1 tom
const DEV_FRAMES_TO_FORCE_SWITCH = 2;

// [NOVO] Se ficar em silêncio alguns frames, reseta suavização e alvo estável
const SILENCE_FRAMES_TO_RESET = 6;
/** ================================================================= */

const MIN_F_GLOBAL = 40;
const MAX_F_GLOBAL = 1200;
const MAX_PENDING_BUFFERS = 60;

// [AJUSTE] Filtros FIXOS: HP mais baixo e LP mais baixo para atenuar harmônicos
const LOWCUT_HZ = 20; // (antes 50)
const HIGHCUT_HZ = 900; // (antes 1200)

// Para não “spammar” o servidor
const SEND_THROTTLE_MS = 35;

// [AJUSTE] Correção de sample-rate (desativada por padrão)
// Se seu backend SEMPRE calcula frequência assumindo 44.1kHz,
// mas o navegador estiver em 48kHz, troque para true.
const APPLY_SR_CORRECTION = false;

const DEBUG = false;

/* ------------------------------------------------------------------
   🔢 HELPERS
   ------------------------------------------------------------------ */
const TUNING_PRESETS = TuningPresets;
const DEFAULT_PRESET = "Standard (E A D G B E)";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const log2 = (x) => Math.log(x) / Math.log(2);
const centsBetween = (f, fRef) => 1200 * log2(f / fRef);

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const normalizeToRefOctave = (f, fRef) => {
  if (!f || !fRef) return f;
  while (f < fRef / 2) f *= 2;
  while (f > fRef * 2) f /= 2;
  if (Math.abs(f * 2 - fRef) < Math.abs(f - fRef)) f *= 2;
  if (Math.abs(f / 2 - fRef) < Math.abs(f - fRef)) f /= 2;
  return f;
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

// Concatena Float32Arrays
function f32Concat(a, b) {
  const out = new Float32Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

// Gate de RMS
function passRmsGate(float32, gate = RMS_GATE) {
  let sum = 0;
  for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i];
  const rms = Math.sqrt(sum / float32.length);
  return rms >= gate;
}

// Converte Float32 -> Int16 (ArrayBuffer independente)
const float32ToInt16ArrayBuffer = (bufferFloat32) => {
  const out = new Int16Array(bufferFloat32.length);
  for (let i = 0; i < bufferFloat32.length; i++) {
    let s = bufferFloat32[i];
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer.slice(0);
};

/* ------------------------------------------------------------------
   🎛️ COMPONENTE
   ------------------------------------------------------------------ */
export default function Tuner() {
  // Preset / modo
  const [presetName, setPresetName] = useState(DEFAULT_PRESET);
  const strings = useMemo(() => TUNING_PRESETS[presetName], [presetName]);
  const [mode, setMode] = useState("auto"); // "auto" | "manual"
  const [manualTarget, setManualTarget] = useState(strings[0].name);

  // Execução
  const [isTuning, setIsTuning] = useState(false);

  // UI
  const [displayNote, setDisplayNote] = useState("");
  const [displayBar, setDisplayBar] = useState("");
  const [liveFreq, setLiveFreq] = useState(null);
  const [cents, setCents] = useState(0);

  // Áudio / socket
  const socketRef = useRef(null);
  const mediaRef = useRef({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });
  const sampleRateRef = useRef(44100);

  // Suavização e troca de nota
  const emaRef = useRef(null);
  const medianBufRef = useRef([]);
  const stableRefNoteRef = useRef(null);
  const pendingNoteRef = useRef(null);
  const pendingCountRef = useRef(0);

  // fila de buffers enquanto conecta
  const pendingAudioQueueRef = useRef([]);

  // filtros fixos e acumulador de envio
  const filtersRef = useRef({ hp: null, lp: null });
  const sendAccumRef = useRef(new Float32Array(0));
  const lastSendTsRef = useRef(0);

  // contagem de silêncio para reset
  const silenceFramesRef = useRef(0);

  // refs dinâmicos
  const modeRef = useRef(mode);
  const manualTargetRef = useRef(manualTarget);
  const stringsRef = useRef(strings);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    manualTargetRef.current = manualTarget;
  }, [manualTarget]);
  useEffect(() => {
    stringsRef.current = strings;
  }, [strings]);

  // Email no handshake
  const userEmail = useMemo(() => localStorage.getItem("userEmail") || "", []);

  // Ajusta alvo quando muda preset
  useEffect(() => {
    setManualTarget(TuningPresets[presetName][0].name);
    resetSmoothing();
  }, [presetName]);

  /* ------------------------ SOCKET.IO ------------------------ */
  useEffect(() => {
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    const sock = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["polling", "websocket"],
      withCredentials: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 400,
      reconnectionDelayMax: 3000,
      timeout: 20000,
      query: { email: userEmail },
    });

    socketRef.current = sock;

    sock.on("connect", () => {
      DEBUG && console.log("[socket] connected:", sock.id);
      // drenar fila de buffers pendentes
      if (pendingAudioQueueRef.current.length) {
        pendingAudioQueueRef.current.forEach((buf) => {
          sock.emit("messageToServer", { audioData: buf });
        });
        pendingAudioQueueRef.current = [];
      }
    });

    sock.on("connect_error", (e) => {
      DEBUG && console.warn("[socket] connect_error:", e?.message);
    });

    sock.on("disconnect", (r) => {
      DEBUG && console.warn("[socket] disconnected:", r);
    });

    // Frequência processada (vinda do Python via Node)
    const onFreq = (data) => {
      if (!data) return;

      let f = Number(data.frequency ?? data.freq);
      if (!f || isNaN(f)) return;

      // [AJUSTE] Correção de sample-rate (opcional)
      const sr = sampleRateRef.current || 44100;
      if (APPLY_SR_CORRECTION) {
        // corrige resultado supondo que o backend calculou com 44.1k
        f = f * (sr / 44100);
      }

      if (f < MIN_F_GLOBAL || f > MAX_F_GLOBAL) return;

      // Suavização
      const prev = emaRef.current;
      const ema = prev == null ? f : (1 - EMA_ALPHA) * prev + EMA_ALPHA * f;
      emaRef.current = ema;

      const buf = medianBufRef.current;
      buf.push(ema);
      if (buf.length > MEDIAN_WINDOW) buf.shift();
      const fSmooth = median(buf);
      if (!fSmooth) return;

      // Determina alvo (auto/manual)
      const curMode = modeRef.current;
      const curStrings = stringsRef.current;
      const curManual = manualTargetRef.current;

      const target =
        curMode === "manual"
          ? curStrings.find((s) => s.name === curManual) || curStrings[0]
          : nearestStringWithOctave(fSmooth, curStrings);

      // --------------- LÓGICA DE TROCA DE NOTA ----------------
      // 1) Confirmação normal (histerese leve)
      if (!stableRefNoteRef.current) {
        stableRefNoteRef.current = target;
      } else if (stableRefNoteRef.current.name !== target.name) {
        if (pendingNoteRef.current !== target.name) {
          pendingNoteRef.current = target.name;
          pendingCountRef.current = 1;
        } else {
          pendingCountRef.current += 1;
        }
        if (pendingCountRef.current >= FRAMES_TO_CONFIRM_NOTE) {
          stableRefNoteRef.current = target;
          pendingNoteRef.current = null;
          pendingCountRef.current = 0;
        }
      } else {
        pendingNoteRef.current = null;
        pendingCountRef.current = 0;
      }

      // 2) Forçar troca se o desvio ficar muito grande por alguns frames
      const refNow = stableRefNoteRef.current || target;
      const fAdjForRef = normalizeToRefOctave(fSmooth, refNow.freq);
      const devCents = Math.abs(centsBetween(fAdjForRef, refNow.freq));
      if (devCents > DEV_CENTS_TO_FORCE_SWITCH) {
        if (pendingNoteRef.current !== target.name) {
          pendingNoteRef.current = target.name;
          pendingCountRef.current = 1;
        } else {
          pendingCountRef.current += 1;
        }
        if (pendingCountRef.current >= DEV_FRAMES_TO_FORCE_SWITCH) {
          stableRefNoteRef.current = target; // força troca
          pendingNoteRef.current = null;
          pendingCountRef.current = 0;
        }
      }

      const ref = stableRefNoteRef.current || target;

      // Cents em relação ao alvo (apenas para UI)
      const fAdj = normalizeToRefOctave(fSmooth, ref.freq);
      const c = clamp(centsBetween(fAdj, ref.freq), -50, 50);

      // UI
      setLiveFreq(fSmooth);
      setDisplayNote(target.name);
      setCents(c);
    };

    sock.on("messageFromServer", onFreq);

    return () => {
      try {
        if (!socketRef.current) return;
        socketRef.current.off("messageFromServer", onFreq);
        socketRef.current.removeAllListeners();
        socketRef.current.close();
      } finally {
        socketRef.current = null;
      }
    };
  }, [userEmail]);

  /* ------------------------ ÁUDIO ------------------------ */
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Seu navegador não suporta captura de áudio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 44100, // hint (o navegador pode ignorar)
        },
      });

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      sampleRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

      // Filtros FIXOS (sem depender de modo/manual)
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = LOWCUT_HZ; // 20 Hz
      hp.Q.value = 0.707;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = HIGHCUT_HZ; // 900 Hz (ajuda o backend a achar o fundamental)
      lp.Q.value = 0.707;

      // Encadeia: source -> hp -> lp -> processor
      source.connect(hp);
      hp.connect(lp);
      lp.connect(processor);

      filtersRef.current = { hp, lp };

      const safeEmit = (buf) => {
        const sock = socketRef.current;
        if (sock && sock.connected) {
          sock.emit("messageToServer", { audioData: buf });
        } else {
          if (pendingAudioQueueRef.current.length >= MAX_PENDING_BUFFERS) {
            pendingAudioQueueRef.current.shift();
          }
          pendingAudioQueueRef.current.push(buf);
        }
      };

      processor.onaudioprocess = (ev) => {
        try {
          const float32 = ev.inputBuffer.getChannelData(0);

          // Gate RMS
          if (!passRmsGate(float32, RMS_GATE)) {
            // acumula silêncio; se persistir, reset para captar nova nota
            if (++silenceFramesRef.current >= SILENCE_FRAMES_TO_RESET) {
              resetSmoothing();
              silenceFramesRef.current = 0;
            }
            return;
          }
          // Voltou sinal: zera contador de silêncio
          silenceFramesRef.current = 0;

          // Acumula até SEND_BLOCK_SIZE para janela maior (graves)
          sendAccumRef.current = f32Concat(sendAccumRef.current, float32);
          if (sendAccumRef.current.length < SEND_BLOCK_SIZE) return;

          // Throttle
          const now = performance.now();
          if (now - lastSendTsRef.current < SEND_THROTTLE_MS) return;
          lastSendTsRef.current = now;

          // Corta bloco exato e mantém resto no acumulador
          const block = sendAccumRef.current.slice(0, SEND_BLOCK_SIZE);
          sendAccumRef.current = sendAccumRef.current.slice(SEND_BLOCK_SIZE);

          // Converte p/ Int16 e envia
          const audioBuffer = float32ToInt16ArrayBuffer(block);
          safeEmit(audioBuffer);
        } catch (e) {
          DEBUG && console.warn("onaudioprocess error:", e);
        }
      };

      // Mantém o processor ligado (volume ínfimo)
      processor.connect(ctx.destination);

      mediaRef.current = { stream, audioContext: ctx, source, processor };
      setIsTuning(true);
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
      // Limpeza
      sendAccumRef.current = new Float32Array(0);
      lastSendTsRef.current = 0;
      silenceFramesRef.current = 0;
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
    setDisplayBar("");
    setCents(0);
    resetSmoothing();
  };

  const resetSmoothing = () => {
    emaRef.current = null;
    medianBufRef.current = [];
    stableRefNoteRef.current = null;
    pendingNoteRef.current = null;
    pendingCountRef.current = 0;
  };

  /* ------------------------ TONE DE REFERÊNCIA ------------------------ */
  const refAudioCtx = useRef(null);
  const playReference = (hz) => {
    if (!refAudioCtx.current) {
      refAudioCtx.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const ctx = refAudioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
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

  /* ------------------------ RENDER ------------------------ */
  const needleDeg = useMemo(() => (cents / 50) * 50, [cents]);

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          {/* Header */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Tuner</h1>

            <div className="ml-auto flex items-center gap-3">
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
                  if (!isTuning) startRecording();
                  else stopRecording();
                }}
              >
                {isTuning ? "Stop Listening" : "Start Listening..."}
              </button>
            </div>
          </div>

          {/* Controles Manual + dica */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start w-[90%] mx-auto rounded-md mb-2">
              <div>
                {mode === "manual" && (
                  <div className="p-2 flex flex-col gap-4 w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                    <div className="flex flex-wrap items-center pt-2 gap-2 flex-row justify-around">
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
                    </div>
                    <span className="p-2 text-xs opacity-60 ml-2">
                      Clique para selecionar e ouvir a referência
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col gap-4 w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <div className="p-0 mb-5 w-full flex flex-col">
                  {/* Preset */}
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
                </div>

                <div className="text-xs opacity-60">
                  Use uma nota por vez e deixe soar. Para graves (B3 e abaixo),
                  aproxime o microfone e mantenha a nota contínua; a janela
                  maior e o low-pass em 900 Hz ajudam a extrair o fundamental.
                </div>
              </div>

              {/* DISPLAY */}
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

                  {/* Frequência (auto) ou alvo (manual) */}
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
                              className="absolute w-[2px] h-5  origin-bottom left-1/2"
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
                        <div className="absolute left-2 top-2 text-gray-500 ">
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
                      {/* <div className="w-4 h-4 rounded-full border border-gray-500 bg-transparent absolute -bottom-2 left-1/2 -translate-x-1/2" /> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé: cordas do preset */}
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
