import { useEffect, useRef, useState } from "react";
import {
  FaClock,
  FaMinus,
  FaPause,
  FaPlus,
  FaPlay,
  FaRegHandPaper,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import Stopwatch from "./Stopwatch";
import { useCompactAppLayout } from "../../Tools/responsiveLayout";
import TabletToolShell from "../../components/TabletToolShell";

const BPM_MIN = 40;
const BPM_MAX = 300;
const clickSound = "/click.mp3";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function Metronome() {
  const isCompactLayout = useCompactAppLayout();
  const isTabletLayout =
    isCompactLayout &&
    typeof window !== "undefined" &&
    window.innerWidth >= 768;
  const isTouchLayout = isCompactLayout && !isTabletLayout;
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [tapTimes, setTapTimes] = useState([]);
  const [isBeatActive, setIsBeatActive] = useState(false);

  const audioContextRef = useRef(null);
  const clickSoundBufferRef = useRef(null);
  const clickAudioElementRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const audioUnlockedRef = useRef(false);

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
        clickAudioElementRef.current = new Audio(clickSound);
        clickAudioElementRef.current.preload = "auto";
        clickAudioElementRef.current.playsInline = true;
        clickAudioElementRef.current.setAttribute("playsinline", "");
        clickAudioElementRef.current.setAttribute("webkit-playsinline", "");
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
  }, [isMuted, volume]);

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
  }, [bpm, isMuted, volume, timerDuration]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" || event.keyCode === 32) {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest(
            "button, input, select, textarea, a[href], [contenteditable='true']",
          )
        ) {
          return;
        }
        event.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const playClickSound = () => {
    setIsBeatActive((current) => !current);

    if (isMuted) return;

    if (
      audioContextRef.current &&
      clickSoundBufferRef.current &&
      audioContextRef.current.state === "running"
    ) {
      const clickSoundSource = audioContextRef.current.createBufferSource();
      clickSoundSource.buffer = clickSoundBufferRef.current;
      clickSoundSource.connect(gainNodeRef.current);
      clickSoundSource.start();
      return;
    }

    if (clickAudioElementRef.current) {
      clickAudioElementRef.current.currentTime = 0;
      clickAudioElementRef.current.volume = volume;
      clickAudioElementRef.current.play().catch(() => {});
    }
  };

  const unlockAudio = async () => {
    try {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (clickAudioElementRef.current && !audioUnlockedRef.current) {
        const audio = clickAudioElementRef.current;
        audio.muted = true;
        audio.currentTime = 0;
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audioUnlockedRef.current = true;
      }
    } catch (error) {
      console.error("Erro ao destravar áudio:", error);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;

      intervalIdRef.current = setInterval(() => {
        playClickSound();
      }, interval);

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
      } else {
        setTimeLeft(timerDuration);
      }
    } else {
      clearInterval(intervalIdRef.current);
      clearInterval(countdownIntervalRef.current);
      if (!isTimerActive) {
        setTimeLeft(timerDuration);
      }
    }

    return () => {
      clearInterval(intervalIdRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [bpm, isPlaying, isTimerActive, timerDuration]);

  const adjustBpm = (delta) => {
    setBpm((current) => clamp(current + delta, BPM_MIN, BPM_MAX));
  };

  const handlePlayClick = async () => {
    await unlockAudio();
    setIsPlaying((prev) => !prev);
  };

  const handleTapTempo = async () => {
    await unlockAudio();
    const now = Date.now();
    const nextTapTimes = [...tapTimes, now].slice(-4);

    if (nextTapTimes.length >= 2) {
      const intervals = nextTapTimes
        .slice(1)
        .map((time, index) => time - nextTapTimes[index])
        .filter((interval) => interval > 120 && interval < 3000);

      if (intervals.length) {
        const average =
          intervals.reduce((total, interval) => total + interval, 0) /
          intervals.length;
        setBpm(clamp(Math.round(60000 / average), BPM_MIN, BPM_MAX));
      }
    }

    setTapTimes(nextTapTimes);
  };

  const adjustTimer = (delta) => {
    setTimerDuration((current) => {
      const next = Math.max(current + delta, 10);
      if (!isPlaying || !isTimerActive) {
        setTimeLeft(next);
      }
      return next;
    });
  };

  const formatTime = (totalSeconds) => {
    const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const sec = String(totalSeconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const displayedTimer = isTimerActive && isPlaying ? timeLeft : timerDuration;
  const bpmButtonClass =
    "neuphormism-b-btn flex min-h-[22px] items-center justify-center rounded-[18px] px-4 text-sm font-bold uppercase tracking-[0.14em] text-black active:scale-[0.98]";
  const desktopSmallButtonClass = `neuphormism-b-btn flex ${isTouchLayout ? "h-[34px]" : "h-[64px]"} items-center justify-center rounded-[18px] px-3 text-[1.05rem] font-bold uppercase tracking-[0.08em] text-black active:scale-[0.98]`;
  const desktopTAPButtonClass = `neuphormism-b-btn flex ${isTouchLayout ? "h-[34px]" : "h-[64px]"} items-center justify-center rounded-[18px] px-3 text-[.9rem] font-bold uppercase tracking-[0.08em] text-black active:scale-[0.98]`;
  const desktopMINUSPLUSButtonClass = `neuphormism-b-btn flex ${isTouchLayout ? "h-[34px]" : "h-[64px]"} items-center justify-center rounded-[18px] px-3 text-[1.05rem] font-bold uppercase tracking-[0.08em] text-black active:scale-[0.98]`;

  const renderSlider = ({
    iconStart,
    iconEnd,
    label,
    min,
    max,
    step,
    value,
    onChange,
    thin = false,
    hideButtons = false,
    vertical = false,
  }) => (
    <div
      className={`neuphormism-b ${isTouchLayout ? "rounded-[16px] px-3 py-3" : "rounded-[24px]"} ${vertical ? "flex h-full min-h-0 flex-col items-center justify-between overflow-hidden px-3 py-5" : isTouchLayout ? "" : "px-4 py-4"}`}
    >
      {label === "Tempo" && (
        <div
            className={`grid gap-2 mt-0 mb-3 ${
            isTouchLayout ? "grid-cols-4 " : "grid-cols-5"
          }`}
        >
          <button
            type="button"
            className={`${desktopMINUSPLUSButtonClass} text-3xl`}
            onClick={() => adjustBpm(-1)}
          >
            -
          </button>
          <button
            type="button"
            className={desktopSmallButtonClass}
            onClick={() => adjustBpm(-10)}
          >
            -10
          </button>

          {!isTouchLayout && (
            <button
              type="button"
              className={desktopTAPButtonClass}
              onClick={handleTapTempo}
            >
              tap tempo
            </button>
          )}

          <button
            type="button"
            className={desktopSmallButtonClass}
            onClick={() => adjustBpm(10)}
          >
            +10
          </button>
          <button
            type="button"
            className={`${desktopMINUSPLUSButtonClass} text-3xl`}
            onClick={() => adjustBpm(1)}
          >
            +
          </button>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
          {label}
        </span>
        {label === "Tempo" && (
          <span className="text-sm font-bold text-black">
            {label === "Volume"
              ? `${Math.round(value * 100)}%`
              : `${value} BPM`}
          </span>
        )}
      </div>
      <div
        className={`flex ${vertical ? "min-h-0 flex-1 flex-col items-center justify-center gap-4" : "items-center gap-3"}`}
      >
        {!hideButtons ? (
          <div
            className="neuphormism-b-avatar flex h-10 w-10 items-center justify-center text-[goldenrod]"
            onClick={() => {
              if (label === "Volume") {
                const nextVolume = Math.max(0, value - 0.1);
                setVolume(nextVolume);
                if (nextVolume === 0) {
                  setIsMuted(true);
                }
              } else {
                adjustBpm(-1);
              }
            }}
          >
            {iconStart}
          </div>
        ) : null}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className={`range-golden appearance-none bg-transparent ${thin ? "range-golden-thin" : ""} ${vertical ? "range-golden-vertical !h-full min-h-0 w-5" : "w-full"}`}
        />
        {!hideButtons ? (
          <div
            className="neuphormism-b-avatar flex h-10 w-10 items-center justify-center text-black"
            onClick={() => {
              if (label === "Volume") {
                const nextVolume = Math.min(1, value + 0.1);
                setVolume(nextVolume);
                if (nextVolume > 0 && isMuted) {
                  setIsMuted(false);
                } else if (nextVolume === 0) {
                  setIsMuted(true);
                }
              } else {
                adjustBpm(1);
              }
            }}
          >
            {iconEnd}
          </div>
        ) : null}
      </div>
      {label === "Volume" && (
        <span className="text-sm font-bold text-black">
          {label === "Volume" ? `${Math.round(value * 100)}%` : `${value} BPM`}
        </span>
      )}
    </div>
  );

  if (isTabletLayout) {
    return (
      <TabletToolShell
        eyebrow="Tempo & timing"
        title="Turn a steady pulse into a repeatable practice habit."
        description="Shape the tempo, set a focused countdown and capture lap times without leaving the beat. Every primary control stays visible so changes remain immediate while you play."
        artIndex={3}
        artLabel="Metronome practice illustration"
        compactHeader
        badges={[
          `${bpm} BPM`,
          isTimerActive ? `${formatTime(displayedTimer)} timer` : "Open session",
          `${Math.round((isMuted ? 0 : volume) * 100)}% volume`,
        ]}
      >
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.72fr)] gap-4">
          <section className="neuphormism-b flex min-h-0 flex-col gap-3 overflow-hidden rounded-[24px] p-4">
            <div className="shrink-0 rounded-[18px] bg-white/70 p-4" aria-label="Focus timer controls">
              <div className="grid grid-cols-[minmax(8rem,1fr)_auto_minmax(10rem,1.1fr)] items-center gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
                      Focus timer
                    </p>
                    <h2 className="mt-1 text-[1rem] font-bold text-black">
                      Give this run a finish line.
                    </h2>
                    <p className="mt-1 text-[11px] font-semibold leading-[1rem] text-gray-500">
                      When active, playback stops automatically at zero.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`min-h-11 shrink-0 rounded-[13px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      isTimerActive
                        ? "neuphormism-b-btn-gold text-black"
                        : "neuphormism-b-btn text-gray-600"
                    }`}
                    onClick={() => {
                      setIsTimerActive((current) => {
                        const next = !current;
                        if (!next) setTimeLeft(timerDuration);
                        return next;
                      });
                    }}
                    aria-pressed={isTimerActive}
                  >
                    {isTimerActive ? "Timer on" : "Timer off"}
                  </button>
                <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-2">
                  <button
                    type="button"
                    className="neuphormism-b-btn min-h-11 rounded-[12px] text-[11px] font-bold"
                    onClick={() => adjustTimer(-10)}
                    aria-label="Reduce timer by ten seconds"
                  >
                    -10
                  </button>
                  <div className="text-center text-[1.7rem] font-bold tracking-[-0.055em] text-black">
                    {formatTime(displayedTimer)}
                  </div>
                  <button
                    type="button"
                    className="neuphormism-b-btn min-h-11 rounded-[12px] text-[11px] font-bold"
                    onClick={() => adjustTimer(10)}
                    aria-label="Add ten seconds to timer"
                  >
                    +10
                  </button>
                </div>
            </div>
            </div>

            <div className="shrink-0 rounded-[18px] bg-white/70 p-4" aria-label="Volume controls">
              <div className="grid grid-cols-[minmax(0,0.75fr)_minmax(18rem,1.25fr)] items-center gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
                      Listening level
                    </p>
                    <h2 className="mt-1 text-[1rem] font-bold text-black">
                      Hear the click, not the controls.
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="neuphormism-b-btn flex min-h-11 min-w-11 items-center justify-center rounded-[12px]"
                    onClick={() => setIsMuted((current) => !current)}
                    aria-label={isMuted ? "Unmute metronome" : "Mute metronome"}
                    aria-pressed={isMuted}
                  >
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <FaVolumeMute className="shrink-0 text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(event) => {
                      const nextVolume = Number(event.target.value);
                      setVolume(nextVolume);
                      setIsMuted(nextVolume === 0);
                    }}
                    aria-label="Metronome volume"
                    className="range-golden w-full appearance-none bg-transparent"
                  />
                  <span className="w-10 shrink-0 text-right text-[11px] font-bold text-gray-600">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`flex min-h-[14rem] flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] px-6 py-5 text-center transition-colors duration-100 ${
                isBeatActive ? "bg-white text-black" : "bg-[#111] text-white"
              }`}
              aria-live="polite"
              data-testid="tablet-bpm-panel"
              data-beat-active={isBeatActive}
            >
                <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isBeatActive ? "text-black/65" : "text-[goldenrod]"}`}>
                  {isPlaying ? "Pulse running" : "Ready for your first count"}
                </p>
                <div className="mt-2 text-[clamp(6rem,13vw,9rem)] font-bold leading-[0.82] tracking-[-0.09em]">
                  {bpm}
                </div>
                <div className={`mt-3 text-[0.78rem] font-bold uppercase tracking-[0.3em] ${isBeatActive ? "text-black/60" : "text-gray-400"}`}>
                  beats per minute
                </div>
            </div>

            <div className="neuphormism-b shrink-0 rounded-[18px] px-4 py-3" aria-label="Tempo range controls">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    Tempo range
                  </span>
                  <span className="text-[11px] font-bold text-black">
                    {BPM_MIN}–{BPM_MAX} BPM
                  </span>
                </div>
                <div className="grid grid-cols-[2.75rem_3.5rem_minmax(0,1fr)_3.5rem_2.75rem] items-center gap-2">
                  {[
                    ["−", -1, "Reduce tempo by one BPM"],
                    ["−10", -10, "Reduce tempo by ten BPM"],
                  ].map(([label, delta, ariaLabel]) => (
                    <button
                      key={label}
                      type="button"
                      className="neuphormism-b-btn min-h-11 rounded-[11px] text-[11px] font-bold"
                      onClick={() => adjustBpm(delta)}
                      aria-label={ariaLabel}
                    >
                      {label}
                    </button>
                  ))}
                  <input
                    type="range"
                    min={BPM_MIN}
                    max={BPM_MAX}
                    step="1"
                    value={bpm}
                    onChange={(event) => setBpm(Number(event.target.value))}
                    aria-label="Tempo in beats per minute"
                    className="range-golden w-full appearance-none bg-transparent"
                  />
                  {[
                    ["+10", 10, "Increase tempo by ten BPM"],
                    ["+", 1, "Increase tempo by one BPM"],
                  ].map(([label, delta, ariaLabel]) => (
                    <button
                      key={label}
                      type="button"
                      className="neuphormism-b-btn min-h-11 rounded-[11px] text-[11px] font-bold"
                      onClick={() => adjustBpm(delta)}
                      aria-label={ariaLabel}
                    >
                      {label}
                    </button>
                  ))}
                </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3" aria-label="Playback controls">
              <button
                type="button"
                className={`flex min-h-14 items-center justify-center gap-2 rounded-[18px] text-[10px] font-bold uppercase tracking-[0.1em] ${
                  isPlaying
                    ? "bg-black text-[goldenrod] shadow-lg"
                    : "neuphormism-b-btn-gold text-black"
                }`}
                onClick={handlePlayClick}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <FaPause className="text-[1rem]" /> : <FaPlay className="text-[1rem]" />}
                {isPlaying ? "Stop" : "Play"}
              </button>
              <button
                type="button"
                className="neuphormism-b-btn flex min-h-14 items-center justify-center gap-2 rounded-[18px] text-[10px] font-bold uppercase tracking-[0.1em]"
                onClick={handleTapTempo}
              >
                <FaRegHandPaper className="text-[1rem]" />
                Tap
              </button>
            </div>
          </section>

          <aside className="min-h-0">
            <Stopwatch variant="tablet" bpm={bpm} />
          </aside>
        </div>
      </TabletToolShell>
    );
  }

  if (isTouchLayout) {
    return (
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col bg-[#f4f3ef] px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-2.5">
          <header className="rounded-[18px] border border-black/[0.055] bg-white/80 px-4 py-3 shadow-[0_9px_22px_rgba(0,0,0,0.065)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">Tempo & timing</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <h1 className="text-[1.35rem] font-bold leading-none tracking-[-0.04em] text-black">Keep the pulse.</h1>
              <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-gray-500">40–300 BPM</span>
            </div>
          </header>

          <section className="rounded-[16px] border border-black/[0.05] bg-white/75 p-3 shadow-[0_9px_22px_rgba(0,0,0,0.06)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">Focus timer</span>
              <button type="button" aria-pressed={isTimerActive} className={`h-9 rounded-[10px] px-3 text-[9px] font-bold uppercase tracking-[0.1em] ${isTimerActive ? "bg-[goldenrod] text-black" : "bg-[#f0efeb] text-gray-600"}`} onClick={() => setIsTimerActive((current) => { const next = !current; if (!next) setTimeLeft(timerDuration); return next; })}>
                {isTimerActive ? "On" : "Off"}
              </button>
            </div>
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
              <button type="button" className="h-9 rounded-[10px] bg-[#f0efeb] text-[10px] font-bold" onClick={() => adjustTimer(-10)} aria-label="Reduce timer by ten seconds">−10</button>
              <p className="text-center text-[1.35rem] font-bold leading-none tracking-[-0.05em] text-black">{formatTime(displayedTimer)}</p>
              <button type="button" className="h-9 rounded-[10px] bg-[#f0efeb] text-[10px] font-bold" onClick={() => adjustTimer(10)} aria-label="Add ten seconds to timer">+10</button>
            </div>
          </section>

          <section
            className={`flex min-h-[185px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[18px] px-3 py-4 text-center shadow-[0_12px_28px_rgba(0,0,0,0.14)] transition-colors duration-100 ${isBeatActive ? "bg-white text-black" : "bg-[#111] text-white"}`}
            data-testid="smartphone-bpm-panel"
            data-beat-active={isBeatActive}
          >
            <p className={`text-[8px] font-bold uppercase tracking-[0.22em] ${isBeatActive ? "text-black/65" : "text-[goldenrod]"}`}>{isPlaying ? "Pulse running" : "Ready"}</p>
            <div className="mt-1 text-[clamp(5rem,25vw,6.25rem)] font-bold leading-[0.84] tracking-[-0.085em]">{bpm}</div>
            <div className={`mt-2 text-[9px] font-bold uppercase tracking-[0.3em] ${isBeatActive ? "text-black/60" : "text-gray-400"}`}>beats per minute</div>
          </section>

          <section className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className={`flex h-12 items-center justify-center rounded-[13px] text-[11px] font-bold uppercase tracking-[0.11em] shadow-[0_7px_16px_rgba(0,0,0,0.08)] ${isPlaying ? "bg-black text-[goldenrod]" : "bg-[goldenrod] text-black"}`}
              onClick={handlePlayClick}
              aria-pressed={isPlaying}
            >
              {isPlaying ? <FaPause className="mr-2" /> : <FaPlay className="mr-2" />}{isPlaying ? "Stop" : "Play"}
            </button>
            <button
              type="button"
              className="flex h-12 items-center justify-center rounded-[13px] bg-white text-[11px] font-bold uppercase tracking-[0.11em] text-black shadow-[0_7px_16px_rgba(0,0,0,0.08)]"
              onClick={handleTapTempo}
              aria-label="Tap tempo"
            >
              <FaRegHandPaper className="mr-2" />Tap
            </button>
          </section>

          <section className="rounded-[16px] border border-black/[0.05] bg-white/75 p-3 shadow-[0_9px_22px_rgba(0,0,0,0.06)]">
            <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Tempo</span><strong className="text-[10px] text-black">{bpm} BPM</strong></div>
            <div className="grid grid-cols-[2.35rem_minmax(0,1fr)_2.35rem] items-center gap-2">
              <button type="button" className="h-9 rounded-[10px] bg-[#f0efeb] text-lg font-bold" onClick={() => adjustBpm(-1)} aria-label="Reduce tempo by one BPM">−</button>
              <input type="range" min={BPM_MIN} max={BPM_MAX} step="1" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} aria-label="Tempo in beats per minute" className="range-golden w-full appearance-none bg-transparent" />
              <button type="button" className="h-9 rounded-[10px] bg-[#f0efeb] text-lg font-bold" onClick={() => adjustBpm(1)} aria-label="Increase tempo by one BPM">+</button>
            </div>
          </section>

          <section className="min-h-[31rem]">
            <Stopwatch variant="smartphone" bpm={bpm} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f3ef] px-6 pb-6 pt-5 lg:h-[calc((100vh/var(--desktop-app-zoom))-4rem)] lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-[1800px] min-h-0 flex-col gap-5">
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-8 rounded-[24px] border border-black/[0.055] bg-white/80 px-7 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.07)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              Tempo & timing
            </p>
            <h1 className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.045em] text-black">
              Build a steadier internal clock.
            </h1>
            <p className="mt-2 max-w-[52rem] text-[0.88rem] font-semibold leading-[1.35rem] text-gray-600">
              Set the pulse, shape a focused practice window and compare complete takes without leaving your music workspace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2" aria-label="Metronome overview">
            {[
              [bpm, "BPM"],
              [isTimerActive ? formatTime(displayedTimer) : "OPEN", "Session"],
              [`${Math.round((isMuted ? 0 : volume) * 100)}%`, "Volume"],
            ].map(([value, label]) => (
              <div key={label} className="min-w-[7rem] rounded-[16px] bg-[#f3f2ee] px-4 py-3 text-center">
                <div className="text-[1.15rem] font-bold leading-none text-black">{value}</div>
                <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.62fr)_minmax(320px,0.72fr)] gap-5">
          <section className="flex min-h-0 flex-col gap-4 rounded-[24px] border border-black/[0.055] bg-white/75 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.075)]">
            <div className="grid shrink-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-4">
              <div className="rounded-[18px] bg-[#f3f2ee] p-4">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">Focus timer</p>
                    <h2 className="mt-1 text-[1.05rem] font-bold text-black">Give this run a finish line.</h2>
                  </div>
                  <button
                    type="button"
                    aria-pressed={isTimerActive}
                    className={`min-h-11 rounded-[12px] px-4 text-[10px] font-bold uppercase tracking-[0.12em] transition ${isTimerActive ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(218,165,32,0.24)]" : "bg-white text-gray-600 shadow-[0_7px_16px_rgba(0,0,0,0.08)]"}`}
                    onClick={() => setIsTimerActive((current) => {
                      const next = !current;
                      if (!next) setTimeLeft(timerDuration);
                      return next;
                    })}
                  >
                    {isTimerActive ? "Timer on" : "Timer off"}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-3">
                  <button type="button" className="min-h-11 rounded-[12px] bg-white text-xs font-bold shadow-[0_6px_14px_rgba(0,0,0,0.07)]" onClick={() => adjustTimer(-10)} aria-label="Reduce timer by ten seconds">−10</button>
                  <div className="text-center text-[1.75rem] font-bold tracking-[-0.055em] text-black">{formatTime(displayedTimer)}</div>
                  <button type="button" className="min-h-11 rounded-[12px] bg-white text-xs font-bold shadow-[0_6px_14px_rgba(0,0,0,0.07)]" onClick={() => adjustTimer(10)} aria-label="Add ten seconds to timer">+10</button>
                </div>
              </div>

              <div className="rounded-[18px] bg-[#f3f2ee] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">Listening level</p>
                    <h2 className="mt-1 text-[1.05rem] font-bold text-black">Keep the click in the mix.</h2>
                  </div>
                  <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-[12px] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.07)]" onClick={() => setIsMuted((current) => !current)} aria-label={isMuted ? "Unmute metronome" : "Mute metronome"} aria-pressed={isMuted}>
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <FaVolumeMute className="text-gray-400" />
                  <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); setIsMuted(next === 0); }} aria-label="Metronome volume" className="range-golden w-full appearance-none bg-transparent" />
                  <span className="w-11 text-right text-xs font-bold text-gray-600">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                </div>
              </div>
            </div>

            <div
              className={`relative grid min-h-0 flex-1 overflow-hidden rounded-[24px] border border-black/[0.045] transition-colors duration-100 ${isBeatActive ? "bg-white text-black" : "bg-[#111] text-white"}`}
              data-testid="desktop-bpm-panel"
              data-beat-active={isBeatActive}
            >
                <div className="relative z-10 flex min-h-0 flex-col justify-between p-7">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isBeatActive ? "text-black/65" : "text-[goldenrod]"}`}>{isPlaying ? "Pulse running" : "Ready for your first count"}</p>
                  <div className="my-auto text-center">
                    <div className="text-[clamp(7rem,12vw,11rem)] font-bold leading-[0.78] tracking-[-0.095em]">{bpm}</div>
                    <div className={`mt-4 text-[0.82rem] font-bold uppercase tracking-[0.34em] ${isBeatActive ? "text-black/60" : "text-gray-500"}`}>beats per minute</div>
                  </div>
                  <div className="grid max-w-[28rem] grid-cols-[1.35fr_1fr] gap-3">
                    <button type="button" className={`flex min-h-14 items-center justify-center rounded-[14px] text-xs font-bold uppercase tracking-[0.13em] shadow-[0_9px_20px_rgba(0,0,0,0.12)] ${isPlaying ? "bg-white text-black" : "bg-[goldenrod] text-black"}`} onClick={handlePlayClick} aria-pressed={isPlaying}>
                      {isPlaying ? <FaPause className="mr-2" /> : <FaPlay className="mr-2" />}{isPlaying ? "Stop" : "Play"}
                    </button>
                    <button type="button" className="flex min-h-14 items-center justify-center rounded-[14px] bg-white/10 text-xs font-bold uppercase tracking-[0.13em] text-white shadow-[0_9px_20px_rgba(0,0,0,0.1)]" onClick={handleTapTempo} aria-label="Tap tempo">
                      <FaRegHandPaper className="mr-2" />Tap tempo
                    </button>
                  </div>
                </div>
            </div>

            <div className="shrink-0 rounded-[18px] bg-[#f3f2ee] px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Tempo range</span>
                <span className="text-xs font-bold text-black">{BPM_MIN}–{BPM_MAX} BPM</span>
              </div>
              <div className="grid grid-cols-[3rem_4rem_minmax(0,1fr)_4rem_3rem] items-center gap-2">
                <button type="button" className="min-h-11 rounded-[11px] bg-white text-xl font-bold shadow-[0_5px_13px_rgba(0,0,0,0.07)]" onClick={() => adjustBpm(-1)} aria-label="Reduce tempo by one BPM">−</button>
                <button type="button" className="min-h-11 rounded-[11px] bg-white text-xs font-bold shadow-[0_5px_13px_rgba(0,0,0,0.07)]" onClick={() => adjustBpm(-10)} aria-label="Reduce tempo by ten BPM">−10</button>
                <input type="range" min={BPM_MIN} max={BPM_MAX} step="1" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} aria-label="Tempo in beats per minute" className="range-golden w-full appearance-none bg-transparent" />
                <button type="button" className="min-h-11 rounded-[11px] bg-white text-xs font-bold shadow-[0_5px_13px_rgba(0,0,0,0.07)]" onClick={() => adjustBpm(10)} aria-label="Increase tempo by ten BPM">+10</button>
                <button type="button" className="min-h-11 rounded-[11px] bg-white text-xl font-bold shadow-[0_5px_13px_rgba(0,0,0,0.07)]" onClick={() => adjustBpm(1)} aria-label="Increase tempo by one BPM">+</button>
              </div>
            </div>
          </section>

          <aside className="min-h-0">
            <Stopwatch variant="desktopEditorial" bpm={bpm} />
          </aside>
        </main>
      </div>
    </div>
  );
}

export default Metronome;
