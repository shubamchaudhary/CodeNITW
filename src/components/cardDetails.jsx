import React, { useState, useEffect, useRef, useCallback } from "react";
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
              {copied ? <>✓ Copied!</> : (
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

// Shared expandable body for a DSA problem — link, difficulty, star, the 45-day
// countdown and the solution notes — so a planned DSA card matches the DSA page.
export function DsaProblemDetail({ problem, note, onNoteChange, isStarred, onToggleStar, daysLeft }) {
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
        {daysLeft != null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 font-semibold whitespace-nowrap">
            reopens in {Math.max(daysLeft, 0)}d
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
