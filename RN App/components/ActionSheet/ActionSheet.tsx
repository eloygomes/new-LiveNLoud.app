import React, { forwardRef } from "react";
import { View, Text } from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import ActionSheetGradeOpt from "./ActionSheetGradeOpt";
import { SelectPayload } from "@/components/FlatList/FlatList";

interface Props {
  selected: SelectPayload | null;
}

const ActionSheetTemplate = forwardRef<ActionSheetRef, Props>(
  ({ selected }, ref) => (
    <ActionSheet ref={ref}>
      {selected ? (
        <>
          <View style={{ padding: 20 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              {selected.song}
            </Text>
            <Text>{selected.artist}</Text>
          </View>
          {/* Now we pass both instruments and progressBar from selected */}
          <ActionSheetGradeOpt
            song={selected.song ?? ""}
            artist={selected.artist ?? ""}
            instruments={selected.instruments!}
            progressBar={selected.progressBar ?? 0}
            songCifra={selected.songCifra ?? ""}
            apiText={""}
          />
        </>
      ) : (
        <View style={{ padding: 20 }}>
          <Text>No song selected</Text>
        </View>
      )}
    </ActionSheet>
  )
);

ActionSheetTemplate.displayName = "ActionSheetTemplate";
export default ActionSheetTemplate;
