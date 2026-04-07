import React from "react";
import { StyleSheet, View } from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

export type InstrumentIconName =
  | "guitar"
  | "bass"
  | "piano-keys"
  | "drum"
  | "microphone";

type Props = {
  name: InstrumentIconName;
  size?: number;
  color?: string;
};

const fontAwesomeIconMap: Partial<Record<InstrumentIconName, string>> = {
  guitar: "guitar",
  drum: "drum",
  microphone: "microphone",
};

function BassIcon({ size, color }: Required<Pick<Props, "size" | "color">>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M14.2 1.5c3.8 0 6.2 3.3 5.1 6.8-.6 2-2 3.5-3.9 4.7l-.8.5 3.4 8.8H9.6l-1.7-1.2 4.2-12.8-2-1.1c.2-3.3 1.8-5.7 4.1-5.7Z"
        fill={color}
      />
      <Path
        d="m5.8 1.1-1.6.4-1 1.2.2 1.6 1.4 1 1.8-.8.8-1.6-.5-1.3-1.1-.5ZM4.3 7.3 2.8 8l-.6 1.5.7 1.4 1.5.5 1.6-1.1.4-1.7-1-1.1-1.1-.2ZM3.3 13.2l-1.6.6-.7 1.4.6 1.5 1.5.7 1.6-.9.5-1.7-.9-1.3-1-.3ZM2.6 18.9l-1.5.6-.6 1.4.6 1.5 1.5.6 1.6-.9.5-1.7-.9-1.3-1.2-.2Z"
        fill={color}
      />
      <Path
        d="m7.7 4.1 1.8 1M6.7 9.6l1.9.8M5.5 15.6l1.8.8M4.8 21l1.7.5"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
      <Circle cx={15.8} cy={5.1} fill="#ffffff" r={1.35} />
      <Circle cx={14.3} cy={9.8} fill="#ffffff" r={1.35} />
      <Circle cx={12.8} cy={14.5} fill="#ffffff" r={1.35} />
    </Svg>
  );
}

function PianoKeysIcon({
  size,
  color,
}: Required<Pick<Props, "size" | "color">>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      {[7.5, 12, 16.5].map((x) => (
        <Line
          key={x}
          x1={x}
          x2={x}
          y1={5.5}
          y2={18.5}
          stroke={color}
          strokeLinecap="round"
          strokeWidth={1.4}
        />
      ))}
      {[6, 10.5, 15].map((x) => (
        <Rect
          key={x}
          x={x}
          y={5}
          width={2.7}
          height={7.8}
          rx={0.8}
          fill={color}
        />
      ))}
    </Svg>
  );
}

export default function InstrumentIcon({
  name,
  size = 16,
  color = "#050505",
}: Props) {
  if (name === "bass") {
    return <BassIcon size={size} color={color} />;
  }

  if (name === "piano-keys") {
    return <PianoKeysIcon size={size} color={color} />;
  }

  return (
    <View style={styles.iconFix}>
      <FontAwesome5
        name={fontAwesomeIconMap[name] || "guitar"}
        size={size}
        color={color}
        solid
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconFix: {
    alignItems: "center",
    justifyContent: "center",
  },
});
