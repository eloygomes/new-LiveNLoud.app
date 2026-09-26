const FIT_FONT_SIZE_PROPERTY = "--presentation-tab-fit-font-size";

function numericStyleValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLineTypography(line) {
  const elements = [line, ...line.querySelectorAll("*")];
  return elements.reduce((largest, element) => {
    const style = window.getComputedStyle(element);
    const fontSize = numericStyleValue(style.fontSize);
    return fontSize > largest.fontSize
      ? {
          fontFamily: style.fontFamily,
          fontFeatureSettings: style.fontFeatureSettings,
          fontKerning: style.fontKerning,
          fontSize,
          fontStretch: style.fontStretch,
          fontStyle: style.fontStyle,
          fontVariant: style.fontVariant,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
        }
      : largest;
  }, { fontSize: 0 });
}

function measureUnclippedLineWidth(line, typography) {
  const directMeasurement = Math.max(
    line.scrollWidth || 0,
    line.getBoundingClientRect?.().width || 0,
  );
  if (!document.body || !line.textContent) return directMeasurement;

  const probe = document.createElement("span");
  probe.textContent = line.textContent;
  Object.assign(probe.style, {
    contain: "layout style",
    display: "inline-block",
    fontFamily: typography.fontFamily || "monospace",
    fontFeatureSettings: typography.fontFeatureSettings || "normal",
    fontKerning: typography.fontKerning || "none",
    fontSize: `${typography.fontSize || 16}px`,
    fontStretch: typography.fontStretch || "normal",
    fontStyle: typography.fontStyle || "normal",
    fontVariant: typography.fontVariant || "normal",
    fontWeight: typography.fontWeight || "400",
    insetInlineStart: "-100000px",
    letterSpacing: typography.letterSpacing || "0",
    maxWidth: "none",
    minWidth: "max-content",
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    width: "max-content",
  });
  document.body.append(probe);
  const probeWidth = Math.max(
    probe.scrollWidth || 0,
    probe.getBoundingClientRect?.().width || 0,
  );
  probe.remove();
  return Math.max(directMeasurement, probeWidth);
}

export function fitTablatureBlocksToColumns(root) {
  if (!root?.querySelectorAll || typeof window === "undefined") return [];

  return Array.from(
    root.querySelectorAll(".presentation-editor-tab-block"),
    (block) => {
      block.style.removeProperty(FIT_FONT_SIZE_PROPERTY);
      delete block.dataset.tabFitScale;

      const lines = Array.from(
        block.querySelectorAll(".presentation-editor-tab-line"),
      );
      if (!lines.length || block.clientWidth <= 0) return 1;

      const blockStyle = window.getComputedStyle(block);
      const horizontalPadding =
        numericStyleValue(blockStyle.paddingLeft) +
        numericStyleValue(blockStyle.paddingRight);
      const availableWidth = Math.max(0, block.clientWidth - horizontalPadding);
      const measurements = lines.map((line) => {
        const typography = getLineTypography(line);
        return {
          fontSize: typography.fontSize || 16,
          width: measureUnclippedLineWidth(line, typography),
        };
      });
      const widestLine = measurements.reduce(
        (widest, measurement) =>
          measurement.width > widest.width ? measurement : widest,
        { fontSize: 16, width: 0 },
      );
      const naturalWidth = widestLine.width;

      if (!availableWidth || naturalWidth <= availableWidth + 0.5) return 1;

      const baseFontSize =
        widestLine.fontSize || numericStyleValue(blockStyle.fontSize) || 16;
      const scale = Math.min(1, availableWidth / naturalWidth);
      block.style.setProperty(
        FIT_FONT_SIZE_PROPERTY,
        `${Math.max(1, baseFontSize * scale)}px`,
      );
      block.dataset.tabFitScale = scale.toFixed(4);
      return scale;
    },
  );
}
