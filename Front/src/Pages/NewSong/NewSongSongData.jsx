/* eslint-disable react/prop-types */
import { formatDisplayDate } from "../../Tools/dateFormat";

function NewSongSongData({
  songName,
  artistName,
  capoData,
  tomData,
  tunerData,
  fistTime,
  lastTime,
  touchLayout = false,
}) {
  const addedDate = formatDisplayDate(fistTime) || "-";
  const lastPlayDate = formatDisplayDate(lastTime) || "not played yet";

  if (touchLayout) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-3">
          <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
            <div className="text-[11px] font-bold uppercase text-gray-500">Artist</div>
            <div className="mt-1 text-base font-bold text-black">{artistName || "-"}</div>
          </div>
          <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
            <div className="text-[11px] font-bold uppercase text-gray-500">Song</div>
            <div className="mt-1 text-base font-bold text-black">{songName || "-"}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">Capo</div>
              <div className="mt-1 text-sm font-bold text-black">{capoData || "-"}</div>
            </div>
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">Tom</div>
              <div className="mt-1 text-sm font-bold text-black">{tomData || "-"}</div>
            </div>
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">Tuning</div>
              <div className="mt-1 text-sm font-bold text-black">{tunerData || "-"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">Added</div>
              <div className="mt-1 text-sm font-bold text-black">{addedDate}</div>
            </div>
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">Last play</div>
              <div className="mt-1 text-sm font-bold text-black">{lastPlayDate}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Song Data</h1>
        <div className="flex flex-col mt-2 w-full neuphormism-b-btn p-2 px-3 ">
          <span className="text-sm py-1 font-bold ">SONG</span>
          <div className="text-sm">{songName}</div>
        </div>
        <div className="flex flex-col my-5 w-full neuphormism-b-btn py-2 px-3">
          <span className="text-sm py-1 font-bold ">ARTIST</span>
          <div className="text-sm">{artistName}</div>
        </div>
        <div className="flex flex-row  justify-between">
          <div className="w-full flex flex-col pr-2 neuphormism-b-btn py-2 px-3  mr-5">
            <p className="text-sm py-1 font-bold">CAPO</p>
            <div className="text-sm">{capoData}</div>
          </div>
          <div className="w-full flex flex-col pr-2 neuphormism-b-btn py-2 px-3  mr-5">
            <p className="text-sm py-1 font-bold">TOM</p>
            <div className="text-sm">{tomData}</div>
          </div>
          <div className="w-full flex flex-col pr-2 neuphormism-b-btn py-2 px-3 bg-pink-300 hover:bg-gray-900">
            <p className="text-sm py-1 font-bold">TUNER</p>
            <div className="text-sm">{tunerData}</div>
          </div>
        </div>
        <div className="flex flex-row mt-5 justify-between">
          <div className="w-full flex flex-col pr-2 neuphormism-b-btn py-2 px-3  mr-5">
            <p className="text-sm py-1 font-bold">ADDEDED</p>
            <div className="text-sm">{addedDate}</div>
          </div>
          <div className="w-full flex flex-col pr-2 neuphormism-b-btn py-2 px-3 ">
            <p className="text-sm py-1 font-bold">LAST PLAY</p>
            <div className="text-sm">{lastPlayDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongSongData;
