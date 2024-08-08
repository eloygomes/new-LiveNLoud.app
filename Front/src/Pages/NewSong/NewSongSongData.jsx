function NewSongSongData({
  songName,
  artistName,
  capoData,
  tomData,
  tunerData,
  fistTime,
  lastTime,
}) {
  return (
    <div className="flex flex-row neuphormism-b p-5 my-5 mr-5">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Song Data</h1>
        <div className="flex flex-col mt-2 w-full neuphormism-b-se p-2 px-3 ">
          <span className="text-sm py-1 font-bold ">SONG</span>
          <div className="text-sm">{songName}</div>
        </div>
        <div className="flex flex-col my-5 w-full neuphormism-b-se py-2 px-3">
          <span className="text-sm py-1 font-bold ">ARTIST</span>
          <div className="text-sm">{artistName}</div>
        </div>
        <div className="flex flex-row  justify-between">
          <div className="w-full flex flex-col pr-2 neuphormism-b-se py-2 px-3  mr-5">
            <p className="text-sm py-1 font-bold">CAPO</p>
            <div className="text-sm">{capoData}</div>
          </div>
          <div className="w-full flex flex-col pr-2 neuphormism-b-se py-2 px-3  mr-5">
            <p className="text-sm py-1 font-bold">TOM</p>
            <div className="text-sm">{tomData}</div>
          </div>
          <div className="w-full flex flex-col pr-2 neuphormism-b-se py-2 px-3 bg-pink-300 hover:bg-gray-900">
            <p className="text-sm py-1 font-bold">TUNER</p>
            <div className="text-sm">{tunerData}</div>
          </div>
        </div>
        <div className="flex flex-row mt-5 justify-between">
          <div className="w-full flex flex-col pr-2 neuphormism-b-se py-2 px-3  mr-5">
            <p className="text-sm py-1 font-bold">ADDEDED</p>
            <div className="text-sm">{fistTime}</div>
          </div>
          <div className="w-full flex flex-col pr-2 neuphormism-b-se py-2 px-3 ">
            <p className="text-sm py-1 font-bold">LAST PLAY</p>
            <div className="text-sm">{lastTime}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongSongData;
