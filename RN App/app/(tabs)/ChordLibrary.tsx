import React, { useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import PlatformPicker from "@/components/noteWindow/PlatformPicker";
import ChordShape from "@/components/ChordShape/ChordShape";
import BtnNeuro from "@/components/BtnNeuro/BtnNeuro";
import ChordShapeData from "../../components/ChordShape/ChordShapeData.json";

const chordNames = [...new Set(ChordShapeData.map((item) => item.chordName))];
const chordTypes = [
  ...new Set(ChordShapeData.flatMap((item) => item.chordType)),
];

export default function ChordLibrary() {
  const [chordName, setChordName] = useState(chordNames[0]);
  const [chordType, setChordType] = useState(chordTypes[0]);
  const [variationIndex, setVariationIndex] = useState(0);

  const chord = ChordShapeData.find(
    (c) => c.chordName === chordName && c.chordType === chordType
  );

  const variations = chord?.results || [];

  const handleNextVariation = () => {
    if (!variations.length) return;
    const nextIndex = (variationIndex + 1) % variations.length;
    setVariationIndex(nextIndex);
  };

  const fingering = (() => {
    if (!variations[variationIndex]) return null;

    const strings = variations[variationIndex].strings;

    const frets = strings.map((s) => {
      if (Array.isArray(s) && s.length > 0) {
        return typeof s[0].fretNo === "number" ? s[0].fretNo : -1;
      }
      return -1;
    });

    const fingers = strings.map((s) => {
      if (Array.isArray(s) && s.length > 0) {
        const symbol = s[0].symbol;
        if (typeof symbol === "string" && /^\d$/.test(symbol)) {
          return parseInt(symbol, 10);
        }
      }
      return 0;
    });

    return { frets, fingers };
  })();

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
          <View style={styles.inner}>
            {/* Cabeçalho */}
            <View style={styles.neumorphic}>
              <Text style={styles.title}>Chord Library</Text>
            </View>

            {/* Pickers */}
            <View style={styles.pickerRow}>
              <PlatformPicker
                value={chordName}
                onChange={(v) => {
                  setChordName(v);
                  setVariationIndex(0);
                }}
                items={chordNames.map((name) => ({ label: name, value: name }))}
                style={styles.pick}
              />
              <PlatformPicker
                value={chordType}
                onChange={(v) => {
                  setChordType(v);
                  setVariationIndex(0);
                }}
                items={chordTypes.map((type) => ({ label: type, value: type }))}
                style={styles.pick}
              />
            </View>

            {/* Diagrama ampliado */}
            <View style={styles.diagramContainer}>
              {fingering ? (
                <ChordShape fingering={fingering} size={240} />
              ) : (
                <Text style={{ textAlign: "center" }}>
                  Acorde não encontrado.
                </Text>
              )}
            </View>

            {/* Preview e contagem */}
            <Text style={styles.preview}>
              {chordName} {chordType}
            </Text>
            <Text style={styles.variationText}>
              {variations.length} variação{variations.length !== 1 ? "s" : ""}{" "}
              disponível{variations.length !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.variationText}>
              Mostrando variação {variationIndex + 1}
            </Text>

            {/* Botão */}
            {variations.length > 1 && (
              <BtnNeuro
                title="Próxima Variação"
                onPress={handleNextVariation}
              />
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inner: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  neumorphic: {
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    padding: 12,
    shadowColor: "#e0e0e0cf",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pick: {
    flexGrow: 1,
    minWidth: "45%",
  },
  diagramContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  preview: {
    fontSize: 18,
    textAlign: "center",
  },
  variationText: {
    marginTop: 4,
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
});
