import React, { useEffect, useState } from "react";
import { requireAuth } from "../../Data/authGate";
import { KEYS, loadJSON, subscribe, setPlanItemChecked } from "../../Data/planStore";
import { planItemIds } from "../../Data/KafkaPlan";
import { DoneCircle } from "./StackNav";

// A topic's fixed plan (the Kafka plan's phases), drawn above the notes. The
// text can't be edited here — it ships with the site — but every item and
// concept carries a tick that is saved to the account and synced like the
// rest of the progress. Notes about it go in the topic's own notes below.

function useChecked() {
  const [checked, setChecked] = useState(() => loadJSON(KEYS.KP_CHECKED, {}));
  useEffect(() => {
    setChecked(loadJSON(KEYS.KP_CHECKED, {}));
    return subscribe((key) => key === KEYS.KP_CHECKED && setChecked(loadJSON(KEYS.KP_CHECKED, {})));
  }, []);
  const toggle = (id) => {
    if (!requireAuth("Sign in to tick off the plan — your progress is saved to your account.")) return;
    setPlanItemChecked(id, !checked[id]);
    setChecked(loadJSON(KEYS.KP_CHECKED, {}));
  };
  return [checked, toggle];
}

// `code`, **bold** and [label](https://…) inside a plan string.
const INLINE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`|\*\*(.+?)\*\*/g;
function Inline({ text }) {
  const out = [];
  let last = 0;
  let m;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = m.index;
    if (m[1]) {
      out.push(
        <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 dark:text-sky-400 underline decoration-sky-400/40 underline-offset-2 hover:decoration-sky-500">
          {m[1]}
        </a>
      );
    } else if (m[3]) {
      out.push(
        <code key={k} className="px-1.5 py-0.5 rounded-md text-[0.88em] font-mono bg-gray-100 dark:bg-white/[0.07] text-gray-800 dark:text-gray-200">
          {m[3]}
        </code>
      );
    } else {
      out.push(
        <strong key={k} className="font-semibold text-gray-900 dark:text-gray-50">
          <Inline text={m[4]} />
        </strong>
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Blocks({ blocks, checked, onToggle }) {
  return blocks.map((b, i) => <Block key={b.id || i} b={b} checked={checked} onToggle={onToggle} />);
}

function Block({ b, checked, onToggle }) {
  switch (b.type) {
    case "h":
      return <h3 className="mt-8 mb-3 text-[19px] font-bold tracking-tight text-gray-900 dark:text-gray-50">{b.text}</h3>;
    case "note":
      return (
        <p className="my-4 rounded-xl px-4 py-3 bg-sky-50 dark:bg-sky-400/[0.08] border border-sky-200/80 dark:border-sky-400/20 text-[15px] leading-relaxed text-gray-700 dark:text-gray-200">
          <Inline text={b.text} />
        </p>
      );
    case "list": {
      const List = b.ordered ? "ol" : "ul";
      return (
        <List className={`my-3 pl-6 space-y-1.5 text-[15.5px] leading-relaxed text-gray-700 dark:text-gray-300 ${b.ordered ? "list-decimal" : "list-disc"} marker:text-gray-400`}>
          {b.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </List>
      );
    }
    case "table":
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.08]">
          <table className="w-full text-[14.5px]">
            <thead className="bg-gray-50 dark:bg-white/[0.04]">
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r} className="border-t border-gray-200 dark:border-white/[0.06]">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3.5 py-2.5 align-top text-gray-700 dark:text-gray-300">
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "pre":
      return (
        <pre className="my-4 overflow-x-auto rounded-xl px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[13px] leading-relaxed font-mono text-gray-700 dark:text-gray-300">
          {b.text}
        </pre>
      );
    case "check":
      return <CheckItem b={b} done={!!checked[b.id]} onToggle={() => onToggle(b.id)} checked={checked} />;
    case "card":
      return <ConceptCard b={b} done={!!checked[b.id]} onToggle={() => onToggle(b.id)} checked={checked} />;
    default:
      return (
        <p className="my-3 text-[15.5px] leading-relaxed text-gray-700 dark:text-gray-300">
          <Inline text={b.text} />
        </p>
      );
  }
}

function TickButton({ done, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      title={done ? "Ticked — click to untick" : label}
      className="mt-[3px] shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
    >
      <DoneCircle done={done} className="w-[18px] h-[18px]" />
    </button>
  );
}

function CheckItem({ b, done, onToggle, checked }) {
  const answer = typeof b.answer === "string" ? [{ type: "p", text: b.answer }] : b.answer;
  return (
    <div className={`my-2 flex gap-3 rounded-xl px-3.5 py-3 border transition-colors ${done ? "border-emerald-200 dark:border-emerald-400/20 bg-emerald-50/50 dark:bg-emerald-400/[0.05]" : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]"}`}>
      <TickButton done={done} onClick={onToggle} label="Tick this off" />
      <div className="flex-1 min-w-0">
        <p className={`text-[15.5px] leading-relaxed ${done ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>
          <Inline text={b.text} />
        </p>
        {b.links && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {b.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-3 rounded-full inline-flex items-center text-[12.5px] font-semibold text-white bg-rose-500 hover:bg-rose-600"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
        {answer && (
          <details className="group mt-2">
            <summary className="cursor-pointer select-none text-[13px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
              <span className="group-open:hidden">Show answer</span>
              <span className="hidden group-open:inline">Hide answer</span>
            </summary>
            <div className="mt-1 [&>*:first-child]:mt-1">
              <Blocks blocks={answer} checked={checked} onToggle={() => {}} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function ConceptCard({ b, done, onToggle, checked }) {
  return (
    <section className={`my-4 rounded-2xl border px-4 sm:px-5 py-4 ${done ? "border-emerald-200 dark:border-emerald-400/20" : "border-gray-200 dark:border-white/[0.08]"} bg-white dark:bg-white/[0.02]`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-gray-50">{b.title}</h3>
        {b.tag && <span className="text-[12px] font-bold text-sky-600 dark:text-sky-400">[{b.tag}]</span>}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          className={`ml-auto h-8 pl-2 pr-3 rounded-full flex items-center gap-1.5 text-[12.5px] font-bold border transition-colors ${
            done
              ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"
              : "border-gray-300 dark:border-white/[0.14] text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
          }`}
        >
          {done ? (
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M4.8 8.2l2.1 2.1 4.3-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <DoneCircle done={false} className="w-4 h-4" />
          )}
          {done ? "Can explain it" : "Can explain it without notes"}
        </button>
      </div>
      <Blocks blocks={b.blocks} checked={checked} onToggle={() => {}} />
    </section>
  );
}

export default function PlanBlocks({ blocks }) {
  const [checked, toggle] = useChecked();
  const ids = planItemIds(blocks);
  const doneCount = ids.filter((id) => checked[id]).length;

  return (
    <section className="mt-8">
      {ids.length > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Plan ticked {doneCount}/{ids.length}
          </p>
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all" style={{ width: `${(doneCount / ids.length) * 100}%` }} />
          </div>
        </div>
      )}
      <Blocks blocks={blocks} checked={checked} onToggle={toggle} />
      <p className="mt-8 text-[13px] text-gray-500 dark:text-gray-400">
        The plan above is fixed. Write your answers, scores and takeaways in your notes below.
      </p>
      <div className="mt-6 border-t border-gray-200 dark:border-white/[0.08]" />
    </section>
  );
}
