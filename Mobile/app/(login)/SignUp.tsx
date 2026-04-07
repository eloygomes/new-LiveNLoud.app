import React, { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { signUp } from "../../connect/connect";

const GOLD = "#d9ad26";
const PANEL = "#E0E0E0";
const PANEL_SOFT = "#f0f0f0";
const BORDER = "#d1d5db";
const TEXT = "#000000";
const MUTED = "#6b7280";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDiscard = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim() || !username.trim() || !password) {
      Alert.alert("Sign up", "Fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Sign up", "Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Sign up", "Password must have at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await signUp({ fullName, username, email, password });
      Alert.alert("Sign up", "Account created successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/(login)/Login"),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account.";
      Alert.alert("Sign up failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <Text style={styles.formEyebrow}>CREATE ACCOUNT</Text>
              <Text style={styles.formTitle}>Sign Up</Text>
              <Text style={styles.formSubtitle}>
                Add your information to create a new account in the same app
                style.
              </Text>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Your full name"
                    placeholderTextColor="#8f8f8f"
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                  />
                </View>
              </View>

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
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Username"
                    placeholderTextColor="#8f8f8f"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#8f8f8f"
                    style={styles.input}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Confirm your password"
                    placeholderTextColor="#8f8f8f"
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleDiscard}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Back to login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PANEL_SOFT,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
    backgroundColor: PANEL_SOFT,
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
  },
  formSubtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  inputBlock: {
    marginBottom: 12,
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
    backgroundColor: PANEL_SOFT,
    paddingHorizontal: 14,
    minHeight: 50,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: TEXT,
    paddingVertical: 12,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 14,
    minHeight: 50,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 15,
  },
});
