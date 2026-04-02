/* app/(tabs)/_layout.tsx */
import React from "react";
import { StatusBar, useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  /* -------- StatusBar global (vale para todas as telas) -------- */
  const barStyle = colorScheme === "dark" ? "light-content" : "dark-content";

  return (
    <>
      <StatusBar
        translucent /* fica sobre o conteúdo */
        backgroundColor="transparent"
        barStyle={barStyle}
      />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          // tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarActiveTintColor: "#daa520",
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          },
        }}
      >
        <Tabs.Screen
          name="Songlist"
          options={{
            title: "Songlist",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ChordLibrary"
          options={{
            title: "Chord Library",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Plus"
          options={{
            title: "Plus",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Tuner"
          options={{
            title: "Tuner",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="radio" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Metronome"
          options={{
            title: "Metronome",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="User"
          options={{
            title: "User",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
