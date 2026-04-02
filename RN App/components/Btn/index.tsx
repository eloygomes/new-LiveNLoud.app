import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

type Props = {
  title: string;
  goTo: any;
};

export default function Btn({ title, goTo = "#" }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push(goTo)}>
      <View style={styles.btn}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 8,
    borderRadius: 8,
    margin: 16,
    backgroundColor: "goldenrod",
  },
  title: {
    fontSize: 24,
    color: "black",
    paddingHorizontal: 100,
    paddingVertical: 2,
    fontWeight: "bold",
    textAlign: "center",
  },
});
