// Topics with a narrated lecture (built in video/, played in the page by
// LecturePlayer). Kept apart from the player so the topic header can check
// without loading Remotion.
const LECTURES = { aistack: new Set(["CH-01", "CH-02", "CH-03"]) };

export const hasLecture = (source, id) => !!LECTURES[source]?.has(id);
