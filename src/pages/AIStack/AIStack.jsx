import React, { useCallback } from "react";
import {
  AI_STACK_TOPICS,
  AI_STACK_SECTIONS,
  AI_STACK_TOTAL,
  AI_STACK_SKIP,
} from "../../Data/AIStack";
import { AIStackTopicDetail } from "../../components/cardDetails";
import TopicBoard from "../../components/TopicBoard";
import { GLASS } from "../../components/glass";
import { KEYS, aiStackDaysSinceChecked, aiStackPlanItem } from "../../Data/planStore";

// GenAI, grouped by the map's four parts. The board itself lives in TopicBoard —
// this file is only what makes AI Stack AI Stack.
const ACCENT = {
  gradId: "aiProgressGrad",
  ringFrom: "#8b5cf6",
  ringTo: "#d946ef",
  pctText: "text-violet-600 dark:text-violet-400",
  headBadge:
    "bg-violet-500/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-300 border border-violet-500/25 dark:border-violet-400/25",
  chipActive: "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30",
  chipHover: "hover:text-violet-600 dark:hover:text-violet-300",
  sectionBar: "from-violet-500 to-fuchsia-400",
  cardChecked: "border-violet-500/30 dark:border-violet-500/20",
  checkbox: "bg-violet-500 border-violet-500 shadow-md shadow-violet-500/30",
  checkboxHover: "hover:border-violet-400",
  checkedBadge: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/25",
};

const SECTIONS = AI_STACK_SECTIONS.map((s) => ({
  key: s.key,
  label: s.label,
  topics: AI_STACK_TOPICS.filter((t) => t.part === s.key),
}));

const FILTERS = [
  { key: "ALL", label: "All", title: "Every topic" },
  ...AI_STACK_SECTIONS.map((s) => ({ key: s.key, label: s.chip, title: s.label })),
];

// Part E of the map: the deliberate no-go list. There is nothing to study, so it
// is a footnote rather than a card — but the line to say out loud matters.
function SkipNote() {
  if (!AI_STACK_SKIP) return null;
  return (
    <div className={`rounded-2xl ${GLASS} px-4 sm:px-5 py-4 mb-6`}>
      <h3 className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-400 to-slate-500" />
        Not studying
      </h3>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {AI_STACK_SKIP.topics.map((t) => (
          <span
            key={t}
            className="text-[12px] px-2 py-0.5 rounded-full bg-slate-500/10 text-gray-500 dark:text-gray-400 border border-slate-500/20 line-through decoration-1"
          >
            {t.replace(/\.$/, "")}
          </span>
        ))}
      </div>
      <p className="text-[13.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
        <span className="font-bold text-gray-500 dark:text-gray-400">If asked: </span>
        “{AI_STACK_SKIP.line}”
      </p>
    </div>
  );
}

export default function AIStack() {
  const renderDetail = useCallback(
    (topic, { note, onNoteChange, checkedDays }) => (
      <AIStackTopicDetail topic={topic} note={note} onNoteChange={onNoteChange} checkedDays={checkedDays} />
    ),
    []
  );

  return (
    <TopicBoard
      source="aistack"
      storeKeys={{ completed: KEYS.AI_COMPLETED, notes: KEYS.AI_NOTES, timestamps: KEYS.AI_TIMESTAMPS }}
      daysSinceChecked={aiStackDaysSinceChecked}
      planItem={aiStackPlanItem}
      title="AI Stack"
      headBadge={`${AI_STACK_TOTAL} topics`}
      accent={ACCENT}
      sections={SECTIONS}
      filters={FILTERS}
      matchFilter={(topic, filter) => topic.part === filter}
      badgeOf={(topic) => ({
        label: topic.id,
        cls: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30",
        title: topic.resumeLinked ? topic.flag : topic.section,
      })}
      metaOf={(topic) =>
        [topic.resource.publisher || topic.resource.name, topic.duration, topic.resumeLinked ? "resume-linked" : ""]
          .filter(Boolean)
          .join(" · ")
      }
      renderDetail={renderDetail}
      footer={<SkipNote />}
    />
  );
}
