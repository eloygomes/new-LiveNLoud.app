import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";
import { io, Socket } from "socket.io-client";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  API_SOCKET_BASE_URL,
  getCurrentUserEmail,
} from "@/connect/connect";

const GOLD = "#d9ad26";
const PANEL = "#e0e0e0";
const SOFT = "#efefef";
const WHITE = "#ffffff";
const TEXT = "#080808";
const MUTED = "#697180";
const RED = "#ef4444";
const SOCKET_PATH = "/socket.io";
const MIN_UI_FREQ = 16.35;
const MAX_UI_FREQ = 4186.01;

type TunerMessage = {
  frequency?: number;
  freq?: number;
  note?: string;
  cents?: number;
};

function cleanNote(note: string) {
  return note.replace(/[0-9]/g, "") || "—";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function Gauge({ cents }: { cents: number }) {
  const needleDeg = clamp((cents / 50) * 50, -50, 50);

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={280} height={160} viewBox="0 0 280 160">
        <Path
          d="M30 138 A110 110 0 0 1 250 138"
          fill="none"
          stroke="#9ca3af"
          strokeWidth={2}
        />
        {Array.from({ length: 9 }).map((_, index) => {
          const angle = (-50 + (index * 100) / 8) * (Math.PI / 180);
          const innerRadius = index === 4 ? 86 : 94;
          const outerRadius = 110;
          const centerX = 140;
          const centerY = 138;
          const x1 = centerX + Math.sin(angle) * innerRadius;
          const y1 = centerY - Math.cos(angle) * innerRadius;
          const x2 = centerX + Math.sin(angle) * outerRadius;
          const y2 = centerY - Math.cos(angle) * outerRadius;
          return (
            <Line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={index === 4 ? TEXT : "#9ca3af"}
              strokeWidth={index === 4 ? 3 : 2}
              strokeLinecap="round"
            />
          );
        })}
        <SvgText x={42} y={124} fill={MUTED} fontSize={18} fontWeight="800">
          b
        </SvgText>
        <SvgText x={228} y={124} fill={MUTED} fontSize={18} fontWeight="800">
          #
        </SvgText>
      </Svg>
      <View
        style={[
          styles.needle,
          { transform: [{ rotate: `${needleDeg}deg` }] },
        ]}
      />
      <View style={styles.needleHub} />
    </View>
  );
}

export default function Tuner() {
  const socketRef = useRef<Socket | null>(null);
  const [isTuning, setIsTuning] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [displayNote, setDisplayNote] = useState("");
  const [liveFreq, setLiveFreq] = useState<number | null>(null);
  const [cents, setCents] = useState(0);

  const sideNotes = useMemo(() => {
    const active = cleanNote(displayNote);
    if (!displayNote) return ["A#", "B", "—", "C#", "D"];
    return ["A#", "B", active, "C#", "D"];
  }, [displayNote]);

  useEffect(() => {
    if (!isTuning) return undefined;
    let mounted = true;
    let socket: Socket | null = null;

    const connect = async () => {
      const email = await getCurrentUserEmail();
      if (!mounted) return;

      socket = io(API_SOCKET_BASE_URL, {
        path: SOCKET_PATH,
        transports: ["polling", "websocket"],
        query: { email },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        timeout: 20000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setServerOnline(true);
        console.log(`[${Platform.OS}] [tuner] socket connected`, socket?.id);
      });

      socket.on("connect_error", (error) => {
        setServerOnline(false);
        console.warn(`[${Platform.OS}] [tuner] socket error`, error?.message || error);
      });

      socket.on("disconnect", () => {
        setServerOnline(false);
      });

      socket.on("messageFromServer", (data: TunerMessage) => {
        if (!data) return;
        const freq = Number(data.frequency ?? data.freq);
        const noteName = typeof data.note === "string" ? data.note : "";

        if (!Number.isFinite(freq) || freq <= 0) return;
        if (freq < MIN_UI_FREQ || freq > MAX_UI_FREQ) return;

        setDisplayNote(noteName || "—");
        setLiveFreq(freq);
        setCents(clamp(Number(data.cents) || 0, -50, 50));
      });
    };

    connect().catch((error) => {
      console.warn(`[${Platform.OS}] [tuner] failed to connect`, error);
    });

    return () => {
      mounted = false;
      socket?.removeAllListeners();
      socket?.close();
      if (socketRef.current === socket) socketRef.current = null;
      setServerOnline(false);
    };
  }, [isTuning]);

  const toggleTuner = () => {
    if (isTuning) {
      setIsTuning(false);
      setDisplayNote("");
      setLiveFreq(null);
      setCents(0);
      return;
    }

    setIsTuning(true);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaProvider>
        <SafeAreaView
          style={styles.container}
          edges={Platform.OS === "android" ? ["top"] : ["top", "bottom"]}
        >
          <View style={styles.content}>
            <View style={styles.headerCard}>
              <Text style={styles.kicker}># SUSTENIDO</Text>
              <Text style={styles.title}>Tuner</Text>
              <Text style={styles.subtitle}>
                Backend-driven pitch display with the same gauge language as web.
              </Text>
            </View>

            <View style={styles.tunerCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusPill}>
                  {serverOnline ? "Server online" : isTuning ? "Connecting" : "Idle"}
                </Text>
                <Text style={styles.rangeText}>C0 to C8</Text>
              </View>

              <View style={styles.noteRow}>
                <Text style={styles.sideNote}>{sideNotes[0]}</Text>
                <Text style={[styles.sideNote, styles.sideNoteLarge]}>{sideNotes[1]}</Text>
                <Text style={styles.mainNote}>{sideNotes[2]}</Text>
                <Text style={[styles.sideNote, styles.sideNoteLarge]}>{sideNotes[3]}</Text>
                <Text style={styles.sideNote}>{sideNotes[4]}</Text>
              </View>

              <Text style={styles.frequencyText}>
                {liveFreq ? `${liveFreq.toFixed(1)} Hz` : "No pitch detected"}
              </Text>

              <Gauge cents={cents} />

              <View style={styles.centsRow}>
                <Text style={styles.centsLabel}>Flat</Text>
                <Text style={styles.centsValue}>{Math.round(cents)} cents</Text>
                <Text style={styles.centsLabel}>Sharp</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Mobile capture status</Text>
              <Text style={styles.infoText}>
                This screen is ready for backend tuner messages. Full mobile microphone capture needs a native audio input bridge; the web tuner uses browser Web Audio APIs that do not exist directly in React Native.
              </Text>
              <TouchableOpacity
                activeOpacity={0.84}
                style={[styles.primaryButton, isTuning && styles.primaryButtonActive]}
                onPress={toggleTuner}
              >
                <Text style={styles.primaryButtonText}>
                  {isTuning ? "Stop Listening" : "Start Listening"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    flex: 1,
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
    maxWidth: 315,
  },
  tunerCard: {
    alignItems: "center",
    backgroundColor: PANEL,
    borderRadius: 28,
    elevation: 8,
    padding: 18,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  statusPill: {
    backgroundColor: TEXT,
    borderRadius: 999,
    color: WHITE,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    textTransform: "uppercase",
  },
  rangeText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  noteRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 26,
  },
  sideNote: {
    color: MUTED,
    fontSize: 22,
    fontWeight: "900",
    opacity: 0.45,
  },
  sideNoteLarge: {
    fontSize: 32,
    opacity: 0.7,
  },
  mainNote: {
    color: RED,
    fontSize: 104,
    fontWeight: "900",
    letterSpacing: -4,
    lineHeight: 112,
  },
  frequencyText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  gaugeWrap: {
    alignItems: "center",
    height: 166,
    justifyContent: "center",
    marginTop: 8,
    width: 280,
  },
  needle: {
    backgroundColor: RED,
    bottom: 25,
    height: 114,
    position: "absolute",
    transformOrigin: "bottom",
    width: 3,
  },
  needleHub: {
    backgroundColor: TEXT,
    borderRadius: 999,
    bottom: 20,
    height: 14,
    position: "absolute",
    width: 14,
  },
  centsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    width: "100%",
  },
  centsLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  centsValue: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },
  infoCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    elevation: 8,
    padding: 16,
    shadowColor: "#b8b8b8",
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  infoTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 8,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: GOLD,
    borderRadius: 16,
    marginTop: 16,
    paddingVertical: 15,
  },
  primaryButtonActive: {
    backgroundColor: WHITE,
  },
  primaryButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
