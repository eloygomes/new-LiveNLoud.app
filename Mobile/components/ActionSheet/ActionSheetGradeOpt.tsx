import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import PBar from "../ProgressBar/PBar";
import ActionSheetGradeOptBtn from "./ActionSheetGradeOptBtn";
import { Instruments } from "@/shared/types"; // Import the correct Instruments type
import { useRouter } from "expo-router";
import { getAllUserData, getCurrentUserEmail } from "@/connect/connect";
import { saveSongDraft, SongDraft } from "@/connect/songDraft";

interface Props {
  song: string;
  artist: string;
  instruments?: Instruments; // Use the strongly-typed Instruments
  progressBar: number; // progressBar as number
  songCifra: string;
  apiText: string;
  instrumentData?: Partial<
    Record<
      keyof Instruments,
      {
        songCifra?: string;
        songChords?: string;
        songTabs?: string;
        songLyrics?: string;
      }
    >
  >;
}

const ActionSheetGradeOpt = ({
  song,
  artist,
  instruments,
  progressBar,
  songCifra,
  instrumentData,
}: Props) => {
  const router = useRouter();
  const [openingEdit, setOpeningEdit] = React.useState(false);
  const safeInstruments = instruments ?? {
    guitar01: false,
    guitar02: false,
    bass: false,
    keys: false,
    drums: false,
    voice: false,
  };
  const getInstrumentText = (key: keyof Instruments) => {
    const data = instrumentData?.[key];
    return (
      data?.songCifra ||
      data?.songChords ||
      data?.songTabs ||
      data?.songLyrics ||
      songCifra ||
      ""
    );
  };

  const handleOpenEdit = async () => {
    if (openingEdit) {
      return;
    }

    setOpeningEdit(true);

    try {
      const email = await getCurrentUserEmail();

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
          <View>
            <Text style={styles.sectionKicker}>Progression</Text>
            <Text style={styles.progressionTitle}>Practice progress</Text>
          </View>
          <View style={styles.progressValueBadge}>
            <Text style={styles.progressValueText}>{progressBar}%</Text>
          </View>
        </View>
        <PBar progress={progressBar / 100} color="#daa520" />
      </View>

      <View style={styles.instrumentHeader}>
        <Text style={styles.sectionKicker}>Open presentation</Text>
        <Text style={styles.instrumentHint}>Choose an available instrument</Text>
      </View>

      <View style={styles.instrumentGrid}>
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Guitar 1"
          apiText="guitar01"
          status={safeInstruments.guitar01}
          songCifra={getInstrumentText("guitar01")}
          icon="guitar"
        />

        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Guitar 2"
          apiText="guitar02"
          status={safeInstruments.guitar02}
          songCifra={getInstrumentText("guitar02")}
          icon="guitar"
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Bass"
          apiText="bass"
          status={safeInstruments.bass}
          songCifra={getInstrumentText("bass")}
          icon="bass"
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Keys"
          apiText="keys"
          status={safeInstruments.keys}
          songCifra={getInstrumentText("keys")}
          icon="piano-keys"
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Drums"
          apiText="drums"
          status={safeInstruments.drums}
          songCifra={getInstrumentText("drums")}
          icon="drum"
        />
        <ActionSheetGradeOptBtn
          song={song}
          artist={artist}
          text="Vocals"
          apiText="voice"
          status={safeInstruments.voice}
          songCifra={getInstrumentText("voice")}
          icon="microphone"
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.8}>
          <Text style={styles.secondaryActionText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={handleOpenEdit}
          disabled={openingEdit}
          activeOpacity={0.85}
        >
          {openingEdit ? (
            <ActivityIndicator color="#050505" />
          ) : (
            <Text style={styles.primaryActionText}>Edit song</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActionSheetGradeOpt;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 6,
  },
  progressBarParent: {
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    elevation: 4,
    marginBottom: 14,
    padding: 14,
    shadowColor: "#c8c8c8",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  progressionBarTitleParent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionKicker: {
    color: "#d3a82c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  progressionTitle: {
    color: "#050505",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  progressValueBadge: {
    backgroundColor: "#050505",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  progressValueText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  instrumentHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  instrumentHint: {
    color: "#626878",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  instrumentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: "#d9ad26",
    borderRadius: 16,
    elevation: 4,
    flex: 1,
    height: 50,
    justifyContent: "center",
    shadowColor: "#b99222",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  primaryActionText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderColor: "#d9ad26",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    height: 50,
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#a27b13",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
