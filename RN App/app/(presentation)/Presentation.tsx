import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Platform,
  ScrollView,
  Touchable,
  TouchableOpacity,
} from "react-native";
import React, { JSX, use, useEffect, useRef, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getSpecificSongData } from "@/connect/connect";
import Icon from "react-native-vector-icons/FontAwesome";
import ActionSheetPres from "@/components/ActionSheetPres/ActionSheetPres";
import { ActionSheetRef } from "react-native-actions-sheet";
import { SelectPayload } from "@/components/FlatList/FlatList";

// Função que converte a string HTML-like em componentes React Native <Text>
export function parseStyledText(input: string): JSX.Element[] {
  const regex = /<span style="color:lightgrey">(.*?)<\/span>/gs;

  const elements: JSX.Element[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(input)) !== null) {
    const beforeText = input.slice(lastIndex, match.index);
    if (beforeText) {
      elements.push(
        <Text key={`before-${key}`} style={{ color: "#000" }}>
          {beforeText}
        </Text>
      );
    }

    const greyText = match[1];
    elements.push(
      <Text key={`grey-${key}`} style={{ color: "lightgrey" }}>
        {greyText}
      </Text>
    );

    lastIndex = regex.lastIndex;
    key++;
  }

  const remainingText = input.slice(lastIndex);
  if (remainingText) {
    elements.push(
      <Text key={`after-${key}`} style={{ color: "#000" }}>
        {remainingText}
      </Text>
    );
  }

  return elements;
}

export function parseLyricsText(input: string): JSX.Element[] {
  // Remove todo conteúdo dentro de <span style="display:none"> ... </span>
  const cleanedInput = input.replace(
    /<span style="display:none">.*?<\/span>/gs,
    ""
  );

  const baseTextStyle = {
    fontFamily: mono,
    fontSize: 14,
    lineHeight: 18,
    color: "#000", // cor padrão do texto
  };

  return [
    <Text key="lyrics-cleaned" style={baseTextStyle}>
      {cleanedInput}
    </Text>,
  ];
}

export default function Presentation() {
  const sheetRef = useRef<ActionSheetRef>(null);
  const [selected, setSelected] = useState<SelectPayload | null>(null);
  const { song, artist, instrument } = useLocalSearchParams<{
    song: string;
    artist: string;
    instrument: string;
  }>();

  const [showCifrafrom, setShowCifraFrom] = useState<string>("original");

  const [songCifra, setSongCifra] = useState<string>("Carregando…");

  // HOLDING
  const [showOriginal, setShowOriginal] = useState<string>("Carregando…");
  const [songTabs, setSongTabs] = useState<string>("Carregando…");
  const [songChords, setSongChords] = useState<string>("Carregando…");
  const [songLyrics, setSongLyrics] = useState<string>("Carregando…");

  useEffect(() => {
    if (showCifrafrom === "original") {
      setSongCifra(showOriginal);
    } else if (showCifrafrom === "tabs") {
      setSongCifra(songTabs);
    } else if (showCifrafrom === "chords") {
      setSongCifra(songChords);
    } else if (showCifrafrom === "lyrics") {
      setSongCifra(songLyrics);
    }
  }, [
    setShowCifraFrom,
    showCifrafrom,
    showOriginal,
    songTabs,
    songChords,
    songLyrics,
  ]);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await getSpecificSongData({
          email: "teste@teste.com",
          artist,
          song,
        });

        const cifra =
          data?.[instrument as keyof typeof data]?.songCifra ??
          "Cifra não encontrada";

        const songTabs =
          data?.[instrument as keyof typeof data]?.songTabs ??
          "Tabs não encontradas";

        const songChords =
          data?.[instrument as keyof typeof data]?.songChords ??
          "Acordes não encontrados";

        const songLyrics =
          data?.[instrument as keyof typeof data]?.songLyrics ??
          "Letra não encontrada";

        setShowOriginal(cifra);
        setSongTabs(songTabs);
        setSongChords(songChords);
        setSongLyrics(songLyrics);

        // console.log(cifra);
        // console.log(`data:`, data.guitar01.songTabs);

        // console.log(`cifra:`, cifra);
        // console.log(`tabs:`, songTabs);
        console.log(`chords:`, songChords);
        // console.log(`lyrics:`, songLyrics);
      } catch (err) {
        console.error(err);
        setSongCifra("Erro ao carregar cifra");
      }
    })();
  }, [artist, song, instrument]); // roda só quando params mudarem

  const handleSelect = (payload: SelectPayload) => {
    setSelected(payload);
    sheetRef.current?.show();
  };

  return (
    <>
      <ActionSheetPres
        ref={sheetRef}
        selected={selected}
        setShowCifraFrom={setShowCifraFrom}
      />
      {/* StatusBar sobre a imagem em ambos os SOs */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaProvider>
        {/* ANDROID só aplica safe-area no topo;
            iOS aplica em todas as bordas */}
        <SafeAreaView
          style={styles.container}
          edges={Platform.OS === "android" ? ["top"] : ["top", "bottom"]}
        >
          <View style={styles.containerBox}>
            <View style={styles.neumorphic}>
              <View style={styles.flexRow}>
                <View style={styles.flexColumn}>
                  <Text style={styles.header}>{song}</Text>
                  <Text style={styles.header}>{artist}</Text>
                </View>
                <View style={styles.flexColumn}>
                  <View
                    style={{
                      padding: 10,
                      marginTop: 5,
                      alignSelf: "center",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 50,
                      height: 50,
                      marginLeft: 10,
                      borderRadius: 5,
                      backgroundColor: "#bebebe",
                      shadowColor: "#bebebe",
                      shadowOffset: { width: 5, height: 5 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 5,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        handleSelect({ instrument } as SelectPayload)
                      }
                    >
                      <Icon name="gear" size={30} color="#2d2d2d" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {/* <Text style={styles.header}>{instrument}</Text> */}
            </View>
          </View>
          <ScrollView style={styles.scroll}>
            {/* <Text selectable style={styles.cifra}>
              {songCifra}
            </Text> */}
            {/* <Text style={styles.cifra}>{parseStyledText(songCifra)}</Text> */}
            <Text style={styles.cifra}>
              {showCifrafrom === "lyrics"
                ? parseLyricsText(songCifra)
                : parseStyledText(songCifra)}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const mono = Platform.select({ ios: "Menlo", android: "monospace" });

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerBox: { padding: 12 },
  flexRow: { flexDirection: "row", justifyContent: "space-between" },
  flexColumn: { flexDirection: "column" },
  header: { fontWeight: "bold", marginBottom: 4, fontSize: 22 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  cifra: { fontFamily: mono, fontSize: 14, lineHeight: 18 },
  neumorphic: {
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    padding: 12,
    // marginBottom: 24,
    shadowColor: "#e0e0e0cf",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  title: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  neumorphismBtn: {
    padding: 10,
    marginTop: 5,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 5,
    backgroundColor: "#bebebe",
    shadowColor: "#bebebe",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
});
