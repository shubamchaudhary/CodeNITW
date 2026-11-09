import React, { useState, useEffect, useRef, useCallback } from "react";
import { CATEGORY_CONFIG } from "../Data/JobHuntPlan";
import { GLASS_PANEL } from "./glass";

// The retired Interview Prep (Topics) page's card body, kept for days planned
// before that page went. Its own module because the cards' content is large:
// the planner loads it only when such a task is opened (LegacyInterviewDetail).
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
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-all ${copied ? "bg-accent-subtle text-accent-fg border-line " : "bg-surface-hover text-fg-muted border-line hover:bg-surface-hover hover:text-fg hover:border-line-strong"}`}
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

      <div className="rounded-lg border border-line p-4 bg-surface-subtle">
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
            <p className="text-[11px] text-accent-fg flex items-center gap-1.5">
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

