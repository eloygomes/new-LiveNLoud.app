import { useState, useEffect, useRef } from "react";
import MetronomeInput from "./MetronomeInput";

const bpmList = [
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140,
  145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215,
  220, 225, 230, 235, 240,
];

function Metronome() {
  const [bpm, setBpm] = useState(120); // Valor padrão do BPM
  const [isPlaying, setIsPlaying] = useState(false); // Controla se o metrônomo está tocando
  const [isOn, setIsOn] = useState(false); // Controla o piscar do elemento
  const audioContextRef = useRef(null);
  const clickSoundBufferRef = useRef(null);
  const intervalIdRef = useRef(null);

  useEffect(() => {
    // Função para carregar o som de clique
    const loadClickSound = async () => {
      try {
        const response = await fetch("/click.mp3"); // Certifique-se de que o arquivo está na pasta public
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
      const interval = (60 / bpm) * 1000; // Calcula o intervalo em milissegundos

      // Função que toca o som de clique
      const playClickSound = () => {
        if (audioContextRef.current && clickSoundBufferRef.current) {
          const clickSoundSource = audioContextRef.current.createBufferSource();
          clickSoundSource.buffer = clickSoundBufferRef.current;
          clickSoundSource.connect(audioContextRef.current.destination);
          clickSoundSource.start();
        }
      };

      // Inicia o metrônomo
      intervalIdRef.current = setInterval(() => {
        setIsOn((prevIsOn) => !prevIsOn);
        playClickSound();
      }, interval);

      // Inicia imediatamente para evitar o atraso da primeira batida
      setIsOn(true);
      playClickSound();
    } else {
      // Para o metrônomo
      clearInterval(intervalIdRef.current);
      setIsOn(false);
    }

    // Limpeza quando o componente desmontar ou quando isPlaying/bpm mudar
    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [isPlaying, bpm]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" || event.keyCode === 32) {
        event.preventDefault(); // Previne o comportamento padrão (rolagem da página)
        setIsPlaying((prevIsPlaying) => !prevIsPlaying);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Limpa o event listener ao desmontar
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBpmChange = (event) => {
    setBpm(event.target.value);
  };

  const handlePlayClick = () => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Metrônomo</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Escolha seu BPM e aperte Play!
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start py-5 w-[90%]  mx-auto  rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%]  mx-auto mb-5 rounded-md neuphormism-b ">
                <div className="w-[90%] flex flex-row justify-start">
                  <MetronomeInput
                    values={bpmList}
                    inputLabel="BPM"
                    value={bpm}
                    onChange={handleBpmChange}
                  />
                </div>
                <button
                  className="w-[10%] neuphormism-b-se p-3 "
                  type="button"
                  onClick={handlePlayClick}
                >
                  {isPlaying ? "Parar" : "Play!"}
                </button>
              </div>

              <div
                className={`p-10 w-[90%]  mx-auto rounded-md mb-2 transition-colors duration-100 ${
                  isOn ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="flex flex-col items-center justify-center ">
                  <h1 className="text-[150px]">{bpm}</h1>
                  <h1 className="text-xl">bpm</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Metronome;
