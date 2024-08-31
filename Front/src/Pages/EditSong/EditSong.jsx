import { useEffect, useState } from "react";
import EditSongColumnA from "./EditSongColumnA";
import EditSongColumnB from "./EditSongColumnB";
import { fetchAllSongData } from "../../Tools/Controllers";

function EditSong() {
  const [dataFromAPI, setDataFromAPI] = useState([]);

  // LocalStorage user email
  const userEmail = localStorage.getItem("userEmail");
  const artist = localStorage.getItem("artist");
  const song = localStorage.getItem("song");

  const loadDataFromUser = async () => {
    // eslint-disable-next-line no-unused-vars
    const data = await fetchAllSongData(userEmail, artist, song)
      .then((data) => {
        // console.log("Song data:", data);
        setDataFromAPI(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
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
              <EditSongColumnA dataFromAPI={dataFromAPI} />
            </div>
            <div className="right-column w-1/2">
              <EditSongColumnB dataFromAPI={dataFromAPI} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSong;
