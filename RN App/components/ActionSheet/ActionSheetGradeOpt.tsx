import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import React from "react";
import PBar from "../ProgressBar/PBar";
import ActionSheetGradeOptBtn from "./ActionSheetGradeOptBtn";
import { Instruments } from "@/shared/types"; // Import the correct Instruments type
import { useRouter } from "expo-router";
import { getAllUserData, getStoredUserEmail } from "@/connect/connect";
import { saveSongDraft, SongDraft } from "@/connect/songDraft";

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
  const router = useRouter();
  const [openingEdit, setOpeningEdit] = React.useState(false);

  const handleOpenEdit = async () => {
    if (openingEdit) {
      return;
    }

    setOpeningEdit(true);

    try {
      const email = await getStoredUserEmail();

      if (!email) {
        Alert.alert("Edit song", "User email not found. Please log in again.");
        return;
      }

      const allSongs = await getAllUserData({ email, artist: "", song: "" });
      const match = (Array.isArray(allSongs) ? allSongs : []).find(
        (item: any) => item?.song === song && item?.artist === artist
      );

      const draft: SongDraft = {
        artist: match?.artist || artist || "",
        song: match?.song || song || "",
        capo: match?.capo || "",
        tom: match?.tom || "",
        tuning: match?.tuning || "",
        instrumentLinks: {
          guitar01: match?.guitar01?.link || "",
          guitar02: match?.guitar02?.link || "",
          bass: match?.bass?.link || "",
          keys: match?.keys?.link || "",
          drums: match?.drums?.link || "",
          voice: match?.voice?.link || "",
        },
        videos: Array.isArray(match?.embedVideos) ? match.embedVideos : [],
        setlists: Array.isArray(match?.setlist) ? match.setlist : [],
        setlistOptions: Array.isArray(match?.setlist) ? match.setlist : [],
      };

      await saveSongDraft(draft);
      router.push("/EditSong");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open the edit page.";
      Alert.alert("Edit song", message);
    } finally {
      setOpeningEdit(false);
    }
  };

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
            onPress={handleOpenEdit}
            disabled={openingEdit}
          >
            {openingEdit ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Edit</Text>
            )}
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
