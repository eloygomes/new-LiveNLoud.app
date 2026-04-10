import { useState, useEffect, useRef } from "react";
import MetronomeInput from "./MetronomeInput";
import clickSound from "../../../public/click.mp3";
import Stopwatch from "./Stopwatch";

const bpmList = [
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140,
  145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215,
  220, 225, 230, 235, 240,
];

function Metronome() {
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60); // segundos
  const [timeLeft, setTimeLeft] = useState(60);

  const [tapTimes, setTapTimes] = useState([]);

  const audioContextRef = useRef(null);
  const clickSoundBufferRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    const loadClickSound = async () => {
      try {
        const response = await fetch(clickSound);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
        const clickBuffer = await audioContext.decodeAudioData(arrayBuffer);

        audioContextRef.current = audioContext;
        clickSoundBufferRef.current = clickBuffer;

        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.connect(audioContext.destination);
      } catch (error) {
        console.error("Erro ao carregar o som de clique:", error);
      }
    };

    loadClickSound();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playClickSound = () => {
    if (audioContextRef.current && clickSoundBufferRef.current) {
      const clickSoundSource = audioContextRef.current.createBufferSource();
      clickSoundSource.buffer = clickSoundBufferRef.current;
      clickSoundSource.connect(gainNodeRef.current);
      clickSoundSource.start();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;

      intervalIdRef.current = setInterval(() => {
        setIsOn((prev) => !prev);
        playClickSound();
      }, interval);

      setIsOn(true);
      playClickSound();

      if (isTimerActive) {
        setTimeLeft(timerDuration);
        countdownIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              setIsPlaying(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      clearInterval(intervalIdRef.current);
      clearInterval(countdownIntervalRef.current);
      setIsOn(false);
    }

    return () => {
      clearInterval(intervalIdRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [isPlaying, bpm]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" || event.keyCode === 32) {
        event.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateTrack = (e) => {
      const input = e.target;
      const value = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty("--range-progress", `${value}%`);
    };

    const ranges = document.querySelectorAll(
      "input[type='range'].range-golden",
    );
    ranges.forEach((range) => {
      updateTrack({ target: range });
      range.addEventListener("input", updateTrack);
    });

    return () => {
      ranges.forEach((range) =>
        range.removeEventListener("input", updateTrack),
      );
    };
  }, []);

  const handlePlayClick = () => setIsPlaying((prev) => !prev);

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4);

    if (newTapTimes.length >= 2) {
      const intervals = newTapTimes.slice(1).map((t, i) => t - newTapTimes[i]);
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const estimatedBPM = Math.round(60000 / avgInterval);
      setBpm(estimatedBPM);
    }

    setTapTimes(newTapTimes);
  };

  const formatTime = (totalSeconds) => {
    const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const sec = String(totalSeconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  if (isTouchLayout) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-3">
        <div className="rounded-[24px] bg-[#e0e0e0] p-5 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
            # sustenido
          </div>
          <div className="mt-3 text-[2rem] font-black tracking-tight text-black">
            Metronome
          </div>
          <div className="mt-2 text-sm leading-5 text-gray-600">
            Choose your BPM, tap tempo, and keep time while rehearsing.
          </div>
        </div>

        <div className="mt-4 rounded-[24px] bg-[#e0e0e0] p-5 text-center shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
            {isPlaying ? "Playing" : "Ready"}
          </div>
          <div className="mt-3 text-[4rem] font-black leading-none text-black">
            {bpm}
          </div>
          <div className="mt-1 text-sm font-bold uppercase text-gray-500">
            BPM
          </div>
        </div>

        <div className="mt-4 rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-5 gap-2">
            {[
              ["-10", () => setBpm((current) => Math.max(30, current - 10))],
              ["-1", () => setBpm((current) => Math.max(30, current - 1))],
              ["TAP", handleTapTempo],
              ["+1", () => setBpm((current) => Math.min(240, current + 1))],
              ["+10", () => setBpm((current) => Math.min(240, current + 10))],
            ].map(([label, action]) => (
              <button
                key={label}
                type="button"
                className="rounded-[14px] bg-white px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-black"
                onClick={action}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[80, 100, 120, 140, 160, 180].map((preset) => (
              <button
                key={preset}
                type="button"
                className={`rounded-[14px] px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] ${
                  bpm === preset
                    ? "bg-[goldenrod] text-black"
                    : "bg-white text-gray-500"
                }`}
                onClick={() => setBpm(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`mt-4 w-full rounded-[16px] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] ${
              isPlaying
                ? "bg-black text-[goldenrod]"
                : "bg-[goldenrod] text-black"
            }`}
            onClick={handlePlayClick}
          >
            {isPlaying ? "Stop" : "Play"}
          </button>

          <div className="mt-4 text-center text-sm font-semibold text-gray-500">
            Timer: {formatTime(isTimerActive && isPlaying ? timeLeft : timerDuration)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center h-screen ">
      <div className="container mx-auto">
        <div className="w-11/12 2xl:w-9/12 mx-auto">
          {/* Cabeçalho */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">METRONOME</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Choose your BPM and hit Play!
            </h4>
          </div>

          <div className="w-full flex flex-row justify-between my-5 neuphormism-b p-5">
            {/* Lado A */}
            <div className="w-[49%] flex flex-col rounded-md neuphormism-b py-5 px-5 gap-6">
              {/* TIMER */}
              <div className="flex items-center justify-between mt-2 sm:pl-10 sm:pr-10 md:pl-0 md:pr-0 lg:pl-10 lg:pr-10 xl:pl-10 xl:pr-10  ">
                <button
                  onClick={() => setIsTimerActive((prev) => !prev)}
                  className={`flex items-center justify-center sm:pl-10 sm:pr-10 md:pl-5 md:pr-5 lg:pl-10 lg:pr-10 xl:pl-10 xl:pr-10 py-2 rounded-full text-md  transition button-neumorfismo-pingpong ${
                    isTimerActive
                      ? "bg-black text-[#DAA520]"
                      : "bg-white text-black"
                  }`}
                >
                  TIMER
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setTimerDuration((prev) => Math.max(prev - 10, 10))
                    }
                    // className="text-3xl w-10 h-10 bg-white text-black rounded-full shadow"
                    className="px-5 rounded-full flex items-center justify-center bg-white text-black text-2xl shadow transition-all duration-100 active:scale-95 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="text-xl font-mono">
                    {formatTime(
                      isTimerActive && isPlaying ? timeLeft : timerDuration,
                    )}
                  </span>
                  <button
                    onClick={() => setTimerDuration((prev) => prev + 10)}
                    className="px-5 rounded-full flex items-center justify-center bg-white text-black text-2xl shadow transition-all duration-100 active:scale-95 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className={`p-10 w-[90%] mx-auto rounded-md mt-0 transition-colors duration-100 ${
                  isOn ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <h1 className="text-[150px]">{bpm}</h1>
                  <h1 className="text-xl">bpm</h1>
                </div>
              </div>
              {/* Linha de controle BPM */}
              <div className="flex items-center justify-between sm:pl-10 sm:pr-10 md:pl-0 md:pr-0 lg:pl-10 lg:pr-10 xl:pl-10 xl:pr-10  ">
                <button
                  onClick={() => setBpm((prev) => Math.max(prev - 1, 1))}
                  className="px-5 rounded-full flex items-center justify-center bg-white text-black text-2xl shadow transition-all duration-100 active:scale-95 hover:bg-gray-100"
                >
                  -
                </button>

                <input
                  type="range"
                  min={40}
                  max={240}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full range-golden mx-w-[400px] mx-4"
                />

                <button
                  onClick={() => setBpm((prev) => Math.min(prev + 1, 240))}
                  className="px-5 rounded-full flex items-center justify-center bg-white text-black text-2xl shadow transition-all duration-100 active:scale-95 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-4 sm:pl-10 sm:pr-10 md:pl-2 md:pr-2 lg:pl-10 lg:pr-10 xl:pl-10 xl:pr-10  ">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full range-golden"
                />

                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="w-8 h-8 rounded-full bg-white text-black text-xs shadow"
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
              </div>

              {/* Botões: Play + Tap */}
              <div className="flex justify-between gap-4 sm:pl-10 sm:pr-10 md:pl-0 md:pr-0 lg:pl-10 lg:pr-10 xl:pl-10 xl:pr-10  py-2">
                <button
                  onClick={handlePlayClick}
                  className="flex-1 pl-10 pr-10 rounded-full   neuphormism-b-se bg-white text-black text-md"
                >
                  {isPlaying ? "Parar" : "Play!"}
                </button>

                <button
                  onClick={handleTapTempo}
                  className="flex-1 pl-10 pr-10 py-2 rounded-full   neuphormism-b-se bg-white text-black "
                >
                  Tap Tempo
                </button>
              </div>

              {/* Display BPM */}
            </div>

            {/* Lado B */}
            <div className="w-[49%]">
              <Stopwatch />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Metronome;
