// Three-way merge, as git does it: given the version both sides started from
// (base) and each side's edit (ours, theirs), keep both sets of changes when
// they touch different lines. When both changed the same lines differently,
// it's a conflict and nothing is guessed.

// Line hunks turning `base` into `other`: [{ start, end, lines }] replaces
// base lines [start, end) with `lines`. Common prefix and suffix are trimmed
// first, so a real note (thousands of lines, a few edited) diffs a few lines.
function hunks(base, other) {
  let pre = 0;
  while (pre < base.length && pre < other.length && base[pre] === other[pre]) pre++;
  let suf = 0;
  while (
    suf < base.length - pre &&
    suf < other.length - pre &&
    base[base.length - 1 - suf] === other[other.length - 1 - suf]
  ) {
    suf++;
  }
  const a = base.slice(pre, base.length - suf);
  const b = other.slice(pre, other.length - suf);
  if (!a.length && !b.length) return [];
  if (a.length * b.length > 4_000_000) return null; // too big to diff safely

  // Longest common subsequence of the middle, then walk it into hunks.
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  let open = null;
  const flush = () => {
    if (open) out.push(open);
    open = null;
  };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      open ||= { start: pre + i, end: pre + i, lines: [] };
      open.lines.push(b[j]);
      j++;
    } else {
      open ||= { start: pre + i, end: pre + i, lines: [] };
      open.end = pre + i + 1;
      i++;
    }
  }
  flush();
  return out;
}

const sameLines = (x, y) => x.length === y.length && x.every((l, k) => l === y[k]);

// → { ok: true, text } or { ok: false } (a conflict, or no common base).
export function merge3(base, ours, theirs) {
  if (ours === theirs) return { ok: true, text: ours };
  if (typeof base !== "string" || typeof ours !== "string" || typeof theirs !== "string") return { ok: false };
  if (base === ours) return { ok: true, text: theirs };
  if (base === theirs) return { ok: true, text: ours };

  const B = base.split("\n");
  const ho = hunks(B, ours.split("\n"));
  const ht = hunks(B, theirs.split("\n"));
  if (!ho || !ht) return { ok: false };

  const all = [...ho.map((h) => ({ ...h, side: "o" })), ...ht.map((h) => ({ ...h, side: "t" }))].sort(
    (x, y) => x.start - y.start || x.end - y.end
  );
  const result = [];
  let pos = 0;
  for (let k = 0; k < all.length; k++) {
    const h = all[k];
    const next = all[k + 1];
    // Two hunks collide when their base ranges overlap, or both insert at
    // the same spot. Identical changes on both sides are fine (taken once).
    if (next && (next.start < h.end || (next.start === h.start && (h.start === h.end || next.start === next.end)))) {
      if (next.side !== h.side && next.start === h.start && next.end === h.end && sameLines(next.lines, h.lines)) {
        result.push(...B.slice(pos, h.start), ...h.lines);
        pos = h.end;
        k++;
        continue;
      }
      return { ok: false };
    }
    result.push(...B.slice(pos, h.start), ...h.lines);
    pos = h.end;
  }
  result.push(...B.slice(pos));
  return { ok: true, text: result.join("\n") };
}

// Personal notes are lists of { id, … }: merged per note. Added, removed or
// edited on one side only — taken. Edited differently on both — a conflict.
export function mergeById(base, ours, theirs) {
  const key = (list) => new Map((Array.isArray(list) ? list : []).map((x) => [x.id, x]));
  const B = key(base);
  const O = key(ours);
  const T = key(theirs);
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const out = new Map(T);
  for (const id of new Set([...B.keys(), ...O.keys()])) {
    const b = B.get(id);
    const o = O.get(id);
    const t = T.get(id);
    if (same(o, b)) continue; // we didn't touch it: theirs stands
    if (same(t, b)) {
      // Only we changed it (added, edited or removed).
      if (o === undefined) out.delete(id);
      else out.set(id, o);
    } else if (!same(o, t)) {
      return { ok: false };
    }
  }
  // Keep their order, then anything we added.
  const order = [...(Array.isArray(theirs) ? theirs : []).map((x) => x.id), ...[...O.keys()].filter((id) => !T.has(id))];
  return { ok: true, value: order.filter((id) => out.has(id)).map((id) => out.get(id)) };
}
