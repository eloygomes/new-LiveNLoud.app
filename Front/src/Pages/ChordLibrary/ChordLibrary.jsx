import { useState } from "react";
import ChordInput from "./ChordInput";
import { PersonalChordLibrary } from "./PersonalChordLibrary";
import ChordDisplay from "./ChordDisplay";

// Extraímos as opções únicas de cada parte dos acordes da biblioteca.
const roots = [...new Set(PersonalChordLibrary.map((chord) => chord.root))];
const qualities = [
  ...new Set(PersonalChordLibrary.map((chord) => chord.quality)),
];
const tensions = [
  ...new Set(PersonalChordLibrary.map((chord) => chord.tension)),
];
const basses = [...new Set(PersonalChordLibrary.map((chord) => chord.bass))];

function ChordLibrary() {
  // Estados para armazenar as seleções do usuário
  const [selectedRoot, setSelectedRoot] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [selectedTension, setSelectedTension] = useState("");
  const [selectedBass, setSelectedBass] = useState("");

  // Estados para pegar o nome do acorde
  const [stringsToDisplay, setStringsToDisplay] = useState("");
  const [fingeringToDisplay, setFingeringToDisplay] = useState("");
  const [chordNameToDisplay, setChordNameToDisplay] = useState("");

  // Função para concatenar as seleções e formar o nome do acorde
  const getChordName = () => {
    // return `${selectedRoot}${selectedQuality ? `/${selectedQuality}` : ""}${
    //   selectedTension ? ` ${selectedTension}` : ""
    // }${selectedBass ? `/${selectedBass}` : ""}`;
    return `${selectedRoot || ""}${
      selectedQuality ? `,${selectedQuality}` : ","
    }${selectedTension ? `,${selectedTension}` : ","}${
      selectedBass ? `,${selectedBass}` : ""
    }`;
  };

  const getChord = () => {
    const selectedChord = getChordName().trim();
    console.log("selectedChord", selectedChord);

    // Separar o nome base (root + quality + tension) e o bass
    const [baseName, bassName] = selectedChord.split("/");

    const chord = PersonalChordLibrary.find((chord) => {
      // Comparar root ignorando diferenças de grafia
      const rootMatch =
        chord.root.toLowerCase() === baseName.split(",")[0].toLowerCase();

      // Comparar quality, tension, e bass ignorando diferenças de grafia
      const qualityMatch = selectedQuality
        ? chord.quality.toLowerCase() === selectedQuality.toLowerCase()
        : !chord.quality;

      const tensionMatch = selectedTension
        ? chord.tension.toLowerCase() === selectedTension.toLowerCase()
        : !chord.tension;

      const bassMatch = bassName
        ? chord.bass.toLowerCase() === bassName.toLowerCase()
        : !chord.bass;

      return rootMatch && qualityMatch && tensionMatch && bassMatch;
    });

    if (chord) {
      console.log("Chord found:", chord);
      setStringsToDisplay(chord.strings);
      setFingeringToDisplay(chord.fingering);
      setChordNameToDisplay(chord.chordName);
    } else {
      console.log("No chord found for", selectedChord);
    }
  };
  // console.log(PersonalChordLibrary[0].strings); //X 3 2 0 1 0
  // console.log(PersonalChordLibrary[0].fingering);

  // console.log("ChordLibrary", PersonalChordLibrary);
  console.log(getChordName());

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Chord Library</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Find the correct chord for you here!
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start w-[90%] mx-auto rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <div className="w-[90%] flex flex-row justify-start">
                  <ChordInput
                    values={roots}
                    setSelectedRoot={setSelectedRoot}
                    inputLabel="Root"
                  />
                  <ChordInput
                    values={qualities}
                    setSelectedQuality={setSelectedQuality}
                    inputLabel="Quality"
                  />
                  <ChordInput
                    values={tensions}
                    setSelectedTension={setSelectedTension}
                    inputLabel="Tension"
                  />
                  <ChordInput
                    values={basses}
                    setSelectedBass={setSelectedBass}
                    inputLabel="Bass"
                  />
                </div>
                <button
                  className="flex items-center justify-center neuphormism-b-btn p-3"
                  type="button"
                  onClick={() => {
                    getChord();
                  }}
                >
                  Search
                </button>
              </div>
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <h1 className="text-3xl flex-1  text-center mx-auto">
                  {getChordName() || "Select a chord"}
                </h1>
              </div>
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <div className="flex items-center justify-center mx-auto">
                  <ChordDisplay
                    // strings={PersonalChordLibrary[0].strings}
                    strings={stringsToDisplay}
                    // fingering={PersonalChordLibrary[0].fingering}
                    fingering={fingeringToDisplay}
                    // chordName={PersonalChordLibrary[0].chordName}
                    chordName={chordNameToDisplay}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChordLibrary;
