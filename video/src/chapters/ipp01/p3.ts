import type { Scene } from "../../lib/types.ts";
import { B, check, sec, shot } from "./h.ts";

// Part 3: the notes page (highlights, personal notes, diagrams), then
// git-style notes: revisions with compare-and-swap in the rules, the
// three-way merge, append-only history and restore.
export const p3: Scene[] = [
  // ------------------------------------------------------------ 5
  sec("5", "The notes page: highlights and pinned notes", "Topic five. The notes page. The biggest piece of frontend in the app."),
  shot(
    "notes.jpg",
    "A Core Stack topic, with a student's own notes",
    ["Your notes, in markdown, edited in place", "A highlight is a <mark> in the note", "A personal note is pinned to a passage", "Contents and \"learnt\" ticks on the right"],
    [[50, 50, 1], [46, 84, 1.7], [58, 70, 1.5], [90, 18, 2]],
    B(
      "This is a Core Stack topic, the way a student sees it. What to watch first, then their own notes, written in markdown. Any section opens in place for editing, from the pen in its margin.",
      "The yellow line is a highlight. Select text, pick a colour, and it's saved as a mark tag, inside the markdown itself.",
      { say: "The dotted underline with the bubble is a personal note, pinned to that exact passage. And here's the trick: a personal note never touches the markdown at all.", tone: "key" },
      "And on the right, the note's own contents, with a learnt tick per section, so a student can see what's left.",
    ),
  ),
  {
    kind: "bullets",
    title: "How a highlight lands in the markdown",
    items: [
      { icon: "🏷", text: "Every rendered block carries its source offsets", sub: "data-s / data-e from the markdown AST's positions" },
      { icon: "🖱", text: "A selection is traced back to its block", sub: "which copy of the text it is inside that block, then the same copy in the source" },
      { icon: "🖍", text: "That span is wrapped: <mark class=\"hl-yellow\">…</mark>", sub: "inline code is literal: wrapped whole, never inside" },
      { icon: "🔁", text: "The result is ordinary note text", sub: "so a highlight syncs, versions and merges like any other edit" },
    ],
    beats: B(
      "How does a highlight on the screen become a mark tag in the markdown? First, every block the renderer outputs, a paragraph, a list item, a table cell, carries the start and end offsets of the markdown that produced it. They come from the markdown syntax tree's positions.",
      "When you select text, the selection is traced back to its block, and to which copy of that text it is inside the block, because the same words can appear twice. Then the same copy is found in the block's source.",
      "That span of the source is wrapped in a mark tag with the colour's class. Inline code is literal text, so a code span is wrapped whole, never inside.",
      { say: "And the result is just more note text. So a highlight syncs, versions and merges exactly like any other edit. No second system.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Personal notes are pinned to the text you see",
    items: [
      { icon: "📌", text: "Anchor = the quote + 40 characters either side", sub: "plus which occurrence it was, and how many there were" },
      { icon: "🔎", text: "Found again by text, after any edit", sub: "the copy with the most surviving context wins" },
      { icon: "✨", text: "Painted with the CSS Custom Highlight API", sub: "no spans inserted: React's DOM is never touched" },
      { icon: "🚫", text: "Passage edited away? Not pinned anywhere else", sub: "a wrong pin is worse than none" },
    ],
    beats: B(
      "Personal notes work differently, because they can sit on code, on a table cell, on a hidden answer, places you can't put a mark tag. So a personal note is anchored to the rendered text: the quoted passage, plus forty characters of context on each side, plus which occurrence it was and how many there were.",
      "After the note is edited, the passage is found again by its text. If it appears more than once, the copy with the most surviving context wins.",
      { say: "It's painted with the CSS Custom Highlight A P I. The browser highlights a range directly. No spans are inserted, so React's DOM is never touched, and a re render can't wipe the highlight.", tone: "key" },
      "And if the passage was edited away, the note is not pinned to some other copy. A wrong pin is worse than none.",
    ),
  },
  {
    kind: "compare",
    title: "Other ways to pin a note",
    cols: [
      { title: "Markdown offsets", icon: "📍", tone: "red", items: ["break on any edit above", "can't sit on rendered-only text"] },
      { title: "Wrap in DOM spans", icon: "🧱", tone: "amber", items: ["fights React's re-render", "breaks inside code blocks"] },
      { title: "Text quote + context", icon: "✅", tone: "green", items: ["survives edits elsewhere", "the W3C Web Annotation idea"] },
    ],
    footer: "a highlight belongs to the note's text; a personal note belongs to the passage you read",
    beats: B(
      "The alternatives. Anchor by markdown offsets: every edit above the note shifts it, and rendered only text, like a folded answer, has no offset to use.",
      "Wrap the passage in spans in the DOM: React re renders and wipes them, and they break inside syntax highlighted code.",
      "Text quote plus context survives edits elsewhere in the note. It's the same idea as the W3C web annotation text quote selector.",
      { say: "So the rule you say out loud. A highlight belongs to the note's text, so it lives in the markdown. A personal note belongs to the passage you read, so it lives beside it.", tone: "key" },
    ),
  },
  check({
    topic: "the notes page",
    q: "Why are personal notes painted with the CSS Custom Highlight API instead of wrapping the passage in a <span>?",
    say: "Why are personal notes painted with the CSS custom highlight API, instead of wrapping the passage in a span?",
    a: "Inserting spans mutates the DOM React owns, so a re-render wipes them, and they break inside highlighted code. The Highlight API paints a range without changing the DOM.",
    aSay: "Because inserting spans mutates the DOM that React owns, so the next re-render wipes them, and they break inside syntax highlighted code. The highlight A P I paints a range without changing the DOM at all.",
  }),

  // ------------------------------------------------------------ 6
  sec("6", "Git-style notes I: revisions and compare-and-swap", "Topic six. Git style notes, part one. Why a note can't be silently overwritten."),
  {
    kind: "big",
    tone: "myth",
    lead: "The bug this design exists for",
    text: "The phone, offline since yesterday, saves a typo fix, and wipes three paragraphs written on the laptop.",
    after: "last-writer-wins is fine for a tick; for a long note it silently loses work",
    beats: B(
      "Start with the bug this design exists for.",
      { say: "The phone has been offline since yesterday. Meanwhile, on the laptop, you wrote three paragraphs. Now the phone comes online and saves a one word typo fix. With last writer wins, the phone's whole copy replaces the note, and the three paragraphs are gone.", tone: "key" },
      "Last writer wins is fine for a tick. The worst case is one wrong tick. For a long note, it silently loses work. So notes get a different model.",
    ),
  },
  {
    kind: "seq",
    title: "Every save names the revision it was built on",
    actors: [
      { id: "ph", name: "Phone", icon: "📱" },
      { id: "fs", name: "Firestore rules", icon: "🛡" },
      { id: "lap", name: "Laptop", icon: "💻" },
    ],
    msgs: [
      { from: "lap", to: "fs", label: "save: base 7 → rev 8 ✓", step: 1, tone: "green" },
      { from: "ph", to: "fs", label: "save: base 7 → rev 8", step: 2 },
      { from: "fs", to: "ph", label: "refused: head is 8, not 7", step: 3, tone: "red", dash: true },
      { from: "ph", to: "ph", label: "fetch head 8 · merge (topic 7)", step: 4, tone: "amber" },
      { from: "ph", to: "fs", label: "save: base 8 → rev 9 ✓", step: 5, tone: "green" },
    ],
    note: { step: 6, text: "compare-and-swap, enforced by the server: a stale device can't overwrite a newer version", tone: "green" },
    beats: B(
      "Here's the model. Each note has a revision number in its own Firestore document. Both devices start from revision seven.",
      "The laptop saves. It says: my edit is based on seven, and this is eight. The head is seven, so it's accepted.",
      "Now the phone saves. Also based on seven, also claiming eight.",
      { say: "Refused. The head is now eight, not seven. The phone's edit was built on an old version.", tone: "key" },
      "So the phone fetches the head, revision eight, and decides like git. Different lines? Merge them. That's topic seven.",
      "And it saves the result based on eight, as nine. Accepted.",
      { say: "That's compare and swap, enforced by the server. A stale device, or a buggy one, cannot overwrite a newer version.", tone: "key" },
    ),
  },
  {
    kind: "code",
    title: "The check lives in the security rules",
    lang: "js",
    code: `// firestore.rules: userProgress/{uid}/notes/{noteId}
function validNote(noteId) {
  let n = request.resource.data;
  return n.keys().hasOnly(['key', 'id', 'value', 'deleted', 'rev', 'base', 'updatedAt'])
    && n.rev is int && n.base is int
    && n.rev == n.base + 1
    && noteId.matches(n.key + '~.+');
}

match /notes/{noteId} {
  allow read: if signedInAs(uid);
  allow update: if signedInAs(uid) && validNote(noteId)
    && request.resource.data.base == resource.data.rev;
}`,
    highlight: [[11, 11], [4, 4], [6, 6], [13, 13]],
    beats: B(
      "And here's where the check lives. Not in the client. In Firestore's security rules. Only the signed in owner can read or write their notes.",
      "A note document may hold exactly these fields, and nothing else.",
      "The new revision must be exactly the base plus one. No skipping.",
      { say: "And the line that matters. The base the client claims must equal the revision stored right now. If another device moved the head, this is false, and the write is refused.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "Why enforce it in the rules, not in the client?",
    answer: "Because checking and writing must be one atomic step. Two clients can both read revision 7, both check, and both write; the rules run with the write.",
    left: { title: "Client checks", items: ["read head · compare · write", "two devices pass the check together", "a buggy client skips it", "a race, not a guarantee"] },
    right: { title: "Rules check", items: ["evaluated with the write", "atomic: one wins, one is refused", "every client, any version", "like UPDATE … WHERE version = ?"] },
    footer: "the same idea as optimistic locking, or git refusing a non-fast-forward push",
    beats: B(
      "The question an interviewer will ask next. Why put the check in the rules, and not just in the client?",
      { say: "Because checking and writing have to be one atomic step.", tone: "key" },
      "If the client checks, two devices can both read revision seven, both pass the check, and both write. And a buggy or old client might skip the check entirely. The rules are evaluated with the write itself, so one wins and the other is refused, for every client, of any version.",
      { say: "Name it. It's optimistic locking, like an update where version equals the one you read. Or git refusing a push that isn't a fast forward.", tone: "key" },
    ),
  },
  check({
    topic: "compare-and-swap",
    q: "A note's head is revision 12. A device saves with base 11 and rev 12. What do the rules do?",
    say: "A note's head is revision twelve. A device saves with base eleven and rev twelve. What do the rules do?",
    options: ["Accept it: rev is base + 1", "Refuse it: the base must equal the stored head, 12", "Accept it, and bump the head to 13", "Refuse it: rev must be 2 above base"],
    oSay: ["Accept it, because rev is base plus one", "Refuse it, because the base must equal the stored head, twelve", "Accept it, and bump the head to thirteen", "Refuse it, because rev must be two above base"],
    answer: 1,
    a: "Refused. rev == base + 1 holds, but base (11) is not the stored head (12): the edit was built on an old version.",
    aSay: "B. Refused. Rev equals base plus one, so that part passes. But the base, eleven, isn't the stored head, twelve. The edit was built on an old version, so the device has to fetch the head and merge.",
  }),

  // ------------------------------------------------------------ 7
  sec("7", "Git-style notes II: merge, history, restore", "Topic seven. Git style notes, part two. The three way merge, the history, and restore."),
  {
    kind: "bullets",
    title: "A refused save decides like git",
    items: [
      { icon: "⏩", text: "The cloud hasn't moved since the edit began", sub: "fast-forward: ours" },
      { icon: "🟰", text: "Both sides ended up identical", sub: "nothing to do: theirs" },
      { icon: "🔀", text: "Both changed, different lines", sub: "three-way merge against the base · saved as the next revision · a toast says so" },
      { icon: "⚠️", text: "Both changed the same lines", sub: "the head stands · our edit goes into History as \"not kept\" · a toast says so" },
    ],
    beats: B(
      "When a save is refused, or a snapshot shows the head moved, the device has four cases. First, the cloud's copy hasn't moved since our edit began. That's a fast forward. Ours wins.",
      "Second, both sides ended up identical. Nothing to merge.",
      { say: "Third, both changed, but different lines. A three way merge against the common base, saved as the next revision, and a small toast tells you both sets of changes were merged.", tone: "key" },
      "Fourth, both changed the same lines. Nothing is guessed. The cloud's head stands, our edit goes into the history as not kept, and a toast says exactly that. Nothing is lost.",
    ),
  },
  {
    kind: "compare",
    title: "merge3, on lines",
    cols: [
      { title: "Base · r7", icon: "📄", tone: "muted", items: ["A", "B", "C", "D"] },
      { title: "Phone", icon: "📱", tone: "blue", items: ["A", "B2  ← changed", "C", "D"] },
      { title: "Laptop", icon: "💻", tone: "amber", items: ["A", "B", "C", "D2  ← changed"] },
      { title: "Merged · r9", icon: "✅", tone: "green", items: ["A", "B2", "C", "D2"] },
    ],
    footer: "hunks that don't overlap both apply; overlapping hunks are a conflict, unless both made the same change",
    beats: B(
      "Here's the merge, like git merge file, on lines. The base is revision seven, the version both devices started from.",
      "The phone changed line two.",
      "The laptop changed line four.",
      { say: "The two changes don't overlap, so both apply. A, B two, C, D two.", tone: "key" },
      "The rule is simple. Changes that don't overlap both apply. Overlapping changes are a conflict, unless both sides made exactly the same change, which is taken once.",
    ),
  },
  {
    kind: "bullets",
    title: "How merge3 works",
    items: [
      { icon: "✂️", text: "Trim the common prefix and suffix first", sub: "a long note with one edit diffs only a few lines" },
      { icon: "🧮", text: "Diff base→ours and base→theirs with an LCS table", sub: "each diff becomes hunks: \"replace base lines [s, e) with these\"" },
      { icon: "🔀", text: "Sort all hunks by position and apply", sub: "overlap, or two inserts at one point = collision" },
      { icon: "🛑", text: "Guard: more than 4 million cells → a conflict", sub: "O(n·m) can't freeze the tab" },
    ],
    beats: B(
      "And how merge three works. First, trim the lines that are the same at the start and at the end of all three versions. A long note with one small edit only diffs a few lines.",
      "Then diff base to ours, and base to theirs, with a longest common subsequence table. Each diff becomes a list of hunks: replace base lines from s to e with these lines.",
      "Sort all the hunks by position, and apply them. Two hunks collide if their base ranges overlap, or both insert at the same point.",
      { say: "And a guard. The table is n times m cells. Above four million cells, it doesn't diff at all, it treats it as a conflict, so a pathological note can't freeze the tab.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "Append-only history, and restore",
    items: [
      { icon: "🧾", text: "Every change is a revision: a full snapshot", sub: "history/{note}/revisions/{time-device}" },
      { icon: "🔒", text: "Rules allow create and read only", sub: "no device and no bug can rewrite history" },
      { icon: "⌨️", text: "Typing is grouped", sub: "a revision after 20 s of pause, at least one every 2 min" },
      { icon: "#️⃣", text: "Fingerprinted with a 53-bit hash (cyrb53)", sub: "an identical version isn't saved twice" },
      { icon: "↩️", text: "Restore writes the old version back as the newest", sub: "git revert, not git reset: nothing after it is lost" },
    ],
    beats: B(
      "Now the history. Every change becomes a revision, a full snapshot of the text and the personal notes, with the time and the device, under the note's own history collection.",
      { say: "Append only, enforced by the rules. A revision may be created and read. Never updated, never deleted. No device and no bug can rewrite history.", tone: "key" },
      "Typing is grouped, so a revision isn't every keystroke. One after twenty seconds of pause, and at least one every two minutes while you keep typing. A highlight or a restore is a revision straight away.",
      "Each revision is fingerprinted with a fast fifty three bit hash, so an identical version isn't stored twice. And the document ID is time dash device, so a retried write lands on the same document, not a duplicate.",
      { say: "And restore writes the old version back as the newest one. It becomes a new revision itself. It's git revert, not git reset. Nothing after it is lost.", tone: "key" },
    ),
  },
  {
    kind: "big",
    tone: "interview",
    lead: "The attack",
    text: "\"Why not real-time collaboration, like Google Docs? Why not CRDTs?\"",
    after: "one person, a few devices, edits in bursts: git's model is enough, explainable, and loses nothing",
    beats: B(
      "And the attack on this bullet.",
      { say: "Why not real time collaboration, like Google Docs? Why not operational transforms, or CRDTs?", tone: "ask" },
      { say: "Your answer. Because the workload is one person on a few devices, editing in bursts, rarely at the same moment. Character level merging would add metadata to every character and a library to own. Git's model is enough, it's explainable to a student in one sentence, and with the history, nothing is ever lost. If two people edited one note live, I'd move to a CRDT like Yjs.", tone: "key" },
    ),
  },
  check({
    topic: "merge and history",
    q: "Base \"A/B/C\". The phone saves \"A/X/C\"; the laptop already saved \"A/Y/C\". What happens to the phone's edit?",
    say: "The base is A, B, C. The phone saves A, X, C. The laptop already saved A, Y, C. What happens to the phone's edit?",
    a: "Both replaced line 2 with different text: a conflict. The laptop's head stays; the phone's version is kept in History as \"not kept\", and a toast tells the user.",
    aSay: "Both sides replaced line two with different text. That's a conflict, and nothing is guessed. The laptop's version stays as the head, the phone's version is saved in the history as not kept, and a toast tells the student, so they can restore it if they want.",
  }),
];
