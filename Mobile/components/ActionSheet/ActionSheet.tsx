import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import ActionSheetGradeOpt from "./ActionSheetGradeOpt";
import { SelectPayload } from "@/components/FlatList/FlatList";

interface Props {
  selected: SelectPayload | null;
}

const ActionSheetTemplate = forwardRef<ActionSheetRef, Props>(
  ({ selected }, ref) => (
    <ActionSheet
      ref={ref}
      containerStyle={styles.sheet}
      gestureEnabled
      indicatorStyle={styles.indicator}
      defaultOverlayOpacity={0.22}
    >
      {selected ? (
        <View style={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.kicker}># SUSTENIDO</Text>
            <Text numberOfLines={2} style={styles.title}>
              {selected.song}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {selected.artist}
            </Text>
          </View>

          <ActionSheetGradeOpt
            song={selected.song ?? ""}
            artist={selected.artist ?? ""}
            instruments={selected.instruments}
            progressBar={selected.progressBar ?? 0}
            songCifra={selected.songCifra ?? ""}
            apiText={""}
            instrumentData={{
              guitar01: selected.guitar01,
              guitar02: selected.guitar02,
              bass: selected.bass,
              keys: selected.keys,
              drums: selected.drums,
              voice: selected.voice,
            }}
          />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No song selected</Text>
        </View>
      )}
    </ActionSheet>
  )
);

ActionSheetTemplate.displayName = "ActionSheetTemplate";
export default ActionSheetTemplate;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 12,
  },
  indicator: {
    backgroundColor: "#c8c8c8",
    height: 5,
    marginTop: 8,
    width: 46,
  },
  content: {
    padding: 14,
    paddingTop: 8,
  },
  headerCard: {
    backgroundColor: "#e8e8e8",
    borderRadius: 22,
    elevation: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  kicker: {
    color: "#d3a82c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: "#050505",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
    textTransform: "uppercase",
  },
  artist: {
    color: "#626878",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 28,
  },
  emptyText: {
    color: "#626878",
    fontWeight: "800",
  },
});
