/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import clickSound from "../../../public/click.mp3"; // Certifique-se de que o caminho está correto

function ToolBoxMini({ initialBpm = 120 }) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const audioContextRef = useRef(null);
  const clickSoundBufferRef = useRef(null);
  const intervalIdRef = useRef(null);

  useEffect(() => {
    // Função para carregar o som de clique
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
      } catch (error) {
        console.error("Erro ao carregar o som de clique:", error);
      }
    };

    loadClickSound();

    // Limpeza quando o componente desmontar
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;

      const playClickSound = () => {
        if (audioContextRef.current && clickSoundBufferRef.current) {
          const clickSoundSource = audioContextRef.current.createBufferSource();
          clickSoundSource.buffer = clickSoundBufferRef.current;
          clickSoundSource.connect(audioContextRef.current.destination);
          clickSoundSource.start();
        }
      };

      intervalIdRef.current = setInterval(() => {
        setIsOn((prevIsOn) => !prevIsOn);
        playClickSound();
      }, interval);

      // Inicia imediatamente
      setIsOn(true);
      playClickSound();
    } else {
      clearInterval(intervalIdRef.current);
      setIsOn(false);
    }

    // Limpeza quando o componente desmontar ou quando isPlaying/bpm mudar
    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [isPlaying, bpm]);

  const handlePlayClick = () => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  const increaseBpm = () => {
    setBpm((prevBpm) => prevBpm + 1);
  };

  const decreaseBpm = () => {
    setBpm((prevBpm) => (prevBpm > 1 ? prevBpm - 1 : 1));
  };

  return (
    <div>
      <li className="hover:font-semibold">
        <div className="p-1 rounded-md mb-2 neuphormism-b">
          <div className="flex flex-col items-center justify-center h-32">
            <h1
              className={`text-xl w-full text-center transition-colors duration-100 ${
                isOn ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {bpm}
            </h1>
            <h1
              className={`text-md  w-full text-center transition-colors duration-100 ${
                isOn ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              bpm
            </h1>
            <div className="flex flex-row my-3">
              <button
                type="button"
                className="neuphormism-b-se w-10 m-1 rounded-full"
                onClick={decreaseBpm}
              >
                -
              </button>
              <button
                type="button"
                className="neuphormism-b-se w-10 m-1 rounded-full"
                onClick={increaseBpm}
              >
                +
              </button>
            </div>
            <div className="flex flex-row mb-3 ">
              <button
                type="button"
                className="neuphormism-b-btn-green w-full px-8 rounded-full"
                onClick={handlePlayClick}
              >
                {isPlaying ? "Stop" : "Play"}
              </button>
            </div>
          </div>
        </div>
      </li>
    </div>
  );
}

export default ToolBoxMini;
