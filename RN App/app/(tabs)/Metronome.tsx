import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Btn from "@/components/Btn";
import { router } from "expo-router";

type Props = {
  title: string;
};

const BtnFromHere = ({ title }: Props) => (
  <>
    <TouchableOpacity onPress={() => router.push("/")}>
      <View style={styles.btn}>
        <Text style={styles.Btntitle}>{title}</Text>
      </View>
    </TouchableOpacity>
    ;
  </>
);

const Metronome = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <View style={styles.container}>
            <View style={styles.neumorphic}>
              <Text style={styles.title}>Metronome</Text>
            </View>
            <View style={styles.neumorphicMain1}>
              <View>
                <Text style={styles.mainNote}>120</Text>
                <Text style={styles.title}>BPM</Text>
                <Btn title="Start" goTo="#" />
              </View>
            </View>
            <View style={styles.neumorphicMain}>
              <View>
                <Text style={styles.mainTime}>00:00,00</Text>
                <Text style={styles.title}>BPM</Text>
                <View
                  style={{ flexDirection: "row", justifyContent: "center" }}
                >
                  <BtnFromHere title="Lap" />
                  <BtnFromHere title="Start" />
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
};

export default Metronome;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },

  neumorphic: {
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    padding: 12,
    marginBottom: 24,
    shadowColor: "#e0e0e0cf",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },

  neumorphicMain: {
    flex: 1,
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
  neumorphicMain1: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    padding: 12,
    marginBottom: 24,
    shadowColor: "#e0e0e0cf",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },

  neumorphicBottom: {
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

  mainNote: {
    fontSize: 100,
    fontWeight: "600",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  mainTime: {
    fontSize: 50,
    fontWeight: "600",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },

  row: { flexDirection: "row", gap: 12, marginBottom: 16 },

  pick: { flex: 1 },

  preview: { marginTop: 32, fontSize: 18, textAlign: "center" },

  btn: {
    padding: 8,
    borderRadius: 8,
    margin: 16,
    backgroundColor: "goldenrod",
  },
  Btntitle: {
    fontSize: 24,
    color: "black",
    paddingHorizontal: 30,
    paddingVertical: 2,
    fontWeight: "bold",
    textAlign: "center",
  },
});
