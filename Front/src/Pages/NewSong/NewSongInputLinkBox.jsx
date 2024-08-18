import axios from "axios";

/* eslint-disable react/prop-types */
function NewSongInputLinkBox({
  instrumentName,
  instument,
  setInstrument,
  progress,
  setProgress,
}) {
  const handledata = async () => {
    console.log(`instrumentName: ${instrumentName}`);
    console.log(`instrumentName: ${instument}`);
    console.log(`progress: ${progress}`);

    //  SCRAPPER

    // ENVIANDO OS DADOS REGISTRANDO A MUSIC
    try {
      const response = await axios.post(
        "https://www.api.live.eloygomes.com.br/api/newsong",
        {
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: {
            id: 1,
            song: "",
            artist: "",
            progressBar: 85,
            instruments: {
              guitar01: `${instrumentName === "GUITAR 01" ? true : false}`,
              guitar02: `${instrumentName === "GUITAR 02" ? true : false}`,
              bass: `${instrumentName === "BASS" ? true : false}`,
              keys: `${instrumentName === "KEYS" ? true : false}`,
              drums: `${instrumentName === "DRUMS" ? true : false}`,
              voice: `${instrumentName === "VOICE" ? true : false}`,
            },
            guitar01: {
              active: `${instrumentName === "GUITAR 01" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            guitar02: {
              active: `${instrumentName === "GUITAR 02" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            bass: {
              active: `${instrumentName === "BASS" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            keys: {
              active: `${instrumentName === "KEYS" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            drums: {
              active: `${instrumentName === "DRUMS" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            voice: {
              active: `${instrumentName === "VOICE" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            embedVideos: [],
            addedIn: "2024-08-16",
            updateIn: "2024-08-16",
            email: "cachorroni@email.com",
          },
        }
      );
      // console.log("User registered in API:", response.data);
    } catch (error) {
      console.error("Error registering user in API:", error);
      throw new Error("API registration failed");
    }
  };

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-se px-5 py-3">
      <div className="flex flex-row justify-between">
        <span className="text-sm pb-2 font-bold">{instrumentName}</span>
        <div className="flex flex-row">
          <span className="text-sm pb-2">STATUS:</span>
          <span className="text-sm pb-2">OFFLINE</span>
        </div>
      </div>
      <div className="flex flex-row h-6">
        <input
          type="text"
          name="guitar01link"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-sm text-sm"
          value={instument}
          onChange={(e) => setInstrument(e.target.value)}
        />
        <button
          className="px-1 ml-1 bg-blue-500 text-white rounded-sm "
          onClick={() => {
            handledata();
          }}
        >
          +
        </button>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-row items-center mt-1 w-1/2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-1/2"
          />
          <span className="ml-2 text-sm">{progress}%</span>
        </div>
        <div className="relative pt-1 mt-6 w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
