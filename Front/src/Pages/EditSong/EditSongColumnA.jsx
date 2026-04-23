/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef } from "react";
import { FaChevronDown, FaChevronUp, FaListUl, FaTimes, FaVideo } from "react-icons/fa";
import EditSongEmbed from "./EditSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import EditSongSongData from "./EditSongSongData";
import { deleteOneSong, updateSongData } from "../../Tools/Controllers"; // Sua função que salva/atualiza no backend
import { useNavigate } from "react-router-dom";
import EditSongSetlist from "./EditSongSetlist";
import { getAllUserSetlists } from "../../Tools/Controllers";
import { parseDateValue } from "../../Tools/dateFormat";

const getLatestLastPlayValue = (songData) => {
  const candidates = [
    songData.lastPlayed,
    songData.lastPlay,
    songData.guitar01?.lastPlay,
    songData.guitar02?.lastPlay,
    songData.bass?.lastPlay,
    songData.keys?.lastPlay,
    songData.drums?.lastPlay,
    songData.voice?.lastPlay,
  ]
    .flat()
    .filter(Boolean);

  return candidates
    .map((value) => ({ value, date: parseDateValue(value) }))
    .filter((item) => item.date)
    .sort((left, right) => right.date.getTime() - left.date.getTime())[0]?.value;
};

function EditSongColumnA({
  dataFromAPI,
  progGuitar01,
  progGuitar02,
  progBass,
  progKey,
  progDrums,
  progVoice,
  registerInstrumentUpdaters,
  isDirty,
  setIsDirty,
  touchLayout = false,
  songDataOpen = false,
  onToggleSongData,
  middleContent = null,
}) {
  // Dados principais da música
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [capoData, setCapoData] = useState("");
  const [tomData, setTomData] = useState("");
  const [tunerData, setTunerData] = useState("");
  const [geralPercentage, setGeralPercentage] = useState(0);
  // const [geralPercentageEdit, setGeralPercentageEdit] = useState("");
  const [embedLink, setEmbedLink] = useState([]);
  const [firstPlay, setFirstPlay] = useState("");
  const [lastPlay, setLastPlay] = useState("");

  // Array de setlists que esta música já possui (será enviado na atualização)
  const [setlist, setSetlist] = useState([]);
  // Array com TODAS as opções de setlists existentes (para exibir como "tags")
  const [setListOptions, setSetListOptions] = useState([]);

  // guitar01
  const [songCifraguitar01, setSongCifraguitar01] = useState(null);
  const [instrActiveStatusguitar01, setInstrActiveStatusguitar01] =
    useState(false);
  const [instCapoguitar01, setInstCapoguitar01] = useState("");
  const [instTuningguitar01, setInstTuningguitar01] = useState("");
  const [instLastPlayedguitar01, setInstLastPlayedguitar01] = useState("");
  const [instLinkguitar01, setInstLinkguitar01] = useState("");
  const [instProgressBarguitar01, setInstProgressBarguitar01] = useState(0);

  // guitar02
  const [songCifraguitar02, setSongCifraguitar02] = useState(null);
  const [instrActiveStatusguitar02, setInstrActiveStatusguitar02] =
    useState(false);
  const [instCapoguitar02, setInstCapoguitar02] = useState("");
  const [instTuningguitar02, setInstTuningguitar02] = useState("");
  const [instLastPlayedguitar02, setInstLastPlayedguitar02] = useState("");
  const [instLinkguitar02, setInstLinkguitar02] = useState("");
  const [instProgressBarguitar02, setInstProgressBarguitar02] = useState(0);

  // bass
  const [songCifrabass, setSongCifrabass] = useState(null);
  const [instrActiveStatusbass, setInstrActiveStatusbass] = useState(false);
  const [instCapobass, setInstCapobass] = useState("");
  const [instTuningbass, setInstTuningbass] = useState("");
  const [instLastPlayedbass, setInstLastPlayedbass] = useState("");
  const [instLinkbass, setInstLinkbass] = useState("");
  const [instProgressBarbass, setInstProgressBarbass] = useState(0);

  // keyboard
  const [songCifrakeyboard, setSongCifrakeyboard] = useState(null);
  const [instrActiveStatuskeyboard, setInstrActiveStatuskeyboard] =
    useState(false);
  const [instCapokeyboard, setInstCapokeyboard] = useState("");
  const [instTuningkeyboard, setInstTuningkeyboard] = useState("");
  const [instLastPlayedkeyboard, setInstLastPlayedkeyboard] = useState("");
  const [instLinkkeyboard, setInstLinkkeyboard] = useState("");
  const [instProgressBarkeyboard, setInstProgressBarkeyboard] = useState(0);

  // drums
  const [songCifradrums, setSongCifradrums] = useState(null);
  const [instrActiveStatusdrums, setInstrActiveStatusdrums] = useState(false);
  const [instCapodrums, setInstCapodrums] = useState("");
  const [instTuningdrums, setInstTuningdrums] = useState("");
  const [instLastPlayeddrums, setInstLastPlayeddrums] = useState("");
  const [instLinkdrums, setInstLinkdrums] = useState("");
  const [instProgressBardrums, setInstProgressBardrums] = useState(0);

  // voice
  const [songCifravoice, setSongCifravoice] = useState(null);
  const [instrActiveStatusvoice, setInstrActiveStatusvoice] = useState(false);
  const [instCapovoice, setInstCapovoice] = useState("");
  const [instTuningvoice, setInstTuningvoice] = useState("");
  const [instLastPlayedvoice, setInstLastPlayedvoice] = useState("");
  const [instLinkvoice, setInstLinkvoice] = useState("");
  const [instProgressBarvoice, setInstProgressBarvoice] = useState(0);

  useEffect(() => {
    if (!registerInstrumentUpdaters) return;

    registerInstrumentUpdaters("guitar01", {
      setLink: setInstLinkguitar01,
      setProgress: setInstProgressBarguitar01,
    });
    registerInstrumentUpdaters("guitar02", {
      setLink: setInstLinkguitar02,
      setProgress: setInstProgressBarguitar02,
    });
    registerInstrumentUpdaters("bass", {
      setLink: setInstLinkbass,
      setProgress: setInstProgressBarbass,
    });
    registerInstrumentUpdaters("keys", {
      setLink: setInstLinkkeyboard,
      setProgress: setInstProgressBarkeyboard,
    });
    registerInstrumentUpdaters("drums", {
      setLink: setInstLinkdrums,
      setProgress: setInstProgressBardrums,
    });
    registerInstrumentUpdaters("voice", {
      setLink: setInstLinkvoice,
      setProgress: setInstProgressBarvoice,
    });
  }, [
    registerInstrumentUpdaters,
    setInstLinkguitar01,
    setInstProgressBarguitar01,
    setInstLinkguitar02,
    setInstProgressBarguitar02,
    setInstLinkbass,
    setInstProgressBarbass,
    setInstLinkkeyboard,
    setInstProgressBarkeyboard,
    setInstLinkdrums,
    setInstProgressBardrums,
    setInstLinkvoice,
    setInstProgressBarvoice,
  ]);

  const navigate = useNavigate();
  const initialSnapshotRef = useRef("");
  const [touchVideosOpen, setTouchVideosOpen] = useState(false);
  const [touchSetlistsOpen, setTouchSetlistsOpen] = useState(false);

  // Calcula a média de progress das instruments
  useEffect(() => {
    setGeralPercentage(
      Math.round(
        (Number(progGuitar01) +
          Number(progGuitar02) +
          Number(progBass) +
          Number(progKey) +
          Number(progDrums) +
          Number(progVoice)) /
          6
      )
    );
  }, [progGuitar01, progGuitar02, progBass, progKey, progDrums, progVoice]);

  useEffect(() => {
    async function fetchSetlists() {
      try {
        const userEmail = localStorage.getItem("userEmail");
        const options = await getAllUserSetlists(userEmail);
        console.log("Fetched setlist options:", options);
        setSetListOptions(options || []);
      } catch (error) {
        console.error("Erro ao buscar setlists do usuário:", error);
      }
    }

    fetchSetlists();
  }, []);

  // Quando dataFromAPI chega, parse e preenche
  useEffect(() => {
    if (dataFromAPI && typeof dataFromAPI === "string") {
      try {
        const parsedData = JSON.parse(dataFromAPI);
        // console.log("Parsed data:", parsedData);

        setArtistName(parsedData.artist || "");
        setSongName(parsedData.song || "");
        setCapoData(parsedData.capo || "N/A");
        setTomData(parsedData.tom || "N/A");
        setTunerData(parsedData.tuning || "N/A");
        setGeralPercentage(parsedData.progressBar || 0);
        setEmbedLink(parsedData.embedVideos || []);
        setFirstPlay(parsedData.addedIn);
        setLastPlay(getLatestLastPlayValue(parsedData) || "");

        // Se o backend já tiver um array de setlists, salve no estado
        if (parsedData.setlist && Array.isArray(parsedData.setlist)) {
          setSetlist(parsedData.setlist);
        }

        if (parsedData.guitar01?.active) {
          setSongCifraguitar01(parsedData.guitar01.songCifra);
          setInstrActiveStatusguitar01(true);
          setInstCapoguitar01(parsedData.guitar01.capo);
          setInstTuningguitar01(parsedData.guitar01.tuning);
          setInstLastPlayedguitar01(parsedData.guitar01.lastPlay);
          setInstLinkguitar01(parsedData.guitar01.link);
          setInstProgressBarguitar01(parsedData.guitar01.progress);
        }

        if (parsedData.guitar02?.active) {
          setSongCifraguitar02(parsedData.guitar02.songCifra);
          setInstrActiveStatusguitar02(true);
          setInstCapoguitar02(parsedData.guitar02.capo);
          setInstTuningguitar02(parsedData.guitar02.tuning);
          setInstLastPlayedguitar02(parsedData.guitar02.lastPlay);
          setInstLinkguitar02(parsedData.guitar02.link);
          setInstProgressBarguitar02(parsedData.guitar02.progress);
        }

        if (parsedData.bass?.active) {
          setSongCifrabass(parsedData.bass.songCifra);
          setInstrActiveStatusbass(true);
          setInstCapobass(parsedData.bass.capo);
          setInstTuningbass(parsedData.bass.tuning);
          setInstLastPlayedbass(parsedData.bass.lastPlay);
          setInstLinkbass(parsedData.bass.link);
          setInstProgressBarbass(parsedData.bass.progress);
        }

        if (parsedData.keys?.active) {
          setSongCifrakeyboard(parsedData.keys.songCifra);
          setInstrActiveStatuskeyboard(true);
          setInstCapokeyboard(parsedData.keys.capo);
          setInstTuningkeyboard(parsedData.keys.tuning);
          setInstLastPlayedkeyboard(parsedData.keys.lastPlay);
          setInstLinkkeyboard(parsedData.keys.link);
          setInstProgressBarkeyboard(parsedData.keys.progress);
        }

        if (parsedData.drums?.active) {
          setSongCifradrums(parsedData.drums.songCifra);
          setInstrActiveStatusdrums(true);
          setInstCapodrums(parsedData.drums.capo);
          setInstTuningdrums(parsedData.drums.tuning);
          setInstLastPlayeddrums(parsedData.drums.lastPlay);
          setInstLinkdrums(parsedData.drums.link);
          setInstProgressBardrums(parsedData.drums.progress);
        }

        if (parsedData.voice?.active) {
          setSongCifravoice(parsedData.voice.songCifra);
          setInstrActiveStatusvoice(true);
          setInstCapovoice(parsedData.voice.capo);
          setInstTuningvoice(parsedData.voice.tuning);
          setInstLastPlayedvoice(parsedData.voice.lastPlay);
          setInstLinkvoice(parsedData.voice.link);
          setInstProgressBarvoice(parsedData.voice.progress);
        }
      } catch (error) {
        console.error("Failed to parse dataFromAPI:", error);
      }
    }
  }, [dataFromAPI]);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        songName,
        artistName,
        capoData,
        tomData,
        tunerData,
        geralPercentage,
        embedLink,
        setlist,
        guitar01: {
          active: instrActiveStatusguitar01,
          link: instLinkguitar01,
          progress: instProgressBarguitar01,
          songCifra: songCifraguitar01,
        },
        guitar02: {
          active: instrActiveStatusguitar02,
          link: instLinkguitar02,
          progress: instProgressBarguitar02,
          songCifra: songCifraguitar02,
        },
        bass: {
          active: instrActiveStatusbass,
          link: instLinkbass,
          progress: instProgressBarbass,
          songCifra: songCifrabass,
        },
        keys: {
          active: instrActiveStatuskeyboard,
          link: instLinkkeyboard,
          progress: instProgressBarkeyboard,
          songCifra: songCifrakeyboard,
        },
        drums: {
          active: instrActiveStatusdrums,
          link: instLinkdrums,
          progress: instProgressBardrums,
          songCifra: songCifradrums,
        },
        voice: {
          active: instrActiveStatusvoice,
          link: instLinkvoice,
          progress: instProgressBarvoice,
          songCifra: songCifravoice,
        },
      }),
    [
      songName,
      artistName,
      capoData,
      tomData,
      tunerData,
      geralPercentage,
      embedLink,
      setlist,
      instrActiveStatusguitar01,
      instLinkguitar01,
      instProgressBarguitar01,
      songCifraguitar01,
      instrActiveStatusguitar02,
      instLinkguitar02,
      instProgressBarguitar02,
      songCifraguitar02,
      instrActiveStatusbass,
      instLinkbass,
      instProgressBarbass,
      songCifrabass,
      instrActiveStatuskeyboard,
      instLinkkeyboard,
      instProgressBarkeyboard,
      songCifrakeyboard,
      instrActiveStatusdrums,
      instLinkdrums,
      instProgressBardrums,
      songCifradrums,
      instrActiveStatusvoice,
      instLinkvoice,
      instProgressBarvoice,
      songCifravoice,
    ]
  );

  useEffect(() => {
    if (!dataFromAPI || typeof dataFromAPI !== "string") return;
    if (!initialSnapshotRef.current) {
      initialSnapshotRef.current = currentSnapshot;
    }
  }, [currentSnapshot, dataFromAPI]);

  const hasPendingChanges = Boolean(initialSnapshotRef.current) &&
    currentSnapshot !== initialSnapshotRef.current;

  // Atualiza no banco
  const handleUpdate = async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");

      const updatedData = {
        song: songName,
        artist: artistName,
        progressBar: geralPercentage || 0,
        setlist: setlist, // Array de setlists atualizado (tags escolhidas)
        instruments: {
          guitar01: instrActiveStatusguitar01
            ? {
                active: true,
                capo: instCapoguitar01,
                lastPlay: instLastPlayedguitar01,
                link: instLinkguitar01,
                progress: instProgressBarguitar01,
                songCifra: songCifraguitar01,
                tuning: instTuningguitar01,
              }
            : false,
          guitar02: instrActiveStatusguitar02
            ? {
                active: true,
                capo: instCapoguitar02,
                lastPlay: instLastPlayedguitar02,
                link: instLinkguitar02,
                progress: instProgressBarguitar02,
                songCifra: songCifraguitar02,
                tuning: instTuningguitar02,
              }
            : false,
          bass: instrActiveStatusbass
            ? {
                active: true,
                capo: instCapobass,
                lastPlay: instLastPlayedbass,
                link: instLinkbass,
                progress: instProgressBarbass,
                songCifra: songCifrabass,
                tuning: instTuningbass,
              }
            : false,
          keys: instrActiveStatuskeyboard
            ? {
                active: true,
                capo: instCapokeyboard,
                lastPlay: instLastPlayedkeyboard,
                link: instLinkkeyboard,
                progress: instProgressBarkeyboard,
                songCifra: songCifrakeyboard,
                tuning: instTuningkeyboard,
              }
            : false,
          drums: instrActiveStatusdrums
            ? {
                active: true,
                capo: instCapodrums,
                lastPlay: instLastPlayeddrums,
                link: instLinkdrums,
                progress: instProgressBardrums,
                songCifra: songCifradrums,
                tuning: instTuningdrums,
              }
            : false,
          voice: instrActiveStatusvoice
            ? {
                active: true,
                capo: instCapovoice,
                lastPlay: instLastPlayedvoice,
                link: instLinkvoice,
                progress: instProgressBarvoice,
                songCifra: songCifravoice,
                tuning: instTuningvoice,
              }
            : false,
        },
        embedVideos: embedLink || [],
        updateIn: new Date().toISOString().split("T")[0],
        email: userEmail,
      };

      await updateSongData(updatedData);
      console.log("Song data updated successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error updating song data:", error);
    }
  };

  // Deletar a música
  const handleDelete = async () => {
    try {
      await deleteOneSong(artistName, songName);
      console.log("Song data deleted successfully:", artistName, songName);
      navigate("/");
    } catch (error) {
      console.error("Error deleting song data:", error);
    }
  };

  return touchLayout ? (
    <>
      <div className="rounded-[20px] bg-[#e0e0e0] p-3 shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={onToggleSongData}
        >
          <h2 className="text-[1.55rem] font-black tracking-tight text-black">Song Data</h2>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f8f8] text-black">
            {songDataOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
          </span>
        </button>

        {songDataOpen ? (
          <div className="mt-3">
            <EditSongSongData
              songName={songName}
              artistName={artistName}
              capoData={capoData}
              tomData={tomData}
              tunerData={tunerData}
              fistTime={firstPlay}
              lastTime={lastPlay}
              setSongName={setSongName}
              setArtistName={setArtistName}
              setCapoData={setCapoData}
              setTomData={setTomData}
              setTunerData={setTunerData}
              touchLayout
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 [&_.neuphormism-b-se]:!m-0 [&_.neuphormism-b-se]:!rounded-[20px] [&_.neuphormism-b-se]:!border-0 [&_.neuphormism-b-se]:!bg-[#e0e0e0] [&_.neuphormism-b-se]:!px-3 [&_.neuphormism-b-se]:!py-3 [&_.neuphormism-b-se]:!shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
        <GeralProgressBar geralPercentage={geralPercentage} />
      </div>

      {middleContent}

      <div className="mt-4 rounded-[20px] bg-[#e0e0e0] p-3 shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
        <h2 className="text-[1.55rem] font-black tracking-tight text-black">Media & Setlist</h2>

        <div className="mt-3 space-y-3">
          <div className="rounded-[18px] bg-[#f8f8f8] p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setTouchVideosOpen((current) => !current)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ececec] text-black">
                  <FaVideo className="text-sm" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-black">Videos</div>
                  <div className="text-xs font-bold text-[#2f6f3e]">
                    {embedLink.length} videos added
                  </div>
                </div>
              </div>
              {touchVideosOpen ? <FaChevronUp className="text-sm text-gray-500" /> : <FaChevronDown className="text-sm text-gray-500" />}
            </button>
          </div>

          <div className="rounded-[18px] bg-[#f8f8f8] p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setTouchSetlistsOpen((current) => !current)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ececec] text-black">
                  <FaListUl className="text-sm" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-black">Setlist</div>
                  <div className="text-xs font-bold text-[#2f6f3e]">
                    {setlist.length} setlists selected
                  </div>
                </div>
              </div>
              {touchSetlistsOpen ? <FaChevronUp className="text-sm text-gray-500" /> : <FaChevronDown className="text-sm text-gray-500" />}
            </button>
          </div>
        </div>
      </div>

      {touchVideosOpen ? (
        <div className="fixed inset-0 z-[110] bg-black/25">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setTouchVideosOpen(false)}
            aria-label="Close videos modal"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[2rem] font-black tracking-tight text-black">Videos</div>
                <div className="mt-1 max-w-[18rem] text-sm font-medium text-gray-500">
                  Add a video URL for this song.
                </div>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                onClick={() => setTouchVideosOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none [&_.neuphormism-b-btn]:!rounded-[14px] [&_.neuphormism-b-btn]:!bg-white [&_.neuphormism-b-btn]:!shadow-none">
              <EditSongEmbed
                ytEmbedSongList={embedLink}
                setEmbedLink={(updater) => {
                  setEmbedLink((prevLinks) => {
                    const nextLinks =
                      typeof updater === "function" ? updater(prevLinks) : updater;
                    setIsDirty?.(true);
                    return nextLinks;
                  });
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {touchSetlistsOpen ? (
        <div className="fixed inset-0 z-[110] bg-black/25">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setTouchSetlistsOpen(false)}
            aria-label="Close setlist modal"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[2rem] font-black tracking-tight text-black">Setlist</div>
                <div className="mt-1 max-w-[18rem] text-sm font-medium text-gray-500">
                  Select existing tags or create a new one for this song.
                </div>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                onClick={() => setTouchSetlistsOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none">
              <EditSongSetlist
                setlist={setlist}
                setSetlist={setSetlist}
                setlistOptions={setListOptions}
                setSetListOptions={setSetListOptions}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="rounded-[16px] border border-[#f0b6ae] bg-[#fff4f2] px-4 py-3 text-lg font-black text-[#d13b2f]"
          onClick={handleDelete}
        >
          Discard
        </button>
        <button
          className="rounded-[16px] bg-[goldenrod] px-4 py-3 text-lg font-black text-black disabled:opacity-50"
          onClick={handleUpdate}
          disabled={isDirty === undefined ? !hasPendingChanges : !isDirty}
        >
          Save Song
        </button>
      </div>
    </>
  ) : (
    <>
      <EditSongSongData
        songName={songName}
        artistName={artistName}
        capoData={capoData}
        tomData={tomData}
        tunerData={tunerData}
        fistTime={firstPlay}
        lastTime={lastPlay}
        setSongName={setSongName}
        setArtistName={setArtistName}
        setCapoData={setCapoData}
        setTomData={setTomData}
        setTunerData={setTunerData}
      />

      <GeralProgressBar geralPercentage={geralPercentage} />

      <EditSongEmbed
        ytEmbedSongList={embedLink}
        setEmbedLink={(updater) => {
          setEmbedLink((prevLinks) => {
            const nextLinks =
              typeof updater === "function" ? updater(prevLinks) : updater;
            setIsDirty?.(true);
            return nextLinks;
          });
        }}
      />

      {/* Exibe as tags de setlist: 
          setListOptions: array global de opções,
          setlist: array com as tags selecionadas para esta música */}
      <EditSongSetlist
        setlist={setlist}
        setSetlist={setSetlist}
        setlistOptions={setListOptions}
        setSetListOptions={setSetListOptions}
      />

      <div className="flex flex-row neuphormism-b p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpdate}
          disabled={isDirty === undefined ? !hasPendingChanges : !isDirty}
        >
          Update
        </button>

        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded neuphormism-b-btn-red-discard ml-5"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </>
  );
}

export default EditSongColumnA;
