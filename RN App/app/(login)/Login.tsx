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
  Alert,
  ActivityIndicator,
} from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { login } from "../../connect/connect";

const GOLD = "#d9ad26";
const PANEL = "#E0E0E0";
const PANEL_SOFT = "#f0f0f0";
const BORDER = "#d1d5db";
const TEXT = "#000000";
const MUTED = "#6b7280";

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Login", "Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      router.replace(`/(tabs)/Songlist`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Check your email and password.";

      Alert.alert("Login failed", message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const onForgot = () => {
    router.navigate({
      pathname: "/(login)/ChangePassword",
      params: email.trim() ? { email: email.trim() } : undefined,
    });
  };

  const onSignUp = () => {
    router.navigate(`/(login)/SignUp`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.screen}>
            <View style={styles.formCard}>
              <Text style={styles.formEyebrow}>WELCOME BACK</Text>
              <Text style={styles.formTitle}>Login</Text>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor="#8f8f8f"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#8f8f8f"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <View style={styles.utilityRow}>
                <TouchableOpacity
                  style={styles.rememberBtn}
                  onPress={() => setRememberPassword((value) => !value)}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberPassword && styles.checkboxActive,
                    ]}
                  >
                    {rememberPassword ? (
                      <FontAwesome5
                        name="check"
                        size={10}
                        color="#000000"
                        solid
                      />
                    ) : null}
                  </View>
                  <Text style={styles.rememberText}>Remember password</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onForgot} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={onLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.loginText}>Log in</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divLine} />
                <Text style={styles.dividerLabel}>or</Text>
                <View style={styles.divLine} />
              </View>

              <TouchableOpacity style={styles.outlinedBtn} onPress={onSignUp}>
                <Text style={styles.outlinedText}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PANEL_SOFT,
  },
  keyboard: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    justifyContent: "center",
    backgroundColor: PANEL_SOFT,
  },
  heroCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  brandBadge: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  brandBadgeText: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  heroMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TEXT,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: TEXT,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
  },
  heroStat: {
    flex: 1,
    backgroundColor: PANEL_SOFT,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    shadowColor: "#bebebe",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  formEyebrow: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "800",
    letterSpacing: 1,
  },
  formTitle: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 16,
  },
  inputBlock: {
    marginBottom: 12,
  },
  utilityRow: {
    marginTop: 2,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rememberBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  rememberText: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: PANEL_SOFT,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: TEXT,
  },
  forgotBtn: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: "700",
  },
  loginBtn: {
    backgroundColor: GOLD,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerLabel: {
    marginHorizontal: 8,
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
  },
  outlinedBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PANEL_SOFT,
  },
  outlinedText: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 15,
  },
});

export default AuthScreen;
