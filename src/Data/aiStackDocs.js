// Built-in documents: one Markdown file per topic, named by topic id, in
// ./aiStackDocs (RAG-01.md), ./coreStackDocs (JAVA-01.md) and ./projectsDocs
// (LL-01.md). They replace a
// topic's notes — written into the site, not into anyone's account — and are
// loaded on demand, so opening one topic never pulls in the others.
//
// AI Stack is owner-only, so its documents are read by its one viewer. Core
// Stack is public and everyone else keeps their own notes there, so its
// documents are shown to the owner only. Projects is owner-only like AI Stack,
// and its documents stay owner-only too.
const LOADERS = {
  aistack: import.meta.glob("./aiStackDocs/*.md", { query: "?raw", import: "default" }),
  corestack: import.meta.glob("./coreStackDocs/*.md", { query: "?raw", import: "default" }),
  projects: import.meta.glob("./projectsDocs/*.md", { query: "?raw", import: "default" }),
};
const DIRS = { aistack: "aiStackDocs", corestack: "coreStackDocs", projects: "projectsDocs" };
const OWNER_ONLY = new Set(["corestack", "projects"]);

const loaderOf = (source, id) => LOADERS[source]?.[`./${DIRS[source]}/${id}.md`];

export const hasBuiltInDoc = (source, id, owner) => !!loaderOf(source, id) && (owner || !OWNER_ONLY.has(source));

export const loadBuiltInDoc = (source, id, owner) =>
  hasBuiltInDoc(source, id, owner) ? loaderOf(source, id)() : Promise.resolve(null);
