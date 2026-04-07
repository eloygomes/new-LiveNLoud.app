import {
  getCurrentUserEmail,
  getListOfMusic,
} from "@/connect/connect";
import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import InstrumentIcon, {
  InstrumentIconName,
} from "@/components/InstrumentIcon";

// Defina ou importe o tipo Instruments corretamente
import { Instruments } from "../../shared/types";

type InstrumentContent = {
  songCifra?: string;
  songChords?: string;
  songTabs?: string;
  songLyrics?: string;
};

export type SelectPayload = {
  song?: string;
  artist?: string;
  songCifra?: string;
  progressBar?: number;
  instruments?: Instruments;
  instrument?: string;
  setlist?: string[];
  guitar01?: InstrumentContent;
  guitar02?: InstrumentContent;
  bass?: InstrumentContent;
  keys?: InstrumentContent;
  drums?: InstrumentContent;
  voice?: InstrumentContent;
};

type FlatListProps = {
  onSelect: (item: SelectPayload) => void;
  onOpenFilter: () => void;
  selectedSetlists: string[];
  searchTerm: string;
  onAllSongsChange?: (songs: SelectPayload[]) => void;
};

// 👇 Handle exposto ao pai (Songlist)
export type FLCompHandle = {
  refetch: () => Promise<void>;
};

type ItemProps = {
  index: number;
  song: string;
  artist: string;
  progressBar?: number;
  instruments?: Instruments;
  onPress: () => void;
};

const instrumentMeta: {
  key: keyof Instruments;
  icon: InstrumentIconName;
}[] = [
  { key: "guitar01", icon: "guitar" },
  { key: "guitar02", icon: "guitar" },
  { key: "bass", icon: "bass" },
  { key: "keys", icon: "piano-keys" },
  { key: "drums", icon: "drum" },
  { key: "voice", icon: "microphone" },
];

const ProgressCircle = ({ progress = 0 }: { progress?: number }) => {
  const size = 18;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#d7d7d7"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#d9ad26"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

const Item = ({
  index,
  song,
  artist,
  progressBar = 0,
  instruments,
  onPress,
}: ItemProps) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.item}>
      <View style={styles.indexColumn}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.headerwrapper}>
          <View style={styles.titlewrapper}>
            <Text style={styles.song}>{song}</Text>
            <Text style={styles.artist}>{artist}</Text>

            <View style={styles.metaRow}>
              <View style={styles.progressChip}>
                <ProgressCircle progress={progressBar} />
                <Text style={styles.progressText}>
                  {Number(progressBar || 0)}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.iconsRow}>
            {instrumentMeta.map((instrument) => {
              const enabled = Boolean(instruments?.[instrument.key]);

              return (
                <View
                  key={instrument.key}
                  style={[
                    styles.instrumentChip,
                    enabled
                      ? styles.instrumentChipActive
                      : styles.instrumentChipDisabled,
                  ]}
                >
                  <InstrumentIcon
                    name={instrument.icon}
                    size={12}
                    color={enabled ? "#000000" : "#8f8f8f"}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const FLComp = forwardRef<FLCompHandle, FlatListProps>(
  (
    {
      onSelect,
      onOpenFilter,
      selectedSetlists,
      searchTerm,
      onAllSongsChange,
    },
    ref,
  ) => {
    const [listOfSongs, setListOfSongs] = useState<SelectPayload[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchSongs = useCallback(async () => {
      try {
        const userEmail = await getCurrentUserEmail();

        if (!userEmail) {
          console.warn(
            `[${Platform.OS}] [fetchSongs] user email not found in storage/profile.`,
          );
          setListOfSongs([]);
          onAllSongsChange?.([]);
          return;
        }

        const normalizedEmail = userEmail.trim().toLowerCase();
        console.log(
          `[${Platform.OS}] [fetchSongs] carregando musicas...`,
          normalizedEmail,
        );
        const songs = await getListOfMusic({
          email: normalizedEmail,
          artist: "",
          song: "",
        });
        const safeSongs = Array.isArray(songs) ? songs : [];
        setListOfSongs(safeSongs);
        onAllSongsChange?.(safeSongs);
      } catch (e) {
        console.warn(`[${Platform.OS}] [fetchSongs] erro:`, e);
        setListOfSongs([]);
        onAllSongsChange?.([]);
      }
    }, [onAllSongsChange]);

    // ✅ expõe método imperativo ao pai
    useImperativeHandle(
      ref,
      () => ({
        refetch: async () => {
          setRefreshing(true);
          try {
            await fetchSongs();
          } finally {
            setRefreshing(false);
          }
        },
      }),
      [fetchSongs],
    );

    // refetch sempre que a tela ganha foco
    useFocusEffect(
      React.useCallback(() => {
        let isActive = true;
        (async () => {
          setLoading(true);
          await fetchSongs();
          if (isActive) setLoading(false);
        })();
        return () => {
          isActive = false;
        };
      }, [fetchSongs]),
    );

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
        await fetchSongs();
      } finally {
        setRefreshing(false);
      }
    }, [fetchSongs]);

    const validSelectedSetlists = selectedSetlists.filter((selectedSetlist) =>
      listOfSongs.some((song) => (song?.setlist || []).includes(selectedSetlist)),
    );
    const shouldFilterBySetlist = validSelectedSetlists.length > 0;

    const filteredSongs =
      shouldFilterBySetlist || searchTerm.trim().length > 0
        ? listOfSongs.filter((song) => {
            const matchesSetlist =
              !shouldFilterBySetlist ||
              (song?.setlist || []).some((s) => validSelectedSetlists.includes(s));

            const term = searchTerm.trim().toLowerCase();
            const matchesSearch =
              term.length === 0 ||
              String(song?.song || "")
                .toLowerCase()
                .includes(term) ||
              String(song?.artist || "")
                .toLowerCase()
                .includes(term);

            return matchesSetlist && matchesSearch;
          })
        : listOfSongs;

    return (
      <>
        <SafeAreaProvider>
          <StatusBar
            animated
            barStyle="dark-content"
            translucent
            backgroundColor="transparent"
          />
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>SONGLIST</Text>
            </View>

            <FlatList
              data={filteredSongs}
              renderItem={({ item, index }) => (
                <Item
                  index={index}
                  song={item.song ?? ""}
                  artist={item.artist ?? ""}
                  progressBar={item.progressBar}
                  instruments={item.instruments}
                  onPress={() =>
                    onSelect({
                      song: item.song,
                      artist: item.artist,
                      instruments: item.instruments,
                      progressBar: item.progressBar,
                      songCifra: item.songCifra,
                      setlist: item.setlist,
                      guitar01: item.guitar01,
                      guitar02: item.guitar02,
                      bass: item.bass,
                      keys: item.keys,
                      drums: item.drums,
                      voice: item.voice,
                    })
                  }
                />
              )}
              keyExtractor={(_, index) => index.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text>
                    {loading ? "Carregando..." : "Nenhuma música encontrada"}
                  </Text>
                </View>
              }
              contentContainerStyle={
                filteredSongs.length === 0
                  ? { flexGrow: 1, justifyContent: "center" }
                  : undefined
              }
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </>
    );
  },
);

// Set display name for better debugging and to fix the warning
FLComp.displayName = "FLComp";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  filterTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  title: { fontSize: 24, fontWeight: "900", color: "#000000" },
  item: {
    backgroundColor: "#E0E0E0",
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  indexColumn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
    paddingRight: 10,
  },
  indexText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6b7280",
  },
  contentColumn: {
    flex: 1,
  },
  song: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
  },
  artist: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2d2d2d",
    marginTop: 2,
  },
  metaRow: {
    // marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    // gap: 5,
  },
  progressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
    borderRadius: 9,
    backgroundColor: "#f0f0f0",
  },
  progressText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
  },
  iconsRow: {
    width: 64,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 4,
  },
  instrumentChip: {
    width: 30,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  instrumentChipActive: {
    backgroundColor: "#d9ad26",
  },
  instrumentChipDisabled: {
    backgroundColor: "#f0f0f0",
  },
  titlewrapper: {
    flexDirection: "column",
    gap: 4,
  },
  headerwrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default FLComp;
