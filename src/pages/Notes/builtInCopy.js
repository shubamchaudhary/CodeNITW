// A built-in document (AI Stack) is the same for every viewer, but highlights
// are part of a note's text. So a viewer who highlights gets their own copy of
// the document — the document plus their <mark> tags — saved as their note for
// that topic. When the document is later rewritten, the copy is rebuilt on the
// new text: every highlighted passage still found in it is marked again.
import { markOpen, MARK_CLOSE } from "./noteMarkdown";

const MARK_OPEN = /<mark class="hl-[\w-]+">/g;
const MARKED = /<mark class="hl-([\w-]+)">([\s\S]*?)<\/mark>/g;

export const stripMarks = (text) => text.replace(MARK_OPEN, "").split(MARK_CLOSE).join("");

// What a viewer should read: their copy while it is still a copy of this
// document, otherwise the document itself.
export function builtInText(doc, copy) {
  return copy && stripMarks(copy) === doc ? copy : doc;
}

// A copy with highlights, made from an older version of the document.
export const needsRebase = (doc, copy) => !!copy && copy.includes("<mark") && stripMarks(copy) !== doc;

// Re-mark the copy's highlighted passages in the new document, in order where
// possible. Returns the new copy and how many highlights survived.
export function rebaseHighlights(copy, doc) {
  const spans = [];
  let from = 0;
  let total = 0;
  for (const [, color, inner] of copy.matchAll(MARKED)) {
    total++;
    const passage = stripMarks(inner);
    if (!passage.trim()) continue;
    let at = doc.indexOf(passage, from);
    if (at === -1) at = doc.indexOf(passage);
    if (at === -1) continue;
    const end = at + passage.length;
    if (spans.some(([s, e]) => at < e && end > s)) continue;
    spans.push([at, end, color]);
    from = end;
  }
  spans.sort((a, b) => a[0] - b[0]);
  let text = "";
  let pos = 0;
  for (const [s, e, color] of spans) {
    text += doc.slice(pos, s) + markOpen(color) + doc.slice(s, e) + MARK_CLOSE;
    pos = e;
  }
  return { text: text + doc.slice(pos), kept: spans.length, total };
}
