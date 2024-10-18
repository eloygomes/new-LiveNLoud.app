/* eslint-disable no-unused-vars */
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Função para registrar o usuário na API customizada
const registerUserInApi = async (email, password, username, fullName) => {
  try {
    const response = await axios.post(
      "https://www.api.live.eloygomes.com.br/api/newsong",
      {
        databaseComing: "liveNloud_",
        collectionComing: "data",
        userdata: {
          song: "",
          artist: "",
          progressBar: "",
          instruments: {
            guitar01: false,
            guitar02: false,
            bass: false,
            keys: false,
            drums: false,
            voice: false,
          },
          guitar01: {
            active: "",
            capo: "",
            lastPlay: "",
            link: "",
            progress: "",
            songCifra: "",
            tuning: "",
          },
          guitar02: {
            active: "",
            capo: "",
            lastPlay: "",
            link: "",
            progress: "",
            songCifra: "",
            tuning: "",
          },
          bass: {
            active: "",
            capo: "",
            lastPlay: "",
            link: "",
            progress: "",
            songCifra: "",
            tuning: "",
          },
          keys: {
            active: "",
            capo: "",
            lastPlay: "",
            link: "",
            progress: "",
            songCifra: "",
            tuning: "",
          },
          drums: {
            active: "",
            capo: "",
            lastPlay: "",
            link: "",
            progress: "",
            songCifra: "",
            tuning: "",
          },
          voice: {
            active: "",
            capo: "",
            lastPlay: "",
            link: "",
            progress: "",
            songCifra: "",
            tuning: "",
          },
          embedVideos: "",
          addedIn: "",
          updateIn: "",
          email: email,
          username: username,
          fullName: fullName,
        },
        // userdata: {
        //   email: email,
        //   username: username,
        //   fullName: fullName,
        //   // password: password,
        // },
      }
    );
    // console.log("User registered in API:", response.data);
  } catch (error) {
    console.error("Error registering user in API:", error);
    throw new Error("API registration failed");
  }
};

// Função para registrar o usuário no Firebase
const registerUserInFirebase = async (email, password) => {
  const auth = getAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    // console.log("User registered in Firebase:", userCredential.user);
  } catch (error) {
    console.error("Error registering user in Firebase:", error);
    throw error;
  }
};

function UserRegistrationForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // Primeiro, registra na API customizada
      await registerUserInApi(email, password, username, fullName);

      // Depois, registra no Firebase
      await registerUserInFirebase(email, password);

      alert("Sign up successful!");
      navigate("/login");
    } catch (error) {
      console.error("Error during sign up:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use.");
      } else {
        alert("An error occurred during sign up. Please try again.");
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <Box component="form" noValidate sx={{ mt: 3 }} onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="fullName"
            label="Full Name"
            name="fullName"
            autoComplete="name"
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email "
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Repeat Password"
            type="password"
            id="confirmPassword"
            autoComplete="current-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox value="terms" color="primary" />}
            label="I agree to the Terms of Use"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            color="primary"
          >
            Sign Up
          </Button>
          <Box sx={{ textAlign: "center" }}>
            <NavLink to="/login" variant="body2">
              Sign in →
            </NavLink>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default UserRegistrationForm;
