// Pure helpers behind the notes page: splitting a note into editable sections,
// the formatting toolbar's text surgery, and the source-side half of
// highlighting. No React and no DOM here, so every rule is in one place.

// ─── Sections ────────────────────────────────────────────────────────────────
// A note is cut at every ATX heading so each part can be read, edited in place
// and linked from the table of contents. Headings inside fenced code or inside
// a <details> block are not cut points: a "# comment" in a bash snippet or a
// "### Answer" inside a hidden answer belongs to the block around it.

const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;

export function splitSections(text) {
  const sections = [];
  let current = { start: 0, level: 0, title: "" };
  let fence = null;
  let details = 0;
  let pos = 0;

  for (const raw of text.split("\n")) {
    const lineStart = pos;
    pos += raw.length + 1;
    const line = raw.replace(/\r$/, "");

    if (fence) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      continue;
    }
    const open = line.match(FENCE_OPEN);
    if (open) {
      fence = open[1];
      continue;
    }

    const heading = details === 0 ? line.match(HEADING) : null;
    details = Math.max(
      0,
      details + (line.match(/<details\b/gi) || []).length - (line.match(/<\/details>/gi) || []).length
    );
    if (!heading || !heading[2].trim()) continue;

    if (lineStart > current.start) {
      sections.push({ ...current, end: lineStart });
      current = { start: lineStart, level: 0, title: "" };
    }
    current.level = heading[1].length;
    current.title = plainText(heading[2]);
  }

  sections.push({ ...current, end: text.length });
  return sections
    .filter((s) => s.end > s.start || sections.length === 1)
    .map((s, i) => ({ ...s, id: `note-sec-${i}` }));
}

// Heading source → what a reader sees: no emphasis markers, code ticks, link
// targets or inline HTML.
export function plainText(md) {
  return md
    .replace(/<[^>]+>/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "")
    .trim();
}

// Section edits come back without their trailing blank lines (the textarea
// trims them); put the original separator back so the next heading still
// starts a new block.
export function spliceSection(text, section, edited) {
  const original = text.slice(section.start, section.end);
  const tail = original.match(/\s*$/)[0];
  const isLast = section.end >= text.length;
  const body = edited.replace(/\s+$/, "");
  const sep = isLast ? tail : tail.includes("\n\n") ? tail : "\n\n";
  return text.slice(0, section.start) + (body ? body + sep : "") + text.slice(section.end);
}

export function appendBlock(text, block) {
  const body = block.replace(/\s+$/, "");
  if (!body) return text;
  if (!text.trim()) return body + "\n";
  return text.replace(/\s*$/, "") + "\n\n" + body + "\n";
}

export function noteStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const images = (text.match(/!\[[^\]]*\]\((?!\s*\))/g) || []).length;
  return { words, images, minutes: words ? Math.max(1, Math.round(words / 220)) : 0 };
}

// ─── Formatting toolbar ──────────────────────────────────────────────────────
// `wrap` surrounds the selection, `line` prefixes each selected line, `block`
// fences it, `insert` drops text at the caret. Shared by the full editor and
// the in-place section editor.

export const TOOLBAR = [
  { key: "h2", label: "H", title: "Heading", line: "## " },
  { key: "bold", label: "B", title: "Bold (Ctrl+B)", wrap: "**", bold: true },
  { key: "italic", label: "I", title: "Italic (Ctrl+I)", wrap: "*", italic: true },
  { key: "code", label: "</>", title: "Inline code", wrap: "`" },
  { key: "block", label: "{ }", title: "Code block", block: "```java\n", blockEnd: "\n```" },
  { key: "ul", label: "•", title: "Bullet list", line: "- " },
  { key: "ol", label: "1.", title: "Numbered list", line: "1. " },
  { key: "task", label: "☑", title: "Checklist", line: "- [ ] " },
  { key: "quote", label: "❝", title: "Quote", line: "> " },
  { key: "hr", label: "—", title: "Divider", insert: "\n\n---\n\n" },
];

export function formatSelection(value, start, end, action) {
  const selected = value.slice(start, end);

  if (action.insert) {
    return { next: value.slice(0, start) + action.insert + value.slice(end), caret: start + action.insert.length };
  }
  if (action.block) {
    const body = selected || "// code";
    return {
      next: value.slice(0, start) + action.block + body + action.blockEnd + value.slice(end),
      caret: start + action.block.length + body.length,
    };
  }
  if (action.wrap) {
    const body = selected || "text";
    return {
      next: value.slice(0, start) + action.wrap + body + action.wrap + value.slice(end),
      caret: start + action.wrap.length + body.length,
    };
  }
  if (action.line) {
    // Prefix every line the selection touches, list numbering included.
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const stop = lineEnd === -1 ? value.length : lineEnd;
    const prefixed = value
      .slice(lineStart, stop)
      .split("\n")
      .map((l, i) => (action.key === "ol" ? `${i + 1}. ${l}` : action.line + l))
      .join("\n");
    return { next: value.slice(0, lineStart) + prefixed + value.slice(stop), caret: lineStart + prefixed.length };
  }
  return null;
}

// ─── Highlights ──────────────────────────────────────────────────────────────
// A highlight is a <mark> in the note itself, so it syncs with the text, shows
// up in the editor, and needs no second store that could drift out of step.

export const HIGHLIGHTS = [
  { key: "yellow", label: "Yellow", swatch: "#facc15" },
  { key: "green", label: "Green", swatch: "#4ade80" },
  { key: "blue", label: "Blue", swatch: "#60a5fa" },
  { key: "pink", label: "Pink", swatch: "#f472b6" },
];

export const markOpen = (color) => `<mark class="hl-${color}">`;
export const MARK_CLOSE = "</mark>";

// Where, inside a block's markdown, does the k-th rendered copy of `needle`
// live? Whitespace is matched loosely because the source may wrap or indent a
// line the renderer joins. Returns [start, end) relative to `source`, or null.
export function findNthInSource(source, needle, k) {
  const pattern = needle
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  if (!pattern) return null;
  const re = new RegExp(pattern, "g");
  let m;
  let seen = 0;
  while ((m = re.exec(source))) {
    if (seen === k) return [m.index, m.index + m[0].length];
    seen++;
    re.lastIndex = m.index + 1;
  }
  return null;
}

// Every start index of `needle` in `hay`, overlapping ones included, so the
// rendered count and the source count are taken the same way.
export function occurrences(hay, needle) {
  const out = [];
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + 1)) out.push(i);
  return out;
}

// Apply non-overlapping wraps back to front so earlier offsets stay valid.
export function applyWraps(text, spans, open, close = MARK_CLOSE) {
  const sorted = [...spans].sort((a, b) => b[0] - a[0]);
  let out = text;
  let last = Infinity;
  for (const [s, e] of sorted) {
    if (e > last) continue; // overlaps the one already applied
    out = out.slice(0, s) + open + out.slice(s, e) + close + out.slice(e);
    last = s;
  }
  return out;
}

const MARK_TAG = /^<mark\b[^>]*>([\s\S]*)<\/mark>$/i;

export function unwrapMarkAt(text, start, end) {
  const m = text.slice(start, end).match(MARK_TAG);
  return m ? text.slice(0, start) + m[1] + text.slice(end) : null;
}

export function recolorMarkAt(text, start, end, color) {
  const m = text.slice(start, end).match(MARK_TAG);
  return m ? text.slice(0, start) + markOpen(color) + m[1] + MARK_CLOSE + text.slice(end) : null;
}
