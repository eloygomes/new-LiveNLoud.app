// app/_layout.tsx
import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { Stack } from "expo-router";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const applyAndroidNavigationBar = async () => {
      await SystemUI.setBackgroundColorAsync("#000000");
      await NavigationBar.setVisibilityAsync("visible");
      await NavigationBar.setPositionAsync("relative");
      await NavigationBar.setBehaviorAsync("inset-touch");
      await NavigationBar.setBackgroundColorAsync("#000000");
      await NavigationBar.setButtonStyleAsync("light");
      NavigationBar.setStyle("dark");
    };

    applyAndroidNavigationBar().catch((error) => {
      console.warn("Unable to style Android navigation bar", error);
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000000" } }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
