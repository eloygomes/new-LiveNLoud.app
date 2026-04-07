import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ChordShape from "@/components/ChordShape/ChordShape";
import ChordShapeData from "../../components/ChordShape/ChordShapeData.json";

const GOLD = "#d9ad26";
const PANEL = "#e0e0e0";
const SOFT = "#efefef";
const WHITE = "#ffffff";
const TEXT = "#080808";
const MUTED = "#697180";

type ChordStringNote = {
  fretNo?: number;
  symbol?: string | null;
};

type ChordVariation = {
  strings: ChordStringNote[][];
};

type ChordEntry = {
  chordName: string;
  chordType: string;
  results?: ChordVariation[];
};

const chordData = ChordShapeData as ChordEntry[];
const ROOT_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const roots = ROOT_ORDER.filter((root) =>
  chordData.some((item) => item.chordName === root),
);
const qualityOptions = ["Major", "Minor"] as const;
const extensionOptions = ["None", "5", "7", "9", "11", "13"] as const;
const bassOptions = ["None", ...roots] as const;

type Quality = (typeof qualityOptions)[number];
type Extension = (typeof extensionOptions)[number];
type Bass = (typeof bassOptions)[number];
type SectionKey = "root" | "quality" | "extension" | "bass";

function getLookupType(quality: Quality, extension: Extension) {
  if (extension === "None") return quality;
  if (extension === "5") return "5";
  if (extension === "7") return quality === "Minor" ? "m7" : "maj7";
  return quality;
}

function getChordLabel(root: string, quality: Quality, extension: Extension, bass: Bass) {
  let label = root;

  if (extension === "5") {
    label = `${root}5`;
  } else if (quality === "Minor") {
    label = `${root}m${extension === "None" ? "" : extension}`;
  } else if (extension !== "None") {
    label = `${root}maj${extension}`;
  }

  if (bass !== "None" && bass !== root) {
    label = `${label}/${bass}`;
  }

  return label;
}

function getChordNotes(quality: Quality, extension: Extension, bass: Bass) {
  const notes = [];
  if (extension === "5") {
    notes.push("Power chords use the root and fifth, so major/minor quality does not change the stored shape.");
  }
  if (["9", "11", "13"].includes(extension)) {
    notes.push(`Exact ${extension} voicings are not in the local chord database yet. Showing the closest ${quality.toLowerCase()} shape.`);
  }
  if (bass !== "None") {
    notes.push("The slash bass note is shown in the chord name; the diagram uses the closest stored guitar voicing.");
  }
  return notes;
}

function getFingering(variation?: ChordVariation) {
  if (!variation) return null;

  const frets = variation.strings.map((string) => {
    if (Array.isArray(string) && string.length > 0) {
      return typeof string[0].fretNo === "number" ? string[0].fretNo : -1;
    }
    return -1;
  });

  const fingers = variation.strings.map((string) => {
    if (Array.isArray(string) && string.length > 0) {
      const symbol = string[0].symbol;
      if (typeof symbol === "string" && /^\d$/.test(symbol)) {
        return parseInt(symbol, 10);
      }
    }
    return 0;
  });

  return { frets, fingers };
}

function OptionChip<T extends string>({
  label,
  selected,
  onPress,
}: {
  label: T;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function OptionSection<T extends string>({
  title,
  value,
  expanded,
  options,
  onToggle,
  onSelect,
}: {
  title: string;
  value: string;
  expanded: boolean;
  options: readonly T[];
  onToggle: () => void;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.optionSection}>
      <TouchableOpacity
        activeOpacity={0.82}
        style={styles.sectionHeader}
        onPress={onToggle}
      >
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionValue}>{value}</Text>
        </View>
        <Text style={styles.sectionArrow}>{expanded ? "v" : ">"}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.chipGrid}>
          {options.map((option) => (
            <OptionChip
              key={option}
              label={option}
              selected={value === option}
              onPress={() => onSelect(option)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function ChordLibrary() {
  const [root, setRoot] = useState(roots[0] || "C");
  const [quality, setQuality] = useState<Quality>("Major");
  const [extension, setExtension] = useState<Extension>("None");
  const [bass, setBass] = useState<Bass>("None");
  const [variationIndex, setVariationIndex] = useState(0);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    root: false,
    quality: false,
    extension: false,
    bass: false,
  });

  useEffect(() => {
    setVariationIndex(0);
  }, [root, quality, extension, bass]);

  const lookupType = getLookupType(quality, extension);
  const chord = useMemo(
    () =>
      chordData.find(
        (item) => item.chordName === root && item.chordType === lookupType,
      ),
    [lookupType, root],
  );
  const variations = chord?.results || [];
  const safeVariationIndex = variations.length
    ? Math.min(variationIndex, variations.length - 1)
    : 0;
  const fingering = getFingering(variations[safeVariationIndex]);
  const chordLabel = getChordLabel(root, quality, extension, bass);
  const chordNotes = getChordNotes(quality, extension, bass);

  const handleNextVariation = () => {
    if (!variations.length) return;
    setVariationIndex((current) => (current + 1) % variations.length);
  };

  const toggleSection = (section: SectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaProvider>
        <SafeAreaView
          style={styles.container}
          edges={Platform.OS === "android" ? ["top"] : ["top", "bottom"]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerCard}>
              <Text style={styles.kicker}># SUSTENIDO</Text>
              <Text style={styles.title}>Chord Library</Text>
              <Text style={styles.subtitle}>
                Build the chord by root, quality, extension, and bass note.
              </Text>
            </View>

            <View style={styles.diagramCard}>
              <View style={styles.diagramHeader}>
                <View>
                  <Text style={styles.diagramLabel}>Voicing</Text>
                  <Text style={styles.diagramTitle}>{chordLabel}</Text>
                </View>
                <Text style={styles.variationBadge}>
                  {variations.length ? `${safeVariationIndex + 1}/${variations.length}` : "0/0"}
                </Text>
              </View>

              <View style={styles.diagramMetaGrid}>
                <View style={styles.diagramMetaPill}>
                  <Text style={styles.diagramMetaLabel}>Root</Text>
                  <Text style={styles.diagramMetaValue}>{root}</Text>
                </View>
                <View style={styles.diagramMetaPill}>
                  <Text style={styles.diagramMetaLabel}>Mode</Text>
                  <Text style={styles.diagramMetaValue}>{quality}</Text>
                </View>
                <View style={styles.diagramMetaPill}>
                  <Text style={styles.diagramMetaLabel}>Ext</Text>
                  <Text style={styles.diagramMetaValue}>{extension}</Text>
                </View>
                <View style={styles.diagramMetaPill}>
                  <Text style={styles.diagramMetaLabel}>Bass</Text>
                  <Text style={styles.diagramMetaValue}>{bass}</Text>
                </View>
              </View>

              <View style={styles.diagramContainer}>
                {fingering ? (
                  <ChordShape fingering={fingering} size={250} />
                ) : (
                  <Text style={styles.emptyText}>Chord shape not found.</Text>
                )}
              </View>

              {chordNotes.length ? (
                <View style={styles.notesBox}>
                  {chordNotes.map((note) => (
                    <Text key={note} style={styles.noteText}>
                      {note}
                    </Text>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.84}
                style={[
                  styles.nextButton,
                  variations.length <= 1 && styles.nextButtonDisabled,
                ]}
                disabled={variations.length <= 1}
                onPress={handleNextVariation}
              >
                <Text style={styles.nextButtonText}>
                  {variations.length > 1 ? "Next variation" : "One variation"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.builderCard}>
              <Text style={styles.builderTitle}>Build chord</Text>
              <OptionSection
                title="Root"
                value={root}
                expanded={openSections.root}
                options={roots}
                onToggle={() => toggleSection("root")}
                onSelect={setRoot}
              />
              <OptionSection
                title="Major / minor"
                value={quality}
                expanded={openSections.quality}
                options={qualityOptions}
                onToggle={() => toggleSection("quality")}
                onSelect={setQuality}
              />
              <OptionSection
                title="Extension"
                value={extension}
                expanded={openSections.extension}
                options={extensionOptions}
                onToggle={() => toggleSection("extension")}
                onSelect={setExtension}
              />
              <OptionSection
                title="Bass"
                value={bass}
                expanded={openSections.bass}
                options={bassOptions}
                onToggle={() => toggleSection("bass")}
                onSelect={setBass}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOFT,
  },
  content: {
    padding: 14,
    paddingBottom: 110,
    gap: 14,
  },
  headerCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    padding: 18,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  kicker: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  title: {
    color: TEXT,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase",
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 300,
  },
  previewCard: {
    backgroundColor: TEXT,
    borderRadius: 24,
    padding: 18,
  },
  previewLabel: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  previewChord: {
    color: WHITE,
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 8,
  },
  previewMeta: {
    color: "#cdd2dc",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  builderCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    gap: 14,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  builderTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  optionSection: {
    backgroundColor: SOFT,
    borderRadius: 20,
    padding: 12,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  sectionValue: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  sectionArrow: {
    backgroundColor: WHITE,
    borderRadius: 999,
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  chip: {
    alignItems: "center",
    backgroundColor: SOFT,
    borderRadius: 999,
    elevation: 2,
    minWidth: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: GOLD,
  },
  chipText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "900",
  },
  chipTextActive: {
    color: TEXT,
  },
  diagramCard: {
    alignItems: "stretch",
    backgroundColor: PANEL,
    borderRadius: 26,
    elevation: 8,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  diagramHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  diagramLabel: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  diagramTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  variationBadge: {
    backgroundColor: WHITE,
    borderRadius: 999,
    color: MUTED,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  diagramMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 16,
  },
  diagramMetaPill: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 16,
    minWidth: "22%",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  diagramMetaLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  diagramMetaValue: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  diagramContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 48,
    textAlign: "center",
  },
  notesBox: {
    backgroundColor: WHITE,
    borderRadius: 18,
    gap: 6,
    marginTop: 16,
    padding: 14,
  },
  noteText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: GOLD,
    borderRadius: 16,
    marginTop: 16,
    paddingVertical: 14,
  },
  nextButtonDisabled: {
    backgroundColor: WHITE,
    opacity: 0.62,
  },
  nextButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
