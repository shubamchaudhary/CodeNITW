// Temporary: renders a built-in doc through the real notes reader (deleted after checking).
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../../src/input.css";
import "../../src/pages/Notes/notes.css";
import NoteReader from "../../src/pages/Notes/NoteReader.jsx";
import text from "../../src/Data/projectsDocs/LL-01.md?raw";

const ASSETS = {};
const NOOP = () => {};
const NONE = [];

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <NoteReader text={text} editable={false} assets={ASSETS} onCommit={NOOP} annotations={NONE} />
    </div>
  </BrowserRouter>,
);
