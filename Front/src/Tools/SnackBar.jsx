/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

function SnackBar({ snackbarMessage }) {
  const [visible, setVisible] = useState(false);
  const [side, setSide] = useState("left");

  useEffect(() => {
    if (snackbarMessage.title || snackbarMessage.message) {
      setVisible(true);

      const level = String(snackbarMessage.title || "").toLowerCase();
      const payload = `[SnackBar] ${snackbarMessage.title}: ${snackbarMessage.message}`;
      if (level === "error") {
        console.error(payload);
      } else {
        console.log(payload);
      }

      // Definir um tempo para ocultar automaticamente após 3 segundos, por exemplo
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [snackbarMessage]);

  useEffect(() => {
    if (!visible) return undefined;

    const handleMouseMove = (event) => {
      const margin = 220;
      const nearBottom = window.innerHeight - event.clientY < 180;
      const nearLeft = event.clientX < margin;
      const nearRight = window.innerWidth - event.clientX < margin;

      if (side === "left" && nearBottom && nearLeft) {
        setSide("right");
      } else if (side === "right" && nearBottom && nearRight) {
        setSide("left");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [side, visible]);

  return (
    <div
      className={`${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 "
      } ${
        side === "left" ? "left-5" : "right-5"
      } bg-gray-100 border-t-4 border-gray-500 rounded-b text-gray-900 px-4 py-3 shadow-md fixed bottom-10 transition-all duration-300 ease-in-out neuphormism-b-btn-flat z-50`}
      role="alert"
    >
      <div className="flex">
        <div className="py-1">
          <svg
            className="fill-current h-6 w-6 text-gray-500 mr-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
          </svg>
        </div>
        <div>
          <p className="font-bold">{snackbarMessage.title}</p>
          <p className="text-sm">{snackbarMessage.message}</p>
        </div>
      </div>
    </div>
  );
}

export default SnackBar;
