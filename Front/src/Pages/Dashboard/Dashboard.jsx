import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import DashList2 from "./DashList2";
import FloatingActionButtons from "./FloatingActionButtons";
import Rotate from "../../assets/userPerfil.jpg";
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
    window.addEventListener("orientationchange", handleOrientationChange);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow; // <html>

    // trava scroll global
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      // restaura quando sair do Dashboard
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  return (
    <div className="flex justify-center h-screen pt-0 sm:pt-0 md:pt-5 lg:pt-1 xl:pt-1 2xl:pt-1 overflow-y-hidden">
      {isMobile === 1 ? (
        <div className="bg-black flex justify-center items-center">
          <div className="container mx-auto">
            <div className="flex flex-col">
              <img src={Rotate} alt="Rotate Device" />
            </div>
          </div>
        </div>
      ) : isMobile === 2 ? (
        <div className="w-full mobile ">
          <DashList2 searchTerm={searchTerm} />
          <FloatingActionButtons />
        </div>
      ) : isMobile === 3 ? (
        <div className="container mx-auto desktop">
          <DashList2 searchTerm={searchTerm} />
          <FloatingActionButtons />
          <SoftVersion />
        </div>
      ) : null}
    </div>
  );
}

export default Dashboard;
