import { useEffect, useState } from "react";
import EditSongColumnA from "./EditSongColumnA";
import EditSongColumnB from "./EditSongColumnB";
import { fetchAllSongData } from "../../Tools/Controllers";

function EditSong() {
  const [dataFromAPI, setDataFromAPI] = useState([]);

  // Column B
  const [progGuitar01, setProgGuitar01] = useState(0);
  const [progGuitar02, setProgGuitar02] = useState(0);
  const [progBass, setProgBass] = useState(0);
  const [progKey, setProgKey] = useState(0);
  const [progDrums, setProgDrums] = useState(0);
  const [progVoice, setProgVoice] = useState(0);

  // LocalStorage user email
  const userEmail = localStorage.getItem("userEmail");
  const artist = localStorage.getItem("artist");
  const song = localStorage.getItem("song");

  const loadDataFromUser = async () => {
    try {
      const data = await fetchAllSongData(userEmail, artist, song);
      if (data) {
        // console.log("Data fetched from API:", data); // Para verificar o que está sendo retornado
        setDataFromAPI(data);
      } else {
        console.warn("No data returned from API");
      }
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  useEffect(() => {
    loadDataFromUser();
  }, []);

  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Edit song</h1>
            <h4 className="ml-auto mt-auto text-sm">Edit your song here</h4>
          </div>
          <div className="flex flex-row">
            <div className="left-column w-1/2">
              <EditSongColumnA
                dataFromAPI={dataFromAPI}
                progGuitar01={progGuitar01}
                progGuitar02={progGuitar02}
                progBass={progBass}
                progKey={progKey}
                progDrums={progDrums}
                progVoice={progVoice}
              />
            </div>
            <div className="right-column w-1/2">
              <EditSongColumnB
                dataFromAPI={dataFromAPI}
                progGuitar01={progGuitar01}
                setProgGuitar01={setProgGuitar01}
                progGuitar02={progGuitar02}
                setProgGuitar02={setProgGuitar02}
                progBass={progBass}
                setProgBass={setProgBass}
                progKey={progKey}
                setProgKey={setProgKey}
                progDrums={progDrums}
                setProgDrums={setProgDrums}
                progVoice={progVoice}
                setProgVoice={setProgVoice}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSong;
