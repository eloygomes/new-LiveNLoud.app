// import React, { useEffect, useRef, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import FLComp, { SelectPayload } from "@/components/FlatList/FlatList";
// import ActionSheetTemplate from "@/components/ActionSheet/ActionSheet";
// import { ActionSheetRef } from "react-native-actions-sheet";
// import { useNavigation } from "expo-router";
// import ActionSheetSongFilter from "@/components/ActionSheetSongFilter/ActionSheetSongFilter";

// const Songlist = () => {
//   const sheetRefTemplate = useRef<ActionSheetRef>(null); // Item específico
//   const sheetRefFilter = useRef<ActionSheetRef>(null); // Filtro
//   const navigation = useNavigation();

//   const [selected, setSelected] = useState<SelectPayload | null>(null);

//   const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);

//   // Fechar qualquer sheet ao sair da tela
//   useEffect(() => {
//     const unsubscribe = navigation.addListener("blur", () => {
//       sheetRefTemplate.current?.hide();
//       sheetRefFilter.current?.hide();
//     });
//     return unsubscribe;
//   }, [navigation]);

//   // Quando item for selecionado → abrir ActionSheetTemplate
//   const handleSelect = (payload: SelectPayload) => {
//     setSelected(payload);
//     sheetRefTemplate.current?.show();
//   };

//   // Abrir filtro ao clicar no ícone de filtro
//   const handleOpenFilter = () => {
//     sheetRefFilter.current?.show();
//   };

//   return (
//     <View style={styles.container}>
//       {/* FLComp recebe onSelect e função para abrir filtro */}
//       <FLComp
//         onSelect={handleSelect}
//         onOpenFilter={handleOpenFilter}
//         selectedSetlists={selectedSetlists}
//       />

//       {/* ActionSheet do item selecionado */}
//       <ActionSheetTemplate ref={sheetRefTemplate} selected={selected} />

//       {/* ActionSheet do filtro */}
//       <ActionSheetSongFilter
//         ref={sheetRefFilter}
//         selected={selected}
//         selectedSetlists={selectedSetlists}
//         setSelectedSetlists={setSelectedSetlists}
//       />
//     </View>
//   );
// };

// export default Songlist;

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#F0F0F0",
//     flex: 1,
//     flexDirection: "column",
//   },
// });

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import Filter from "react-native-vector-icons/FontAwesome";
import FLComp, {
  SelectPayload,
  SongListColumnKey,
} from "@/components/FlatList/FlatList";
import ActionSheetTemplate from "@/components/ActionSheet/ActionSheet";
import { ActionSheetRef } from "react-native-actions-sheet";
import { useNavigation } from "expo-router";
import ActionSheetSongFilter from "@/components/ActionSheetSongFilter/ActionSheetSongFilter";
import { getOfflineStatus, syncOfflineQueue } from "@/connect/connect";

// 👇 importe o tipo do handle para ter autocomplete no ref
import type { FLCompHandle } from "@/components/FlatList/FlatList";

const Songlist = () => {
  const sheetRefTemplate = useRef<ActionSheetRef>(null); // Item específico
  const sheetRefFilter = useRef<ActionSheetRef>(null); // Filtro

  // 👇 ref para chamar refetch do FLComp
  const flRef = useRef<FLCompHandle>(null);

  const navigation = useNavigation();

  const [selected, setSelected] = useState<SelectPayload | null>(null);
  const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allSongs, setAllSongs] = useState<SelectPayload[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<SongListColumnKey[]>([
    "progression",
    "notes",
    "instruments",
  ]);
  const [offlineInfo, setOfflineInfo] = useState({
    offlineMode: false,
    pendingChanges: 0,
  });

  const visibleSongs = useMemo(() => {
    const validSelectedSetlists = selectedSetlists.filter((selectedSetlist) =>
      allSongs.some((song) => (song?.setlist || []).includes(selectedSetlist)),
    );
    const shouldFilterBySetlist = validSelectedSetlists.length > 0;

    return allSongs.filter((song) => {
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
    });
  }, [allSongs, searchTerm, selectedSetlists]);

  // Fechar qualquer sheet ao sair da tela
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      sheetRefTemplate.current?.hide();
      sheetRefFilter.current?.hide();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const loadOfflineInfo = async () => {
      const status = await getOfflineStatus();
      setOfflineInfo({
        offlineMode: status.offlineMode,
        pendingChanges: status.pendingChanges,
      });
    };

    const unsubscribe = navigation.addListener("focus", loadOfflineInfo);
    loadOfflineInfo();
    return unsubscribe;
  }, [navigation]);

  const handleSelect = (payload: SelectPayload) => {
    if (offlineInfo.offlineMode && !payload.offlineEnabled) {
      Alert.alert(
        "Internet required",
        "This song is visible offline, but it was not marked to work offline.",
      );
      return;
    }
    setSelected(payload);
    sheetRefTemplate.current?.show();
  };

  const handleOpenFilter = () => {
    sheetRefFilter.current?.show();
  };

  return (
    <View style={styles.container}>
      {offlineInfo.offlineMode ? (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={async () => {
            const result = await syncOfflineQueue().catch(() => ({ synced: 0 }));
            const refreshed = await getOfflineStatus();
            setOfflineInfo({
              offlineMode: refreshed.offlineMode,
              pendingChanges: refreshed.pendingChanges,
            });
            Alert.alert(
              "Offline mode",
              result.synced
                ? `Synced ${result.synced} pending change(s).`
                : "Still offline or nothing new to sync.",
            );
            await flRef.current?.refetch();
          }}
        >
          <Text style={styles.offlineBannerText}>
            OFFLINE MODE • {offlineInfo.pendingChanges} pending
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilter}>
        <Filter name="filter" size={18} color="#111" />
      </TouchableOpacity>

      {/* Agora passamos o ref para o FLComp */}
      <FLComp
        ref={flRef}
        onSelect={handleSelect}
        onOpenFilter={handleOpenFilter}
        selectedSetlists={selectedSetlists}
        searchTerm={searchTerm}
        onAllSongsChange={setAllSongs}
        visibleColumns={visibleColumns}
      />

      {/* ActionSheet do item selecionado */}
      <ActionSheetTemplate
        ref={sheetRefTemplate}
        selected={selected}
        onSongUpdated={async () => {
          await flRef.current?.refetch();
          const status = await getOfflineStatus();
          setOfflineInfo({
            offlineMode: status.offlineMode,
            pendingChanges: status.pendingChanges,
          });
        }}
        // Exemplo: após alguma ação dentro do sheet, você pode chamar forceRefresh()
        // onDidSave={forceRefresh}  ← se seu componente suportar esse callback
      />

      {/* ActionSheet do filtro */}
      <ActionSheetSongFilter
        ref={sheetRefFilter}
        selected={selected}
        selectedSetlists={selectedSetlists}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        visibleSongs={visibleSongs}
        allSongs={allSongs}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        setSelectedSetlists={setSelectedSetlists}
      />
    </View>
  );
};

export default Songlist;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F0F0",
    flex: 1,
    flexDirection: "column",
  },
  offlineBanner: {
    position: "absolute",
    top: 54,
    left: 16,
    zIndex: 50,
    borderRadius: 14,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  offlineBannerText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  filterButton: {
    position: "absolute",
    top: 54,
    right: 70,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#efefef",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
});
