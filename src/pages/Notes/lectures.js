// Topics with a narrated lecture (built in video/, played in the page by
// LecturePlayer), with each lecture's length in minutes. Kept apart from the
// player so the topic header can show the closed lecture card without loading
// Remotion. Update a length when its lecture is re-voiced.
// Core Stack is public, so its lectures are shown to the owner only; Projects
// is owner-only already, and its lectures stay that way.
const LECTURES = {
  aistack: { "CH-01": 23, "CH-02": 18, "CH-03": 17, "CH-04": 15, "CH-05": 15, "CH-06": 14, "CH-07": 12, "CH-08": 15, "CH-09": 13, "CH-10": 16, "CH-11": 15, "CH-12": 16 },
  corestack: { "JAVA-01": 9, "JAVA-04": 8, "SPRING-15": 7, "SPRING-09": 6, "SPRING-23": 7, "SPRING-10": 5, "SPRING-08": 5, "SPRING-11": 5 },
  projects: { "IPP-01": 52, "LL-01": 145, "IOA-01": 107 },
  // The Python and FastAPI question banks (owner-only pages): one lecture per tech.
  webbasics: { "PY-01": 57, "FA-01": 36 },
};
const OWNER_ONLY = new Set(["corestack", "projects", "webbasics"]);

// Which lecture a question-bank tech shows at the top of its modules.
export const TECH_LECTURES = { python: "PY-01", fastapi: "FA-01" };

export const hasLecture = (source, id, owner) => !!LECTURES[source]?.[id] && (owner || !OWNER_ONLY.has(source));

export const lectureMinutes = (source, id) => LECTURES[source]?.[id] ?? null;
