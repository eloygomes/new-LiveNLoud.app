import { useEffect, useState } from "react";
import io from "socket.io-client";

function Tuner() {
  const [note, setNote] = useState("");
  const [isTuning, setIsTuning] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Limpa o socket ao desmontar o componente
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const startTuning = async () => {
    setIsTuning(true);

    // Estabelecer conexão com o servidor WebSocket
    const newSocket = io("https://www.api.live.eloygomes.com.br", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Conectado ao servidor WebSocket");
    });

    newSocket.on("noteDetected", (data) => {
      // Recebe a nota detectada do servidor Python
      setNote(data.note);
    });

    newSocket.on("disconnect", () => {
      console.log("Desconectado do servidor WebSocket");
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        // Envia os dados de áudio para o servidor Node.js
        newSocket.emit("audioData", Array.from(audioData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (error) {
      console.error("Erro ao acessar o microfone:", error);
    }
  };

  const stopTuning = () => {
    setIsTuning(false);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Tuner</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Should be the G string, almost always is!
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start py-5 w-[90%] mx-auto rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                {!isTuning ? (
                  <button
                    className="neuphormism-b-se p-3 px-10 mx-auto"
                    type="button"
                    onClick={startTuning}
                  >
                    Start Listening...
                  </button>
                ) : (
                  <button
                    className="neuphormism-b-se p-3 px-10 mx-auto"
                    type="button"
                    onClick={stopTuning}
                  >
                    Stop Listening
                  </button>
                )}
              </div>
              <div className="p-10 w-[90%] mx-auto py-72 rounded-md mb-2 neuphormism-b">
                <div className="flex items-center justify-center">
                  <h1 className="text-[150px]">{note || "..."}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tuner;
