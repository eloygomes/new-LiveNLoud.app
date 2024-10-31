// src/authFunctions.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { auth } from "./firebase"; // Importa o auth do arquivo firebase.js

// Função para reautenticar um usuário
export async function reauthenticateUser(oldPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, credential);
}

// Função para alterar a senha
export async function changeUserPassword(newPassword) {
  const user = auth.currentUser;
  await updatePassword(user, newPassword);
}

// Função para registrar um usuário
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User registered:", userCredential.user);
  } catch (error) {
    console.error("Error registering user:", error.message);
  }
};

// Função para logar um usuário
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User logged in:", userCredential.user);
  } catch (error) {
    console.error("Error logging in:", error.message);
  }
};

// Função para deslogar um usuário
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
};

// Função para logar com Google
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("User logged in with Google:", result.user);
  } catch (error) {
    console.error("Error logging in with Google:", error.message);
  }
};

// Função para enviar e-mail de redefinição de senha
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("E-mail de redefinição de senha enviado");
  } catch (error) {
    console.error(
      "Erro ao enviar e-mail de redefinição de senha:",
      error.message
    );
  }
};
