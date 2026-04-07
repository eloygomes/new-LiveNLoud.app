import React, { forwardRef, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Close from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { SelectPayload } from "@/components/FlatList/FlatList";
import {
  getCurrentUserEmail,
  getAllUserData,
  loadSelectedSetlists,
  saveSelectedSetlists,
  updateUserSetlists,
} from "@/connect/connect";
import { Instruments } from "@/shared/types";

interface Props {
  selected: SelectPayload | null;
  selectedSetlists: string[];
  setSelectedSetlists: React.Dispatch<React.SetStateAction<string[]>>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  visibleSongs: SelectPayload[];
  allSongs: SelectPayload[];
}

const instrumentLabels: { key: keyof Instruments; label: string }[] = [
  { key: "guitar01", label: "G1" },
  { key: "guitar02", label: "G2" },
  { key: "bass", label: "B" },
  { key: "keys", label: "K" },
  { key: "drums", label: "D" },
  { key: "voice", label: "V" },
];

const ActionSheetSongFilter = forwardRef<ActionSheetRef, Props>(
  (
    {
      selectedSetlists,
      setSelectedSetlists,
      searchTerm,
      setSearchTerm,
      visibleSongs,
      allSongs,
    },
    ref,
  ) => {
    const closeSheet = () => {
      if (typeof ref !== "function" && ref?.current) {
        ref.current.hide();
      }
    };

    const [setlists, setSetlists] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;

      getCurrentUserEmail().then((storedEmail) => {
        if (!isMounted) return;
        setUserEmail(storedEmail?.trim().toLowerCase() || null);
      });

      return () => {
        isMounted = false;
      };
    }, []);

    useEffect(() => {
      if (!userEmail) {
        setSelectedSetlists([]);
        return;
      }

      loadSelectedSetlists(userEmail).then((stored) => {
        setSelectedSetlists(stored);
      });
    }, [setSelectedSetlists, userEmail]);

    useEffect(() => {
      async function fetchSetlists() {
        const userEmail = await getCurrentUserEmail();

        if (!userEmail) {
          setSetlists([]);
          return;
        }

        try {
          const normalizedEmail = userEmail.trim().toLowerCase();
          const data = await getAllUserData({
            email: normalizedEmail,
            artist: "",
            song: "",
          });
          const safeSongs = Array.isArray(data) ? data : [];
          const allSetlists = safeSongs.flatMap((song: any) => song.setlist || []);
          const distinctSetlists = [...new Set(allSetlists)] as string[];
          setSetlists(distinctSetlists);
        } catch (error) {
          console.error("Erro ao buscar setlists:", error);
          setSetlists([]);
        }
      }
      fetchSetlists();
    }, []);

    const dashboardMetrics = useMemo(() => {
      if (!visibleSongs.length) {
        return {
          averageProgress: 0,
          totalSongs: 0,
          instrumentCounts: instrumentLabels.map((item) => ({
            ...item,
            count: 0,
          })),
        };
      }

      const totalSongs = visibleSongs.length;
      const totalProgress = visibleSongs.reduce(
        (sum, song) => sum + Number(song.progressBar || 0),
        0,
      );
      const countsMap: Record<string, number> = {};
      instrumentLabels.forEach((item) => {
        countsMap[item.key] = 0;
      });

      visibleSongs.forEach((song) => {
        instrumentLabels.forEach(({ key }) => {
          if (song.instruments?.[key]) {
            countsMap[key] += 1;
          }
        });
      });

      return {
        averageProgress: Math.round(totalProgress / totalSongs),
        totalSongs,
        instrumentCounts: instrumentLabels.map((item) => ({
          ...item,
          count: countsMap[item.key] || 0,
        })),
      };
    }, [visibleSongs]);

    const toggleTag = (tag: string) => {
      const updated = selectedSetlists.includes(tag)
        ? selectedSetlists.filter((item) => item !== tag)
        : [...selectedSetlists, tag];
      setSelectedSetlists(updated);
      saveSelectedSetlists(updated, userEmail).catch((err) =>
        console.error("Erro ao salvar no AsyncStorage:", err),
      );
    };

    const togglePendingRemoval = (tag: string) => {
      setPendingRemovals((prev) =>
        prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
      );
    };

    const cancelEditing = () => {
      setPendingRemovals([]);
      setIsEditing(false);
    };

    const saveTagChanges = async () => {
      const nextSetlists = setlists.filter((tag) => !pendingRemovals.includes(tag));

      try {
        await updateUserSetlists(nextSetlists);
        setSetlists(nextSetlists);
        const nextSelected = selectedSetlists.filter((tag) => nextSetlists.includes(tag));
        setSelectedSetlists(nextSelected);
        await saveSelectedSetlists(nextSelected, userEmail);
        setPendingRemovals([]);
        setIsEditing(false);
      } catch {
        Alert.alert("Tags", "Unable to update tags.");
      }
    };

    return (
      <ActionSheet ref={ref} containerStyle={styles.sheetContainer}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>OPTIONS</Text>
            <TouchableOpacity
              onPress={closeSheet}
              style={styles.closeButton}
            >
              <Close name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>SEARCH</Text>
            <View style={styles.searchBox}>
              <FontAwesome5 name="search" size={14} color="#6b7280" />
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Buscar música ou artista..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>INSIGHTS</Text>
            <View style={styles.insightGrid}>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>PROGRESS RATIO</Text>
                <Text style={styles.insightValue}>
                  {dashboardMetrics.averageProgress}%
                </Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${dashboardMetrics.averageProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.insightFoot}>
                  {dashboardMetrics.totalSongs} songs filtradas
                </Text>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>SONGS BY INSTRUMENT</Text>
                <View style={styles.instrumentCountGrid}>
                  {dashboardMetrics.instrumentCounts.map((item) => (
                    <View key={item.key} style={styles.instrumentCountBox}>
                      <Text style={styles.instrumentCountLabel}>{item.label}</Text>
                      <Text style={styles.instrumentCountValue}>{item.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.tagsHeader}>
              <Text style={styles.sectionTitle}>TAGS</Text>
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={cancelEditing}
                  >
                    <Text style={styles.editButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={saveTagChanges}
                  >
                    <Text style={styles.editButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.tagsWrap}>
              {setlists.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma setlist cadastrada.</Text>
              ) : (
                setlists.map((tag, index) => {
                  const isActive = selectedSetlists.includes(tag);
                  const willRemove = pendingRemovals.includes(tag);

                  return (
                    <TouchableOpacity
                      key={`${tag}-${index}`}
                      style={[
                        styles.pill,
                        isActive ? styles.pillActive : styles.pillInactive,
                        willRemove ? styles.pillDelete : null,
                      ]}
                      onPress={() =>
                        isEditing ? togglePendingRemoval(tag) : toggleTag(tag)
                      }
                    >
                      <Text style={styles.pillText}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>EXPORT</Text>
            <Text style={styles.helperText}>
              Use os botões de exportação para baixar a lista de músicas visíveis em
              formato TXT ou JSON.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome5 name="file-alt" size={14} color="#000" />
                <Text style={styles.actionButtonText}>TXT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome5 name="code" size={14} color="#000" />
                <Text style={styles.actionButtonText}>JSON</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>PLAYLISTS</Text>
            <Text style={styles.helperText}>
              Crie uma playlist automaticamente com as músicas visíveis usando sua
              conta.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionButton, styles.disabledAction]}>
                <FontAwesome5 name="spotify" size={14} color="#8f8f8f" brand />
                <Text style={styles.disabledActionText}>Spotify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.disabledAction]}>
                <FontAwesome5 name="youtube" size={14} color="#8f8f8f" brand />
                <Text style={styles.disabledActionText}>YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ActionSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  container: {
    padding: 20,
    gap: 14,
    backgroundColor: "#F0F0F0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    backgroundColor: "#E0E0E0",
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "#000000",
    fontSize: 14,
  },
  insightGrid: {
    gap: 10,
  },
  insightCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
  },
  insightLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 6,
  },
  insightValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000000",
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#d1d5db",
    overflow: "hidden",
    marginTop: 10,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: "#d9ad26",
    borderRadius: 999,
  },
  insightFoot: {
    marginTop: 8,
    fontSize: 11,
    color: "#6b7280",
  },
  instrumentCountGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 8,
  },
  instrumentCountBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  instrumentCountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000000",
  },
  instrumentCountValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    marginTop: 2,
  },
  tagsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#d1d5db",
  },
  saveButton: {
    backgroundColor: "#d9ad26",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pillActive: {
    backgroundColor: "#d9ad26",
  },
  pillInactive: {
    backgroundColor: "#9ca3af",
  },
  pillDelete: {
    backgroundColor: "#dc2626",
  },
  pillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 12,
    color: "#2d2d2d",
    marginBottom: 12,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 13,
  },
  disabledAction: {
    opacity: 0.55,
  },
  disabledActionText: {
    color: "#8f8f8f",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: {
    fontStyle: "italic",
    fontSize: 12,
    color: "#6b7280",
  },
});

ActionSheetSongFilter.displayName = "ActionSheetSongFilter";
export default ActionSheetSongFilter;
