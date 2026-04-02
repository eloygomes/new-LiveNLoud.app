import { ImageBackground } from "expo-image";
import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  Text,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Button,
  Keyboard,
} from "react-native";

const KeyboardAvoidingComponent: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = () => {
    // TODO: integrar lógica de login aqui
    console.log("Email:", email, "Senha:", password);
  };

  const handleForgotPassword = () => {
    // TODO: navegar para recuperação de senha
    console.log("Recuperar senha");
  };

  const handleSignUp = () => {
    // TODO: navegar para cadastro de novo usuário
    console.log("Novo cadastro");
  };

  return (
    <>
      <ImageBackground
        source={require("../../assets/images/rockBand03.png")}
        // resizeMode="cover"
        style={styles.image}
      >
        <View>
          <Text style={styles.imageText}>SUA HORA DE BRILHAR</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          style={styles.container}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inner}>
              <Text style={styles.header}>Login</Text>

              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />

              <TextInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.textInput}
              />

              <View style={styles.btnContainer}>
                <Button title="Entrar" onPress={handleLogin} />
              </View>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.link}>Recuperar senha</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.link}>Novo cadastro</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    fontSize: 32,
    marginBottom: 24,
    textAlign: "center",
  },
  textInput: {
    height: 48,
    borderColor: "#000",
    borderBottomWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  btnContainer: {
    marginBottom: 20,
  },
  link: {
    color: "#0066cc",
    textAlign: "center",
    marginTop: 12,
  },
  image: {
    // flex: 1,
    width: "100%",
    height: "100%",
  },
  imageText: {
    color: "pink",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    marginTop: 60,
  },
});

export default KeyboardAvoidingComponent;
