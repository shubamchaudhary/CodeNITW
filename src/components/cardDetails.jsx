import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_CONFIG } from "../Data/JobHuntPlan";
import { GLASS_PANEL } from "./glass";

// Shared expandable body for an Interview Prep card. Rendered identically on the
// Interview Prep page and inside the Planning page so a planned card shows the
// exact same details (what to study, prompt, tags, notes) — not just its name.
export function InterviewCardDetail({ item, note, onNoteChange }) {
  const [copied, setCopied] = useState(false);
  const [localNote, setLocalNote] = useState(note);
  const debounceRef = useRef(null);

  useEffect(() => { setLocalNote(note); }, [note]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onNoteChange(val), 400);
    },
    [onNoteChange]
  );

  if (!item) return null;

  const primaryCfg = CATEGORY_CONFIG[item.primaryCategory];

  const copyPrompt = () => {
    navigator.clipboard.writeText(item.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      {item.keyTopics && item.keyTopics.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className={`w-1 h-3 rounded-full ${primaryCfg.bar}`} />
            What to Study
          </h4>
          <ul className="space-y-1">
            {item.keyTopics.map((topic, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.prompt && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-1 h-3 rounded-full ${primaryCfg.bar}`} />
              Prompt for Claude
            </h4>
            <button
              onClick={copyPrompt}
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all ${copied ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"}`}
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                    <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                    <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Copy Prompt
                </>
              )}
            </button>
          </div>
          <div className={`${GLASS_PANEL} rounded-lg p-4`}>
            <pre className="text-[11.5px] text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{item.prompt}</pre>
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 p-4 shadow-inner">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-cyan-400" />
            My Notes
          </h4>
          <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">auto-saved · revisit later</span>
        </div>
        <textarea
          value={localNote}
          onChange={handleNoteInput}
          placeholder="Write your notes, key insights, things to remember..."
          rows={8}
          className="w-full p-4 text-sm rounded-lg border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 dark:focus:border-blue-500 resize-y min-h-[180px] transition-all leading-relaxed shadow-sm"
        />
        <div className="flex items-center justify-between mt-2 min-h-[16px]">
          {localNote ? (
            <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>
              Notes saved
            </p>
          ) : <span />}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{localNote.length} chars</span>
        </div>
      </div>
    </div>
  );
}

// Copy-to-clipboard chip. Used wherever a name has to be carried into another
// app by hand — e.g. a video title pasted into a YouTube playlist's search.
export function CopyButton({ value, label = "Copy", title, className = "" }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      onClick={copy}
      title={title || `Copy "${value}"`}
      className={`inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md border transition-all ${
        copied
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
          : "bg-white/70 dark:bg-white/[0.05] border-gray-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16"><path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
            <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// Shared expandable body for a Core Stack topic — why it sits at its priority,
// the resources behind it, the interview-question chain to attempt cold, and a
// way into the topic's notes page. Rendered on the Core Stack board and inside
// the Planning page so a planned topic shows the same detail in both places.
export function CoreStackTopicDetail({ topic, note, checkedDays }) {
  if (!topic) return null;

  return (
    <div>
      {topic.why && (
        <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 bg-slate-500/[0.07] border border-slate-500/20">
          <span className="text-[13px] shrink-0">🎯</span>
          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">{topic.why}</p>
        </div>
      )}

      <ResourceList
        resources={topic.resources}
        duration={topic.duration}
        barClass="from-emerald-400 to-teal-400"
        linkHover="hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-300"
      />

      <QuestionList questions={topic.questions} barClass="from-emerald-400 to-teal-400" prompt="answer cold, before watching" />

      <NotesLink
        source="corestack"
        topicId={topic.id}
        note={note}
        checkedDays={checkedDays}
        accent={{
          panel: "border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60",
          bar: "from-emerald-400 to-teal-400",
          badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
          button: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30",
        }}
      />
    </div>
  );
}

// One resource row. A video from a playlist gets "copy the title, open the
// playlist" (the playlist is the chosen source, so nothing links to a loose
// video); a video with its own URL gets a watch link; a doc gets an open link;
// and a "self" resource gets no link at all, because it is your own codebase.
function ResourceRow({ resource: r, linkHover }) {
  const isPlaylistVideo = r.kind === "video" && !!r.playlistUrl;

  return (
    <div className={`${GLASS_PANEL} rounded-xl px-3 py-2.5`}>
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 border tabular-nums ${
            r.kind === "self"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25"
              : r.kind === "doc"
              ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/25"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
          }`}
          title={isPlaylistVideo ? `Position ${r.position} in "${r.playlist}"` : r.kind}
        >
          {isPlaylistVideo ? `#${r.position}` : r.kind === "doc" ? "DOC" : r.kind === "self" ? "YOU" : "▶"}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-snug">{r.title}</p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            {[r.source, r.playlist, r.minutes ? `${r.estimate ? "≈" : ""}${r.minutes}m` : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {r.note && (
            <p className="text-[12px] text-amber-600 dark:text-amber-300/90 mt-1 leading-relaxed">↳ {r.note}</p>
          )}
        </div>
      </div>

      {r.kind !== "self" && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <CopyButton value={r.title} label="Copy title" title="Copy the title to search for it" />
          {isPlaylistVideo && (
            <a
              href={r.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md bg-white/70 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all ${linkHover}`}
              title={`Open "${r.playlist}" — this is video #${r.position}`}
            >
              Playlist
              <ExternalIcon />
            </a>
          )}
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md bg-white/70 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all ${linkHover}`}
              title={r.url}
            >
              {r.kind === "doc" ? "Read" : "Watch"}
              <ExternalIcon />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceList({ resources, duration, barClass, linkHover }) {
  if (!resources || !resources.length) return null;
  return (
    <div className="mb-4">
      <h4 className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className={`w-1 h-4 rounded-full bg-gradient-to-b ${barClass}`} />
        Resources
        <span className="font-semibold normal-case tracking-normal text-gray-400 dark:text-gray-500">
          · {resources.length} · {duration}
        </span>
      </h4>
      <div className="space-y-2">
        {resources.map((r) => (
          <ResourceRow key={r.id} resource={r} linkHover={linkHover} />
        ))}
      </div>
    </div>
  );
}

function QuestionList({ questions, barClass, prompt }) {
  if (!questions || !questions.length) return null;
  return (
    <div className="mb-4">
      <h4 className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className={`w-1 h-4 rounded-full bg-gradient-to-b ${barClass}`} />
        Interview questions
        <span className="font-semibold normal-case tracking-normal text-gray-400 dark:text-gray-500">· {prompt}</span>
      </h4>
      <ol className="space-y-1.5">
        {questions.map((q, i) => (
          <li key={i} className="flex items-start gap-2 text-[13.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
            <span className="mt-[3px] text-[12px] font-bold text-gray-400 dark:text-gray-500 tabular-nums shrink-0">{i + 1}.</span>
            {q}
          </li>
        ))}
      </ol>
    </div>
  );
}

// Notes moved to their own page — markdown, screenshots, room to think. What
// stays on the card is a preview and the way in.
function NotesLink({ source, topicId, note, checkedDays, accent }) {
  const text = note || "";
  const images = (text.match(/!\[[^\]]*\]\((?!\s*\))/g) || []).length;
  const preview = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[#>*`_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className={`rounded-xl border p-3.5 shadow-inner ${accent.panel}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className={`w-1 h-4 rounded-full bg-gradient-to-b ${accent.bar}`} />
          My Notes
        </h4>
        {checkedDays != null && (
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap border ${accent.badge}`}>
            ✓ {checkedDays === 0 ? "today" : checkedDays === 1 ? "1d ago" : `${checkedDays}d ago`}
          </span>
        )}
      </div>

      {preview ? (
        <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-3">
          {preview.slice(0, 240)}
          {preview.length > 240 ? "…" : ""}
        </p>
      ) : (
        <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-3">
          Nothing written yet — the notes page takes markdown, code blocks and pasted screenshots.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Link
          to={`/notes/${source}/${topicId}`}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-1.5 rounded-lg text-white shadow-lg transition-all hover:brightness-110 ${accent.button}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
            <path d="M11 2.5l2.5 2.5M3 13l8.5-8.5 2.5 2.5L5.5 15.5 2.5 16l.5-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {text ? "Open notes" : "Write notes"}
        </Link>
        {text && (
          <span className="text-[11.5px] text-gray-400 dark:text-gray-500">
            {words} word{words === 1 ? "" : "s"}
            {images > 0 ? ` · ${images} screenshot${images === 1 ? "" : "s"}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12">
      <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Shared expandable body for an AI Stack topic — the single resource for it,
// the depth ceiling (what is enough, and where reading further stops paying),
// the interview questions, and the way into its notes page.
export function AIStackTopicDetail({ topic, note, checkedDays }) {
  if (!topic) return null;
  const r = topic.resource;

  return (
    <div>
      {/* The map marks these topics as ones a resume claim will be probed on —
          the general concept alone isn't enough there, so it's said out loud. */}
      {topic.resumeLinked && topic.flag && (
        <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/25">
          <span className="text-[13px] shrink-0">⚠️</span>
          <p className="text-[13.5px] text-amber-700 dark:text-amber-200/90 leading-relaxed">{topic.flag}</p>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
          Resource
          <span className="font-semibold normal-case tracking-normal text-gray-400 dark:text-gray-500">
            · {topic.duration}
          </span>
        </h4>

        <div className={`${GLASS_PANEL} rounded-xl px-3 py-2.5`}>
          <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-snug">{r.name}</p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            {[r.publisher, r.path && `→ ${r.path}`].filter(Boolean).join(" ")}
          </p>
          {r.readNote && (
            <p className="text-[12px] text-amber-600 dark:text-amber-300/90 mt-1">↳ {r.readNote}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <CopyButton value={r.name} label="Copy title" title="Copy the resource title to search for it" />
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md bg-white/70 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-all"
                title={r.url}
              >
                Open
                <ExternalIcon />
              </a>
            )}
          </div>
        </div>

        {topic.note && (
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{topic.note}</p>
        )}
      </div>

      {(topic.ceiling?.enough || topic.ceiling?.tooDeep) && (
        <div className="mb-4">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
            Depth ceiling
          </h4>
          <div className="space-y-1.5">
            {topic.ceiling.enough && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-emerald-500/[0.08] border border-emerald-500/20">
                <span className="text-[13px] leading-relaxed shrink-0">✅</span>
                <p className="text-[13.5px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span className="font-bold">Enough:</span> {topic.ceiling.enough}
                </p>
              </div>
            )}
            {topic.ceiling.tooDeep && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-rose-500/[0.07] border border-rose-500/20">
                <span className="text-[13px] leading-relaxed shrink-0">❌</span>
                <p className="text-[13.5px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span className="font-bold">Too deep:</span> {topic.ceiling.tooDeep}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <QuestionList
        questions={topic.questions}
        barClass="from-violet-400 to-fuchsia-400"
        prompt="answer cold, before reading"
      />

      <NotesLink
        source="aistack"
        topicId={topic.id}
        note={note}
        checkedDays={checkedDays}
        accent={{
          panel: "border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60",
          bar: "from-violet-400 to-fuchsia-400",
          badge: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/25",
          button: "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30",
        }}
      />
    </div>
  );
}

// Shared expandable body for a DSA problem — link, difficulty, star, the 45-day
// countdown and the solution notes — so a planned DSA card matches the DSA page.
export function DsaProblemDetail({ problem, note, onNoteChange, isStarred, onToggleStar, solvedDays }) {
  const [localNote, setLocalNote] = useState(note);
  const debounceRef = useRef(null);

  useEffect(() => { setLocalNote(note); }, [note]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onNoteChange(val), 500);
    },
    [onNoteChange]
  );

  if (!problem) return null;

  const diff =
    problem.difficulty === "Hard"
      ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${diff}`}>{problem.difficulty}</span>
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 transition-colors"
        >
          LeetCode
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        {onToggleStar && (
          <button
            onClick={() => onToggleStar(problem.id)}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none transition-transform hover:scale-110 ${isStarred ? "text-yellow-400" : "text-gray-300 dark:text-slate-500 hover:text-yellow-400"}`}
          >
            {isStarred ? "★" : "☆"}
          </button>
        )}
        {solvedDays != null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 font-semibold whitespace-nowrap">
            ✓ solved {solvedDays === 0 ? "today" : `${solvedDays}d ago`}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-orange-100 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 p-3 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-orange-400 to-amber-400" />
            Solution Notes
          </h4>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">auto-saved</span>
        </div>
        <textarea
          value={localNote}
          onChange={handleNoteInput}
          placeholder="Approach, pattern, time/space complexity, key insight, edge cases..."
          rows={5}
          className="w-full p-3 text-xs rounded-lg border border-orange-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 resize-y min-h-[110px] leading-relaxed"
        />
      </div>
    </div>
  );
}
