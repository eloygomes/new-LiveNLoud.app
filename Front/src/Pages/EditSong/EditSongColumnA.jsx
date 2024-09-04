/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import EditSongEmbed from "./EditSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import EditSongSongData from "./EditSongSongData";
import { deleteOneSong } from "../../Tools/Controllers";
import { useNavigate } from "react-router-dom";

function EditSongColumnA({ dataFromAPI }) {
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [capoData, setCapoData] = useState("");
  const [tomData, setTomData] = useState("");
  const [tunerData, setTunerData] = useState("");
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState([]);
  const [firstPlay, setFirstPlay] = useState(false);
  const [lastPlay, setLastPlay] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Controls the modal visibility
  const [isDeleting, setIsDeleting] = useState(false); // Tracks the deletion process

  const navigate = useNavigate();

  useEffect(() => {
    if (dataFromAPI && typeof dataFromAPI === "string") {
      try {
        const parsedData = JSON.parse(dataFromAPI);
        console.log("Parsed dataFromAPI:", parsedData);

        setArtistName(parsedData.artist || "");
        setSongName(parsedData.song || "");

        setCapoData(parsedData.capo || "N/A");
        setTomData(parsedData.tom || "N/A");
        setTunerData(parsedData.tuning || "N/A");

        setGeralPercentage(parsedData.progressBar || 0);
        setEmbedLink(parsedData.embedVideos || []);

        setFirstPlay(parsedData.addedIn);
        setLastPlay(parsedData.addedIn);
      } catch (error) {
        console.error("Failed to parse dataFromAPI:", error);
      }
    }
  }, [dataFromAPI]);

  // Function to handle the deletion logic
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Perform the deletion here (e.g., API call)
      // await deleteSongFromAPI(artistName, songName); // Example function to delete

      deleteOneSong(artistName, songName);

      console.log(`Song: ${songName} by ${artistName} has been deleted.`);

      setIsDeleting(false);
      setShowDeleteModal(false); // Close the modal after deletion
      navigate("/");
    } catch (error) {
      console.error("Failed to delete song:", error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <EditSongSongData
        songName={songName}
        artistName={artistName}
        capoData={capoData}
        tomData={tomData}
        tunerData={tunerData}
        fistTime={firstPlay}
        lastTime={lastPlay}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />

      {/* Passando setEmbedLink corretamente */}
      <EditSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

      <div className="flex flex-row neuphormism-b p-5 my-5 mr-5 justify-start">
        <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Update
        </button>
        <button
          className="bg-red-500 hover:bg-blue-700 text-white font-bold ml-5 py-2 px-4 rounded"
          onClick={() => setShowDeleteModal(true)} // Show the modal on click
        >
          DELETE
        </button>
      </div>

      {/* Modal for deletion confirmation */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <div className="bg-white p-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Are you sure you want to delete this song?
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                  disabled={isDeleting} // Disable the button while deleting
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)} // Close the modal
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EditSongColumnA;
