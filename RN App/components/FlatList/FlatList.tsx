import { getListOfMusic } from "@/connect/connect";
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
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Filter from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";

// Defina ou importe o tipo Instruments corretamente
import { Instruments } from "../../shared/types";

export type SelectPayload = {
  song?: string;
  artist?: string;
  songCifra?: string;
  progressBar?: number;
  instruments?: Instruments;
  instrument?: string;
  setlist?: string[];
};

type FlatListProps = {
  onSelect: (item: SelectPayload) => void;
  onOpenFilter: () => void;
  selectedSetlists: string[];
};

// 👇 Handle exposto ao pai (Songlist)
export type FLCompHandle = {
  refetch: () => Promise<void>;
};

type ItemProps = {
  song: string;
  artist: string;
  onPress: () => void;
};

const Item = ({ song, artist, onPress }: ItemProps) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.item}>
      <Text style={styles.label}>Song</Text>
      <Text style={styles.song}>{song}</Text>
      <Text style={styles.label}>Artist</Text>
      <Text style={styles.artist}>{artist}</Text>
    </View>
  </TouchableOpacity>
);

const FLComp = forwardRef<FLCompHandle, FlatListProps>(
  ({ onSelect, onOpenFilter, selectedSetlists }, ref) => {
    const [listOfSongs, setListOfSongs] = useState<SelectPayload[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchSongs = useCallback(async () => {
      try {
        console.log("[fetchSongs] carregando músicas...");
        const songs = await getListOfMusic({
          email: "teste@teste.com",
          artist: "",
          song: "",
        });
        setListOfSongs(Array.isArray(songs) ? songs : []);
      } catch (e) {
        console.warn("[fetchSongs] erro:", e);
        setListOfSongs([]);
      }
    }, []);

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
      [fetchSongs]
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
      }, [fetchSongs])
    );

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
        await fetchSongs();
      } finally {
        setRefreshing(false);
      }
    }, [fetchSongs]);

    const filteredSongs =
      selectedSetlists.length > 0
        ? listOfSongs.filter((song) =>
            (song?.setlist || []).some((s) => selectedSetlists.includes(s))
          )
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

              <TouchableOpacity onPress={onOpenFilter}>
                <Filter name="filter" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredSongs}
              renderItem={({ item }) => (
                <Item
                  song={item.song ?? ""}
                  artist={item.artist ?? ""}
                  onPress={() =>
                    onSelect({
                      song: item.song,
                      artist: item.artist,
                      instruments: item.instruments,
                      progressBar: item.progressBar,
                      songCifra: item.songCifra,
                      setlist: item.setlist,
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
  }
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

  item: {
    backgroundColor: "#E0E0E0",
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: "column",
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
  },
  label: {
    fontSize: 12,
  },
  song: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
  artist: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FLComp;
