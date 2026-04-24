// Tuner.jsx — FRONT exibindo dados do backend, sem afinação manual
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { TuningPresets } from "./TuningPresets";

/* ------------------------------------------------------------------
   🔌 SOCKET
   ------------------------------------------------------------------ */
const SOCKET_URL = "https://api.live.eloygomes.com";
const SOCKET_PATH = "/socket.io";

/* ------------------------------------------------------------------
   🎼 FAIXA C0..C8 PARA EXIBIÇÃO NA UI
   ------------------------------------------------------------------ */
const NOTE_FREQS = {
  C0: 16.35,
  "C#0/Db0": 17.32,
  D0: 18.35,
  "D#0/Eb0": 19.45,
  E0: 20.6,
  F0: 21.83,
  "F#0/Gb0": 23.12,
  G0: 24.5,
  "G#0/Ab0": 25.96,
  A0: 27.5,
  "A#0/Bb0": 29.14,
  B0: 30.87,
  C1: 32.7,
  "C#1/Db1": 34.65,
  D1: 36.71,
  "D#1/Eb1": 38.89,
  E1: 41.2,
  F1: 43.65,
  "F#1/Gb1": 46.25,
  G1: 49.0,
  "G#1/Ab1": 51.91,
  A1: 55.0,
  "A#1/Bb1": 58.27,
  B1: 61.74,
  C2: 65.41,
  "C#2/Db2": 69.3,
  D2: 73.42,
  "D#2/Eb2": 77.78,
  E2: 82.41,
  F2: 87.31,
  "F#2/Gb2": 92.5,
  G2: 98.0,
  "G#2/Ab2": 103.83,
  A2: 110.0,
  "A#2/Bb2": 116.54,
  B2: 123.47,
  C3: 130.81,
  "C#3/Db3": 138.59,
  D3: 146.83,
  "D#3/Eb3": 155.56,
  E3: 164.81,
  F3: 174.61,
  "F#3/Gb3": 185.0,
  G3: 196.0,
  "G#3/Ab3": 207.65,
  A3: 220.0,
  "A#3/Bb3": 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4/Db4": 277.18,
  D4: 293.66,
  "D#4/Eb4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4/Gb4": 369.99,
  G4: 392.0,
  "G#4/Ab4": 415.3,
  A4: 440.0,
  "A#4/Bb4": 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5/Db5": 554.37,
  D5: 587.33,
  "D#5/Eb5": 622.25,
  E5: 659.25,
  F5: 698.46,
  "F#5/Gb5": 739.99,
  G5: 783.99,
  "G#5/Ab5": 830.61,
  A5: 880.0,
  "A#5/Bb5": 932.33,
  B5: 987.77,
  C6: 1046.5,
  "C#6/Db6": 1108.73,
  D6: 1174.66,
  "D#6/Eb6": 1244.51,
  E6: 1318.51,
  F6: 1396.91,
  "F#6/Gb6": 1479.98,
  G6: 1567.98,
  "G#6/Ab6": 1661.22,
  A6: 1760.0,
  "A#6/Bb6": 1864.66,
  B6: 1975.53,
  C7: 2093.0,
  "C#7/Db7": 2217.46,
  D7: 2349.32,
  "D#7/Eb7": 2489.02,
  E7: 2637.02,
  F7: 2793.83,
  "F#7/Gb7": 2959.96,
  G7: 3135.96,
  "G#7/Ab7": 3322.44,
  A7: 3520.0,
  "A#7/Bb7": 3729.31,
  B7: 3951.07,
  C8: 4186.01,
};
const MIN_UI_FREQ = 16.35; // C0
const MAX_UI_FREQ = 4186.01; // C8

/* ------------------------------------------------------------------
   ⚙️ CAPTURA / ENVIO — parâmetros ajustados p/ agudos + menos latência
   ------------------------------------------------------------------ */
const DEFAULT_CFG = {
  RMS_GATE: 0.0012,
  BUFFER_SIZE: 2048,
  SEND_BLOCK_SIZE: 16384,
  SEND_THROTTLE_MS: 20,
  MIN_F_GLOBAL: 16.35,
  MAX_F_GLOBAL: 5000,
  LOWCUT_HZ: 20,
  HIGHCUT_HZ: 5000, // não “mata” agudos
  MAX_PENDING_BUFFERS: 60,
};

/* ------------------------------------------------------------------
   🧪 LOGS (enxutos)
   ------------------------------------------------------------------ */
let LOGS_ENABLED = true;
const log = (...a) => {
  if (LOGS_ENABLED) console.log("%c[Tuner]", "color:#9b59b6", ...a);
};
const warn = (...a) => {
  if (LOGS_ENABLED) console.warn("%c[Tuner]", "color:#e67e22", ...a);
};
const info = (...a) => {
  if (LOGS_ENABLED) console.info("%c[Tuner]", "color:#2ecc71", ...a);
};

/* ------------------------------------------------------------------
   🔧 HELPERS
   ------------------------------------------------------------------ */
function f32Concat(a, b) {
  const out = new Float32Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
function passRmsGate(float32, gate) {
  let sum = 0;
  for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i];
  const rms = Math.sqrt(sum / float32.length);
  return { pass: rms >= gate, rms };
}
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
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  // Execução
  const [isTuning, setIsTuning] = useState(false);

  // UI (sempre dados do backend)
  const [displayNote, setDisplayNote] = useState("");
  const [liveFreq, setLiveFreq] = useState(null);
  const [cents, setCents] = useState(0);

  // Refs principais
  const socketRef = useRef(null);
  const mediaRef = useRef({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });
  const sampleRateRef = useRef(44100);
  const configRef = useRef({ ...DEFAULT_CFG });

  // Fila de envio enquanto desconectado
  const pendingAudioQueueRef = useRef([]);

  // filtros e envio
  const filtersRef = useRef({ hp: null, lp: null });
  const sendAccumRef = useRef(new Float32Array(0));
  const lastSendTsRef = useRef(0);

  // estabilidade por tempo: 2s na mesma nota
  // const MIN_STABLE_MS = 2000;
  const MIN_STABLE_MS = 1000;
  const candidateRef = useRef({ name: null, since: 0 });
  const committedRef = useRef({ name: null });

  // status server
  const serverOnlineRef = useRef(false);
  const serverHeartbeatRef = useRef(null);

  // Email no handshake
  const userEmail = useMemo(() => localStorage.getItem("userEmail") || "", []);

  // expor toggle de logs no console
  useEffect(() => {
    window.tunerLogs = (on) => {
      LOGS_ENABLED = !!on;
      console.log("[Tuner] logs:", LOGS_ENABLED ? "ON" : "OFF");
    };
    return () => delete window.tunerLogs;
  }, []);

  /* ------------------------ SOCKET.IO ------------------------ */
  useEffect(() => {
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    info("criando conexão socket…", { SOCKET_URL, SOCKET_PATH, userEmail });
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

    // heartbeat de status a cada 5s (sem spam)
    serverHeartbeatRef.current = setInterval(() => {
      const isOnline = !!socketRef.current?.connected;
      if (isOnline !== serverOnlineRef.current) {
        serverOnlineRef.current = isOnline;
        info("SERVER STATUS:", isOnline ? "ONLINE ✅" : "OFFLINE ❌");
      }
    }, 5000);

    sock.on("connect", () => {
      serverOnlineRef.current = true;
      info("socket conectado:", sock.id);

      // drenar fila pendente
      if (pendingAudioQueueRef.current.length) {
        info(
          "enviando fila pendente:",
          pendingAudioQueueRef.current.length,
          "blocos",
        );
        pendingAudioQueueRef.current.forEach((buf) => {
          sock.emit("messageToServer", {
            audioData: buf,
            sampleRate: sampleRateRef.current || 44100,
          });
        });
        pendingAudioQueueRef.current = [];
      }

      // reset de estabilidade ao reconectar
      candidateRef.current = { name: null, since: 0 };
      committedRef.current = { name: null };
    });

    sock.on("connect_error", (e) => {
      serverOnlineRef.current = false;
      warn("connect_error:", e?.message || e);
    });

    sock.on("disconnect", (r) => {
      serverOnlineRef.current = false;
      warn("disconnect:", r);
    });

    // Frequência + nota vindas do backend
    const onFreq = (data) => {
      if (!data) return;

      // pegar frequency/note/cents do backend
      const freq = Number(data.frequency ?? data.freq);
      const noteName = typeof data.note === "string" ? data.note : "";
      const centsFromServer = Number.isFinite(data.cents)
        ? Number(data.cents)
        : null;

      if (!Number.isFinite(freq) || freq <= 0) return;

      // filtro de faixa para exibição (C0..C8)
      if (freq < MIN_UI_FREQ || freq > MAX_UI_FREQ) {
        // não zera a UI; apenas ignora atualização
        return;
      }

      const nowTs = performance.now();

      // gating de estabilidade por nota (2s)
      if (candidateRef.current.name !== noteName) {
        candidateRef.current = { name: noteName, since: nowTs };
        log("nova nota candidata:", noteName);
      }

      const elapsed = nowTs - candidateRef.current.since;
      if (elapsed >= MIN_STABLE_MS) {
        if (committedRef.current.name !== noteName) {
          committedRef.current.name = noteName;
          info("nota estabilizada (2s):", noteName);
        }
        // Atualiza UI SOMENTE após estabilidade
        setDisplayNote(noteName || "—");
        setLiveFreq(freq);
        const c =
          centsFromServer == null
            ? 0
            : Math.max(-50, Math.min(50, centsFromServer));
        setCents(c);
      }
    };

    sock.on("messageFromServer", onFreq);

    return () => {
      try {
        if (serverHeartbeatRef.current)
          clearInterval(serverHeartbeatRef.current);
        serverHeartbeatRef.current = null;
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
    const {
      BUFFER_SIZE,
      LOWCUT_HZ,
      HIGHCUT_HZ,
      RMS_GATE,
      SEND_BLOCK_SIZE,
      SEND_THROTTLE_MS,
      MAX_PENDING_BUFFERS,
    } = configRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Seu navegador não suporta captura de áudio.");
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
        SEND_BLOCK_SIZE,
        RMS_GATE,
        SEND_THROTTLE_MS,
      });

      const safeEmit = (buf) => {
        const sock = socketRef.current;
        if (sock && sock.connected) {
          sock.emit("messageToServer", {
            audioData: buf,
            sampleRate: sampleRateRef.current || 44100,
          });
        } else {
          if (pendingAudioQueueRef.current.length >= MAX_PENDING_BUFFERS) {
            pendingAudioQueueRef.current.shift();
          }
          pendingAudioQueueRef.current.push(buf);
          // log enxuto quando offline
          warn(
            "socket OFF — bloco enfileirado (fila:",
            pendingAudioQueueRef.current.length,
            ")",
          );
        }
      };

      processor.onaudioprocess = (ev) => {
        try {
          const {
            RMS_GATE: gRms,
            SEND_BLOCK_SIZE: blk,
            SEND_THROTTLE_MS: thr,
          } = configRef.current;

          const float32 = ev.inputBuffer.getChannelData(0);

          // Gate RMS — sem spam
          const { pass } = passRmsGate(float32, gRms);
          if (!pass) return;

          // Acumula e envia em blocos — sem logs por frame
          sendAccumRef.current = f32Concat(sendAccumRef.current, float32);
          if (sendAccumRef.current.length < blk) return;

          const now = performance.now();
          if (now - lastSendTsRef.current < thr) return;
          lastSendTsRef.current = now;

          const block = sendAccumRef.current.slice(0, blk);
          sendAccumRef.current = sendAccumRef.current.slice(blk);

          const audioBuffer = float32ToInt16ArrayBuffer(block);
          safeEmit(audioBuffer);
        } catch (e) {
          warn("onaudioprocess error:", e);
        }
      };

      // mantém graph vivo
      processor.connect(ctx.destination);

      mediaRef.current = { stream, audioContext: ctx, source, processor };
      setIsTuning(true);
      // reset de estabilidade ao iniciar
      candidateRef.current = { name: null, since: 0 };
      committedRef.current = { name: null };
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
      sendAccumRef.current = new Float32Array(0);
      lastSendTsRef.current = 0;
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
    // limpa estabilidade
    candidateRef.current = { name: null, since: 0 };
    committedRef.current = { name: null };
  };

  const toggleTuner = () => {
    if (isTuning) {
      stopRecording();
      return;
    }
    startRecording();
  };

  /* ------------------------ RENDER ------------------------ */
  const needleDeg = useMemo(() => (cents / 50) * 50, [cents]);
  const standardTuning = TuningPresets["Standard (E A D G B E)"] || [];
  const noteLabel = displayNote ? displayNote.replace(/[0-9]/g, "") : "—";
  const centsWidth = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));
  const tunerStatus = serverOnlineRef.current
    ? "Server online"
    : isTuning
      ? "Connecting"
      : "Idle";

  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-[#efefef] px-3 pb-10 pt-4 sm:px-5 lg:px-8 ${
        isTouchLayout ? "pb-28" : ""
      }`}
    >
      <div className="container mx-auto">
        <div className="w-full pb-10 md:mx-auto md:w-11/12 2xl:w-9/12">
          <div className="mb-5 flex items-center gap-6 neuphormism-b p-5">
            <div>
              <h1 className="text-4xl font-bold">TUNER</h1>
            </div>
            <div className="ml-auto">
              <h4 className="max-w-[420px] text-right text-sm">
                Live pitch detection with a clean gauge, frequency readout, and a quick standard tuning reference.
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-start">
          <section className="order-1 flex min-h-[680px] flex-col rounded-[28px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:min-h-[760px] sm:p-5 neuphormism-b">
            <div className="flex flex-col gap-4">
              <div className="rounded-[24px] bg-[linear-gradient(145deg,#f4f4f4,#dddddd)] px-4 py-4 shadow-[6px_6px_14px_rgba(190,190,190,0.55),-6px_-6px_14px_rgba(255,255,255,0.9)] sm:px-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[goldenrod]">
                      Listening
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-black leading-none text-black sm:text-[2.35rem]">
                      {noteLabel}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_6px_12px_rgba(0,0,0,0.06)] neuphormism-b">
                    {tunerStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: "Frequency",
                    value: liveFreq ? `${liveFreq.toFixed(1)} Hz` : "No signal",
                  },
                  {
                    label: "Cents",
                    value: `${Math.round(cents)} cents`,
                  },
                  {
                    label: "Range",
                    value: "C0 to C8",
                  },
                  {
                    label: "Mode",
                    value: isTuning ? "Listening" : "Standby",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded bg-[#efefef] px-3 py-3 text-center shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] neuphormism-b sm:px-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#697180] sm:text-[11px] sm:tracking-[0.2em]">
                      {item.label}
                    </p>
                    <p className="mt-2 break-words text-xs font-black text-black sm:text-sm">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-1 flex-col rounded-[24px] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_18px_rgba(0,0,0,0.05)] sm:min-h-[520px] sm:p-5">
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="flex items-end gap-3 text-gray-500 sm:gap-6">
                  <span className="text-lg opacity-40 sm:text-3xl">A#</span>
                  <span className="text-2xl opacity-60 sm:text-4xl">B</span>
                  <span className="text-[72px] font-semibold leading-none text-[goldenrod] sm:text-[110px]">
                    {noteLabel}
                  </span>
                  <span className="text-2xl opacity-60 sm:text-4xl">C#</span>
                  <span className="text-lg opacity-40 sm:text-3xl">D</span>
                </div>

                <div className="mt-3 text-sm font-semibold text-[#697180] sm:text-lg">
                  {liveFreq ? `${liveFreq.toFixed(1)} Hz` : "No pitch detected"}
                </div>

                <div className="mt-8 relative h-[150px] w-[280px] sm:h-[170px] sm:w-[320px]">
                  <div className="absolute inset-0 top-[20px] flex items-end justify-center">
                    <div className="relative h-[130px] w-[260px] rounded-t-[260px] border-t-2 border-l-2 border-r-2 border-gray-600 sm:h-[150px] sm:w-[300px] sm:rounded-t-[300px]">
                      {[...Array(9)].map((_, i) => {
                        const angle = -50 + (i * 100) / 8;
                        return (
                          <div
                            key={i}
                            className="absolute left-1/2 h-5 w-[2px] origin-bottom"
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
                      <div className="absolute left-1/2 top-1 -translate-x-1/2 text-gray-400">
                        ||
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute bottom-[10px] left-1/2 h-[116px] w-1 origin-bottom sm:h-[135px]"
                    style={{
                      transform: `translateX(-50%) rotate(${needleDeg}deg)`,
                    }}
                  >
                    <div className="h-full w-[2px] bg-red-500" />
                  </div>
                </div>
              </div>

              <div className="mt-4 min-h-[120px]">
                <div className="h-full rounded-[22px] p-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm leading-6 text-[#4e5563]">
                      Range displayed: C0 ({MIN_UI_FREQ} Hz) to C8 ({MAX_UI_FREQ}{" "}
                      Hz).
                    </p>
                    <p className="text-sm leading-6 text-[#4e5563]">
                      Use a sustained note and keep the mic close for steadier
                      readings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              className={`mt-4 w-full rounded px-4 py-3 text-[12px] font-black uppercase tracking-[0.16em] transition ${
                isTuning
                  ? "bg-black text-[goldenrod]"
                  : "bg-[goldenrod] text-black shadow-[0_10px_18px_rgba(217,173,38,0.25)]"
              }`}
              type="button"
              onClick={toggleTuner}
            >
              {isTuning ? "Stop listening" : "Start listening"}
            </button>
          </section>

          <section className="order-2 rounded-[28px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:p-5 neuphormism-b">
            <p className="text-lg font-black uppercase text-black">
              Standard tuning
            </p>
            <div className="mt-4 grid gap-3">
              {standardTuning.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-[22px] bg-[#efefef] p-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black">
                        String {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#697180]">
                        {item.name}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_6px_12px_rgba(0,0,0,0.06)]">
                      {item.freq.toFixed(2)} Hz
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[22px] bg-[#efefef] p-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]">
              <p className="text-sm leading-6 text-[#4e5563]">
                The tuner UI follows the same card layout as the chord library,
                with the live note on the main panel and a quick reference panel
                alongside it.
              </p>
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
