import { useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import DraggableComponent from "./DraggableComponent";
import {
  INSTRUMENT_TUNINGS,
  MAX_UI_FREQ,
  MIN_UI_FREQ,
  NOTE_FREQS,
} from "../Tuner/TunerData";

const DEFAULT_CFG = {
  BUFFER_SIZE: 2048,
  LOWCUT_HZ: 20,
  HIGHCUT_HZ: 5000,
};

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
  if (!note) return "--";
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
  if (!hasSignal) return "Waiting";
  if (Math.abs(centsValue) <= 5) return "In Tune";
  return centsValue < 0 ? "Tune Up" : "Tune Down";
}

export default function ToolBoxTunerMini() {
  const [isTuning, setIsTuning] = useState(false);
  const [error, setError] = useState("");
  const [displayNote, setDisplayNote] = useState("");
  const [liveFreq, setLiveFreq] = useState(null);
  const [cents, setCents] = useState(0);
  const [instrumentType, setInstrumentType] = useState("Guitar");
  const [tuningName, setTuningName] = useState("Standard");
  const [autoDetectString, setAutoDetectString] = useState(true);
  const [selectedStringIndex, setSelectedStringIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const workerRef = useRef(null);
  const mediaRef = useRef({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });
  const tunerSettingsRef = useRef({
    autoDetectString: true,
    selectedStringIndex: 0,
    strings: INSTRUMENT_TUNINGS.Guitar.Standard,
  });

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

  const stopRecording = () => {
    const { stream, audioContext, source, processor } = mediaRef.current;

    try {
      if (processor) processor.disconnect();
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (workerRef.current) workerRef.current.terminate();
    } catch {}

    workerRef.current = null;
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

  useEffect(() => stopRecording, []);

  const startRecording = async () => {
    const { BUFFER_SIZE, LOWCUT_HZ, HIGHCUT_HZ } = DEFAULT_CFG;

    if (!window.isSecureContext) {
      setError("Use HTTPS or localhost");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Mic unavailable");
      return;
    }

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 44100,
        },
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const worker = new Worker(new URL("../Tuner/audio-worker.js", import.meta.url), {
        type: "module",
      });

      workerRef.current = worker;
      worker.postMessage({
        type: "INIT",
        data: {
          sampleRate: audioContext.sampleRate,
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

      const source = audioContext.createMediaStreamSource(stream);
      const highpass = audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = LOWCUT_HZ;
      highpass.Q.value = 0.707;

      const lowpass = audioContext.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = HIGHCUT_HZ;
      lowpass.Q.value = 0.707;

      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processor.onaudioprocess = (event) => {
        try {
          const input = event.inputBuffer.getChannelData(0);
          workerRef.current?.postMessage({
            type: "PROCESS",
            data: new Float32Array(input),
          });
        } catch {}
      };

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(processor);
      processor.connect(audioContext.destination);

      mediaRef.current = { stream, audioContext, source, processor };
      setIsTuning(true);
      setDisplayNote("");
      setLiveFreq(null);
      setCents(0);
    } catch (captureError) {
      console.error("Unable to start tuner microphone:", captureError);
      setError("Mic unavailable");
      stopRecording();
    }
  };

  const toggleTuner = () => {
    if (isTuning) {
      stopRecording();
      return;
    }
    startRecording();
  };

  const noteLabel = getCleanNoteName(displayNote || targetString?.name);
  const targetFrequency = targetString?.freq || null;
  const indicatorLeft = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));
  const tuneMessage = getTuneMessage(cents, Boolean(liveFreq));
  const tunerStatus = isTuning ? "Listening" : "Idle";

  const renderMeter = (heightClass = "h-3") => (
    <div>
      <div className={`relative ${heightClass}`}>
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]" />
        {[-50, -25, 0, 25, 50].map((mark) => (
          <span
            key={mark}
            className={`absolute top-0 h-full w-[2px] rounded-full ${mark === 0 ? "bg-[goldenrod]" : "bg-[#697180]/50"}`}
            style={{ left: `${((mark + 50) / 100) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-[-3px] h-[calc(100%+6px)] w-[4px] -translate-x-1/2 rounded-full bg-black transition-all"
          style={{ left: `${indicatorLeft}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[8px] font-black uppercase tracking-[0.12em] text-[#697180]">
        <span>Flat</span>
        <span>{Math.round(cents)}c</span>
        <span>Sharp</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-2 rounded-md p-2 neuphormism-b">
        <div className="flex min-h-44 flex-col justify-between gap-3">
          <button
            type="button"
            className="rounded-[18px] px-2 py-3 text-center neuphormism-b"
            onClick={() => setIsPreviewOpen(true)}
          >
            <div className="text-[2.4rem] font-black leading-none tracking-[-0.08em] text-black">
              {noteLabel}
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#697180]">
              {tunerStatus} · {tuneMessage}
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="neuphormism-b-btn h-8 rounded-[12px] bg-[#efefef] px-2 text-[10px] font-bold text-black outline-none"
              value={instrumentType}
              onChange={(event) => setInstrumentType(event.target.value)}
            >
              {instrumentOptions.map((instrument) => (
                <option key={instrument} value={instrument}>
                  {instrument}
                </option>
              ))}
            </select>
            <select
              className="neuphormism-b-btn h-8 rounded-[12px] bg-[#efefef] px-2 text-[10px] font-bold text-black outline-none"
              value={tuningName}
              onChange={(event) => setTuningName(event.target.value)}
            >
              {tuningOptions.map((tuning) => (
                <option key={tuning} value={tuning}>
                  {tuning}
                </option>
              ))}
            </select>
          </div>

          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${Math.min(currentStrings.length, 6)}, minmax(0, 1fr))`,
            }}
          >
            {currentStrings.map((string, index) => {
              const isSelected = index === selectedStringIndex;
              return (
                <button
                  key={`${string.name}-${index}`}
                  type="button"
                  className={`rounded-[10px] px-1 py-1 text-[10px] font-black ${
                    isSelected
                      ? "neuphormism-b-btn-gold text-black"
                      : "neuphormism-b-btn text-black"
                  }`}
                  onClick={() => {
                    setAutoDetectString(false);
                    setSelectedStringIndex(index);
                    setDisplayNote(string.name);
                    setCents(0);
                  }}
                >
                  {getCleanNoteName(string.name)}
                </button>
              );
            })}
          </div>

          {renderMeter()}

          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[#697180]">
            <div className="rounded-md px-2 py-1 text-center neuphormism-b">
              {liveFreq ? `${liveFreq.toFixed(1)} Hz` : "No signal"}
            </div>
            <button
              type="button"
              className={`rounded-md px-2 py-1 text-center ${
                autoDetectString
                  ? "neuphormism-b-btn-gold text-black"
                  : "neuphormism-b-btn text-black"
              }`}
              onClick={() => setAutoDetectString((current) => !current)}
            >
              {autoDetectString ? "Auto" : "Manual"}
            </button>
          </div>

          <button
            type="button"
            className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${
              isTuning
                ? "bg-black text-[goldenrod] shadow-[0_8px_16px_rgba(0,0,0,0.16)]"
                : "neuphormism-b-btn-gold text-black"
            }`}
            onClick={toggleTuner}
          >
            {isTuning ? "Stop" : "Start"}
          </button>

          {error ? <div className="text-[10px] text-red-500">{error}</div> : null}
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed bottom-20 right-44 z-[60]" style={{ width: 320 }}>
          <DraggableComponent
            handle=".drag-handle"
            defaultPosition={{ x: 0, y: 0 }}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="drag-handle flex cursor-move select-none items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-bold">
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
              <div className="flex flex-col items-center justify-center gap-4 bg-[#f7f7f7] p-6">
                <div className="text-7xl font-black leading-none tracking-[-0.08em] text-black">
                  {noteLabel}
                </div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                  {tunerStatus} · {tuneMessage}
                </div>
                <div className="w-full">{renderMeter("h-6")}</div>
                <div className="grid w-full grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="rounded-md bg-white px-2 py-2 text-center">
                    {liveFreq ? `${liveFreq.toFixed(2)} Hz` : "No signal"}
                  </div>
                  <div className="rounded-md bg-white px-2 py-2 text-center">
                    Target:{" "}
                    {targetFrequency ? `${targetFrequency.toFixed(2)} Hz` : "--"}
                  </div>
                </div>
              </div>
              <div className="drag-handle cursor-move select-none bg-gray-500 px-3 py-1 text-center text-[8px] font-bold text-white">
                Click and hold to drag
              </div>
            </div>
          </DraggableComponent>
        </div>
      ) : null}
    </>
  );
}
