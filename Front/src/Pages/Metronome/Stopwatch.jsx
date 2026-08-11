// src/Pages/Metronome/Stopwatch.jsx
import { useEffect, useState, useRef } from "react";
import { createCalendarEvent } from "../../Tools/Controllers";

const Stopwatch = ({ variant = "default", bpm = 120 }) => {
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [sessionEndedAt, setSessionEndedAt] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const stopwatchIntervalRef = useRef(null);
  const lapStartTimeRef = useRef(null);

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const hundredths = Math.floor((time % 1000) / 10);

    if (hours > 0) {
      const remainingMinutes = Math.floor((time % 3600000) / 60000);
      return `${hours}:${remainingMinutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}:${hundredths.toString().padStart(2, "0")}`;
  };

  const handleStopwatchStartStop = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      clearInterval(stopwatchIntervalRef.current);
      setSessionEndedAt(new Date());
    } else {
      if (!sessionStartedAt) setSessionStartedAt(new Date());
      setSessionEndedAt(null);
      setSaveStatus("");
      setIsStopwatchRunning(true);
      const stopwatchStart = Date.now() - stopwatchTime;
      const lapStart = Date.now() - lapTime;
      lapStartTimeRef.current = lapStart;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - stopwatchStart);
        setLapTime(Date.now() - lapStartTimeRef.current);
      }, 10);
    }
  };

  const handleLapOrReset = () => {
    if (isStopwatchRunning) {
      // Registra o lap atual usando lapTime como split
      const lapNumber = laps.length + 1;
      const newLap = { lapNumber, totalTime: stopwatchTime, split: lapTime };
      setLaps((prevLaps) => [...prevLaps, newLap]);
      // Reinicia o contador do lap
      lapStartTimeRef.current = Date.now();
      setLapTime(0);
    } else {
      // Reset total
      setStopwatchTime(0);
      setLapTime(0);
      setLaps([]);
      setSessionStartedAt(null);
      setSessionEndedAt(null);
      setSaveStatus("");
    }
  };

  const discardTraining = () => {
    clearInterval(stopwatchIntervalRef.current);
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    setLapTime(0);
    setLaps([]);
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setSaveStatus("");
  };

  const saveTraining = async () => {
    if (!sessionStartedAt || !sessionEndedAt || stopwatchTime <= 0) return;

    setIsSaving(true);
    setSaveStatus("");
    try {
      await createCalendarEvent({
        title: "Metronome practice",
        description: `Practice completed at ${bpm} BPM with ${laps.length} lap${laps.length === 1 ? "" : "s"}.`,
        startsAt: sessionStartedAt.toISOString(),
        endsAt: sessionEndedAt.toISOString(),
        eventType: "training",
        metadata: {
          bpm,
          durationMs: stopwatchTime,
          lapCount: laps.length,
          laps: laps.map((lap) => ({
            lapNumber: lap.lapNumber,
            splitMs: lap.split,
            totalTimeMs: lap.totalTime,
          })),
        },
        invitedUsersText: "",
      });
      discardTraining();
      setSaveStatus("Training saved to Calendar.");
    } catch (error) {
      setSaveStatus(
        error?.response?.data?.message || "Unable to save this training.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(
    () => () => {
      clearInterval(stopwatchIntervalRef.current);
    },
    [],
  );

  const isTablet = variant === "tablet";
  const isDesktopEditorial = variant === "desktopEditorial";
  const isSmartphone = variant === "smartphone";

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col ${
        isTablet
          ? "neuphormism-b rounded-[24px] p-4"
          : isDesktopEditorial
            ? "rounded-[24px] border border-black/[0.055] bg-white/75 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.075)]"
            : isSmartphone
              ? "rounded-[18px] border border-black/[0.055] bg-white/80 p-3 shadow-[0_9px_22px_rgba(0,0,0,0.065)]"
            : "neuphormism-b rounded-[30px] p-6"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="w-full flex-shrink-0">
          {isTablet ? (
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                Session stopwatch
              </p>
              <h2 className="mt-1 text-[1.25rem] font-bold leading-tight text-black">
                Measure complete takes and difficult sections.
              </h2>
              <p className="mt-2 text-[11px] font-semibold leading-[1rem] text-gray-500">
                Add a lap after each pass to compare consistency without resetting the full session.
              </p>
            </div>
          ) : isDesktopEditorial ? (
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                Session stopwatch
              </p>
              <h2 className="mt-1 text-[1.3rem] font-bold leading-tight tracking-[-0.025em] text-black">
                Compare every complete take.
              </h2>
              <p className="mt-2 text-[11px] font-semibold leading-[1.05rem] text-gray-500">
                Save a lap after each pass and track consistency without interrupting the pulse.
              </p>
            </div>
          ) : isSmartphone ? (
            <div className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                Session stopwatch
              </p>
              <h2 className="mt-1 text-[1rem] font-bold leading-tight text-black">
                Save a complete practice.
              </h2>
            </div>
          ) : null}
          <div className="w-full mx-auto text-center">
            <h1
              className={`${isTablet ? "pt-2 text-[3rem]" : isDesktopEditorial ? "pt-3 text-[3.6rem]" : "pt-4 text-[4rem]"} font-bold text-center leading-[0.9] tracking-[-0.055em] text-black`}
            >
              {formatTime(stopwatchTime)}
            </h1>
            <p className={`${isTablet ? "py-4 text-sm" : isDesktopEditorial ? "py-4 text-xs" : "py-5 text-md"} font-bold tracking-[0.28em] text-gray-500`}>
              {formatTime(lapTime)}
            </p>
          </div>
          <div className={`flex w-full flex-row gap-3 ${isTablet ? "pb-4" : "pb-5"}`}>
            <div className="w-full">
              <button
                className={`${isDesktopEditorial ? "bg-[#f3f2ee] shadow-[0_7px_16px_rgba(0,0,0,0.07)]" : "neuphormism-b-se"} flex min-h-12 w-full items-center justify-center rounded-[14px] px-4 font-bold ${isTablet || isDesktopEditorial ? "text-[0.9rem]" : "text-xl"}`}
                type="button"
                onClick={handleLapOrReset}
              >
                {isStopwatchRunning ? "Lap" : "Reset!"}
              </button>
            </div>
            <div className="w-full">
              <button
                className={`${isDesktopEditorial ? (isStopwatchRunning ? "bg-black text-[goldenrod]" : "bg-[goldenrod] text-black") + " shadow-[0_8px_18px_rgba(0,0,0,0.1)]" : "neuphormism-b-se"} flex min-h-12 w-full items-center justify-center rounded-[14px] px-4 font-bold ${isTablet || isDesktopEditorial ? "text-[0.9rem]" : "text-xl"}`}
                type="button"
                onClick={handleStopwatchStartStop}
              >
                {isStopwatchRunning ? "Stop" : "Start!"}
              </button>
            </div>
          </div>
        </div>
        {laps.length > 0 && (
          <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] p-3 ${isDesktopEditorial ? "bg-[#f3f2ee]" : "neuphormism-d"}`}>
            <div className="grid grid-cols-3 gap-4 border-b border-gray-300 pb-3 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
              <div className="pl-3">Lap</div>
              <div>Split</div>
              <div>Total</div>
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              {laps.map((lap, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 border-b border-gray-200 py-3 text-xs font-bold text-black"
                >
                  <div className="pl-3">{lap.lapNumber}</div>
                  <div>{formatTime(lap.split)}</div>
                  <div>{formatTime(lap.totalTime)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!laps.length && (
          <div className={`flex min-h-0 flex-1 items-center justify-center rounded-[18px] ${isDesktopEditorial ? "border border-dashed border-black/10 bg-[#f7f6f2]" : "neuphormism-d"}`}>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                Laps
              </p>
              <p className="mt-3 text-sm font-bold text-gray-500">
                Saved splits will appear here.
              </p>
            </div>
          </div>
        )}
        <div className="mt-3 shrink-0 border-t border-black/[0.06] pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="min-h-11 rounded-[13px] bg-[goldenrod] px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black shadow-[0_7px_16px_rgba(0,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-35"
              onClick={saveTraining}
              disabled={
                isSaving ||
                isStopwatchRunning ||
                !sessionStartedAt ||
                !sessionEndedAt ||
                stopwatchTime <= 0
              }
            >
              {isSaving ? "Saving..." : "Save training"}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-[13px] bg-[#f1f0ec] px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-700 shadow-[0_7px_16px_rgba(0,0,0,0.06)] disabled:opacity-35"
              onClick={discardTraining}
              disabled={!stopwatchTime && !laps.length}
            >
              Discard
            </button>
          </div>
          {saveStatus ? (
            <p className={`mt-2 text-center text-[10px] font-bold ${saveStatus.includes("saved") ? "text-green-700" : "text-red-600"}`}>
              {saveStatus}
            </p>
          ) : null}
          {isSmartphone && stopwatchTime > 0 && !sessionEndedAt ? (
            <p className="mt-2 text-center text-[9px] font-semibold text-gray-500">
              Stop the stopwatch before saving.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
