/* eslint-disable react/prop-types */
function NewSongInputLinkBox({
  instrumentName,
  instument,
  setInstrument,
  progress,
  setProgress,
}) {
  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b p-5">
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
          className="w-full p-1 border border-gray-300 rounded-lg text-sm"
          value={instument}
          onChange={(e) => setInstrument(e.target.value)}
        />
        <button className="px-1 ml-1 bg-blue-500 text-white rounded-lg">
          +
        </button>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-row items-center mt-2 w-1/2">
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
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
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
