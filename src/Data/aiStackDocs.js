// The AI Stack's built-in documents: one Markdown file per topic in
// ./aiStackDocs, named by topic id (RAG-01.md). They are the topic's notes for
// every viewer — written into the site, not into anyone's account — and are
// loaded on demand, so opening one topic never pulls in the others.
const LOADERS = import.meta.glob("./aiStackDocs/*.md", { query: "?raw", import: "default" });

const pathOf = (id) => `./aiStackDocs/${id}.md`;

export const hasBuiltInDoc = (source, id) => source === "aistack" && !!LOADERS[pathOf(id)];

export const loadBuiltInDoc = (source, id) =>
  hasBuiltInDoc(source, id) ? LOADERS[pathOf(id)]() : Promise.resolve(null);
