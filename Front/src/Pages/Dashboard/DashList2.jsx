import DashList2Items from "./DashList2Items";

function DashList2() {
  return (
    <div className="w-full h-full  overflow-scroll">
      <div className="container mx-auto ">
        <div className="flex flex-col mt-0">
          {/* // Header */}
          <div className="flex flex-row justify-around neuphormism-b p-3">
            <div className="w-[10%] text-center px-5">N</div>
            <div className="w-full px-5">SONGS</div>
            <div className="w-full pr-5">ARTISTS</div>
            <div className="w-full text-center px-5">PROGRESSION</div>

            <div className="w-full text-center px-5">INSTRUMENTS</div>
          </div>

          <ul>
            <DashList2Items />
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashList2;
