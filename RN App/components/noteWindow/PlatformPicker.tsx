// components/PlatformPicker.tsx
import React from "react";
import {
  Platform,
  Pressable,
  Text,
  ActionSheetIOS,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

type Item = { label: string; value: string };
type Props = {
  value: string;
  onChange: (v: string) => void;
  items: Item[];
  style?: ViewStyle;
};

export default function PlatformPicker({
  value,
  onChange,
  items,
  style,
}: Props) {
  /** ANDROID – usa picker nativo dropdown */
  if (Platform.OS === "android") {
    return (
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={[styles.androidPick, style]}
      >
        {items.map((it) => (
          <Picker.Item key={it.value} {...it} />
        ))}
      </Picker>
    );
  }

  /** iOS – botão + ActionSheet */
  const current = items.find((i) => i.value === value)?.label ?? "—";

  const openSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: items.map((i) => i.label).concat("Cancelar"),
        cancelButtonIndex: items.length,
      },
      (idx) => {
        if (idx < items.length) onChange(items[idx].value);
      }
    );
  };

  return (
    <Pressable style={[styles.iosButton, style]} onPress={openSheet}>
      <Text style={styles.iosText}>{current}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  androidPick: {
    flex: 1,
    color: "#000",
    // height: 44,
  },
  iosButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#dbdbdb",
    justifyContent: "center",
    alignItems: "center",
  },
  iosText: { fontSize: 16, color: "#000" },
});
