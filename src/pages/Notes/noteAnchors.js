// Anchoring personal notes to passages of the rendered note.
//
// A note is pinned to what the reader sees — the selected text plus a little
// context either side — not to markdown offsets. That lets a note sit on a
// line of code, a table cell or a hidden answer without touching the source,
// and it survives edits elsewhere in the note: the passage is found again by
// its text, and the context picks the right copy when it appears twice.

const CONTEXT = 40;

// Every text node the reader actually reads, in order, with where each one
// starts in the concatenated text. UI chrome (buttons, the copy control, an
// open section editor) is left out.
export function buildTextIndex(root) {
  const nodes = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || p.closest("button, textarea, .copied, .note-editor, .note-ui")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    nodes.push({ node: n, start: text.length });
    text += n.data;
  }
  return { text, nodes };
}

// A DOM boundary point → an offset into the index text.
function offsetOf(index, container, offset) {
  if (container.nodeType === Node.TEXT_NODE) {
    const entry = index.nodes.find((e) => e.node === container);
    if (entry) return entry.start + Math.min(offset, container.data.length);
  }
  // An element boundary (e.g. a triple-click ending at the next block): the
  // offset of the first indexed text node at or after it.
  const probe = document.createRange();
  probe.setStart(container, offset);
  probe.collapse(true);
  for (const entry of index.nodes) {
    if (probe.comparePoint(entry.node, 0) >= 0) return entry.start;
  }
  return index.text.length;
}

// [start, end) in the index text → a live DOM Range.
export function rangeFor(index, start, end) {
  const find = (pos, preferNext) => {
    let lo = 0;
    let hi = index.nodes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (index.nodes[mid].start <= pos) lo = mid;
      else hi = mid - 1;
    }
    let entry = index.nodes[lo];
    // A position exactly at a node's end reads better as the next node's start.
    if (preferNext && entry && pos - entry.start === entry.node.data.length && index.nodes[lo + 1]) entry = index.nodes[lo + 1];
    return entry;
  };
  const a = find(start, true);
  const b = find(end, false);
  if (!a || !b) return null;
  const range = document.createRange();
  range.setStart(a.node, Math.max(0, start - a.start));
  range.setEnd(b.node, Math.min(b.node.data.length, end - b.start));
  return range;
}

// A selection → what to store: the passage and a little context around it.
export function anchorFromRange(index, range) {
  let start = offsetOf(index, range.startContainer, range.startOffset);
  let end = offsetOf(index, range.endContainer, range.endOffset);
  while (start < end && /\s/.test(index.text[start])) start++;
  while (end > start && /\s/.test(index.text[end - 1])) end--;
  if (end <= start) return null;
  const quote = index.text.slice(start, end);
  // Which copy of the passage this is, for when the same words (and the same
  // context) repeat — a question asked in several topics, say.
  let occurrence = 0;
  let total = 0;
  for (let i = index.text.indexOf(quote); i !== -1; i = index.text.indexOf(quote, i + 1)) {
    if (i < start) occurrence++;
    total++;
  }
  return {
    quote,
    prefix: index.text.slice(Math.max(0, start - CONTEXT), start),
    suffix: index.text.slice(end, end + CONTEXT),
    occurrence,
    total,
  };
}

function commonSuffix(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}
function commonPrefix(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

// Find a stored passage again: every copy of the quote, scored by how much of
// the saved context still surrounds it. Returns [start, end) or null when the
// passage is gone (the text was edited).
export function locate(index, anchor) {
  const { text } = index;
  const hits = [];
  for (let i = text.indexOf(anchor.quote); i !== -1; i = text.indexOf(anchor.quote, i + 1)) {
    hits.push([i, i + anchor.quote.length]);
  }
  if (!hits.length) {
    // Tolerate re-wrapped whitespace.
    const pattern = anchor.quote
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");
    if (!pattern) return null;
    const re = new RegExp(pattern, "g");
    for (let m = re.exec(text); m; m = re.exec(text)) {
      hits.push([m.index, m.index + m[0].length]);
      re.lastIndex = m.index + 1;
    }
  }
  if (!hits.length) return null;
  // Most surviving context wins; on a tie, the copy nearest the one saved.
  const want = anchor.occurrence ?? 0;
  let best = null;
  let bestScore = -1;
  let bestGap = Infinity;
  hits.forEach(([s, e], i) => {
    const score =
      commonSuffix(text.slice(Math.max(0, s - CONTEXT), s), anchor.prefix || "") +
      commonPrefix(text.slice(e, e + CONTEXT), anchor.suffix || "");
    const gap = Math.abs(i - want);
    if (score > bestScore || (score === bestScore && gap < bestGap)) {
      best = [s, e];
      bestScore = score;
      bestGap = gap;
    }
  });

  // Trust the match when enough context survived, when the passage is the
  // only one of its kind (its surroundings were merely edited), or when no
  // copy has come or gone. Otherwise the passage this note was about has been
  // edited away, and pinning it to some other copy would be wrong.
  const saved = (anchor.prefix || "").length + (anchor.suffix || "").length;
  const enoughContext = saved === 0 || bestScore >= Math.min(16, saved * 0.4);
  const sameCopies = anchor.total == null || anchor.total === hits.length;
  if (enoughContext && (hits.length === 1 || sameCopies || bestScore >= saved * 0.9)) return best;
  if (hits.length === 1) return best;
  if (sameCopies) return hits[Math.min(want, hits.length - 1)];
  return null;
}

// Where a click landed, as a DOM point.
export function caretFromPoint(x, y) {
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    return p ? { node: p.offsetNode, offset: p.offset } : null;
  }
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  return null;
}

// The CSS Custom Highlight API paints ranges without adding any elements —
// which is what lets a note sit on top of React-rendered markdown safely.
export const canPaintHighlights = typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";

export function paintRanges(name, ranges) {
  if (!canPaintHighlights) return;
  if (ranges.length) CSS.highlights.set(name, new Highlight(...ranges));
  else CSS.highlights.delete(name);
}
