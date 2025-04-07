import { useState, useEffect } from "react";
import DashList2 from "./DashList2";
import FloatingActionButtons from "./FloatingActionButtons";
import Rotate from "../../assets/auto-rotate-img.gif";

function Dashboard() {
  // Estado para armazenar se a tela é mobile (largura <= 426px)
  const [isMobile, setIsMobile] = useState("");

  // useEffect para monitorar mudanças no tamanho da janela e detectar rotação
  useEffect(() => {
    // localStorage.clear("cifraFROMDB");
    // localStorage.clear("fromWHERE");

    const handleResize = () => {
      if (window.innerWidth <= 426) {
        setIsMobile(1);
        console.log(1);
      } else if (window.innerWidth <= 768 && window.innerWidth > 426) {
        setIsMobile(2);
        console.log(2);
      } else {
        setIsMobile(3);
        console.log(3);
      }
    };

    // Recarregar a página na rotação do celular
    const handleOrientationChange = () => {
      window.location.reload();
    };

    // Adiciona listener de redimensionamento
    window.addEventListener("resize", handleResize);

    // Adiciona listener de mudança de orientação
    window.addEventListener("orientationchange", handleOrientationChange);

    // Executa a função handleResize uma vez para ajustar o estado inicial
    handleResize();

    // Remove os event listeners quando o componente desmontar
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return (
    <div className="flex justify-center h-screen pt-0 sm:pt-0 md:pt-5 lg:pt-1 xl:pt-1 2xl:pt-1 overflow-y-hidden">
      {isMobile === 1 ? (
        <>
          <div className="bg-black flex justify-center items-center">
            <div className="container mx-auto">
              <div className="flex flex-col">
                <img src={Rotate} alt="Rotate Device" />
              </div>
            </div>
          </div>
        </>
      ) : isMobile === 2 ? (
        <>
          <div className="w-full mobile deitado">
            <DashList2 />
            <FloatingActionButtons />
          </div>
        </>
      ) : isMobile === 3 ? (
        <>
          <div className="container mx-auto desktop">
            <DashList2 />
            <FloatingActionButtons />
          </div>
        </>
      ) : null}
    </div>
  );
}

export default Dashboard;
