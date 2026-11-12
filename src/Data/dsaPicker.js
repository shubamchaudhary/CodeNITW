// The DSA question picker: which ONE problem to do next.
//
// It balances three things, in this order of strictness:
//
//   1. ORDER INSIDE A TOPIC (a hard gate). Every problem has a `level`:
//      1 Easy · 2 gentler Medium · 3 harder Medium · 4 Hard. A level opens only
//      once you've solved enough of the level below it in that topic, so a
//      topic always goes easy → hard. Some topics also need another topic
//      started first (Graphs after basic Trees, 2D DP after 1D DP, …).
//
//   2. DIVERSITY (a multiplier). Each topic's coverage is the importance-
//      weighted share of it you've solved. Topics behind your overall
//      coverage are boosted, topics ahead are damped — so with lots of DP and
//      little Graphs done, a Graphs problem wins. A family already on today's
//      list (or solved in the last two days) is damped too, so consecutive
//      picks spread across topics.
//
//   3. IMPORTANCE (the base). `importance` is 0–100 from how often a problem
//      is asked (recent asks weighted up) and how many curated lists carry it.
//
// The ranking is deterministic: the same progress gives the same pick, and
// "Skip" just steps to the next one.

// Topics that belong together, for "don't give me two graph problems in a row".
const FAMILY = {
  "Arrays and Two Pointers": "Arrays",
  "Sliding Window": "Arrays",
  "Array Manipulation and Prefix Sums": "Arrays",
  "Matrix and 2D Arrays": "Arrays",
  "String Algorithms": "Strings",
  "Linked Lists": "Linked Lists",
  "Stack and Queue": "Stacks & Queues",
  "Trees - Basic and Traversal": "Trees",
  "Trees - Advanced Properties": "Trees",
  "Trees - Construction and Modification": "Trees",
  "Binary Search Trees": "Trees",
  "Heap and Priority Queue": "Heaps",
  "Binary Search": "Binary Search",
  "Dynamic Programming - 1D": "DP",
  "Dynamic Programming - 2D": "DP",
  "Dynamic Programming - Advanced": "DP",
  "Graphs - Basic Traversal": "Graphs",
  "Graphs - Topological Sort and Cycle Detection": "Graphs",
  "Graphs - Shortest Path and Advanced": "Graphs",
  "Union Find": "Graphs",
  Backtracking: "Backtracking",
  "Greedy & Intervals": "Greedy",
  Trie: "Trie",
  "Bit Manipulation": "Math & Bits",
  "Math & Number Theory": "Math & Bits",
  "Design and Implementation": "Design",
};
export const familyOf = (topic) => FAMILY[topic] || topic;

// A topic opens once each listed topic is "started" (STARTED_MIN solves).
const PREREQS = {
  "Sliding Window": ["Arrays and Two Pointers"],
  "Array Manipulation and Prefix Sums": ["Arrays and Two Pointers"],
  "Matrix and 2D Arrays": ["Arrays and Two Pointers"],
  "Greedy & Intervals": ["Arrays and Two Pointers"],
  "Trees - Advanced Properties": ["Trees - Basic and Traversal"],
  "Trees - Construction and Modification": ["Trees - Basic and Traversal"],
  "Binary Search Trees": ["Trees - Basic and Traversal"],
  Backtracking: ["Trees - Basic and Traversal"],
  Trie: ["Trees - Basic and Traversal"],
  "Graphs - Basic Traversal": ["Trees - Basic and Traversal"],
  "Graphs - Topological Sort and Cycle Detection": ["Graphs - Basic Traversal"],
  "Graphs - Shortest Path and Advanced": ["Graphs - Basic Traversal", "Heap and Priority Queue"],
  "Union Find": ["Graphs - Basic Traversal"],
  "Dynamic Programming - 2D": ["Dynamic Programming - 1D"],
  "Dynamic Programming - Advanced": ["Dynamic Programming - 2D"],
  "Design and Implementation": ["Linked Lists"],
};
const STARTED_MIN = 3;

// Solves needed at a level before the next level opens: half of that level,
// capped at 3 (so a topic with 11 Easies doesn't make you grind all of them).
const LEVEL_GATE_MAX = 3;
const gateFor = (count) => Math.min(LEVEL_GATE_MAX, Math.ceil(count / 2));

const DAY = 24 * 60 * 60 * 1000;

// Per-topic state: coverage, which levels are open, and why one is locked.
function topicStates(problems, solved) {
  const byTopic = new Map();
  for (const p of problems) {
    if (!byTopic.has(p.topic)) byTopic.set(p.topic, []);
    byTopic.get(p.topic).push(p);
  }
  const states = new Map();
  let totalImp = 0, solvedImp = 0;
  for (const [topic, list] of byTopic) {
    const imp = list.reduce((n, p) => n + p.importance, 0);
    const done = list.filter((p) => solved[p.id]);
    const doneImp = done.reduce((n, p) => n + p.importance, 0);
    totalImp += imp;
    solvedImp += doneImp;

    // Walk the levels present in this topic; each opens the next once warm.
    const levels = [...new Set(list.map((p) => p.level))].sort((a, b) => a - b);
    let openUpTo = levels[0];
    let blockedBy = null;
    for (let i = 0; i < levels.length - 1; i++) {
      const lv = levels[i];
      const count = list.filter((p) => p.level === lv).length;
      // A harder solve proves the easier skill, so it counts toward the gate.
      const have = list.filter((p) => p.level >= lv && solved[p.id]).length;
      const need = gateFor(count);
      if (have >= need) openUpTo = levels[i + 1];
      else {
        blockedBy = { level: lv, have, need };
        break;
      }
    }
    // The easiest level that still has something unsolved and open.
    const openLeft = list.filter((p) => !solved[p.id] && p.level <= openUpTo).map((p) => p.level);
    // The best problem still behind the gate, so the problems that open it
    // can be worth what they unlock (Flood Fill → Number of Islands).
    const behindGate = blockedBy
      ? list.filter((p) => !solved[p.id] && p.level > openUpTo).sort((a, b) => b.importance - a.importance)[0] || null
      : null;
    states.set(topic, {
      behindGate,
      topic,
      lowestOpen: openLeft.length ? Math.min(...openLeft) : openUpTo,
      minLevel: levels[0],
      maxLevel: levels[levels.length - 1],
      total: list.length,
      solved: done.length,
      imp,
      doneImp,
      coverage: imp ? doneImp / imp : 0,
      openUpTo,
      blockedBy,
    });
  }
  const overall = totalImp ? solvedImp / totalImp : 0;

  // A topic can't run ahead of the topics it builds on: it must have them
  // started, and its own levels open no further than theirs (no Hard
  // "Advanced DP" before 2D DP's Hards are open). Chains (1D → 2D → Advanced)
  // settle in a few passes.
  for (let pass = 0; pass < 3; pass++) {
    for (const s of states.values()) {
      const pre = (PREREQS[s.topic] || []).map((t) => states.get(t)).filter(Boolean);
      const notStarted = pre.filter((st) => st.solved < Math.min(STARTED_MIN, st.total)).map((st) => st.topic);
      // A prerequisite that has opened all its own levels caps nothing.
      const cap = Math.min(4, ...pre.map((st) => (st.openUpTo >= st.maxLevel ? 4 : st.openUpTo)));
      s.openUpTo = Math.min(s.openUpTo, cap);
      s.lockedBy = notStarted.length ? notStarted : s.openUpTo < s.minLevel ? pre.map((st) => st.topic) : null;
    }
  }

  // Coverage of each family (all graph topics together, …), so a whole area
  // you've barely touched counts as behind even if one corner of it isn't.
  const fam = new Map();
  for (const s of states.values()) {
    const f = fam.get(familyOf(s.topic)) || { imp: 0, doneImp: 0 };
    f.imp += s.imp;
    f.doneImp += s.doneImp;
    fam.set(familyOf(s.topic), f);
  }
  // A big area (Graphs, Trees, DP) being behind matters more than a small one
  // (Math & Bits), so the family's pull scales with its size.
  const meanFamImp = [...fam.values()].reduce((n, f) => n + f.imp, 0) / fam.size;
  for (const s of states.values()) {
    const f = fam.get(familyOf(s.topic));
    s.familyCoverage = f.imp ? f.doneImp / f.imp : 0;
    s.familyWeight = Math.sqrt(f.imp / meanFamImp);
  }
  return { states, overall };
}

/**
 * Ranks every problem you could do next, best first.
 *
 * @param {object} o
 * @param {Array}  o.problems   DSA_PROBLEMS (each with topic, importance, level…)
 * @param {object} o.solved     { id: true } — solves
 * @param {object} o.solvedAt   { id: timestampMs } — when each was solved
 * @param {Set}    o.todayIds   ids already on today's plan
 * @param {Set}    o.skipped    ids sitting out after a skip
 * @param {number} [o.now]
 * @returns {{ picks: Array<{problem, score}>, overall: number, states: Map }}
 */
export function rankNextProblems({ problems, solved, solvedAt = {}, todayIds = new Set(), skipped = new Set(), now = Date.now() }) {
  const { states, overall } = topicStates(problems, solved);
  const byId = new Map(problems.map((p) => [p.id, p]));

  // What today (and the last two days) already covered, by family and topic.
  const todayFamilies = new Map();
  const todayTopics = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const id of todayIds) {
    const p = byId.get(id);
    if (p) { bump(todayFamilies, familyOf(p.topic)); bump(todayTopics, p.topic); }
  }
  const recentFamilies = new Map();
  for (const [id, at] of Object.entries(solvedAt)) {
    const p = byId.get(id);
    if (!p || !solved[id] || todayIds.has(id) || now - at > 2 * DAY) continue;
    bump(recentFamilies, familyOf(p.topic));
  }

  const picks = [];
  for (const p of problems) {
    if (solved[p.id] || todayIds.has(p.id) || skipped.has(p.id)) continue;
    const st = states.get(p.topic);
    if (st.lockedBy || p.level > st.openUpTo) continue;

    const fam = familyOf(p.topic);
    // A problem that counts toward opening the next level is worth most of
    // the best problem it unlocks.
    const unlocks = st.behindGate && p.level >= st.blockedBy.level ? st.behindGate : null;
    const worth = Math.max(p.importance, unlocks ? 0.8 * unlocks.importance : 0);
    const base = Math.pow(worth / 100, 1.3);
    // Behind your overall coverage → up to 2.5×; well ahead → down to 0.35×.
    // Measured half on the topic, half on its whole family.
    const behind = 0.5 * (overall - st.coverage) + 0.5 * (overall - st.familyCoverage) * st.familyWeight;
    const need = Math.min(2.5, Math.max(0.35, 1 + 2.5 * behind));
    const spread =
      Math.pow(0.45, todayFamilies.get(fam) || 0) *
      Math.pow(0.6, todayTopics.get(p.topic) || 0) *
      Math.pow(0.85, recentFamilies.get(fam) || 0);
    // Inside the open levels, lean gently toward the easier ones.
    const ease = 1 - 0.12 * (p.level - st.lowestOpen);
    const hot = (p.recent || 0) >= 3 ? 1.1 : 1;
    const score = base * need * spread * ease * hot;

    picks.push({ problem: p, score });
  }
  picks.sort((a, b) => b.score - a.score || b.problem.importance - a.problem.importance);
  return { picks, overall, states };
}

// ── The queue ────────────────────────────────────────────────────────────────
// The page shows the next QUEUE_SIZE picks at once. Adding one to today or
// skipping it takes it out and the next best slides in at the end; the rest
// stay where they are, so the queue never reshuffles under you.
//
// A skip is a "not now", not a "never": the skipped problem sits out until
// SKIP_RETURN_AFTER more problems have gone through the queue (two batches of
// four), then it takes the next free slot — ahead of anything newly ranked.
export const QUEUE_SIZE = 4;
export const SKIP_RETURN_AFTER = 2 * QUEUE_SIZE;

/**
 * Tops the queue up to QUEUE_SIZE: keeps every queued problem that's still
 * open, puts back skipped problems whose wait is over, then appends the best
 * of the rest one at a time, counting each one already queued as "planned"
 * so the queue itself spreads across topics.
 * @returns {string[]} problem ids, in queue order
 */
export function fillQueue({ problems, solved, solvedAt, todayIds, hidden, due = [], queue = [] }) {
  const exclude = new Set([...todayIds]);
  const open = new Set(
    rankNextProblems({ problems, solved, solvedAt, todayIds: exclude, skipped: hidden }).picks.map((x) => x.problem.id)
  );
  const next = queue.filter((id) => open.has(id)).slice(0, QUEUE_SIZE);
  for (const id of due) if (next.length < QUEUE_SIZE && open.has(id) && !next.includes(id)) next.push(id);
  while (next.length < QUEUE_SIZE) {
    const planned = new Set([...todayIds, ...next]);
    const best = rankNextProblems({ problems, solved, solvedAt, todayIds: planned, skipped: hidden }).picks[0];
    if (!best) break;
    next.push(best.problem.id);
  }
  return next;
}

// Per browser, not progress: the queue's order, how many problems have gone
// through it, and when each skip happened (in that count).
const QUEUE_KEY = "DSAPickerQueue";

export function loadQueueState() {
  try {
    const raw = JSON.parse(localStorage.getItem(QUEUE_KEY) || "null");
    if (raw && Array.isArray(raw.queue) && typeof raw.served === "number") {
      return { queue: raw.queue, served: raw.served, skipped: raw.skipped || {} };
    }
  } catch (_) {
    /* fall through to a fresh queue */
  }
  return { queue: [], served: 0, skipped: {} };
}

export function saveQueueState(state) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(state));
  } catch (_) {
    /* private window / storage off: the queue just lasts this visit */
  }
}

// Skipped problems whose wait is over, oldest skip first.
export function dueSkips(state) {
  return Object.entries(state.skipped)
    .filter(([, at]) => state.served - at >= SKIP_RETURN_AFTER)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

// Skipped problems still sitting out at this point in the count.
export function hiddenSkips(state) {
  return new Set(
    Object.entries(state.skipped)
      .filter(([, at]) => state.served - at < SKIP_RETURN_AFTER)
      .map(([id]) => id)
  );
}
