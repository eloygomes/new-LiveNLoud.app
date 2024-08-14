import { Button, TextField, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          {/* <div className="flex flex-row my-5 neuphormism-b p-5 "> */}
          <div className="flex items-center justify-center h-screen">
            <Grid container component="main" className=" ">
              <Grid className="w-full sm:w-2/3 md:w-5/12 p-6 shadow-lg mx-auto">
                <div className="m-5 flex flex-col items-center neuphormism-b p-5">
                  <Typography component="h1" variant="h5">
                    Live N Loud
                  </Typography>
                  <Typography className="text-sm">Login</Typography>
                  <form style={{ width: "100%", marginTop: "20px" }} noValidate>
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
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
                    <div className="text-sm flex justify-start w-full pt-5 ">
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
