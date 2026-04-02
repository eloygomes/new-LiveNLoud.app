import React, { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
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
import { requestPasswordReset, resetPassword } from "../../connect/connect";

const GOLD = "#d9ad26";
const PANEL = "#E0E0E0";
const PANEL_SOFT = "#f0f0f0";
const BORDER = "#d1d5db";
const TEXT = "#000000";
const MUTED = "#6b7280";
const SUCCESS = "#2f6f3e";

const ChangePassword = () => {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const initialEmail = typeof params.email === "string" ? params.email : "";
  const resetToken = typeof params.token === "string" ? params.token : "";
  const isResetMode = useMemo(
    () => Boolean(initialEmail && resetToken),
    [initialEmail, resetToken]
  );

  const [requestEmail, setRequestEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleRequestReset = async () => {
    if (!requestEmail.trim()) {
      Alert.alert("Reset password", "Enter your email.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const data = await requestPasswordReset(requestEmail);
      const message =
        data?.delivery === "smtp_not_configured" ||
        data?.delivery === "nodemailer_not_installed"
          ? "Reset requested. The backend email delivery is not configured for production yet."
          : data?.message ||
            "If the email exists, you will receive a password reset link.";

      setStatus(message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to request password reset.";
      Alert.alert("Reset password", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("New password", "Password must have at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("New password", "Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      await resetPassword({
        email: initialEmail,
        token: resetToken,
        newPassword,
      });
      setStatus("Password updated successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reset password.";
      Alert.alert("New password", message);
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
              <Text style={styles.formEyebrow}>
                {isResetMode ? "NEW PASSWORD" : "FORGOT PASSWORD"}
              </Text>
              <Text style={styles.formTitle}>
                {isResetMode ? "Change Password" : "Reset Password"}
              </Text>
              <Text style={styles.formSubtitle}>
                {isResetMode
                  ? "Use the token from your email to save a new password."
                  : "Request a reset link using the same app visual style."}
              </Text>

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
                    value={isResetMode ? initialEmail : requestEmail}
                    onChangeText={setRequestEmail}
                    editable={!isResetMode && !loading}
                  />
                </View>
              </View>

              {isResetMode ? (
                <>
                  <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        placeholder="New password"
                        placeholderTextColor="#8f8f8f"
                        secureTextEntry
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        placeholder="Confirm new password"
                        placeholderTextColor="#8f8f8f"
                        secureTextEntry
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              ) : null}

              {status ? <Text style={styles.statusText}>{status}</Text> : null}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={isResetMode ? handleResetPassword : handleRequestReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isResetMode ? "Save new password" : "Request reset"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace("/(login)/Login")}
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

export default ChangePassword;

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
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    color: SUCCESS,
    marginTop: 4,
    marginBottom: 8,
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
