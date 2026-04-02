import React, { forwardRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectPayload } from "@/components/FlatList/FlatList";
import Close from "react-native-vector-icons/FontAwesome";
import { getAllUserData } from "@/connect/connect";

interface Props {
  selected: SelectPayload | null;
  selectedSetlists: string[]; // 🔹
  setSelectedSetlists: (setlists: string[]) => void; // 🔹
}

const LOCAL_STORAGE_KEY = "mySelectedSetlists";

const ActionSheetSongFilter = forwardRef<ActionSheetRef, Props>(
  ({ selected, selectedSetlists, setSelectedSetlists }, ref) => {
    const [setlists, setSetlists] = useState<string[]>([]);

    useEffect(() => {
      async function fetchSetlists() {
        const userEmail = "teste@teste.com";

        try {
          const data = await getAllUserData({
            email: userEmail,
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

    const toggleTag = (tag: string) => {
      const updated = selectedSetlists.includes(tag)
        ? selectedSetlists.filter((item) => item !== tag)
        : [...selectedSetlists, tag];
      setSelectedSetlists(updated);
      AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated)).catch(
        (err) => console.error("Erro ao salvar no AsyncStorage:", err)
      );
    };

    return (
      <ActionSheet ref={ref}>
        <View style={{ padding: 20 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 5 }}>
              Setlists
            </Text>

            <View>
              <TouchableOpacity
                onPress={() => {
                  if (typeof ref !== "function" && ref?.current) {
                    ref.current.hide();
                  }
                }}
                style={{ padding: 10 }}
              >
                <Close name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={{ fontSize: 12, paddingTop: 5, paddingBottom: 10 }}>
            Select here your setlist to show
          </Text>
          {setlists.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma setlist cadastrada.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.pillContainer}>
              {setlists.map((tag, index) => {
                const isActive = selectedSetlists.includes(tag);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? "goldenrod" : "#9ca3af",
                        borderRadius: 6,
                      },
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={styles.pillText}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ActionSheet>
    );
  }
);

const styles = StyleSheet.create({
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  subTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    margin: 4,
  },
  pillText: {
    color: "#fff",
    fontSize: 12,
  },
  emptyText: {
    fontStyle: "italic",
    fontSize: 12,
  },
});

ActionSheetSongFilter.displayName = "ActionSheetSongFilter";
export default ActionSheetSongFilter;
