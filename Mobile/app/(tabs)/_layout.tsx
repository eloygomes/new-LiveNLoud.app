/* app/(tabs)/_layout.tsx */
import React, { useRef } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";

import { HapticTab } from "@/components/HapticTab";
import NotificationBell from "@/components/NotificationBell";

const TOOL_LINKS = [
  {
    title: "Chord Library",
    icon: "library" as const,
    route: "/(tabs)/ChordLibrary" as const,
  },
  {
    title: "Tuner",
    icon: "radio" as const,
    route: "/(tabs)/Tuner" as const,
  },
  {
    title: "Metronome",
    icon: "speedometer" as const,
    route: "/(tabs)/Metronome" as const,
  },
  {
    title: "Calendar",
    icon: "calendar" as const,
    route: "/(tabs)/Calendar" as const,
  },
];

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const toolsSheetRef = useRef<ActionSheetRef>(null);

  /* -------- StatusBar global (vale para todas as telas) -------- */
  const barStyle = colorScheme === "dark" ? "light-content" : "dark-content";
  const tabBackground = "#000";

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
            backgroundColor: tabBackground,
            borderTopColor: "#000",
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
          name="Plus"
          options={{
            title: "Plus",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Tools"
          options={{
            title: "Tools",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="construct" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab
                {...props}
                onPress={() => {
                  toolsSheetRef.current?.show();
                }}
              />
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
        <Tabs.Screen
          name="ChordLibrary"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="Tuner"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="Metronome"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="Calendar"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <NotificationBell />

      <ActionSheet
        ref={toolsSheetRef}
        containerStyle={{
          ...styles.sheetContainer,
          backgroundColor: colorScheme === "dark" ? "#151515" : "#efefef",
        }}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHandle} />
          <Text
            style={[
              styles.sheetTitle,
              { color: colorScheme === "dark" ? "#fff" : "#111" },
            ]}
          >
            Tools
          </Text>
          <Text
            style={[
              styles.sheetSubtitle,
              { color: colorScheme === "dark" ? "#aaa" : "#666" },
            ]}
          >
            Choose a music tool or open your calendar.
          </Text>

          <View style={styles.toolList}>
            {TOOL_LINKS.map((tool) => (
              <TouchableOpacity
                key={tool.route}
                style={[
                  styles.toolButton,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#050505" : "#fff",
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  toolsSheetRef.current?.hide();
                  router.push(tool.route as never);
                }}
              >
                <View style={styles.toolIcon}>
                  <Ionicons name={tool.icon} size={20} color="#111" />
                </View>
                <Text
                  style={[
                    styles.toolButtonText,
                    { color: colorScheme === "dark" ? "#fff" : "#111" },
                  ]}
                >
                  {tool.title}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colorScheme === "dark" ? "#aaa" : "#777"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ActionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#cfcfcf",
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  toolList: {
    gap: 12,
    marginTop: 22,
  },
  toolButton: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  toolIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#daa520",
    alignItems: "center",
    justifyContent: "center",
  },
  toolButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
});
