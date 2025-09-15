import { TextField, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { sendPasswordReset } from "../../authFunctions";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { login as loginApi } from "../../Tools/Controllers"; // ✅ renomeia p/ evitar colisão

function Login() {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login: loginContext } = useAuth(); // ✅ renomeia o do contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = await loginApi(userEmail, userPassword); // ✅ usa Controllers
      if (!accessToken) {
        // Controllers já mostra alert em caso de erro
        return;
      }

      // Atualiza o estado global de auth (se o seu contexto usa isso)
      loginContext(accessToken, userEmail);

      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login inválido. Verifique e-mail e senha.");
      setUserPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (userEmail) {
      alert("Password reset email sent");
      await sendPasswordReset(userEmail);
    } else {
      alert("Insert a valid email");
    }
  };

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex items-center justify-center h-screen">
            <Grid container component="main">
              <Grid className="w-full sm:w-2/3 md:w-5/12 p-6 shadow-lg mx-auto">
                <div className="m-5 flex flex-col items-center neuphormism-b p-5">
                  <Typography component="h1" variant="h5">
                    Live N Loud
                  </Typography>
                  <Typography className="text-sm">Login</Typography>

                  <form
                    style={{ width: "100%", marginTop: "20px" }}
                    noValidate
                    onSubmit={handleLogin}
                  >
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />

                    <div className="flex flex-col">
                      <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                      />
                      <div
                        className="text-[10px] flex justify-end w-full py-1 cursor-pointer"
                        onClick={handlePasswordReset}
                      >
                        Forgot Password?
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        margin: "20px 0 10px",
                        opacity: loading ? 0.6 : 1,
                      }}
                      className="neuphormism-b-btn-gold w-full py-3 transform active:scale-95 transition-transform duration-100"
                    >
                      {loading ? "Logging in..." : "Login"}
                    </button>
                  </form>

                  <Link to="/userregistration">
                    <div className="text-sm flex justify-start w-full pt-5">
                      Create a new account
                    </div>
                  </Link>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
