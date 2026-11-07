import type { Chapter } from "../lib/types.ts";

// Chapter 7 of the AI Stack: ask before acting, interview-ready. The running
// example is a pricing agent whose price changes must wait for a manager.

export const ch07: Chapter = {
  id: "ch07",
  title: "Ask before acting",
  voice: "en-US-AndrewMultilingualNeural",
  next: "Chapter 8 — Is it actually working?",
  scenes: [
    {
      kind: "custom",
      name: "a7hook",
      beats: [
        { say: "A pricing agent has worked out a change. Wireless headphones X two, in six regions, from seventy nine dollars to eighty nine." },
        { say: "Now it must stop before changing anything, show the pricing manager exactly what will change, and continue only with their decision." },
        { say: "And that decision might take minutes, or hours, or arrive after a deploy. How does a program wait that long, safely?", tone: "ask" },
      ],
    },
    {
      kind: "title",
      eyebrow: "AI Stack · Chapter 7",
      title: "Ask before acting",
      subtitle: "human-in-the-loop, done properly",
      beats: [{ say: "Chapter seven. Ask before acting." }],
    },
    {
      kind: "bullets",
      title: "By the end, you can answer",
      firstItemStep: 1,
      items: [
        { icon: "⏸️", text: "How do interrupt and resume work?" },
        { icon: "🔁", text: "Why does code before the pause run twice?" },
        { icon: "🧑‍⚖️", text: "What should need a human, and what should they see?" },
        { icon: "🔒", text: "The data changed while waiting: now what?" },
      ],
      beats: [
        { say: "By the end, you'll be able to answer these." },
        { say: "How interrupt and resume actually work." },
        { say: "Why code before the pause runs twice." },
        { say: "What should need a human, and what they should see." },
        { say: "And what to do when the data changed while the proposal waited." },
      ],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Pausing a run", beats: [{ say: "Chapter six gave us half the answer: a checkpointer that saves the run after every step. The other half is a way to stop on purpose." }] },
    {
      kind: "custom",
      name: "a7pause",
      beats: [
        {
          say: "The agent plans with read only tools, and builds the diff: the exact list of what would change, from what, to what.",
          term: { word: "Human-in-the-loop", meaning: "the agent pauses so a person can decide" },
        },
        {
          say: "Then, inside a step, it calls interrupt, with the diff as the payload. The state and the pending question are saved, and the call returns. A paused run is just rows in a database. No thread, connection, or process waits.",
          term: { word: "interrupt()", meaning: "pause the run and hand a payload to the caller" },
        },
        { say: "When the manager clicks a decision, any server, any time later, invokes the graph on the same thread, with command, resume, and the decision. LangGraph loads the saved state, and carries on." },
        { say: "And if nobody answers in time, the proposal expires, and a cleanup job closes it. All of this needs a durable checkpointer. With an in memory one, a restart silently loses every paused proposal.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "The trap: the step starts over", beats: [{ say: "Now a question that catches almost everyone. When the run resumes, where exactly does execution restart?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a7replay",
      beats: [
        { say: "Here's a step. Build the diff. Insert a proposal row. Then interrupt. The first run pauses at the interrupt, with one row saved." },
        { say: "A Python function can't be frozen halfway and thawed a day later on another server. So on resume, LangGraph runs the whole step again, from line one. This time, interrupt finds the saved answer, and returns it. But the insert ran twice. Two rows for one proposal.", tone: "key" },
        { say: "The fix: give the side effect its own step, stage, which finished in an earlier round and won't re run. And make the insert idempotent anyway, keyed by the proposal id. Then the review step only interrupts." },
      ],
    },
    {
      kind: "trap",
      myth: "The run continues from the interrupt() line.",
      truth: "It continues from the start of the step that paused. Everything before interrupt() in that step runs again.",
      beats: [
        { say: "So the trap, stated plainly: the run continues from the interrupt line." },
        { say: "No. It continues from the start of the step that paused. Everything before interrupt, in that step, runs again.", tone: "key" },
      ],
    },
    {
      kind: "bullets",
      title: "Rules that follow from the mechanism",
      firstItemStep: 1,
      items: [
        { icon: "🔢", text: "Several interrupts in one step are matched by order", sub: "compute the whole batch first, interrupt once" },
        { icon: "🚫", text: "Never wrap interrupt() in a bare try/except", sub: "the pause is a special exception: catching it swallows the pause" },
        { icon: "📦", text: "The payload must be plain data", sub: "it is saved in the database" },
        { icon: "🐞", text: "Breakpoints are different", sub: "interrupt_before pauses every time, with no payload: for debugging" },
      ],
      beats: [
        { say: "The mechanism explains every rule interviewers check." },
        { say: "Several interrupts in one step are matched by order. If a condition changes how many run on resume, answers land on the wrong question. So work out the whole batch first, and interrupt once." },
        { say: "Never wrap interrupt in a bare try except. The pause works by raising a special exception. Catch everything, and the run never pauses." },
        { say: "The payload must be plain data, because it's saved in the database." },
        { say: "And breakpoints are different. Interrupt before pauses before a step every time, with no payload, like a debugger. Real approvals use interrupt inside the step, so they pause only when your code decides, and carry the diff." },
      ],
    },
    {
      kind: "custom",
      name: "a7decisions",
      beats: [
        {
          say: "In LangChain's create agent, the human in the loop middleware pauses before the tools you choose, like update price.",
          term: { word: "HITL middleware", meaning: "pauses chosen tool calls for review" },
        },
        { say: "The reviewer has four choices. Approve: run as proposed. Edit: run with changed arguments. Reject: skip it, and tell the model why. Or respond: send a message back as the tool's result, without running it." },
        { say: "And the trap: don't use respond to refuse a call. The model treats a responded result as success. Use reject, with a reason.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "What needs a human", beats: [{ say: "Version one of the pricing agent asks for approval on everything, including, show me current prices. After a week, the manager approves each request in two seconds, without reading it. What went wrong?", tone: "ask" }] },
    {
      kind: "custom",
      name: "a7matrix",
      beats: [
        { say: "The approval became theatre. Sort actions by damage if wrong, and by how easy they are to undo. Read only actions, like checking prices: automatic." },
        { say: "Small, reversible changes, like a two percent price tweak, or a draft email: automatic, with an audit trail." },
        { say: "Large or hard to undo, like a price change over five percent, or a refund over two hundred dollars: approval." },
        { say: "And some things the agent should never do at all, like deleting a product line." },
        { say: "And the thresholds live in code, not in the prompt. A prompt can be ignored. A check in code can't.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "a7card",
      beats: [
        { say: "Then, what the reviewer sees. Approve action forty two? gets rubber stamped. Unread, in two seconds." },
        { say: "A good review card lets them decide in under a minute. The exact diff: six regions, seventy nine to eighty nine, plus twelve point seven percent. Approve the exact change, never the idea, so the agent can't get details wrong after approval." },
        { say: "Why: the agent's reasoning and the numbers it used. And risk flags: above the usual five percent step, and competitor data that's three days old." },
        { say: "Then measure the loop itself. Approval rate, time to decide, edit rate. And above all, approved changes later reverted. A hundred percent approvals, in three seconds each, means the gate adds nothing.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "Not every touchpoint is an approval",
      cols: [
        { title: "Notify", icon: "🔔", tone: "blue", items: ["“I raised 40 prices by 1%”", "no action needed"] },
        { title: "Question", icon: "❓", tone: "amber", items: ["“which region did you mean?”", "asking beats guessing"] },
        { title: "Review", icon: "✅", tone: "green", items: ["approve, edit, or reject", "for risky actions"] },
      ],
      footer: "check the approver may approve this change · no approving your own large change",
      beats: [
        {
          say: "Not every touchpoint is an approval. LangChain's work on ambient agents, which run in the background, names three patterns. Notify: tell a person what happened, no action needed.",
          term: { word: "Ambient agent", meaning: "runs in the background, reaches out when needed" },
        },
        { say: "Question: ask for missing information. Asking beats guessing." },
        { say: "Review: approve, edit, or reject a risky action." },
        {
          say: "And approval is itself an action. Check the approver may approve this change, and that nobody approves their own large change when policy needs someone else. That's separation of duties.",
          tone: "key",
          term: { word: "Separation of duties", meaning: "the requester can't approve their own change" },
        },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Where the change waits", beats: [{ say: "While the manager thinks, where does the proposed change live?" }] },
    {
      kind: "custom",
      name: "a7overlay",
      beats: [
        {
          say: "Not in the live table, because the store reads it. The base is the real table.",
          term: { word: "Base", meaning: "the live data other systems read" },
        },
        {
          say: "The overlay is a staging area for proposed changes, with an expiry time. Like a shopping cart before checkout: chosen, but not paid for. Nothing in the store changes yet.",
          term: { word: "Overlay", meaning: "staged changes, not yet applied" },
        },
        { say: "Approve, and the overlay is applied to the base in one database transaction: every row changes, or none does." },
        { say: "Edit: the manager's values replace the proposal, then the same commit runs. Reject or expiry: the overlay is deleted, and the reason goes back to the agent. And after committing, read the base back. Report success only if the new prices are really there.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "What goes wrong while it waits", beats: [{ say: "Now the standard follow up questions for any human in the loop design." }] },
    {
      kind: "custom",
      name: "a7cas",
      beats: [
        { say: "The data changed while the manager was deciding. The proposal was built when the US price row was at version seven." },
        { say: "Meanwhile, a colleague set the price to eighty four. The row is now version eight. Applying our diff would silently overwrite their change, with numbers computed from old data." },
        {
          say: "So the commit says: update, only where the version is still seven. Zero rows updated. The commit aborts, and the agent rebuilds its proposal on fresh data. That's optimistic concurrency, also called compare and swap.",
          term: { word: "Optimistic concurrency", meaning: "commit only if the version is unchanged" },
        },
        { say: "Why not lock the row while waiting? That's pessimistic locking, and holding a lock for hours blocks everyone. Optimistic: no lock, and a cheap check at commit time.", tone: "key" },
      ],
    },
    {
      kind: "compare",
      title: "The other follow-ups",
      cols: [
        { title: "Nobody answers", icon: "⏰", tone: "amber", items: ["expiry, 24–72 h", "reminder, then a backup approver", "cleanup tells the requester"] },
        { title: "Two conflicting approvals", icon: "⚔️", tone: "red", items: ["one open proposal per item", "version check at commit", "commit keyed by proposal_id"] },
        { title: "Deploy while paused", icon: "🚀", tone: "blue", items: ["backward-compatible state", "keep step names", "or drain first"] },
        { title: "Who changed this?", icon: "📜", tone: "green", items: ["append-only audit log", "diff, approver, edits, trace id", "versions before and after"] },
      ],
      beats: [
        { say: "The other follow ups. Nobody answers: every proposal gets an expiry, a reminder, and an escalation to a backup approver." },
        { say: "Two people approve conflicting changes: allow one open proposal per item, keep the version check, and key every commit by its proposal id, so a double click applies once." },
        { say: "A deploy lands while two hundred runs are paused: they were saved by the old workflow. Keep state changes backward compatible, keep step names, or drain pending runs first." },
        { say: "And who changed this, and why? Keep an append only audit log: the request, the diff, the approver, any edits, the trace id, and row versions before and after.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "Interview round", beats: [{ say: "Interview round.", tone: "excite" }] },
    {
      kind: "sayit",
      q: "Design human approval for an agent that changes prices.",
      lines: [
        "Risk tiers in code: read-only automatic; small reversible with audit; large changes need approval.",
        "The agent stages an exact diff in an overlay; the run pauses with interrupt() on a durable checkpointer.",
        "The reviewer sees diff, reasoning and risk flags; can approve, edit or reject with a reason.",
        "Resume with Command; side effects in their own idempotent steps, since the paused step re-runs.",
        "Commit in one transaction with a version check; expiry, audit log, and metrics on reverted approvals.",
      ],
      beats: [
        { say: "Design human approval, for an agent that changes prices." },
        { say: "Risk tiers in code. Read only is automatic, small reversible changes are audited, and large changes need approval." },
        { say: "The agent stages an exact diff in an overlay, and the run pauses with interrupt, on a durable checkpointer." },
        { say: "The reviewer sees the diff, the reasoning, and risk flags, and can approve, edit, or reject with a reason." },
        { say: "Resume with a command. Side effects live in their own idempotent steps, because the paused step re-runs." },
        { say: "Commit in one transaction, with a version check. Plus expiry, an audit log, and a metric on reverted approvals.", tone: "key" },
      ],
    },
    {
      kind: "drill",
      items: [
        { q: "Where does a resumed run restart?", a: "At the first line of the step that called interrupt()." },
        { q: "What does a paused run cost while it waits?", a: "Nothing running: it's saved state in the checkpointer's database." },
        { q: "Why not wrap interrupt() in try/except?", a: "The pause is raised as an exception; catching it means the run never pauses." },
        { q: "respond vs reject in HITL middleware?", a: "respond returns a result the model treats as success; reject skips the call with a reason." },
        { q: "Approve the plan or the exact change?", a: "The exact change: whatever is approved is exactly what runs." },
        { q: "How do you stop stale overwrites?", a: "Optimistic concurrency: commit only if the row's version is unchanged." },
        { q: "Best signal the review gate works?", a: "Approved changes later reverted, plus approval rate and time to decide." },
      ],
      beats: [
        { say: "Rapid fire. Where does a resumed run restart?", tone: "ask", hold: 2.5 },
        { say: "At the first line of the step that called interrupt." },
        { say: "What does a paused run cost while it waits?", tone: "ask", hold: 2.5 },
        { say: "Nothing running. It's saved state, in the checkpointer's database." },
        { say: "Why not wrap interrupt in a try except?", tone: "ask", hold: 2.5 },
        { say: "The pause is raised as an exception. Catch it, and the run never pauses." },
        { say: "Respond versus reject, in the human in the loop middleware?", tone: "ask", hold: 2.5 },
        { say: "Respond returns a result the model treats as success. Reject skips the call, with a reason." },
        { say: "Approve the plan, or the exact change?", tone: "ask", hold: 2.5 },
        { say: "The exact change. Whatever is approved is exactly what runs." },
        { say: "How do you stop stale overwrites?", tone: "ask", hold: 2.5 },
        { say: "Optimistic concurrency. Commit only if the row's version is unchanged." },
        { say: "Last one. What's the best signal the review gate works?", tone: "ask", hold: 2.5 },
        { say: "Approved changes that were later reverted. Plus the approval rate, and time to decide.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["⏸️", "interrupt / resume", "a paused run is just saved rows"],
          ["🔁", "The step re-runs", "side effects in their own steps"],
          ["🧑‍⚖️", "Risk tiers", "thresholds in code"],
          ["🃏", "Review card", "exact diff, why, risk flags"],
          ["🛒", "Base + overlay", "stage, then one transaction"],
          ["🔒", "Optimistic concurrency", "commit only if unchanged"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Interrupt pauses a run. Resume continues it. A paused run is just saved rows." },
        { say: "The paused step re-runs from the top, so side effects get their own idempotent steps." },
        { say: "Risk tiers decide what needs a human, with thresholds in code." },
        { say: "The review card shows the exact diff, the reasoning, and the risks." },
        { say: "Changes wait in an overlay, and land in one transaction." },
        { say: "And optimistic concurrency stops stale overwrites.", tone: "key" },
      ],
    },
    {
      kind: "pause",
      question: "The agent has been live for a month. Leadership asks: “Is it actually working?” What would you show them?",
      beats: [
        { say: "The agent has been live for a month. Then leadership asks one simple question." },
        { say: "Is it actually working? What would you show them?", tone: "ask", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Next",
      title: "Chapter 8 — Is it actually working?",
      subtitle: "error analysis, evals and LLM judges",
      beats: [{ say: "That's chapter eight. See you there.", tone: "excite" }],
    },
  ],
};
