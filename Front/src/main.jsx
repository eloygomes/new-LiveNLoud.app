import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Router
import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import Menu from "./Layouts/Menu";
import Dashboard from "./Pages/Dashboard/Dashboard";
import NewSong from "./Pages/NewSong/NewSong";
import Metronome from "./Pages/Metronome/Metronome";
import EditSong from "./Pages/EditSong/EditSong";
import ChordLibrary from "./Pages/ChordLibrary/ChordLibrary";
import Tuner from "./Pages/Tuner/Tuner";
import Presentation from "./Pages/Presentation/Presentation";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Menu />}>
      <Route path="/chordlibrary" element={<ChordLibrary />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/editsong/:idsong" element={<EditSong />} />
      <Route path="/metronome" element={<Metronome />} />
      <Route path="/newsong" element={<NewSong />} />
      <Route path="/presentation/:idsong" element={<Presentation />} />
      <Route path="/tuner" element={<Tuner />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
