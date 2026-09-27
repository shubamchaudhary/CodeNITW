// Everything that differs between the two study stacks (Core Stack, AI Stack):
// their topics and sections, the stores behind them, and how a topic's reading
// list and labels are drawn. The notes page, its left topic list and its topic
// header read all of it from here, so both stacks share one layout.

import { CORE_STACK_SECTIONS, CORE_STACK_TOPICS } from "../../Data/CoreStack";
import { AI_STACK_SECTIONS, AI_STACK_TOPICS, AI_STACK_SKIP } from "../../Data/AIStack";
import {
  KEYS,
  getCoreStackTopic,
  getAIStackTopic,
  coreStackPlanItem,
  aiStackPlanItem,
  coreStackDaysSinceChecked,
  aiStackDaysSinceChecked,
} from "../../Data/planStore";

const PRIORITY_TEXT = {
  P0: "text-rose-500 dark:text-rose-400",
  P1: "text-amber-500 dark:text-amber-400",
  P2: "text-sky-500 dark:text-sky-400",
};

export const STACKS = {
  corestack: {
    key: "corestack",
    label: "Core Stack",
    home: "/core-stack",
    ownerOnly: false,
    notesKey: KEYS.CS_NOTES,
    completedKey: KEYS.CS_COMPLETED,
    timestampsKey: KEYS.CS_TIMESTAMPS,
    getTopic: getCoreStackTopic,
    topics: CORE_STACK_TOPICS,
    sections: CORE_STACK_SECTIONS.map((s) => ({
      key: s.key,
      label: s.label,
      topics: CORE_STACK_TOPICS.filter((t) => t.section === s.key),
    })),
    filters: ["P0", "P1", "P2"],
    matchFilter: (topic, f) => topic.priority === f,
    tag: (topic) => ({ label: topic.priority, cls: PRIORITY_TEXT[topic.priority] || "text-gray-400" }),
    eyebrow: (topic) => topic.sectionLabel,
    summary: (topic) => topic.why,
    planItem: coreStackPlanItem,
    daysSinceDone: coreStackDaysSinceChecked,
    accent: {
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "from-emerald-500 to-teal-400",
      button: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30",
      ring: "focus:ring-emerald-400/40 focus:border-emerald-400",
      chip: "hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300",
    },
  },
  aistack: {
    key: "aistack",
    label: "AI Stack",
    home: "/ai-stack",
    ownerOnly: true,
    notesKey: KEYS.AI_NOTES,
    completedKey: KEYS.AI_COMPLETED,
    timestampsKey: KEYS.AI_TIMESTAMPS,
    getTopic: getAIStackTopic,
    topics: AI_STACK_TOPICS,
    sections: AI_STACK_SECTIONS.map((s) => ({
      key: s.key,
      label: s.label,
      topics: AI_STACK_TOPICS.filter((t) => t.part === s.key),
    })),
    filters: null, // 15 topics in four parts — the sections are filter enough
    matchFilter: () => true,
    tag: (topic) => ({ label: topic.id, cls: "text-violet-500 dark:text-violet-400" }),
    eyebrow: (topic) => topic.section,
    summary: (topic) => topic.note || "",
    planItem: aiStackPlanItem,
    daysSinceDone: aiStackDaysSinceChecked,
    skip: AI_STACK_SKIP,
    accent: {
      text: "text-violet-600 dark:text-violet-400",
      bar: "from-violet-500 to-fuchsia-400",
      button: "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30",
      ring: "focus:ring-violet-400/40 focus:border-violet-400",
      chip: "hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300",
    },
  },
};

// A topic's reading list, in one shape for both stacks:
//   { id, kind: video|doc|self, title, source, meta, minutes, estimate, note,
//     url?, playlistUrl?, position? }
export function readingList(stack, topic) {
  if (stack.key === "aistack") {
    const r = topic.resource;
    if (!r) return [];
    return [
      {
        id: `${topic.id}-r1`,
        kind: "doc",
        title: r.name,
        source: [r.publisher, r.path && `→ ${r.path}`].filter(Boolean).join(" "),
        minutes: topic.minutes || 0,
        estimate: true,
        note: r.readNote || "",
        url: r.url,
      },
    ];
  }
  return (topic.resources || []).map((r) => ({
    ...r,
    source: [r.source, r.playlist].filter(Boolean).join(" · "),
  }));
}

// Where the stack's home page should land you: the topic you last had open,
// else the first one you haven't finished, else the first.
const LAST_KEY = (stackKey) => `notesLastTopic:${stackKey}`;

export function rememberTopic(stackKey, topicId) {
  try {
    localStorage.setItem(LAST_KEY(stackKey), topicId);
  } catch (_) {}
}

export function resumeTopicId(stack, completed = {}) {
  let last = null;
  try {
    last = localStorage.getItem(LAST_KEY(stack.key));
  } catch (_) {}
  if (last && stack.getTopic(last)) return last;
  const next = stack.topics.find((t) => !completed[t.id]);
  return (next || stack.topics[0])?.id;
}
