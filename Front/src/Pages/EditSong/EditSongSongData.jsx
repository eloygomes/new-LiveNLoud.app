/* eslint-disable react/prop-types */
import { formatDisplayDate } from "../../Tools/dateFormat";

function EditSongSongData({
  songName,
  artistName,
  setSongName,
  setArtistName,
  onIdentityChange,
  capoData,
  tomData,
  tunerData,
  fistTime,
  lastTime,
  touchLayout = false,
  compact = false,
  geralPercentage = 0,
}) {
  const addedDate = formatDisplayDate(fistTime) || "-";
  const lastPlayDate = formatDisplayDate(lastTime) || "not played yet";
  const identityInputClass =
    "mt-1 w-full min-w-0 bg-transparent font-bold text-black outline-none placeholder:text-gray-400 focus:ring-0";
  const updateIdentity = (setter) => (event) => {
    setter?.(event.target.value);
    onIdentityChange?.();
  };

  if (touchLayout) {
    if (compact) {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-2.5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">Song Data</div>
              <div className="mt-1 text-[10px] font-semibold text-gray-500">Current saved information</div>
            </div>
            <div className="rounded-full bg-black px-3 py-1.5 text-[11px] font-bold text-white">{Number(geralPercentage || 0)}%</div>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2">
            {[["Song", songName, setSongName], ["Artist", artistName, setArtistName]].map(([label, value, setter]) => (
              <div key={label} className="min-w-0 rounded-[12px] bg-white/75 px-3 py-2">
                <label className="text-[9px] font-bold uppercase text-gray-500" htmlFor={`edit-${label.toLowerCase()}-compact`}>{label}</label>
                <input id={`edit-${label.toLowerCase()}-compact`} className={`${identityInputClass} text-[12px]`} value={value} onChange={updateIdentity(setter)} />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[["Capo", capoData], ["Key", tomData], ["Tuning", tunerData]].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-[12px] bg-white/75 px-3 py-2">
                <div className="text-[9px] font-bold uppercase text-gray-500">{label}</div>
                <div className="mt-0.5 truncate text-[12px] font-bold text-black">{value || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-[14px] bg-[#f8f8f8] px-3 py-2">
            <div className="text-[11px] font-bold uppercase text-gray-500">
              Done
            </div>
            <div className="text-xl font-bold text-black">
              {Number(geralPercentage || 0)}%
            </div>
          </div>
          <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
            <label htmlFor="edit-artist-touch" className="text-[11px] font-bold uppercase text-gray-500">
              Artist
            </label>
            <input id="edit-artist-touch" className={`${identityInputClass} text-base`} value={artistName} onChange={updateIdentity(setArtistName)} />
          </div>
          <div className="rounded-[14px] bg-[#f8f8f8] px-3 py-2">
            <label htmlFor="edit-song-touch" className="text-[11px] font-bold uppercase text-gray-500">
              Song
            </label>
            <input id="edit-song-touch" className={`${identityInputClass} text-base`} value={songName} onChange={updateIdentity(setSongName)} />
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
    <div className="my-5 h-[calc(100%-2.5rem)] rounded-[30px] neuphormism-b px-6 py-6">
      <div className="flex h-full w-full flex-col">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
            Song data
          </p>
          {/* <h1 className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black">
            Song Data
          </h1> */}
        </div>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <label htmlFor="edit-song" className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Song
            </label>
            <input id="edit-song" className={`${identityInputClass} mt-2 text-xl`} value={songName} onChange={updateIdentity(setSongName)} />
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <label htmlFor="edit-artist" className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Artist
            </label>
            <input id="edit-artist" className={`${identityInputClass} mt-2 text-xl`} value={artistName} onChange={updateIdentity(setArtistName)} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Capo
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {capoData || "-"}
            </div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Tom
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {tomData || "-"}
            </div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Tuning
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {tunerData || "-"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Added
            </p>
            <div className="mt-2 text-sm font-bold text-black">{addedDate}</div>
          </div>
          <div className="rounded-[22px] neuphormism-b-se px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Last play
            </p>
            <div className="mt-2 text-sm font-bold text-black">
              {lastPlayDate}
            </div>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between rounded-[22px] neuphormism-b-se px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Progress of the song
          </span>
          <span className="text-2xl font-bold text-black">
            {Number(geralPercentage || 0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default EditSongSongData;
