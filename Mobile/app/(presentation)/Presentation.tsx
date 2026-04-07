import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { ActionSheetRef } from "react-native-actions-sheet";
import ActionSheetPres from "@/components/ActionSheetPres/ActionSheetPres";
import { getCurrentUserEmail, getSpecificSongData } from "@/connect/connect";

type PresentationMode = "full" | "tabs" | "chords" | "lyrics";

type InstrumentKey =
  | "guitar01"
  | "guitar02"
  | "bass"
  | "keys"
  | "drums"
  | "voice";

type InstrumentData = {
  songCifra?: string;
  songTabs?: string;
  songChords?: string;
  songLyrics?: string;
  capo?: string;
  tuning?: string;
  tom?: string;
};

type SongData = Partial<Record<InstrumentKey, InstrumentData>> & {
  progressBar?: number;
  instruments?: Partial<Record<InstrumentKey, boolean>>;
  embedVideos?: string[];
};

type ParsedLine =
  | { type: "blank"; key: string }
  | { type: "section"; key: string; text: string }
  | { type: "tom"; key: string; text: string }
  | { type: "chord"; key: string; text: string }
  | { type: "tab"; key: string; text: string }
  | { type: "lyric"; key: string; text: string }
  | { type: "pair"; key: string; chordText: string; lyricText: string };

const mono = Platform.select({ ios: "Menlo", android: "monospace" });
const INSTRUMENT_LABELS: Record<InstrumentKey, string> = {
  guitar01: "G1",
  guitar02: "G2",
  bass: "B",
  keys: "K",
  drums: "D",
  voice: "V",
};
const PRESENTATION_FETCH_TIMEOUT_MS = 15000;

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise.finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    }),
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Presentation request timed out.")),
        timeoutMs,
      );
    }),
  ]);
}

function sanitizeSongText(input = "") {
  return input
    .replace(/<span style="display:none">.*?<\/span>/gs, "")
    .replace(/<span style="color:lightgrey">(.*?)<\/span>/gs, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, "\n");
}

function isSectionLine(line: string) {
  return /^\s*\[[^\]]+\]/.test(line.trim());
}

function isTabLine(line: string) {
  return /^[A-Ga-g]?\|[-0-9hpbvrx/\s|~]*$/.test(line.trim());
}

const nonChordWords = [
  "Coração",
  "Dedilhado",
  "Final",
  "Estrofes",
  "Frase",
  "Casta_nhos",
  "Escala",
  "coração",
  "dedilhado",
  "final",
  "estrofes",
  "frase",
  "casta_nhos",
  "escala",
  "Fontes",
];

const chordRegexString =
  "([A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?(?:\\/[A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?)?)";
const chordValidationRegex = new RegExp(`^${chordRegexString}$`);

function isChordWord(word: string) {
  const cleaned = word.trim();
  if (!cleaned) return false;
  if (nonChordWords.includes(cleaned)) return false;
  return chordValidationRegex.test(cleaned);
}

function isChordLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const words = trimmed.split(/\s+/);
  const chordCount = words.filter((word) => isChordWord(word)).length;

  return chordCount > 0 && chordCount / words.length >= 0.5;
}

function isTomLine(line: string) {
  return line.trim().toLowerCase().startsWith("tom:");
}

function parsePresentationText(input = ""): ParsedLine[] {
  const text = sanitizeSongText(input);
  const lines = text.split("\n");
  const parsed: ParsedLine[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.replace(/\r/g, "");
    const trimmed = line.trim();

    if (!trimmed) {
      parsed.push({ type: "blank", key: `blank-${index}` });
      continue;
    }

    if (isSectionLine(line)) {
      parsed.push({ type: "section", key: `section-${index}`, text: trimmed });
      continue;
    }

    if (isTomLine(line)) {
      parsed.push({ type: "tom", key: `tom-${index}`, text: trimmed });
      continue;
    }

    if (isTabLine(line)) {
      parsed.push({ type: "tab", key: `tab-${index}`, text: line });
      continue;
    }

    if (isChordLine(line)) {
      const nextLine = lines[index + 1]?.replace(/\r/g, "") ?? "";
      const nextTrimmed = nextLine.trim();
      const isPair =
        Boolean(nextTrimmed) &&
        !isSectionLine(nextLine) &&
        !isTomLine(nextLine) &&
        !isTabLine(nextLine) &&
        !isChordLine(nextLine);

      if (isPair) {
        parsed.push({
          type: "pair",
          key: `pair-${index}`,
          chordText: line,
          lyricText: nextLine,
        });
        index += 1;
        continue;
      }

      parsed.push({ type: "chord", key: `chord-${index}`, text: line });
      continue;
    }

    parsed.push({ type: "lyric", key: `lyric-${index}`, text: line });
  }

  return parsed;
}

export default function Presentation() {
  const sheetRef = useRef<ActionSheetRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const scrollOffsetRef = useRef(0);

  const { song, artist, instrument, songCifra } = useLocalSearchParams<{
    song: string;
    artist: string;
    instrument: InstrumentKey;
    songCifra?: string;
  }>();
  const routeSong = firstParam(song).trim();
  const routeArtist = firstParam(artist).trim();
  const routeSongCifra = firstParam(songCifra);

  const initialInstrument = useMemo<InstrumentKey>(() => {
    const candidate = firstParam(instrument) as InstrumentKey | undefined;
    return candidate && candidate in INSTRUMENT_LABELS ? candidate : "keys";
  }, [instrument]);

  const [songData, setSongData] = useState<SongData | null>(null);
  const [activeInstrument, setActiveInstrument] =
    useState<InstrumentKey>(initialInstrument);
  const [contentMode, setContentMode] = useState<PresentationMode>("full");
  const [fontSize, setFontSize] = useState(12);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollStep, setAutoScrollStep] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveInstrument(initialInstrument);
  }, [initialInstrument]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    setIsAutoScrolling(false);
  }, []);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        if (routeSongCifra) {
          setSongData({
            [initialInstrument]: { songCifra: routeSongCifra },
          });
          setLoading(false);
        }

        const userEmail = await getCurrentUserEmail();
        if (!userEmail || !routeArtist || !routeSong) {
          if (mounted) {
            if (routeSongCifra) {
              setSongData({
                [initialInstrument]: { songCifra: routeSongCifra },
              });
              setError("");
            } else {
              setSongData(null);
              setError("Song data is missing.");
            }
          }
          return;
        }

        console.log(`[${Platform.OS}] [presentation] loading`, {
          email: userEmail,
          artist: routeArtist,
          song: routeSong,
          instrument: initialInstrument,
          hasParamCifra: Boolean(routeSongCifra),
        });

        const data = (await withTimeout(
          getSpecificSongData({
            email: userEmail,
            artist: routeArtist,
            song: routeSong,
          }),
          PRESENTATION_FETCH_TIMEOUT_MS,
        )) as SongData;

        if (!mounted) return;
        const hasApiContent = Boolean(
          data?.[initialInstrument]?.songCifra ||
            data?.[initialInstrument]?.songChords ||
            data?.[initialInstrument]?.songTabs ||
            data?.[initialInstrument]?.songLyrics,
        );

        setSongData(
          hasApiContent || !routeSongCifra
            ? data
            : {
                ...data,
                [initialInstrument]: {
                  ...(data?.[initialInstrument] || {}),
                  songCifra: routeSongCifra,
                },
              },
        );
        setError("");
      } catch (err) {
        if (!mounted) return;
        console.warn(`[${Platform.OS}] [presentation] fallback/error`, err);
        if (routeSongCifra) {
          setSongData({
            [initialInstrument]: { songCifra: routeSongCifra },
          });
          setError("");
        } else {
          setSongData(null);
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar a apresentação.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialInstrument, routeArtist, routeSong, routeSongCifra]);

  const availableInstruments = useMemo(() => {
    const instrumentFlags = songData?.instruments ?? {};

    return (Object.keys(INSTRUMENT_LABELS) as InstrumentKey[]).filter((key) => {
      if (instrumentFlags[key]) return true;
      return Boolean(songData?.[key]?.songCifra || songData?.[key]?.songLyrics);
    });
  }, [songData]);

  useEffect(() => {
    if (!availableInstruments.length) return;
    if (!availableInstruments.includes(activeInstrument)) {
      setActiveInstrument(availableInstruments[0]);
    }
  }, [activeInstrument, availableInstruments]);

  const activeInstrumentData = useMemo(() => {
    return songData?.[activeInstrument] ?? {};
  }, [songData, activeInstrument]);

  const contentSelected = useMemo(() => {
    switch (contentMode) {
      case "tabs":
        return activeInstrumentData.songTabs || "";
      case "chords":
        return activeInstrumentData.songChords || "";
      case "lyrics":
        return activeInstrumentData.songLyrics || "";
      case "full":
      default:
        return (
          activeInstrumentData.songCifra ||
          activeInstrumentData.songChords ||
          activeInstrumentData.songTabs ||
          activeInstrumentData.songLyrics ||
          ""
        );
    }
  }, [activeInstrumentData, contentMode]);

  const parsedLines = useMemo(
    () => parsePresentationText(contentSelected),
    [contentSelected],
  );

  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
      return;
    }

    autoScrollIntervalRef.current = setInterval(() => {
      scrollOffsetRef.current += autoScrollStep;
      scrollViewRef.current?.scrollTo({
        y: scrollOffsetRef.current,
        animated: true,
      });
    }, 700);

    setIsAutoScrolling(true);
  }, [autoScrollStep, isAutoScrolling, stopAutoScroll]);

  const metaItems = [
    { label: "Instrument", value: activeInstrument.toUpperCase() },
    { label: "Tom", value: activeInstrumentData.tom || "-" },
    { label: "Capo", value: activeInstrumentData.capo || "-" },
    { label: "Tuning", value: activeInstrumentData.tuning || "-" },
  ];

  return (
    <>
      <ActionSheetPres
        ref={sheetRef}
        activeInstrument={activeInstrument}
        availableInstruments={availableInstruments}
        embedLinks={songData?.embedVideos ?? []}
        contentMode={contentMode}
        fontSize={fontSize}
        isAutoScrolling={isAutoScrolling}
        onChangeInstrument={setActiveInstrument}
        onChangeMode={setContentMode}
        onDecreaseFont={() =>
          setFontSize((current) => Math.max(12, current - 2))
        }
        onIncreaseFont={() =>
          setFontSize((current) => Math.min(28, current + 2))
        }
        onDecreaseScroll={() =>
          setAutoScrollStep((current) => Math.max(4, current - 4))
        }
        onIncreaseScroll={() =>
          setAutoScrollStep((current) => Math.min(36, current + 4))
        }
        onToggleAutoScroll={toggleAutoScroll}
      />

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
          <View style={styles.containerBox}>
            <View
              style={[
                styles.neumorphic,
                isHeaderCompact ? styles.neumorphicCompact : null,
              ]}
            >
              <View style={styles.topRow}>
                <View style={styles.titleColumn}>
                  <Text style={styles.header}>{routeSong}</Text>
                  <Text style={styles.subHeader}>{routeArtist}</Text>
                </View>

                <TouchableOpacity
                  style={styles.toolboxButton}
                  onPress={() => sheetRef.current?.show()}
                >
                  <Icon name="gear" size={28} color="#2d2d2d" />
                </TouchableOpacity>
              </View>

              {!isHeaderCompact ? (
                <View style={styles.metaRow}>
                  {metaItems.map((item, index) => (
                    <View
                      key={item.label}
                      style={[
                        styles.metaCard,
                        index === metaItems.length - 1
                          ? styles.metaCardLast
                          : null,
                      ]}
                    >
                      <Text style={styles.metaLabel}>{item.label}</Text>
                      <Text numberOfLines={1} style={styles.metaValue}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.headerToggle}
                onPress={() => setIsHeaderCompact((current) => !current)}
                activeOpacity={0.8}
              >
                <Icon
                  name={isHeaderCompact ? "angle-down" : "angle-up"}
                  size={18}
                  color="#000000"
                />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#daa520" />
              <Text style={styles.stateText}>Loading presentation...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              onScroll={(event) => {
                scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
            >
              {parsedLines.length === 0 ? (
                <Text style={styles.emptyText}>
                  No content available for this view.
                </Text>
              ) : (
                parsedLines.map((line) => {
                  if (line.type === "blank") {
                    return (
                      <View key={line.key} style={{ height: fontSize * 0.9 }} />
                    );
                  }

                  const baseStyle = [
                    styles.contentText,
                    {
                      fontSize,
                      lineHeight: Math.round(fontSize * 1.35),
                    },
                  ];

                  if (line.type === "section") {
                    return (
                      <Text
                        key={line.key}
                        style={[baseStyle, styles.sectionText]}
                      >
                        {line.text}
                      </Text>
                    );
                  }

                  if (line.type === "tom") {
                    return (
                      <Text key={line.key} style={[baseStyle, styles.tomText]}>
                        {line.text}
                      </Text>
                    );
                  }

                  if (line.type === "pair") {
                    return (
                      <View key={line.key} style={styles.pairBlock}>
                        <Text style={[baseStyle, styles.chordText]}>
                          {line.chordText}
                        </Text>
                        <Text style={[baseStyle, styles.lyricText]}>
                          {line.lyricText}
                        </Text>
                      </View>
                    );
                  }

                  if (line.type === "chord") {
                    return (
                      <Text
                        key={line.key}
                        style={[baseStyle, styles.chordText]}
                      >
                        {line.text}
                      </Text>
                    );
                  }

                  if (line.type === "tab") {
                    return (
                      <Text key={line.key} style={[baseStyle, styles.tabText]}>
                        {line.text}
                      </Text>
                    );
                  }

                  return (
                    <Text key={line.key} style={[baseStyle, styles.lyricText]}>
                      {line.text}
                    </Text>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  containerBox: { padding: 12 },
  neumorphic: {
    borderRadius: 18,
    backgroundColor: "#E0E0E0",
    padding: 14,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  neumorphicCompact: {
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  header: {
    fontWeight: "800",
    fontSize: 24,
    color: "#000000",
  },
  subHeader: {
    fontWeight: "600",
    fontSize: 18,
    color: "#2d2d2d",
    marginTop: 4,
  },
  toolboxButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#bebebe",
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginTop: 14,
  },
  metaCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    minWidth: 0,
    marginRight: 8,
  },
  metaCardLast: {
    marginRight: 0,
  },
  metaLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
  },
  headerToggle: {
    alignItems: "center",
    marginTop: 8,
  },
  headerToggleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 15,
  },
  errorText: {
    color: "#8e2f2f",
    fontSize: 15,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  contentText: {
    fontFamily: mono,
    color: "#000000",
  },
  sectionText: {
    color: "#d9ad26",
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 8,
  },
  tomText: {
    color: "#000000",
    marginTop: 4,
    marginBottom: 2,
  },
  pairBlock: {
    marginTop: 4,
  },
  chordText: {
    color: "#d9ad26",
    fontWeight: "700",
    marginTop: 0,
  },
  tabText: {
    color: "#6b7280",
    marginTop: 4,
  },
  lyricText: {
    color: "#000000",
    marginTop: 2,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
  },
});
