import { StyleSheet, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

type Props = {
  text: string;
  type?: "normal" | "edit" | "delete";
  status?: boolean;
  apiText: string; // instrumento
  songCifra: string; // cifra em texto
  song: string; // título
  artist: string; // artista
};

export default function ActionSheetGradeOptBtn({
  text,
  type = "normal",
  status,
  apiText,
  songCifra,
  song,
  artist,
}: Props) {
  const router = useRouter(); // minúsculo por convenção

  const backgroundColor =
    type === "edit" ? "#239500" : type === "delete" ? "#ff0000" : "#E0E0E0";
  const textColor = type === "edit" || type === "delete" ? "#fff" : "#000";

  return (
    <TouchableOpacity
      disabled={!status}
      style={[styles.block, { backgroundColor, opacity: !status ? 0.4 : 1 }]}
      onPress={() => {
        // 1. monte os params
        const params = { song, artist, instrument: apiText, songCifra };

        // 2. empurre **/Presentation** (o grupo (presentation) NÃO entra na URL)
        router.push({ pathname: "/Presentation", params });
      }}
    >
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    width: "48%",
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  text: { fontSize: 18, fontWeight: "bold" },
});
