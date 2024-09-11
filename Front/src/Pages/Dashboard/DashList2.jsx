import { useEffect, useState } from "react";
import DashList2Items from "./DashList2Items";

function DashList2() {
  const [isMobile, setIsMobile] = useState("");

  useEffect(() => {
    if (window.innerWidth <= 845) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  return (
    <div className="w-full h-full">
      {isMobile ? (
        <div className="">
          <div className="flex flex-col mt-0">
            {/* Header que ficará fixo no topo */}
            <div className="flex flex-row justify-around neuphormism-b p-3 sticky top-0 bg-white z-50">
              <div className="w-[10%] text-center px-1">N</div>
              <div className="w-full px-5">SONGS</div>
              <div className="w-full pr-5">ARTISTS</div>
              <div className="w-full text-center px-5">PROGRESSION</div>
              <div className="w-full text-center px-5">INSTRUMENTS</div>
            </div>

            <ul className="overflow-auto h-screen mb-20">
              <DashList2Items />
            </ul>
          </div>
        </div>
      ) : (
        <div className="container mx-auto">
          <div className="flex flex-col mt-0">
            {/* Header que ficará fixo no topo */}
            <div className="flex flex-row justify-around neuphormism-b p-3 sticky top-[68px] bg-white z-50">
              <div className="w-[10%] text-center px-5">N</div>
              <div className="w-full px-5">SONGS</div>
              <div className="w-full pr-5">ARTISTS</div>
              <div className="w-full text-center px-5">PROGRESSION</div>
              <div className="w-full text-center px-5">INSTRUMENTS</div>
            </div>

            <ul className="overflow-auto h-screen">
              <DashList2Items />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashList2;
