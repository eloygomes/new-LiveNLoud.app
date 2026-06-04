import {
  ESTIMATED_PRESENTATION_BLOCK_VERTICAL_CHROME_PX,
  ESTIMATED_PRESENTATION_LINE_HEIGHT_PX,
  MAX_EXPANDED_COLUMN_LINE_UNITS,
  PRESENTATION_DEBUG_PREFIX,
  PRESENTATION_INSTRUMENT_MAP,
  PRESENTATION_INSTRUMENTS,
} from "./presentationConstants";
import { buildInstrumentPresentationLayouts } from "../presentationLayoutHelpers";

export const shouldLogPresentationDebug = () => {
  if (typeof window === "undefined") return false;

  let storageValue = "";
  try {
    storageValue = window.localStorage?.getItem("presentation-debug") || "";
  } catch {
    storageValue = "";
  }

  if (storageValue === "off") return false;
  if (storageValue === "on") return true;

  return Boolean(import.meta.env.DEV || window.location?.hostname === "localhost");
};

export const logPresentationDebug = (eventName, payload = {}) => {
  if (!shouldLogPresentationDebug()) return;

  try {
    const label = `${PRESENTATION_DEBUG_PREFIX} ${eventName}`;
    if (console.groupCollapsed) {
      console.groupCollapsed(label);
      console.log(payload);
      console.groupEnd();
      return;
    }
    console.log(label, payload);
  } catch (error) {
    console.log(`${PRESENTATION_DEBUG_PREFIX} log-error`, error);
  }
};

export const getVisibleBlocksDebugSummary = (blocks = []) =>
  blocks.map((block, index) => ({
    index,
    blockKey: block.blockKey,
    sourceIndex: block.index,
    progressionIndex: block.progressionIndex,
    progressionTitle: block.progressionTitle,
    isProgressionEligible: Boolean(block.isProgressionEligible),
    classes: block.classes,
  }));

export const toolBoxBtnStatusChange = (status, setStatus) => {
  setStatus(!status);
};

export const safeDecodeURIComponent = (value = "") => {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
};

export const normalizePresentationInstrumentValue = (value = "") => {
  const normalized = PRESENTATION_INSTRUMENT_MAP[value] || value || "keys";
  return PRESENTATION_INSTRUMENTS.some(
    (instrument) => instrument.key === normalized,
  )
    ? normalized
    : "keys";
};

export const getProgressionMarkerTitle = (block = "", progressionIndex = null) => {
  const sectionMatch = block.match(/\[([^\]]+)\]/);
  if (sectionMatch?.[1]) return sectionMatch[1];
  if (progressionIndex == null) return "";
  return `Part ${progressionIndex}`;
};

export const getColumnLabelFromIndex = (value = 1) => {
  let index = Math.max(1, Number.parseInt(value, 10) || 1);
  let label = "";

  while (index > 0) {
    index -= 1;
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26);
  }

  return label;
};

export const getProgressionVisualColumnOverrideKey = (
  groupKey = "",
  chunkIndex = 0,
) => `visual-column::${groupKey || "progression"}::${chunkIndex + 1}`;

export const getMaxLineUnitsForProgressionHeight = (height) => {
  const numericHeight = Number(height);
  if (!Number.isFinite(numericHeight) || numericHeight <= 0) {
    return MAX_EXPANDED_COLUMN_LINE_UNITS;
  }

  return Math.max(
    1,
    Math.floor(
      (numericHeight - ESTIMATED_PRESENTATION_BLOCK_VERTICAL_CHROME_PX) /
        ESTIMATED_PRESENTATION_LINE_HEIGHT_PX,
    ),
  );
};

export const estimateHtmlLineUnits = (html = "") => {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/pre>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ");

  return Math.max(
    1,
    text
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0).length,
  );
};

export const splitHtmlBlockByPreElements = (html = "") => {
  const preMatches = Array.from(html.matchAll(/<pre\b[\s\S]*?<\/pre>/gi)).map(
    (match) => match[0],
  );

  if (preMatches.length <= 1) {
    return [html];
  }

  const wrapperMatch = html.match(/^<div\b([^>]*)>/i);
  const wrapperAttributes = wrapperMatch?.[1] || "";

  return preMatches.map(
    (preHtml, index) =>
      `<div${wrapperAttributes} data-column-fragment="${index + 1}">\n${preHtml}\n</div>`,
  );
};

export const splitBlocksIntoColumnChunks = (
  blocks = [],
  maxLineUnits = MAX_EXPANDED_COLUMN_LINE_UNITS,
) => {
  const chunks = [];
  let currentChunk = [];
  let currentLineUnits = 0;
  const getMaxLineUnits =
    typeof maxLineUnits === "function" ? maxLineUnits : () => maxLineUnits;

  blocks.forEach((entry) => {
    if (entry.isColumnBreak) {
      if (currentChunk.length) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentLineUnits = 0;
      }
      return;
    }

    splitHtmlBlockByPreElements(entry.block).forEach((fragmentHtml, index) => {
      const fragment = {
        ...entry,
        block:
          index === 0 && fragmentHtml === entry.block
            ? entry.block
            : fragmentHtml,
        blockKey:
          index === 0
            ? entry.blockKey
            : `${entry.blockKey}-fragment-${index + 1}`,
      };
      const lineUnits = estimateHtmlLineUnits(fragment.block);
      const currentMaxLineUnits = getMaxLineUnits(chunks.length);

      if (
        currentChunk.length &&
        currentLineUnits + lineUnits > currentMaxLineUnits
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentLineUnits = 0;
      }

      currentChunk.push(fragment);
      currentLineUnits += lineUnits;
    });
  });

  if (currentChunk.length) {
    chunks.push(currentChunk);
  }

  return chunks.length ? chunks : [blocks];
};

export const buildProgressionBlocks = (
  htmlBlocks,
  { hideTabs = false, dropBlankLines = false } = {},
) => {
  let progressionCounter = 0;

  return htmlBlocks.reduce((blocksToRender, block, index) => {
    const classMatch = block.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1].split(" ") : [];
    const isBlankLineBlock =
      classes.includes("presentation-blank-line") ||
      block.includes('class="presentation-blank-line"');
    const isColumnBreakBlock =
      classes.includes("presentation-column-break") ||
      block.includes('data-column-break="true"');

    const shouldHideTabBlock =
      hideTabs &&
      (classes.includes("presentation-combined-tab-chords") ||
        classes.includes("presentation-tab") ||
        classes.includes("presentation-tab-section"));

    if (shouldHideTabBlock) {
      return blocksToRender;
    }

    if (isColumnBreakBlock) {
      blocksToRender.push({
        block,
        classes,
        index,
        blockKey: `column-break-${index}`,
        isColumnBreak: true,
        isProgressionEligible: false,
        progressionIndex: null,
        progressionTitle: "",
      });
      return blocksToRender;
    }

    if (dropBlankLines && isBlankLineBlock) {
      return blocksToRender;
    }

    const isProgressionEligible = !isBlankLineBlock;
    const progressionIndex = isProgressionEligible ? ++progressionCounter : null;

    blocksToRender.push({
      block,
      classes,
      index,
      blockKey: `block-${index}`,
      isProgressionEligible,
      progressionIndex,
      progressionTitle: getProgressionMarkerTitle(block, progressionIndex),
    });

    return blocksToRender;
  }, []);
};

export const getPresentationLayoutsStorageKey = ({
  artist = "",
  song = "",
  instrument = "",
} = {}) =>
  [
    "presentation-layouts",
    String(artist || "").trim().toLowerCase(),
    String(song || "").trim().toLowerCase(),
    String(instrument || "").trim().toLowerCase(),
  ].join("::");

export const getPresentationLayoutModeStorageKey = ({
  artist = "",
  song = "",
  instrument = "",
} = {}) =>
  [
    "presentation-layout-mode",
    String(artist || "").trim().toLowerCase(),
    String(song || "").trim().toLowerCase(),
    String(instrument || "").trim().toLowerCase(),
  ].join("::");

export const instrumentHasPresentationContent = (instrumentData) => {
  if (!instrumentData) return false;

  const presentationLayouts = buildInstrumentPresentationLayouts(instrumentData);
  if (
    [presentationLayouts.default, presentationLayouts.expanded].some(
      (layout) =>
        typeof layout.songCifra === "string" &&
        layout.songCifra.trim() !== "" &&
        layout.songCifra !== "Loading...",
    )
  ) {
    return true;
  }

  return ["songCifra", "songChords", "songTabs", "songLyrics"].some((field) => {
    const value = instrumentData[field];
    return (
      typeof value === "string" &&
      value.trim() !== "" &&
      value !== "Loading..."
    );
  });
};

export const isInstrumentRegistered = (songData, instrumentKey) =>
  Boolean(
    songData?.instruments?.[instrumentKey] ||
      songData?.[instrumentKey]?.active === true ||
      songData?.[instrumentKey]?.active === "true" ||
      instrumentHasPresentationContent(songData?.[instrumentKey]),
  );

export const getMobileTitleSizeClass = (value = "", type = "song") => {
  const length = String(value || "").trim().length;

  if (type === "song") {
    if (length > 30) return "text-[1.8rem] leading-[1.95rem]";
    if (length > 22) return "text-[2rem] leading-[2.1rem]";
    if (length > 14) return "text-[2.2rem] leading-[2.3rem]";
    return "text-[2.4rem] leading-[2.45rem]";
  }

  if (length > 28) return "text-[1.4rem] leading-[1.55rem]";
  if (length > 20) return "text-[1.55rem] leading-[1.7rem]";
  if (length > 14) return "text-[1.7rem] leading-[1.85rem]";
  return "text-[1.85rem] leading-[1.95rem]";
};
