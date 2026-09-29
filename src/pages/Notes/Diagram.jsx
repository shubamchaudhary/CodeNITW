import React, { useEffect, useState } from "react";

// A ```mermaid block in a note renders as a diagram (flowcharts, sequence
// diagrams, state machines, ER diagrams…), so a diagram lives in the note as
// text: it syncs, versions and edits like the rest of the note. Mermaid is
// large, so it is fetched the first time a note has a diagram, never with the
// page itself.

let loading = null;
const loadMermaid = () => (loading ||= import("mermaid").then((m) => m.default));
let seq = 0;

// The text of a hast node — a code block can arrive split into line spans.
export function hastText(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  return (node.children || []).map(hastText).join("");
}

// The <code> inside a <pre> if it's a mermaid block, else null.
export function mermaidCode(pre) {
  const code = (pre?.children || []).find((c) => c.tagName === "code");
  const cls = code?.properties?.className;
  const list = Array.isArray(cls) ? cls : String(cls || "").split(/\s+/);
  return code && list.includes("language-mermaid") ? code : null;
}

export default function Diagram({ code, dark }) {
  const [state, setState] = useState({ svg: null, error: null });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    const id = `note-diagram-${++seq}`;
    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "default" });
        await mermaid.parse(code); // a readable error for bad syntax, before drawing
        const { svg } = await mermaid.render(id, code);
        if (live) setState({ svg, error: null });
      })
      .catch((e) => {
        // A failed render can leave Mermaid's scratch element behind.
        document.getElementById(`d${id}`)?.remove();
        if (live) setState({ svg: null, error: String(e?.message || e).split("\n").filter(Boolean).slice(0, 2).join(" ") });
      });
    return () => {
      live = false;
    };
  }, [code, dark]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (state.error) {
    return (
      <div className="note-diagram note-diagram-error">
        <p>Diagram couldn't be drawn: {state.error}</p>
        <pre>{code}</pre>
      </div>
    );
  }
  if (!state.svg) {
    return (
      <div className="note-diagram note-diagram-loading">
        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20 animate-pulse" />
        drawing diagram…
      </div>
    );
  }
  return (
    <>
      <figure className="note-diagram group">
        <button type="button" className="note-diagram-expand" onClick={() => setOpen(true)} title="Open the diagram full size">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Expand
        </button>
        <div dangerouslySetInnerHTML={{ __html: state.svg }} />
      </figure>
      {open && (
        <div className="note-diagram-overlay" onClick={() => setOpen(false)} role="dialog" aria-label="Diagram">
          <div className="note-diagram-full" onClick={(e) => e.stopPropagation()} dangerouslySetInnerHTML={{ __html: state.svg }} />
          <button type="button" className="note-diagram-close" onClick={() => setOpen(false)}>
            Close (Esc)
          </button>
        </div>
      )}
    </>
  );
}
