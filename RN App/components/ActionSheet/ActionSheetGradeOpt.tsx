import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import PBar from "../ProgressBar/PBar";
import ActionSheetGradeOptBtn from "./ActionSheetGradeOptBtn";
import { Instruments } from "@/shared/types"; // Import the correct Instruments type

interface Props {
  song: string;
  artist: string;
  instruments: Instruments; // Use the strongly-typed Instruments
  progressBar: number; // progressBar as number
  songCifra: string;
  apiText: string;
}

const ActionSheetGradeOpt = ({
  song,
  artist,
  instruments,
  progressBar,
  songCifra,
}: Props) => {
  // console.log("ActionSheetGradeOpt", songCifra);
  return (
    <View style={styles.container}>
      <View style={styles.progressBarParent}>
        <View style={styles.progressionBarTitleParent}>
          <Text style={styles.progressionBarTitle}>Progression</Text>
          <Text style={styles.progressionBarTitle}>{progressBar}%</Text>
        </View>
        <PBar progress={progressBar / 100} color="#daa520" />
      </View>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 25 }}
      >
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Guitar 1"
          apiText="guitar01"
          type="normal"
          status={instruments.guitar01}
          songCifra={songCifra}
        />

        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Guitar 2"
          apiText="guitar02"
          type="normal"
          status={instruments.guitar02}
          songCifra={songCifra}
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Bass"
          apiText="bass"
          type="normal"
          status={instruments.bass}
          songCifra={songCifra}
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Keys"
          apiText="keys"
          type="normal"
          status={instruments.keys}
          songCifra={songCifra}
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Drums"
          apiText="drums"
          type="normal"
          status={instruments.drums}
          songCifra={songCifra}
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Vocals"
          apiText="voice"
          type="normal"
          status={instruments.voice}
          songCifra={songCifra}
        />
      </View>
      <View style={styles.grid2}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 30,
            paddingLeft: 10,
            paddingRight: 10,
            gap: 10,
            flex: 1,
          }}
        >
          <TouchableOpacity
            style={{
              // backgroundColor: BLUE,
              height: 48,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",

              flex: 1,

              borderWidth: 1,
              borderColor: "#daa520",
            }}
            // onPress={onLogin}
          >
            <Text style={{ color: "#daa520", fontWeight: "600" }}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              // backgroundColor: BLUE,
              height: 48,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#daa520",
              flex: 1,
            }}
            // onPress={onLogin}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ActionSheetGradeOpt;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  grid: {},
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  progressBarParent: {
    marginRight: 8,
    marginBottom: 20,
  },
  progressionBarTitleParent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressionBarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
