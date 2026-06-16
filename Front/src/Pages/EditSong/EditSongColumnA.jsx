/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { FaChevronDown, FaChevronUp, FaListUl, FaTimes, FaVideo } from "react-icons/fa";
import EditSongEmbed from "./EditSongEmbed";
import EditSongSongData from "./EditSongSongData";
import GuitarProFileBox from "../shared/GuitarProFileBox";
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

const hasStoredValue = (value) => {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

const hasPresentationLayoutContent = (layouts) => {
  if (!layouts || typeof layouts !== "object") return false;
  return Object.values(layouts).some((layout) =>
    hasStoredValue(layout?.songCifra),
  );
};

const instrumentBlockHasContent = (block) => {
  if (!block || typeof block !== "object") return false;
  return [
    block.link,
    block.songCifra,
    block.songTabs,
    block.songChords,
    block.songLyrics,
    block.notes,
  ].some(hasStoredValue) || hasPresentationLayoutContent(block.presentationLayouts);
};

const isInstrumentActive = (block) =>
  Boolean(
    block?.active === true ||
      block?.active === "true" ||
      instrumentBlockHasContent(block),
  );

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
  setShowSnackBar,
  setSnackbarMessage,
  touchLayout = false,
  touchInlineMedia = false,
  songDataOpen = false,
  onToggleSongData,
  middleContent = null,
  songData = null,
  onSongDataChange,
  onPageActionsChange,
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
  const [instNotesguitar01, setInstNotesguitar01] = useState("");

  // guitar02
  const [songCifraguitar02, setSongCifraguitar02] = useState(null);
  const [instrActiveStatusguitar02, setInstrActiveStatusguitar02] =
    useState(false);
  const [instCapoguitar02, setInstCapoguitar02] = useState("");
  const [instTuningguitar02, setInstTuningguitar02] = useState("");
  const [instLastPlayedguitar02, setInstLastPlayedguitar02] = useState("");
  const [instLinkguitar02, setInstLinkguitar02] = useState("");
  const [instProgressBarguitar02, setInstProgressBarguitar02] = useState(0);
  const [instNotesguitar02, setInstNotesguitar02] = useState("");

  // bass
  const [songCifrabass, setSongCifrabass] = useState(null);
  const [instrActiveStatusbass, setInstrActiveStatusbass] = useState(false);
  const [instCapobass, setInstCapobass] = useState("");
  const [instTuningbass, setInstTuningbass] = useState("");
  const [instLastPlayedbass, setInstLastPlayedbass] = useState("");
  const [instLinkbass, setInstLinkbass] = useState("");
  const [instProgressBarbass, setInstProgressBarbass] = useState(0);
  const [instNotesbass, setInstNotesbass] = useState("");

  // keyboard
  const [songCifrakeyboard, setSongCifrakeyboard] = useState(null);
  const [instrActiveStatuskeyboard, setInstrActiveStatuskeyboard] =
    useState(false);
  const [instCapokeyboard, setInstCapokeyboard] = useState("");
  const [instTuningkeyboard, setInstTuningkeyboard] = useState("");
  const [instLastPlayedkeyboard, setInstLastPlayedkeyboard] = useState("");
  const [instLinkkeyboard, setInstLinkkeyboard] = useState("");
  const [instProgressBarkeyboard, setInstProgressBarkeyboard] = useState(0);
  const [instNoteskeyboard, setInstNoteskeyboard] = useState("");

  // drums
  const [songCifradrums, setSongCifradrums] = useState(null);
  const [instrActiveStatusdrums, setInstrActiveStatusdrums] = useState(false);
  const [instCapodrums, setInstCapodrums] = useState("");
  const [instTuningdrums, setInstTuningdrums] = useState("");
  const [instLastPlayeddrums, setInstLastPlayeddrums] = useState("");
  const [instLinkdrums, setInstLinkdrums] = useState("");
  const [instProgressBardrums, setInstProgressBardrums] = useState(0);
  const [instNotesdrums, setInstNotesdrums] = useState("");

  // voice
  const [songCifravoice, setSongCifravoice] = useState(null);
  const [instrActiveStatusvoice, setInstrActiveStatusvoice] = useState(false);
  const [instCapovoice, setInstCapovoice] = useState("");
  const [instTuningvoice, setInstTuningvoice] = useState("");
  const [instLastPlayedvoice, setInstLastPlayedvoice] = useState("");
  const [instLinkvoice, setInstLinkvoice] = useState("");
  const [instProgressBarvoice, setInstProgressBarvoice] = useState(0);
  const [instNotesvoice, setInstNotesvoice] = useState("");

  useEffect(() => {
    if (!registerInstrumentUpdaters) return;

    registerInstrumentUpdaters("guitar01", {
      setLink: setInstLinkguitar01,
      setProgress: setInstProgressBarguitar01,
      setNotes: setInstNotesguitar01,
    });
    registerInstrumentUpdaters("guitar02", {
      setLink: setInstLinkguitar02,
      setProgress: setInstProgressBarguitar02,
      setNotes: setInstNotesguitar02,
    });
    registerInstrumentUpdaters("bass", {
      setLink: setInstLinkbass,
      setProgress: setInstProgressBarbass,
      setNotes: setInstNotesbass,
    });
    registerInstrumentUpdaters("keys", {
      setLink: setInstLinkkeyboard,
      setProgress: setInstProgressBarkeyboard,
      setNotes: setInstNoteskeyboard,
    });
    registerInstrumentUpdaters("drums", {
      setLink: setInstLinkdrums,
      setProgress: setInstProgressBardrums,
      setNotes: setInstNotesdrums,
    });
    registerInstrumentUpdaters("voice", {
      setLink: setInstLinkvoice,
      setProgress: setInstProgressBarvoice,
      setNotes: setInstNotesvoice,
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
  const [touchMediaOpen, setTouchMediaOpen] = useState(false);
  const [touchVideosOpen, setTouchVideosOpen] = useState(false);
  const [touchSetlistsOpen, setTouchSetlistsOpen] = useState(false);
  const markDirty = useCallback(() => {
    setIsDirty?.(true);
  }, [setIsDirty]);
  const setSetlistAndMarkDirty = useCallback(
    (updater) => {
      setSetlist((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        markDirty();
        return next;
      });
    },
    [markDirty],
  );
  const setSetListOptionsAndMarkDirty = useCallback(
    (updater) => {
      setSetListOptions((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        markDirty();
        return next;
      });
    },
    [markDirty],
  );

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
        const getInstrumentBlock = (instrument) => {
          const directBlock = parsedData[instrument];
          const nestedBlock = parsedData.instruments?.[instrument];
          return directBlock && typeof directBlock === "object"
            ? directBlock
            : nestedBlock && typeof nestedBlock === "object"
              ? nestedBlock
              : directBlock;
        };
        const hydrateInstrument = (instrument, setters) => {
          const block = getInstrumentBlock(instrument);
          if (!isInstrumentActive(block)) return;

          setters.setSongCifra(block.songCifra || "");
          setters.setActive(true);
          setters.setCapo(block.capo || "");
          setters.setTuning(block.tuning || "");
          setters.setLastPlayed(block.lastPlay || "");
          setters.setLink(block.link || "");
          setters.setProgress(block.progress || 0);
          setters.setNotes(block.notes || "");
        };

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

        hydrateInstrument("guitar01", {
          setSongCifra: setSongCifraguitar01,
          setActive: setInstrActiveStatusguitar01,
          setCapo: setInstCapoguitar01,
          setTuning: setInstTuningguitar01,
          setLastPlayed: setInstLastPlayedguitar01,
          setLink: setInstLinkguitar01,
          setProgress: setInstProgressBarguitar01,
          setNotes: setInstNotesguitar01,
        });
        hydrateInstrument("guitar02", {
          setSongCifra: setSongCifraguitar02,
          setActive: setInstrActiveStatusguitar02,
          setCapo: setInstCapoguitar02,
          setTuning: setInstTuningguitar02,
          setLastPlayed: setInstLastPlayedguitar02,
          setLink: setInstLinkguitar02,
          setProgress: setInstProgressBarguitar02,
          setNotes: setInstNotesguitar02,
        });
        hydrateInstrument("bass", {
          setSongCifra: setSongCifrabass,
          setActive: setInstrActiveStatusbass,
          setCapo: setInstCapobass,
          setTuning: setInstTuningbass,
          setLastPlayed: setInstLastPlayedbass,
          setLink: setInstLinkbass,
          setProgress: setInstProgressBarbass,
          setNotes: setInstNotesbass,
        });
        hydrateInstrument("keys", {
          setSongCifra: setSongCifrakeyboard,
          setActive: setInstrActiveStatuskeyboard,
          setCapo: setInstCapokeyboard,
          setTuning: setInstTuningkeyboard,
          setLastPlayed: setInstLastPlayedkeyboard,
          setLink: setInstLinkkeyboard,
          setProgress: setInstProgressBarkeyboard,
          setNotes: setInstNoteskeyboard,
        });
        hydrateInstrument("drums", {
          setSongCifra: setSongCifradrums,
          setActive: setInstrActiveStatusdrums,
          setCapo: setInstCapodrums,
          setTuning: setInstTuningdrums,
          setLastPlayed: setInstLastPlayeddrums,
          setLink: setInstLinkdrums,
          setProgress: setInstProgressBardrums,
          setNotes: setInstNotesdrums,
        });
        hydrateInstrument("voice", {
          setSongCifra: setSongCifravoice,
          setActive: setInstrActiveStatusvoice,
          setCapo: setInstCapovoice,
          setTuning: setInstTuningvoice,
          setLastPlayed: setInstLastPlayedvoice,
          setLink: setInstLinkvoice,
          setProgress: setInstProgressBarvoice,
          setNotes: setInstNotesvoice,
        });
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
          notes: instNotesguitar01,
        },
        guitar02: {
          active: instrActiveStatusguitar02,
          link: instLinkguitar02,
          progress: instProgressBarguitar02,
          songCifra: songCifraguitar02,
          notes: instNotesguitar02,
        },
        bass: {
          active: instrActiveStatusbass,
          link: instLinkbass,
          progress: instProgressBarbass,
          songCifra: songCifrabass,
          notes: instNotesbass,
        },
        keys: {
          active: instrActiveStatuskeyboard,
          link: instLinkkeyboard,
          progress: instProgressBarkeyboard,
          songCifra: songCifrakeyboard,
          notes: instNoteskeyboard,
        },
        drums: {
          active: instrActiveStatusdrums,
          link: instLinkdrums,
          progress: instProgressBardrums,
          songCifra: songCifradrums,
          notes: instNotesdrums,
        },
        voice: {
          active: instrActiveStatusvoice,
          link: instLinkvoice,
          progress: instProgressBarvoice,
          songCifra: songCifravoice,
          notes: instNotesvoice,
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
      instNotesguitar01,
      instrActiveStatusguitar02,
      instLinkguitar02,
      instProgressBarguitar02,
      songCifraguitar02,
      instNotesguitar02,
      instrActiveStatusbass,
      instLinkbass,
      instProgressBarbass,
      songCifrabass,
      instNotesbass,
      instrActiveStatuskeyboard,
      instLinkkeyboard,
      instProgressBarkeyboard,
      songCifrakeyboard,
      instNoteskeyboard,
      instrActiveStatusdrums,
      instLinkdrums,
      instProgressBardrums,
      songCifradrums,
      instNotesdrums,
      instrActiveStatusvoice,
      instLinkvoice,
      instProgressBarvoice,
      songCifravoice,
      instNotesvoice,
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
                notes: instNotesguitar01,
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
                notes: instNotesguitar02,
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
                notes: instNotesbass,
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
                notes: instNoteskeyboard,
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
                notes: instNotesdrums,
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
                notes: instNotesvoice,
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
    if (!window.confirm(`Delete "${songName}" by ${artistName}?`)) return;
    try {
      await deleteOneSong(artistName, songName);
      console.log("Song data deleted successfully:", artistName, songName);
      navigate("/");
    } catch (error) {
      console.error("Error deleting song data:", error);
    }
  };

  useEffect(() => {
    onPageActionsChange?.({
      canUpdate: isDirty === undefined ? hasPendingChanges : isDirty,
      onDelete: handleDelete,
      onUpdate: handleUpdate,
    });
  }, [hasPendingChanges, isDirty, songName, artistName, geralPercentage, setlist]);

  return touchLayout ? (
    <>
      <div className="rounded-[20px] neuphormism-b p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={onToggleSongData}
        >
          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              Song Workspace
            </p>
            <h2 className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black">Song Data</h2>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full neuphormism-b-avatar text-black">
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
              geralPercentage={geralPercentage}
            />
          </div>
        ) : null}
      </div>

      {middleContent}

      <GuitarProFileBox
        artistName={artistName}
        songName={songName}
        songData={songData}
        onSongDataChange={onSongDataChange}
        setShowSnackBar={setShowSnackBar}
        setSnackbarMessage={setSnackbarMessage}
        setIsDirty={setIsDirty}
      />

      {touchInlineMedia ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-[20px] neuphormism-b p-3">
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                Videos
              </p>
            </div>
            <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none [&_.neuphormism-b-btn]:!rounded-[14px] [&_.neuphormism-b-btn]:!bg-white">
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

          <div className="rounded-[20px] neuphormism-b p-3">
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                Setlist
              </p>
            </div>
            <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none">
              <EditSongSetlist
                setlist={setlist}
                setSetlist={setSetlistAndMarkDirty}
                setlistOptions={setListOptions}
                setSetListOptions={setSetListOptionsAndMarkDirty}
              />
            </div>
          </div>
        </div>
      ) : (
      <>
        <div className="mt-4 rounded-[20px] neuphormism-b p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() =>
            setTouchMediaOpen((current) => {
              const next = !current;
              if (!next) {
                setTouchVideosOpen(false);
                setTouchSetlistsOpen(false);
              }
              return next;
            })
          }
        >
          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              Song Workspace
            </p>
            <h2 className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black">Media & Setlist</h2>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full neuphormism-b-avatar text-black">
            {touchMediaOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
          </span>
        </button>

        {touchMediaOpen ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-[18px] neuphormism-b-se p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setTouchVideosOpen((current) => !current)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full neuphormism-b-avatar text-black">
                  <FaVideo className="text-sm" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-black">Videos</div>
                  <div className="text-xs font-bold text-[#2f6f3e]">
                    {embedLink.length} videos added
                  </div>
                </div>
              </div>
              {touchVideosOpen ? <FaChevronUp className="text-sm text-gray-500" /> : <FaChevronDown className="text-sm text-gray-500" />}
            </button>
          </div>

            <div className="rounded-[18px] neuphormism-b-se p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setTouchSetlistsOpen((current) => !current)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full neuphormism-b-avatar text-black">
                  <FaListUl className="text-sm" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-black">Setlist</div>
                  <div className="text-xs font-bold text-[#2f6f3e]">
                    {setlist.length} setlists selected
                  </div>
                </div>
              </div>
              {touchSetlistsOpen ? <FaChevronUp className="text-sm text-gray-500" /> : <FaChevronDown className="text-sm text-gray-500" />}
            </button>
            </div>
          </div>
        ) : null}
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
                <div className="text-[2rem] font-bold tracking-tight text-black">Videos</div>
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
                <div className="text-[2rem] font-bold tracking-tight text-black">Setlist</div>
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
                setSetlist={setSetlistAndMarkDirty}
                setlistOptions={setListOptions}
                setSetListOptions={setSetListOptionsAndMarkDirty}
              />
            </div>
          </div>
        </div>
      ) : null}
      </>
      )}

    </>
  ) : (
    <>
      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
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
            geralPercentage={geralPercentage}
          />
        </div>
        <div className="min-w-0">
          <GuitarProFileBox
            artistName={artistName}
            songName={songName}
            songData={songData}
            onSongDataChange={onSongDataChange}
            setShowSnackBar={setShowSnackBar}
            setSnackbarMessage={setSnackbarMessage}
            setIsDirty={setIsDirty}
          />
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
          <EditSongSetlist
            setlist={setlist}
            setSetlist={setSetlistAndMarkDirty}
            setlistOptions={setListOptions}
            setSetListOptions={setSetListOptionsAndMarkDirty}
          />
        </div>
      </div>

    </>
  );
}

export default EditSongColumnA;
