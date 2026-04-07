import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import {
  getAllUserData,
  getCurrentUserEmail,
  loadSelectedSetlists,
} from "../../connect/connect";
import {
  InstrumentKey,
  SongDraft,
  clearSongDraft,
  loadSongDraft,
} from "../../connect/songDraft";

const API_BASE_URL = "https://api.live.eloygomes.com/api";
const GOLD = "#d9ad26";
const PANEL = "#E0E0E0";
const PANEL_SOFT = "#f0f0f0";
const BORDER = "#d1d5db";
const TEXT = "#000000";
const MUTED = "#6b7280";
const SUCCESS = "#2f6f3e";
const DANGER = "#b42318";

type SongDoc = {
  artist?: string;
  song?: string;
  capo?: string;
  tom?: string;
  tuning?: string;
  setlist?: string[];
  embedVideos?: string[];
  progressBar?: number | string;
};

type ActiveSheet =
  | { kind: "instrument"; instrument: InstrumentKey }
  | { kind: "video" }
  | { kind: "setlist" }
  | null;

type Props = {
  mode: "create" | "edit";
};

const instrumentConfig: {
  key: InstrumentKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  short: string;
}[] = [
  { key: "guitar01", label: "Guitar 01", icon: "musical-notes", short: "G1" },
  { key: "guitar02", label: "Guitar 02", icon: "musical-note", short: "G2" },
  { key: "bass", label: "Bass", icon: "radio", short: "B" },
  { key: "keys", label: "Keys", icon: "grid", short: "K" },
  { key: "drums", label: "Drums", icon: "disc", short: "D" },
  { key: "voice", label: "Voice", icon: "mic", short: "V" },
];

const emptyLinks: Record<InstrumentKey, string> = {
  guitar01: "",
  guitar02: "",
  bass: "",
  keys: "",
  drums: "",
  voice: "",
};

const emptyProgress: Record<InstrumentKey, number> = {
  guitar01: 0,
  guitar02: 0,
  bass: 0,
  keys: 0,
  drums: 0,
  voice: 0,
};

const uniqueStrings = (values: string[]) =>
  [...new Set(values.map((item) => item.trim()).filter(Boolean))];

const SongEditorScreen = ({ mode }: Props) => {
  const sheetRef = useRef<ActionSheetRef>(null);

  const [email, setEmail] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [busyInstrument, setBusyInstrument] = useState<InstrumentKey | null>(null);
  const [savingSong, setSavingSong] = useState(false);

  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [capo, setCapo] = useState("");
  const [tom, setTom] = useState("");
  const [tuning, setTuning] = useState("");

  const [instrumentLinks, setInstrumentLinks] =
    useState<Record<InstrumentKey, string>>(emptyLinks);
  const [instrumentProgress] =
    useState<Record<InstrumentKey, number>>(emptyProgress);

  const [videos, setVideos] = useState<string[]>([]);
  const [setlists, setSetlists] = useState<string[]>([]);
  const [setlistOptions, setSetlistOptions] = useState<string[]>([]);

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [sheetInput, setSheetInput] = useState("");

  const closeSheet = useCallback(() => {
    sheetRef.current?.hide();
    setActiveSheet(null);
    setSheetInput("");
  }, []);

  const applyDraft = useCallback((draft: SongDraft | null) => {
    if (!draft) return;

    setArtist(draft.artist || "");
    setSong(draft.song || "");
    setCapo(draft.capo || "");
    setTom(draft.tom || "");
    setTuning(draft.tuning || "");
    setInstrumentLinks({ ...emptyLinks, ...(draft.instrumentLinks || {}) });
    setVideos(Array.isArray(draft.videos) ? draft.videos : []);
    setSetlists(Array.isArray(draft.setlists) ? draft.setlists : []);
    setSetlistOptions(Array.isArray(draft.setlistOptions) ? draft.setlistOptions : []);
  }, []);

  const extractLatestSong = useCallback((entries: SongDoc[]) => {
    return [...entries]
      .reverse()
      .find(
        (item) =>
          typeof item?.artist === "string" &&
          item.artist.trim() &&
          typeof item?.song === "string" &&
          item.song.trim()
      );
  }, []);

  const applySongDoc = useCallback((doc?: SongDoc | null) => {
    if (!doc) return;

    if (typeof doc.artist === "string" && doc.artist.trim()) {
      setArtist(doc.artist.trim());
    }
    if (typeof doc.song === "string" && doc.song.trim()) {
      setSong(doc.song.trim());
    }
    if (typeof doc.capo === "string" && doc.capo.trim()) {
      setCapo(doc.capo.trim());
    }
    if (typeof doc.tom === "string" && doc.tom.trim()) {
      setTom(doc.tom.trim());
    }
    if (typeof doc.tuning === "string" && doc.tuning.trim()) {
      setTuning(doc.tuning.trim());
    }
    const docVideos = Array.isArray(doc.embedVideos) ? doc.embedVideos : [];
    if (docVideos.length) {
      setVideos((current) => uniqueStrings([...current, ...docVideos]));
    }
    const docSetlists = Array.isArray(doc.setlist) ? doc.setlist : [];
    if (docSetlists.length) {
      setSetlists((current) => uniqueStrings([...current, ...docSetlists]));
      setSetlistOptions((current) => uniqueStrings([...current, ...docSetlists]));
    }
  }, []);

  const pollLatestSong = useCallback(
    async (userEmail: string, attempts = 6, intervalMs = 1200) => {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const list = await getAllUserData({
          email: userEmail,
          artist: "",
          song: "",
        });
        const latest = extractLatestSong(Array.isArray(list) ? list : []);

        if (latest) {
          applySongDoc(latest);
          return latest;
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      return null;
    },
    [applySongDoc, extractLatestSong]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedEmail = await getCurrentUserEmail();
        setEmail(storedEmail);

        const [songs, storedSetlists, storedDraft] = await Promise.all([
          storedEmail
            ? getAllUserData({
                email: storedEmail,
                artist: "",
                song: "",
              })
            : Promise.resolve([]),
          loadSelectedSetlists(storedEmail),
          mode === "edit" ? loadSongDraft() : Promise.resolve(null),
        ]);

        if (mode === "edit" && storedDraft) {
          applyDraft(storedDraft);
        } else if (mode === "edit") {
          const latest = extractLatestSong(Array.isArray(songs) ? songs : []);
          applySongDoc(latest);
        }

        const allKnownSetlists = uniqueStrings([
          ...(Array.isArray(storedSetlists) ? storedSetlists : []),
          ...((Array.isArray(songs) ? songs : []).flatMap((item) =>
            Array.isArray(item?.setlist) ? item.setlist : []
          ) as string[]),
        ]);

        setSetlistOptions((current) => uniqueStrings([...allKnownSetlists, ...current]));
      } finally {
        setLoadingPage(false);
      }
    };

    bootstrap();
  }, [applyDraft, applySongDoc, extractLatestSong, mode]);

  const activeInstrumentCount = useMemo(
    () =>
      instrumentConfig.filter((instrument) =>
        instrumentLinks[instrument.key].trim()
      ).length,
    [instrumentLinks]
  );

  const overallProgress = useMemo(() => {
    const total = instrumentConfig.reduce(
      (sum, instrument) => sum + (instrumentProgress[instrument.key] ?? 0),
      0
    );
    return Math.round(total / instrumentConfig.length);
  }, [instrumentProgress]);

  const openInstrumentSheet = (instrument: InstrumentKey) => {
    setActiveSheet({ kind: "instrument", instrument });
    setSheetInput(instrumentLinks[instrument] ?? "");
    sheetRef.current?.show();
  };

  const openVideoSheet = () => {
    setActiveSheet({ kind: "video" });
    setSheetInput("");
    sheetRef.current?.show();
  };

  const openSetlistSheet = () => {
    setActiveSheet({ kind: "setlist" });
    setSheetInput("");
    sheetRef.current?.show();
  };

  const handleInstrumentSubmit = async () => {
    if (!activeSheet || activeSheet.kind !== "instrument") {
      return;
    }

    const linkValue = sheetInput.trim();
    if (!linkValue) {
      Alert.alert("Instrument link", "Insert a valid URL first.");
      return;
    }

    if (!email) {
      Alert.alert("Song Editor", "User email not found. Please log in again.");
      return;
    }

    const instrument = activeSheet.instrument;
    closeSheet();
    setBusyInstrument(instrument);

    try {
      let directDoc: SongDoc | null = null;

      try {
        const res = await axios.post(`${API_BASE_URL}/generalCifra`, {
          instrument,
          link: linkValue,
        });

        if (res?.data && typeof res.data === "object") {
          directDoc = Array.isArray(res.data)
            ? extractLatestSong(res.data) ?? null
            : (res.data as SongDoc);
        }
      } catch (error: any) {
        const status = error?.response?.status;

        if (status !== 404) {
          throw error;
        }

        await axios.post(`${API_BASE_URL}/scrape`, {
          artist: "",
          song: "",
          email,
          instrument,
          instrument_progressbar: 0,
          link: linkValue,
        });
      }

      setInstrumentLinks((current) => ({
        ...current,
        [instrument]: linkValue,
      }));

      if (directDoc) {
        applySongDoc(directDoc);
      } else {
        await pollLatestSong(email);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to process this URL.";
      Alert.alert("Instrument link", message);
    } finally {
      setBusyInstrument(null);
    }
  };

  const handleVideoSubmit = () => {
    const nextVideo = sheetInput.trim();
    if (!nextVideo) {
      Alert.alert("Videos", "Insert a valid video URL first.");
      return;
    }

    setVideos((current) => uniqueStrings([...current, nextVideo]));
    closeSheet();
  };

  const handleToggleSetlist = (tag: string) => {
    setSetlists((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  };

  const handleAddSetlist = () => {
    const nextTag = sheetInput.trim();
    if (!nextTag) {
      return;
    }

    setSetlistOptions((current) => uniqueStrings([...current, nextTag]));
    setSetlists((current) =>
      current.includes(nextTag) ? current : [...current, nextTag]
    );
    setSheetInput("");
  };

  const handleDiscard = async () => {
    setArtist("");
    setSong("");
    setCapo("");
    setTom("");
    setTuning("");
    setInstrumentLinks(emptyLinks);
    setVideos([]);
    setSetlists([]);
    if (mode === "edit") {
      await clearSongDraft();
    }
  };

  const buildUserData = (instrument: InstrumentKey) => {
    const flags = {
      guitar01: instrument === "guitar01",
      guitar02: instrument === "guitar02",
      bass: instrument === "bass",
      keys: instrument === "keys",
      drums: instrument === "drums",
      voice: instrument === "voice",
    };

    const block = (name: InstrumentKey) => ({
      active: `${flags[name] ? true : ""}`,
      capo: `${flags[name] ? capo : ""}`,
      lastPlay: "",
      link: `${flags[name] ? instrumentLinks[name].trim() : ""}`,
      progress: `${flags[name] ? instrumentProgress[name] ?? 0 : ""}`,
      songCifra: "",
      tuning: `${flags[name] ? tuning : ""}`,
    });

    return {
      song: song.trim(),
      artist: artist.trim(),
      progressBar: overallProgress || 0,
      capo: capo.trim(),
      tom: tom.trim(),
      tuning: tuning.trim(),
      setlist: setlists,
      instruments: flags,
      guitar01: block("guitar01"),
      guitar02: block("guitar02"),
      bass: block("bass"),
      keys: block("keys"),
      drums: block("drums"),
      voice: block("voice"),
      embedVideos: videos,
      addedIn: new Date().toISOString().split("T")[0],
      updateIn: new Date().toISOString().split("T")[0],
      email,
      username: "",
      fullName: "",
    };
  };

  const handleSave = async () => {
    if (!email) {
      Alert.alert("Song Editor", "User email not found. Please log in again.");
      return;
    }

    if (!artist.trim() || !song.trim()) {
      Alert.alert("Song Editor", "Artist and song are required before saving.");
      return;
    }

    const activeInstruments = instrumentConfig.filter((instrument) =>
      instrumentLinks[instrument.key].trim()
    );

    if (!activeInstruments.length) {
      Alert.alert("Song Editor", "Add at least one instrument link before saving.");
      return;
    }

    setSavingSong(true);

    try {
      for (const instrument of activeInstruments) {
        await axios.post(`${API_BASE_URL}/newsong`, {
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: buildUserData(instrument.key),
        });
      }

      if (mode === "edit") {
        await clearSongDraft();
      }

      Alert.alert("Song Editor", "Song saved successfully.");
      await handleDiscard();

      if (mode === "edit") {
        router.back();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save song.";
      Alert.alert("Song Editor", message);
    } finally {
      setSavingSong(false);
    }
  };

  const renderSheetContent = () => {
    if (!activeSheet) {
      return null;
    }

    if (activeSheet.kind === "instrument") {
      const instrument = instrumentConfig.find(
        (item) => item.key === activeSheet.instrument
      );

      return (
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{instrument?.label}</Text>
              <Text style={styles.sheetSubtitle}>
                Insert the URL that will be scraped for this instrument.
              </Text>
            </View>
            <TouchableOpacity style={styles.sheetClose} onPress={closeSheet}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>

          <TextInput
            value={sheetInput}
            onChangeText={setSheetInput}
            placeholder="https://www.cifraclub.com/..."
            placeholderTextColor="#8f8f8f"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.sheetInput}
          />

          <TouchableOpacity
            style={styles.sheetPrimaryButton}
            onPress={handleInstrumentSubmit}
          >
            <Text style={styles.sheetPrimaryButtonText}>Use this link</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeSheet.kind === "video") {
      return (
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Videos</Text>
              <Text style={styles.sheetSubtitle}>
                Add a video URL for this song.
              </Text>
            </View>
            <TouchableOpacity style={styles.sheetClose} onPress={closeSheet}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>

          <TextInput
            value={sheetInput}
            onChangeText={setSheetInput}
            placeholder="https://youtube.com/..."
            placeholderTextColor="#8f8f8f"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.sheetInput}
          />

          {!!videos.length && (
            <View style={styles.tagWrap}>
              {videos.map((video) => (
                <View key={video} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {video}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setVideos((current) => current.filter((item) => item !== video))
                    }
                  >
                    <Ionicons name="close" size={14} color={TEXT} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.sheetPrimaryButton}
            onPress={handleVideoSubmit}
          >
            <Text style={styles.sheetPrimaryButtonText}>Add video</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.sheetContent}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Setlist</Text>
            <Text style={styles.sheetSubtitle}>
              Select existing tags or create a new one for this song.
            </Text>
          </View>
          <TouchableOpacity style={styles.sheetClose} onPress={closeSheet}>
            <Ionicons name="close" size={22} color={TEXT} />
          </TouchableOpacity>
        </View>

        <View style={styles.inlineInputRow}>
          <TextInput
            value={sheetInput}
            onChangeText={setSheetInput}
            placeholder="Create a new setlist"
            placeholderTextColor="#8f8f8f"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.sheetInput, styles.inlineInput]}
          />
          <TouchableOpacity style={styles.smallGoldButton} onPress={handleAddSetlist}>
            <Text style={styles.smallGoldButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagWrap}>
          {setlistOptions.length ? (
            setlistOptions.map((tag) => {
              const active = setlists.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => handleToggleSetlist(tag)}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No setlist available yet.</Text>
          )}
        </View>

      </View>
    );
  };

  const title = mode === "edit" ? "EDIT SONG" : "NEW SONG";
  const subtitle =
    mode === "edit"
      ? "Adjust the current draft with the same mobile editor"
      : "Register the song and its instrument links here";

  return (
    <>
      <ActionSheet ref={sheetRef} containerStyle={styles.sheetContainer}>
        {renderSheetContent()}
      </ActionSheet>

      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
            {mode === "edit" ? (
              <TouchableOpacity style={styles.headerBadge} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color={TEXT} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerBadge}>
                <FontAwesome5 name="plus" size={18} color={TEXT} solid />
              </View>
            )}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.sectionTitle}>Song Data</Text>
              {loadingPage || busyInstrument ? (
                <View style={styles.loadingPill}>
                  <ActivityIndicator size="small" color={TEXT} />
                  <Text style={styles.loadingPillText}>
                    {busyInstrument ? "Scraping..." : "Loading..."}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Artist</Text>
              <TextInput
                value={artist}
                onChangeText={setArtist}
                placeholder="Artist"
                placeholderTextColor="#8f8f8f"
                style={styles.mainInput}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Song</Text>
              <TextInput
                value={song}
                onChangeText={setSong}
                placeholder="Song"
                placeholderTextColor="#8f8f8f"
                style={styles.mainInput}
              />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>CAPO</Text>
                <TextInput
                  value={capo}
                  onChangeText={setCapo}
                  placeholder="-"
                  placeholderTextColor="#8f8f8f"
                  style={styles.metaInput}
                />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>TOM</Text>
                <TextInput
                  value={tom}
                  onChangeText={setTom}
                  placeholder="-"
                  placeholderTextColor="#8f8f8f"
                  style={styles.metaInput}
                />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>TUNING</Text>
                <TextInput
                  value={tuning}
                  onChangeText={setTuning}
                  placeholder="-"
                  placeholderTextColor="#8f8f8f"
                  style={styles.metaInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.panelCard}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.sectionTitle}>Instruments</Text>
              <Text style={styles.compactCounter}>{activeInstrumentCount}/6 added</Text>
            </View>
            <View style={styles.instrumentGrid}>
              {instrumentConfig.map((instrument) => {
                const hasLink = Boolean(instrumentLinks[instrument.key].trim());
                const isBusy = busyInstrument === instrument.key;

                return (
                  <TouchableOpacity
                    key={instrument.key}
                    style={[styles.instrumentCard, hasLink && styles.instrumentCardActive]}
                    onPress={() => openInstrumentSheet(instrument.key)}
                    disabled={savingSong}
                  >
                    <View style={styles.instrumentHeader}>
                      <View
                        style={[
                          styles.instrumentIconWrap,
                          hasLink && styles.instrumentIconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name={instrument.icon}
                          size={18}
                          color={TEXT}
                        />
                      </View>
                      <Text style={styles.instrumentShort}>{instrument.short}</Text>
                    </View>

                    <Text style={styles.instrumentLabel}>{instrument.label}</Text>
                    <Text style={styles.instrumentStatus}>{isBusy ? "Scraping..." : hasLink ? "Link added" : "No URL yet"}</Text>
                    <Text style={styles.instrumentPreview} numberOfLines={1}>
                      {instrumentLinks[instrument.key] || "Tap to add"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.panelCard}>
            <Text style={styles.sectionTitle}>Media & Setlist</Text>

            <TouchableOpacity style={styles.utilityCard} onPress={openVideoSheet}>
              <View style={styles.utilityIcon}>
                <Ionicons name="videocam" size={20} color={TEXT} />
              </View>
              <View style={styles.utilityBody}>
                <Text style={styles.utilityTitle}>Videos</Text>
                <Text style={styles.utilityMeta}>
                  {videos.length} video{videos.length === 1 ? "" : "s"} added
                </Text>
              </View>
            </TouchableOpacity>

            {!!videos.length && (
              <View style={styles.tagWrap}>
                {videos.map((video) => (
                  <View key={video} style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {video}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.utilityCard} onPress={openSetlistSheet}>
              <View style={styles.utilityIcon}>
                <Ionicons name="albums" size={20} color={TEXT} />
              </View>
              <View style={styles.utilityBody}>
                <Text style={styles.utilityTitle}>Setlist</Text>
                <Text style={styles.utilityMeta}>
                  {setlists.length} setlist{setlists.length === 1 ? "" : "s"} selected
                </Text>
              </View>
            </TouchableOpacity>

            {!!setlists.length && (
              <View style={styles.tagWrap}>
                {setlists.map((tag) => (
                  <View key={tag} style={[styles.tag, styles.tagActive]}>
                    <Text style={[styles.tagText, styles.tagTextActive]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.footerCard}>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={handleDiscard}
              disabled={savingSong || !!busyInstrument}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={savingSong || !!busyInstrument}
            >
              {savingSong ? (
                <ActivityIndicator color={TEXT} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {mode === "edit" ? "Save changes" : "Save Song"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default SongEditorScreen;

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
    padding: 12,
    gap: 10,
  },
  headerCard: {
    backgroundColor: PANEL,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: PANEL_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryCard: {
    backgroundColor: PANEL,
    borderRadius: 18,
    padding: 12,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },
  compactCounter: {
    fontSize: 11,
    fontWeight: "900",
    color: MUTED,
    textTransform: "uppercase",
  },
  loadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  loadingPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },
  fieldBlock: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
    marginBottom: 4,
  },
  mainInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 12,
    fontSize: 15,
    color: TEXT,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaField: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: MUTED,
    marginBottom: 4,
  },
  metaInput: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "700",
    paddingVertical: 0,
  },
  panelCard: {
    backgroundColor: PANEL,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  instrumentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  instrumentCard: {
    width: "48%",
    backgroundColor: PANEL_SOFT,
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 116,
  },
  instrumentCardActive: {
    borderColor: GOLD,
  },
  instrumentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  instrumentIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: PANEL,
    alignItems: "center",
    justifyContent: "center",
  },
  instrumentIconWrapActive: {
    backgroundColor: GOLD,
  },
  instrumentShort: {
    fontSize: 12,
    fontWeight: "900",
    color: MUTED,
  },
  instrumentLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  instrumentStatus: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  instrumentPreview: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: TEXT,
  },
  utilityCard: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 15,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "flex-start",
  },
  utilityIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: PANEL,
    alignItems: "center",
    justifyContent: "center",
  },
  utilityBody: {
    flex: 1,
  },
  utilityTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  utilitySubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
  },
  utilityMeta: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "800",
    color: SUCCESS,
  },
  footerCard: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  discardButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecdca",
    backgroundColor: "#fef3f2",
    alignItems: "center",
    justifyContent: "center",
  },
  discardButtonText: {
    color: DANGER,
    fontSize: 15,
    fontWeight: "900",
  },
  saveButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "900",
  },
  sheetContainer: {
    backgroundColor: PANEL,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    maxWidth: "90%",
  },
  sheetClose: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetInput: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 14,
    fontSize: 14,
    color: TEXT,
  },
  sheetPrimaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },
  inlineInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  inlineInput: {
    flex: 1,
  },
  smallGoldButton: {
    minWidth: 72,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  smallGoldButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tagActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
    maxWidth: 220,
  },
  tagTextActive: {
    color: TEXT,
  },
  emptyText: {
    fontSize: 12,
    color: MUTED,
    fontStyle: "italic",
  },
});
