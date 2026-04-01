import { useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import DraggableComponent from "./DraggableComponent";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNoteData(frequency) {
  if (!frequency || !Number.isFinite(frequency) || frequency <= 0) {
    return null;
  }

  const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
  const noteIndex = ((midi % 12) + 12) % 12;
  const note = NOTE_NAMES[noteIndex];
  const targetFrequency = 440 * 2 ** ((midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(frequency / targetFrequency));

  return {
    cents,
    frequency,
    note,
    octave: Math.floor(midi / 12) - 1,
    targetFrequency,
  };
}

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  let rms = 0;

  for (let i = 0; i < size; i += 1) {
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / size);
  if (rms < 0.01) {
    return -1;
  }

  let r1 = 0;
  let r2 = size - 1;
  const threshold = 0.2;

  for (let i = 0; i < size / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < size / 2; i += 1) {
    if (Math.abs(buffer[size - i]) < threshold) {
      r2 = size - i;
      break;
    }
  }

  const trimmed = buffer.slice(r1, r2);
  const trimmedSize = trimmed.length;
  const correlations = new Array(trimmedSize).fill(0);

  for (let offset = 0; offset < trimmedSize; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < trimmedSize - offset; i += 1) {
      correlation += trimmed[i] * trimmed[i + offset];
    }
    correlations[offset] = correlation;
  }

  let bestOffset = -1;
  let bestCorrelation = 0;

  for (let offset = 1; offset < trimmedSize; offset += 1) {
    if (correlations[offset] > bestCorrelation) {
      bestCorrelation = correlations[offset];
      bestOffset = offset;
    }
  }

  if (bestOffset <= 0) {
    return -1;
  }

  const prev = correlations[bestOffset - 1] || 0;
  const current = correlations[bestOffset] || 0;
  const next = correlations[bestOffset + 1] || 0;
  const shift = current ? (next - prev) / (2 * current) : 0;

  return sampleRate / (bestOffset + shift);
}

export default function ToolBoxTunerMini() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [detectedNote, setDetectedNote] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const stopListening = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);
  };

  useEffect(() => stopListening, []);

  const startListening = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      streamRef.current = stream;
      setIsListening(true);

      const sampleBuffer = new Float32Array(analyser.fftSize);

      const updatePitch = () => {
        if (!analyserRef.current || !audioContextRef.current) {
          return;
        }

        analyserRef.current.getFloatTimeDomainData(sampleBuffer);
        const frequency = autoCorrelate(
          sampleBuffer,
          audioContextRef.current.sampleRate
        );

        if (frequency > 0) {
          setDetectedNote(frequencyToNoteData(frequency));
        }

        rafRef.current = requestAnimationFrame(updatePitch);
      };

      rafRef.current = requestAnimationFrame(updatePitch);
    } catch (captureError) {
      console.error("Unable to start tuner microphone:", captureError);
      setError("Mic unavailable");
      stopListening();
    }
  };

  const meterData = useMemo(() => {
    const cents = detectedNote?.cents ?? 0;
    const clamped = Math.max(-50, Math.min(50, cents));
    const leftWidth = clamped < 0 ? `${Math.abs(clamped)}%` : "0%";
    const rightWidth = clamped > 0 ? `${clamped}%` : "0%";
    const status =
      Math.abs(clamped) <= 5 ? "in tune" : clamped < 0 ? "flat" : "sharp";

    return { leftWidth, rightWidth, status };
  }, [detectedNote]);

  return (
    <>
      <div className="p-2 rounded-md mb-2 neuphormism-b">
        <div className="flex min-h-44 flex-col justify-between gap-3">
          <button
            type="button"
            className="flex flex-col items-center gap-2 rounded-md bg-white/60 py-3 text-center"
            onClick={() => setIsPreviewOpen(true)}
          >
            <div className="text-2xl font-bold leading-none">
              {detectedNote ? `${detectedNote.note}${detectedNote.octave}` : "--"}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">
              {isListening ? meterData.status : "idle"}
            </div>
          </button>

          <button
            type="button"
            className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
              isListening
                ? "neuphormism-b-btn-red-discard"
                : "neuphormism-b-btn-green"
            }`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? "stop" : "listen"}
          </button>

          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>-50</span>
              <span>0</span>
              <span>+50</span>
            </div>
            <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="absolute right-1/2 top-0 h-full bg-amber-400"
                style={{ width: meterData.leftWidth }}
              />
              <div
                className="absolute left-1/2 top-0 h-full bg-red-400"
                style={{ width: meterData.rightWidth }}
              />
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-700" />
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[10px] text-gray-600">
            <div className="rounded-md bg-white/70 px-2 py-1 text-center">
              {detectedNote ? `${detectedNote.frequency.toFixed(1)} Hz` : "No signal"}
            </div>
            <div className="rounded-md bg-white/70 px-2 py-1 text-center">
              {detectedNote ? `${detectedNote.cents > 0 ? "+" : ""}${detectedNote.cents} cents` : "Waiting"}
            </div>
          </div>

          {error ? <div className="text-[10px] text-red-500">{error}</div> : null}
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed right-44 bottom-20 z-[60]" style={{ width: 280 }}>
          <DraggableComponent
            handle=".drag-handle"
            defaultPosition={{ x: 0, y: 0 }}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="drag-handle flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-bold cursor-move select-none">
                <span>Tuner</span>
                <button
                  type="button"
                  className="cursor-pointer"
                  aria-label="Close tuner window"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 bg-[#f7f7f7] p-6">
                <div className="text-6xl font-bold leading-none">
                  {detectedNote ? `${detectedNote.note}${detectedNote.octave}` : "--"}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  {isListening ? meterData.status : "idle"}
                </div>
                <div className="w-full">
                  <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="absolute right-1/2 top-0 h-full bg-amber-400"
                      style={{ width: meterData.leftWidth }}
                    />
                    <div
                      className="absolute left-1/2 top-0 h-full bg-red-400"
                      style={{ width: meterData.rightWidth }}
                    />
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-700" />
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="rounded-md bg-white px-2 py-2 text-center">
                    {detectedNote ? `${detectedNote.frequency.toFixed(1)} Hz` : "No signal"}
                  </div>
                  <div className="rounded-md bg-white px-2 py-2 text-center">
                    {detectedNote ? `${detectedNote.cents > 0 ? "+" : ""}${detectedNote.cents} cents` : "Waiting"}
                  </div>
                </div>
              </div>
              <div className="drag-handle bg-gray-500 px-3 py-1 text-center text-[8px] font-bold text-white cursor-move select-none">
                Click and hold to drag
              </div>
            </div>
          </DraggableComponent>
        </div>
      ) : null}
    </>
  );
}
