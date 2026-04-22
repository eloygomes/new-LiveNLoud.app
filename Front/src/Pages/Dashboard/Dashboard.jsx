import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import DashList2 from "./DashList2";
import FloatingActionButtons from "./FloatingActionButtons";
import SoftVersion from "./SoftVersion";

function Dashboard() {
  const [isMobile, setIsMobile] = useState("");

  // pega o searchTerm vindo do RootLayouts (via Outlet context)
  const { searchTerm = "" } = useOutletContext() || {};

  useEffect(() => {
    localStorage.setItem("cifraFROMDB", "");
    localStorage.setItem("fromWHERE", "");

    localStorage.setItem("artist", "");
    localStorage.setItem("song", "");

    const handleResize = () => {
      if (window.innerWidth <= 426) {
        setIsMobile(1);
      } else if (window.innerWidth <= 768 && window.innerWidth > 426) {
        setIsMobile(2);
      } else {
        setIsMobile(3);
      }
    };

    const handleOrientationChange = () => {
      window.location.reload();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    const shouldLockScroll = window.innerWidth > 1024;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow; // <html>

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 justify-center overflow-hidden pt-0 sm:pt-0 md:pt-5 lg:pt-1 xl:pt-1 2xl:pt-1">
      {isMobile === 1 || isMobile === 2 ? (
        <div className="mobile h-full min-h-0 w-full overflow-y-auto bg-[#f0f0f0] px-3 pt-3">
          <DashList2 searchTerm={searchTerm} />
          <FloatingActionButtons />
        </div>
      ) : isMobile === 3 ? (
        <div className="desktop mx-auto flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden px-4">
          <DashList2 searchTerm={searchTerm} />
          <FloatingActionButtons />
          <SoftVersion />
        </div>
      ) : null}
    </div>
  );
}

export default Dashboard;
