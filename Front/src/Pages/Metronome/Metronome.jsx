import MetronomeInput from "./MetronomeInput";

const bpmList = [
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140,
  145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215,
  220, 225, 230, 235, 240,
];

function Metronome() {
  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Metronome</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Choose your BPM and hit play!
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start py-5 w-[90%]  mx-auto  rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%]  mx-auto mb-5 rounded-md neuphormism-b">
                <div className="w-[90%] flex flex-row justify-start">
                  <MetronomeInput values={bpmList} inputLabel="Bpm" />
                </div>
                <button className="w-[10%] neuphormism-b-se p-3 " type="button">
                  Play!
                </button>
              </div>

              <div className="p-10  w-[90%]  mx-auto py-72 rounded-md mb-2 neuphormism-b ">
                <div className="flex flex-col items-center justify-center ">
                  <h1 className="text-[150px]">190</h1>
                  <h1 className="text-xl">bpm</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Metronome;
