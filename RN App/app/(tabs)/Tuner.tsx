import { StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Btn from "@/components/Btn";

const Tuner = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <View style={styles.container}>
            <View style={styles.neumorphic}>
              <Text style={styles.title}>Tunner</Text>
            </View>
            <View style={styles.neumorphicMain}>
              <Text style={styles.mainNote}>C</Text>
              <Text style={styles.title}>{`<-----|----->`}</Text>
            </View>
            <View style={styles.neumorphicBottom}>
              <Btn title="Start Listen" goTo="#" />
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
};

export default Tuner;

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
    flex: 1,
    fontSize: 100,
    fontWeight: "600",
    textAlign: "center",
    paddingTop: 50,
    paddingBottom: 50,
  },

  row: { flexDirection: "row", gap: 12, marginBottom: 16 },

  pick: { flex: 1 },

  preview: { marginTop: 32, fontSize: 18, textAlign: "center" },
});
