import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

function Tuner() {
  const [isTuning, setIsTuning] = useState(false);
  const socketRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    // Estabelecer a conexão com o servidor Socket.IO
    socketRef.current = io("http://api.live.eloygomes.com.br:3000", {
      query: { email: userEmail, pipa: "odeio" }, // Substitua pelo email do usuário, se necessário
      transports: ["websocket"], // Opcional: força o uso de WebSocket
    });

    // Evento disparado quando a conexão é estabelecida
    socketRef.current.on("connect", () => {
      console.log("Conectado ao servidor Socket.IO:", socketRef.current.id);
    });

    // Evento disparado quando a conexão é perdida
    socketRef.current.on("disconnect", () => {
      console.log("Desconectado do servidor Socket.IO");
    });

    // Limpeza na desmontagem do componente
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userEmail]);

  const sendMsg = () => {
    if (socketRef.current) {
      // Enviar uma mensagem para o servidor
      socketRef.current.emit("mensagemDoCliente", {
        conteudo: "Olá do cliente!",
      });
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
                    onClick={() => {
                      setIsTuning(true);
                      sendMsg();
                    }}
                  >
                    Start Listening...
                  </button>
                ) : (
                  <button
                    className="neuphormism-b-se p-3 px-10 mx-auto"
                    type="button"
                    onClick={() => {
                      setIsTuning(false);
                      sendMsg();
                    }}
                  >
                    Stop Listening
                  </button>
                )}
              </div>
              <div className="p-10 w-[90%] mx-auto py-72 rounded-md mb-2 neuphormism-b">
                <div className="flex items-center justify-center">
                  <h1 className="text-[150px]">{"..."}</h1>
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
