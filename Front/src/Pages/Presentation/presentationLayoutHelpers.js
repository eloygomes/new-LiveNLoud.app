const clampPresentationFontSizeStep = (value = 0) =>
  Math.max(-3, Math.min(4, Number.isFinite(value) ? value : 0));

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

export const getPresentationLayoutSettingsSnapshot = (layouts = {}) =>
  JSON.stringify({
    default: {
      fontSizeStep: layouts.default?.fontSizeStep ?? 0,
      twoColumns: Boolean(layouts.default?.twoColumns),
      showProgressionMarkers: Boolean(layouts.default?.showProgressionMarkers),
      progressionBadgeSide:
        layouts.default?.progressionBadgeSide === "left" ? "left" : "right",
      progressionMarkOverrides: layouts.default?.progressionMarkOverrides || {},
    },
    expanded: {
      fontSizeStep: layouts.expanded?.fontSizeStep ?? 0,
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
