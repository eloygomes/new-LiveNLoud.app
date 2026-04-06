import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!acceptedTerms) {
      alert("Please accept the Terms of Use.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Criação na autenticação JWT
      await axios.post("https://api.live.eloygomes.com/api/auth/signup", {
        email,
        password,
      });

      // 2️⃣ Cadastro inicial de estrutura vazia com dados do usuário
      const userdata = createDefaultUserdata(email, username, fullName);

      await axios.post("https://api.live.eloygomes.com/api/newsong", {
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
        "https://api.live.eloygomes.com/api/uploadProfileImage",
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Full Name
          </label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="Your full name"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Email
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="you@email.com"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Username
          </label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="@yourname"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Password
          </label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="Create a password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Repeat Password
          </label>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="Repeat your password"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-[18px] bg-white/70 px-4 py-2.5 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="h-4 w-4 accent-[goldenrod]"
        />
        <span>I agree to the Terms of Use.</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="neuphormism-b-btn-gold w-full py-2.5 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-60"
      >
        {loading ? "Creating Account..." : "Sign Up"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Already have access?{" "}
        <NavLink to="/login" className="font-bold uppercase tracking-[0.12em] text-[goldenrod]">
          Sign In
        </NavLink>
      </div>
    </form>
  );
}

export default UserRegistrationForm;
