import React from "react";
import ReactDOM from "react-dom/client";
import "./input.css";
// Firebase's app first: App and the stores call getAuth() at once.
import "./firebase";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
