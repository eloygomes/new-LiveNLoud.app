import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  ImageBackground,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = () => {
    console.log("login", email, password);
    router.navigate(`/(tabs)/Songlist`);
  };
  const onForgot = () => console.log("forgot password");
  const onSignUp = () => {
    console.log("SignUp");
    router.navigate(`/(login)/SignUp`);
  };

  return (
    <>
      {/* ----- BLUE HEADER SECTION ----- */}
      <ImageBackground
        source={require("../../assets/images/rockBand03.png")}
        resizeMode="cover"
        style={styles.image}
      >
        <View style={styles.blueHeaderContent}>
          <Text style={styles.title}>Welcome{"\n"}Back</Text>
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

      <SafeAreaView style={styles.safeArea}>
        {/* ----- FORM SECTION ----- */}
        <KeyboardAvoidingView
          style={styles.formContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formInner}>
              {/* Email */}
              <View style={styles.inputWrapper}>
                {/* <Icon name="mail" size={16} color="#666" /> */}
                <TextInput
                  placeholder="water@gmail.com"
                  placeholderTextColor="#666"
                  style={styles.input}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                {/* <Icon name="check" size={16} color="#0075ff" /> */}
              </View>
              {/* Password */}
              <View style={styles.inputWrapper}>
                {/* <Icon name="lock" size={16} color="#666" /> */}
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity onPress={onForgot} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
                <Text style={styles.loginText}>Log in</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divLine} />
                <Text style={styles.dividerLabel}>or</Text>
                <View style={styles.divLine} />
              </View>

              <TouchableOpacity style={styles.outlinedBtn} onPress={onSignUp}>
                <Text style={styles.outlinedText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

// ——————————————————————— STYLES ———————————————————————
const BLUE = "#daa520";

const BORDER = "#e4e7ee";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  /* HEADER */
  image: {
    flex: 1,
    width: "100%",
    // height: "100%",
  },
  blueHeader: {
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: BLUE,
  },
  blueHeaderContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: "flex-start",
  },
  backArrow: {
    color: "#ffffff",
    fontSize: 26,
    marginBottom: 20,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: 80,
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0, // cobre toda a largura
  },
  /* FORM */
  formContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  formInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 12,
    color: BLUE,
  },
  loginBtn: {
    backgroundColor: BLUE,
    height: 48,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerLabel: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#6b7280",
  },
  outlinedBtn: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  outlinedText: {
    color: BLUE,
    fontWeight: "600",
  },
});

export default AuthScreen;
