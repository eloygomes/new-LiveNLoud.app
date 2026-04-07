import React, { forwardRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Close from "react-native-vector-icons/FontAwesome";

type PresentationMode = "full" | "tabs" | "chords" | "lyrics";
type InstrumentKey =
  | "guitar01"
  | "guitar02"
  | "bass"
  | "keys"
  | "drums"
  | "voice";

interface Props {
  activeInstrument: InstrumentKey;
  availableInstruments: InstrumentKey[];
  embedLinks: string[];
  contentMode: PresentationMode;
  fontSize: number;
  isAutoScrolling: boolean;
  onChangeInstrument: (value: InstrumentKey) => void;
  onChangeMode: (value: PresentationMode) => void;
  onDecreaseFont: () => void;
  onIncreaseFont: () => void;
  onDecreaseScroll: () => void;
  onIncreaseScroll: () => void;
  onToggleAutoScroll: () => void;
}

const WEB_GOLD = "#d9ad26";
const WEB_PANEL = "#E0E0E0";
const WEB_SOFT = "#f0f0f0";
const WEB_TEXT = "#000000";
const WEB_MUTED = "#6b7280";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const instrumentLabels: Record<InstrumentKey, string> = {
  guitar01: "G1",
  guitar02: "G2",
  bass: "B",
  keys: "K",
  drums: "D",
  voice: "V",
};

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
        <Text style={styles.sectionHeaderIcon}>{expanded ? "−" : "+"}</Text>
      </TouchableOpacity>
      {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

const ActionSheetPres = forwardRef<ActionSheetRef, Props>(
  (
    {
      activeInstrument,
      availableInstruments,
      embedLinks,
      contentMode,
      fontSize,
      isAutoScrolling,
      onChangeInstrument,
      onChangeMode,
      onDecreaseFont,
      onIncreaseFont,
      onDecreaseScroll,
      onIncreaseScroll,
      onToggleAutoScroll,
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState<string | null>(null);

    const toggleSection = (key: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded((current) => (current === key ? null : key));
    };

    const closeSheet = () => {
      if (typeof ref === "object" && ref && "current" in ref) {
        ref.current?.hide();
      }
    };

    return (
      <ActionSheet ref={ref} containerStyle={styles.sheetContainer}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>ToolBox</Text>
            <TouchableOpacity
              onPress={closeSheet}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Close name="close" size={28} color={WEB_TEXT} />
            </TouchableOpacity>
          </View>

          <Section
            title="Editor"
            expanded={expanded === "editor"}
            onToggle={() => toggleSection("editor")}
          >
            <View style={styles.columnGap}>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Start editing</Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section
            title="Font Size"
            expanded={expanded === "font-size"}
            onToggle={() => toggleSection("font-size")}
          >
            <View style={styles.rowGap}>
              <TouchableOpacity style={styles.controlButton} onPress={onDecreaseFont}>
                <Text style={styles.controlText}>A-</Text>
              </TouchableOpacity>
              <View style={styles.valueCard}>
                <Text style={styles.valueText}>{fontSize}pt</Text>
              </View>
              <TouchableOpacity style={styles.controlButton} onPress={onIncreaseFont}>
                <Text style={styles.controlText}>A+</Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section
            title="Instruments"
            expanded={expanded === "instruments"}
            onToggle={() => toggleSection("instruments")}
          >
            <View style={styles.rowWrap}>
              {(Object.keys(instrumentLabels) as InstrumentKey[]).map((item) => {
                const active = item === activeInstrument;
                const enabled = availableInstruments.includes(item);

                return (
                  <TouchableOpacity
                    key={item}
                    disabled={!enabled}
                    style={[
                      styles.squareButton,
                      active && enabled && styles.goldButton,
                      !enabled && styles.disabledSquareButton,
                    ]}
                    onPress={() => onChangeInstrument(item)}
                  >
                    <Text
                      style={[
                        styles.squareButtonText,
                        active && enabled && styles.goldButtonText,
                        !enabled && styles.disabledText,
                      ]}
                    >
                      {instrumentLabels[item]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          <Section
            title="Videos"
            expanded={expanded === "videos"}
            onToggle={() => toggleSection("videos")}
          >
            <Text style={styles.helper}>
              {embedLinks.length > 0
                ? `${embedLinks.length} video link(s) available for this song.`
                : "No videos linked yet."}
            </Text>
            <View style={styles.columnGap}>
              {embedLinks.length > 0 ? (
                embedLinks.map((_, index) => (
                  <TouchableOpacity key={index} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{`video ${index + 1}`}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity style={[styles.secondaryButton, styles.disabledButton]}>
                  <Text style={styles.disabledText}>No video available</Text>
                </TouchableOpacity>
              )}
            </View>
          </Section>

          <Section
            title="Highlight"
            expanded={expanded === "highlight"}
            onToggle={() => toggleSection("highlight")}
          >
            <View style={styles.columnGap}>
              {[
                { key: "full", label: "original" },
                { key: "tabs", label: "tabs" },
                { key: "chords", label: "notes" },
                { key: "lyrics", label: "lyrics" },
              ].map((item) => {
                const active = contentMode === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.secondaryButton, active && styles.goldButton]}
                    onPress={() => onChangeMode(item.key as PresentationMode)}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        active && styles.goldButtonText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          <Section
            title="Tools"
            expanded={expanded === "tools"}
            onToggle={() => toggleSection("tools")}
          >
            <View style={styles.columnGap}>
              <View style={styles.rowGap}>
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Tuner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Metronome</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Chord Library</Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section
            title="Scrolling"
            expanded={expanded === "scrolling"}
            onToggle={() => toggleSection("scrolling")}
          >
            <View style={styles.columnGap}>
              <View style={styles.rowGap}>
                <TouchableOpacity style={styles.controlButton} onPress={onDecreaseScroll}>
                  <Text style={styles.controlText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, isAutoScrolling && styles.goldButton]}
                  onPress={onToggleAutoScroll}
                >
                  <Text
                    style={[styles.controlText, isAutoScrolling && styles.goldButtonText]}
                  >
                    {isAutoScrolling ? "Stop" : "Start"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={onIncreaseScroll}>
                  <Text style={styles.controlText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helper}>
                Scroll controls are available here. We can refine behavior next.
              </Text>
            </View>
          </Section>
        </View>
      </ActionSheet>
    );
  }
);

ActionSheetPres.displayName = "ActionSheetPres";

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  container: {
    padding: 20,
    backgroundColor: "#F0F0F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontWeight: "800",
    fontSize: 24,
    color: WEB_TEXT,
  },
  closeButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: WEB_PANEL,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionWrap: {
    marginBottom: 10,
  },
  sectionHeader: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: WEB_PANEL,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: WEB_TEXT,
  },
  sectionHeaderIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: WEB_TEXT,
  },
  sectionBody: {
    backgroundColor: WEB_PANEL,
    borderRadius: 8,
    marginTop: 8,
    padding: 12,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rowGap: {
    flexDirection: "row",
    gap: 8,
  },
  columnGap: {
    gap: 8,
  },
  squareButton: {
    width: "30%",
    minWidth: 58,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: WEB_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  squareButtonText: {
    color: WEB_TEXT,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: WEB_SOFT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: WEB_TEXT,
  },
  controlButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: WEB_SOFT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  controlText: {
    fontSize: 16,
    fontWeight: "700",
    color: WEB_TEXT,
  },
  valueCard: {
    minHeight: 40,
    minWidth: 80,
    borderRadius: 8,
    backgroundColor: WEB_SOFT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "700",
    color: WEB_TEXT,
  },
  helper: {
    color: WEB_MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  goldButton: {
    backgroundColor: WEB_GOLD,
  },
  goldButtonText: {
    color: WEB_TEXT,
    fontWeight: "800",
  },
  disabledSquareButton: {
    opacity: 0.45,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: WEB_MUTED,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ActionSheetPres;
