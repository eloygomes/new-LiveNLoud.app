import React, { forwardRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { SelectPayload } from "@/components/FlatList/FlatList";
import Close from "react-native-vector-icons/FontAwesome";

interface Props {
  selected: SelectPayload | null;
  setShowCifraFrom: React.Dispatch<React.SetStateAction<string>>;
}

const ActionSheetPres = forwardRef<ActionSheetRef, Props>(
  ({ selected, setShowCifraFrom }, ref) => {
    // estado local para edição (opcional)
    const [progress, setProgress] = useState(
      selected?.progressBar?.toString() ?? ""
    );

    return (
      <ActionSheet ref={ref}>
        {selected ? (
          <View style={{ padding: 20, gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 26,
                  // textAlign: "center",
                }}
              >
                ToolBox
              </Text>
              <TouchableOpacity>
                <Close
                  name="close"
                  size={26}
                  color="#000"
                  onPress={() => {
                    if (typeof ref === "object" && ref && "current" in ref) {
                      ref.current?.hide();
                    }
                  }}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                  marginTop: 5,
                }}
              >
                Instruments
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                marginTop: 5,
              }}
            >
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>G1</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>G2</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>B</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>K</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>D</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>V</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "column" }}>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                  marginTop: 20,
                  marginBottom: 5,
                }}
              >
                Videos
              </Text>

              <Text
                style={{ marginBottom: 5 }}
              >{`Insert link from youtube`}</Text>

              {/* campo de 0-100 */}
              <TextInput
                value={progress}
                onChangeText={setProgress}
                keyboardType="web-search"
                // maxLength={3}
                placeholder="insert the link here"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 8,
                }}
              />
            </View>

            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginTop: 20,
                marginBottom: 5,
              }}
            >
              Highlight
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <TouchableOpacity onPress={() => setShowCifraFrom("original")}>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Original</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowCifraFrom("tabs")}>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Tabs</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowCifraFrom("chords")}>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Notes</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowCifraFrom("lyrics")}>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Lyrics</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginTop: 20,
                marginBottom: 5,
              }}
            >
              Tools
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Tuner</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Metronome</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 6,
                    minWidth: 80,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Chord Library</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginTop: 20,
                marginBottom: 5,
              }}
            >
              Auto Scroling
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              {/* <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity>
                  <View
                    style={{
                      padding: 6,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 6,
                      minWidth: 80,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text>-</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View
                    style={{
                      padding: 6,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 6,
                      minWidth: 80,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text>+</Text>
                  </View>
                </TouchableOpacity>
              </View> */}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity>
                  <View
                    style={{
                      padding: 10,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 6,
                      minWidth: 80,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text>-</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View
                    style={{
                      padding: 10,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 6,
                      minWidth: 80,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text>+</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ padding: 20 }}>
            <Text>No song selected</Text>
          </View>
        )}
      </ActionSheet>
    );
  }
);

ActionSheetPres.displayName = "ActionSheetPres";
export default ActionSheetPres;
