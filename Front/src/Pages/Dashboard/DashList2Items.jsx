/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo, useRef } from "react";
import { requestData } from "../../Tools/Controllers";
import { Link, useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import {
  GiDrumKit,
  GiGuitar,
  GiGuitarBassHead,
  GiMicrophone,
  GiPianoKeys,
} from "react-icons/gi";
import { FaCalendarPlus, FaHistory, FaVideo, FaVideoSlash } from "react-icons/fa";
import { formatDisplayDate, parseDateValue } from "../../Tools/dateFormat";

const INSTRUMENT_ICON_SIZE = 26;
const INSTRUMENT_ICON_BOX_CLASS = "flex h-5 w-5 items-center justify-center";
const LONG_PRESS_DELAY = 450;

function DashList2Items({
  sortColumn,
  sortOrder,
  songs: songsProp,
  visibleColumns = ["progression", "instruments"],
  gridTemplateColumns,
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
    if (window.innerWidth <= 845) {
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

  const sortedData = useMemo(() => {
    if (!data) return [];
    const dataCopy = [...data];

    if (sortColumn) {
      dataCopy.sort((a, b) => {
        let valueA, valueB;

        if (sortColumn === "progressBar") {
          valueA = a.progressBar || 0;
          valueB = b.progressBar || 0;
        } else {
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

  const getVideoLinks = (item) =>
    Array.isArray(item.embedVideos)
      ? item.embedVideos
      : Array.isArray(item.embedLink)
        ? item.embedLink
        : [];

  const getAddedDate = (item) =>
    formatDisplayDate(item.createdAt || item.createIn || item.createdIn || item.addedIn || item.updateIn);

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

  const optionalCellClass = "flex min-w-0 items-center justify-center px-2";

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

    if (columnKey === "tags") {
      const tags = Array.isArray(item.setlist) ? item.setlist : [];
      return (
        <div className="min-w-0 overflow-x-auto px-2">
          <div className="flex w-max max-w-full gap-1">
            {tags.length ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="shrink-0 rounded-full bg-[goldenrod] px-2 py-1 text-[10px] font-black text-black"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-semibold text-gray-400">No tags</span>
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

    if (columnKey === "instruments") {
      return (
        <ul className="flex min-w-0 flex-row justify-center gap-4 px-2">
          {instrumentLabels.map((instrument) => (
            <li key={instrument.key} className="list-none z-10">
              {item.instruments && item.instruments[instrument.key] ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/presentation/${encodeURIComponent(
                        item.artist || "",
                      )}/${encodeURIComponent(item.song || "")}/${encodeURIComponent(
                        instrument.key,
                      )}`,
                    );
                  }}
                  className={`${INSTRUMENT_ICON_BOX_CLASS} text-gray-700 transition-colors hover:text-[goldenrod]`}
                >
                  {renderInstrumentIcon(instrument, true)}
                </button>
              ) : (
                <span className={`${INSTRUMENT_ICON_BOX_CLASS} text-gray-400`}>
                  {renderInstrumentIcon(instrument, false)}
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    }

    if (columnKey === "addedDate") {
      return (
        <div className={`${optionalCellClass} gap-2 text-[12px] font-semibold text-gray-600`}>
          <FaCalendarPlus className="text-[goldenrod]" />
          <span>{getAddedDate(item) || "-"}</span>
        </div>
      );
    }

    if (columnKey === "lastPlay") {
      return (
        <div className={`${optionalCellClass} gap-2 text-[12px] font-semibold text-gray-600`}>
          <FaHistory className="text-[goldenrod]" />
          <span>{getLastPlayDate(item)}</span>
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
    setSelectedSong(null);
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

  return (
    <>
      {sortedData.length < 1 ? (
        <div className="text-center py-10">Carregando músicas...</div>
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
                                <FaVideoSlash className="text-gray-400" />
                                0
                              </>
                            )}
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
                            {Array.isArray(item.setlist) && item.setlist.length ? (
                              item.setlist.map((tag) => (
                                <span
                                  key={tag}
                                  className="shrink-0 rounded-full bg-[goldenrod] px-2 py-1 text-[10px] font-black text-black"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="shrink-0 rounded-full bg-[#f5f5f5] px-2 py-1 text-[10px] font-black text-gray-500">
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
                            item.instruments && item.instruments[instrument.key]
                              ? "bg-[goldenrod] text-black"
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

          {selectedSong ? (
            <div className="fixed inset-0 z-[12200] flex items-end bg-black/45 px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-8">
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Close song actions"
                onClick={() => setSelectedSong(null)}
              />

              <div
                className="relative z-[12201] w-full select-none rounded-[28px] bg-[#f0f0f0] p-4 shadow-[0_-18px_40px_rgba(0,0,0,0.18)]"
                style={{
                  WebkitTouchCallout: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
                onContextMenu={(event) => event.preventDefault()}
                onTouchStart={() => window.getSelection?.().removeAllRanges?.()}
                onMouseDown={() => window.getSelection?.().removeAllRanges?.()}
              >
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#c8c8c8]" />

                <div className="rounded-[22px] bg-[#e8e8e8] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[goldenrod]">
                    # sustenido
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[1.7rem] font-black uppercase leading-none text-black">
                        {selectedSong.song || "N/A"}
                      </div>
                      <div className="mt-2 truncate text-[14px] font-bold text-[#626878]">
                        {selectedSong.artist || "N/A"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-black/5 p-2 text-black"
                      onClick={() => setSelectedSong(null)}
                      aria-label="Close song sheet"
                    >
                      <IoClose className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-[20px] bg-[#f7f7f7] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[goldenrod]">
                        Progression
                      </div>
                      <div className="mt-1 text-[15px] font-black text-black">
                        Practice progress
                      </div>
                    </div>
                    <div className="rounded-full bg-black px-3 py-1.5 text-[12px] font-black text-white">
                      {selectedSong.progressBar || 0}%
                    </div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e2e2e2]">
                    <div
                      className="h-full rounded-full bg-[goldenrod]"
                      style={{ width: `${selectedSong.progressBar || 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 px-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[goldenrod]">
                    Open presentation
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-[#626878]">
                    Choose an available instrument
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {instrumentLabels.map((instrument) => {
                    const isEnabled = Boolean(
                      selectedSong.instruments?.[instrument.key],
                    );

                    return (
                      <button
                        key={instrument.key}
                        type="button"
                        disabled={!isEnabled}
                        onClick={() =>
                          isEnabled &&
                          handleOpenInstrument(selectedSong, instrument.key)
                        }
                        className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-left ${
                          isEnabled
                            ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(217,173,38,0.28)]"
                            : "bg-[#f5f5f5] text-[#a4a4a4]"
                        }`}
                      >
                        {renderInstrumentIcon(instrument, isEnabled)}
                        <div>
                          <div className="text-[12px] font-black uppercase leading-none">
                            {instrument.modalLabel}
                          </div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                            {isEnabled ? "Available" : "Unavailable"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-3">
                  <div className="flex flex-1 items-center justify-center rounded-[16px] border border-[goldenrod] bg-[#f5f5f5] px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-[#a27b13]">
                    {availableInstrumentCount} instruments
                  </div>
                  <button
                    type="button"
                    className="flex-1 rounded-[16px] bg-[goldenrod] px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-black shadow-[0_8px_18px_rgba(217,173,38,0.28)]"
                    onClick={() => handleEditSong(selectedSong)}
                  >
                    Edit song
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col h-full mb-10">
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
                className="grid items-center gap-3 border-b border-gray-400 p-3 cursor-pointer hover:bg-gray-200 z-0"
                style={{
                  gridTemplateColumns:
                    gridTemplateColumns ||
                    `0.35fr 1.35fr 1.25fr${
                      visibleColumns.length
                        ? ` repeat(${visibleColumns.length}, minmax(7rem, 1fr))`
                        : ""
                    }`,
                }}
              >
                <div className="text-center">{index + 1}</div>
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap px-2"
                  title={item.song || ""}
                >
                  {item.song || "N/A"}
                </div>
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap px-2"
                  title={item.artist || ""}
                >
                  {item.artist || "N/A"}
                </div>
                {visibleColumns.map((columnKey) => (
                  <div key={columnKey} className="min-w-0">
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
