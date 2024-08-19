import { Button, TextField, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { login } from "../../authFunctions";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate at the top level of the component

  // Função para lidar com o envio do formulário
  const handleSubmit = async (event) => {
    event.preventDefault(); // Evita o recarregamento da página
    try {
      await login(userEmail, userPassword); // Aguarda a conclusão do login
      localStorage.setItem("userEmail", userEmail);
      navigate("/"); // Navigate to the homepage after login
    } catch (error) {
      console.error("Login failed:", error);
      // Você pode adicionar lógica para mostrar uma mensagem de erro ao usuário aqui
    }
  };

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex items-center justify-center h-screen">
            <Grid container component="main" className="">
              <Grid className="w-full sm:w-2/3 md:w-5/12 p-6 shadow-lg mx-auto">
                <div className="m-5 flex flex-col items-center neuphormism-b p-5">
                  <Typography component="h1" variant="h5">
                    Live N Loud
                  </Typography>
                  <Typography className="text-sm">Login</Typography>
                  <form
                    style={{ width: "100%", marginTop: "20px" }}
                    noValidate
                    onSubmit={handleSubmit}
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
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      style={{ margin: "20px 0 10px" }}
                    >
                      Login
                    </Button>
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
