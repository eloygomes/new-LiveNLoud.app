import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import defaultProfileImageUrl from "../../assets/userPerfil.jpg";

const DEFAULT_SETLISTS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];

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
    setlist: [...DEFAULT_SETLISTS],
    addedIn: new Date().toISOString().split("T")[0],
    updateIn: new Date().toISOString().split("T")[0],
    id: 1,
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
  const [signupModal, setSignupModal] = useState({
    open: false,
    title: "",
    message: "",
  });
  const navigate = useNavigate();

  const postJson = async (url, payload) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  };

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
      const signupResponse = await postJson("https://api.live.eloygomes.com/api/auth/signup", {
        email,
        password,
        fullName,
        username,
      });

      // 2️⃣ Cadastro inicial de estrutura vazia com dados do usuário
      const userdata = createDefaultUserdata(email, username, fullName);

      await postJson("https://api.live.eloygomes.com/api/signup", {
        databaseComing: "liveNloud_",
        collectionComing: "data",
        userdata,
      });

      // 3️⃣ Upload de imagem de perfil padrão
      const blob = await (await fetch(defaultProfileImageUrl)).blob();
      const formData = new FormData();
      formData.append("email", email);
      formData.append(
        "profileImage",
        new File([blob], "default.jpeg", { type: "image/jpeg" })
      );

      const uploadResponse = await fetch(
        "https://api.live.eloygomes.com/api/uploadProfileImage",
        {
          method: "POST",
          body: formData,
        }
      );
      if (!uploadResponse.ok) {
        throw new Error(`HTTP ${uploadResponse.status}`);
      }

      const signupMessage =
        signupResponse?.approvalStatus === "pending"
          ? "Cadastro recebido. Sua conta aguarda aprovacao."
          : "Cadastro realizado com sucesso.";
      const deliveryWarning =
        signupResponse?.delivery && signupResponse.delivery !== "sent"
          ? "\n\nAviso: o email automatico de aprovacao ainda nao foi enviado. O cadastro foi salvo, mas o administrador precisa aprovar manualmente ou corrigir o SMTP."
          : "";

      setSignupModal({
        open: true,
        title: "Conta criada",
        message: `${signupMessage}${deliveryWarning}\n\nVocê poderá entrar após a aprovação.`,
      });
    } catch (error) {
      console.error("Erro no cadastro:", error);
      if (error?.response?.data?.error === "Email já registrado") {
        alert("Esse e-mail já está em uso.");
      } else if (error?.response?.data?.approvalStatus === "pending") {
        setSignupModal({
          open: true,
          title: "Conta em aprovação",
          message:
            "Cadastro recebido. Sua conta aguarda aprovacao.\n\nVocê poderá entrar após a aprovação.",
        });
      } else {
        alert(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Erro ao cadastrar. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      {signupModal.open ? (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[goldenrod]/15 text-[goldenrod]">
                <span className="text-xl font-black">!</span>
              </div>
              <h3 className="text-xl font-black text-black">{signupModal.title}</h3>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
              {signupModal.message}
            </p>
            <button
              type="button"
              className="neuphormism-b-btn-gold mt-6 w-full py-3 text-sm font-bold uppercase tracking-[0.18em]"
              onClick={() => {
                setSignupModal({ open: false, title: "", message: "" });
                navigate("/login");
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default UserRegistrationForm;
