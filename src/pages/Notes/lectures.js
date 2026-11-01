// Topics with a narrated lecture (built in video/, played in the page by
// LecturePlayer). Kept apart from the player so the topic header can check
// without loading Remotion.
// Core Stack is public, so its lectures are shown to the owner only.
const LECTURES = {
  aistack: new Set(["CH-01", "CH-02", "CH-03", "CH-04", "CH-05", "CH-06", "CH-07", "CH-08", "CH-09", "CH-10", "CH-11", "CH-12"]),
  corestack: new Set(["JAVA-01", "JAVA-04"]),
};
const OWNER_ONLY = new Set(["corestack"]);

export const hasLecture = (source, id, owner) => !!LECTURES[source]?.has(id) && (owner || !OWNER_ONLY.has(source));
