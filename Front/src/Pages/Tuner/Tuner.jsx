// Tuner.jsx — FRONT exibindo dados do backend, sem afinação manual
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

/* ------------------------------------------------------------------
   🔌 SOCKET
   ------------------------------------------------------------------ */
const SOCKET_URL = "https://api.live.eloygomes.com.br";
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
          "blocos"
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
            ")"
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

          {/* DISPLAY */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start w-[90%] mx-auto rounded-md mb-2">
              <div className="p-10 w-[90%] mx-auto rounded-md mb-2 neuphormism-b">
                <div className="flex flex-col items-center justify-center select-none">
                  {/* Linha superior (indicativa) */}
                  <div className="flex items-end gap-6 mb-2 text-gray-500">
                    <span className="text-3xl opacity-40">A#</span>
                    <span className="text-4xl opacity-60">B</span>
                    <span className="text-[110px] leading-none text-red-500 font-semibold">
                      {displayNote ? displayNote.replace(/[0-9]/g, "") : "—"}
                    </span>
                    <span className="text-4xl opacity-60">C#</span>
                    <span className="text-3xl opacity-40">D</span>
                  </div>

                  {/* Frequência do backend */}
                  <div className="text-lg mb-6 opacity-80">
                    {liveFreq ? `${liveFreq.toFixed(1)} Hz` : "—"}
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
                              className="absolute w-[2px] h-5 origin-bottom left-1/2"
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
                        transform: `translateX(-50%) rotate(${needleDeg}deg)`,
                      }}
                    >
                      <div className="w-[2px] h-full bg-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé simples C0–C8 (informativo) */}
              <div className="w-[90%] mx-auto text-center text-sm opacity-60">
                Faixa exibida: C0 (16.35 Hz) até C8 (4186.01 Hz)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
