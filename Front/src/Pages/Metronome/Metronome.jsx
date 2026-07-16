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

const BPM_MIN = 40;
const BPM_MAX = 220;
const TOUCH_BREAKPOINT = 767;
const clickSound = "/click.mp3";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function Metronome() {
  const [isTouchLayout, setIsTouchLayout] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth <= TOUCH_BREAKPOINT,
  );
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
    const handleResize = () => {
      setIsTouchLayout(window.innerWidth <= TOUCH_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
