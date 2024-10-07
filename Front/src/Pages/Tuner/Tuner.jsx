import { useEffect, useState } from "react";
import io from "socket.io-client";

function Tuner() {
  const [note, setNote] = useState("");
  const [isTuning, setIsTuning] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log("Attempting to connect to WebSocket...");

    // Establish WebSocket connection when the component mounts
    const newSocket = io("https://www.api.live.eloygomes.com.br", {
      path: "/socket.io",
      transports: ["websocket"],
      secure: true,
      rejectUnauthorized: false, // Ignore SSL issues for development (set to true for production)
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server. Reason:", reason);
    });

    newSocket.on("message", (data) => {
      console.log("Message from server:", data);
    });

    newSocket.on("noteDetected", (data) => {
      setNote(data.note);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    // Clean up WebSocket connection when the component unmounts
    return () => {
      if (newSocket) {
        console.log("Disconnecting from WebSocket...");
        newSocket.disconnect();
      }
    };
  }, []);

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
                    onClick={() => setIsTuning(true)}
                  >
                    Start Listening...
                  </button>
                ) : (
                  <button
                    className="neuphormism-b-se p-3 px-10 mx-auto"
                    type="button"
                    onClick={() => setIsTuning(false)}
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
