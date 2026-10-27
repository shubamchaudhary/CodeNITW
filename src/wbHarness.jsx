// TEMPORARY local preview harness (delete after checking).
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./input.css";
import WebBasics from "./pages/WebBasics/WebBasics";
import { setAuthState } from "./Data/authGate";
setAuthState("user");
createRoot(document.getElementById("root")).render(
  <BrowserRouter><div id="page-root"><Routes>
    {["javascript", "react", "nodejs", "python", "fastapi"].map((k) => <Route key={k} path={`/${k}/:mod?`} element={<WebBasics techKey={k} />} />)}
    <Route path="*" element={<WebBasics techKey="python" />} />
  </Routes></div></BrowserRouter>
);
