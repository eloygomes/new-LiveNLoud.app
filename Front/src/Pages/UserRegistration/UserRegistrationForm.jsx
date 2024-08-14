import { NavLink } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

function UserRegistrationForm() {
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
        <Box component="form" noValidate sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="fullName"
            label="Full Name"
            name="fullName"
            autoComplete="name"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
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
