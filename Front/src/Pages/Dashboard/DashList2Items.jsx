/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo, useRef } from "react";
import {
  requestData,
  saveDashboardVisibleSongs,
  setSongOfflineEnabled,
} from "../../Tools/Controllers";
import { Link, useNavigate } from "react-router-dom";
import {
  GiDrumKit,
  GiGuitar,
  GiGuitarBassHead,
  GiMicrophone,
  GiPianoKeys,
} from "react-icons/gi";
import {
  FaCalendarPlus,
  FaFileCode,
  FaHistory,
  FaMusic,
  FaRegStickyNote,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { formatDisplayDate, parseDateValue } from "../../Tools/dateFormat";
import DashboardSongActionSheet from "./DashboardSongActionSheet";
import GuitarProIcon from "../../components/GuitarPro/GuitarProIcon";

const INSTRUMENT_ICON_SIZE = 26;
const INSTRUMENT_ICON_BOX_CLASS = "flex h-5 w-5 items-center justify-center";
const DASHBOARD_INSTRUMENT_ICON_CLASS =
  "dashboard-instrument-icon flex h-[15px] w-[15px] items-center justify-center";
const LONG_PRESS_DELAY = 450;
const INSTRUMENT_PROGRESSION_COLUMN_MAP = {
  guitar01Progression: "guitar01",
  guitar02Progression: "guitar02",
  bassProgression: "bass",
  keysProgression: "keys",
  drumsProgression: "drums",
  voiceProgression: "voice",
};

function DashList2Items({
  sortColumn,
  sortOrder,
  songs: songsProp,
  hasAnySongs = false,
  isLoading = false,
  visibleColumns = ["progression", "instruments"],
  gridTemplateColumns,
  offlineMode = false,
  onSongsChanged = () => {},
}) {
  const [data, setData] = useState([]);
  const [isMobile, setIsMobile] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [tooltipSongKey, setTooltipSongKey] = useState(null);
  const navigate = useNavigate();
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const tooltipTimerRef = useRef(null);

  const instrumentLabels = [
    { key: "guitar01", label: "G1", modalLabel: "Guitar 1", icon: GiGuitar },
    { key: "guitar02", label: "G2", modalLabel: "Guitar 2", icon: GiGuitar },
    { key: "bass", label: "B", modalLabel: "Bass", icon: GiGuitarBassHead },
    { key: "keys", label: "K", modalLabel: "Keys", icon: GiPianoKeys },
    { key: "drums", label: "D", modalLabel: "Drums", icon: GiDrumKit },
    { key: "voice", label: "V", modalLabel: "Vocals", icon: GiMicrophone },
  ];

  useEffect(() => {
    if (songsProp) {
      setData(songsProp);
    } else {
      const fetchData = async () => {
        try {
          const result = await requestData(localStorage.getItem("userEmail"));
          const parsedResult = JSON.parse(result);

          if (Array.isArray(parsedResult)) {
            const filteredData = parsedResult.filter(
              (item) =>
                item.instruments &&
                Object.values(item.instruments).some((val) => val === true),
            );
            setData(filteredData);
          } else {
            console.error("Unexpected data structure:", parsedResult);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [songsProp]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (tooltipTimerRef.current) {
        window.clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  const renderInstrumentIcon = (instrument, isActive) => {
    const Icon = instrument.icon;

    return (
      <span
        className={INSTRUMENT_ICON_BOX_CLASS}
        title={instrument.label}
        aria-label={instrument.label}
      >
        <Icon size={INSTRUMENT_ICON_SIZE} />
      </span>
    );
  };

  const renderCompactInstrumentIcon = (instrument) => {
    const Icon = instrument.icon;

    return (
      <span
        className={DASHBOARD_INSTRUMENT_ICON_CLASS}
        title={instrument.label}
        aria-label={instrument.label}
      >
        <Icon className="dashboard-instrument-svg" size={18} />
      </span>
    );
  };

  const getVideoLinks = (item) =>
    Array.isArray(item.embedVideos)
      ? item.embedVideos
      : Array.isArray(item.embedLink)
        ? item.embedLink
        : [];

  const getAddedDate = (item) =>
    formatDisplayDate(
      item.createdAt ||
        item.createIn ||
        item.createdIn ||
        item.addedIn ||
        item.updateIn,
    );

  const getAddedDateTimestamp = (item) =>
    parseDateValue(
      item.createdAt ||
        item.createIn ||
        item.createdIn ||
        item.addedIn ||
        item.updateIn,
    )?.getTime() || 0;

  const getLastPlayTimestamp = (item) => {
    const candidates = [
      item.lastPlayed,
      item.lastPlay,
      item.guitar01?.lastPlay,
      item.guitar02?.lastPlay,
      item.bass?.lastPlay,
      item.keys?.lastPlay,
      item.drums?.lastPlay,
      item.voice?.lastPlay,
    ]
      .flat()
      .filter(Boolean);

    return candidates
      .map((value) => parseDateValue(value))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0]?.getTime() || 0;
  };

  const getLastPlayDate = (item) => {
    const candidates = [
      item.lastPlayed,
      item.lastPlay,
      item.guitar01?.lastPlay,
      item.guitar02?.lastPlay,
      item.bass?.lastPlay,
      item.keys?.lastPlay,
      item.drums?.lastPlay,
      item.voice?.lastPlay,
    ]
      .flat()
      .filter(Boolean);

    if (!candidates.length) return "not played yet";

    const dates = candidates
      .map((value) => parseDateValue(value))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime());

    return dates[0] ? formatDisplayDate(dates[0]) : "not played yet";
  };

  const hasInstrumentNotes = (item) =>
    instrumentLabels.some((instrument) => {
      const value = item?.[instrument.key]?.notes;
      return typeof value === "string" && value.trim() !== "";
    });

  const getGuitarProFiles = (item) =>
    Array.isArray(item?.guitarProFiles) ? item.guitarProFiles : [];

  const getInstrumentProgress = (item, instrumentKey) => {
    const value = item?.[instrumentKey]?.progress;
    const progress = Number(value);
    if (!Number.isFinite(progress)) return 0;
    return Math.max(0, Math.min(100, progress));
  };

  const selectedProgressionInstruments = visibleColumns
    .map((columnKey) => INSTRUMENT_PROGRESSION_COLUMN_MAP[columnKey])
    .filter(Boolean);

  const optionalCellClass =
    "flex min-w-0 max-w-full items-center justify-center overflow-hidden px-1";
  const dateCellClass =
    "flex min-w-0 max-w-full items-center justify-center gap-0.5 overflow-hidden px-0.5 text-[clamp(7px,0.95vw,12px)] font-semibold leading-none text-gray-600";

  const sortedData = useMemo(() => {
    if (!data) return [];
    const dataCopy = data.map((item, index) => ({
      ...item,
      __dashboardIndex: index,
    }));

    if (sortColumn) {
      dataCopy.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortColumn) {
          case "number":
            valueA = a.__dashboardIndex;
            valueB = b.__dashboardIndex;
            break;
          case "progressBar":
            valueA = Number(a.progressBar || 0);
            valueB = Number(b.progressBar || 0);
            break;
          case "guitar01Progression":
          case "guitar02Progression":
          case "bassProgression":
          case "keysProgression":
          case "drumsProgression":
          case "voiceProgression": {
            const instrumentKey = INSTRUMENT_PROGRESSION_COLUMN_MAP[sortColumn];
            valueA = getInstrumentProgress(a, instrumentKey);
            valueB = getInstrumentProgress(b, instrumentKey);
            break;
          }
          case "notes":
            valueA = hasInstrumentNotes(a) ? 1 : 0;
            valueB = hasInstrumentNotes(b) ? 1 : 0;
            break;
          case "guitarPro":
            valueA = getGuitarProFiles(a).length;
            valueB = getGuitarProFiles(b).length;
            break;
          case "tags":
            valueA = Array.isArray(a.setlist) ? a.setlist.join(" ") : "";
            valueB = Array.isArray(b.setlist) ? b.setlist.join(" ") : "";
            break;
          case "videos":
            valueA = getVideoLinks(a).length;
            valueB = getVideoLinks(b).length;
            break;
          case "instruments":
            valueA = Object.values(a.instruments || {}).filter(Boolean).length;
            valueB = Object.values(b.instruments || {}).filter(Boolean).length;
            break;
          case "addedDate":
            valueA = getAddedDateTimestamp(a);
            valueB = getAddedDateTimestamp(b);
            break;
          case "lastPlay":
            valueA = getLastPlayTimestamp(a);
            valueB = getLastPlayTimestamp(b);
            break;
          default:
            valueA = (a[sortColumn] || "").toString().toLowerCase();
            valueB = (b[sortColumn] || "").toString().toLowerCase();
        }

        if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
        if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return dataCopy;
  }, [data, sortColumn, sortOrder]);

  useEffect(() => {
    if (!isLoading) {
      saveDashboardVisibleSongs(sortedData);
    }
  }, [isLoading, sortedData]);

  const renderOptionalCell = (item, columnKey) => {
    if (columnKey === "progression") {
      return (
        <div className={optionalCellClass}>
          <div className="w-full bg-gray-200 rounded-full input-neumorfismo">
            <div
              className="bg-[#DAA520] rounded text-center py-1 text-[8pt] leading-none text-black"
              style={{ width: `${item.progressBar || 0}%` }}
            >
              {item.progressBar || 0}%
            </div>
          </div>
        </div>
      );
    }

    if (INSTRUMENT_PROGRESSION_COLUMN_MAP[columnKey]) {
      const instrumentKey = INSTRUMENT_PROGRESSION_COLUMN_MAP[columnKey];
      const progress = getInstrumentProgress(item, instrumentKey);

      return (
        <div className={optionalCellClass}>
          <div className="w-full bg-gray-200 rounded-full input-neumorfismo">
            <div
              className="bg-[#DAA520] rounded text-center py-1 text-[8pt] leading-none text-black"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        </div>
      );
    }

    if (columnKey === "tags") {
      const tags = Array.isArray(item.setlist) ? item.setlist : [];
      return (
        <div className="min-w-0 max-w-full overflow-hidden px-1">
          <div className="flex min-w-0 max-w-full gap-1 overflow-hidden">
            {tags.length ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="min-w-0 truncate rounded-full bg-[goldenrod] px-2 py-1 text-[10px] font-medium text-black"
                  title={tag}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-semibold text-gray-400">
                No tags
              </span>
            )}
          </div>
        </div>
      );
    }

    if (columnKey === "videos") {
      const videos = getVideoLinks(item);
      return (
        <div className={`${optionalCellClass} gap-1`}>
          {videos.length ? (
            videos.map((video, index) => (
              <FaVideo
                key={`${video}-${index}`}
                className="text-[goldenrod]"
                title={`Video ${index + 1}`}
              />
            ))
          ) : (
            <FaVideoSlash className="text-gray-400" title="No videos" />
          )}
        </div>
      );
    }

    if (columnKey === "notes") {
      const hasNotes = hasInstrumentNotes(item);
      return (
        <div className={optionalCellClass}>
          <FaRegStickyNote
            className={hasNotes ? "text-[goldenrod]" : "text-gray-400"}
            title={hasNotes ? "Notes registered" : "No notes"}
          />
        </div>
      );
    }

    if (columnKey === "guitarPro") {
      const guitarProFiles = getGuitarProFiles(item);
      return (
        <div className={`${optionalCellClass} gap-1`}>
          {guitarProFiles.length ? (
            guitarProFiles.map((file) => (
              <GuitarProIcon
                key={file.id || file.fileName}
                active
                title={file.originalName || "Guitar Pro file"}
              />
            ))
          ) : (
            <GuitarProIcon active={false} title="No Guitar Pro files" />
          )}
        </div>
      );
    }

    if (columnKey === "instruments") {
      return (
        <ul className="dashboard-instruments-cell flex min-w-0 max-w-full flex-row justify-center gap-[clamp(0.05rem,0.35vw,0.45rem)] overflow-hidden px-0">
          {instrumentLabels.map((instrument) => (
            <li key={instrument.key} className="z-10 list-none shrink-0">
              {item.instruments && item.instruments[instrument.key] ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveDashboardVisibleSongs(sortedData);
                    navigate(
                      `/presentation/${encodeURIComponent(
                        item.artist || "",
                      )}/${encodeURIComponent(item.song || "")}/${encodeURIComponent(
                        instrument.key,
                      )}`,
                    );
                  }}
                  className={`${DASHBOARD_INSTRUMENT_ICON_CLASS} ${
                    selectedProgressionInstruments.includes(instrument.key)
                      ? "text-[goldenrod]"
                      : "text-gray-700"
                  } transition-colors hover:text-[goldenrod]`}
                >
                  {renderCompactInstrumentIcon(instrument)}
                </button>
              ) : (
                  <span className={`${DASHBOARD_INSTRUMENT_ICON_CLASS} text-gray-400`}>
                  {renderCompactInstrumentIcon(instrument)}
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    }

    if (columnKey === "addedDate") {
      return (
        <div className={dateCellClass}>
          <FaCalendarPlus className="shrink-0 text-[goldenrod]" />
          <span className="min-w-0 truncate whitespace-nowrap">
            {getAddedDate(item) || "-"}
          </span>
        </div>
      );
    }

    if (columnKey === "lastPlay") {
      return (
        <div className={dateCellClass}>
          <FaHistory className="shrink-0 text-[goldenrod]" />
          <span className="min-w-0 truncate whitespace-nowrap">
            {getLastPlayDate(item)}
          </span>
        </div>
      );
    }

    return null;
  };

  const getSongKey = (item, index) =>
    `${item.artist || "unknown"}-${item.song || "unknown"}-${index}`;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const showHoldTooltip = (songKey) => {
    setTooltipSongKey(songKey);
    if (tooltipTimerRef.current) {
      window.clearTimeout(tooltipTimerRef.current);
    }
    tooltipTimerRef.current = window.setTimeout(() => {
      setTooltipSongKey((current) => (current === songKey ? null : current));
    }, 1800);
  };

  const startLongPress = (item) => {
    window.getSelection?.().removeAllRanges?.();
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      window.getSelection?.().removeAllRanges?.();
      longPressTriggeredRef.current = true;
      setTooltipSongKey(null);
      setSelectedSong(item);
    }, LONG_PRESS_DELAY);
  };

  const cancelLongPress = () => {
    clearLongPressTimer();
  };

  const handleMobileCardClick = (event, item, songKey) => {
    event.preventDefault();
    event.stopPropagation();

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    showHoldTooltip(songKey);
  };

  const handleEditSong = (item) => {
    if (offlineMode && !item.offlineEnabled) {
      window.alert("This song is visible offline, but it was not marked to work offline.");
      return;
    }
    localStorage.setItem("song", item.song || "");
    localStorage.setItem("artist", item.artist || "");
    setSelectedSong(null);
    navigate(
      `/editsong/${encodeURIComponent(item.artist || "")}/${encodeURIComponent(
        item.song || "",
      )}`,
    );
  };

  const handleOpenInstrument = (item, instrumentKey) => {
    if (offlineMode && !item.offlineEnabled) {
      window.alert("This song requires internet.");
      return;
    }
    setSelectedSong(null);
    saveDashboardVisibleSongs(sortedData);
    navigate(
      `/presentation/${encodeURIComponent(
        item.artist || "",
      )}/${encodeURIComponent(item.song || "")}/${encodeURIComponent(
        instrumentKey,
      )}`,
    );
  };

  const availableInstrumentCount = selectedSong
    ? instrumentLabels.filter(
        (instrument) => selectedSong.instruments?.[instrument.key],
      ).length
    : 0;

  const handleToggleOffline = async (item) => {
    try {
      await setSongOfflineEnabled({
        artist: item.artist,
        song: item.song,
        offlineEnabled: !item.offlineEnabled,
      });
      await onSongsChanged();
    } catch (error) {
      window.alert(error?.message || "Unable to update offline mode.");
    }
  };

  return (
    <>
      {sortedData.length < 1 ? (
        isLoading ? (
          <div className="py-10 text-center text-gray-500">Carregando músicas...</div>
        ) : hasAnySongs ? (
          <div className="flex flex-col items-center justify-center rounded-[28px] bg-[#e8e8e8] px-6 py-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-500 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.06),inset_-6px_-6px_12px_rgba(255,255,255,0.95)]">
              <FaMusic size={28} />
            </div>
            <h3 className="mt-5 text-xl font-black text-black">
              Nenhuma música encontrada
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
              Ajuste a busca ou os filtros de setlist para encontrar músicas da
              sua biblioteca.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[28px] bg-[#e8e8e8] px-6 py-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[goldenrod] shadow-[inset_6px_6px_12px_rgba(0,0,0,0.06),inset_-6px_-6px_12px_rgba(255,255,255,0.95)]">
              <FaMusic size={28} />
            </div>
            <h3 className="mt-5 text-xl font-black text-black">
              Sua biblioteca ainda está vazia
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
              Adicione a primeira música para começar a montar sua rotina,
              organizar setlists e abrir os instrumentos.
            </p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[goldenrod]">
              Use o botão + para cadastrar a primeira música
            </p>
          </div>
        )
      ) : isMobile ? (
        <div className="flex flex-col">
          {sortedData.map((item, index) => (
            <div key={index} className="mb-3">
              <div className="relative rounded-[20px] bg-[#e0e0e0] px-3 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
                <button
                  type="button"
                  className="flex w-full justify-between gap-3 text-left"
                  onTouchStart={() => startLongPress(item)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  onMouseDown={() => startLongPress(item)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onClick={(event) =>
                    handleMobileCardClick(event, item, getSongKey(item, index))
                  }
                >
                  <div className="flex w-full gap-3">
                    <div className="flex min-w-[28px] items-center justify-center border-r border-[#d1d5db] pr-2.5 text-[12px] font-semibold text-[#7d8594]">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1 self-center">
                      <div
                        className="truncate text-[1rem] font-black leading-tight text-black"
                        title={item.song || ""}
                      >
                        {item.song || "N/A"}
                      </div>
                      <div
                        className="mt-1 truncate text-[14px] font-semibold text-[#565d69]"
                        title={item.artist || ""}
                      >
                        {item.artist || "N/A"}
                      </div>
                      {visibleColumns.includes("progression") ? (
                        <div className="mt-2 flex items-center">
                          <div className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] px-1.5 py-0.5">
                            <div className="h-3 w-3 rounded-full border-2 border-[#d7d7d7] border-t-[#d9ad26]" />
                            <span className="text-[10px] font-bold text-[#5b5b5b]">
                              {item.progressBar || 0}%
                            </span>
                          </div>
                          {offlineMode ? (
                            <span
                              className={`ml-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                                item.offlineEnabled
                                  ? "bg-[goldenrod] text-black"
                                  : "bg-[#e5e7eb] text-gray-600"
                              }`}
                            >
                              {item.offlineEnabled ? "offline" : "internet"}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {selectedProgressionInstruments.length ? (
                        <div className="mt-2 flex flex-col gap-1">
                          {selectedProgressionInstruments.map(
                            (instrumentKey) => {
                              const progress = getInstrumentProgress(
                                item,
                                instrumentKey,
                              );
                              const instrument = instrumentLabels.find(
                                (label) => label.key === instrumentKey,
                              );

                              return (
                                <div
                                  key={instrumentKey}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-8 text-[10px] font-black text-gray-500">
                                    {instrument?.label || ""}
                                  </span>
                                  <div className="h-4 min-w-0 flex-1 rounded-full bg-gray-200 input-neumorfismo">
                                    <div
                                      className="h-full rounded bg-[#DAA520] text-center text-[9px] font-bold leading-4 text-black"
                                      style={{ width: `${progress}%` }}
                                    >
                                      {progress}%
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      ) : null}
                      <div className="mt-2 flex max-w-full gap-2 overflow-x-auto">
                        {visibleColumns.includes("videos") ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-black text-gray-600">
                            {getVideoLinks(item).length ? (
                              <>
                                <FaVideo className="text-[goldenrod]" />
                                {getVideoLinks(item).length}
                              </>
                            ) : (
                              <>
                                <FaVideoSlash className="text-gray-400" />0
                              </>
                            )}
                          </span>
                        ) : null}
                        {visibleColumns.includes("guitarPro") ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-black text-gray-600">
                            <FaFileCode
                              className={
                                getGuitarProFiles(item).length
                                  ? "text-[goldenrod]"
                                  : "text-gray-400"
                              }
                            />
                            {getGuitarProFiles(item).length || 0} gp
                          </span>
                        ) : null}
                        {visibleColumns.includes("notes") ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-black text-gray-600">
                            <FaRegStickyNote
                              className={
                                hasInstrumentNotes(item)
                                  ? "text-[goldenrod]"
                                  : "text-gray-400"
                              }
                            />
                            {hasInstrumentNotes(item) ? "notes" : "no notes"}
                          </span>
                        ) : null}
                        {visibleColumns.includes("addedDate") ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-black text-gray-600">
                            <FaCalendarPlus className="text-[goldenrod]" />
                            {getAddedDate(item) || "-"}
                          </span>
                        ) : null}
                        {visibleColumns.includes("lastPlay") ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-black text-gray-600">
                            <FaHistory className="text-[goldenrod]" />
                            {getLastPlayDate(item)}
                          </span>
                        ) : null}
                      </div>
                      {visibleColumns.includes("tags") ? (
                        <div className="mt-2 max-w-full overflow-x-auto">
                          <div className="flex w-max max-w-full gap-1">
                            {Array.isArray(item.setlist) &&
                            item.setlist.length ? (
                              item.setlist.map((tag) => (
                                <span
                                  key={tag}
                                  className="shrink-0 rounded-full bg-[goldenrod] px-2 py-1 text-[10px] font-medium text-black"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="shrink-0 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-medium text-gray-500">
                                No tags
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {visibleColumns.includes("instruments") ? (
                      <div className="grid grid-cols-3 gap-3 self-center">
                        {instrumentLabels.map((instrument) => (
                          <span
                            key={instrument.key}
                            className={`flex h-7 w-7 items-center justify-center rounded-[8px] ${
                              item.instruments &&
                              item.instruments[instrument.key]
                                ? selectedProgressionInstruments.includes(
                                    instrument.key,
                                  )
                                  ? "bg-[goldenrod] text-black"
                                  : "bg-[#f5f5f5] text-black"
                                : "bg-[#f5f5f5] text-[#9a9a9a]"
                            }`}
                          >
                            {renderInstrumentIcon(
                              instrument,
                              Boolean(
                                item.instruments &&
                                item.instruments[instrument.key],
                              ),
                            )}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>

                {tooltipSongKey === getSongKey(item, index) ? (
                  <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-lg">
                    Hold to start
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          <DashboardSongActionSheet
            selectedSong={selectedSong}
            instrumentLabels={instrumentLabels}
            availableInstrumentCount={availableInstrumentCount}
            renderInstrumentIcon={renderInstrumentIcon}
            onClose={() => setSelectedSong(null)}
            onOpenInstrument={handleOpenInstrument}
            onEditSong={handleEditSong}
            onToggleOffline={handleToggleOffline}
          />
        </div>
      ) : (
        <div className="dashboard-table-list flex h-full flex-col">
          {sortedData.map((item, index) => (
            <div key={index} className="relative group hover:bg-gray-300">
              <Link
                to={`/editsong/${encodeURIComponent(
                  item.artist || "",
                )}/${encodeURIComponent(item.song || "")}`}
                className="absolute inset-0 z-10"
                onClick={() => {
                  localStorage.setItem("song", item.song || "");
                  localStorage.setItem("artist", item.artist || "");
                }}
              />
              <div
                className="dashboard-table-row grid items-center gap-2 border-b border-gray-400 px-3 py-2 cursor-pointer hover:bg-gray-200 z-0"
                style={{
                    gridTemplateColumns:
                    gridTemplateColumns ||
                    `2.5rem minmax(0, 1.75fr) minmax(0, 1.2fr)${
                      visibleColumns.length
                        ? ` repeat(${visibleColumns.length}, minmax(0, 0.7fr))`
                        : ""
                    }`,
                }}
              >
                <div className="dashboard-row-number text-center">
                  {item.__dashboardIndex + 1}
                </div>
                <div
                  className="dashboard-row-song overflow-hidden text-ellipsis whitespace-nowrap px-2"
                  title={item.song || ""}
                >
                  <span>{item.song || "N/A"}</span>
                  {offlineMode ? (
                    <span
                      className={`ml-2 inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase align-middle ${
                        item.offlineEnabled
                          ? "bg-[goldenrod] text-black"
                          : "bg-[#e5e7eb] text-gray-600"
                      }`}
                    >
                      {item.offlineEnabled ? "offline" : "internet"}
                    </span>
                  ) : null}
                </div>
                <div
                  className="dashboard-row-artist overflow-hidden text-ellipsis whitespace-nowrap px-2"
                  title={item.artist || ""}
                >
                  {item.artist || "N/A"}
                </div>
                {visibleColumns.map((columnKey) => (
                  <div key={columnKey} className="min-w-0 max-w-full overflow-hidden">
                    {renderOptionalCell(item, columnKey)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="border-b border-gray-300"></div>
        </div>
      )}
    </>
  );
}

export default DashList2Items;
