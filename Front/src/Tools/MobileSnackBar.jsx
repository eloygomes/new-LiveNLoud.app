/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

function MobileSnackBar({ snackbarMessage }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (snackbarMessage.title || snackbarMessage.message) {
      setVisible(true);

      const level = String(snackbarMessage.title || "").toLowerCase();
      if (level === "load") {
        return undefined;
      }

      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [snackbarMessage]);

  return (
    <div
      className={`fixed left-3 right-3 top-3 z-[140] transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
      }`}
      role="alert"
    >
      <div className="rounded-[18px] border border-black/5 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[goldenrod]" />
          <div className="min-w-0">
            <p className="text-sm font-black text-black">
              {snackbarMessage.title}
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-600">
              {snackbarMessage.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileSnackBar;
