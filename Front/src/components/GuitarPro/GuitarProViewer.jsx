/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as alphaTab from "@coderline/alphatab";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDrum,
  FaGuitar,
  FaKeyboard,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaMicrophone,
  FaMusic,
  FaPause,
  FaPlay,
  FaStop,
  FaThumbtack,
  FaVolumeHigh,
} from "react-icons/fa6";
import { API_BASE, downloadGuitarProFile } from "../../Tools/Controllers";

const INSTRUMENT_TRACK_HINTS = {
  guitar01: ["guitar", "gt", "violao", "violão"],
  guitar02: ["guitar", "gt", "violao", "violão"],
  bass: ["bass", "baixo"],
  keys: ["keys", "keyboard", "piano", "synth", "organ", "teclado"],
  drums: ["drum", "kit", "perc", "percussion", "bateria"],
  voice: ["voice", "vocal", "vox", "sing"],
};

const DEFAULT_TRACK_VOLUME = 0.8;
const DEFAULT_MASTER_VOLUME = 0.8;
const DEFAULT_TRACK_PAN = 0.5;

const buttonBaseClass =
  "neuphormism-b-btn flex items-center justify-center rounded-full text-black active:scale-[0.98]";
const LOG_PREFIX = "[GuitarProViewer]";

function logDebug(message, payload) {
  if (payload !== undefined) {
    console.log(`${LOG_PREFIX} ${message}`, payload);
    return;
  }
  console.log(`${LOG_PREFIX} ${message}`);
}

function logWarn(message, payload) {
  if (payload !== undefined) {
    console.warn(`${LOG_PREFIX} ${message}`, payload);
    return;
  }
  console.warn(`${LOG_PREFIX} ${message}`);
}

function registerAlphaTabListener(api, eventName, handler) {
  const event = api?.[eventName];
  if (!event || typeof event.on !== "function") {
    logWarn(`Evento AlphaTab indisponivel: ${eventName}`);
    return;
  }
  event.on(handler);
}

function formatDuration(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveFileUrl(fileUrl = "") {
  if (!fileUrl) return "";
  return /^https?:\/\//i.test(fileUrl)
    ? fileUrl
    : new URL(fileUrl, API_BASE).toString();
}

async function downloadFileUrlAsBlob(fileUrl) {
  if (!fileUrl) {
    throw new Error("Missing Guitar Pro file URL.");
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.response = { status: response.status };
    throw error;
  }

  return response.blob();
}

function normalizeTrackLabel(track, index) {
  const baseName = String(track?.name || "").trim();
  return baseName || `Track ${index + 1}`;
}

function getTrackIcon(track) {
  const haystack = [track?.name, track?.shortName, track?.playbackInfo?.program]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const program = Number(track?.playbackInfo?.program);

  if (track?.isPercussion || haystack.includes("drum") || haystack.includes("perc")) {
    return FaDrum;
  }
  if (haystack.includes("bass") || (program >= 32 && program <= 39)) {
    return FaMusic;
  }
  if (
    haystack.includes("piano") ||
    haystack.includes("key") ||
    haystack.includes("synth") ||
    (program >= 0 && program <= 7) ||
    (program >= 16 && program <= 23)
  ) {
    return FaKeyboard;
  }
  if (haystack.includes("voice") || haystack.includes("vocal") || haystack.includes("vox")) {
    return FaMicrophone;
  }
  return FaGuitar;
}

function findBestTrackIndex(tracks = [], instrumentName = "") {
  const hints = INSTRUMENT_TRACK_HINTS[instrumentName] || [];
  if (!hints.length) return 0;

  const matchIndex = tracks.findIndex((track) => {
    const haystack = [
      track?.name,
      track?.shortName,
      track?.playbackInfo?.program,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hints.some((hint) => haystack.includes(hint));
  });

  if (matchIndex >= 0) return matchIndex;

  const programMatchIndex = tracks.findIndex((track) => {
    const program = Number(track?.playbackInfo?.program);
    const isPercussion = Boolean(track?.isPercussion);

    if (instrumentName === "drums") return isPercussion;
    if (instrumentName === "bass") return program >= 32 && program <= 39;
    if (instrumentName === "keys")
      return (
        (program >= 0 && program <= 7) ||
        (program >= 16 && program <= 23) ||
        (program >= 88 && program <= 95)
      );
    if (instrumentName === "guitar01" || instrumentName === "guitar02") {
      return program >= 24 && program <= 31;
    }

    return false;
  });

  return programMatchIndex >= 0 ? programMatchIndex : 0;
}

function formatTuning(track) {
  const firstStaff = Array.isArray(track?.staves) ? track.staves[0] : null;
  const tuning = Array.isArray(firstStaff?.stringTuning?.tunings)
    ? firstStaff.stringTuning.tunings
    : [];

  if (!tuning.length) return "";
  return tuning
    .map((value) => alphaTab.model.Tuning.getTextForTuning(value, true))
    .reverse()
    .join(" ");
}

function GuitarProViewer({
  file,
  fileUrl,
  instrumentName = "guitar01",
  fileName = "",
  songTitle = "",
  artistName = "",
}) {
  const containerRef = useRef(null);
  const scoreViewportRef = useRef(null);
  const apiRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1.15);
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState("");
  const [trackVolumes, setTrackVolumes] = useState({});
  const [trackPans, setTrackPans] = useState({});
  const [masterVolume, setMasterVolume] = useState(DEFAULT_MASTER_VOLUME);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerLoadProgress, setPlayerLoadProgress] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState({
    currentTime: 0,
    endTime: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const resolvedFileUrl = useMemo(
    () => resolveFileUrl(file?.url || fileUrl),
    [file?.url, fileUrl],
  );

  const renderSelectedTrack = useCallback(
    (trackIndex) => {
      const api = apiRef.current;
      const nextTrack = tracks[trackIndex];
      if (!api || !nextTrack) return;

      api.renderTracks([nextTrack]);
      setSelectedTrackIndex(trackIndex);
    },
    [tracks],
  );

  useEffect(() => {
    if (!containerRef.current || (!resolvedFileUrl && !file?.id)) return undefined;

    let cancelled = false;
    let objectUrl = "";

    async function initializeViewer() {
      logDebug("Inicializando viewer", {
        fileId: file?.id,
        fileUrl: resolvedFileUrl,
        songTitle,
        artistName,
        instrumentName,
      });
      setLoading(true);
      setRenderError("");
      setTracks([]);
      setIsPlaying(false);
      setPlayerReady(false);
      setPlayerLoadProgress(0);
      setPlaybackPosition({ currentTime: 0, endTime: 0 });

      let alphaTabFileUrl = resolvedFileUrl;

      if (file?.id || resolvedFileUrl) {
        try {
          let blob;

          if (file?.id) {
            try {
              const email =
                typeof window !== "undefined"
                  ? localStorage.getItem("userEmail")
                  : "";
              blob = await downloadGuitarProFile({
                email,
                artist: artistName,
                song: songTitle,
                fileId: file.id,
              });
              logDebug("Arquivo baixado via endpoint autenticado", {
                fileId: file.id,
                size: blob?.size,
                type: blob?.type,
              });
            } catch (endpointError) {
              logWarn(
                "Guitar Pro authenticated download failed, trying stored URL:",
                endpointError,
              );
              blob = await downloadFileUrlAsBlob(resolvedFileUrl);
              logDebug("Arquivo baixado via URL armazenada", {
                size: blob?.size,
                type: blob?.type,
              });
            }
          } else {
            blob = await downloadFileUrlAsBlob(resolvedFileUrl);
            logDebug("Arquivo baixado via URL direta", {
              size: blob?.size,
              type: blob?.type,
            });
          }

          if (cancelled) return;

          objectUrl = URL.createObjectURL(blob);
          alphaTabFileUrl = objectUrl;
        } catch (error) {
          if (cancelled) return;
          console.error("Guitar Pro file download failed:", error);
          setRenderError(
            error?.response?.status === 404
              ? "Arquivo Guitar Pro nao encontrado no servidor. Envie o arquivo novamente na tela de edicao."
              : "Nao foi possivel baixar este arquivo Guitar Pro.",
          );
          setLoading(false);
          return;
        }
      }

      const api = new alphaTab.AlphaTabApi(containerRef.current, {
        core: {
          file: alphaTabFileUrl,
          fontDirectory: "/font/",
          useWorkers: false,
        },
        display: {
          layoutMode: alphaTab.LayoutMode.Page,
          barsPerRow: 8,
          scale: zoom,
        },
        player: {
          enablePlayer: true,
          enableCursor: true,
          enableUserInteraction: true,
          soundFont: "/soundfont/sonivox.sf2",
          scrollElement: scoreViewportRef.current,
        },
      });

      apiRef.current = api;
      logDebug("AlphaTab API criada", {
        hasPlayerReady: Boolean(api.playerReady?.on),
        hasSoundFontLoad: Boolean(api.soundFontLoad?.on),
        hasSoundFontLoaded: Boolean(api.soundFontLoaded?.on),
        hasSoundFontLoadFailed: Boolean(api.soundFontLoadFailed?.on),
        hasPlayerPositionChanged: Boolean(api.playerPositionChanged?.on),
        isReadyForPlayback: api.isReadyForPlayback,
      });

      registerAlphaTabListener(api, "scoreLoaded", (loadedScore) => {
        if (cancelled) return;

        const loadedTracks = Array.isArray(loadedScore?.tracks)
          ? loadedScore.tracks
          : [];
        const initialIndex = findBestTrackIndex(loadedTracks, instrumentName);
        logDebug("Score carregado", {
          tracks: loadedTracks.map((track, index) => ({
            index,
            name: track?.name,
            shortName: track?.shortName,
            program: track?.playbackInfo?.program,
            isPercussion: track?.isPercussion,
          })),
          initialIndex,
        });

        setTracks(loadedTracks);
        setTrackVolumes(
          loadedTracks.reduce(
            (acc, _track, index) => ({
              ...acc,
              [index]: DEFAULT_TRACK_VOLUME,
            }),
            {},
          ),
        );
        setTrackPans(
          loadedTracks.reduce(
            (acc, track, index) => ({
              ...acc,
              [index]: Number.isFinite(track?.playbackInfo?.balance)
                ? track.playbackInfo.balance / 16
                : DEFAULT_TRACK_PAN,
            }),
            {},
          ),
        );

        requestAnimationFrame(() => {
          if (!cancelled && loadedTracks[initialIndex]) {
            api.renderTracks([loadedTracks[initialIndex]]);
            setSelectedTrackIndex(initialIndex);
            setLoading(false);
          } else if (!cancelled) {
            setLoading(false);
          }
        });
      });

      registerAlphaTabListener(api, "playerReady", () => {
        if (cancelled) return;
        api.masterVolume = DEFAULT_MASTER_VOLUME;
        setPlayerLoadProgress(100);
        setPlayerReady(true);
        logDebug("Player pronto", {
          isReadyForPlayback: api.isReadyForPlayback,
          masterVolume: api.masterVolume,
          playerState: api.playerState,
        });
      });

      registerAlphaTabListener(api, "soundFontLoad", (event) => {
        if (cancelled || !event?.total) return;
        const percentage = Math.floor((event.loaded / event.total) * 100);
        setPlayerLoadProgress(percentage);
        if (percentage === 100 || percentage % 25 === 0) {
          logDebug("SoundFont carregando", {
            loaded: event.loaded,
            total: event.total,
            percentage,
          });
        }
      });

      registerAlphaTabListener(api, "soundFontLoaded", () => {
        if (cancelled) return;
        logDebug("SoundFont carregado");
      });

      registerAlphaTabListener(api, "soundFontLoadFailed", (error) => {
        if (cancelled) return;
        console.error(`${LOG_PREFIX} AlphaTab soundfont load failed:`, error);
        setRenderError("Nao foi possivel carregar o SoundFont do player.");
        setLoading(false);
      });

      registerAlphaTabListener(api, "playerStateChanged", (event) => {
        if (cancelled) return;
        setIsPlaying(event?.state === alphaTab.synth.PlayerState.Playing);
        logDebug("Player state changed", {
          state: event?.state,
          stopped: event?.stopped,
        });
      });

      registerAlphaTabListener(api, "playerPositionChanged", (event) => {
        if (cancelled) return;
        setPlaybackPosition({
          currentTime: event?.currentTime || 0,
          endTime: event?.endTime || 0,
        });
      });

      registerAlphaTabListener(api, "error", (error) => {
        if (cancelled) return;
        console.error(`${LOG_PREFIX} AlphaTab error:`, error);
        setRenderError("Nao foi possivel renderizar este arquivo Guitar Pro.");
        setLoading(false);
      });

      registerAlphaTabListener(api, "renderFinished", () => {
        if (cancelled) return;
        logDebug("Render finalizado", {
          isReadyForPlayback: api.isReadyForPlayback,
          playerReady,
        });
        setLoading(false);
      });

      window.setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 6000);
    }

    initializeViewer();

    return () => {
      cancelled = true;
      apiRef.current?.destroy?.();
      apiRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [artistName, file, instrumentName, resolvedFileUrl, songTitle, zoom]);

  const selectedTrack = tracks[selectedTrackIndex] || null;
  const tuningLabel = formatTuning(selectedTrack);
  const sidebarExpanded = sidebarOpen || sidebarPinned;

  const togglePlayback = () => {
    const api = apiRef.current;
    logDebug("Play clicado", {
      hasApi: Boolean(api),
      playerReady,
      isReadyForPlayback: api?.isReadyForPlayback,
      playerState: api?.playerState,
      tracks: tracks.length,
      soundFontProgress: playerLoadProgress,
    });
    if (!api || !playerReady) return;
    const result = api.playPause();
    logDebug("playPause chamado", {
      result,
      playerState: api.playerState,
      isReadyForPlayback: api.isReadyForPlayback,
    });
  };

  const stopPlayback = () => {
    const api = apiRef.current;
    if (!api) return;
    api.stop();
    logDebug("Stop chamado", {
      playerState: api.playerState,
    });
    setIsPlaying(false);
  };

  const updateTrackVolume = (trackIndex, nextValue) => {
    const api = apiRef.current;
    const track = tracks[trackIndex];
    if (!api || !track) return;

    const safeValue = Number(nextValue);
    setTrackVolumes((current) => ({ ...current, [trackIndex]: safeValue }));
    api.changeTrackVolume([track], safeValue);
  };

  const updateMasterVolume = (nextValue) => {
    const api = apiRef.current;
    const safeValue = Number(nextValue);
    setMasterVolume(safeValue);
    if (api) {
      api.masterVolume = safeValue;
    }
  };

  const updateTrackPan = (trackIndex, nextValue) => {
    const track = tracks[trackIndex];
    const safeValue = Number(nextValue);
    if (!track) return;

    setTrackPans((current) => ({ ...current, [trackIndex]: safeValue }));
    if (track.playbackInfo) {
      track.playbackInfo.balance = Math.round(safeValue * 16);
    }
  };

  const toggleTrackSolo = (trackIndex) => {
    const api = apiRef.current;
    const track = tracks[trackIndex];
    if (!api || !track) return;
    const nextSolo = !track.playbackInfo?.isSolo;
    api.changeTrackSolo([track], nextSolo);
    track.playbackInfo.isSolo = nextSolo;
    setTracks((current) => [...current]);
    renderSelectedTrack(trackIndex);
  };

  const toggleTrackMute = (trackIndex) => {
    const api = apiRef.current;
    const track = tracks[trackIndex];
    if (!api || !track) return;
    const nextMute = !track.playbackInfo?.isMute;
    api.changeTrackMute([track], nextMute);
    track.playbackInfo.isMute = nextMute;
    setTracks((current) => [...current]);
  };

  return (
    <div className="mt-[80px] flex h-[calc(100%-80px)] min-h-0 flex-col overflow-hidden bg-[#f0f0f0]">
      <div className="mx-4 mt-3 shrink-0 rounded-[18px] bg-white/70 px-5 py-4 text-base font-bold text-gray-600 shadow-sm">
        {tuningLabel ? `Afinacao: ${tuningLabel}` : "Afinacao indisponivel"}
        {selectedTrack?.playbackInfo?.program !== undefined
          ? ` · Programa MIDI: ${selectedTrack.playbackInfo.program}`
          : ""}
      </div>

      <div
        className={`grid min-h-0 flex-1 overflow-hidden transition-[grid-template-columns] duration-300 ${
          sidebarExpanded
            ? "grid-cols-[minmax(0,1fr)_30rem]"
            : "grid-cols-[minmax(0,1fr)_5.75rem]"
        }`}
      >
        <div
          ref={scoreViewportRef}
          className="relative m-4 min-h-0 overflow-auto rounded-[26px] bg-white shadow-sm"
        >
          <div
            ref={containerRef}
            className={`min-h-full bg-white px-8 py-8 transition-opacity [&_.at-main]:!mx-0 [&_.at-main]:!w-full [&_.at-main]:!max-w-none [&_.at-viewport]:!overflow-visible ${
              renderError ? "opacity-0" : "opacity-100"
            }`}
          />
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/82 text-sm font-bold text-gray-500 backdrop-blur-[1px]">
              Carregando arquivo Guitar Pro...
            </div>
          ) : null}
          {renderError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white px-6 text-center text-sm font-bold text-red-600">
              {renderError}
            </div>
          ) : null}
        </div>

        <aside className="m-4 ml-0 min-h-0 overflow-hidden rounded-[26px] bg-[#f0f0f0]">
          {!sidebarExpanded ? (
            <div className="flex h-full flex-col items-center gap-3 overflow-auto py-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`${buttonBaseClass} h-12 w-12`}
                title="Abrir instrumentos"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => updateMasterVolume(masterVolume)}
                className={`${buttonBaseClass} h-12 w-12`}
                title={`Volume master ${Math.round(masterVolume * 100)}%`}
              >
                <FaVolumeHigh />
              </button>
              {tracks.map((track, index) => {
                const Icon = getTrackIcon(track);
                const isActive = index === selectedTrackIndex;
                return (
                  <button
                    key={`${normalizeTrackLabel(track, index)}-${index}-rail`}
                    type="button"
                    onClick={() => renderSelectedTrack(index)}
                    className={`relative flex h-14 w-14 items-center justify-center rounded-[18px] text-black ${
                      isActive ? "neuphormism-b-btn-gold" : "neuphormism-b-btn"
                    }`}
                    title={normalizeTrackLabel(track, index)}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive ? (
                      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#2f6f3e]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] bg-white">
              <div className="flex shrink-0 items-center justify-between px-8 py-6">
                <h3 className="text-[2rem] font-black text-black">
                  Instrumentos
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarPinned((current) => !current)}
                    className={`neuphormism-b-btn flex items-center gap-2 rounded-[16px] px-3 py-2 text-sm font-black ${
                      sidebarPinned ? "text-[goldenrod]" : "text-black"
                    }`}
                  >
                    <FaThumbtack />
                    Fixar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarPinned(false);
                      setSidebarOpen(false);
                    }}
                    className={`${buttonBaseClass} h-10 w-10`}
                    title="Fechar instrumentos"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              <div className="mx-8 mb-4 rounded-[22px] neuphormism-b-se px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className="neuphormism-b-avatar flex h-12 w-12 items-center justify-center rounded-full text-black">
                    <FaVolumeHigh />
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(event) => updateMasterVolume(event.target.value)}
                    className="range-golden min-w-0 flex-1"
                  />
                  <span className="w-14 text-right text-xl font-black text-black">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {tracks.map((track, index) => {
                  const isActive = index === selectedTrackIndex;
                  const volume = trackVolumes[index] ?? DEFAULT_TRACK_VOLUME;
                  const pan = trackPans[index] ?? DEFAULT_TRACK_PAN;
                  const label = normalizeTrackLabel(track, index);
                  const Icon = getTrackIcon(track);

                  return (
                    <div
                      key={`${label}-${index}`}
                      className={`border-b border-gray-200 px-4 py-2 ${
                        isActive ? "bg-[#e9e9ec]" : "bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => renderSelectedTrack(index)}
                        className="flex w-full items-center justify-between gap-2 text-left"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="neuphormism-b-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-black">
                              {label}
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">
                              Track {index + 1}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            isActive ? "bg-[goldenrod]" : "bg-gray-300"
                          }`}
                        />
                      </button>

                      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                        <div>
                          <div className="mb-0.5 flex justify-between text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">
                            <span>Volume</span>
                            <span>{Math.round(volume * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(event) =>
                              updateTrackVolume(index, event.target.value)
                            }
                            className="range-golden w-full"
                          />
                        </div>

                        <div>
                          <div className="mb-0.5 flex justify-between text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">
                            <span>Pan</span>
                            <span>
                              {pan < 0.48
                                ? "L"
                                : pan > 0.52
                                  ? "R"
                                  : "C"}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.0625"
                            value={pan}
                            onChange={(event) =>
                              updateTrackPan(index, event.target.value)
                            }
                            className="range-golden w-full"
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTrackSolo(index)}
                          className={`h-7 w-8 rounded-[10px] text-[11px] font-black ${
                            track.playbackInfo?.isSolo
                              ? "neuphormism-b-btn-gold text-black"
                              : "neuphormism-b-btn text-black"
                          }`}
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTrackMute(index)}
                          className={`h-7 w-8 rounded-[10px] text-[11px] font-black ${
                            track.playbackInfo?.isMute
                              ? "neuphormism-b-btn-red text-black"
                              : "neuphormism-b-btn text-black"
                          }`}
                        >
                          M
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="neuphormism-b z-[1] mx-4 mb-3 flex min-h-20 shrink-0 items-center justify-between rounded-[24px] px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!playerReady || Boolean(renderError)}
            className={`${buttonBaseClass} h-14 w-14 ${
              playerReady && !renderError
                ? "neuphormism-b-btn-gold"
                : "cursor-not-allowed opacity-55"
            }`}
            title={playerReady ? "Play/Pause" : `Player carregando ${playerLoadProgress}%`}
          >
            {isPlaying ? (
              <FaPause className="h-5 w-5" />
            ) : (
              <FaPlay className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={stopPlayback}
            disabled={!playerReady}
            className={`${buttonBaseClass} h-12 w-12 ${
              playerReady ? "" : "cursor-not-allowed opacity-55"
            }`}
            title="Stop"
          >
            <FaStop className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(0.7, current - 0.1))}
            className={`${buttonBaseClass} h-12 w-12`}
            title="Zoom out"
          >
            <FaMagnifyingGlassMinus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(1.8, current + 0.1))}
            className={`${buttonBaseClass} h-12 w-12`}
            title="Zoom in"
          >
            <FaMagnifyingGlassPlus className="h-4 w-4" />
          </button>
          <div className="ml-2 min-w-[8rem] text-sm font-black text-gray-600">
            {playerReady
              ? `${formatDuration(playbackPosition.currentTime)} / ${formatDuration(
                  playbackPosition.endTime,
                )}`
              : `Player ${playerLoadProgress}%`}
          </div>
        </div>

        <div className="min-w-0 flex-1 px-6">
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-[goldenrod] transition-[width]"
              style={{
                width: `${
                  playbackPosition.endTime
                    ? Math.min(
                        100,
                        (playbackPosition.currentTime / playbackPosition.endTime) * 100,
                      )
                    : playerLoadProgress
                }%`,
              }}
            />
          </div>
        </div>

        <div className="min-w-0 text-right">
          <div className="truncate text-lg font-black text-black">
            {songTitle || fileName}
          </div>
          <div className="truncate text-sm font-semibold text-gray-500">
            {artistName}
            {artistName && fileName ? " · " : ""}
            {fileName}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuitarProViewer;
