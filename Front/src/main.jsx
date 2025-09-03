/* eslint-disable react/prop-types */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

// Router
import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Menu from "./Layouts/Menu";
import Dashboard from "./Pages/Dashboard/Dashboard";
import NewSong from "./Pages/NewSong/NewSong";
import Metronome from "./Pages/Metronome/Metronome";
import EditSong from "./Pages/EditSong/EditSong";
import ChordLibrary from "./Pages/ChordLibrary/ChordLibrary";
import Tuner from "./Pages/Tuner/Tuner";
import Presentation from "./Pages/Presentation/Presentation";
import Login from "./Pages/Login/Login";
import UserRegistration from "./Pages/UserRegistration/UserRegistration";
import UserProfile from "./Pages/UserProfile/UserProfile";

// Firebase Authentication

// Componente para proteger rotas
const ProtectedRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("token");

  return token ? <Component {...rest} /> : <Navigate to="/login" />;
};

// Configuração das rotas
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/userregistration" element={<UserRegistration />} />
      <Route element={<Menu />}>
        <Route
          path="/chordlibrary"
          element={<ProtectedRoute element={ChordLibrary} />}
        />
        <Route path="/" element={<ProtectedRoute element={Dashboard} />} />
        <Route
          path="/editsong/:artist/:song"
          element={<ProtectedRoute element={EditSong} />}
        />
        <Route
          path="/metronome"
          element={<ProtectedRoute element={Metronome} />}
        />
        <Route path="/newsong" element={<ProtectedRoute element={NewSong} />} />
        <Route
          path="/presentation/:artist/:song/:instrument"
          element={<ProtectedRoute element={Presentation} />}
        />
        <Route path="/tuner" element={<ProtectedRoute element={Tuner} />} />
        <Route
          path="/userprofile/:userid"
          element={<ProtectedRoute element={UserProfile} />}
        />
      </Route>
    </>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
