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
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const hundredths = Math.floor((time % 1000) / 10);
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
    <div className="w-full h-full flex flex-col mb-5 rounded-md neuphormism-b">
      <div className="flex flex-col justify-start mx-auto rounded-md mb-2">
        <div className="w-full flex flex-col justify-between">
          <div className="w-full mx-auto text-center">
            <h1 className="sm:text-[80px] md:text-[60px] lg:text-[80px] xl:text-[80px] 2xl:text-[80px] font-mono pt-5">
              {formatTime(stopwatchTime)}
            </h1>
            <p className="text-lg text-gray-500 font-mono py-5 font-bold">
              {formatTime(lapTime)}
            </p>
          </div>
          <div className="flex flex-row w-full">
            <div className="w-full p-5">
              <button
                className="w-full flex items-center justify-center neuphormism-b-se px-6 py-4"
                type="button"
                onClick={handleLapOrReset}
              >
                {isStopwatchRunning ? "Lap" : "Reset!"}
              </button>
            </div>
            <div className="w-full p-5">
              <button
                className="w-full flex items-center justify-center neuphormism-b-se px-6 py-4"
                type="button"
                onClick={handleStopwatchStartStop}
              >
                {isStopwatchRunning ? "Stop" : "Start!"}
              </button>
            </div>
          </div>
        </div>
        {laps.length > 0 && (
          <div className="p-2 w-full flex flex-col justify-start mx-auto rounded-md mb-2">
            <div className="grid grid-cols-3 gap-4 font-semibold border-b pb-2 border-gray-300">
              <div>Lap</div>
              <div>Split</div>
              <div>Total</div>
            </div>
            {laps.map((lap, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 py-2 border-b border-gray-300 text-sm"
              >
                <div className="pl-3">{lap.lapNumber}</div>
                <div>{formatTime(lap.split)}</div>
                <div>{formatTime(lap.totalTime)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
