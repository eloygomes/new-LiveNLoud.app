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
            <div className="text-[11px] font-bold uppercase text-gray-500">
              Artist
            </div>
            <div className="mt-1 text-base font-bold text-black">
              {artistName || "-"}
            </div>
          </div>
          <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
            <div className="text-[11px] font-bold uppercase text-gray-500">
              Song
            </div>
            <div className="mt-1 text-base font-bold text-black">
              {songName || "-"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">
                Capo
              </div>
              <div className="mt-1 text-sm font-bold text-black">
                {capoData || "-"}
              </div>
            </div>
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">
                Tom
              </div>
              <div className="mt-1 text-sm font-bold text-black">
                {tomData || "-"}
              </div>
            </div>
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">
                Tuning
              </div>
              <div className="mt-1 text-sm font-bold text-black">
                {tunerData || "-"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">
                Added
              </div>
              <div className="mt-1 text-sm font-bold text-black">
                {addedDate}
              </div>
            </div>
            <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
              <div className="text-[11px] font-bold uppercase text-gray-500">
                Last play
              </div>
              <div className="mt-1 text-sm font-bold text-black">
                {lastPlayDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-5 mr-5 rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex flex-col w-full">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
            Song data
          </p>
          {/* <h1 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black">
            Song Data
          </h1> */}
        </div>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Song name
            </span>
            <div className="mt-2 text-xl font-bold text-black">
              {songName || "-"}
            </div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Artist name
            </span>
            <div className="mt-2 text-xl font-black text-black">
              {artistName || "-"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Capo
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {capoData || "-"}
            </div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Tom
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {tomData || "-"}
            </div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Tuning
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {tunerData || "-"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Added
            </p>
            <div className="mt-2 text-sm font-bold text-bold">{addedDate}</div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              Last play
            </p>
            <div className="mt-2 text-sm font-bold text-bold">
              {lastPlayDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongSongData;
