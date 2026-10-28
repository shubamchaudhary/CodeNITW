import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { isOwner } from "./OwnerRoute";
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
          <h4 className="text-xs font-semibold text-fg-subtle mb-2 flex items-center gap-1.5">
            <span className={`w-1 h-3 rounded-full ${primaryCfg.bar}`} />
            What to Study
          </h4>
          <ul className="space-y-1">
            {item.keyTopics.map((topic, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-fg-muted">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-line-strong shrink-0" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.prompt && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-fg-subtle flex items-center gap-1.5">
              <span className={`w-1 h-3 rounded-full ${primaryCfg.bar}`} />
              Prompt for Claude
            </h4>
            <button
              onClick={copyPrompt}
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all ${copied ? "bg-success-subtle text-success-fg border-line " : "bg-surface-hover text-fg-muted border-line hover:bg-surface-hover hover:text-fg hover:border-line-strong"}`}
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
            <pre className="text-[11.5px] text-fg-muted font-mono whitespace-pre-wrap leading-relaxed">{item.prompt}</pre>
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-fg-subtle border border-line">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-line p-4 bg-brand">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
            My Notes
          </h4>
          <span className="text-[10px] font-normal text-fg-subtle">auto-saved · revisit later</span>
        </div>
        <textarea
          value={localNote}
          onChange={handleNoteInput}
          placeholder="Write your notes, key insights, things to remember..."
          rows={8}
          className="w-full p-4 text-sm rounded-lg border border-line bg-canvas text-fg-muted placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:border-line-strong resize-y min-h-[180px] transition-all leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2 min-h-[16px]">
          {localNote ? (
            <p className="text-[11px] text-success-fg flex items-center gap-1.5">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>
              Notes saved
            </p>
          ) : <span />}
          <span className="text-[10px] text-fg-subtle">{localNote.length} chars</span>
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
      className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
        copied
          ? "bg-success-subtle border-line text-success-fg "
          : "bg-canvas border-line text-fg-muted hover:border-success hover:text-success-fg "
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
  // The why and the questions are the owner's own research (see stackForViewer).
  const owner = isOwner(getAuth().currentUser);

  return (
    <div>
      {owner && topic.why && (
        <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 bg-surface-subtle border border-line">
          <span className="text-[13px] shrink-0">🎯</span>
          <p className="text-[13px] text-fg-muted leading-relaxed">{topic.why}</p>
        </div>
      )}

      <ResourceList
        resources={topic.resources}
        duration={topic.duration}
        barClass="bg-success"
        linkHover="hover:border-line-strong hover:text-fg "
      />

      {owner && (
        <QuestionList
          questions={topic.questions}
          barClass="bg-success"
          title={topic.asked ? "Asked in interviews" : "Interview questions"}
          prompt={topic.asked ? "answers are in the notes" : "answer cold, before watching"}
        />
      )}

      <NotesLink
        source="corestack"
        topicId={topic.id}
        note={note}
        checkedDays={checkedDays}
        accent={{
          panel: "border-line bg-brand",
          bar: "bg-success",
          badge: "bg-success-subtle text-success-fg border-line",
          button: "    bg-brand",
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
    <div className={`${GLASS_PANEL} rounded-lg px-3 py-2.5`}>
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border tabular-nums ${
            r.kind === "self"
              ? "bg-warning-subtle text-warning-fg border-line"
              : r.kind === "doc" || r.kind === "course"
              ? "bg-brand-subtle text-brand-fg border-line"
              : "bg-success-subtle text-success-fg border-line"
          }`}
          title={isPlaylistVideo ? `Position ${r.position} in "${r.playlist}"` : r.kind}
        >
          {isPlaylistVideo ? `#${r.position}` : r.kind === "doc" ? "DOC" : r.kind === "course" ? "COURSE" : r.kind === "self" ? "YOU" : "▶"}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-fg leading-snug">{r.title}</p>
          <p className="text-[12px] text-fg-subtle mt-0.5">
            {[r.source, r.playlist, r.minutes ? `${r.estimate ? "≈" : ""}${r.minutes}m` : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {r.note && (
            <p className="text-[12px] text-warning-fg mt-1 leading-relaxed">↳ {r.note}</p>
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
              className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-md bg-canvas border border-line text-fg-muted transition-all ${linkHover}`}
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
              className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-md bg-canvas border border-line text-fg-muted transition-all ${linkHover}`}
              title={r.url}
            >
              {r.kind === "doc" ? "Read" : r.kind === "course" ? "Open" : "Watch"}
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
      <h4 className="text-[12px] font-semibold text-fg-subtle mb-2 flex items-center gap-1.5">
        Resources
        <span className="font-semibold normal-case tracking-normal text-fg-subtle">
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

function QuestionList({ questions, barClass, prompt, title = "Interview questions" }) {
  if (!questions || !questions.length) return null;
  return (
    <div className="mb-4">
      <h4 className="text-[12px] font-semibold text-fg-subtle mb-2 flex items-center gap-1.5">
        {title}
        <span className="font-semibold normal-case tracking-normal text-fg-subtle">· {prompt}</span>
      </h4>
      <ol className="space-y-1.5">
        {questions.map((q, i) => (
          <li key={i} className="flex items-start gap-2 text-[13.5px] text-fg-muted leading-relaxed">
            <span className="mt-[3px] text-[12px] font-semibold text-fg-subtle tabular-nums shrink-0">{i + 1}.</span>
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
    <div className={`rounded-lg border p-3.5  ${accent.panel}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-semibold text-fg-subtle flex items-center gap-1.5">
          
          My Notes
        </h4>
        {checkedDays != null && (
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap border ${accent.badge}`}>
            ✓ {checkedDays === 0 ? "today" : checkedDays === 1 ? "1d ago" : `${checkedDays}d ago`}
          </span>
        )}
      </div>

      {preview ? (
        <p className="text-[13px] text-fg-muted leading-relaxed line-clamp-3 mb-3">
          {preview.slice(0, 240)}
          {preview.length > 240 ? "…" : ""}
        </p>
      ) : (
        <p className="text-[13px] text-fg-subtle mb-3">
          Nothing written yet — the notes page takes markdown, code blocks and pasted screenshots.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Link
          to={`/notes/${source}/${topicId}`}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg text-white  transition-all  ${accent.button}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
            <path d="M11 2.5l2.5 2.5M3 13l8.5-8.5 2.5 2.5L5.5 15.5 2.5 16l.5-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {text ? "Open notes" : "Write notes"}
        </Link>
        {text && (
          <span className="text-[11.5px] text-fg-subtle">
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

// Shared expandable body for an AI Stack topic — why it sits at its priority,
// the resources behind it (videos first), the depth ceiling (what is enough, and
// where going further stops paying), the interview questions, and the way into
// its notes page.
export function AIStackTopicDetail({ topic, note, checkedDays }) {
  if (!topic) return null;

  return (
    <div>
      {topic.why && (
        <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 bg-surface-subtle border border-line">
          <span className="text-[13px] shrink-0">🎯</span>
          <p className="text-[13px] text-fg-muted leading-relaxed">{topic.why}</p>
        </div>
      )}

      {/* The map marks these topics as ones a resume claim will be probed on —
          the general concept alone isn't enough there, so it's said out loud. */}
      {topic.resumeLinked && topic.flag && (
        <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 bg-warning-subtle border border-line">
          <span className="text-[13px] shrink-0">⚠️</span>
          <p className="text-[13.5px] text-warning-fg leading-relaxed">{topic.flag}</p>
        </div>
      )}

      <ResourceList
        resources={topic.resources}
        duration={topic.duration}
        barClass=" "
        linkHover="hover:border-line-strong hover:text-fg "
      />

      {(topic.ceiling?.enough || topic.ceiling?.tooDeep) && (
        <div className="mb-4">
          <h4 className="text-[12px] font-semibold text-fg-subtle mb-2 flex items-center gap-1.5">
            Depth ceiling
          </h4>
          <div className="space-y-1.5">
            {topic.ceiling.enough && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-success-subtle border border-line">
                <span className="text-[13px] leading-relaxed shrink-0">✅</span>
                <p className="text-[13.5px] text-fg-muted leading-relaxed">
                  <span className="font-semibold">Enough:</span> {topic.ceiling.enough}
                </p>
              </div>
            )}
            {topic.ceiling.tooDeep && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-danger-subtle border border-line">
                <span className="text-[13px] leading-relaxed shrink-0">❌</span>
                <p className="text-[13.5px] text-fg-muted leading-relaxed">
                  <span className="font-semibold">Too deep:</span> {topic.ceiling.tooDeep}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <QuestionList
        questions={topic.questions}
        barClass=" "
        prompt="answer cold, before reading"
      />

      <NotesLink
        source="aistack"
        topicId={topic.id}
        note={note}
        checkedDays={checkedDays}
        accent={{
          panel: "border-line-strong ",
          bar: " ",
          badge: "bg-brand-subtle text-brand-fg border-line",
          button: " ",
        }}
      />
    </div>
  );
}

// A Projects chapter planned for a day: what it covers, and its notes.
export function ProjectTopicDetail({ topic, note, checkedDays }) {
  if (!topic) return null;
  return (
    <div>
      {topic.summary && (
        <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2 bg-surface-subtle border border-line">
          <span className="text-[13px] shrink-0">📘</span>
          <p className="text-[13px] text-fg-muted leading-relaxed">{topic.summary}</p>
        </div>
      )}
      <NotesLink
        source="projects"
        topicId={topic.id}
        note={note}
        checkedDays={checkedDays}
        accent={{
          panel: "border-line ",
          bar: " ",
          badge: "bg-brand-subtle text-brand-fg border-line",
          button: " ",
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
      ? "bg-danger-subtle text-danger-fg "
      : "bg-warning-subtle text-warning-fg ";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={ bg-brand`text-[10px] font-semibold px-2 py-0.5 rounded-md ${diff}`}>{problem.difficulty}</span>
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-surface-hover text-fg-muted hover:bg-surface-hover hover:text-fg transition-colors"
        >
          LeetCode
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        {onToggleStar && (
          <button
            onClick={() => onToggleStar(problem.id)}
            title={isStarred ? "Unstar" : "Star"}
            className={`text-lg leading-none transition-transform  ${isStarred ? "text-warning-fg" : "text-line-strong hover:text-fg"}`}
          >
            {isStarred ? "★" : "☆"}
          </button>
        )}
        {solvedDays != null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-200 text-success-fg font-semibold whitespace-nowrap">
            ✓ solved {solvedDays === 0 ? "today" : `${solvedDays}d ago`}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-line p-3 bg-brand">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold text-fg-subtle flex items-center gap-1.5">
            Solution Notes
          </h4>
          <span className="text-[10px] text-fg-subtle">auto-saved</span>
        </div>
        <textarea
          value={localNote}
          onChange={handleNoteInput}
          placeholder="Approach, pattern, time/space complexity, key insight, edge cases..."
          rows={5}
          className="w-full p-3 text-xs rounded-lg border border-line bg-canvas text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-orange-400/40 hover:border-line-strong resize-y min-h-[110px] leading-relaxed"
        />
      </div>
    </div>
  );
}
