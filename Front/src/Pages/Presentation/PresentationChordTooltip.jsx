/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import ChordShapeData from "../ChordLibrary/ChordShapeData.json";
import { PersonalChordLibrary } from "../ChordLibrary/PersonalChordLibrary";

function buildFingeringFromVariation(variation) {
  if (!variation?.strings) return null;

  const frets = variation.strings.map((stringData) => {
    if (Array.isArray(stringData) && stringData.length > 0) {
      const it = stringData[0];
      if (it?.isMuted) return -1;
      return typeof it?.fretNo === "number" ? it.fretNo : 0;
    }
    return 0;
  });

  const fingers = variation.strings.map((stringData) => {
    if (Array.isArray(stringData) && stringData.length > 0) {
      const symbol = stringData[0]?.symbol;
      if (typeof symbol === "string" && /^\d$/.test(symbol)) {
        return Number(symbol);
      }
    }
    return 0;
  });

  return { frets, fingers };
}

function buildFingeringFromPersonalChord(chord) {
  if (!chord?.strings) return null;

  const frets = chord.strings.split(" ").map((value) => {
    if (value === "X") return -1;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  });

  const fingers = chord.fingering.split(" ").map((value) => {
    if (value === "X") return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  });

  return { frets, fingers };
}

function normalizeChordLabel(rawChord = "") {
  return rawChord
    .trim()
    .replace(/\s+/g, "")
    .replace(/[[]/g, "")
    .replace(/[\]]/g, "");
}

function parseChord(rawChord = "") {
  const normalized = normalizeChordLabel(rawChord);
  const match = normalized.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) return null;

  const REMOVED_MONGO_USER = match[1];
  let tail = match[2] || "";
  let bass = "";

  const slashIndex = tail.indexOf("/");
  if (slashIndex >= 0) {
    const candidateBass = tail.slice(slashIndex + 1);
    if (/^[A-G](?:#|b)?$/.test(candidateBass)) {
      bass = candidateBass;
      tail = tail.slice(0, slashIndex);
    }
  }

  tail = tail.replace(/\([^)]*\)/g, "");

  let quality = "";

  if (/^m(?!aj)/.test(tail)) {
    quality = "m";
    tail = tail.slice(1);
  }

  if (tail.startsWith("maj7") || tail.startsWith("M7")) {
    tail = "7M";
  }

  return { REMOVED_MONGO_USER, quality, tension: tail, bass, normalized };
}

function findPersonalVariations(parsedChord) {
  if (!parsedChord) return [];

  const exactMatches = PersonalChordLibrary.filter(
    (item) =>
      item.REMOVED_MONGO_USER === parsedChord.REMOVED_MONGO_USER &&
      item.quality === parsedChord.quality &&
      item.tension === parsedChord.tension &&
      item.bass === parsedChord.bass,
  );

  const fallbackMatches =
    exactMatches.length > 0
      ? exactMatches
      : PersonalChordLibrary.filter(
          (item) =>
            item.REMOVED_MONGO_USER === parsedChord.REMOVED_MONGO_USER &&
            item.quality === parsedChord.quality &&
            item.tension === parsedChord.tension &&
            item.bass === "",
        );

  return fallbackMatches.map((item, index) => ({
    id: `personal-${item.chordName}-${index}`,
    source: "personal",
    fingering: buildFingeringFromPersonalChord(item),
    variationLabel: item.description || "Variacao padrao",
  }));
}

function getChordTypeCandidates(parsedChord) {
  if (!parsedChord) return [];

  const { quality, tension } = parsedChord;
  const normalizedTension = tension.toLowerCase();

  if (!quality && tension === "") return ["Major"];
  if (quality === "m" && tension === "") return ["Minor"];
  if (!quality && (tension === "7M" || normalizedTension === "maj7"))
    return ["maj7"];
  if (quality === "m" && normalizedTension === "7") return ["m7"];
  if (!quality && normalizedTension === "7") return ["7"];
  if (!quality && normalizedTension === "5") return ["5"];
  if (!quality && normalizedTension === "sus2") return ["sus2"];
  if (!quality && normalizedTension === "sus4") return ["sus4"];
  if (!quality && normalizedTension === "7sus4") return ["7sus4"];
  if (!quality && normalizedTension === "dim") return ["dim"];
  if (!quality && normalizedTension === "dim7") return ["dim7"];
  if (!quality && (normalizedTension === "aug" || normalizedTension === "+")) {
    return ["aug"];
  }

  return [];
}

function findShapeDataVariations(parsedChord) {
  const typeCandidates = getChordTypeCandidates(parsedChord);
  if (!parsedChord || typeCandidates.length === 0) return [];

  const chords = ChordShapeData.filter(
    (item) =>
      item.chordName === parsedChord.REMOVED_MONGO_USER &&
      typeCandidates.includes(item.chordType),
  );

  return chords.flatMap((chord) =>
    (chord.results || []).map((variation, index) => ({
      id: `shape-${variation.id || `${chord.chordType}-${index}`}`,
      source: "shapeData",
      fingering: buildFingeringFromVariation(variation),
      variationLabel: `${chord.chordName} ${chord.chordType}`.trim(),
      variationNumber: index + 1,
    })),
  );
}

function serializeFingering(fingering) {
  return `${fingering.frets.join(",")}|${fingering.fingers.join(",")}`;
}

export function findChordTooltipData(rawChord) {
  const parsedChord = parseChord(rawChord);
  if (!parsedChord) return null;

  const personalVariations = findPersonalVariations(parsedChord);
  const shapeVariations = findShapeDataVariations(parsedChord);
  const seenFingerings = new Set();
  const variations = [...personalVariations, ...shapeVariations].filter(
    (variation) => {
      if (!variation?.fingering) return false;
      const key = serializeFingering(variation.fingering);
      if (seenFingerings.has(key)) return false;
      seenFingerings.add(key);
      return true;
    },
  );

  if (!variations.length) return null;

  return {
    chordLabel: normalizeChordLabel(rawChord),
    variations,
  };
}

function CompactChordDiagram({ fingering, size = 128 }) {
  const pad = Math.round(size * 0.125);
  const stringGap = (size - pad * 2) / 5;
  const fretGap = (size - pad * 2) / 4;

  if (!fingering) return null;

  const playedFrets = fingering.frets.filter((fret) => fret > 0);
  const minFret = playedFrets.length ? Math.min(...playedFrets) : 1;
  const offset = Number.isFinite(minFret) && minFret > 1 ? minFret - 1 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="presentation-chord-tooltip-diagram"
      aria-hidden="true"
    >
      <rect
        x={pad - 1}
        y={pad - 1}
        width={size - pad * 2 + 2}
        height={size - pad * 2 + 2}
        fill="none"
        stroke="#4b5563"
        strokeWidth="1.5"
      />

      {Array.from({ length: 6 }).map((_, index) => (
        <line
          key={`string-${index}`}
          x1={pad + index * stringGap}
          y1={pad}
          x2={pad + index * stringGap}
          y2={size - pad}
          stroke="#4b5563"
          strokeWidth="1"
        />
      ))}

      {Array.from({ length: 5 }).map((_, index) => (
        <line
          key={`fret-${index}`}
          x1={pad}
          y1={pad + index * fretGap}
          x2={size - pad}
          y2={pad + index * fretGap}
          stroke="#4b5563"
          strokeWidth={index === 0 && offset === 0 ? "4" : "1"}
        />
      ))}

      {fingering.frets.map((fret, index) => {
        const x = pad + index * stringGap;

        if (fret === -1) {
          return (
            <text
              key={`muted-${index}`}
              x={x}
              y={pad - 6}
              textAnchor="middle"
              className="presentation-chord-tooltip-marker"
            >
              x
            </text>
          );
        }

        if (fret === 0) {
          return (
            <text
              key={`open-${index}`}
              x={x}
              y={pad - 6}
              textAnchor="middle"
              className="presentation-chord-tooltip-marker"
            >
              o
            </text>
          );
        }

        const y = pad + (fret - 0.5 - offset) * fretGap;

        return (
          <circle
            key={`fret-dot-${index}`}
            cx={x}
            cy={y}
            r={stringGap * 0.32}
            fill="#4b5563"
          />
        );
      })}

      {fingering.fingers.map((finger, index) => {
        const fret = fingering.frets[index];
        if (!finger || fret <= 0) return null;

        const x = pad + index * stringGap;
        const y = pad + (fret - 0.5 - offset) * fretGap + size * 0.03;

        return (
          <text
            key={`finger-${index}`}
            x={x}
            y={y}
            textAnchor="middle"
            className="presentation-chord-tooltip-finger"
          >
            {finger}
          </text>
        );
      })}

      {offset > 0 && (
        <text
          x={size - pad + 10}
          y={pad + fretGap / 2}
          className="presentation-chord-tooltip-offset"
        >
          {offset + 1}fr
        </text>
      )}
    </svg>
  );
}

function VariationOption({ chordLabel, variation, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`presentation-chord-variation-card ${
        isSelected ? "is-selected" : ""
      }`}
      onClick={onSelect}
    >
      <div className="presentation-chord-variation-name">{chordLabel}</div>
      <CompactChordDiagram fingering={variation.fingering} size={86} />
      <div className="presentation-chord-variation-dots">
        {variation.fingering.frets.map((fret, index) => (
          <span key={`${variation.id}-dot-${index}`}>
            {fret === -1 ? "x" : fret === 0 ? "o" : "o"}
          </span>
        ))}
      </div>
      <div className="presentation-chord-variation-caption">
        {variation.variationNumber
          ? `Variacao ${variation.variationNumber}`
          : "Variacao"}
      </div>
    </button>
  );
}

export default function PresentationChordTooltip({
  tooltip,
  selectedVariationIndex,
  onApplyVariation,
  onTooltipEnter,
  onTooltipLeave,
  onClose,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftIndex, setDraftIndex] = useState(0);
  const [applyToAll, setApplyToAll] = useState(true);

  const selectedIndex = useMemo(() => {
    if (typeof selectedVariationIndex !== "number") return 0;
    return selectedVariationIndex;
  }, [selectedVariationIndex]);

  useEffect(() => {
    setDraftIndex(selectedIndex);
    setIsExpanded(false);
    setApplyToAll(true);
  }, [selectedIndex, tooltip?.data?.chordId]);

  if (!tooltip?.data) return null;

  const { chordLabel, variations } = tooltip.data;
  const currentVariation = variations[selectedIndex] || variations[0];
  const draftVariation = variations[draftIndex] || currentVariation;

  const style = {
    left: tooltip.position.x,
    top: tooltip.position.y,
  };

  const handleApply = () => {
    onApplyVariation({
      chordLabel,
      chordId: tooltip.data.chordId,
      variationIndex: draftIndex,
      applyToAll,
    });
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setDraftIndex(selectedIndex);
    setIsExpanded(false);
    onClose?.();
  };

  return (
    <div
      className={`presentation-chord-tooltip ${isExpanded ? "is-expanded" : ""}`}
      style={style}
      role="tooltip"
      onMouseEnter={onTooltipEnter}
      onMouseLeave={onTooltipLeave}
    >
      <div className="presentation-chord-tooltip-compact">
        <div className="presentation-chord-tooltip-header">{chordLabel}</div>
        <CompactChordDiagram fingering={currentVariation.fingering} />
        <div className="presentation-chord-tooltip-footer">
          {/* {currentVariation.variationLabel} */}
        </div>
        <button
          type="button"
          className="presentation-chord-tooltip-action"
          onClick={() => setIsExpanded((current) => !current)}
        >
          Change position
        </button>
      </div>

      {isExpanded && (
        <div className="presentation-chord-tooltip-panel">
          <div className="presentation-chord-tooltip-options">
            {variations.map((variation, index) => (
              <VariationOption
                key={variation.id}
                chordLabel={chordLabel}
                variation={variation}
                isSelected={index === draftIndex}
                onSelect={() => setDraftIndex(index)}
              />
            ))}
          </div>

          <div className="presentation-chord-tooltip-controls">
            <label className="presentation-chord-tooltip-apply-all">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(event) => setApplyToAll(event.target.checked)}
              />
              <span>Change all {chordLabel}</span>
            </label>
            <div className="presentation-chord-tooltip-buttons">
              <button
                type="button"
                className="presentation-chord-tooltip-cancel"
                onClick={handleCancel}
              >
                cancel
              </button>
              <button
                type="button"
                className="presentation-chord-tooltip-confirm"
                onClick={handleApply}
              >
                ok
              </button>
            </div>
          </div>

          <div className="presentation-chord-tooltip-preview">
            <div className="presentation-chord-tooltip-preview-title">
              {chordLabel}
            </div>
            <CompactChordDiagram fingering={draftVariation.fingering} />
          </div>
        </div>
      )}
    </div>
  );
}
