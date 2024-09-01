import { useEffect, useState } from "react";

/* eslint-disable react/prop-types */
function EditSongInputLinkBox({
  instrumentName,
  link,
  setInstrument,
  progress,
  setProgress,
  dataFromAPI,
}) {
  const [dataFromAPIParsed, setDataFromAPIParsed] = useState(null);

  useEffect(() => {
    try {
      if (typeof dataFromAPI === "string" && dataFromAPI.trim() !== "") {
        const dataToLoad = JSON.parse(dataFromAPI);
        setDataFromAPIParsed(dataToLoad);
      } else if (typeof dataFromAPI === "object" && dataFromAPI !== null) {
        setDataFromAPIParsed(dataFromAPI);
      } else {
        console.warn("Invalid or empty dataFromAPI:", dataFromAPI);
        setDataFromAPIParsed({});
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      setDataFromAPIParsed({});
    }
  }, [dataFromAPI]);

  useEffect(() => {
    if (dataFromAPIParsed) {
      const instrumentData = dataFromAPIParsed[instrumentName];
      if (instrumentData && instrumentData.link) {
        setInstrument(instrumentData.link);
        setProgress(instrumentData.progress);
      }
    }
  }, [dataFromAPIParsed, instrumentName, setInstrument, setProgress]);

  console.log(link);

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      <div className="flex flex-row justify-between">
        <span className="text-sm pb-2 font-bold">
          {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
        </span>
        <h6>{}</h6>
        <div className="flex flex-row">
          <span
            className={`${
              link ? "text-green-500" : "text-red-500"
            } text-sm rounded-sm`}
          >
            {link ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex flex-row h-6">
        <input
          type="text"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-sm text-sm"
          value={link.link}
          onChange={(e) => setInstrument(e.target.value)}
        />
      </div>
      <div className="flex flex-row">
        <div className="flex flex-row items-center mt-1 w-1/2">
          <input
            type="range"
            min="0"
            max="100"
            value={link.progress}
            onChange={(e) => setProgress(Number(parseInt(e.target.value, 10)))}
            className="w-1/2"
          />
        </div>
        <div className="relative flex flex-row pt-1 w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
            <div
              style={{ width: `${link.progress || 0}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
            ></div>
          </div>
          <div className="w-1/3 pl-4 py-3 ml-5 text-right">
            <span className="text-sm ml-auto">{link.progress || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSongInputLinkBox;
