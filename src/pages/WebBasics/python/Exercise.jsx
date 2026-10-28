import React, { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { getStatus, onStatus, runPython, warmUp } from "./pyRunner";

// The working part of a Python exercise (WebBasics.jsx draws its heading):
// the task, an editor, and Run, which runs your code and then the exercise's
// checks in real Python. Loaded on its own chunk, so the editor only comes
// down with the first module that has an exercise.
//
// "write" and "fix" exercises are an editor plus checks; "predict" shows code
// you can't edit and asks what it prints, then runs it and compares.
//
// The editor has no autocomplete on purpose: interview pads don't either.

function usePythonStatus() {
  const [s, setS] = useState(getStatus);
  useEffect(() => onStatus(setS), []);
  return s;
}

export default function Exercise({ q, isDone, onSolved, savedCode, onSaveCode, colorMode }) {
  const ex = q.exercise;
  const predicting = q.kind === "predict";
  const initial = predicting ? "" : ex.starter;

  const [code, setCode] = useState(savedCode ?? initial);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const status = usePythonStatus();

  // Your code is kept as you type (a beat after you stop), and forgotten
  // again once it's back to the starter.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const t = setTimeout(() => onSaveCode(q.id, code === initial ? "" : code), 800);
    return () => clearTimeout(t);
  }, [code, initial, q.id, onSaveCode]);

  const run = async () => {
    if (running) return;
    setRunning(true);
    try {
      const r = predicting ? await runPython(ex.predict) : await runPython(code, ex.tests);
      const out = predicting && !r.timedOut ? { ...r, compare: compareOutput(code, r.stdout) } : r;
      setResult(out);
      if (solved(out, predicting) && !isDone) onSolved(q.id);
    } catch (e) {
      setResult({ failed: String(e?.message || e) });
    } finally {
      setRunning(false);
    }
  };
  const runRef = useRef(run);
  runRef.current = run;

  const extensions = useMemo(
    () => [
      python(),
      indentUnit.of("    "),
      Prec.highest(keymap.of([{ key: "Mod-Enter", run: () => (runRef.current(), true) }])),
    ],
    []
  );

  const reset = () => {
    if (code !== initial && !window.confirm("Start over? Your code for this exercise goes back to the starter.")) return;
    setCode(initial);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <Md source={ex.prompt} colorMode={colorMode} size="16.5px" />

      {predicting && (
        <>
          <Editor value={ex.predict} readOnly extensions={extensions} colorMode={colorMode} />
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-fg-muted">What does it print? One line per print.</p>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  run();
                }
              }}
              onFocus={warmUp}
              rows={Math.max(3, ex.predict.split("print(").length - 1)}
              spellCheck={false}
              placeholder="Type the output you expect…"
              className="w-full resize-y rounded-lg border border-line-strong bg-canvas px-3.5 py-3 text-[14.5px] leading-relaxed font-mono text-fg focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </>
      )}
      {!predicting && <Editor value={code} onChange={setCode} onFocus={warmUp} extensions={extensions} colorMode={colorMode} />}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={running || (predicting && !code.trim())}
          className="h-9 pl-3 pr-4 rounded-lg flex items-center gap-1.5 text-[13.5px] font-semibold text-white bg-success hover:opacity-90 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 3.2v9.6a.6.6 0 00.9.5l7.6-4.8a.6.6 0 000-1L5.4 2.7a.6.6 0 00-.9.5z" />
          </svg>
          {running ? (status === "loading" ? "Loading Python…" : "Running…") : predicting ? "Check" : "Run"}
        </button>
        <span className="text-[12px] text-fg-subtle mr-auto">Ctrl+Enter</span>
        {ex.hint && (
          <SmallButton onClick={() => setShowHint((v) => !v)}>{showHint ? "Hide hint" : "Hint"}</SmallButton>
        )}
        {!predicting && <SmallButton onClick={reset}>Reset</SmallButton>}
        {(ex.solution || ex.why) && (
          <SmallButton onClick={() => setShowSolution((v) => !v)}>
            {showSolution ? "Hide solution" : predicting ? "Show answer" : "Solution"}
          </SmallButton>
        )}
      </div>

      {running && status === "loading" && (
        <p className="text-[13px] text-fg-subtle">Loading Python in your browser — about 10 MB, only the first time.</p>
      )}

      {showHint && (
        <div className="rounded-lg border border-line bg-warning-subtle px-4 py-3">
          <p className="text-[12px] font-semibold text-warning-fg">Hint</p>
          <Md source={ex.hint} colorMode={colorMode} size="15px" />
        </div>
      )}

      {result && <Result result={result} predicting={predicting} />}

      {showSolution && (
        <div className="rounded-lg border border-line bg-surface-subtle px-4 py-3">
          <p className="text-[12px] font-semibold text-fg-muted">{predicting ? "Answer" : "One solution"}</p>
          {ex.solution && <Md source={"```python\n" + ex.solution + "\n```"} colorMode={colorMode} size="15px" />}
          {ex.why && <Md source={ex.why} colorMode={colorMode} size="15px" />}
        </div>
      )}
    </div>
  );
}

function solved(r, predicting) {
  if (!r || r.timedOut || r.failed || r.error) return false;
  if (predicting) return r.compare.every((l) => l.ok);
  return r.checks.length > 0 && r.checks.every((c) => c.ok);
}

// Your prediction against what it printed, line by line. Trailing spaces and
// blank lines at the end don't count.
function compareOutput(prediction, actual) {
  const lines = (s) => s.replace(/\r/g, "").replace(/\s+$/, "").split("\n").map((l) => l.replace(/\s+$/, ""));
  const mine = lines(prediction);
  const real = lines(actual);
  return Array.from({ length: Math.max(mine.length, real.length) }, (_, i) => ({
    mine: mine[i] ?? "",
    real: real[i] ?? "",
    ok: (mine[i] ?? "") === (real[i] ?? ""),
  }));
}

function Result({ result, predicting }) {
  if (result.failed) {
    return <Panel tone="danger" title="Python couldn't start">{result.failed} — check your connection and try again.</Panel>;
  }
  if (result.timedOut) {
    return (
      <Panel tone="danger" title={`Stopped after ${result.limitMs / 1000} seconds`}>
        Usually an infinite loop: a <code>while</code> whose condition never turns false, or recursion with no base case.
      </Panel>
    );
  }
  if (result.error) {
    return (
      <div className="space-y-3">
        <Panel tone="danger" title={`${result.error.type}${result.error.line ? ` on line ${result.error.line}` : ""}`}>
          <Pre>{result.error.text}</Pre>
        </Panel>
        {result.stdout && <Printed text={result.stdout} />}
      </div>
    );
  }

  if (predicting) {
    const ok = result.compare.every((l) => l.ok);
    return (
      <Panel tone={ok ? "success" : "danger"} title={ok ? "Exactly right" : "Not quite — the differences are marked"}>
        <div className="grid grid-cols-2 gap-3 text-[13.5px]">
          <div>
            <p className="mb-1 text-[11.5px] font-semibold text-fg-subtle">You said</p>
            <Pre>
              {result.compare.map((l, i) => (
                <div key={i} className={l.ok ? "" : "text-danger-fg font-semibold"}>
                  {l.mine || " "}
                </div>
              ))}
            </Pre>
          </div>
          <div>
            <p className="mb-1 text-[11.5px] font-semibold text-fg-subtle">Python printed</p>
            <Pre>
              {result.compare.map((l, i) => (
                <div key={i} className={l.ok ? "" : "text-success-fg font-semibold"}>
                  {l.real || " "}
                </div>
              ))}
            </Pre>
          </div>
        </div>
      </Panel>
    );
  }

  const passed = result.checks.filter((c) => c.ok).length;
  const all = passed === result.checks.length;
  return (
    <div className="space-y-3">
      <Panel tone={all ? "success" : "danger"} title={all ? `All ${passed} checks passed` : `${passed} of ${result.checks.length} checks passed`}>
        <ul className="space-y-1.5">
          {result.checks.map((c, i) => (
            <li key={i} className="text-[13.5px]">
              <div className="flex items-start gap-2">
                <span className={`shrink-0 font-bold ${c.ok ? "text-success-fg" : "text-danger-fg"}`}>{c.ok ? "✓" : "✗"}</span>
                <code className="font-mono text-fg break-all">{c.label}</code>
              </div>
              {!c.ok && (
                <div className="ml-5 mt-1 space-y-0.5 font-mono text-[12.5px] text-fg-muted break-all">
                  {c.expr && <div>check: {c.expr}</div>}
                  {c.got !== undefined && <div>got: <span className="text-danger-fg">{c.got}</span></div>}
                  {c.want !== undefined && <div>expected: <span className="text-success-fg">{c.want}</span></div>}
                  {c.error && <Pre>{c.error.text}</Pre>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>
      {result.stdout && <Printed text={result.stdout} />}
    </div>
  );
}

function Printed({ text }) {
  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-fg-subtle">Printed</p>
      <Pre>{text}</Pre>
    </div>
  );
}

function Panel({ tone, title, children }) {
  const cls = tone === "success" ? "bg-success-subtle text-success-fg" : "bg-danger-subtle text-danger-fg";
  return (
    <div className="rounded-lg border border-line overflow-hidden">
      <p className={`px-4 py-2 text-[13.5px] font-semibold ${cls}`}>{title}</p>
      <div className="px-4 py-3 text-[14px] text-fg">{children}</div>
    </div>
  );
}

function Pre({ children }) {
  return (
    <pre className="m-0 max-h-72 overflow-auto rounded-md bg-surface-subtle px-3 py-2 text-[12.5px] leading-relaxed font-mono text-fg whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function SmallButton({ onClick, children }) {
  return (
    <button onClick={onClick} className="h-9 px-3 rounded-lg text-[13px] font-semibold text-fg-muted border border-line hover:bg-surface-hover">
      {children}
    </button>
  );
}

function Editor({ value, onChange, onFocus, readOnly, extensions, colorMode }) {
  return (
    <div className="rounded-lg border border-line-strong overflow-hidden text-[14.5px]">
      <CodeMirror
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        readOnly={readOnly}
        editable={!readOnly}
        extensions={extensions}
        theme={colorMode === "dark" ? "dark" : "light"}
        minHeight={readOnly ? undefined : "160px"}
        basicSetup={{ autocompletion: false, foldGutter: false, highlightActiveLine: !readOnly, highlightActiveLineGutter: !readOnly, searchKeymap: false }}
      />
    </div>
  );
}

function Md({ source, colorMode, size }) {
  if (!source) return null;
  return (
    <div className="note-md" data-color-mode={colorMode} style={{ "--note-fs": size }}>
      <MarkdownPreview source={source} style={{ background: "transparent" }} wrapperElement={{ "data-color-mode": colorMode }} />
    </div>
  );
}
