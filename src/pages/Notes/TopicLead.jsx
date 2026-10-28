import React from "react";
import { toast } from "react-toastify";
import { readingList } from "./stacks";
import { DoneCircle } from "./StackNav";
import { Button, PriorityTag, Icon, buttonClass } from "../../components/ui";

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
      <p className="flex items-center gap-2 text-[14px] font-medium text-fg-subtle">
        {stack.eyebrow(topic)}
        {tag && <PriorityTag tag={tag} />}
      </p>
      <h1 className="mt-1.5 text-[26px] leading-8 sm:text-[32px] sm:leading-10 font-semibold tracking-[-0.02em] text-fg">
        {topic.title}
      </h1>
      {summary && <p className="mt-3 max-w-[46rem] text-[16px] leading-[26px] text-fg-muted">{summary}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          variant={done ? "success" : "secondary"}
          data-tour="mark-done"
          onClick={onToggleDone}
          title={done ? "Done — click to mark as not done" : "Mark this topic as done"}
          className="pl-2.5"
        >
          <DoneCircle done={done} />
          {done ? (doneDays != null ? `Done · ${doneDays === 0 ? "today" : `${doneDays}d ago`}` : "Done") : "Mark as done"}
        </Button>
        <Button
          variant={planned ? "brand" : "secondary"}
          data-tour="add-today"
          onClick={onTogglePlanned}
          title={planned ? "On today's plan — click to remove" : "Add this topic to today's plan"}
          className="pl-2.5"
        >
          {planned ? <Icon.check /> : <Icon.plus />}
          {planned ? "On today's plan" : "Add to today"}
        </Button>
        {meta && <span className="ml-1 text-[13px] text-fg-subtle">{meta}</span>}
        {tools && <div className="ml-auto flex flex-wrap items-center gap-2">{tools}</div>}
      </div>

      <div className="mt-6 border-t border-line" />

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

// What to watch (or read) before the notes: one panel, one row per resource.
// Each opens where it lives — the playlist for a playlist video, the page for
// a doc — with its title one click from the clipboard for searching.
function WatchFirst({ items }) {
  const videos = items.filter((i) => i.kind === "video").length;
  const minutes = items.reduce((n, i) => n + (i.minutes || 0), 0);
  const approx = items.some((i) => i.estimate || (!i.minutes && i.kind !== "self"));
  const allVideos = videos === items.length;
  const heading = allVideos ? (videos === 1 ? "Watch the video" : `Watch the ${videos} videos`) : "Watch & read first";
  const HeadIcon = allVideos ? Icon.play : Icon.doc;

  return (
    <section className="mt-6 rounded-lg border border-line bg-canvas overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 bg-surface-subtle border-b border-line">
        <span className="text-fg-subtle">
          <HeadIcon />
        </span>
        <p className="text-[15px] leading-[22px] font-semibold text-fg">{heading}</p>
        <p className="font-mono text-[12px] tabular-nums text-fg-subtle">
          {items.length} {items.length === 1 ? "resource" : "resources"}
          {minutes > 0 && ` · ${approx ? "≈" : ""}${fmtMinutes(minutes)}`}
        </p>
        <p className="ml-auto text-[12px] text-fg-subtle hidden sm:block">Before you read the notes</p>
      </div>

      <ol className="divide-y divide-line">
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
  const label = r.kind === "doc" ? "Read" : r.kind === "course" ? "Open course" : isPlaylist ? "Open playlist" : "Watch";
  const mono = (s) => <span className="font-mono tabular-nums">{s}</span>;
  const where = [
    r.source,
    isPlaylist && r.position ? <>{mono(`#${r.position}`)} in playlist</> : null,
    r.minutes ? mono(`${r.estimate ? "≈" : ""}${fmtMinutes(r.minutes)}`) : null,
  ].filter(Boolean);

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
      <span className="hidden sm:block w-5 font-mono text-[12px] font-medium tabular-nums text-fg-subtle shrink-0">
        {String(n).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-5 font-medium text-fg">{r.title}</p>
        {(where.length > 0 || r.kind === "self") && (
          <p className="mt-0.5 text-[12px] leading-4 text-fg-subtle">
            {r.kind === "self"
              ? r.source || "Your own codebase"
              : where.map((w, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && " · "}
                    {w}
                  </React.Fragment>
                ))}
          </p>
        )}
        {r.note && <p className="mt-1 text-[12px] leading-relaxed text-warning-fg">{r.note}</p>}
      </div>
      {r.kind !== "self" && (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              navigator.clipboard?.writeText(r.title);
              toast.success("Title copied");
            }}
            title="Copy the title to search for it"
            aria-label="Copy title"
          >
            <Icon.copy />
          </Button>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={isPlaylist ? `Video #${r.position} in this playlist` : href}
              className={buttonClass("secondary", "sm")}
            >
              <Icon.external className="w-3.5 h-3.5" />
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
        <p className="rounded-lg px-4 py-3 bg-warning-subtle text-[14px] leading-relaxed text-warning-fg">
          <span className="font-semibold">On your resume: </span>
          {topic.flag}
        </p>
      )}
      {(c.enough || c.tooDeep) && (
        <div className="grid sm:grid-cols-2 gap-2">
          {c.enough && (
            <p className="rounded-lg px-4 py-3 border border-line text-[14px] leading-relaxed text-fg-muted">
              <span className="font-semibold text-success-fg">Enough: </span>
              {c.enough}
            </p>
          )}
          {c.tooDeep && (
            <p className="rounded-lg px-4 py-3 border border-line text-[14px] leading-relaxed text-fg-muted">
              <span className="font-semibold text-danger-fg">Too deep: </span>
              {c.tooDeep}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
