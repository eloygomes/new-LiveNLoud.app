import React, { forwardRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { SelectPayload } from "@/components/FlatList/FlatList";

interface Props {
  selected: SelectPayload | null;
  onSubmit?: (instrumentName: string, link: string) => void;
  link: string;
  setLink: (link: string) => void;
}

const ActionSheetTemplate = forwardRef<ActionSheetRef, Props>(
  ({ selected, onSubmit, link, setLink }, ref) => {
    // estado local para edição (opcional)
    // const [link, setLink] = useState("");

    return (
      <ActionSheet ref={ref}>
        {selected ? (
          <View style={{ padding: 30, gap: 12 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              {`Add a new link for ${selected.instrument}`}
            </Text>
            <Text>{`Insert link from cifraclub`}</Text>

            {/* campo para link */}
            <TextInput
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              placeholder="insert the link here"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                padding: 8,
              }}
            />
            <TouchableOpacity
              style={{
                marginTop: 12,
                alignSelf: "flex-end",
                paddingVertical: 8,
                paddingHorizontal: 14,
                backgroundColor: "#e0e0e0",
                borderRadius: 8,
              }}
              onPress={() => {
                if (selected?.instrument && link?.trim()) {
                  onSubmit?.(selected.instrument as string, link.trim());
                }
                // hide the sheet via ref
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (ref as any)?.current?.hide?.();
              }}
            >
              <Text>Add</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 20 }}>
            <Text>No song selected</Text>
          </View>
        )}
      </ActionSheet>
    );
  }
);

ActionSheetTemplate.displayName = "ActionSheetTemplate";
export default ActionSheetTemplate;
