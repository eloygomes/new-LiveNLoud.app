import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

function Tuner() {
  const [isTuning, setIsTuning] = useState(false);
  const [tunerNote, setTunerNote] = useState("");
  const [tuningBar, setTuningBar] = useState("");
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    // Estabelecer a conexão com o servidor Socket.IO
    socketRef.current = io("http://api.live.eloygomes.com.br:3000", {
      query: { email: userEmail },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Conectado ao servidor Socket.IO:", socketRef.current.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Desconectado do servidor Socket.IO");
    });

    // Listener para a resposta do servidor
    socketRef.current.on("messageFromServer", (data) => {
      // console.log("Resposta recebida do servidor:", data.tuningBar);
      setTunerNote(data.note);
      setTuningBar(data.tuningBar);
      // Aqui você pode atualizar o estado ou exibir os resultados
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("messageFromServer");
        socketRef.current.disconnect();
      }
    };
  }, [userEmail]);

  const startRecording = async () => {
    if (!navigator.mediaDevices.getUserMedia) {
      alert("Seu navegador não suporta captura de áudio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0);
        // Converte o Float32Array em ArrayBuffer
        const audioBuffer = float32ToInt16(audioData);
        // Envia o áudio ao servidor
        socketRef.current.emit("messageToServer", { audioData: audioBuffer });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      mediaRecorderRef.current = { stream, audioContext, processor };
    } catch (error) {
      console.error("Erro ao acessar o microfone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      const { stream, audioContext, processor, source } =
        mediaRecorderRef.current;
      processor.disconnect();
      source.disconnect();
      audioContext.close();
      stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
  };

  const float32ToInt16 = (buffer) => {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, buffer[l]) * 0x7fff;
    }
    return buf.buffer;
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
            <div className="flex flex-col justify-start  w-[90%]  mx-auto  rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                {
                  <button
                    className="neuphormism-b-se p-3 px-10 mx-auto"
                    type="button"
                    onClick={() => {
                      if (!isTuning) {
                        setIsTuning(true);
                        startRecording();
                      } else {
                        setIsTuning(false);
                        stopRecording();
                      }
                    }}
                  >
                    {isTuning ? "Stop Listening" : "Start Listening..."}
                  </button>
                }
              </div>
              <div className="p-10 w-[90%] mx-auto  rounded-md mb-2 neuphormism-b">
                <div className="flex flex-col items-center justify-center">
                  <h1 className="text-[150px]">{tunerNote || "..."}</h1>
                  <h1 className="text-[25px]">{tuningBar || "..."}</h1>
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
