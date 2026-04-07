import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import InstrumentIcon, {
  InstrumentIconName,
} from "@/components/InstrumentIcon";

type Props = {
  text: string;
  type?: "normal" | "edit" | "delete";
  status?: boolean;
  apiText: string; // instrumento
  songCifra: string; // cifra em texto
  song: string; // título
  artist: string; // artista
  icon?: InstrumentIconName;
};

export default function ActionSheetGradeOptBtn({
  text,
  status,
  apiText,
  songCifra,
  song,
  artist,
  icon = "guitar",
}: Props) {
  const router = useRouter(); // minúsculo por convenção

  return (
    <TouchableOpacity
      disabled={!status}
      activeOpacity={0.82}
      style={[styles.block, status ? styles.blockActive : styles.blockDisabled]}
      onPress={() => {
        // 1. monte os params
        const params = { song, artist, instrument: apiText, songCifra };

        // 2. empurre **/Presentation** (o grupo (presentation) NÃO entra na URL)
        router.push({ pathname: "/Presentation", params });
      }}
    >
      <View style={[styles.iconShell, status ? styles.iconActive : null]}>
        <InstrumentIcon
          name={icon}
          size={15}
          color={status ? "#050505" : "#9a9a9a"}
        />
      </View>
      <View style={styles.textColumn}>
        <Text style={[styles.text, !status ? styles.textDisabled : null]}>
          {text}
        </Text>
        <Text style={styles.statusText}>
          {status ? "Ready to play" : "Not added"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: "row",
    minHeight: 62,
    alignItems: "center",
    borderRadius: 18,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "48%",
  },
  blockActive: {
    backgroundColor: "#f5f5f5",
    elevation: 5,
    shadowColor: "#bdbdbd",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },
  blockDisabled: {
    backgroundColor: "#e1e1e1",
    opacity: 0.7,
  },
  iconShell: {
    alignItems: "center",
    backgroundColor: "#eeeeee",
    borderRadius: 13,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  iconActive: {
    backgroundColor: "#d9ad26",
  },
  textColumn: {
    flex: 1,
  },
  text: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  textDisabled: {
    color: "#777777",
  },
  statusText: {
    color: "#747b8b",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
});
