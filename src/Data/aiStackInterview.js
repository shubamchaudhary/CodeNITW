// Mock-interview prompts for the AI Stack design pages, for pasting into a
// chat assistant that can talk (it plays the interviewer). A prompt joins the
// interviewer instructions (./aiStackInterview/_interviewer.md), the design's
// private brief (./aiStackInterview/DP-01.md: opening line, hidden facts, what
// to uncover, corrections, probes) and the design page itself as the answer key.
import { loadBuiltInDoc } from "./aiStackDocs";

const FILES = import.meta.glob("./aiStackInterview/*.md", { query: "?raw", import: "default" });
const fileOf = (name) => FILES[`./aiStackInterview/${name}.md`];

export const hasInterviewPrompt = (source, id) => source === "aistack" && !id.startsWith("_") && !!fileOf(id);

export async function buildInterviewPrompt(id, owner) {
  const [base, brief, doc] = await Promise.all([fileOf("_interviewer")(), fileOf(id)(), loadBuiltInDoc("aistack", id, owner)]);
  return [
    base.trim(),
    "=== PRIVATE: INTERVIEWER BRIEF. Never reveal before the debrief. ===",
    brief.trim(),
    "=== PRIVATE: ANSWER KEY (the full solution). Never reveal before the debrief. ===",
    (doc || "").trim(),
    "=== END OF PRIVATE MATERIAL ===",
    "Start now. Say only the opening line from the brief.",
  ].join("\n\n") + "\n";
}
