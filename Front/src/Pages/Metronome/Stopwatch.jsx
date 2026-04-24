// src/Pages/Metronome/Stopwatch.jsx
import { useState, useRef } from "react";

const Stopwatch = () => {
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState([]);
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
    } else {
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
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-[30px] neuphormism-b p-6">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="w-full flex-shrink-0">
          <div className="w-full mx-auto text-center">
            <h1 className="pt-4 text-[4rem] font-bold text-center leading-[0.9] tracking-[-0.03em] text-black">
              {formatTime(stopwatchTime)}
            </h1>
            <p className="py-5 text-md font-bold tracking-[0.28em] text-gray-500">
              {formatTime(lapTime)}
            </p>
          </div>
          <div className="flex w-full flex-row gap-4 pb-5">
            <div className="w-full">
              <button
                className="neuphormism-b-se flex w-full items-center justify-center rounded-[18px] px-6 py-4 text-xl font-bold"
                type="button"
                onClick={handleLapOrReset}
              >
                {isStopwatchRunning ? "Lap" : "Reset!"}
              </button>
            </div>
            <div className="w-full">
              <button
                className="neuphormism-b-se flex w-full items-center justify-center rounded-[18px] px-6 py-4 text-xl font-bold"
                type="button"
                onClick={handleStopwatchStartStop}
              >
                {isStopwatchRunning ? "Stop" : "Start!"}
              </button>
            </div>
          </div>
        </div>
        {laps.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] neuphormism-d p-3">
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
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-[22px] neuphormism-d">
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-gray-400">
                Laps
              </p>
              <p className="mt-3 text-lg font-bold text-gray-500">
                Saved splits will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
