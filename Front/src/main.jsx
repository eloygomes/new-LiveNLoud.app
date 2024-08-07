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
import Dashboard from "./Pages/Dashboard";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Menu />}>
      <Route path="/" element={<Dashboard />} />
      {/* <Route path="about" element={<About />} /> */}
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
