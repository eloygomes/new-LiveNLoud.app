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
const BPM_MAX = 220;
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
  const [isOn, setIsOn] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [tapTimes, setTapTimes] = useState([]);

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
      } else {
        setTimeLeft(timerDuration);
      }
    } else {
      clearInterval(intervalIdRef.current);
      clearInterval(countdownIntervalRef.current);
      setIsOn(false);
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
  const touchActionButtonClass =
    "neuphormism-b-btn flex min-h-[52px] min-w-0 items-center justify-center rounded-[14px] px-3 text-[13px] font-bold uppercase tracking-[0.1em] text-black active:scale-[0.98]";
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
        badges={[
          `${bpm} BPM`,
          isTimerActive ? `${formatTime(displayedTimer)} timer` : "Open session",
          `${Math.round((isMuted ? 0 : volume) * 100)}% volume`,
        ]}
        contentClassName="h-full"
      >
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.72fr)] gap-5">
          <section className="neuphormism-b flex min-h-0 flex-col gap-4 overflow-hidden rounded-[24px] p-5">
            <div className="grid shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] gap-4">
              <div className="rounded-[18px] bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
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
                </div>
                <div className="mt-3 grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-2">
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

              <div className="rounded-[18px] bg-white/70 p-4">
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
                <div className="mt-5 flex items-center gap-3">
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
              className={`relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] px-6 py-5 text-center transition-colors ${
                isOn ? "bg-black text-white" : "bg-white/80 text-black"
              }`}
              aria-live="polite"
            >
              <div
                className={`absolute h-[22rem] w-[22rem] rounded-full border-[2.5rem] transition-all duration-100 ${
                  isOn
                    ? "scale-110 border-[goldenrod]/35 opacity-100"
                    : "scale-90 border-black/[0.025] opacity-80"
                }`}
                aria-hidden="true"
              />
              <p className="relative z-10 text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                {isPlaying ? "Pulse running" : "Ready for your first count"}
              </p>
              <div className="relative z-10 mt-2 text-[clamp(7rem,16vw,12rem)] font-bold leading-[0.82] tracking-[-0.09em]">
                {bpm}
              </div>
              <div className="relative z-10 mt-3 text-[0.9rem] font-bold uppercase tracking-[0.34em] text-gray-500">
                beats per minute
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_7rem_7rem] gap-3">
              <div className="neuphormism-b rounded-[18px] px-4 py-3">
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

              <button
                type="button"
                className="neuphormism-b-btn flex min-h-16 flex-col items-center justify-center rounded-[18px] text-[10px] font-bold uppercase tracking-[0.1em]"
                onClick={handleTapTempo}
              >
                <FaRegHandPaper className="mb-1 text-[1rem]" />
                Tap
              </button>
              <button
                type="button"
                className={`flex min-h-16 flex-col items-center justify-center rounded-[18px] text-[10px] font-bold uppercase tracking-[0.1em] ${
                  isPlaying
                    ? "bg-black text-[goldenrod] shadow-lg"
                    : "neuphormism-b-btn-gold text-black"
                }`}
                onClick={handlePlayClick}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <FaPause className="mb-1 text-[1rem]" /> : <FaPlay className="mb-1 text-[1rem]" />}
                {isPlaying ? "Stop" : "Play"}
              </button>
            </div>
          </section>

          <aside className="min-h-0">
            <Stopwatch variant="tablet" />
          </aside>
        </div>
      </TabletToolShell>
    );
  }

  if (isTouchLayout) {
    return (
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col bg-[#f0f0f0] px-3 pb-4 pt-3">
        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-3">
          <section className="flex min-h-0 flex-1 flex-col neuphormism-b rounded-[18px] px-3 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                Metronome
              </p>
              <h1 className="mt-1 text-[1.55rem] font-bold leading-none tracking-tight text-black">
                Keep The Pulse
              </h1>
            </div>

            <div className="mt-3 flex flex-col gap-2 rounded-[14px] neuphormism-b px-3 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 ">
                Timer{" "}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-[12px] px-2 text-[11px] font-bold uppercase tracking-[0.1em] text-black active:scale-[0.98] ${
                    isTimerActive
                      ? "neuphormism-b-btn-gold"
                      : "neuphormism-b-btn"
                  }`}
                  onClick={() => {
                    setIsTimerActive((prev) => {
                      const next = !prev;
                      if (!next) {
                        setTimeLeft(timerDuration);
                      }
                      return next;
                    });
                  }}
                >
                  {isTimerActive ? "On" : " Off"}
                </button>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
                  <button
                    type="button"
                    className={`${bpmButtonClass} h-10 w-12 shrink-0 rounded-[12px] px-2`}
                    onClick={() => adjustTimer(-10)}
                  >
                    -10
                  </button>
                  <p className="w-[76px] shrink-0 text-center text-[1.35rem] font-bold leading-none tracking-[-0.04em] text-black">
                    {formatTime(displayedTimer)}
                  </p>
                  <button
                    type="button"
                    className={`${bpmButtonClass} h-10 w-12 shrink-0 rounded-[12px] px-2`}
                    onClick={() => adjustTimer(10)}
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`mt-3 flex min-h-[190px] flex-1 flex-col items-center justify-center rounded-[14px] px-3 py-4 text-center transition-colors ${
                isOn ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              <div className="text-[6rem] font-bold leading-[0.86] tracking-[-0.075em]">
                {bpm}
              </div>
              <div className="mt-1 text-sm font-bold uppercase tracking-[0.3em] text-[goldenrod]">
                BPM
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`${touchActionButtonClass} h-14 ${
                isPlaying
                  ? "bg-black text-[goldenrod]"
                  : "neuphormism-b-btn-gold"
              }`}
              onClick={handlePlayClick}
            >
              <span className="mr-2 shrink-0">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </span>
              <span className="inline-block w-[72px] text-left">
                {isPlaying ? "Stop" : "Play"}
              </span>
            </button>
            <button
              type="button"
              className={`${touchActionButtonClass} h-14`}
              onClick={handleTapTempo}
            >
              <span className="mr-2 shrink-0">
                <FaRegHandPaper />
              </span>
              <span className="inline-block w-[72px] text-left">Tap</span>
            </button>
          </section>

          {renderSlider({
            iconStart: <FaMinus size={12} />,
            iconEnd: <FaPlus size={12} />,
            label: "Tempo",
            min: BPM_MIN,
            max: BPM_MAX,
            step: 1,
            value: bpm,
            onChange: (e) => setBpm(Number(e.target.value)),
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] px-4 pb-8 pt-4 lg:h-[calc((100vh/var(--desktop-app-zoom))-4rem)] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:pb-5">
      <div className="mx-auto flex h-full w-full max-w-none flex-col">
        <div className="flex min-h-0 w-full flex-1 flex-col pb-10 lg:pb-0">
          <div className="mb-5 flex items-center gap-6 neuphormism-b p-5">
            <div>
              <h1 className="text-4xl font-bold">METRONOME</h1>
            </div>
            <div className="ml-auto">
              <h4 className="max-w-[320px] text-right text-sm">
                Keep the pulse.
              </h4>
            </div>
          </div>

          <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
            <section className="neuphormism-b flex h-full min-h-0 flex-col rounded p-6">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-6">
                  <div className="flex-shrink-0 rounded neuphormism-b px-5 py-1">
                    <div className=" flex flex-row justify-between gap-6">
                      <div className="flex flex-row justify-between ">
                        <button
                          type="button"
                          className={`my-2 h-[48px] w-[136px] shrink-0 ${
                            isTimerActive
                              ? "neuphormism-b-btn-gold text-sm font-bold uppercase tracking-[0.14em] text-black active:scale-[0.98]"
                              : `${bpmButtonClass}`
                          }`}
                          onClick={() => {
                            setIsTimerActive((prev) => {
                              const next = !prev;
                              if (!next) {
                                setTimeLeft(timerDuration);
                              }
                              return next;
                            });
                          }}
                        >
                          {isTimerActive ? "Timer On" : "Timer Off"}
                        </button>
                      </div>
                      <div className="flex min-w-0 flex-row justify-between ">
                        <div className="flex w-full flex-rows items-center justify-between gap-6 ">
                          <button
                            type="button"
                            className={`${bpmButtonClass} my-2 h-[48px] w-[116px] shrink-0 py-2`}
                            onClick={() => adjustTimer(-10)}
                          >
                            -10 sec
                          </button>
                          <p className="w-[120px] shrink-0 text-center text-[1.5rem] font-bold leading-none tracking-[-0.05em] text-black">
                            {formatTime(displayedTimer)}
                          </p>
                          <button
                            type="button"
                            className={`${bpmButtonClass} my-2 h-[48px] w-[116px] shrink-0 py-2`}
                            onClick={() => adjustTimer(10)}
                          >
                            +10 sec
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-[12%_minmax(0,1fr)_18%] gap-6">
                    <div className="h-full min-h-0">
                      {renderSlider({
                        iconStart: <FaVolumeMute size={14} />,
                        iconEnd: <FaVolumeUp size={14} />,
                        label: "Volume",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        value: isMuted ? 0 : volume,
                        onChange: (e) => {
                          const nextVolume = Number(e.target.value);
                          setVolume(nextVolume);
                          if (nextVolume > 0 && isMuted) {
                            setIsMuted(false);
                          }
                          if (nextVolume === 0) {
                            setIsMuted(true);
                          }
                        },
                        thin: true,
                        hideButtons: true,
                        vertical: true,
                      })}
                    </div>
                    <div
                      className={`h-full min-h-0 gap-3 rounded-[30px] px-8 py-16 text-center transition-colors ${
                        isOn
                          ? "neuphormism-d-bg-black text-white"
                          : "neuphormism-d text-black"
                      }`}
                    >
                      <div className="flex h-full flex-col items-center justify-center">
                        <div className="text-[8.7rem] font-bold leading-[0.84] tracking-[-0.09em]">
                          {bpm}
                        </div>
                        <div className="mt-2 text-lg font-bold uppercase tracking-[0.3em] text-gray-500">
                          BPM
                        </div>
                      </div>
                    </div>
                    <div className="flex h-full min-h-0 min-w-[150px] flex-col justify-between gap-6">
                      <button
                        type="button"
                        className={`${bpmButtonClass} h-full flex-1 min-w-[150px] py-6 ${
                          isPlaying
                            ? "bg-black text-[goldenrod]"
                            : "neuphormism-b-btn-gold"
                        }`}
                        onClick={handlePlayClick}
                      >
                        <span className="mr-2 shrink-0">
                          {isPlaying ? <FaPause /> : <FaPlay />}
                        </span>
                        <span className="inline-block w-[72px] text-left">
                          {isPlaying ? "Stop" : "Play"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`${bpmButtonClass} h-full flex-1 min-w-[150px] py-6`}
                        onClick={() => setIsMuted((prev) => !prev)}
                      >
                        <span className="mr-2 shrink-0">
                          {isMuted ? <FaVolumeUp /> : <FaVolumeMute />}
                        </span>
                        <span className="inline-block w-[86px] text-left">
                          {isMuted ? "Unmute" : "Mute"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {renderSlider({
                      iconStart: <FaMinus size={12} />,
                      iconEnd: <FaPlus size={12} />,
                      label: "Tempo",
                      min: BPM_MIN,
                      max: BPM_MAX,
                      step: 1,
                      value: bpm,
                      onChange: (e) => setBpm(Number(e.target.value)),
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-5"></div>
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col">
              <Stopwatch />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Metronome;
