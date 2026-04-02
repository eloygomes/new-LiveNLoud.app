import * as React from "react";
import { ProgressBar, MD3Colors } from "react-native-paper";

const PBar = ({ progress, color }: { progress: number; color: string }) => (
  <ProgressBar progress={progress} color={color} />
);

export default PBar;
