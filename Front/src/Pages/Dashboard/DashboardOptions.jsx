/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FiFileText } from "react-icons/fi";
import { VscJson } from "react-icons/vsc";
import { IoClose } from "react-icons/io5";
import {
  FaArrowDown,
  FaArrowUp,
  FaCalendarAlt,
  FaChartLine,
  FaClock,
  FaDatabase,
  FaDownload,
  FaFilter,
  FaGuitar,
  FaHashtag,
  FaHeadphones,
  FaListOl,
  FaMusic,
  FaStickyNote,
  FaVideo,
  FaWifi,
} from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import {
  GiDrumKit,
  GiGuitar,
  GiGuitarBassHead,
  GiMicrophone,
  GiPianoKeys,
} from "react-icons/gi";

import {
  fetchDistinctSetlists,
  setOfflineContentAvailability,
  updateUserSetlists,
} from "../../Tools/Controllers";
import { lockPageScroll } from "../../Tools/scrollLock";
import { useCompactAppLayout } from "../../Tools/responsiveLayout";
import CategoryArtwork from "../../components/CategoryArtwork";
import dashboardOptionIllustrations from "../../assets/dashboard-option-illustrations.jpg";
import PlaylistExport from "./PlaylistExport";
import SetlistExport from "./SetlistExport";
import Insights from "./Insights";
import Tags from "./Tags";

const instrumentLabels = [
  { key: "guitar01", label: "Guitar 1" },
  { key: "guitar02", label: "Guitar 2" },
  { key: "bass", label: "Bass" },
  { key: "keys", label: "Keys" },
  { key: "drums", label: "Drums" },
  { key: "voice", label: "Voice" },
];

const columnOptions = [
  { key: "progression", label: "Progression" },
  { key: "guitar01Progression", label: "Guitar 1 progression" },
  { key: "guitar02Progression", label: "Guitar 2 progression" },
  { key: "bassProgression", label: "Bass progression" },
  { key: "keysProgression", label: "Keys progression" },
  { key: "drumsProgression", label: "Drums progression" },
  { key: "voiceProgression", label: "Voice progression" },
  { key: "guitarPro", label: "Guitar Pro" },
  { key: "notes", label: "Notes" },
  { key: "tags", label: "Setlists" },
  { key: "videos", label: "Videos" },
  { key: "addedDate", label: "Date added" },
  { key: "lastPlay", label: "Last play" },
];

const itemColumnOptions = columnOptions.filter(
  ({ key }) => !key.endsWith("Progression") || key === "progression",
);
const instrumentProgressionColumnOptions = columnOptions.filter(
  ({ key }) => key.endsWith("Progression") && key !== "progression",
);
const columnIcons = {
  progression: FaChartLine,
  guitarPro: FaGuitar,
  tags: FaHashtag,
  videos: FaVideo,
  notes: FaStickyNote,
  addedDate: FaCalendarAlt,
  lastPlay: FaClock,
  guitar01Progression: GiGuitar,
  guitar02Progression: GiGuitar,
  bassProgression: GiGuitarBassHead,
  keysProgression: GiPianoKeys,
  drumsProgression: GiDrumKit,
  voiceProgression: GiMicrophone,
};

const dashboardOptionSections = [
  {
    id: "filters",
    title: "Filters",
    eyebrow: "Shape the repertoire",
    description: "Choose setlists and manage tags",
    longDescription:
      "Bring the songs for the next rehearsal, set or practice session into focus. Every active setlist updates the dashboard, exports and playlists together.",
    insight: "One selection, every connected workflow",
    benefits: ["Setlists", "Instant results", "Saved selection"],
    icon: FaFilter,
    artIndex: 0,
  },
  {
    id: "columns",
    title: "Column Data",
    eyebrow: "Design your view",
    description: "Show, hide, and reorder song data",
    longDescription:
      "Decide which details deserve space in your song list. Keep the view concise for practice or reveal progression, notes, dates and instrument-specific data.",
    insight: "A clearer list makes the next action easier",
    benefits: ["Visibility", "Progress data", "Focused view"],
    icon: FaListOl,
    artIndex: 1,
  },
  {
    id: "offline",
    title: "Offline Content",
    eyebrow: "Ready without a signal",
    description: "Manage downloads and sync status",
    longDescription:
      "Prepare the visible repertoire on this device before you leave home. Review cached songs, storage estimates and pending changes from one dependable place.",
    insight: "Keep rehearsal moving when the connection cannot",
    benefits: ["Device cache", "Sync status", "Offline access"],
    icon: FaDatabase,
    artIndex: 2,
  },
  {
    id: "export",
    title: "Export",
    eyebrow: "Take the set with you",
    description: "Download visible songs as TXT or JSON",
    longDescription:
      "Turn the dashboard you have shaped into a portable setlist. Choose a readable text file for people or structured JSON for backup and integrations.",
    insight: "Only the songs currently in view are exported",
    benefits: ["TXT setlist", "JSON backup", "Current view"],
    icon: FaDownload,
    artIndex: 3,
  },
  {
    id: "playlists",
    title: "Playlists",
    eyebrow: "Listen to the repertoire",
    description: "Create Spotify or YouTube playlists",
    longDescription:
      "Convert the visible songs into a listening queue for preparation and sharing. Name it once, choose a destination and keep the current set together.",
    insight: "Your active filters define the listening queue",
    benefits: ["Spotify", "YouTube", "Visible songs"],
    icon: FaHeadphones,
    artIndex: 4,
  },
];

function OfflineContentCard({
  offlineInfo = {},
  offlineLoading = false,
  onToggle = () => {},
  onSyncOffline = () => {},
  compact = false,
}) {
  const [optimisticContentEnabled, setOptimisticContentEnabled] = useState(
    Boolean(offlineInfo.contentEnabled),
  );

  useEffect(() => {
    setOptimisticContentEnabled(Boolean(offlineInfo.contentEnabled));
  }, [offlineInfo.contentEnabled]);

  const isContentEnabled = offlineLoading
    ? optimisticContentEnabled
    : Boolean(offlineInfo.contentEnabled);
  const downloadedSongsCount =
    offlineLoading && optimisticContentEnabled
      ? Math.max(
          Number(offlineInfo.offlineEnabledCount || 0),
          Number(offlineInfo.totalSongs || 0),
        )
      : Number(offlineInfo.offlineEnabledCount || 0);

  const estimatedOfflineMb = Math.max(downloadedSongsCount * 1.8, 0).toFixed(1);
  const estimatedIndexKb = Math.max(downloadedSongsCount * 42, 0);

  return (
    <section
      className={
        compact
          ? "flex h-full w-full flex-col rounded-[18px] border border-black/5 bg-white/55 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
          : "neuphormism-b flex h-full w-full flex-col p-4"
      }
    >
      <div
        className={`flex items-start justify-between ${compact ? "gap-3" : "gap-4"}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center text-black ${
              compact
                ? "rounded-[11px] bg-[goldenrod]/15"
                : "rounded-[8px] shadow-[0_8px_18px_rgba(218,165,32,0.22)]"
            }`}
          >
            <FaDatabase className="h-4 w-4" />
          </span>
          <div>
            <h1 className={`${compact ? "text-xs" : "text-sm"} font-bold uppercase`}>Offline Content</h1>
            <p className={`${compact ? "mt-0.5 leading-tight" : "mt-1"} text-[11px] font-semibold text-gray-500`}>
              Download songs and allow offline access on this device.
            </p>
          </div>
        </div>
        <label
          className={`relative inline-flex shrink-0 items-center rounded-full shadow-inner ${
            compact ? "h-7 w-12" : "h-6 w-11"
          } ${
            isContentEnabled ? "bg-[goldenrod]" : "bg-gray-400"
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={Boolean(isContentEnabled)}
            disabled={offlineLoading}
            onChange={(event) => {
              setOptimisticContentEnabled(event.target.checked);
              onToggle(event);
            }}
            aria-label="Offline content"
          />
          <span
            className={`rounded-full bg-white shadow transition-transform ${
              compact ? "h-5 w-5" : "h-4 w-4"
            } ${
              isContentEnabled
                ? compact
                  ? "translate-x-6"
                  : "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </label>
      </div>

      <div className={`${compact ? "mt-2 gap-1.5" : "mt-4 gap-2"} grid text-[11px] font-bold text-gray-700`}>
        <div className={`${compact ? "min-h-10 border border-black/5 bg-white/75 shadow-[0_5px_14px_rgba(0,0,0,0.04)]" : "input-neumorfismo"} flex items-center justify-between rounded-xl px-3 py-2`}>
          <span className="flex items-center gap-2">
            <FaMusic className="h-3.5 w-3.5 text-gray-500" />
            Cached songs
          </span>
          <span>{downloadedSongsCount}</span>
        </div>
        <div className={`${compact ? "min-h-10 border border-black/5 bg-white/75 shadow-[0_5px_14px_rgba(0,0,0,0.04)]" : "input-neumorfismo"} flex items-center justify-between rounded-xl px-3 py-2`}>
          <span className="flex items-center gap-2">
            <FaDatabase className="h-3.5 w-3.5 text-gray-500" />
            Mock storage
          </span>
          <span>{estimatedOfflineMb} MB</span>
        </div>
        <div className={`${compact ? "min-h-10 border border-black/5 bg-white/75 shadow-[0_5px_14px_rgba(0,0,0,0.04)]" : "input-neumorfismo"} flex items-center justify-between rounded-xl px-3 py-2`}>
          <span className="flex items-center gap-2">
            <FaWifi className="h-3.5 w-3.5 text-gray-500" />
            Mock index
          </span>
          <span>{estimatedIndexKb} KB</span>
        </div>
      </div>

      <div className={`mt-auto flex flex-wrap gap-2 text-[10px] font-bold uppercase ${compact ? "pt-2" : "pt-4"}`}>
        {isContentEnabled ? (
          <span className="rounded-full bg-white px-2 py-1 text-gray-800 shadow-[0_6px_14px_rgba(0,0,0,0.06)]">
            offline ready
          </span>
        ) : null}
        {offlineInfo.offlineMode ? (
          <span className="rounded-full bg-amber-400 px-2 py-1 text-black">
            offline active
          </span>
        ) : null}
        {offlineInfo.reauthRequired ? (
          <span className="rounded-full bg-[#111111] px-2 py-1 text-white">
            re-login required
          </span>
        ) : null}
        {isContentEnabled ? (
          <span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-gray-700">
            {downloadedSongsCount} downloaded
          </span>
        ) : (
          <span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-gray-700">
            online only
          </span>
        )}
        <span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-gray-700">
          {offlineInfo.pendingChanges || 0} pending sync
        </span>
        {offlineLoading ? (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-900">
            {isContentEnabled ? "syncing songs" : "updating access"}
          </span>
        ) : null}
      </div>

      {offlineInfo.offlineMode ? (
        <button
          type="button"
          className="mt-4 inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black shadow-[0_8px_18px_rgba(217,173,38,0.22)]"
          onClick={onSyncOffline}
        >
          Offline Mode • {offlineInfo.pendingChanges || 0} pending
        </button>
      ) : null}
    </section>
  );
}

function ColumnsData({
  visibleColumns = [],
  onToggleColumn = () => {},
  onMoveColumn = () => {},
  canSelectAllColumns = false,
  maxSelectableColumns = columnOptions.length,
  isColumnLimitedLayout = false,
  isMobileLayout = false,
  showAllProgressionOptions = false,
}) {
  const [mobileColumnTab, setMobileColumnTab] = useState("items");
  const selectedConfigurableColumns = visibleColumns.filter((key) =>
    columnOptions.some((option) => option.key === key),
  );
  const allColumnsSelected = columnOptions.every((option) =>
    visibleColumns.includes(option.key),
  );
  const maxColumnsReached =
    !canSelectAllColumns &&
    selectedConfigurableColumns.length >= maxSelectableColumns;
  const isGeneralProgressionEnabled = visibleColumns.includes("progression");

  useEffect(() => {
    if (isGeneralProgressionEnabled && mobileColumnTab !== "items") {
      setMobileColumnTab("items");
    }
  }, [isGeneralProgressionEnabled, mobileColumnTab]);

  const handleToggleColumn = (key) => {
    if (
      isMobileLayout &&
      key === "progression" &&
      !isGeneralProgressionEnabled
    ) {
      instrumentProgressionColumnOptions.forEach(({ key: instrumentKey }) => {
        if (visibleColumns.includes(instrumentKey)) {
          onToggleColumn(instrumentKey);
        }
      });
    }

    onToggleColumn(key);
  };

  const renderColumnRow = ({ key, label }) => {
    const checked = visibleColumns.includes(key);
    const isInstrumentProgression = key.endsWith("Progression");
    const disabledByGeneralProgression =
      showAllProgressionOptions &&
      isInstrumentProgression &&
      isGeneralProgressionEnabled;
    const disabled =
      disabledByGeneralProgression ||
      (!checked && (allColumnsSelected || maxColumnsReached));
    const visibleIndex = visibleColumns.indexOf(key);
    const Icon = columnIcons[key] || FaListOl;

    return (
      <div
        key={key}
        className={`${isMobileLayout ? "min-h-12 border border-black/5 bg-white/75 shadow-[0_4px_12px_rgba(0,0,0,0.035)]" : "input-neumorfismo"} flex items-center justify-between rounded-xl px-3 py-2 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <label
          className={`flex min-w-0 flex-1 items-center justify-between gap-3 ${
            disabled ? "" : "cursor-pointer"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            <span className="truncate text-[12px] font-bold uppercase text-gray-700">
              {label}
            </span>
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            disabled={disabled}
            onChange={() => handleToggleColumn(key)}
          />
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full shadow-inner ${
              checked ? "bg-[goldenrod]" : "bg-gray-400"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                checked ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </label>

        {checked && !isMobileLayout ? (
          <div className="ml-3 flex shrink-0 items-center gap-1">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[goldenrod] px-2 text-[11px] font-bold text-black">
              {visibleIndex + 1}
            </span>
            <button
              type="button"
              className={`neuphormism-b-btn flex items-center justify-center rounded-lg text-[10px] disabled:opacity-35 ${isMobileLayout ? "h-9 w-9" : "h-7 w-7"}`}
              disabled={visibleIndex <= 0}
              onClick={() => onMoveColumn(key, -1)}
              aria-label={`Move ${label} earlier`}
            >
              <FaArrowUp />
            </button>
            <button
              type="button"
              className={`neuphormism-b-btn flex items-center justify-center rounded-lg text-[10px] disabled:opacity-35 ${isMobileLayout ? "h-9 w-9" : "h-7 w-7"}`}
              disabled={visibleIndex === visibleColumns.length - 1}
              onClick={() => onMoveColumn(key, 1)}
              aria-label={`Move ${label} later`}
            >
              <FaArrowDown />
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section
      className={
        isMobileLayout
          ? "rounded-[18px] border border-black/5 bg-white/55 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
          : "neuphormism-b p-4"
      }
    >
      <div className={`flex items-start gap-3 ${isMobileLayout ? "justify-center text-center" : ""}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center text-black ${isMobileLayout ? "rounded-[11px] bg-[goldenrod]/15" : "rounded-[8px] shadow-[0_8px_18px_rgba(218,165,32,0.22)]"}`}>
          <FaListOl className="h-4 w-4" />
        </span>
        <div>
          <h1 className={`${isMobileLayout ? "text-xs" : "text-sm"} font-bold uppercase`}>Columns Data</h1>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            {isMobileLayout
              ? "Choose which data appears in your song list."
              : "Select columns and reorder their sequence number."}
            {!canSelectAllColumns ? ` Limit: ${maxSelectableColumns}.` : ""}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 grid gap-4 ${
          isColumnLimitedLayout ? "grid-cols-1" : "sm:grid-cols-2"
        }`}
      >
        {isMobileLayout && !showAllProgressionOptions ? (
          <div className="col-span-full grid grid-cols-2 gap-1 rounded-[14px] bg-black/[0.04] p-1">
            <button
              type="button"
              className={`min-h-10 rounded-[11px] px-2 text-[11px] font-bold uppercase transition-colors ${
                mobileColumnTab === "items"
                  ? "bg-[goldenrod] text-black shadow-[0_4px_12px_rgba(218,165,32,0.24)]"
                  : "text-gray-500"
              } ${isGeneralProgressionEnabled ? "col-span-2" : ""}`}
              onClick={() => setMobileColumnTab("items")}
              aria-pressed={mobileColumnTab === "items"}
            >
              Items
            </button>
            {!isGeneralProgressionEnabled ? (
              <button
                type="button"
                className={`min-h-10 rounded-[11px] px-2 text-[11px] font-bold uppercase transition-colors ${
                  mobileColumnTab === "instruments"
                    ? "bg-[goldenrod] text-black shadow-[0_4px_12px_rgba(218,165,32,0.24)]"
                    : "text-gray-500"
                }`}
                onClick={() => setMobileColumnTab("instruments")}
                aria-pressed={mobileColumnTab === "instruments"}
              >
                Instrument Progression
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          className={
            isMobileLayout &&
            !showAllProgressionOptions &&
            mobileColumnTab !== "items"
              ? "hidden"
              : ""
          }
        >
          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
            Items
          </h2>
          <div className="grid gap-2">
            {itemColumnOptions.map(renderColumnRow)}
          </div>
        </div>
        <div
          className={
            showAllProgressionOptions
              ? ""
              : isMobileLayout
              ? !isGeneralProgressionEnabled &&
                mobileColumnTab === "instruments"
                ? "block"
                : "hidden"
              : ""
          }
        >
          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
            Instrument Progression
          </h2>
          {showAllProgressionOptions ? (
            <div
              className={`mb-2 rounded-[12px] border px-3 py-2 text-[10px] font-semibold leading-4 ${
                isGeneralProgressionEnabled
                  ? "border-[goldenrod]/25 bg-[goldenrod]/10 text-gray-600"
                  : "border-emerald-600/15 bg-emerald-50 text-emerald-800"
              }`}
            >
              {isGeneralProgressionEnabled
                ? "Desligue Progression para liberar as progressões por instrumento."
                : "Progression está desligado. Escolha as progressões de instrumento que deseja exibir."}
            </div>
          ) : null}
          <div className="grid gap-2">
            {instrumentProgressionColumnOptions.map(renderColumnRow)}
          </div>
        </div>
      </div>
    </section>
  );
}

function SongOrderToggle({ sortOrder = "asc", onToggle = () => {} }) {
  const isDescending = sortOrder === "desc";

  return (
    <section className="mb-3 flex items-center justify-between gap-4 rounded-[16px] border border-black/5 bg-white/70 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[goldenrod]/15 text-black">
          {isDescending ? (
            <FaArrowDown className="h-4 w-4" />
          ) : (
            <FaArrowUp className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="text-[12px] font-bold uppercase text-gray-900">
            Ordem de exibição
          </h2>
          <p className="mt-0.5 text-[10px] font-semibold text-gray-500">
            {isDescending
              ? "Últimas cifras primeiro"
              : "Primeiras cifras primeiro"}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isDescending}
        aria-label="Inverter ordem de exibição das cifras"
        onClick={onToggle}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full shadow-inner transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod] ${
          isDescending ? "bg-[goldenrod]" : "bg-gray-400"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
            isDescending ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>
    </section>
  );
}

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  selectedSetlists = [],
  setSelectedSetlists = () => {},
  visibleSongs = [],
  visibleColumns = [],
  onToggleColumn = () => {},
  onMoveColumn = () => {},
  canSelectAllColumns = false,
  maxSelectableColumns,
  songNumberSortOrder = "asc",
  onToggleSongNumberOrder = () => {},
  offlineInfo = {},
  onOfflineStateChanged = () => {},
  onNotify = () => {},
  onSyncOffline = () => {},
}) {
  const [setlists, setSetlists] = useState([]);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("home");
  const [tabletPanel, setTabletPanel] = useState("filters");
  const [mobileTransition, setMobileTransition] = useState("forward");
  const mobilePanelScrollRef = useRef(null);
  const tabletPanelScrollRef = useRef(null);
  const isSmallScreen = useCompactAppLayout();
  const isTabletOptionsLayout =
    isSmallScreen &&
    typeof window !== "undefined" &&
    window.innerWidth >= 768;
  const isColumnLimitedLayout =
    typeof window !== "undefined" &&
    !isSmallScreen &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1366;
  const isMiniTabletOptions =
    typeof window !== "undefined" &&
    !isSmallScreen &&
    window.innerWidth >= 768 &&
    window.innerWidth < 820;

  useEffect(() => {
    const handleCloseFilter = () => {
      setOptStatus(false);
    };

    window.addEventListener("dashboard-mobile-close-filter", handleCloseFilter);
    window.addEventListener("close-all-modals", handleCloseFilter);

    return () => {
      window.removeEventListener(
        "dashboard-mobile-close-filter",
        handleCloseFilter,
      );
      window.removeEventListener("close-all-modals", handleCloseFilter);
    };
  }, [setOptStatus]);

  useEffect(() => {
    if (!optStatus) return undefined;
    return lockPageScroll();
  }, [optStatus]);

  useEffect(() => {
    if (!optStatus) {
      setMobilePanel("home");
      setTabletPanel("filters");
    }
  }, [optStatus]);

  // 1) Buscar setlists distintas no backend
  useEffect(() => {
    (async () => {
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    })();
  }, []);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    if (!visibleSongs.length) return;
    const lines = visibleSongs.map((song, index) => {
      const number = song.number ?? index + 1;
      const title = song.song || "Untitled";
      const artist = song.artist || "Unknown artist";
      return `${number}. ${title} - ${artist}`;
    });
    downloadFile(lines.join("\n"), "setlist.txt", "text/plain");
  };

  const handleExportJson = () => {
    if (!visibleSongs.length) return;
    const payload = JSON.stringify(visibleSongs, null, 2);
    downloadFile(payload, "setlist.json", "application/json");
  };

  const dashboardMetrics = useMemo(() => {
    if (!visibleSongs.length) {
      return {
        totalSongs: 0,
        averageProgress: 0,
        readySongs: 0,
        emptyProgressSongs: 0,
        topInstrument: null,
        instrumentCounts: instrumentLabels.map((item) => ({
          ...item,
          count: 0,
        })),
      };
    }

    const totalSongs = visibleSongs.length;
    const totalProgress = visibleSongs.reduce(
      (sum, song) => sum + Number(song.progressBar || 0),
      0,
    );
    const countsMap = instrumentLabels.reduce((acc, label) => {
      acc[label.key] = 0;
      return acc;
    }, {});

    visibleSongs.forEach((song) => {
      instrumentLabels.forEach(({ key }) => {
        if (song.instruments?.[key]) {
          countsMap[key] += 1;
        }
      });
    });

    return {
      totalSongs,
      averageProgress: Math.round(totalProgress / totalSongs),
      readySongs: visibleSongs.filter(
        (song) => Number(song.progressBar || 0) >= 100,
      ).length,
      emptyProgressSongs: visibleSongs.filter(
        (song) => Number(song.progressBar || 0) === 0,
      ).length,
      topInstrument: instrumentLabels
        .map((item) => ({
          ...item,
          count: countsMap[item.key] || 0,
        }))
        .sort((a, b) => b.count - a.count)[0],
      instrumentCounts: instrumentLabels.map((item) => ({
        ...item,
        count: countsMap[item.key] || 0,
      })),
    };
  }, [visibleSongs, instrumentLabels]);

  // Alternar inclusão/remoção da tag
  const toggleTag = (tag) => {
    setSelectedSetlists((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  // Excluir completamente a tag da lista disponível e das selecionadas
  const handleDeleteSetlist = async (tag) => {
    const updatedList = setlists.filter((item) => item !== tag);

    setSetlists(updatedList);
    setSelectedSetlists((prev) => prev.filter((item) => item !== tag));

    try {
      await updateUserSetlists(updatedList);
    } catch (error) {
      console.error("Erro ao atualizar setlists no servidor:", error);
      // Em caso de erro, recarrega lista do backend para evitar estado inconsistente.
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    }
  };

  const handleAddSetlist = async (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    const existingTag = setlists.find(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existingTag) {
      if (!selectedSetlists.includes(existingTag)) {
        setSelectedSetlists((prev) => [...prev, existingTag]);
      }
      return;
    }

    const updatedList = [...setlists, trimmed];
    setSetlists(updatedList);
    setSelectedSetlists((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    );

    try {
      await updateUserSetlists(updatedList);
    } catch (error) {
      console.error("Erro ao adicionar setlist no servidor:", error);
      const distinct = await fetchDistinctSetlists();
      setSetlists(distinct);
    }
  };

  const closeFilter = () => {
    setMobilePanel("home");
    setTabletPanel("filters");
    setOptStatus(false);
  };

  const openMobilePanel = (panel, transition = "forward") => {
    setMobileTransition(transition);
    setMobilePanel(panel);
    requestAnimationFrame(() => {
      mobilePanelScrollRef.current?.scrollTo?.({ top: 0, behavior: "auto" });
    });
  };

  const openTabletPanel = (panel) => {
    setTabletPanel(panel);
    requestAnimationFrame(() => {
      tabletPanelScrollRef.current?.scrollTo?.({ top: 0, behavior: "auto" });
    });
  };

  useEffect(() => {
    if (!optStatus) return undefined;

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMobilePanel("home");
      setTabletPanel("filters");
      setOptStatus(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [optStatus, setOptStatus]);

  const mobilePanels = dashboardOptionSections;

  const activeMobilePanelTitle =
    mobilePanels.find(({ id }) => id === mobilePanel)?.title || "Filter";
  const ActiveMobilePanelIcon =
    mobilePanels.find(({ id }) => id === mobilePanel)?.icon || FaFilter;
  const activeTabletPanel =
    dashboardOptionSections.find(({ id }) => id === tabletPanel) ||
    dashboardOptionSections[0];

  const handleOfflineToggle = async (event) => {
    const enabled = event.target.checked;
    setOfflineLoading(true);

    try {
      const result = await setOfflineContentAvailability(enabled);
      await onOfflineStateChanged();

      if (result.enabled) {
        onNotify({
          title: "Success",
          message: `Offline content downloaded. ${result.songsDownloaded} song(s) are now available without internet.`,
        });
      } else {
        onNotify({
          title: "Info",
          message:
            "Offline content disabled. Cached songs will no longer open offline.",
        });
      }
    } catch (error) {
      onNotify({
        title: "Error",
        message: error?.message || "Unable to update offline availability.",
      });
    } finally {
      setOfflineLoading(false);
    }
  };

  const openFilterClassName = `fixed overflow-hidden ${
    optStatus ? "" : "hidden"
  } ${
    isSmallScreen
      ? "inset-0 z-[12000] bg-black/45"
      : // : `left-1/2 top-[80px] z-[9000] flex max-h-[calc(100vh-6rem)] w-[91%] -translate-x-1/2 flex-col ${
        `left-1/2 top-[80px] z-[9000] flex  w-[91%] -translate-x-1/2 flex-col ${
          isMiniTabletOptions ? "dashboard-options-mini" : ""
        }`
  }`;

  return (
    <div className={openFilterClassName}>
      {isSmallScreen ? (
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Close filter"
          onClick={closeFilter}
        />
      ) : null}

      {isTabletOptionsLayout ? (
        <section
          className="dashboard-options-tablet-sheet absolute inset-x-0 bottom-0 z-10 flex max-h-[calc(100dvh-8.5rem)] min-h-0 flex-col overflow-hidden rounded-t-[18px] bg-[#f2f2f2] px-5 pb-4 pt-4 shadow-[0_-18px_44px_rgba(0,0,0,0.18)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-filter-tablet-title"
          aria-describedby="dashboard-filter-tablet-description"
        >
          <div className="grid h-full min-h-0 w-full grid-cols-[19rem_minmax(0,1fr)] gap-5">
            <aside className="neuphormism-b flex min-h-0 cursor-default flex-col rounded-[24px] p-4">
              <div className="rounded-[18px] bg-white/55 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[goldenrod]/15 text-black">
                    <FaFilter className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                      Dashboard controls
                    </div>
                    <h1
                      id="dashboard-filter-tablet-title"
                      className="mt-1 text-[1.2rem] font-bold leading-tight text-black"
                    >
                      Filter workspace
                    </h1>
                    <p
                      id="dashboard-filter-tablet-description"
                      className="mt-2 text-[0.72rem] font-semibold leading-[1rem] text-gray-500"
                    >
                      Shape the repertoire once, then carry that view into every
                      connected dashboard action.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Dashboard summary">
                  {[
                    [dashboardMetrics.totalSongs, "Songs"],
                    [dashboardMetrics.readySongs, "Ready"],
                    [`${dashboardMetrics.averageProgress}%`, "Average"],
                    [selectedSetlists.length, "Setlists"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-[13px] bg-white/75 px-2 py-3 text-center shadow-[0_5px_14px_rgba(0,0,0,0.04)]"
                    >
                      <div className="text-[1rem] font-bold leading-none text-black">
                        {value}
                      </div>
                      <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-gray-400">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="neuphormism-b-btn dashboard-options-tablet-close flex h-12 w-12 items-center justify-center rounded-[13px] bg-white text-black focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
                  onClick={closeFilter}
                  aria-label="Close filter"
                >
                  <IoClose className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4 px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                Primary navigation
              </div>
              <nav
                className="mt-2 flex min-h-0 flex-1 flex-col gap-2"
                aria-label="Dashboard filter sections"
              >
                {dashboardOptionSections.map((section) => {
                  const active = tabletPanel === section.id;
                  const Icon = section.icon;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`group flex min-h-[5rem] items-center gap-3 rounded-[16px] p-2.5 text-left transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod] ${
                        active
                          ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
                          : "neuphormism-b-btn bg-[#f0f0f0] text-gray-600"
                      }`}
                      aria-label={`Open ${section.title} settings`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => openTabletPanel(section.id)}
                    >
                      <CategoryArtwork
                        src={dashboardOptionIllustrations}
                        index={section.artIndex}
                        label={`${section.title} category illustration`}
                        className="relative h-16 w-16 shrink-0 rounded-[13px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[0.86rem] font-bold leading-tight">
                          <Icon className="shrink-0 text-[0.7rem]" />
                          <span className="truncate">{section.title}</span>
                        </span>
                        <span
                          className={`mt-1 line-clamp-2 block text-[0.7rem] font-bold leading-[0.95rem] ${
                            active ? "text-black/65" : "text-gray-400"
                          }`}
                        >
                          {section.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>

            </aside>

            <section className="flex min-h-0 min-w-0 flex-col gap-5 overflow-hidden">
              <header className="neuphormism-b relative grid min-h-[12rem] shrink-0 cursor-default grid-cols-[minmax(0,1fr)_17rem] overflow-hidden rounded-[24px]">
                <div className="relative z-10 flex min-w-0 flex-col justify-center px-7 py-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                    {activeTabletPanel.eyebrow}
                  </div>
                  <h2 className="mt-2 text-[1.8rem] font-bold leading-tight text-black">
                    {activeTabletPanel.title}
                  </h2>
                  <p className="mt-2 max-w-[56rem] text-[0.92rem] font-semibold leading-[1.4rem] text-gray-600">
                    {activeTabletPanel.longDescription}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeTabletPanel.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
                <CategoryArtwork
                  src={dashboardOptionIllustrations}
                  index={activeTabletPanel.artIndex}
                  label={`${activeTabletPanel.title} workspace illustration`}
                  className="relative h-full w-full"
                />
                <div className="pointer-events-none absolute inset-y-0 right-[12rem] w-48 bg-gradient-to-r from-[#f0f0f0] via-[#f0f0f0]/80 to-transparent" />
                <button
                  type="button"
                  className="neuphormism-b-btn absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-black focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
                  onClick={closeFilter}
                  aria-label="Close filter"
                >
                  <IoClose className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 right-4 z-20 max-w-[14rem] rounded-full bg-black/70 px-3 py-2 text-right text-[8px] font-bold uppercase tracking-[0.1em] text-white">
                  {activeTabletPanel.insight}
                </div>
              </header>

              <div
                ref={tabletPanelScrollRef}
                className="min-h-0 flex-1 overflow-y-auto pr-2 overscroll-contain"
              >
                <div
                  className={
                    tabletPanel === "filters"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={tabletPanel !== "filters"}
                >
                  <SongOrderToggle
                    sortOrder={songNumberSortOrder}
                    onToggle={onToggleSongNumberOrder}
                  />
                  <div className="mb-4 grid grid-cols-3 gap-3" aria-label="Filter workflow summary">
                    {[
                      [selectedSetlists.length || "All", "Setlists in focus"],
                      [visibleSongs.length, "Songs in current view"],
                      ["Live", "Exports stay connected"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-[18px] border border-black/5 bg-white/65 px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.05)]"
                      >
                        <div className="text-[1.25rem] font-bold text-black">{value}</div>
                        <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Tags
                    setlists={setlists}
                    selectedSetlists={selectedSetlists}
                    visibleSongsCount={visibleSongs.length}
                    toggleTag={toggleTag}
                    handleDeleteSetlist={handleDeleteSetlist}
                    handleAddSetlist={handleAddSetlist}
                    RiDeleteBin6Line={RiDeleteBin6Line}
                    isTouchLayout
                  />
                </div>

                <div
                  className={
                    tabletPanel === "columns"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={tabletPanel !== "columns"}
                >
                  <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 rounded-[18px] border border-black/5 bg-white/65 px-5 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
                    <div>
                      <div className="text-[0.95rem] font-bold text-black">
                        Make every row easier to scan.
                      </div>
                      <p className="mt-1 text-[0.78rem] font-semibold leading-[1.15rem] text-gray-500">
                        Compact controls keep the tablet view familiar while your
                        selections remain available when the dashboard grows wider.
                      </p>
                    </div>
                    <div className="rounded-full bg-[goldenrod] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-black">
                      {visibleColumns.length} visible fields
                    </div>
                  </div>
                  <ColumnsData
                    visibleColumns={visibleColumns}
                    onToggleColumn={onToggleColumn}
                    onMoveColumn={onMoveColumn}
                    canSelectAllColumns={canSelectAllColumns}
                    maxSelectableColumns={maxSelectableColumns}
                    isColumnLimitedLayout={isColumnLimitedLayout}
                    isMobileLayout
                    showAllProgressionOptions
                  />
                </div>

                <div
                  className={
                    tabletPanel === "offline"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={tabletPanel !== "offline"}
                >
                  <div className="grid grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.28fr)] items-stretch gap-4">
                    <section className="rounded-[18px] border border-black/5 bg-white/65 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
                      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[goldenrod]">
                        Before rehearsal
                      </div>
                      <h3 className="mt-2 text-[1.15rem] font-bold text-black">
                        Prepare once, practice anywhere.
                      </h3>
                      <p className="mt-2 text-[0.78rem] font-semibold leading-[1.2rem] text-gray-500">
                        Enable downloads while connected, verify the song count and
                        return here whenever pending changes need attention.
                      </p>
                      <div className="mt-5 grid gap-2 text-[0.72rem] font-bold text-gray-600">
                        {["Download the current library", "Review device storage", "Sync changes when online"].map((step, index) => (
                          <div key={step} className="flex items-center gap-3 rounded-[13px] bg-white/75 px-3 py-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[goldenrod] text-[9px] font-bold text-black">
                              {index + 1}
                            </span>
                            {step}
                          </div>
                        ))}
                      </div>
                    </section>
                    <OfflineContentCard
                      offlineInfo={offlineInfo}
                      offlineLoading={offlineLoading}
                      onToggle={handleOfflineToggle}
                      onSyncOffline={onSyncOffline}
                      compact
                    />
                  </div>
                </div>

                <div
                  className={
                    tabletPanel === "export"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={tabletPanel !== "export"}
                >
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    {[
                      ["TXT", "A clean, readable setlist for rehearsal notes, messages and printing."],
                      ["JSON", "A structured copy of visible song data for backup or connected workflows."],
                    ].map(([format, detail]) => (
                      <div key={format} className="rounded-[18px] border border-black/5 bg-white/65 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
                        <div className="text-[1.15rem] font-bold text-black">{format}</div>
                        <p className="mt-2 text-[0.76rem] font-semibold leading-[1.15rem] text-gray-500">
                          {detail}
                        </p>
                        <div className="mt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-[goldenrod]">
                          {visibleSongs.length} visible songs ready
                        </div>
                      </div>
                    ))}
                  </div>
                  <SetlistExport
                    handleExportText={handleExportText}
                    visibleSongs={visibleSongs}
                    FiFileText={FiFileText}
                    handleExportJson={handleExportJson}
                    VscJson={VscJson}
                    isMobileLayout
                  />
                </div>

                <div
                  className={
                    tabletPanel === "playlists"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={tabletPanel !== "playlists"}
                >
                  <div className="mb-4 rounded-[18px] border border-black/5 bg-white/65 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5">
                      <div>
                        <div className="text-[1rem] font-bold text-black">
                          From repertoire to listening queue.
                        </div>
                        <p className="mt-1 text-[0.78rem] font-semibold leading-[1.15rem] text-gray-500">
                          Review the current song count, choose a provider and give the
                          playlist a useful name before authorizing the destination.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {["1. Choose", "2. Name", "3. Create"].map((step) => (
                          <span key={step} className="rounded-full bg-black/[0.045] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-gray-500">
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <PlaylistExport visibleSongs={visibleSongs} isMobileLayout />
                </div>
              </div>
            </section>
          </div>
        </section>
      ) : (
      <div
        className={
          isSmallScreen
            ? "absolute inset-x-0 bottom-0 flex max-h-[84vh] flex-col overflow-hidden rounded-t-[18px] bg-[#f2f2f2] px-5 pb-3 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)] sm:px-7"
            : "flex  min-h-0 flex-col"
        }
      >
        <div
          className={`${isSmallScreen ? "grid grid-cols-[44px_minmax(0,1fr)_44px]" : "flex flex-row justify-between"} ${
            isSmallScreen
              ? "mb-3 min-h-11 items-center"
              : " rounded-t-lg px-5 py-2 text-center  text-white font-bold  bg-[#000000]/60 cursor-pointer"
          }`}
        >
          <div className={`flex min-w-0 items-center gap-2 ${isSmallScreen ? "contents" : ""}`}>
            {isSmallScreen && mobilePanel !== "home" ? (
              <button
                type="button"
                className="neuphormism-b-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
                onClick={() => openMobilePanel("home", "back")}
                aria-label="Back to filter menu"
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
            ) : isSmallScreen ? (
              <span aria-hidden="true" />
            ) : null}

            <h1
              className={`font-bold ${
                isSmallScreen
                  ? "flex min-w-0 items-center justify-center gap-2 px-1 text-center text-[1.35rem] leading-none"
                  : "text-md"
              }`}
            >
              {isSmallScreen ? (
                <>
                  <ActiveMobilePanelIcon className="h-[0.9em] w-[0.9em] shrink-0" />
                  <span>{activeMobilePanelTitle.toUpperCase()}</span>
                </>
              ) : (
                "OPTIONS"
              )}
            </h1>
            {/* {isSmallScreen ? (
              <p className="mt-2 text-sm text-gray-600">
                Choose filters, inspect metrics, and export the visible songs.
              </p>
            ) : null} */}
          </div>
          <button
            type="button"
            className={
              isSmallScreen
                ? "neuphormism-b-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
                : "px-5"
            }
            onClick={closeFilter}
            aria-label="Close filter"
          >
            <IoClose className="h-6 w-6 cursor-pointer" />
          </button>
        </div>

        <div
          ref={mobilePanelScrollRef}
          className={
            isSmallScreen
              ? `min-h-0 flex-1 px-1 pb-2 ${mobilePanel === "home" ? "overflow-hidden" : "overflow-y-auto overscroll-contain"}`
              : "min-h-0 flex-1 overflow-y-auto rounded-b-lg bg-[#e6e6e6] px-4 py-3"
          }
        >
          <div
            className={
              isSmallScreen ? "flex flex-col gap-3" : "flex flex-col gap-3"
            }
          >
            {isSmallScreen ? (
              <>
                <div
                  key={mobilePanel}
                  className={`dashboard-mobile-panel-enter-${mobileTransition} motion-reduce:animate-none`}
                >
                  {mobilePanel === "home" ? (
                    <div className="flex flex-col gap-3">
                      <div
                        className="grid grid-cols-3 gap-2"
                        aria-label="Song summary"
                      >
                        <div className="neuphormism-b rounded-lg p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-gray-500">
                            Songs
                          </p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            {dashboardMetrics.totalSongs}
                          </p>
                        </div>
                        <div className="neuphormism-b rounded-lg p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-gray-500">
                            Ready
                          </p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            {dashboardMetrics.readySongs}
                          </p>
                        </div>
                        <div className="neuphormism-b rounded-lg p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-gray-500">
                            Avg
                          </p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            {dashboardMetrics.averageProgress}%
                          </p>
                        </div>
                      </div>

                      <SongOrderToggle
                        sortOrder={songNumberSortOrder}
                        onToggle={onToggleSongNumberOrder}
                      />

                      <nav className="grid gap-2" aria-label="Filter options">
                        {mobilePanels.map(
                          ({ id, title, description, icon: Icon }) => (
                            <button
                              key={id}
                              type="button"
                              className="neuphormism-b-btn flex min-h-14 w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-transform active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod]"
                              onClick={() => openMobilePanel(id)}
                              aria-label={`Open ${title}`}
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[goldenrod]/15 text-black">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-bold uppercase tracking-[0.04em] text-gray-900">
                                  {title}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] font-semibold text-gray-500">
                                  {description}
                                </span>
                              </span>
                              <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                            </button>
                          ),
                        )}
                      </nav>
                    </div>
                  ) : null}
                </div>

                <div
                  className={
                    mobilePanel === "filters"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={mobilePanel !== "filters"}
                >
                  <Tags
                    setlists={setlists}
                    selectedSetlists={selectedSetlists}
                    visibleSongsCount={visibleSongs.length}
                    toggleTag={toggleTag}
                    handleDeleteSetlist={handleDeleteSetlist}
                    handleAddSetlist={handleAddSetlist}
                    RiDeleteBin6Line={RiDeleteBin6Line}
                    isTouchLayout
                    isPhoneLayout
                  />
                </div>

                <div
                  className={
                    mobilePanel === "columns"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={mobilePanel !== "columns"}
                >
                  <ColumnsData
                    visibleColumns={visibleColumns}
                    onToggleColumn={onToggleColumn}
                    onMoveColumn={onMoveColumn}
                    canSelectAllColumns={canSelectAllColumns}
                    maxSelectableColumns={maxSelectableColumns}
                    isColumnLimitedLayout={isColumnLimitedLayout}
                    isMobileLayout
                  />
                </div>

                <div
                  className={
                    mobilePanel === "offline"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={mobilePanel !== "offline"}
                >
                  <OfflineContentCard
                    offlineInfo={offlineInfo}
                    offlineLoading={offlineLoading}
                    onToggle={handleOfflineToggle}
                    onSyncOffline={onSyncOffline}
                    compact
                  />
                </div>

                <div
                  className={
                    mobilePanel === "export"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={mobilePanel !== "export"}
                >
                  <SetlistExport
                    handleExportText={handleExportText}
                    visibleSongs={visibleSongs}
                    FiFileText={FiFileText}
                    handleExportJson={handleExportJson}
                    VscJson={VscJson}
                    isMobileLayout
                  />
                </div>
                <div
                  className={
                    mobilePanel === "playlists"
                      ? "dashboard-mobile-panel-enter-forward block"
                      : "hidden"
                  }
                  aria-hidden={mobilePanel !== "playlists"}
                >
                  <PlaylistExport visibleSongs={visibleSongs} isMobileLayout />
                </div>
              </>
            ) : (
              <>
                <div className="grid w-full grid-cols-[minmax(0,0.8fr)_minmax(0,0.2fr)] items-stretch gap-3">
                  <div className="h-full [&>section]:h-full">
                    <Insights dashboardMetrics={dashboardMetrics} />
                  </div>
                  <div className="h-full [&>section]:h-full">
                    <OfflineContentCard
                      offlineInfo={offlineInfo}
                      offlineLoading={offlineLoading}
                      onToggle={handleOfflineToggle}
                      onSyncOffline={onSyncOffline}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] items-stretch gap-3">
                  <div className="h-full [&>section]:h-full">
                    <Tags
                      setlists={setlists}
                      selectedSetlists={selectedSetlists}
                      visibleSongsCount={visibleSongs.length}
                      toggleTag={toggleTag}
                      handleDeleteSetlist={handleDeleteSetlist}
                      handleAddSetlist={handleAddSetlist}
                      RiDeleteBin6Line={RiDeleteBin6Line}
                    />
                  </div>

                  <div className="h-full [&>section]:h-full">
                    <ColumnsData
                      visibleColumns={visibleColumns}
                      onToggleColumn={onToggleColumn}
                      onMoveColumn={onMoveColumn}
                      canSelectAllColumns={canSelectAllColumns}
                      maxSelectableColumns={maxSelectableColumns}
                      isColumnLimitedLayout={isColumnLimitedLayout}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] items-stretch gap-3">
                  <div className="h-full [&>section]:h-full">
                    <SetlistExport
                      handleExportText={handleExportText}
                      visibleSongs={visibleSongs}
                      FiFileText={FiFileText}
                      handleExportJson={handleExportJson}
                      VscJson={VscJson}
                    />
                  </div>

                  <div className="h-full [&>section]:h-full">
                    <PlaylistExport visibleSongs={visibleSongs} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {isSmallScreen ? null : (
          <div
            className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer"
            onClick={closeFilter}
          >
            {optStatus ? "HIDE OPTIONS" : "SHOW OPTIONS"}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
