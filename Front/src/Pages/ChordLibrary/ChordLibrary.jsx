import ChordInput from "./ChordInput";

const musicNotes = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
];

const musicNotesVariants = [
  "",
  "º",
  "4",
  "7",
  "7+",
  "9",
  "4/7",
  "5-/7",
  "4/9",
  "7/9",
  "7/9-",
  "m",
  "m7",
  "m4/7",
  "m9",
  "m5-/7",
];

function ChordLibrary() {
  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">CHORD LIBRARY</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Find the correct chord for you here!
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start py-5 w-[90%]  mx-auto  rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%]  mx-auto mb-5 rounded-md neuphormism-b">
                <div className="w-[90%] flex flex-row justify-start">
                  <ChordInput values={musicNotes} inputLabel="Root" />
                  <ChordInput
                    values={musicNotesVariants}
                    inputLabel="Variants"
                  />
                  <ChordInput values={musicNotes} inputLabel="Bass" />
                </div>
                <button className="w-[10%] neuphormism-b-se p-5 " type="button">
                  Search
                </button>
              </div>

              <div className="p-10  w-[90%]  mx-auto py-96 rounded-md mb-2 neuphormism-b ">
                CHORD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChordLibrary;
