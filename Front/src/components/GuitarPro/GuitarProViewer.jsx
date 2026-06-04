/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as alphaTab from "@coderline/alphatab";
import {
  FaChevronLeft,
  FaChevronRight,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaPause,
  FaPlay,
  FaStop,
  FaThumbtack,
  FaVolumeHigh,
} from "react-icons/fa6";
import {
  GiDrumKit,
  GiGuitar,
  GiGuitarBassHead,
  GiMicrophone,
  GiPianoKeys,
} from "react-icons/gi";
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
const SOUNDFONT_URL = "/soundfont/sonivox.sf3";
const VU_BAR_COUNT = 12;
const TRACK_COLORS = [
  "#d7b528",
  "#9cc94a",
  "#52b65f",
  "#36b986",
  "#25b9a5",
  "#2fb0d4",
  "#7d8df1",
  "#bd77e7",
  "#e36aa5",
  "#e9825c",
];

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
  const event = api?.[eventName] || api?.player?.[eventName];
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

function readPlaybackPosition(event = {}, fallback = {}) {
  const currentTime = Number(event?.currentTime ?? fallback.currentTime ?? 0);
  const endTime = Number(event?.endTime ?? fallback.endTime ?? 0);
  const currentTick = Number(event?.currentTick ?? fallback.currentTick ?? 0);
  const endTick = Number(event?.endTick ?? fallback.endTick ?? 0);

  return {
    currentTime: Number.isFinite(currentTime) ? currentTime : 0,
    endTime: Number.isFinite(endTime) ? endTime : 0,
    currentTick: Number.isFinite(currentTick) ? currentTick : 0,
    endTick: Number.isFinite(endTick) ? endTick : 0,
  };
}

function clampNumber(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function getDynamicIntensity(dynamicValue) {
  const value = Number(dynamicValue);
  const dynamicMap = {
    0: 0.18,
    1: 0.25,
    2: 0.34,
    3: 0.48,
    4: 0.64,
    5: 0.78,
    6: 0.9,
    7: 1,
    8: 0.14,
    9: 0.1,
    10: 0.06,
    11: 1,
    12: 1,
    13: 1,
    23: 0.62,
  };
  return dynamicMap[value] ?? 0.64;
}

function getPlayableNotes(beat) {
  return Array.isArray(beat?.notes)
    ? beat.notes.filter((note) => note?.isVisible !== false)
    : [];
}

function getNotePitch(note) {
  const directPitch = Number(
    note?.realValue ?? note?.displayValue ?? note?.fret ?? note?.tone,
  );
  if (Number.isFinite(directPitch)) return directPitch;

  if (typeof note?.calculateRealValue === "function") {
    try {
      const calculatedPitch = Number(note.calculateRealValue(true, true));
      if (Number.isFinite(calculatedPitch)) return calculatedPitch;
    } catch {
      return 60;
    }
  }

  return 60;
}

function getBeatIntensity(beat) {
  if (!beat || beat.isRest) return 0;

  const notes = getPlayableNotes(beat);
  if (!notes.length) return 0;

  const strongestDynamic = Math.max(
    getDynamicIntensity(beat.dynamics),
    ...notes.map((note) => getDynamicIntensity(note.dynamics)),
  );
  const noteDensity = clampNumber(0.5 + notes.length * 0.12, 0.5, 1);
  const articulationModifier =
    beat.isPalmMute || notes.some((note) => note.isPalmMute) ? 0.72 : 1;

  return clampNumber(strongestDynamic * noteDensity * articulationModifier);
}

function buildVuBars(beat, intensity, currentTick, lookup) {
  if (!beat || intensity <= 0) return Array(VU_BAR_COUNT).fill(0);

  const notes = getPlayableNotes(beat);
  const pitches = notes.map(getNotePitch);
  const minPitch = pitches.length ? Math.min(...pitches) : 48;
  const maxPitch = pitches.length ? Math.max(...pitches) : 84;
  const pitchRange = Math.max(1, maxPitch - minPitch);
  const progress =
    lookup?.tickDuration > 0
      ? clampNumber((currentTick - lookup.start) / lookup.tickDuration)
      : 0;
  const envelope = clampNumber(1 - progress * 0.45, 0.4, 1);

  return Array.from({ length: VU_BAR_COUNT }, (_, barIndex) => {
    const barPosition = barIndex / Math.max(1, VU_BAR_COUNT - 1);
    const pitchEnergy = pitches.length
      ? Math.max(
          ...pitches.map((pitch) => {
            const pitchPosition = (pitch - minPitch) / pitchRange;
            return 1 - clampNumber(Math.abs(barPosition - pitchPosition) * 2.4);
          }),
        )
      : 0.45;
    const body = 0.25 + pitchEnergy * 0.75;
    const shimmer =
      0.86 + Math.sin(progress * Math.PI * 2 + barIndex * 0.72) * 0.14;
    return clampNumber(intensity * envelope * body * shimmer);
  });
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

function getTrackColor(index) {
  return TRACK_COLORS[index % TRACK_COLORS.length];
}

function getTrackIcon(track) {
  const haystack = [track?.name, track?.shortName, track?.playbackInfo?.program]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const program = Number(track?.playbackInfo?.program);

  if (
    track?.isPercussion ||
    haystack.includes("drum") ||
    haystack.includes("perc")
  ) {
    return GiDrumKit;
  }
  if (haystack.includes("bass") || (program >= 32 && program <= 39)) {
    return GiGuitarBassHead;
  }
  if (
    haystack.includes("piano") ||
    haystack.includes("key") ||
    haystack.includes("synth") ||
    (program >= 0 && program <= 7) ||
    (program >= 16 && program <= 23)
  ) {
    return GiPianoKeys;
  }
  if (
    haystack.includes("voice") ||
    haystack.includes("vocal") ||
    haystack.includes("vox")
  ) {
    return GiMicrophone;
  }
  return GiGuitar;
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
  const [zoom, setZoom] = useState(0.9);
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
    currentTick: 0,
    endTick: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const playerReadyRef = useRef(false);
  const masterVolumeRef = useRef(DEFAULT_MASTER_VOLUME);

  const resolvedFileUrl = useMemo(
    () => resolveFileUrl(file?.url || fileUrl),
    [file?.url, fileUrl],
  );

  const syncPlaybackPosition = useCallback((event) => {
    if (
      !event ||
      (event.currentTime === undefined && event.endTime === undefined)
    ) {
      return;
    }

    setPlaybackPosition((current) => readPlaybackPosition(event, current));
  }, []);

  const markPlayerReady = useCallback((api) => {
    if (!api) return;
    playerReadyRef.current = true;
    api.masterVolume = masterVolumeRef.current;
    setPlayerLoadProgress(100);
    setPlayerReady(true);
  }, []);

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
    if (!containerRef.current || (!resolvedFileUrl && !file?.id))
      return undefined;

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
      playerReadyRef.current = false;
      setPlayerLoadProgress(0);
      setPlaybackPosition({
        currentTime: 0,
        endTime: 0,
        currentTick: 0,
        endTick: 0,
      });

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
          playerMode: alphaTab.PlayerMode.EnabledSynthesizer,
          enableCursor: true,
          enableUserInteraction: true,
          soundFont: SOUNDFONT_URL,
          outputMode: alphaTab.PlayerOutputMode.WebAudioScriptProcessor,
          scrollElement: scoreViewportRef.current,
        },
      });

      apiRef.current = api;
      logDebug("AlphaTab API criada", {
        hasPlayerReady: Boolean(api.playerReady?.on),
        hasSoundFontLoad: Boolean(api.soundFontLoad?.on),
        hasSoundFontLoaded: Boolean(api.soundFontLoaded?.on),
        hasSoundFontLoadFailed: Boolean(
          api.soundFontLoadFailed?.on || api.player?.soundFontLoadFailed?.on,
        ),
        hasPlayerPositionChanged: Boolean(api.playerPositionChanged?.on),
        playerMode: api.settings?.player?.playerMode,
        outputMode: api.settings?.player?.outputMode,
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
        markPlayerReady(api);
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
        if (api.isReadyForPlayback) {
          markPlayerReady(api);
        }
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
        syncPlaybackPosition(event);
      });

      registerAlphaTabListener(api, "error", (error) => {
        if (cancelled) return;
        console.error(`${LOG_PREFIX} AlphaTab error:`, error);
        setRenderError("Nao foi possivel renderizar este arquivo Guitar Pro.");
        setLoading(false);
      });

      registerAlphaTabListener(api, "renderFinished", () => {
        if (cancelled) return;
        if (api.isReadyForPlayback) {
          markPlayerReady(api);
        }
        logDebug("Render finalizado", {
          isReadyForPlayback: api.isReadyForPlayback,
          playerReady: playerReadyRef.current,
        });
        setLoading(false);
      });

      const playbackPoll = window.setInterval(() => {
        if (cancelled || !apiRef.current) return;
        if (!playerReadyRef.current && api.isReadyForPlayback) {
          markPlayerReady(api);
        }
      }, 250);

      window.setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 6000);

      return () => window.clearInterval(playbackPoll);
    }

    let cleanupPlaybackPoll;
    initializeViewer().then((cleanup) => {
      cleanupPlaybackPoll = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupPlaybackPoll?.();
      apiRef.current?.destroy?.();
      apiRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    artistName,
    file,
    instrumentName,
    markPlayerReady,
    resolvedFileUrl,
    songTitle,
    syncPlaybackPosition,
  ]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.settings.display.scale = zoom;
    api.updateSettings();
    api.render();
  }, [zoom]);

  const selectedTrack = tracks[selectedTrackIndex] || null;
  const tuningLabel = formatTuning(selectedTrack);
  const sidebarExpanded = sidebarOpen || sidebarPinned;
  const hasSoloTracks = tracks.some((track) => track.playbackInfo?.isSolo);
  const playbackPercent = playbackPosition.endTime
    ? Math.min(
        100,
        Math.max(
          0,
          (playbackPosition.currentTime / playbackPosition.endTime) * 100,
        ),
      )
    : playerLoadProgress;
  const trackPlaybackLevels = useMemo(() => {
    const api = apiRef.current;
    const currentTick = Number(playbackPosition.currentTick);
    if (!api?.tickCache || !isPlaying || !Number.isFinite(currentTick)) {
      return {};
    }

    return tracks.reduce((levels, track, index) => {
      const volume = trackVolumes[index] ?? DEFAULT_TRACK_VOLUME;
      const canPlay =
        !track.playbackInfo?.isMute &&
        (!hasSoloTracks || track.playbackInfo?.isSolo) &&
        volume > 0 &&
        masterVolume > 0;

      if (!canPlay) {
        levels[index] = { active: false, bars: Array(VU_BAR_COUNT).fill(0) };
        return levels;
      }

      const trackIndex = Number.isFinite(Number(track.index))
        ? Number(track.index)
        : index;
      const lookup = api.tickCache.findBeat(new Set([trackIndex]), currentTick);
      const beat = lookup?.beat;
      const isInsideBeat =
        lookup &&
        currentTick >= lookup.start &&
        currentTick < lookup.end &&
        beat &&
        !beat.isRest;
      const beatIntensity = isInsideBeat ? getBeatIntensity(beat) : 0;
      const intensity = clampNumber(beatIntensity * volume * masterVolume);

      levels[index] = {
        active: intensity > 0.04,
        bars: buildVuBars(beat, intensity, currentTick, lookup),
      };
      return levels;
    }, {});
  }, [
    hasSoloTracks,
    isPlaying,
    masterVolume,
    playbackPosition.currentTick,
    trackVolumes,
    tracks,
  ]);

  const togglePlayback = useCallback(() => {
    const api = apiRef.current;
    logDebug("Play clicado", {
      hasApi: Boolean(api),
      playerReady,
      isReadyForPlayback: api?.isReadyForPlayback,
      playerState: api?.playerState,
      tracks: tracks.length,
      soundFontProgress: playerLoadProgress,
    });
    if (!api || !playerReady || renderError) return;
    const result = api.playPause();
    window.setTimeout(() => {
      setIsPlaying(api.playerState === alphaTab.synth.PlayerState.Playing);
    }, 0);
    logDebug("playPause chamado", {
      result,
      playerState: api.playerState,
      isReadyForPlayback: api.isReadyForPlayback,
    });
  }, [playerLoadProgress, playerReady, renderError, tracks.length]);

  const stopPlayback = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    api.stop();
    setPlaybackPosition((current) => ({
      ...current,
      currentTime: 0,
      currentTick: 0,
    }));
    logDebug("Stop chamado", {
      playerState: api.playerState,
    });
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const handleSpacePlayback = (event) => {
      if (event.code !== "Space" || event.repeat || event.metaKey) return;
      const tagName = event.target?.tagName?.toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        event.target?.isContentEditable;

      if (isTypingTarget) return;

      event.preventDefault();
      const api = apiRef.current;
      if (!api || !playerReady || renderError) return;

      if (api.playerState === alphaTab.synth.PlayerState.Playing) {
        stopPlayback();
      } else {
        togglePlayback();
      }
    };

    window.addEventListener("keydown", handleSpacePlayback);
    return () => window.removeEventListener("keydown", handleSpacePlayback);
  }, [playerReady, renderError, stopPlayback, togglePlayback]);

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
    masterVolumeRef.current = safeValue;
    setMasterVolume(safeValue);
    if (api) {
      api.masterVolume = safeValue;
    }
  };

  const seekPlayback = (nextPercent) => {
    const api = apiRef.current;
    if (!api || !playbackPosition.endTime) return;

    const safePercent = Math.min(100, Math.max(0, Number(nextPercent)));
    const nextTime = (safePercent / 100) * playbackPosition.endTime;
    api.timePosition = nextTime;
    setPlaybackPosition((current) => ({
      ...current,
      currentTime: nextTime,
      currentTick: current.endTick
        ? (safePercent / 100) * current.endTick
        : current.currentTick,
    }));
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
      <div className="mx-4 mt-3 flex shrink-0 items-center justify-between gap-4 rounded-[18px] bg-white/70 px-5 py-4 text-base font-bold text-gray-600 shadow-sm">
        <div className="flex flex-col">
          <div className="flex flex-col">
            <div className="min-w-0 truncate text-xl">
              {songTitle || "Desconecido"}
            </div>
            <div className="min-w-0 truncate">
              {artistName || "Desconecido"}
            </div>
          </div>
        </div>
        <div className="flex flex-col text-right">
          <div className="min-w-0 truncate text-sm">
            {tuningLabel ? `Afinacao: ${tuningLabel}` : "Afinacao indisponivel"}
            {selectedTrack?.playbackInfo?.program !== undefined
              ? ` · Programa MIDI: ${selectedTrack.playbackInfo.program}`
              : ""}
          </div>
          <div className="shrink-0 text-sm font-bold text-black">
            Zoom {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      <div
        className={`grid min-h-0 flex-1 overflow-hidden transition-[grid-template-columns] duration-300 ${
          sidebarExpanded
            ? "grid-cols-[minmax(0,1fr)_30rem]"
            : "grid-cols-[minmax(0,1fr)_3.5rem]"
        }`}
      >
        <div
          ref={scoreViewportRef}
          className="guitar-pro-score relative m-4 min-h-0 overflow-auto rounded-[26px] bg-white shadow-sm"
        >
          <style>
            {`
              .guitar-pro-score .at-cursor-beat {
                animation: none !important;
                margin-left: -10px !important;
                opacity: 1 !important;
                visibility: visible !important;
              }
            `}
          </style>
          <div
            ref={containerRef}
            className={`min-h-full bg-white px-8 py-8 transition-opacity [&_.at-cursor-bar]:!bg-[rgba(218,165,32,0.18)] [&_.at-cursor-beat]:!w-[20px] [&_.at-cursor-beat]:!animate-none [&_.at-cursor-beat]:!bg-[#e53935] [&_.at-cursor-beat]:!opacity-100 [&_.at-cursor-beat]:!shadow-[0_0_10px_rgba(229,57,53,0.65)] [&_.at-main]:!mx-0 [&_.at-main]:!w-full [&_.at-main]:!max-w-none [&_.at-viewport]:!overflow-visible ${
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

        <aside className="m-3 ml-0 min-h-0 overflow-hidden rounded-[20px] bg-[#f0f0f0]">
          {!sidebarExpanded ? (
            <div className="flex h-full flex-col items-center gap-1.5 overflow-auto py-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`${buttonBaseClass} h-8 w-8`}
                title="Abrir instrumentos"
              >
                <FaChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateMasterVolume(masterVolume)}
                className={`${buttonBaseClass} h-8 w-8`}
                title={`Volume master ${Math.round(masterVolume * 100)}%`}
              >
                <FaVolumeHigh className="h-3.5 w-3.5" />
              </button>
              {tracks.map((track, index) => {
                const Icon = getTrackIcon(track);
                const isActive = index === selectedTrackIndex;
                return (
                  <button
                    key={`${normalizeTrackLabel(track, index)}-${index}-rail`}
                    type="button"
                    onClick={() => renderSelectedTrack(index)}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-black ${
                      isActive ? "neuphormism-b-btn-gold" : "neuphormism-b-btn"
                    }`}
                    title={normalizeTrackLabel(track, index)}
                  >
                    <Icon className="h-4 w-4" />
                    {isActive ? (
                      <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-[#2f6f3e]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] bg-[#f0f0f0] text-black shadow-inner">
              <div className="flex shrink-0 items-center justify-between border-b border-white/70 bg-[#f7f7f7] px-3 py-2 shadow-sm">
                <h3 className="text-[0.85rem] font-bold uppercase tracking-[0.08em] text-black">
                  Instrumentos
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarPinned((current) => !current)}
                    className={`flex items-center gap-1 rounded-[7px] px-2 py-1 text-[10px] font-bold shadow-sm ${
                      sidebarPinned
                        ? "neuphormism-b-btn-gold text-black"
                        : "neuphormism-b-btn text-black"
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
                    className="neuphormism-b-btn flex h-7 w-7 items-center justify-center rounded-[7px] text-black active:scale-[0.98]"
                    title="Fechar instrumentos"
                  >
                    <FaChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-[1.35rem_2rem_minmax(0,1fr)_3.2rem] items-center gap-2 border-b border-white/70 bg-[#f4f4f4] pr-2 shadow-sm">
                <div className="flex h-full items-center justify-center bg-[goldenrod] text-[10px] font-bold text-white">
                  M
                </div>
                <span className="neuphormism-b-avatar flex h-7 w-7 items-center justify-center rounded-full text-black">
                  <FaVolumeHigh className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 py-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">
                    <span>Master</span>
                    <span>{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(event) => updateMasterVolume(event.target.value)}
                    className="range-golden w-full"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="neuphormism-b-avatar flex h-7 w-7 items-center justify-center rounded-full text-black">
                    <FaVolumeHigh />
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
                  const trackColor = getTrackColor(index);
                  const trackVu = trackPlaybackLevels[index] || {
                    active: false,
                    bars: Array(VU_BAR_COUNT).fill(0),
                  };

                  return (
                    <div
                      key={`${label}-${index}`}
                      className={`flex min-h-[4.35rem] items-stretch justify-between border-b border-white/80 pr-2 text-black ${
                        isActive ? "bg-[#e9e9ec]" : "bg-[#f7f7f7]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => renderSelectedTrack(index)}
                        className="self-stretch w-[1.35rem] shrink-0 text-[10px] font-bold text-white"
                        style={{ backgroundColor: trackColor }}
                        title={`Track ${index + 1}`}
                      >
                        <span className="flex h-full w-full items-center justify-center">
                          {index + 1}
                        </span>
                      </button>

                      <div className="flex flex-col w-full pl-2">
                        <div className="flex w-full items-center px-2 pt-2">
                          <button
                            type="button"
                            onClick={() => renderSelectedTrack(index)}
                            className="block w-full truncate text-left text-[10px] font-bold leading-tight text-gray-600 pl-[3em] uppercase"
                            title={label}
                          >
                            {label}
                          </button>
                        </div>
                        <div className="flex w-full items-center gap-2">
                          <button
                            type="button"
                            onClick={() => renderSelectedTrack(index)}
                            className="neuphormism-b-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-black"
                            title={label}
                          >
                            <Icon className="h-3 w-3 text-black" />
                          </button>

                          <div className="min-w-0 flex-[1.15] py-2">
                            <div className="mt-1 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleTrackMute(index)}
                                className={`h-4 w-5 rounded-[3px] text-[9px] font-bold leading-none shadow-sm ${
                                  track.playbackInfo?.isMute
                                    ? "bg-[#d66f5f] text-black"
                                    : "neuphormism-b-btn text-black"
                                }`}
                              >
                                M
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleTrackSolo(index)}
                                className={`h-4 w-5 rounded-[3px] text-[9px] font-bold leading-none shadow-sm ${
                                  track.playbackInfo?.isSolo
                                    ? "neuphormism-b-btn-gold text-black"
                                    : "neuphormism-b-btn text-black"
                                }`}
                              >
                                S
                              </button>
                            </div>
                          </div>

                          <div className="min-w-0 flex-[4] py-2">
                            <div
                              className="mb-1 flex h-3 items-end gap-[2px] rounded-[4px] bg-gray-300 p-[2px] shadow-inner"
                              title={trackVu.active ? "VU ativo" : "VU parado"}
                            >
                              {trackVu.bars.map((level, barIndex) => {
                                const isLit = trackVu.active && level > 0.08;
                                const isPeak = level > 100;
                                const barHeight = `${Math.max(18, Math.round(level * 100))}%`;

                                return (
                                  <span
                                    key={`${label}-vu-${barIndex}`}
                                    className={`flex-1 rounded-[1px] transition-all duration-150 ${
                                      isLit
                                        ? isPeak
                                          ? "bg-[#e53935] shadow-[0_0_6px_rgba(229,57,53,0.55)]"
                                          : "bg-[goldenrod]"
                                        : "bg-white/70"
                                    }`}
                                    style={{
                                      height: isLit ? barHeight : "100%",
                                      opacity: isLit ? 0.55 + level * 0.45 : 1,
                                    }}
                                  />
                                );
                              })}

                              {trackVu.active ? (
                                <span
                                  className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4fe535] p-1"
                                  aria-hidden="true"
                                />
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
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
                                  title={`Volume ${Math.round(volume * 100)}%`}
                                />
                              </div>

                              <div className="w-10 shrink-0 text-right text-[10px] font-bold text-gray-600">
                                {Math.round(volume * 100)}%
                              </div>
                            </div>
                          </div>

                          <div className="flex w-[3.1rem] h-12 shrink-0 flex-col items-center justify-between ">
                            <div
                              className="neuphormism-b-avatar relative h-6 w-6 rounded-full"
                              title={`Pan ${pan < 0.48 ? "L" : pan > 0.52 ? "R" : "C"}`}
                            >
                              <span
                                className="absolute left-1/2 top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-[#e53935]"
                                style={{
                                  transform: `translate(-50%, -100%) rotate(${
                                    (pan - 0.5) * 270
                                  }deg)`,
                                }}
                              />
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
                              className="h-[0.9rem] w-9 accent-black"
                              title="Pan"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* <div className="min-h-0 flex-1 overflow-auto">
                {tracks.map((track, index) => {
                  const isActive = index === selectedTrackIndex;
                  const volume = trackVolumes[index] ?? DEFAULT_TRACK_VOLUME;
                  const pan = trackPans[index] ?? DEFAULT_TRACK_PAN;
                  const label = normalizeTrackLabel(track, index);
                  const Icon = getTrackIcon(track);
                  const trackColor = getTrackColor(index);
                  const trackVu = trackPlaybackLevels[index] || {
                    active: false,
                    bars: Array(VU_BAR_COUNT).fill(0),
                  };

                  return (
                    <div
                      key={`${label}-${index}`}
                      className={`grid min-h-[4.35rem] grid-cols-[1.35rem_2.05rem_minmax(0,1.15fr)_minmax(0,4fr)_3.1rem] items-center gap-2 border-b border-white/80 pr-2 text-black ${
                        isActive ? "bg-[#e9e9ec]" : "bg-[#f7f7f7]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => renderSelectedTrack(index)}
                        className="flex h-full items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: trackColor }}
                        title={`Track ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                      <button
                        type="button"
                        onClick={() => renderSelectedTrack(index)}
                        className="neuphormism-b-avatar flex h-9 w-9 items-center justify-center rounded-full text-black"
                        title={label}
                      >
                        <Icon className="h-4 w-4 text-black" />
                      </button>

                      <div className="min-w-0 py-2">
                        <button
                          type="button"
                          onClick={() => renderSelectedTrack(index)}
                          className="block w-full truncate text-left text-[12px] font-bold leading-tight text-black"
                          title={label}
                        >
                          {label}
                        </button>
                        <div className="mt-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleTrackMute(index)}
                            className={`h-4 w-5 rounded-[3px] text-[9px] font-bold leading-none shadow-sm ${
                              track.playbackInfo?.isMute
                                ? "bg-[#d66f5f] text-black"
                                : "neuphormism-b-btn text-black"
                            }`}
                          >
                            M
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTrackSolo(index)}
                            className={`h-4 w-5 rounded-[3px] text-[9px] font-bold leading-none shadow-sm ${
                              track.playbackInfo?.isSolo
                                ? "neuphormism-b-btn-gold text-black"
                                : "neuphormism-b-btn text-black"
                            }`}
                          >
                            S
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0 py-2">
                        <div
                          className="mb-1 flex h-3 items-end gap-[2px] rounded-[4px] bg-gray-300 p-[2px] shadow-inner"
                          title={trackVu.active ? "VU ativo" : "VU parado"}
                        >
                          {trackVu.bars.map((level, barIndex) => {
                            const isLit = trackVu.active && level > 0.08;
                            const isPeak = level > 0.74;
                            const barHeight = `${Math.max(18, Math.round(level * 100))}%`;
                            return (
                              <span
                                key={`${label}-vu-${barIndex}`}
                                className={`flex-1 rounded-[1px] transition-all duration-150 ${
                                  isLit
                                    ? isPeak
                                      ? "bg-[#e53935] shadow-[0_0_6px_rgba(229,57,53,0.55)]"
                                      : "bg-[goldenrod]"
                                    : "bg-white/70"
                                }`}
                                style={{
                                  height: isLit ? barHeight : "18%",
                                  opacity: isLit ? 0.55 + level * 0.45 : 1,
                                }}
                              />
                            );
                          })}
                          {trackVu.active ? (
                            <span
                              className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e53935] shadow-[0_0_8px_rgba(229,57,53,0.75)]"
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                        <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,1fr)] items-center gap-2">
                          <div className="min-w-0">
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
                              title={`Volume ${Math.round(volume * 100)}%`}
                            />
                          </div>
                          <div className="text-right text-[10px] font-bold text-gray-600">
                            {Math.round(volume * 100)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-1 py-2">
                        <div
                          className="neuphormism-b-avatar relative h-8 w-8 rounded-full"
                          title={`Pan ${pan < 0.48 ? "L" : pan > 0.52 ? "R" : "C"}`}
                        >
                          <span
                            className="absolute left-1/2 top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-[#e53935]"
                            style={{
                              transform: `translate(-50%, -100%) rotate(${(pan - 0.5) * 270}deg)`,
                            }}
                          />
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
                          className="h-[0.9rem] w-9 accent-black"
                          title="Pan"
                        />
                      </div>
                    </div>
                  );
                })}
              </div> */}
            </div>
          )}
        </aside>
      </div>

      <div className="neuphormism-b z-[1] mx-4 mb-2 flex min-h-12 shrink-0 items-center justify-between rounded-[18px] px-4 py-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!playerReady || Boolean(renderError)}
            className={`${buttonBaseClass} h-10 w-10 ${
              playerReady && !renderError
                ? "neuphormism-b-btn-gold"
                : "cursor-not-allowed opacity-55"
            }`}
            title={
              playerReady
                ? "Play/Pause"
                : `Player carregando ${playerLoadProgress}%`
            }
          >
            {isPlaying ? (
              <FaPause className="h-4 w-4" />
            ) : (
              <FaPlay className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={stopPlayback}
            disabled={!playerReady}
            className={`${buttonBaseClass} h-9 w-9 ${
              playerReady ? "" : "cursor-not-allowed opacity-55"
            }`}
            title="Stop"
          >
            <FaStop className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(0.7, current - 0.1))}
            className={`${buttonBaseClass} h-9 w-9`}
            title="Zoom out"
          >
            <FaMagnifyingGlassMinus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(1.8, current + 0.1))}
            className={`${buttonBaseClass} h-9 w-9`}
            title="Zoom in"
          >
            <FaMagnifyingGlassPlus className="h-3.5 w-3.5" />
          </button>
          <div className="ml-1 min-w-[7rem] text-xs font-bold text-gray-600">
            {playerReady
              ? `${formatDuration(playbackPosition.currentTime)} / ${formatDuration(
                  playbackPosition.endTime,
                )}`
              : `Player ${playerLoadProgress}%`}
          </div>
        </div>

        <div className="min-w-0 flex-1 px-4">
          <div className="relative h-4">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={playbackPercent}
              disabled={!playbackPosition.endTime}
              onChange={(event) => seekPlayback(event.target.value)}
              className="absolute inset-0 z-[1] h-4 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-label="Guitar Pro playback progress"
              title={
                playbackPosition.endTime
                  ? "Arrastar progresso"
                  : "Aguardando duracao do player"
              }
            />
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-[goldenrod] transition-[width]"
                style={{ width: `${playbackPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 text-right">
          <div className="truncate text-sm font-bold text-black">
            {songTitle || fileName}
          </div>
          <div className="truncate text-xs font-semibold text-gray-500">
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
