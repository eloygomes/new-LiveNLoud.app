import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#d9ad26";
const PANEL = "#e0e0e0";
const SOFT = "#efefef";
const WHITE = "#ffffff";
const TEXT = "#080808";
const MUTED = "#697180";

type Lap = {
  lapNumber: number;
  split: number;
  totalTime: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatClock(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatStopwatch(timeMs: number) {
  const minutes = Math.floor(timeMs / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);
  const hundredths = Math.floor((timeMs % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

function ControlButton({
  title,
  active = false,
  disabled = false,
  onPress,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      style={[
        styles.controlButton,
        active && styles.controlButtonActive,
        disabled && styles.controlButtonDisabled,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.controlButtonText,
          active && styles.controlButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [pulseStrength, setPulseStrength] = useState<"light" | "medium" | "heavy">("light");

  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);

  const beatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopwatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lapStartRef = useRef(0);

  const beatIntervalMs = useMemo(() => (60 / bpm) * 1000, [bpm]);

  const stopBeat = useCallback(() => {
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    beatIntervalRef.current = null;
    countdownIntervalRef.current = null;
    setIsOn(false);
  }, []);

  const playBeatFeedback = useCallback(() => {
    if (isMuted) return;
    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    Haptics.impactAsync(styleMap[pulseStrength]).catch(() => {});
  }, [isMuted, pulseStrength]);

  useEffect(() => {
    if (!isPlaying) {
      stopBeat();
      return;
    }

    stopBeat();
    setIsOn(true);
    playBeatFeedback();

    beatIntervalRef.current = setInterval(() => {
      setIsOn((current) => !current);
      playBeatFeedback();
    }, beatIntervalMs);

    if (timerEnabled) {
      setTimeLeft(timerDuration);
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((current) => {
          if (current <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }

    return stopBeat;
  }, [beatIntervalMs, isPlaying, playBeatFeedback, stopBeat, timerDuration, timerEnabled]);

  useEffect(() => {
    return () => {
      stopBeat();
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [stopBeat]);

  const updateBpm = (nextBpm: number) => {
    setBpm(clamp(nextBpm, 40, 240));
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const nextTapTimes = [...tapTimes, now].slice(-4);

    if (nextTapTimes.length >= 2) {
      const intervals = nextTapTimes
        .slice(1)
        .map((time, index) => time - nextTapTimes[index])
        .filter((interval) => interval > 120 && interval < 3000);

      if (intervals.length) {
        const average =
          intervals.reduce((total, interval) => total + interval, 0) /
          intervals.length;
        updateBpm(Math.round(60000 / average));
      }
    }

    setTapTimes(nextTapTimes);
    Haptics.selectionAsync().catch(() => {});
  };

  const toggleStopwatch = () => {
    if (stopwatchRunning) {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
      setStopwatchRunning(false);
      return;
    }

    const stopwatchStart = Date.now() - stopwatchTime;
    lapStartRef.current = Date.now() - lapTime;
    setStopwatchRunning(true);
    stopwatchIntervalRef.current = setInterval(() => {
      setStopwatchTime(Date.now() - stopwatchStart);
      setLapTime(Date.now() - lapStartRef.current);
    }, 30);
  };

  const handleLapOrReset = () => {
    if (stopwatchRunning) {
      setLaps((current) => [
        ...current,
        {
          lapNumber: current.length + 1,
          split: lapTime,
          totalTime: stopwatchTime,
        },
      ]);
      lapStartRef.current = Date.now();
      setLapTime(0);
      return;
    }

    setStopwatchTime(0);
    setLapTime(0);
    setLaps([]);
  };

  const displayedTime = timerEnabled && isPlaying ? timeLeft : timerDuration;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaProvider>
        <SafeAreaView
          style={styles.container}
          edges={Platform.OS === "android" ? ["top"] : ["top", "bottom"]}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerCard}>
              <Text style={styles.kicker}># SUSTENIDO</Text>
              <Text style={styles.title}>Metronome</Text>
              <Text style={styles.subtitle}>Choose your BPM, tap tempo, and keep time while rehearsing.</Text>
            </View>

            <View style={[styles.heroCard, isOn && styles.heroCardActive]}>
              <Text style={[styles.heroLabel, isOn && styles.heroTextActive]}>
                {isPlaying ? "Playing" : "Ready"}
              </Text>
              <Text style={[styles.bpmText, isOn && styles.heroTextActive]}>{bpm}</Text>
              <Text style={[styles.bpmLabel, isOn && styles.heroTextActive]}>BPM</Text>
            </View>

            <View style={styles.controlCard}>
              <View style={styles.stepRow}>
                <ControlButton title="-10" onPress={() => updateBpm(bpm - 10)} />
                <ControlButton title="-1" onPress={() => updateBpm(bpm - 1)} />
                <View style={styles.bpmPill}>
                  <Text style={styles.bpmPillText}>{bpm}</Text>
                </View>
                <ControlButton title="+1" onPress={() => updateBpm(bpm + 1)} />
                <ControlButton title="+10" onPress={() => updateBpm(bpm + 10)} />
              </View>

              <View style={styles.presetRow}>
                {[80, 100, 120, 140, 160, 180].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    activeOpacity={0.82}
                    style={[styles.presetChip, bpm === preset && styles.presetChipActive]}
                    onPress={() => updateBpm(preset)}
                  >
                    <Text style={[styles.presetText, bpm === preset && styles.presetTextActive]}>
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.mainActions}>
                <ControlButton
                  title={isPlaying ? "Stop" : "Play"}
                  active={isPlaying}
                  onPress={() => setIsPlaying((current) => !current)}
                />
                <ControlButton title="Tap Tempo" onPress={handleTapTempo} />
              </View>

              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleTitle}>Beat feedback</Text>
                  <Text style={styles.toggleSubtitle}>Uses haptics on mobile instead of the web click sound.</Text>
                </View>
                <Switch
                  value={!isMuted}
                  onValueChange={(value) => setIsMuted(!value)}
                  trackColor={{ false: "#c8ccd4", true: GOLD }}
                  thumbColor={SOFT}
                />
              </View>

              <View>
                <Text style={styles.sectionKicker}>Pulse strength</Text>
                <View style={styles.presetRow}>
                  {(["light", "medium", "heavy"] as const).map((strength) => (
                    <TouchableOpacity
                      key={strength}
                      activeOpacity={0.82}
                      style={[
                        styles.presetChip,
                        pulseStrength === strength && styles.presetChipActive,
                      ]}
                      onPress={() => setPulseStrength(strength)}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          pulseStrength === strength && styles.presetTextActive,
                        ]}
                      >
                        {strength}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.timerCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.sectionKicker}>Timer</Text>
                  <Text style={styles.timerText}>{formatClock(displayedTime)}</Text>
                </View>
                <Switch
                  value={timerEnabled}
                  onValueChange={(value) => {
                    setTimerEnabled(value);
                    if (!value) setTimeLeft(timerDuration);
                  }}
                  trackColor={{ false: "#c8ccd4", true: GOLD }}
                  thumbColor={SOFT}
                />
              </View>
              <View style={styles.mainActions}>
                <ControlButton
                  title="-10 sec"
                  onPress={() => {
                    const nextDuration = Math.max(timerDuration - 10, 10);
                    setTimerDuration(nextDuration);
                    setTimeLeft(nextDuration);
                  }}
                />
                <ControlButton
                  title="+10 sec"
                  onPress={() => {
                    const nextDuration = timerDuration + 10;
                    setTimerDuration(nextDuration);
                    setTimeLeft(nextDuration);
                  }}
                />
              </View>
            </View>

            <View style={styles.stopwatchCard}>
              <Text style={styles.sectionKicker}>Stopwatch</Text>
              <Text style={styles.stopwatchText}>{formatStopwatch(stopwatchTime)}</Text>
              <Text style={styles.lapText}>{formatStopwatch(lapTime)}</Text>
              <View style={styles.mainActions}>
                <ControlButton
                  title={stopwatchRunning ? "Lap" : "Reset"}
                  onPress={handleLapOrReset}
                />
                <ControlButton
                  title={stopwatchRunning ? "Stop" : "Start"}
                  active={stopwatchRunning}
                  onPress={toggleStopwatch}
                />
              </View>
              {laps.length ? (
                <View style={styles.lapList}>
                  {laps.slice(-6).reverse().map((lap) => (
                    <View key={lap.lapNumber} style={styles.lapRow}>
                      <Text style={styles.lapCell}>Lap {lap.lapNumber}</Text>
                      <Text style={styles.lapCell}>{formatStopwatch(lap.split)}</Text>
                      <Text style={styles.lapCell}>{formatStopwatch(lap.totalTime)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SOFT,
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 14,
    paddingBottom: 110,
  },
  headerCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    padding: 18,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  kicker: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  title: {
    color: TEXT,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase",
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 310,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 28,
    elevation: 8,
    paddingVertical: 30,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  heroCardActive: {
    backgroundColor: TEXT,
  },
  heroLabel: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroTextActive: {
    color: WHITE,
  },
  bpmText: {
    color: TEXT,
    fontSize: 112,
    fontWeight: "900",
    letterSpacing: -6,
    lineHeight: 122,
  },
  bpmLabel: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  controlCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    gap: 14,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  stepRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 16,
    elevation: 3,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
  },
  controlButtonActive: {
    backgroundColor: GOLD,
  },
  controlButtonDisabled: {
    opacity: 0.55,
  },
  controlButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  controlButtonTextActive: {
    color: TEXT,
  },
  bpmPill: {
    alignItems: "center",
    backgroundColor: TEXT,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  bpmPillText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "900",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    backgroundColor: SOFT,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  presetChipActive: {
    backgroundColor: GOLD,
  },
  presetText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "900",
  },
  presetTextActive: {
    color: TEXT,
  },
  mainActions: {
    flexDirection: "row",
    gap: 10,
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: SOFT,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  toggleTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "900",
  },
  toggleSubtitle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    maxWidth: 220,
  },
  timerCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    gap: 14,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionKicker: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  timerText: {
    color: TEXT,
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  stopwatchCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  stopwatchText: {
    color: TEXT,
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.6,
    marginTop: 8,
    textAlign: "center",
  },
  lapText: {
    color: MUTED,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
    marginTop: 4,
    textAlign: "center",
  },
  lapList: {
    backgroundColor: SOFT,
    borderRadius: 18,
    marginTop: 14,
    padding: 12,
  },
  lapRow: {
    borderBottomColor: "#d7d7d7",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 8,
  },
  lapCell: {
    color: TEXT,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
});
