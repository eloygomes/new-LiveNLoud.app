import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "expo-image";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BORDER = "#e4e7ee";

const SignUp = () => {
  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "white" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, backgroundColor: "white" }}>
            <ImageBackground
              source={require("../../assets/images/public.png")}
              contentFit="cover"
              style={{ flex: 1 }}
            >
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 20,
                  paddingTop: 10,
                  justifyContent: "flex-start",
                }}
              >
                <Text style={styles.title}>Sign Up</Text>
                <Text style={styles.subtitle}>Registration</Text>
              </View>

              <Svg
                width={SCREEN_WIDTH}
                height={80}
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                style={styles.wave}
              >
                <Path
                  fill="#ffffff"
                  d="M0,224L60,218.7C120,213,240,203,360,197.3C480,192,600,192,720,181.3C840,171,960,149,1080,138.7C1200,128,1320,128,1380,128L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                />
              </Svg>
            </ImageBackground>

            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: "transparent",
                marginTop: -50,
              }}
            >
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingBottom: 32,
                  backgroundColor: "#fff", // ✅ necessário também aqui
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={{
                    flex: 1,
                    marginBottom: 20,
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      // paddingBottom: 10,
                      fontSize: 12,
                      alignItems: "center",
                      textAlign: "right",
                    }}
                  >
                    Welcome to registration page
                  </Text>
                  <Text
                    style={{
                      paddingBottom: 10,
                      fontSize: 12,
                      alignItems: "center",
                      textAlign: "right",
                    }}
                  >
                    please insert your data
                  </Text>
                </View>

                {["Name", "Email", "Password", "Confirm your Password"].map(
                  (placeholder, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: BORDER,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        marginBottom: 12,
                        height: 48,
                      }}
                    >
                      <TextInput
                        placeholder={placeholder}
                        placeholderTextColor="#666"
                        style={styles.input}
                        secureTextEntry={placeholder
                          .toLowerCase()
                          .includes("password")}
                        keyboardType={
                          placeholder === "Email" ? "email-address" : "default"
                        }
                        autoCapitalize="none"
                        textContentType="none"
                        autoComplete="off"
                      />
                    </View>
                  )
                )}
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    height: 48,
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 20,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      // backgroundColor: BLUE,
                      height: 48,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",

                      flex: 1,

                      borderWidth: 1,
                      borderColor: "#daa520",
                    }}
                    // onPress={onLogin}
                  >
                    <Text style={{ color: "#daa520", fontWeight: "600" }}>
                      Discart
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      // backgroundColor: BLUE,
                      height: 48,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#daa520",
                      flex: 1,
                    }}
                    // onPress={onLogin}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "600" }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignUp;

// ——————————————————————— STYLES ———————————————————————
const BLUE = "#daa520";

// const BORDER = "#e4e7ee";

const styles = StyleSheet.create({
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: 80,
  },
  subtitle: {
    fontWeight: "500",
    fontSize: 16,
    color: "white",
    paddingTop: 5,
    backgroundColor: "transparent",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
});
