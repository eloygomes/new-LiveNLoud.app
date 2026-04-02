import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  clearAuthSession,
  getAllUserData,
  getStoredUserEmail,
  loadSelectedSetlists,
} from "../../connect/connect";

const GOLD = "#d9ad26";
const PANEL = "#E0E0E0";
const PANEL_SOFT = "#f0f0f0";
const BORDER = "#d1d5db";
const TEXT = "#000000";
const MUTED = "#6b7280";
const DANGER = "#b42318";

const MENU_OPTIONS = ["USER INFO", "USER DATA", "SETTINGS", "LOGS"] as const;

type MenuOption = (typeof MENU_OPTIONS)[number];

type SongEntry = {
  song?: string;
  artist?: string;
  progressBar?: number | string;
  addedIn?: string;
  updateIn?: string;
  email?: string;
  username?: string;
  fullName?: string;
  instruments?: {
    guitar01?: boolean;
    guitar02?: boolean;
    bass?: boolean;
    keys?: boolean;
    drums?: boolean;
    voice?: boolean;
  };
  guitar01?: { lastPlay?: string | string[] };
  guitar02?: { lastPlay?: string | string[] };
  bass?: { lastPlay?: string | string[] };
  keys?: { lastPlay?: string | string[] };
  drums?: { lastPlay?: string | string[] };
  voice?: { lastPlay?: string | string[] };
};

const instrumentMeta = [
  { key: "guitar01", label: "Guitar 01", short: "G1" },
  { key: "guitar02", label: "Guitar 02", short: "G2" },
  { key: "bass", label: "Bass", short: "B" },
  { key: "keys", label: "Keys", short: "K" },
  { key: "drums", label: "Drums", short: "D" },
  { key: "voice", label: "Voice", short: "V" },
] as const;

const User = () => {
  const [selectedTab, setSelectedTab] = useState<MenuOption>("USER INFO");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState("");
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);
  const [usbEnabled, setUsbEnabled] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [language, setLanguage] = useState<"ENG" | "BRA">("ENG");

  const loadUserHub = useCallback(async () => {
    const storedEmail = (await getStoredUserEmail()) ?? "";
    setEmail(storedEmail);

    const [userdata, setlists] = await Promise.all([
      storedEmail ? getAllUserData({ email: storedEmail, artist: "", song: "" }) : [],
      loadSelectedSetlists(),
    ]);

    setSongs(Array.isArray(userdata) ? userdata : []);
    setSelectedSetlists(Array.isArray(setlists) ? setlists : []);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await loadUserHub();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [loadUserHub]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUserHub();
    } finally {
      setRefreshing(false);
    }
  }, [loadUserHub]);

  const profile = useMemo(() => {
    const firstSong = songs[0] ?? {};
    return {
      username: firstSong.username || "User",
      fullName: firstSong.fullName || "LiveNLoud User",
      email: firstSong.email || email || "No email found",
    };
  }, [email, songs]);

  const averageProgression = useMemo(() => {
    if (!songs.length) return 0;

    const total = songs.reduce((sum, item) => {
      const value =
        typeof item.progressBar === "string"
          ? Number(item.progressBar)
          : item.progressBar ?? 0;
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    return Math.round(total / songs.length);
  }, [songs]);

  const songsByInstrument = useMemo(() => {
    return instrumentMeta.reduce<Record<string, number>>((acc, instrument) => {
      acc[instrument.key] = songs.filter(
        (song) => song.instruments?.[instrument.key]
      ).length;
      return acc;
    }, {});
  }, [songs]);

  const lastPlayed = useMemo(() => {
    const dates: number[] = [];

    songs.forEach((entry) => {
      instrumentMeta.forEach((instrument) => {
        const rawLastPlay = entry[instrument.key]?.lastPlay;

        if (Array.isArray(rawLastPlay)) {
          rawLastPlay.forEach((value) => {
            const parsed = new Date(value).getTime();
            if (!Number.isNaN(parsed)) {
              dates.push(parsed);
            }
          });
          return;
        }

        if (typeof rawLastPlay === "string" && rawLastPlay.trim()) {
          const parsed = new Date(rawLastPlay).getTime();
          if (!Number.isNaN(parsed)) {
            dates.push(parsed);
          }
        }
      });
    });

    if (!dates.length) {
      return "N/A";
    }

    return new Date(Math.max(...dates)).toLocaleString();
  }, [songs]);

  const addedIn = useMemo(() => songs[0]?.addedIn || "N/A", [songs]);

  const handleExportUserData = async () => {
    try {
      await Share.share({
        title: "LiveNLoud User Data",
        message: JSON.stringify(
          {
            profile,
            songsCount: songs.length,
            selectedSetlists,
            averageProgression,
            songsByInstrument,
            songs,
          },
          null,
          2
        ),
      });
    } catch {
      Alert.alert("User Data", "Unable to export user data right now.");
    }
  };

  const handleSoon = (label: string) => {
    Alert.alert(label, "This action will be added in the next step.");
  };

  const handleEditNickname = () => {
    Alert.alert("Nickname", "Nickname editing will be added next.");
  };

  const handleEditPassword = () => {
    router.push({
      pathname: "/(login)/ChangePassword",
      params: email ? { email } : undefined,
    });
  };

  const handleSignOut = async () => {
    await clearAuthSession();
    router.replace("/(login)/Login");
  };

  const renderFieldCard = (
    label: string,
    value: string,
    action?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }
  ) => (
    <View style={styles.infoCard}>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {action ? (
        <TouchableOpacity style={styles.editButton} onPress={action.onPress}>
          <Ionicons name={action.icon} size={18} color={TEXT} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderUserInfo = () => (
    <>
      <View style={styles.heroCard}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.avatar}
        />
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>Select your profile image</Text>
          <Text style={styles.heroBody}>
            Tap the avatar to choose and upload a profile image later. For now,
            this keeps the same user hub structure from the web version.
          </Text>
          <Text style={styles.heroHint}>
            Valid formats: JPG, JPEG, PNG, GIF. Recommended size up to 500x500.
          </Text>
        </View>
      </View>

      {renderFieldCard("nickname", `@${profile.username}`, {
        icon: "create-outline",
        onPress: handleEditNickname,
      })}
      {renderFieldCard("user email", profile.email)}
      {renderFieldCard("password", "************", {
        icon: "create-outline",
        onPress: handleEditPassword,
      })}
    </>
  );

  const renderUserData = () => (
    <>
      <View style={styles.actionCard}>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>User Data</Text>
          <Text style={styles.actionSubtitle}>All user data</Text>
          <Text style={styles.actionDescription}>
            Download the data currently stored for your account in the platform.
          </Text>
        </View>
        <TouchableOpacity style={styles.secondaryCta} onPress={handleExportUserData}>
          <Text style={styles.secondaryCtaText}>Download</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>Platform User Data</Text>
          <Text style={styles.actionSubtitle}>Delete all songs</Text>
          <Text style={styles.actionDescription}>
            Remove all songs from your account. This action is visible here from
            the web version but still pending in RN.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dangerCta}
          onPress={() => handleSoon("Delete all songs")}
        >
          <Text style={styles.dangerCtaText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>User Account</Text>
          <Text style={styles.actionSubtitle}>Delete account</Text>
          <Text style={styles.actionDescription}>
            Delete your user account and all platform data. This remains visible
            for parity with web and can be connected later.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dangerCta}
          onPress={() => handleSoon("Delete account")}
        >
          <Text style={styles.dangerCtaText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSettings = () => (
    <>
      <View style={styles.settingCard}>
        <View style={styles.settingTextWrap}>
          <Text style={styles.actionTitle}>USB Devices</Text>
          <Text style={styles.actionSubtitle}>USB Devices connection</Text>
          <Text style={styles.actionDescription}>
            Manage USB devices connected to the system.
          </Text>
        </View>
        <Switch
          value={usbEnabled}
          onValueChange={setUsbEnabled}
          trackColor={{ false: "#c8ccd4", true: GOLD }}
          thumbColor={PANEL_SOFT}
        />
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingTextWrap}>
          <Text style={styles.actionTitle}>Language</Text>
          <Text style={styles.actionSubtitle}>System language</Text>
          <Text style={styles.actionDescription}>
            Select the preferred language for the system display.
          </Text>
        </View>
        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === "ENG" && styles.languageButtonActive,
            ]}
            onPress={() => setLanguage("ENG")}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === "ENG" && styles.languageButtonTextActive,
              ]}
            >
              ENG
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === "BRA" && styles.languageButtonActive,
            ]}
            onPress={() => setLanguage("BRA")}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === "BRA" && styles.languageButtonTextActive,
              ]}
            >
              BRA
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingTextWrap}>
          <Text style={styles.actionTitle}>Bluetooth</Text>
          <Text style={styles.actionSubtitle}>Bluetooth connection</Text>
          <Text style={styles.actionDescription}>
            Manage bluetooth devices connected to the system.
          </Text>
        </View>
        <Switch
          value={bluetoothEnabled}
          onValueChange={setBluetoothEnabled}
          trackColor={{ false: "#c8ccd4", true: GOLD }}
          thumbColor={PANEL_SOFT}
        />
      </View>
    </>
  );

  const renderLogs = () => (
    <>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Added in</Text>
          <Text style={styles.metricValue}>{addedIn}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Last time played</Text>
          <Text style={styles.metricValue}>{lastPlayed}</Text>
        </View>
      </View>

      <View style={styles.metricCardWide}>
        <View style={styles.progressHeader}>
          <Text style={styles.actionTitle}>Progression</Text>
          <Text style={styles.progressValue}>{averageProgression}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(0, Math.min(averageProgression, 100))}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.metricCardWide}>
        <Text style={styles.actionTitle}>Songs by instruments</Text>
        <View style={styles.instrumentGrid}>
          {instrumentMeta.map((instrument) => (
            <View key={instrument.key} style={styles.instrumentStat}>
              <Text style={styles.instrumentStatKey}>{instrument.short}</Text>
              <Text style={styles.instrumentStatValue}>
                {songsByInstrument[instrument.key] ?? 0}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case "USER DATA":
        return renderUserData();
      case "SETTINGS":
        return renderSettings();
      case "LOGS":
        return renderLogs();
      case "USER INFO":
      default:
        return renderUserInfo();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.headerTitle}>USER HUB</Text>
            <Text style={styles.headerSubtitle}>Hello @{profile.username}</Text>
          </View>
          <View style={styles.headerBadge}>
            <FontAwesome5 name="user" size={18} color={TEXT} solid />
          </View>
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>MENU</Text>
          <View style={styles.menuWrap}>
            {MENU_OPTIONS.map((option) => {
              const active = option === selectedTab;

              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.menuButton, active && styles.menuButtonActive]}
                  onPress={() => setSelectedTab(option)}
                >
                  <Text
                    style={[
                      styles.menuButtonText,
                      active && styles.menuButtonTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={GOLD} />
          </View>
        ) : (
          <View style={styles.panelCard}>{renderContent()}</View>
        )}

        <View style={styles.footerCard}>
          <Text style={styles.versionText}>VER.: 0.62.3.0</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default User;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PANEL_SOFT,
  },
  container: {
    flex: 1,
    backgroundColor: PANEL_SOFT,
  },
  content: {
    padding: 14,
    gap: 14,
  },
  headerCard: {
    backgroundColor: PANEL,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 7,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: TEXT,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: PANEL_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  menuCard: {
    backgroundColor: PANEL,
    borderRadius: 22,
    padding: 16,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 12,
  },
  menuWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  menuButton: {
    minWidth: "47%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  menuButtonActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  menuButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
  },
  menuButtonTextActive: {
    color: TEXT,
  },
  panelCard: {
    backgroundColor: PANEL,
    borderRadius: 22,
    padding: 14,
    gap: 12,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingCard: {
    backgroundColor: PANEL,
    borderRadius: 22,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: PANEL_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: 14,
  },
  heroTextWrap: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },
  heroBody: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
  heroHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: PANEL_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
    textTransform: "lowercase",
  },
  infoValue: {
    marginTop: 8,
    fontSize: 16,
    color: TEXT,
    fontWeight: "600",
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: PANEL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionCard: {
    backgroundColor: PANEL_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
  },
  actionTextWrap: {
    gap: 6,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
  },
  secondaryCta: {
    alignSelf: "flex-start",
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryCtaText: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 13,
  },
  dangerCta: {
    alignSelf: "flex-start",
    backgroundColor: "#fef3f2",
    borderWidth: 1,
    borderColor: "#fecdca",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dangerCtaText: {
    color: DANGER,
    fontWeight: "800",
    fontSize: 13,
  },
  settingCard: {
    backgroundColor: PANEL_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
  },
  settingTextWrap: {
    gap: 6,
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  languageButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  languageButtonActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  languageButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },
  languageButtonTextActive: {
    color: TEXT,
  },
  metricsRow: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: PANEL_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metricLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
  },
  metricValue: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
  },
  metricCardWide: {
    backgroundColor: PANEL_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#d7d9de",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: GOLD,
  },
  instrumentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  instrumentStat: {
    width: "30%",
    minWidth: 92,
    backgroundColor: PANEL,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  instrumentStatKey: {
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },
  instrumentStatValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },
  footerCard: {
    backgroundColor: PANEL,
    borderRadius: 22,
    padding: 16,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
    gap: 12,
  },
  versionText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
  },
  signOutButton: {
    backgroundColor: GOLD,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutButtonText: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 15,
  },
});
