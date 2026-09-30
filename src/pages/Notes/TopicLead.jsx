import React from "react";
import { toast } from "react-toastify";
import { readingList } from "./stacks";
import { DoneCircle } from "./StackNav";

// The top of a topic page, laid out like an article: where it sits, its title,
// why it matters, the two things you do with a topic (finish it, plan it), and
// then what to watch before reading the notes. The questions that used to sit
// on the topic card live in the notes themselves now.
export default function TopicLead({ stack, topic, done, doneDays, planned, onToggleDone, onTogglePlanned, meta, tools }) {
  const items = readingList(stack, topic);
  const tag = stack.tag(topic);
  const summary = stack.summary(topic);

  return (
    <header className="mb-10">
      <p className="text-[17px] sm:text-[19px] text-gray-500 dark:text-gray-400">
        {stack.eyebrow(topic)}
        <span className={`ml-2.5 align-middle text-[12px] font-bold ${tag.cls}`}>{tag.label}</span>
      </p>
      <h1 className="mt-1 text-[30px] sm:text-[38px] lg:text-[42px] font-bold tracking-tight leading-[1.12] text-gray-900 dark:text-gray-50">
        {topic.title}
      </h1>
      {summary && (
        <p className="mt-3 max-w-[62rem] text-[16px] sm:text-[16.5px] leading-relaxed text-gray-600 dark:text-gray-300">{summary}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          data-tour="mark-done"
          onClick={onToggleDone}
          title={done ? "Done — click to mark as not done" : "Mark this topic as done"}
          className={`h-9 pl-2.5 pr-3.5 rounded-full flex items-center gap-2 text-[13.5px] font-semibold border transition-colors ${
            done
              ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"
              : "bg-white dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.14] text-gray-700 dark:text-gray-200 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
          }`}
        >
          {done ? (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7.5" fill="white" opacity="0.25" />
              <path d="M4.8 8.2l2.1 2.1 4.3-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <DoneCircle done={false} className="w-[18px] h-[18px]" />
          )}
          {done ? (doneDays != null ? `Done · ${doneDays === 0 ? "today" : `${doneDays}d ago`}` : "Done") : "Mark as done"}
        </button>
        <button
          data-tour="add-today"
          onClick={onTogglePlanned}
          title={planned ? "On today's plan — click to remove" : "Add this topic to today's plan"}
          className={`h-9 px-3.5 rounded-full flex items-center gap-1.5 text-[13.5px] font-semibold border transition-colors ${
            planned
              ? "bg-violet-50 dark:bg-violet-500/15 border-violet-300 dark:border-violet-400/40 text-violet-700 dark:text-violet-300"
              : "bg-white dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.14] text-gray-700 dark:text-gray-200 hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
          }`}
        >
          {planned ? "✓ On today's plan" : "＋ Add to today"}
        </button>
        {meta && <span className="ml-1 text-[13px] text-gray-500 dark:text-gray-400">{meta}</span>}
        {tools && <div className="ml-auto flex flex-wrap items-center gap-2">{tools}</div>}
      </div>

      <div className="mt-7 border-t border-gray-200 dark:border-white/[0.08]" />

      {items.length > 0 && <WatchFirst items={items} />}
      {stack.key === "aistack" && <AIDepth topic={topic} />}
    </header>
  );
}

function fmtMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// What to watch (or read) before the notes, in the spirit of a "watch the
// walkthrough" banner: each item opens where it lives — the playlist for a
// playlist video, the page for a doc — with its title one click from the
// clipboard for searching.
function WatchFirst({ items }) {
  const videos = items.filter((i) => i.kind === "video").length;
  const minutes = items.reduce((n, i) => n + (i.minutes || 0), 0);
  const approx = items.some((i) => i.estimate || (!i.minutes && i.kind !== "self"));
  const heading = videos === items.length ? (videos === 1 ? "Watch the video" : `Watch the ${videos} videos`) : "Watch & read first";

  return (
    <section className="mt-8 rounded-2xl border border-rose-100 dark:border-rose-400/15 bg-rose-50/70 dark:bg-rose-500/[0.06] p-4 sm:p-6">
      <div className="flex items-center gap-3.5">
        <span className="w-11 h-11 rounded-full bg-white dark:bg-white/[0.08] shadow-sm flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="4" fill="#ef4444" />
            <path d="M10 9.2v5.6l4.8-2.8L10 9.2z" fill="white" />
          </svg>
        </span>
        <div>
          <p className="text-[19px] font-semibold text-rose-600 dark:text-rose-300">{heading}</p>
          <p className="text-[13.5px] text-rose-500/90 dark:text-rose-300/70">
            {items.length} {items.length === 1 ? "resource" : "resources"}
            {minutes > 0 && ` · ${approx ? "≈" : ""}${fmtMinutes(minutes)}`} — before you read the notes
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-2.5">
        {items.map((r, i) => (
          <WatchItem key={r.id || i} r={r} n={i + 1} />
        ))}
      </ol>
    </section>
  );
}

function WatchItem({ r, n }) {
  const href = r.url || r.playlistUrl;
  const isPlaylist = r.kind === "video" && !r.url && r.playlistUrl;
  const label = r.kind === "doc" ? "Read" : isPlaylist ? "Open playlist" : "Watch";
  const where = [
    r.source,
    isPlaylist && r.position ? `#${r.position} in playlist` : null,
    r.minutes ? `${r.estimate ? "≈" : ""}${fmtMinutes(r.minutes)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-white/90 dark:bg-white/[0.04] border border-rose-100/80 dark:border-white/[0.06] px-4 py-3">
      <span className="hidden sm:flex w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-400/15 text-rose-600 dark:text-rose-300 text-[12.5px] font-bold items-center justify-center shrink-0">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-snug text-gray-900 dark:text-gray-50">{r.title}</p>
        {where && <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{r.kind === "self" ? "Your own codebase" : where}</p>}
        {r.note && <p className="mt-1 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300/90">↳ {r.note}</p>}
      </div>
      {r.kind !== "self" && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(r.title);
              toast.success("Title copied");
            }}
            title="Copy the title to search for it"
            className="h-9 px-3 rounded-full text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-rose-100/70 dark:hover:bg-white/[0.06]"
          >
            Copy title
          </button>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={isPlaylist ? `Video #${r.position} in this playlist` : href}
              className="h-9 pl-3 pr-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-500/25"
            >
              {r.kind === "doc" ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 3.5v9l7-4.5z" />
                </svg>
              )}
              {label}
            </a>
          )}
        </div>
      )}
    </li>
  );
}

// AI Stack topics carry a "how deep is enough" line and, for resume topics, a
// warning — study guidance rather than questions, so it stays.
function AIDepth({ topic }) {
  const c = topic.ceiling || {};
  if (!c.enough && !c.tooDeep && !(topic.resumeLinked && topic.flag)) return null;
  return (
    <section className="mt-5 space-y-2">
      {topic.resumeLinked && topic.flag && (
        <p className="rounded-xl px-4 py-3 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/25 text-[14px] leading-relaxed text-amber-800 dark:text-amber-200">
          ⚠️ {topic.flag}
        </p>
      )}
      {(c.enough || c.tooDeep) && (
        <div className="grid sm:grid-cols-2 gap-2">
          {c.enough && (
            <p className="rounded-xl px-4 py-3 bg-emerald-50 dark:bg-emerald-400/[0.08] border border-emerald-200/80 dark:border-emerald-400/20 text-[14px] leading-relaxed text-gray-700 dark:text-gray-200">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Enough: </span>
              {c.enough}
            </p>
          )}
          {c.tooDeep && (
            <p className="rounded-xl px-4 py-3 bg-rose-50 dark:bg-rose-400/[0.07] border border-rose-200/80 dark:border-rose-400/20 text-[14px] leading-relaxed text-gray-700 dark:text-gray-200">
              <span className="font-semibold text-rose-700 dark:text-rose-300">Too deep: </span>
              {c.tooDeep}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
