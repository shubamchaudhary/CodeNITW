import React, { useCallback } from "react";
import {
  CORE_STACK_TOPICS,
  CORE_STACK_TOTAL,
  CORE_STACK_SECTION,
  CORE_STACK_PRIORITIES,
  CORE_STACK_PRIORITY_CONFIG,
} from "../../Data/CoreStack";
import { CoreStackTopicDetail } from "../../components/cardDetails";
import TopicBoard from "../../components/TopicBoard";
import { KEYS, coreStackDaysSinceChecked, coreStackPlanItem } from "../../Data/planStore";

// Java + Spring Boot, in study order, under one section. The board itself lives
// in TopicBoard — this file is only what makes Core Stack Core Stack.
const ACCENT = {
  gradId: "csProgressGrad",
  ringFrom: "#10b981",
  ringTo: "#14b8a6",
  pctText: "text-emerald-600 dark:text-emerald-400",
  headBadge:
    "bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 dark:border-emerald-400/25",
  chipActive: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30",
  chipHover: "hover:text-emerald-600 dark:hover:text-emerald-300",
  sectionBar: "from-emerald-500 to-teal-400",
  cardChecked: "border-emerald-500/30 dark:border-emerald-500/20",
  checkbox: "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30",
  checkboxHover: "hover:border-emerald-400",
  checkedBadge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
};

const SECTIONS = [{ key: "java", label: CORE_STACK_SECTION, topics: CORE_STACK_TOPICS }];

const FILTERS = [
  { key: "ALL", label: "All", title: "Every topic" },
  ...CORE_STACK_PRIORITIES.map((p) => ({
    key: p,
    label: p,
    title: CORE_STACK_PRIORITY_CONFIG[p].blurb,
  })),
];

export default function CoreStack() {
  const renderDetail = useCallback(
    (topic, { note, onNoteChange, checkedDays }) => (
      <CoreStackTopicDetail topic={topic} note={note} onNoteChange={onNoteChange} checkedDays={checkedDays} />
    ),
    []
  );

  return (
    <TopicBoard
      source="corestack"
      storeKeys={{ completed: KEYS.CS_COMPLETED, notes: KEYS.CS_NOTES, timestamps: KEYS.CS_TIMESTAMPS }}
      daysSinceChecked={coreStackDaysSinceChecked}
      planItem={coreStackPlanItem}
      title="Core Stack"
      headBadge={`${CORE_STACK_TOTAL} topics`}
      accent={ACCENT}
      sections={SECTIONS}
      filters={FILTERS}
      matchFilter={(topic, filter) => topic.priority === filter}
      badgeOf={(topic) => {
        const prio = CORE_STACK_PRIORITY_CONFIG[topic.priority];
        return prio && { label: prio.label, cls: prio.cls, title: `${prio.label} — ${prio.blurb}` };
      }}
      metaOf={(topic) =>
        `${topic.videos.length} video${topic.videos.length === 1 ? "" : "s"} · ${topic.duration}` +
        (topic.videos[0] ? ` · ${topic.videos[0].channel.split(" - ")[0]}` : "")
      }
      renderDetail={renderDetail}
    />
  );
}
