export const clampPresentationFontSizeStep = (value = 0) =>
  Math.max(-10, Math.min(10, Number.isFinite(value) ? value : 0));

export const clampPresentationBlockSpacingStep = (value = 0) =>
  Math.max(-4, Number.isFinite(value) ? value : 0);

export const getPresentationBlockSpacingPx = (value = 0) =>
  Math.max(0, 32 + clampPresentationBlockSpacingStep(Number(value)) * 8);

export const hasUsablePresentationCifra = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value.trim() !== "Loading...";

export const normalizeProgressionMarkOverrides = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((nextValue, [blockKey, override]) => {
    if (!override || typeof override !== "object" || Array.isArray(override)) {
      return nextValue;
    }

    nextValue[blockKey] = {
      ...(override.position !== undefined ? { position: override.position } : {}),
      ...(Number.isFinite(Number(override.order))
        ? { order: Number(override.order) }
        : {}),
      ...(typeof override.title === "string" ? { title: override.title } : {}),
      ...(Number.isFinite(Number(override.width))
        ? { width: Math.max(260, Math.min(1200, Number(override.width))) }
        : {}),
      ...(Number.isFinite(Number(override.height))
        ? { height: Math.max(80, Math.min(1400, Number(override.height))) }
        : {}),
    };

    return nextValue;
  }, {});
};

export const normalizePresentationLayoutVariant = (
  layout = {},
  { fallbackSongCifra = "", defaultTwoColumns = false } = {},
) => ({
  songCifra: hasUsablePresentationCifra(layout?.songCifra)
    ? layout.songCifra
    : fallbackSongCifra,
  fontSizeStep: clampPresentationFontSizeStep(layout?.fontSizeStep),
  blockSpacingStep: clampPresentationBlockSpacingStep(
    Number(layout?.blockSpacingStep),
  ),
  twoColumns:
    typeof layout?.twoColumns === "boolean"
      ? layout.twoColumns
      : defaultTwoColumns,
  showProgressionMarkers:
    typeof layout?.showProgressionMarkers === "boolean"
      ? layout.showProgressionMarkers
      : false,
  progressionBadgeSide: layout?.progressionBadgeSide === "left" ? "left" : "right",
  progressionMarkOverrides: normalizeProgressionMarkOverrides(
    layout?.progressionMarkOverrides,
  ),
});

export const buildInstrumentPresentationLayouts = (instrumentData = {}) => {
  const storedLayouts =
    instrumentData?.presentationLayouts &&
    typeof instrumentData.presentationLayouts === "object" &&
    !Array.isArray(instrumentData.presentationLayouts)
      ? instrumentData.presentationLayouts
      : {};
  const baseSongCifra =
    typeof instrumentData?.songCifra === "string" ? instrumentData.songCifra : "";

  return {
    default: {
      ...normalizePresentationLayoutVariant(storedLayouts.default, {
        fallbackSongCifra: baseSongCifra,
        defaultTwoColumns: false,
      }),
      twoColumns: false,
    },
    expanded: {
      ...normalizePresentationLayoutVariant(storedLayouts.expanded, {
        fallbackSongCifra: baseSongCifra,
        defaultTwoColumns: true,
      }),
      twoColumns: true,
    },
  };
};

export const getActivePresentationLayout = (
  instrumentData = {},
  layoutMode = "default",
) => {
  const layouts = buildInstrumentPresentationLayouts(instrumentData);
  return layoutMode === "expanded" ? layouts.expanded : layouts.default;
};

export const getActivePresentationSongCifra = (
  instrumentData = {},
  layoutMode = "default",
) => getActivePresentationLayout(instrumentData, layoutMode).songCifra;

export const toPresentationLayoutPayload = (layouts = {}) => ({
  default: {
    ...normalizePresentationLayoutVariant(layouts.default, {
      fallbackSongCifra: "",
      defaultTwoColumns: false,
    }),
    twoColumns: false,
  },
  expanded: {
    ...normalizePresentationLayoutVariant(layouts.expanded, {
      fallbackSongCifra: "",
      defaultTwoColumns: true,
    }),
    twoColumns: true,
  },
});

export const buildSavedPresentationLayouts = (
  currentLayouts = {},
  activeLayoutVariant = "default",
  nextSongCifra = "",
) => {
  const variantKey = activeLayoutVariant === "expanded" ? "expanded" : "default";
  const normalizedCurrentLayouts = toPresentationLayoutPayload(currentLayouts);
  const nextVariantLayout = normalizePresentationLayoutVariant(
    {
      ...normalizedCurrentLayouts[variantKey],
      songCifra: nextSongCifra,
    },
    {
      fallbackSongCifra: nextSongCifra,
      defaultTwoColumns: variantKey === "expanded",
    },
  );

  return toPresentationLayoutPayload({
    ...normalizedCurrentLayouts,
    [variantKey]: nextVariantLayout,
  });
};

const getDebugContentHash = (value = "") => {
  const content = String(value || "");
  let hash = 0;

  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 31 + content.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
};

export const getPresentationContentDebugSummary = (value = "") => {
  const content = typeof value === "string" ? value.replace(/\r\n/g, "\n") : "";
  const lines = content === "" ? [] : content.split("\n");
  const firstNonEmptyLine = lines.find((line) => line.trim() !== "") || "";

  return {
    length: content.length,
    lines: lines.length,
    nonEmptyLines: lines.filter((line) => line.trim() !== "").length,
    hash: getDebugContentHash(content),
    firstLine: firstNonEmptyLine.slice(0, 100),
  };
};

const getProgressionOverridesDebugSummary = (overrides = {}) =>
  Object.entries(overrides || {}).map(([blockKey, override]) => ({
    blockKey,
    title: override?.title,
    position: override?.position,
    order: override?.order,
    width: override?.width,
    height: override?.height,
  }));

export const getPresentationLayoutsDebugSummary = (layouts = {}) => {
  const payload = toPresentationLayoutPayload(layouts);

  return {
    default: {
      content: getPresentationContentDebugSummary(payload.default?.songCifra),
      twoColumns: payload.default?.twoColumns,
      showProgressionMarkers: payload.default?.showProgressionMarkers,
      progressionBadgeSide: payload.default?.progressionBadgeSide,
      blockSpacingStep: payload.default?.blockSpacingStep,
      blockSpacingPx: getPresentationBlockSpacingPx(
        payload.default?.blockSpacingStep,
      ),
      overrideCount: Object.keys(
        payload.default?.progressionMarkOverrides || {},
      ).length,
      overrides: getProgressionOverridesDebugSummary(
        payload.default?.progressionMarkOverrides,
      ),
    },
    expanded: {
      content: getPresentationContentDebugSummary(payload.expanded?.songCifra),
      twoColumns: payload.expanded?.twoColumns,
      showProgressionMarkers: payload.expanded?.showProgressionMarkers,
      progressionBadgeSide: payload.expanded?.progressionBadgeSide,
      blockSpacingStep: payload.expanded?.blockSpacingStep,
      blockSpacingPx: getPresentationBlockSpacingPx(
        payload.expanded?.blockSpacingStep,
      ),
      overrideCount: Object.keys(
        payload.expanded?.progressionMarkOverrides || {},
      ).length,
      overrides: getProgressionOverridesDebugSummary(
        payload.expanded?.progressionMarkOverrides,
      ),
    },
  };
};

export const getProgressionColumnsDebugSummary = (columns = []) =>
  columns.map((column, index) => ({
    index,
    groupKey: column.groupKey,
    baseGroupKey: column.baseGroupKey,
    visualColumnOverrideKey: column.visualColumnOverrideKey,
    visualColumnIndex: column.visualColumnIndex,
    visualColumnLabel: column.visualColumnLabel,
    displayPosition: column.displayPosition,
    displayTitle: column.displayTitle,
    blockKeys: column.blockKeys,
    blockCount: Array.isArray(column.blocks) ? column.blocks.length : 0,
    isProgressionEligible: Boolean(column.isProgressionEligible),
    isOverflowContinuation: Boolean(column.isOverflowContinuation),
    width: column.width,
    height: column.height,
  }));

export const hasPersistablePresentationLayouts = (layouts = {}) => {
  const payload = toPresentationLayoutPayload(layouts);

  return ["default", "expanded"].some((variantKey) => {
    const layout = payload[variantKey] || {};
    return (
      hasUsablePresentationCifra(layout.songCifra) ||
      Boolean(layout.showProgressionMarkers) ||
      Object.keys(layout.progressionMarkOverrides || {}).length > 0 ||
      layout.fontSizeStep !== 0 ||
      layout.blockSpacingStep !== 0 ||
      layout.progressionBadgeSide === "left"
    );
  });
};

export const shouldDropBlankLinesForPresentationFlow = ({
  shouldUseHorizontalColumnFlow = false,
} = {}) => {
  void shouldUseHorizontalColumnFlow;
  return false;
};

export const clampLiveCifraZoomPercent = (value = 120) => {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 120;
  return Math.max(0, Math.min(200, Math.round(safeValue / 10) * 10));
};

export const getLiveColumnDisplayState = ({
  columnKey = "",
  activeColumnKey = "",
  columnIndex = 0,
} = {}) => {
  const isActive =
    activeColumnKey && columnKey ? activeColumnKey === columnKey : columnIndex === 0;

  return {
    isActive,
    className: isActive
      ? "presentation-live-column-active"
      : "presentation-live-column-muted",
  };
};

export const getLiveColumnTargetIndex = ({
  currentIndex = 0,
  direction = 0,
  columnCount = 0,
} = {}) => {
  const safeColumnCount = Math.max(0, Number(columnCount) || 0);
  if (!safeColumnCount) return -1;

  const safeCurrentIndex = Math.max(
    0,
    Math.min(safeColumnCount - 1, Number(currentIndex) || 0),
  );
  const safeDirection = Number(direction) > 0 ? 1 : Number(direction) < 0 ? -1 : 0;

  return Math.max(
    0,
    Math.min(safeColumnCount - 1, safeCurrentIndex + safeDirection),
  );
};

export const getPresentationLayoutSettingsSnapshot = (layouts = {}) =>
  JSON.stringify({
    default: {
      fontSizeStep: layouts.default?.fontSizeStep ?? 0,
      blockSpacingStep: layouts.default?.blockSpacingStep ?? 0,
      twoColumns: Boolean(layouts.default?.twoColumns),
      showProgressionMarkers: Boolean(layouts.default?.showProgressionMarkers),
      progressionBadgeSide:
        layouts.default?.progressionBadgeSide === "left" ? "left" : "right",
      progressionMarkOverrides: layouts.default?.progressionMarkOverrides || {},
    },
    expanded: {
      fontSizeStep: layouts.expanded?.fontSizeStep ?? 0,
      blockSpacingStep: layouts.expanded?.blockSpacingStep ?? 0,
      twoColumns: Boolean(layouts.expanded?.twoColumns),
      showProgressionMarkers: Boolean(layouts.expanded?.showProgressionMarkers),
      progressionBadgeSide:
        layouts.expanded?.progressionBadgeSide === "left" ? "left" : "right",
      progressionMarkOverrides: layouts.expanded?.progressionMarkOverrides || {},
    },
  });

export const hidePresentationLayoutMarkers = (layouts = {}) => ({
  default: {
    ...(layouts.default || {}),
    showProgressionMarkers: false,
  },
  expanded: {
    ...(layouts.expanded || {}),
    showProgressionMarkers: false,
  },
});
