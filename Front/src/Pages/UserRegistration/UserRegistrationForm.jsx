// /* eslint-disable no-unused-vars */
// import { useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import {
//   Box,
//   Button,
//   Checkbox,
//   Container,
//   FormControlLabel,
//   TextField,
//   Typography,
// } from "@mui/material";
// import axios from "axios";
// import { DEFAULT_IMAGE_BASE64 } from "./defaultProfileImage";

// // 📌 Imagem padrão em base64 (exemplo)

// function UserRegistrationForm() {
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (password !== confirmPassword) {
//       alert("Passwords do not match");
//       return;
//     }

//     try {
//       // 1️⃣ Criação na autenticação JWT
//       await axios.post("https://api.live.eloygomes.com.br/api/auth/signup", {
//         email,
//         password,
//       });

//       const userdata = {
//         song: "",
//         artist: "",
//         progressBar: 0,
//         instruments: {
//           guitar01: false,
//           guitar02: false,
//           bass: false,
//           keys: false,
//           drums: false,
//           voice: false,
//         },
//         guitar01: {
//           active: "",
//           capo: "",
//           lastPlay: "",
//           link: "",
//           progress: "",
//           songCifra: "",
//           tuning: "",
//         },
//         guitar02: {
//           active: "",
//           capo: "",
//           lastPlay: "",
//           link: "",
//           progress: "",
//           songCifra: "",
//           tuning: "",
//         },
//         bass: {
//           active: "",
//           capo: "",
//           lastPlay: "",
//           link: "",
//           progress: "",
//           songCifra: "",
//           tuning: "",
//         },
//         keys: {
//           active: "",
//           capo: "",
//           lastPlay: "",
//           link: "",
//           progress: "",
//           songCifra: "",
//           tuning: "",
//         },
//         drums: {
//           active: "",
//           capo: "",
//           lastPlay: "",
//           link: "",
//           progress: "",
//           songCifra: "",
//           tuning: "",
//         },
//         voice: {
//           active: "",
//           capo: "",
//           lastPlay: "",
//           link: "",
//           progress: "",
//           songCifra: "",
//           tuning: "",
//         },
//         embedVideos: [],
//         addedIn: new Date().toISOString().split("T")[0],
//         updateIn: new Date().toISOString().split("T")[0],
//         email,
//         username,
//         fullName,
//       };

//       await axios.post("https://api.live.eloygomes.com.br/api/newsong", {
//         databaseComing: "liveNloud_",
//         collectionComing: "data",
//         userdata,
//       });

//       // 3️⃣ Upload de imagem padrão de perfil
//       const blob = await (
//         await fetch(`data:image/jpeg;base64,${DEFAULT_IMAGE_BASE64}`)
//       ).blob();
//       const formData = new FormData();
//       formData.append("email", email);
//       formData.append(
//         "profileImage",
//         new File([blob], "default.jpeg", { type: "image/jpeg" })
//       );

//       await axios.post(
//         "https://api.live.eloygomes.com.br/api/uploadProfileImage",
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       alert("Cadastro realizado com sucesso!");
//       navigate("/login");
//     } catch (error) {
//       console.error("Erro no cadastro:", error);
//       if (error?.response?.data?.error === "Email já registrado") {
//         alert("Esse e-mail já está em uso.");
//       } else {
//         alert("Erro ao cadastrar. Tente novamente.");
//       }
//     }
//   };

//   return (
//     <Container maxWidth="sm">
//       <Box
//         sx={{
//           marginTop: 1,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//         }}
//       >
//         <Typography component="h1" variant="h5">
//           Sign Up
//         </Typography>
//         <Box component="form" noValidate sx={{ mt: 3 }} onSubmit={handleSubmit}>
//           <TextField
//             fullWidth
//             required
//             label="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//           />
//           <TextField
//             fullWidth
//             required
//             label="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <TextField
//             fullWidth
//             required
//             label="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//           />
//           <TextField
//             fullWidth
//             required
//             type="password"
//             label="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//           <TextField
//             fullWidth
//             required
//             type="password"
//             label="Repeat Password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//           />
//           <FormControlLabel
//             control={<Checkbox value="terms" color="primary" />}
//             label="I agree to the Terms of Use"
//           />
//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             sx={{ mt: 3, mb: 2 }}
//             color="primary"
//           >
//             Sign Up
//           </Button>
//           <Box sx={{ textAlign: "center" }}>
//             <NavLink to="/login" variant="body2">
//               Sign in →
//             </NavLink>
//           </Box>
//         </Box>
//       </Box>
//     </Container>
//   );
// }

// export default UserRegistrationForm;

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
import { DEFAULT_IMAGE_BASE64 } from "./defaultProfileImage";

// 👉 Cria a estrutura completa esperada pela API
function createDefaultUserdata(email, username, fullName) {
  const emptyInstrument = {
    active: "",
    capo: "",
    lastPlay: "",
    link: "",
    progress: "",
    songCifra: "",
    tuning: "",
  };

  return {
    song: "",
    artist: "",
    progressBar: 0,
    instruments: {
      guitar01: false,
      guitar02: false,
      bass: false,
      keys: false,
      drums: false,
      voice: false,
    },
    guitar01: { ...emptyInstrument },
    guitar02: { ...emptyInstrument },
    bass: { ...emptyInstrument },
    keys: { ...emptyInstrument },
    drums: { ...emptyInstrument },
    voice: { ...emptyInstrument },
    embedVideos: [],
    addedIn: new Date().toISOString().split("T")[0],
    updateIn: new Date().toISOString().split("T")[0],
    email,
    username,
    fullName,
  };
}

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
      // 1️⃣ Criação na autenticação JWT
      await axios.post("https://api.live.eloygomes.com.br/api/auth/signup", {
        email,
        password,
      });

      // 2️⃣ Cadastro inicial de estrutura vazia com dados do usuário
      const userdata = createDefaultUserdata(email, username, fullName);

      await axios.post("https://api.live.eloygomes.com.br/api/newsong", {
        databaseComing: "liveNloud_",
        collectionComing: "data",
        userdata,
      });

      // 3️⃣ Upload de imagem de perfil padrão
      const blob = await (
        await fetch(`data:image/jpeg;base64,${DEFAULT_IMAGE_BASE64}`)
      ).blob();
      const formData = new FormData();
      formData.append("email", email);
      formData.append(
        "profileImage",
        new File([blob], "default.jpeg", { type: "image/jpeg" })
      );

      await axios.post(
        "https://api.live.eloygomes.com.br/api/uploadProfileImage",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Cadastro realizado com sucesso!");
      navigate("/login");
    } catch (error) {
      console.error("Erro no cadastro:", error);
      if (error?.response?.data?.error === "Email já registrado") {
        alert("Esse e-mail já está em uso.");
      } else {
        alert("Erro ao cadastrar. Tente novamente.");
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 1,
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
            fullWidth
            required
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <TextField
            fullWidth
            required
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            required
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            required
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            fullWidth
            required
            type="password"
            label="Repeat Password"
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
