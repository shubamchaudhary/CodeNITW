// The content catalogues (DSA problems, Core Stack and AI Stack topics) and
// lookups by id. Kept out of planStore so the store, which every page and the
// app shell load at startup, doesn't carry ~280 KB of content: only the pages
// that show topics import this.
import { DSA_PROBLEMS, DSA_RETIRED } from "./DSAPrep";
import { CORE_STACK_TOPICS } from "./CoreStack";
import { AI_STACK_TOPICS } from "./AIStack";

export { DSA_PROBLEMS, CORE_STACK_TOPICS, AI_STACK_TOPICS };

// Retired problems still resolve, so an old plan card for one keeps its link.
const DSA_BY_ID = Object.fromEntries([...DSA_RETIRED, ...DSA_PROBLEMS].map((p) => [p.id, p]));
const CS_BY_ID = Object.fromEntries(CORE_STACK_TOPICS.map((t) => [t.id, t]));
const AI_BY_ID = Object.fromEntries(AI_STACK_TOPICS.map((t) => [t.id, t]));

export function getDsaProblem(id) {
  return DSA_BY_ID[id] || null;
}
export function getCoreStackTopic(id) {
  return CS_BY_ID[id] || null;
}
export function getAIStackTopic(id) {
  return AI_BY_ID[id] || null;
}
