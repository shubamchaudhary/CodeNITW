// Everything that differs between the study stacks (Core Stack, AI Stack,
// Projects):
// their topics and sections, the stores behind them, and how a topic's reading
// list and labels are drawn. The notes page, its left topic list and its topic
// header read all of it from here, so every stack shares one layout.

import { CORE_STACK_SECTIONS, CORE_STACK_TOPICS } from "../../Data/CoreStack";
import { AI_STACK_SECTIONS, AI_STACK_TOPICS } from "../../Data/AIStack";
import { PROJECT_SECTIONS, PROJECT_TOPICS, getProjectTopic } from "../../Data/Projects";
import {
  KEYS,
  getCoreStackTopic,
  getAIStackTopic,
  coreStackPlanItem,
  aiStackPlanItem,
  coreStackDaysSinceChecked,
  aiStackDaysSinceChecked,
  projectPlanItem,
  projectDaysSinceChecked,
} from "../../Data/planStore";

// Priority tags (the design system's PriorityTag): only P0 and P1 carry a
// status colour; the rest are grey. The label always shows.
const PRIORITY_TEXT = {
  P0: "text-danger-fg",
  P1: "text-warning-fg",
  P2: "text-fg-subtle",
  P3: "text-fg-subtle",
};

// Core Stack's priorities, the "why" behind each one and its interview
// questions are the owner's own research. Everyone else gets the topics, the
// reading list and their notes, with no hint the rest exists.
export function stackForViewer(stack, owner) {
  if (owner || stack.key !== "corestack") return stack;
  return { ...stack, filters: null, tag: () => null, summary: () => "", hideQuestions: true };
}

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
    tag: (topic) => ({ label: topic.priority, cls: PRIORITY_TEXT[topic.priority] || "text-fg-subtle" }),
    eyebrow: (topic) => topic.sectionLabel,
    summary: (topic) => topic.why,
    planItem: coreStackPlanItem,
    daysSinceDone: coreStackDaysSinceChecked,
    // The design system's neutral accent: ink buttons, the brand violet only
    // for focus and progress.
    accent: {
      text: "text-success-fg",
      bar: "from-brand to-brand",
      button: "bg-primary text-on-primary hover:bg-primary-hover",
      ring: "focus:ring-focus focus:border-transparent",
      chip: "hover:border-line-strong hover:text-fg",
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
      topics: AI_STACK_TOPICS.filter((t) => t.section === s.key),
    })),
    filters: ["P0", "P1", "P2"],
    matchFilter: (topic, f) => topic.priority === f,
    tag: (topic) => ({ label: topic.priority, cls: PRIORITY_TEXT[topic.priority] || "text-gray-400" }),
    eyebrow: (topic) => topic.sectionLabel,
    summary: (topic) => topic.why,
    planItem: aiStackPlanItem,
    daysSinceDone: aiStackDaysSinceChecked,
    accent: {
      text: "text-violet-600 dark:text-violet-400",
      bar: "from-violet-500 to-fuchsia-400",
      button: "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30",
      ring: "focus:ring-violet-400/40 focus:border-violet-400",
      chip: "hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300",
    },
  },
  // Owner-only, like AI Stack: one section per project, one topic per chapter.
  projects: {
    key: "projects",
    label: "Projects",
    home: "/projects",
    ownerOnly: true,
    notesKey: KEYS.PJ_NOTES,
    completedKey: KEYS.PJ_COMPLETED,
    timestampsKey: KEYS.PJ_TIMESTAMPS,
    getTopic: getProjectTopic,
    topics: PROJECT_TOPICS,
    sections: PROJECT_SECTIONS.map((s) => ({
      key: s.key,
      label: s.label,
      topics: PROJECT_TOPICS.filter((t) => t.section === s.key),
    })),
    filters: null,
    matchFilter: () => true,
    tag: (topic) => ({ label: topic.id, cls: "text-sky-500 dark:text-sky-400" }),
    eyebrow: (topic) => topic.sectionLabel,
    summary: (topic) => topic.summary || "",
    planItem: projectPlanItem,
    daysSinceDone: projectDaysSinceChecked,
    // Chapters can be filled from .md files named after them (StackNav).
    importable: true,
    accent: {
      text: "text-sky-600 dark:text-sky-400",
      bar: "from-sky-500 to-indigo-400",
      button: "bg-gradient-to-br from-sky-500 to-indigo-500 shadow-sky-500/30",
      ring: "focus:ring-sky-400/40 focus:border-sky-400",
      chip: "hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-300",
    },
  },
};

// A topic's reading list, in one shape for every stack (Projects has none):
//   { id, kind: video|doc|course|self, title, source, meta, minutes, estimate,
//     note, url?, playlistUrl?, position? }
export function readingList(stack, topic) {
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
