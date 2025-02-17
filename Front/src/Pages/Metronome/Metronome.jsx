import { useState, useEffect, useRef } from "react";
import MetronomeInput from "./MetronomeInput";
import clickSound from "../../../public/click.mp3";
import VolumeControl from "./VolumeControl";

const bpmList = [
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140,
  145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215,
  220, 225, 230, 235, 240,
];

function Metronome() {
  /* =========== Estados e Refs =========== */
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef(null);
  const clickSoundBufferRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalIdRef = useRef(null);

  /* =========== Carrega o Som do Metrônomo e Cria o GainNode Global =========== */
  useEffect(() => {
    const loadClickSound = async () => {
      try {
        const response = await fetch(clickSound);
        if (!response.ok) {
          throw new Error(
            `Erro na requisição fetch: ${response.status} ${response.statusText}`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const clickBuffer = await audioContext.decodeAudioData(arrayBuffer);

        audioContextRef.current = audioContext;
        clickSoundBufferRef.current = clickBuffer;

        // Cria o GainNode global para controle de volume
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

  /* =========== Atualiza o Volume em Tempo Real =========== */
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  /* =========== Função Global para Tocar o Click =========== */
  const playClickSound = () => {
    if (audioContextRef.current && clickSoundBufferRef.current) {
      const clickSoundSource = audioContextRef.current.createBufferSource();
      clickSoundSource.buffer = clickSoundBufferRef.current;

      // Usa o GainNode global para controle dinâmico do volume
      clickSoundSource.connect(gainNodeRef.current);

      clickSoundSource.start();
    }
  };

  /* =========== Controla a Reprodução do Metrônomo =========== */
  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;

      // Usa a função global playClickSound (sem criar novo GainNode)
      intervalIdRef.current = setInterval(() => {
        setIsOn((prev) => !prev);
        playClickSound();
      }, interval);

      // Toca imediatamente para evitar atraso na primeira batida
      setIsOn(true);
      playClickSound();
    } else {
      clearInterval(intervalIdRef.current);
      setIsOn(false);
    }

    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [isPlaying, bpm]);

  /* =========== Atalhos do Teclado =========== */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" || event.keyCode === 32) {
        event.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBpmChange = (event) => {
    setBpm(event.target.value);
  };

  const handlePlayClick = () => {
    setIsPlaying((prev) => !prev);
  };

  /* =========== Lógica do Stopwatch =========== */
  const [stopwatchTime, setStopwatchTime] = useState(0); // tempo em ms
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef(null);
  const [laps, setLaps] = useState([]);

  const handleStopwatchStartStop = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      clearInterval(stopwatchIntervalRef.current);
    } else {
      setIsStopwatchRunning(true);
      const startTime = Date.now() - stopwatchTime;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - startTime);
      }, 10);
    }
  };

  const handleLapOrReset = () => {
    if (isStopwatchRunning) {
      const lastTotal = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
      const lapSplit = stopwatchTime - lastTotal;
      const lapNumber = laps.length + 1;
      const newLap = { lapNumber, totalTime: stopwatchTime, split: lapSplit };
      setLaps((prevLaps) => [...prevLaps, newLap]);
    } else {
      setStopwatchTime(0);
      setLaps([]);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const hundredths = Math.floor((time % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}:${hundredths.toString().padStart(2, "0")}`;
  };

  /* =========== Renderização =========== */
  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="w-11/12 2xl:w-9/12 mx-auto">
          {/* Cabeçalho */}
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Metronome</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Choose your BPM and hit Play!
            </h4>
          </div>
          <div className="w-full flex flex-row justify-between my-5 neuphormism-b p-5">
            {/* Lado A: Metronome */}
            <div className="w-[49%] flex flex-col mb-5 rounded-md neuphormism-b py-5">
              <div className="flex flex-col px-5">
                <div className="flex flex-row justify-between  mb-5 py-10 px-5 neuphormism-b">
                  <div className="w-[50%] flex flex-row justify-start p-2 pr-10">
                    <MetronomeInput
                      values={bpmList}
                      inputLabel="BPM"
                      value={bpm}
                      onChange={handleBpmChange}
                    />
                  </div>
                  <div className="w-[50%] flex flex-row justify-between">
                    <button
                      className="w-[49%] h-[200px] flex items-center justify-center neuphormism-b-se mx-5 "
                      type="button"
                      onClick={handlePlayClick}
                    >
                      {isPlaying ? "Parar" : "Play!"}
                    </button>
                    <VolumeControl
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      isMuted={isMuted}
                      onMute={() => setIsMuted((prev) => !prev)}
                    />
                    <div className="flex flex-row">
                      <div className="w-[10%] flex flex-row justify-start mt-5">
                        {/* <VolumeControl
                          value={volume}
                          onChange={(e) =>
                            setVolume(parseFloat(e.target.value))
                          }
                          isMuted={isMuted}
                          onMute={() => setIsMuted((prev) => !prev)}
                        /> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`p-10 w-[90%] mx-auto rounded-md mb-2 transition-colors duration-100 ${
                  isOn ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <h1 className="text-[150px]">{bpm}</h1>
                  <h1 className="text-xl">bpm</h1>
                </div>
              </div>
            </div>

            {/* Lado B: Stopwatch */}
            <div className="w-[49%] flex flex-col mb-5 rounded-md neuphormism-b">
              <div className="flex flex-col justify-start mx-auto rounded-md mb-2">
                <div className="w-full flex flex-col justify-between">
                  <div className="w-full mx-auto text-center ">
                    <h1 className="sm:text-[80px] md:text-[60px] lg:text-[80px] xl:text-[80px] 2xl:text-[80px] font-mono py-5">
                      {formatTime(stopwatchTime)}
                    </h1>
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
                      <div>Lap No.</div>
                      <div>Split</div>
                      <div>Total</div>
                    </div>
                    {laps.map((lap, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-4 py-2 border-b border-gray-300"
                      >
                        <div>{lap.lapNumber}</div>
                        <div>{formatTime(lap.split)}</div>
                        <div>{formatTime(lap.totalTime)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Metronome;
