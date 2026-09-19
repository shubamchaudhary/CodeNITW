// Interview Kit — everything except DSA for backend SDE-1/SDE-2 loops:
// behavioral, STAR stories, recruiter/HR, design, Java/Spring depth, and the
// resume projects. Owner-only page. DSA practice lives on the DSA page.
//
// Every checkable item has a stable `id`; progress lives in the IK_* stores in
// planStore (cloud-synced).
//
// Bodies use a tiny markup the page renders (see RichText in InterviewKit.jsx):
//   blank line = paragraph · "- " = bullet · "### " = subheading · **bold**
//   "~~~" fences a code block · a [bracket] not glued to a word is a
//   placeholder to replace with your real detail (rendered highlighted).

// ─── How loops work ───────────────────────────────────────────────────────────
export const IK_STAGES = [
  {
    id: "stage-recruiter",
    name: "Recruiter / HR screen",
    length: "15–30 min",
    what: "Checks logistics and fit: experience, why you're looking, notice period, CTC, location, tech stack. Since you resigned before having an offer, expect 'why did you leave?' here every time.",
    focus: "A tight 60-second intro, a calm and consistent resignation answer, a researched salary range, and your 'join immediately' advantage.",
  },
  {
    id: "stage-oa",
    name: "Online assessment",
    length: "60–120 min",
    what: "2–4 coding problems on HackerRank / CodeSignal / HackerEarth, sometimes with MCQs (Java, SQL, OS, CS basics) or a work-style survey. Usually auto-graded on hidden tests.",
    focus: "Pass all hidden tests: check constraints first, handle edge cases, watch for int overflow. Don't lose time polishing — correctness first.",
  },
  {
    id: "stage-dsa",
    name: "DSA / problem-solving rounds",
    length: "45–60 min each, 1–3 rounds",
    what: "Medium–hard problems in a shared editor, often with a follow-up. You're scored on approach, code quality, communication and testing — not only on getting it right.",
    focus: "The coding-round routine below, every time. Practise from the DSA page.",
  },
  {
    id: "stage-mc",
    name: "Machine coding / LLD",
    length: "60–120 min",
    what: "Common at Indian product companies: build a working, extensible in-memory app (Splitwise, parking lot, snake & ladder) in your own IDE, then walk through it. Elsewhere it's a whiteboard LLD: classes, interfaces, patterns.",
    focus: "Working code over complete code; clean separation (models / services / strategies); a demo driver; extensibility you can point to.",
  },
  {
    id: "stage-hld",
    name: "System design (HLD)",
    length: "45–60 min",
    what: "Usually for SDE-2. With 2.5 years you may get it — or a lighter version inside a project deep-dive ('how would this scale?').",
    focus: "Requirements → estimates → API → data model → high-level diagram → deep-dive on 1–2 parts → trade-offs. Use your real systems as examples.",
  },
  {
    id: "stage-hm",
    name: "Hiring manager / behavioral",
    length: "45–60 min",
    what: "Past projects in depth, STAR behavioral questions, how you work in a team, why this company. At some companies every round also includes 1–2 behavioral questions.",
    focus: "STAR stories with numbers, 'I' not 'we', and 2–3 good questions for them.",
  },
  {
    id: "stage-offer",
    name: "HR round → offer → BGV",
    length: "days to weeks",
    what: "Compensation discussion, documents, background verification (employment dates, CTC, education), joining date.",
    focus: "Negotiate on role and market, not on last CTC. Make sure every date and number you've shared matches your documents.",
  },
];

export const IK_COMPANY_NOTES = [
  { name: "Amazon", note: "OA (coding + work-style survey), then 3–4 rounds mixing DSA, LLD/HLD and Leadership Principles; one interviewer is a Bar Raiser. LPs weigh as much as the code — have 2 stories per major LP (Ownership, Customer Obsession, Dive Deep, Bias for Action, Deliver Results, Earn Trust, Have Backbone)." },
  { name: "Microsoft", note: "DSA-heavy rounds with a design element; a final round with a senior manager mixes design and behavioral. Clean code and clear thinking out loud matter." },
  { name: "Indian product companies (Flipkart, Swiggy, Uber, PhonePe, Razorpay, CRED…)", note: "A machine coding round is common, plus DSA, HLD for SDE-2, and a hiring manager round. Project depth and ownership stories carry weight." },
  { name: "Atlassian", note: "Coding and code design, system design, a values round built on their published company values, and a management round. Read their values page and map a story to each." },
  { name: "Banks & fintech (Goldman Sachs, JPMC, Morgan Stanley…)", note: "OA, DSA, strong Java/OOP/concurrency questions, some design, and a fit round. Your Java depth is a real advantage here." },
  { name: "Startups & mid-size", note: "Often a take-home or live build, a deep dive into your projects, and a founder/culture chat. LogLens and the LLM agent are your strongest material." },
];

export const IK_RUBRIC = [
  { name: "Problem solving", note: "Do you clarify, find a working approach, improve it, and reason about trade-offs out loud?" },
  { name: "Code quality", note: "Readable names, small functions, edge cases handled, no copy-paste — code a teammate would approve." },
  { name: "Communication", note: "Narrate your thinking, take hints well, explain complexity. Silence is scored as a gap." },
  { name: "Technical depth & ownership", note: "Can you go 3 levels deep on what you built — why, trade-offs, failure modes, what you'd change?" },
  { name: "Behavior & collaboration", note: "Ownership, handling conflict, learning from failure, caring about users. Evaluated in every round, not just HR." },
];

// The in-round routine. Checkable so you can mark it rehearsed.
export const IK_ROUND_PLAYBOOK = [
  { id: "pb-clarify", title: "Clarify for 2–4 minutes", body: "Restate the problem. Ask about input size, value ranges, negatives, duplicates, empty input, sorted?, return format. Write 1–2 examples, including an edge case." },
  { id: "pb-brute", title: "Say the brute force and its complexity out loud", body: "Even if it's obvious. It proves you understand the problem and gives the interviewer a baseline to hint from." },
  { id: "pb-optimise", title: "Optimise with a named pattern; get buy-in before coding", body: "'The bottleneck is the repeated lookup, so a hash map gets this to O(n) — shall I code that?' Wait for the nod." },
  { id: "pb-code", title: "Code cleanly, even without autocomplete", body: "Meaningful names, helper functions, no clever one-liners. Java: know the Collections API cold — Deque, PriorityQueue with a comparator, TreeMap floor/ceiling, computeIfAbsent, merge." },
  { id: "pb-test", title: "Dry-run by hand, then fix your own bugs", body: "Trace your example line by line with variable values, then the edge cases. Finding your own bug scores well; the interviewer finding it does not." },
  { id: "pb-complexity", title: "State time and space — including the tricky cases", body: "Recursion (branching^depth), amortised (each element pushed/popped once on a monotonic stack), heap operations. Know log₂(10⁹) ≈ 30 and ~10⁸ simple ops per second." },
  { id: "pb-followups", title: "Have answers ready for scale follow-ups", body: "- Doesn't fit in memory → chunk + external sort / merge, or shard by hash\n- Streaming input → online algorithm, heap, reservoir sampling\n- Called millions of times → precompute, cache, better data structure\n- Concurrent callers → locks, ConcurrentHashMap, immutability" },
  { id: "pb-stuck", title: "When stuck: say what you're trying", body: "Try a smaller example, draw it, ask which operation happens most and which data structure makes it cheap. Take hints gracefully and build on them." },
];

// ─── 4-week plan ──────────────────────────────────────────────────────────────
export const IK_PLAN = [
  {
    week: "Week 1",
    theme: "Your story, fixed",
    items: [
      { id: "plan-w1-resign", title: "Write your 'why I resigned' answer and 'what I've done since' answer (HR tab) — say them 10 times" },
      { id: "plan-w1-pitch", title: "Record your 60-second intro; listen back once, tighten it" },
      { id: "plan-w1-star", title: "Fill every [placeholder] in the STAR stories with real detail" },
      { id: "plan-w1-comp", title: "Research salary bands for your level on levels.fyi / AmbitionBox; write your range" },
      { id: "plan-w1-dsa", title: "DSA page: P0 problems, 3–5 a day, timed" },
      { id: "plan-w1-java", title: "Java core + concurrency (Java tab, first groups)" },
    ],
  },
  {
    week: "Week 2",
    theme: "Behavioral depth + LLD",
    items: [
      { id: "plan-w2-behavioral", title: "Answer 15 behavioral questions out loud, 2 minutes each" },
      { id: "plan-w2-mc", title: "Two timed machine-coding builds (90 min each) — Splitwise and parking lot" },
      { id: "plan-w2-dsa", title: "DSA page: P1 problems in trees, graphs, heaps" },
      { id: "plan-w2-spring", title: "Spring / JPA / transactions (Java tab)" },
      { id: "plan-w2-mock", title: "One mock interview (a friend, Pramp or interviewing.io)" },
    ],
  },
  {
    week: "Week 3",
    theme: "Design + projects",
    items: [
      { id: "plan-w3-hld", title: "HLD fundamentals + 3 designs, drawn and explained in 30 minutes each" },
      { id: "plan-w3-own", title: "Whiteboard LogLens, the allocation platform and the LLM agent in 5 minutes each" },
      { id: "plan-w3-loglens", title: "LogLens deep-dive questions (LogLens tab)" },
      { id: "plan-w3-dsa", title: "DSA page: DP, backtracking, design-a-class" },
      { id: "plan-w3-mock", title: "A behavioral mock and a design mock" },
    ],
  },
  {
    week: "Week 4",
    theme: "Simulate and sharpen",
    items: [
      { id: "plan-w4-mixed", title: "Daily: 2 unseen problems in 45-minute timeboxes (topic hidden)" },
      { id: "plan-w4-starred", title: "Redo every ★ problem on the DSA page" },
      { id: "plan-w4-stories", title: "Final pass: each story under 2:30, each with a number" },
      { id: "plan-w4-hr", title: "Rehearse the negotiation lines (HR tab) with a friend playing recruiter" },
      { id: "plan-w4-setup", title: "Interview-day setup: quiet room, stable internet, charger, water, pen and paper" },
    ],
  },
];

// ─── Behavioral ───────────────────────────────────────────────────────────────
// story: which STAR story answers it (S1–S9), "HR" = see the HR tab,
// "Hypothetical" = scenario question, "—" = no single story.
export const IK_BEHAVIORAL_GROUPS = [
  "Intro & motivation",
  "Ownership & impact",
  "Collaboration & conflict",
  "Failure & growth",
  "Ambiguity & decisions",
  "Hiring-manager technical questions",
  "Hypothetical scenarios",
];

export const IK_BEHAVIORAL = [
  // Intro & motivation
  { id: "b-yourself", group: "Intro & motivation", q: "Tell me about yourself.", tip: "The 60-second intro from the HR tab. Present → past highlights → why this role. Don't recite the resume.", story: "HR" },
  { id: "b-resume-walk", group: "Intro & motivation", q: "Walk me through your resume.", tip: "2–3 minutes. One sentence per role, then your two strongest projects with impact numbers. Stop and let them pick what to dig into.", story: "S1 / S4" },
  { id: "b-why-company", group: "Intro & motivation", q: "Why this company? Why this role?", tip: "Three parts: the product/problem (be specific), the engineering (scale, stack, blog posts you've read), and the fit (what you've done that maps to it). Research every company before the call.", story: "—" },
  { id: "b-why-left", group: "Intro & motivation", q: "Why did you leave Blue Yonder? Why did you resign without an offer?", tip: "Same short, honest answer every time — see the HR tab 'Resigned without an offer' section. 20 seconds, then pivot to what you're looking for.", story: "HR" },
  { id: "b-looking-for", group: "Intro & motivation", q: "What are you looking for in your next role?", tip: "Backend / distributed systems ownership, a strong engineering culture, and room to apply GenAI where it helps. Make it match the role you're interviewing for.", story: "—" },
  { id: "b-motivation", group: "Intro & motivation", q: "What motivates you?", tip: "Seeing real users helped by something you built — e.g., planners going from multi-day tickets to minutes. Concrete beats abstract.", story: "S5" },
  { id: "b-5-years", group: "Intro & motivation", q: "Where do you see yourself in 5 years?", tip: "Growing into a senior engineer who owns a significant system end to end and mentors others — at this company. Don't say 'founding a startup' or 'MBA'.", story: "—" },
  { id: "b-hire-you", group: "Intro & motivation", q: "Why should we hire you?", tip: "Three reasons tied to the job description: production Java/Spring microservices at multi-tenant scale, proven ownership with numbers, and GenAI shipped to production. Plus: you can join immediately.", story: "S1 / S5" },

  // Ownership & impact
  { id: "b-proud", group: "Ownership & impact", q: "What project are you most proud of?", tip: "Priority Allocation (100% of allocations, 20% sales lift) or the LLM agent (days → minutes). Pick based on the company: business impact vs innovation.", story: "S1 / S5" },
  { id: "b-hardest-tech", group: "Ownership & impact", q: "What's the biggest technical challenge you've faced?", tip: "Snowflake routing across 1,000+ tenants (lazy init, three modes, flags) or the zero-downtime APIM migration. Explain why it was hard before what you did.", story: "S4 / S3" },
  { id: "b-beyond-scope", group: "Ownership & impact", q: "Tell me about something you did that was outside your job description.", tip: "The quality dashboard across 7 repos, or the Testcontainers framework as an intern.", story: "S7" },
  { id: "b-deep-dive", group: "Ownership & impact", q: "Tell me about a time you dug deep to find the root cause of a problem.", tip: "Pack Service timeouts: what the data showed, how you ruled out other causes, what the real cause was.", story: "S2" },
  { id: "b-tight-deadline", group: "Ownership & impact", q: "Tell me about a time you delivered under a tight deadline.", tip: "How you prioritised, what you cut or deferred, and how you flagged risk early rather than late.", story: "S2 / S3" },
  { id: "b-risk", group: "Ownership & impact", q: "Tell me about a calculated risk you took.", tip: "Shipping a big change safely: feature flags, gradual per-tenant rollout, instant rollback. The risk was calculated because you limited the blast radius.", story: "S4 / S3" },
  { id: "b-simplify", group: "Ownership & impact", q: "Tell me about a time you simplified something complex.", tip: "Gateway-agnostic auth: one abstraction instead of per-gateway logic scattered through sync, async and batch flows.", story: "S3" },
  { id: "b-performance", group: "Ownership & impact", q: "Tell me about a time you improved performance or cost.", tip: "Sharding cut batch runtime 10%; LLM gating cut LLM calls 90% in LogLens. Give the before/after and how you measured.", story: "S4 / S9" },
  { id: "b-customer", group: "Ownership & impact", q: "Tell me about a time you went above and beyond for a customer or user.", tip: "Pack Service fallback — users were seeing failures, you fixed the experience, not just the code. Or ineligible allocations for retailers.", story: "S2 / S6" },
  { id: "b-limited-resources", group: "Ownership & impact", q: "Tell me about a time you delivered with limited time, people or resources.", tip: "Reuse and scope control: e.g., building on existing Postgres/Redis for the agent instead of new infrastructure.", story: "S5" },

  // Collaboration & conflict
  { id: "b-disagree-peer", group: "Collaboration & conflict", q: "Tell me about a time you disagreed with a teammate.", tip: "Disagree with data, listen to their reasoning, find the best answer (maybe theirs), commit once decided. Show what you learned.", story: "S6 / S3" },
  { id: "b-disagree-manager", group: "Collaboration & conflict", q: "Tell me about a time you disagreed with your manager.", tip: "Respectful, private, evidence-based; you proposed an alternative; outcome either way; you committed fully after the decision.", story: "Your own" },
  { id: "b-other-team", group: "Collaboration & conflict", q: "Tell me about a conflict with another team.", tip: "Cross-team API contracts and schema changes for Priority Allocation. Shared goal, versioned contract, compromise.", story: "S1" },
  { id: "b-difficult-person", group: "Collaboration & conflict", q: "Tell me about working with a difficult person.", tip: "Assume good intent, understand their constraints, adapt your communication, focus on the work. Never trash them.", story: "Your own" },
  { id: "b-conflicting-reqs", group: "Collaboration & conflict", q: "Two stakeholders gave you conflicting requirements. What did you do?", tip: "Get them in one conversation, surface the trade-off with data, escalate to whoever owns the priority if needed, write down the decision.", story: "S6 / S1" },
  { id: "b-say-no", group: "Collaboration & conflict", q: "Tell me about a time you pushed back or said no to a request.", tip: "Say no to the approach, not the person: explain the cost, offer an alternative or a phased version.", story: "Your own" },
  { id: "b-lead-no-authority", group: "Collaboration & conflict", q: "Tell me about a time you led without formal authority.", tip: "Driving the APIM migration or cross-team schema changes: aligning people you didn't manage.", story: "S3 / S1" },
  { id: "b-influence", group: "Collaboration & conflict", q: "How did you convince others to adopt your idea?", tip: "Prototype + data + addressing their concerns. Feature flags made saying yes low-risk.", story: "S4" },
  { id: "b-help-teammate", group: "Collaboration & conflict", q: "Tell me about a time you helped a struggling teammate.", tip: "Pair on debugging, share context, unblock — then let them own the result.", story: "Your own" },
  { id: "b-mentor", group: "Collaboration & conflict", q: "Have you mentored anyone? How?", tip: "Onboarding a new joiner or intern to the regression framework / codebase: docs, pairing, reviews. CodeNITW contests also count.", story: "S7" },
  { id: "b-non-tech", group: "Collaboration & conflict", q: "Tell me about explaining something technical to a non-technical person.", tip: "Explaining allocation logic or the agent's approval flow to planners/product: analogy, no jargon, check understanding.", story: "S5 / S1" },

  // Failure & growth
  { id: "b-failure", group: "Failure & growth", q: "Tell me about a time you failed or made a mistake.", tip: "A real mistake, fully owned, how you fixed it, and the permanent change you made. Not a disguised success.", story: "S8" },
  { id: "b-feedback", group: "Failure & growth", q: "Tell me about critical feedback you received. What did you do?", tip: "Specific feedback, no defensiveness, a concrete change, evidence it worked.", story: "Your own" },
  { id: "b-missed-deadline", group: "Failure & growth", q: "Tell me about a time you missed a deadline.", tip: "Why it slipped, when you raised it (early is the point), how you minimised impact, what you now do differently when estimating.", story: "Your own" },
  { id: "b-regret", group: "Failure & growth", q: "What decision would you make differently if you could?", tip: "A technical choice with hindsight (e.g., per-session tables in LogLens vs partitioning). Shows judgement, not weakness.", story: "S9" },
  { id: "b-weakness", group: "Failure & growth", q: "What is your biggest weakness?", tip: "A real one plus the habit you've built to manage it (e.g., going deep before aligning → now writing a one-page doc first). Avoid 'I work too hard'.", story: "—" },
  { id: "b-strengths", group: "Failure & growth", q: "What are your strengths?", tip: "Two, each backed by a result: ownership (Priority Allocation) and learning fast (LangGraph agent in production).", story: "S1 / S5" },
  { id: "b-learn-fast", group: "Failure & growth", q: "Tell me about a time you had to learn something new quickly.", tip: "LangGraph for the inventory agent — how you got productive and what you shipped.", story: "S5" },
  { id: "b-self-learning", group: "Failure & growth", q: "What have you learned on your own recently?", tip: "LogLens: Kafka fan-out, pgvector/HNSW, corrective RAG. Shows curiosity and fills the post-resignation period well.", story: "S9" },

  // Ambiguity & decisions
  { id: "b-ambiguity", group: "Ambiguity & decisions", q: "Tell me about a time you worked with unclear requirements.", tip: "How you created clarity: questions, a thin prototype, writing it down, getting sign-off.", story: "S5 / S4" },
  { id: "b-incomplete-info", group: "Ambiguity & decisions", q: "Tell me about a decision you made without all the information.", tip: "Name what you knew, what you assumed, how you limited the downside (reversible decision, flag), and when you revisited it.", story: "S4" },
  { id: "b-tradeoff", group: "Ambiguity & decisions", q: "Tell me about a hard technical trade-off you made.", tip: "Sync vs async with fallback; lazy vs eager datasource initialisation across 1,000+ tenants.", story: "S2 / S4" },
  { id: "b-data-decision", group: "Ambiguity & decisions", q: "Tell me about a decision you made using data.", tip: "Measuring the 10% timeout failure rate or batch runtime before and after.", story: "S2 / S4" },
  { id: "b-priorities", group: "Ambiguity & decisions", q: "How do you handle competing priorities?", tip: "Impact vs urgency, make trade-offs explicit to stakeholders, agree in writing, protect time for the important-not-urgent.", story: "—" },
  { id: "b-change-direction", group: "Ambiguity & decisions", q: "Tell me about a time requirements changed midway.", tip: "What changed, how you re-planned, what you salvaged, how you communicated the new timeline.", story: "Your own" },
  { id: "b-tech-debt", group: "Ambiguity & decisions", q: "How do you balance tech debt against feature work?", tip: "Tie debt to cost (incidents, slow delivery), fix it alongside related features, reserve a slice of each sprint. Example: the regression automation paid for itself.", story: "S7" },

  // Hiring-manager technical questions
  { id: "b-hm-architecture", group: "Hiring-manager technical questions", q: "Walk me through the architecture of the system you worked on.", tip: "Draw it: allocation services, batch flow, Postgres vs Snowflake, Redis, Kafka/async, gateways. Know the rough numbers (tenants, data volume, runtime).", story: "—" },
  { id: "b-hm-improve", group: "Hiring-manager technical questions", q: "What would you improve in your last project if you had time?", tip: "Two concrete improvements with why — shows you think beyond the ticket.", story: "—" },
  { id: "b-hm-incident", group: "Hiring-manager technical questions", q: "Tell me about a production incident you handled.", tip: "Detect → mitigate first (rollback / flag off) → communicate → root cause → prevent. Blameless.", story: "S2" },
  { id: "b-hm-code-review", group: "Hiring-manager technical questions", q: "How do you approach code reviews — giving and receiving?", tip: "Correctness, readability, tests, edge cases; comment on code not people; separate blocking from nits; review small PRs fast.", story: "—" },
  { id: "b-hm-testing", group: "Hiring-manager technical questions", q: "How do you test your code?", tip: "Unit (JUnit/Mockito), slice tests, integration with Testcontainers on real Postgres, regression gating PRs, 90%+ coverage — and what coverage doesn't catch.", story: "S7" },
  { id: "b-hm-estimate", group: "Hiring-manager technical questions", q: "How do you estimate work?", tip: "Break it into tasks, estimate the unknowns separately, add buffer for integration and review, re-estimate when you learn more — and say so early.", story: "—" },
  { id: "b-hm-new-feature", group: "Hiring-manager technical questions", q: "How do you take a feature from idea to production?", tip: "Clarify the problem and metric → short design doc → review → build behind a flag with tests → staged rollout → monitor → clean up the flag.", story: "S4" },
  { id: "b-hm-uptodate", group: "Hiring-manager technical questions", q: "How do you keep up with technology?", tip: "Engineering blogs, papers/talks, and building things (LogLens). Mention one recent thing you learned and applied.", story: "S9" },

  // Hypothetical scenarios
  { id: "b-hypo-vague", group: "Hypothetical scenarios", q: "You're given a project with a vague goal and a 2-week deadline. What do you do?", tip: "Clarify the success metric and the user; list assumptions; ship a thin slice early for feedback; flag risks on day 1, not day 13.", story: "Hypothetical" },
  { id: "b-hypo-teammate", group: "Hypothetical scenarios", q: "A teammate keeps missing deadlines and it affects your work. What do you do?", tip: "Private, curious conversation first (what's blocking them?), offer help, agree next steps; escalate only if it persists — focus on impact, not blame.", story: "Hypothetical" },
  { id: "b-hypo-security", group: "Hypothetical scenarios", q: "You notice a senior engineer is about to ship something that could leak user data. What do you do?", tip: "Raise it directly and promptly with evidence; escalate if unresolved. Users' trust outweighs hierarchy. Offer to help fix it.", story: "Hypothetical" },
  { id: "b-hypo-pm", group: "Hypothetical scenarios", q: "Your PM wants a feature you think will hurt users. What do you do?", tip: "Understand their goal, bring data or a quick experiment, propose an alternative that meets the goal. Disagree and commit if overruled, but document the risk.", story: "Hypothetical" },
  { id: "b-hypo-cut-corners", group: "Hypothetical scenarios", q: "You're asked to skip tests to hit a deadline. What do you do?", tip: "Make the risk visible, propose a smaller scope that keeps quality, or test the riskiest paths and log the debt with a date. Don't silently comply or silently refuse.", story: "Hypothetical" },
  { id: "b-hypo-bug-after-launch", group: "Hypothetical scenarios", q: "After launch you realise your code has a bug affecting customers, and nobody has noticed. What do you do?", tip: "Tell your lead immediately, mitigate (flag off / hotfix), assess who was affected, then fix the process gap. Ownership over optics.", story: "Hypothetical" },
  { id: "b-hypo-exclusion", group: "Hypothetical scenarios", q: "In meetings, one team member's ideas are regularly talked over. What do you do?", tip: "In the moment: 'I'd like to hear X finish.' Afterwards: check in with them. Structurally: suggest written input or round-robin.", story: "Hypothetical" },
  { id: "b-hypo-prod-down", group: "Hypothetical scenarios", q: "Production breaks while your manager is on leave. What do you do?", tip: "Mitigate first (rollback / flag off), communicate status, pull in the right owners, blameless postmortem after.", story: "S2" },
  { id: "b-hypo-senior-arch", group: "Hypothetical scenarios", q: "You disagree with the architecture a senior engineer chose. What do you do?", tip: "Understand their reasons first, write your concern with data and an alternative, discuss 1:1 before any group setting, accept the decision if overruled.", story: "Hypothetical" },
];

// ─── STAR stories (from the resume) ───────────────────────────────────────────
// Anything in [square brackets] is a placeholder: replace it with the real
// detail. Interviewers dig 2–3 levels deep — invented specifics collapse there.
export const IK_STAR_STORIES = [
  {
    id: "star-priority-allocation",
    code: "S1",
    title: "Priority Allocation — ranking + fair-share splitting",
    competencies: ["Ownership", "Technical depth", "Cross-team collaboration", "Business impact"],
    situation: "At Blue Yonder, allocation decides which stores receive limited inventory. There was no principled way to rank stores when supply was short, and when stores had tied demand the split was [arbitrary / order-dependent], which retailers flagged as unfair.",
    task: "I owned designing and building the priority ranking logic — which stores get inventory first — including a fair-share split for ties, and getting the upstream/downstream teams to agree on the API contracts and schema changes it needed.",
    action: [
      "Broke the problem down with product: which signals define priority ([store grade, demand, sales velocity...]), and what 'fair' means for ties — agreed on proportional-to-need splitting with deterministic rounding so results are reproducible.",
      "Designed the ranking as a sort by a composite key, then a fair-share pass over each tie group: allocate proportional shares, floor them, and hand leftover units out by largest remainder with a stable tie-breaker so reruns give the same answer.",
      "Drove the cross-team contract: wrote the API/schema proposal, reviewed it with [N] consuming teams, versioned the change so nobody broke on deploy.",
      "Covered it with unit tests for edge cases (zero supply, all ties, supply > demand) and regression tests against real customer scenarios before rollout.",
    ],
    result: "It runs in 100% of customer allocations and contributed to a 20% sales lift. [Add: any adoption/latency number, customer feedback, or 'zero regressions after launch'.]",
    followups: [
      "How exactly did the fair-share rounding work? Why largest remainder? (Be ready to CODE it.)",
      "What was the complexity with N stores and M products?",
      "How did you attribute the 20% sales lift to your change?",
      "What was the hardest part of aligning the other teams?",
    ],
  },
  {
    id: "star-pack-service",
    code: "S2",
    title: "Pack Service — sync/async fallback killed a 10% failure rate",
    competencies: ["Customer focus", "Debugging production", "Trade-offs", "Bias for action"],
    situation: "Our integration with the Pack Service was synchronous. Under load, [~10%] of requests timed out, and each timeout failed the whole [allocation / request] for the user.",
    task: "Remove the timeout-driven failures without a risky rewrite and without making the fast path slower for the 90% that worked.",
    action: [
      "Looked at [logs / metrics / traces] to confirm the failures were timeouts under peak load rather than bad data — [what you saw: p99 latency spikes, which payload sizes].",
      "Designed a hybrid: try the sync call with a bounded timeout; on timeout, fall back to an async path (enqueue the work, process in the background, update status when done) instead of failing.",
      "Made the async path safe to retry — idempotency on [request id], so a late sync response plus an async retry can't double-apply.",
      "Put the whole thing behind a feature flag so we could roll out per tenant, compare, and turn it off instantly.",
    ],
    result: "Eliminated the 10% timeout-driven failure rate; the sync path stayed as fast as before. [Add: rollout scope, incidents after launch, time to ship.]",
    followups: [
      "How did you choose the timeout value?",
      "How does the caller learn the async result? Polling, callback, event?",
      "What if the sync call actually succeeded on the server after you timed out? (Idempotency!)",
      "Why not just increase the timeout or add retries? Why not a circuit breaker?",
    ],
  },
  {
    id: "star-dual-apim",
    code: "S3",
    title: "Zero-downtime migration to dual APIM (Azure + Gravitee)",
    competencies: ["Leading without authority", "Risk management", "Ambiguity", "Execution"],
    situation: "The platform had to move its API gateway to Gravitee while Azure APIM kept serving traffic — two identity setups in parallel, and auth flowed through sync APIs, async messages and batch jobs, all of which assumed one gateway.",
    task: "I drove the migration for our services with zero downtime: every call had to authenticate correctly regardless of which gateway it came through, during the whole transition.",
    action: [
      "Mapped every flow that carried identity — sync REST, async/event, batch — and where each one read the token/tenant.",
      "Made auth gateway-agnostic: one abstraction that validates tokens from either issuer and normalises identity into a single internal context.",
      "Unified identity propagation so async and batch jobs carry the same context as sync requests instead of re-deriving it.",
      "Built adaptive OAuth service-to-service tokens: the client picks the right issuer/audience per target and caches tokens until near expiry.",
      "Rolled out gradually with [flags / traffic split], watched auth-failure metrics, kept instant rollback.",
    ],
    result: "Zero-downtime cutover with both gateways live in parallel. [Add: number of services/flows migrated, auth errors during rollout, timeline.]",
    followups: [
      "How did you validate tokens from two issuers? JWKS caching? Key rotation?",
      "How does identity propagate through Kafka / async?",
      "What was your rollback plan? Did you ever use it?",
      "Who did you have to convince, and how?",
    ],
  },
  {
    id: "star-snowflake-routing",
    code: "S4",
    title: "Runtime Snowflake connection routing across 1,000+ tenants",
    competencies: ["Technical design", "Trade-offs", "Performance", "Influence"],
    situation: "The service talked to Snowflake one way, but we now needed three modes — standard, OAuth via B2C, and sharded (tenant → shard via a mapping API) — across 1,000+ tenants. Eagerly creating a datasource per tenant at startup would be slow and waste connections.",
    task: "Design a framework that picks the right connection per tenant at runtime, can be switched safely, and scales to 1,000+ tenants.",
    action: [
      "Built a routing layer (Spring's AbstractRoutingDataSource-style) that resolves the tenant from the request context and chooses mode + target at runtime.",
      "Feature flags control the mode per tenant, so rollout and rollback don't need a deploy.",
      "Lazy datasource initialisation: pools are created on first use and cached (thread-safe computeIfAbsent), so startup doesn't pay for 1,000+ tenants and idle tenants don't hold connections.",
      "For sharded mode, called the tenant-mapping API and cached results with [TTL / invalidation].",
    ],
    result: "Sharding cut batch runtime by 10%, and tenants moved between modes by flipping a flag. [Add: startup time / connection-count improvement if you have it.]",
    followups: [
      "Why lazy over eager? What's the cost on the first request? How did you avoid two threads creating the same pool?",
      "How did you size connection pools per tenant? How many total connections to Snowflake?",
      "What happens if the tenant-mapping API is down?",
      "How did you test three modes × many tenants?",
    ],
  },
  {
    id: "star-llm-agent",
    code: "S5",
    title: "LLM inventory operations agent — days of tickets to minutes",
    competencies: ["Innovation", "Learning fast", "User focus", "Ambiguity"],
    situation: "Planners changed inventory parameters by raising tickets that took multiple days. We set out to let them do it conversationally with an LLM agent, which was new territory for the team.",
    task: "I owned the data-management layer of the LangGraph agent: reading the right data, staging changes safely, and never letting the model write to production unchecked.",
    action: [
      "Built hierarchy-aware PostgreSQL querying so questions at any level ([product/location hierarchy]) resolve to the right rows.",
      "Staged proposed writes in Redis instead of committing them, with scenario-scoped Base + Overlay persistence: the base data is untouched and each scenario's edits live in an overlay until approved.",
      "Added human-in-the-loop approval using LangGraph interrupts: the graph pauses, shows the planner the exact diff, and only commits on approval.",
      "[Add: how you evaluated correctness / guarded against wrong updates.]",
    ],
    result: "Planners update parameters in minutes instead of multi-day ticket cycles, with every write approved by a human. [Add: adoption / number of updates / tickets avoided.]",
    followups: [
      "Why Redis for staging instead of a DB table? What if Redis loses data?",
      "Explain Base + Overlay. How do you merge overlays? Conflicts between scenarios?",
      "How does a LangGraph interrupt work? Where is state kept while waiting for approval?",
      "How do you stop the LLM from generating a destructive update?",
    ],
  },
  {
    id: "star-lifecycle",
    code: "S6",
    title: "Lifecycle-driven allocation — cutting ineligible allocations 30%+",
    competencies: ["Data correctness", "Stakeholder alignment", "Customer impact"],
    situation: "Stores were receiving inventory for products they weren't eligible to sell (outside the product's lifecycle window, or violating multi-product rules), because eligibility wasn't driven by Assortment Planning's lifecycle data.",
    task: "Design and deliver the Assortment Planning integration so lifecycle data became the source of truth for store eligibility.",
    action: [
      "Agreed the contract with the Assortment Planning team: which lifecycle fields, freshness, and who owns what.",
      "Implemented lifecycle-window validation and multi-product rules in the allocation eligibility step.",
      "[Handled missing / late lifecycle data: default behaviour and alerting.]",
      "Validated against historical allocations to measure how many would have been blocked.",
    ],
    result: "Allocations to ineligible stores dropped by 30%+. [Add: units or value saved, customer feedback.]",
    followups: [
      "What did you do when lifecycle data was missing or contradictory?",
      "How did you measure the 30%?",
      "Any disagreement with the other team about source of truth?",
    ],
  },
  {
    id: "star-quality",
    code: "S7",
    title: "Quality automation — batch regression + dashboard across 7 repos; PR-gating Testcontainers framework",
    competencies: ["Initiative beyond scope", "Engineering excellence", "Helping the team"],
    situation: "Batch regressions were checked manually and quality signals were scattered across 7 repositories; as an intern I'd also seen integration bugs reach main because tests ran against mocks, not a real PostgreSQL.",
    task: "Nobody had assigned it — I took it on to make regressions automatic and quality visible.",
    action: [
      "Built a PostgreSQL + Testcontainers regression framework that runs on every PR and gates the merge; added JUnit suites to 90%+ coverage.",
      "Later built GitHub Actions workflows for automated batch regression and a master quality workflow spanning 7 repos.",
      "Aggregated results into a GitHub Pages dashboard so the whole team could see status at a glance.",
      "[Got buy-in by: demoing it / showing a bug it caught.]",
    ],
    result: "Every PR is gated by real-DB regression tests; batch regressions run automatically with one dashboard for 7 repos. [Add: bugs caught, hours saved per release.]",
    followups: [
      "How long do the Testcontainers tests take? How did you keep CI fast?",
      "How did you get people to actually use the dashboard?",
    ],
  },
  {
    id: "star-failure",
    code: "S8",
    title: "Failure / mistake story — fill in a real one",
    competencies: ["Ownership", "Humility", "Learning"],
    situation: "[Pick a real one: a bug you shipped, an estimate you missed, a rollout that surprised you, an assumption about another team's API that was wrong.]",
    task: "[What you were responsible for.]",
    action: [
      "[How you found out, and how fast you owned it publicly.]",
      "[What you did to mitigate immediately — rollback / flag off / hotfix.]",
      "[The root cause, honestly.]",
      "[The permanent change you made: a test, a checklist, a design-review habit.]",
    ],
    result: "[The impact, what you learned, and evidence the fix stuck — 'it hasn't happened again since because...'.]",
    followups: ["What would you do differently?", "How did your team react?"],
  },
  {
    id: "star-loglens",
    code: "S9",
    title: "LogLens — building a log-intelligence RAG pipeline on my own",
    competencies: ["Curiosity & self-learning", "Technical depth", "Cost awareness", "Initiative"],
    situation: "Debugging from huge log archives is slow, and naïvely sending logs to an LLM is expensive, hits context limits and hallucinates. I wanted to learn how to build a GenAI system that is actually trustworthy at scale.",
    task: "Build, on my own, an end-to-end system that ingests GB-scale archives, finds anomalies, and answers questions with citations to exact log lines — cheaply.",
    action: [
      "Designed constant-heap streaming ingest: one pass splits the archive into window-aligned byte ranges, fanned out over Kafka to parallel consumers doing ranged blob reads.",
      "Made processing safe to retry: offsets commit only after durable writes, and fingerprint-keyed idempotent upserts turn at-least-once delivery into exactly-once effects.",
      "Kept the LLM on a leash: deterministic parsers compute every metric; only flagged windows go to the LLM — ~90% fewer calls — and an LLM-as-judge loop checks groundedness.",
      "Query side: corrective RAG over hybrid vector + full-text search, with per-session tables and HNSW/GIN/B-tree indexes to avoid filtered-ANN recall loss.",
    ],
    result: "A working, deployed system (deeploglens.vercel.app) with cited answers and ~90% fewer LLM calls than sending every window. [Add: largest archive tested, ingest time, query latency.]",
    followups: [
      "Why Kafka and not a thread pool?",
      "How is it exactly-once?",
      "What would you change now? (See the LogLens tab.)",
    ],
  },
];

// ─── Recruiter / HR ───────────────────────────────────────────────────────────
export const IK_HR_GROUPS = [
  "Recruiter screen",
  "Resigned without an offer",
  "Compensation & negotiation",
  "HR round classics",
  "Offer, BGV & joining",
  "Questions to ask them",
];

export const IK_HR = [
  // Recruiter screen
  {
    id: "hr-pitch",
    group: "Recruiter screen",
    title: "60-second intro — 'Tell me about yourself'",
    body: "I'm a backend engineer with about 2.5 years at Blue Yonder, working in Java and Spring Boot on a multi-tenant allocation platform. I owned the priority allocation logic that runs in every customer allocation and contributed to a 20% sales lift, built runtime Snowflake routing across 1,000+ tenants that cut batch runtime 10%, and led a zero-downtime API-gateway migration. I also shipped the data layer of a LangGraph agent that lets planners update inventory conversationally, and I built LogLens, a log-intelligence RAG pipeline on Kafka and pgvector, on my own.\n\nI'm from NIT Warangal, where I co-built CodeNITW, our competitive programming platform, and I've solved 1,000+ DSA problems. I'm looking for a backend role where I can own distributed systems end to end — which is why [this company / this team] interests me.\n\n**60–75 seconds, conversational, not memorised word for word. Tailor the last sentence to each company.**",
  },
  {
    id: "hr-current-status",
    group: "Recruiter screen",
    title: "'What's your current status / notice period?'",
    body: "Say it plainly and make it a strength: 'My last working day at Blue Yonder was in August 2026, so I can join immediately.' Many teams value an immediate joiner highly — most employed candidates have 30–90 day notice periods.\n\nOn any form asking for 'current company / current CTC', write the true status: not currently employed, last employer Blue Yonder, last drawn CTC. Consistency with your documents matters more than anything else here.",
  },
  {
    id: "hr-why-looking",
    group: "Recruiter screen",
    title: "'Why are you interested in us?'",
    body: "Two specific reasons about the company (product, scale, engineering blog, stack) + one about fit ('I've built multi-tenant Spring Boot microservices and event-driven pipelines — that maps to what this team does'). Generic praise sounds like you're applying everywhere — which you are, but it shouldn't sound like it.",
  },
  {
    id: "hr-stack-flex",
    group: "Recruiter screen",
    title: "'Are you open to a different stack (Go, Node, Python)?'",
    body: "Yes, confidently: 'My strongest language is Java, but I've shipped Python in production for the LangGraph agent and LogLens. The fundamentals — concurrency, data modelling, distributed systems — carry over, and I pick up languages quickly.'",
  },
  {
    id: "hr-location",
    group: "Recruiter screen",
    title: "Location, relocation, work mode",
    body: "Have one clear answer: preferred cities and 'open to relocating for the right role' if true. Say you're comfortable with hybrid / work-from-office if you are — hesitation here costs points.",
  },
  {
    id: "hr-other-processes",
    group: "Recruiter screen",
    title: "'Are you interviewing elsewhere?'",
    body: "Honest and brief: 'Yes, I'm in process with a few companies at different stages, and this role is one of my top choices.' If you reach final rounds or get an offer elsewhere, tell recruiters — it often speeds things up. Never invent an offer.",
  },
  {
    id: "hr-format",
    group: "Recruiter screen",
    title: "Ask about the process on every first call",
    body: "Number and type of rounds (DSA, machine coding, HLD, HM), coding language allowed (Java), online vs in person, expected timeline between rounds, and the role's level. Ask for a date that gives you time to prepare — recruiters usually accommodate a week or two.",
  },

  // Resigned without an offer
  {
    id: "hr-why-resigned",
    group: "Resigned without an offer",
    title: "'Why did you resign without having an offer?'",
    body: "This is the question that matters most right now. Keep it short (20–30 seconds), true, calm, forward-looking — then stop talking.\n\n### Pick the version that is TRUE for you\n- **Notice period:** 'Blue Yonder has a [60/90]-day notice period, and I found companies I was interested in wanted people sooner. I decided to serve my notice first so I could be an immediate joiner and focus fully on finding the right next role.'\n- **Deliberate focus:** 'I'd done what I set out to do there — owned core allocation features and shipped GenAI to production — and I wanted to choose my next role carefully rather than juggle interviews around a full-time job. I planned for it financially and used the time well.'\n- **Personal reason:** 'I had a personal commitment that needed my time, which is now resolved.' One sentence, no detail — you don't owe more.\n\n### Then pivot\n'Since then I've been [building LogLens further / preparing system design / interviewing], and I'm now looking for [the kind of role].'\n\n### Don't\n- Criticise Blue Yonder, your manager or your team\n- Sound apologetic or defensive — it was a decision, not an accident\n- Over-explain; the more you talk, the more it sounds like a problem\n- Give a different reason to different people at the same company\n\n**Write your final sentence in the notes below and use it word for word every time.**",
  },
  {
    id: "hr-since-leaving",
    group: "Resigned without an offer",
    title: "'What have you been doing since you left?'",
    body: "Show momentum, with specifics:\n\n- 'Extended LogLens — [what you added]'\n- 'Went deeper on system design and did [N] mock interviews'\n- 'Kept my DSA sharp — [N] problems since August'\n- '[Any course, open-source contribution, article]'\n\nEnd with: 'So I'm ready to start contributing from day one.'",
  },
  {
    id: "hr-asked-to-leave",
    group: "Resigned without an offer",
    title: "'Were you asked to leave?' / 'Was it performance?'",
    body: "If true: 'No — it was my decision. I left on good terms, and I received a Pillar Award in 2025 for production impact. I have my relieving and experience letters, and I'm happy to share references.' Calm and factual. The award is strong evidence — use it.",
  },
  {
    id: "hr-short-tenure",
    group: "Resigned without an offer",
    title: "'You were there about 2 years — why leave your first job so soon?'",
    body: "Two years including an internship is a normal first-job tenure. 'I grew a lot there — from intern to owning features used in every customer allocation. I'm looking for [broader ownership / a different scale / product domain] next, and I want my next role to be a long one.'",
  },
  {
    id: "hr-no-offer-yet",
    group: "Resigned without an offer",
    title: "'How long have you been looking? Why no offer yet?'",
    body: "Only the truth: 'I started interviewing actively in [month]. I'm being selective about the role, and I'm in process with a few companies right now.' If the gap grows past 2–3 months, add what you've built and learned in that time — it turns the gap into evidence.",
  },
  {
    id: "hr-will-you-stay",
    group: "Resigned without an offer",
    title: "'Will you just take the first offer? How do we know you'll stay?'",
    body: "'I resigned precisely so I could choose carefully — I'm looking for a place to grow for the next several years. This role fits because [specific reason].' Being deliberate reads as commitment.",
  },
  {
    id: "hr-gap-mindset",
    group: "Resigned without an offer",
    title: "Mindset and paperwork for the gap",
    body: "- Being able to join immediately is an advantage — lead with it, don't apologise for it\n- Keep resume and LinkedIn consistent: 'Software Engineer, Blue Yonder, Jul 2024 – Aug 2026' and 'Available: Immediate joiner'\n- If the gap passes ~3 months, add a line on the resume or LinkedIn for what you're building (LogLens, contributions)\n- Keep your relieving letter, experience letter, last payslips and Form 16 ready — you'll be asked early\n- Track every process on the Job Tracker so you always know what you've told whom",
  },

  // Compensation & negotiation
  {
    id: "hr-current-ctc",
    group: "Compensation & negotiation",
    title: "'What's your current CTC?'",
    body: "'I'm not currently employed. My last drawn CTC at Blue Yonder was [X] — [fixed Y + variable Z].' Give the true breakdown. **Never inflate it** — background checks verify it through payslips, Form 16 and bank statements, and a mismatch can cancel an offer.",
  },
  {
    id: "hr-expected-ctc",
    group: "Compensation & negotiation",
    title: "'What's your expected CTC?'",
    body: "Anchor on the role and the market, not on your last salary.\n\n- 'Based on the scope of this role and market data for engineers with my experience, I'm looking at [range] total compensation, depending on the split between fixed, variable and stock.'\n- Research the band first: levels.fyi, AmbitionBox, Glassdoor, and people you know at the company.\n- Give a range whose bottom is a number you'd genuinely accept.\n- If you're early in the process: 'I'd like to learn more about the role first — I'm sure we can find a number that works if it's the right fit.'",
  },
  {
    id: "hr-hike-cap",
    group: "Compensation & negotiation",
    title: "'We can only offer X% over your last CTC' / 'You're not working, so…'",
    body: "The most common pushback you'll get. Stay polite and firm:\n\n'I understand there's a policy. I'd ask that the offer reflect the role's band and how I did in the interviews rather than my last salary or my employment status — the skills I'd bring are the same either way.'\n\nIf fixed pay is truly capped, ask for other levers: joining bonus, a higher level, stock, or a salary review at 6 months (in writing).",
  },
  {
    id: "hr-breakup",
    group: "Compensation & negotiation",
    title: "Understand the offer breakup before comparing",
    body: "Headline CTC often includes things you won't take home:\n\n- **Fixed** — the number that matters most\n- **Variable / bonus** — what % actually paid out last year?\n- **Stock (RSU/ESOP)** — vesting schedule, cliff, and for startups the realistic value\n- **Joining bonus** — clawback if you leave within a year?\n- Employer PF, gratuity and insurance are often counted inside CTC\n\nCompare offers on fixed + realistic variable + expected stock value.",
  },
  {
    id: "hr-negotiate",
    group: "Compensation & negotiation",
    title: "How to negotiate once an offer comes",
    body: "- Thank them and express enthusiasm first\n- Never accept on the call: 'Could you send the details in writing? I'll get back to you by [day].'\n- Ask for one specific thing with a reason: 'Based on [market data / another process / the scope], could we get the fixed to [X]?'\n- Use real leverage only: another offer, market data, your immediate joining\n- Get every change in the written offer letter",
  },

  // HR round classics
  {
    id: "hr-strengths-weakness",
    group: "HR round classics",
    title: "Strengths and weaknesses",
    body: "Strengths: two, each with a proof point (ownership → Priority Allocation; learning fast → LangGraph agent). Weakness: a real, non-fatal one plus the habit that manages it. See the Behavioral tab for fuller answers.",
  },
  {
    id: "hr-pressure",
    group: "HR round classics",
    title: "'How do you handle pressure or stress?'",
    body: "Break it down, prioritise, communicate early. Give a real example — a production issue or tight deadline — and what you did step by step.",
  },
  {
    id: "hr-on-call",
    group: "HR round classics",
    title: "'Are you okay with on-call, weekend releases or shifts?'",
    body: "Be honest. For most product companies: 'Yes — I've supported production systems and I understand on-call is part of owning a service.' Ask how the rotation works if you want to know.",
  },
  {
    id: "hr-why-hire",
    group: "HR round classics",
    title: "'Why should we hire you?'",
    body: "Three points tied to the job description + 'and I can start immediately'. Keep it under a minute.",
  },
  {
    id: "hr-career-goals",
    group: "HR round classics",
    title: "'What are your long-term goals?'",
    body: "Grow into a senior/staff-level engineer owning a significant system and mentoring others, inside this company. Mention the specific kind of problems you want to be known for.",
  },

  // Offer, BGV & joining
  {
    id: "hr-documents",
    group: "Offer, BGV & joining",
    title: "Documents to keep ready",
    body: "- Blue Yonder offer letter, relieving letter, experience letter\n- Last 3–6 payslips and Form 16\n- Bank statements showing salary credits (sometimes asked)\n- Degree certificate and marksheets (NIT Warangal)\n- ID and address proof, PAN\n- Full-and-final settlement confirmation",
  },
  {
    id: "hr-bgv",
    group: "Offer, BGV & joining",
    title: "Background verification — make sure everything matches",
    body: "BGV checks employment dates, designation, last CTC and education against your documents and your former employer. Every date and number you told any recruiter, and every form you filled, must match exactly. Fix any inconsistency before it's checked, not after.",
  },
  {
    id: "hr-joining",
    group: "Offer, BGV & joining",
    title: "Joining date as leverage",
    body: "You can join within days. Offer it early: it shortens their hiring timeline and is worth something in negotiation ('I can join on [date]'). Don't promise a date you'd have to move.",
  },
  {
    id: "hr-multiple-offers",
    group: "Offer, BGV & joining",
    title: "Multiple offers, deadlines and declining",
    body: "- If an offer has a short deadline and you're waiting on another: ask politely for a few more days, and tell the other company you have an offer with a deadline\n- Decline gracefully and promptly by email — you may apply there again\n- Don't accept an offer you intend to back out of; companies share notes and it can follow you",
  },

  // Questions to ask
  {
    id: "hr-ask-recruiter",
    group: "Questions to ask them",
    title: "To the recruiter",
    body: "- What does the interview process look like, round by round?\n- Is this for a specific team, or team matching after?\n- What level is the role, and how is it decided?\n- What timeline should I expect?\n- Any preparation material you recommend?",
  },
  {
    id: "hr-ask-hm",
    group: "Questions to ask them",
    title: "To the hiring manager / interviewers",
    body: "- What does the team own, and what's the biggest challenge right now?\n- What would a great first 6 months look like in this role?\n- How are technical decisions made on the team?\n- What does on-call look like?\n- What do you enjoy most about working here?",
  },
  {
    id: "hr-ask-hr",
    group: "Questions to ask them",
    title: "To HR at the offer stage",
    body: "- Can you share the full breakup — fixed, variable, stock, benefits?\n- How much of the variable paid out last year?\n- When is the appraisal cycle, and would I be eligible this cycle?\n- Is there a probation period, and what's the notice period?\n- What is the work-from-office policy?",
  },
  {
    id: "hr-followup",
    group: "Questions to ask them",
    title: "After every call",
    body: "Send a short thank-you the same day, confirm next steps and dates in writing, and log them on the Job Tracker and Planning pages.",
  },
];

// ─── System design ────────────────────────────────────────────────────────────
export const IK_DESIGN_GROUPS = ["High-level design", "Low-level design", "Machine coding"];

export const IK_DESIGN = [
  // HLD
  { id: "hld-fundamentals", group: "High-level design", title: "Fundamentals checklist", body: "- Scaling: vertical vs horizontal, stateless services, load balancers\n- Data: SQL vs NoSQL, indexes (B-tree, hash, GIN), replication (leader/follower), sharding (hash vs range, hot keys, resharding)\n- Caching: cache-aside, write-through, TTLs, invalidation, stampede protection\n- Messaging: queues vs logs (Kafka), consumer groups, ordering per partition, at-least-once + idempotency\n- Consistency: CAP / PACELC, strong vs eventual, read-your-writes\n- Reliability: timeouts, retries with backoff + jitter, circuit breakers, bulkheads, idempotency keys\n- Estimation: QPS, storage per day, bandwidth — practise back-of-envelope maths" },
  { id: "hld-framework", group: "High-level design", title: "The 45-minute design framework", body: "- 5 min: functional + non-functional requirements (scale, latency, consistency), what's out of scope\n- 5 min: estimates (users, QPS read/write, storage)\n- 5 min: APIs\n- 5 min: data model and storage choice\n- 10 min: high-level diagram, walk a request through it\n- 10 min: deep-dive on the hardest 1–2 parts (the interviewer often picks)\n- 5 min: bottlenecks, failure modes, trade-offs, what you'd do at 10× scale" },
  { id: "hld-your-systems", group: "High-level design", title: "Whiteboard YOUR systems in 5 minutes each", body: "The most likely design question at your level is 'walk me through something you built'. Practise drawing:\n\n- LogLens end to end (ingest → Kafka fan-out → parsers → pgvector → LangGraph query path)\n- The allocation platform: where priority allocation sits, the batch flow, Snowflake routing\n- The LLM inventory agent: graph nodes, Redis staging, the approval interrupt, the commit path\n\nFor each: the bottleneck, the failure modes, what you'd change at 10× scale." },
  { id: "hld-rate-limiter", group: "High-level design", title: "Design a rate limiter", body: "Token bucket vs sliding window log vs sliding window counter; per-user keys in Redis with Lua for atomicity; distributed consistency trade-offs; where it sits (the gateway — you know APIM)." },
  { id: "hld-url-shortener", group: "High-level design", title: "Design a URL shortener", body: "ID generation (base62 of a counter vs hash + collision handling), read-heavy → cache, DB choice, 301 vs 302 redirects, analytics written asynchronously." },
  { id: "hld-notification", group: "High-level design", title: "Design a notification / job scheduling system", body: "Queue per priority, workers, retries + dead-letter queue, idempotency, scheduling with a delay queue or time-bucketed tables, fan-out to channels (email/SMS/push), user preferences and rate limits." },
  { id: "hld-bookmyshow", group: "High-level design", title: "Design a movie/event ticket booking system", body: "Seat inventory per show, temporary seat holds with TTL (Redis or a DB row with expiry), preventing double booking (row locks / optimistic version / unique constraint), payment timeout → release, idempotent payment callbacks." },
  { id: "hld-chat", group: "High-level design", title: "Design a chat system", body: "WebSocket gateways, a presence service, message store partitioned by conversation, per-conversation ordering (sequence numbers), delivery/read receipts, offline delivery via queue + push, group fan-out." },
  { id: "hld-payment", group: "High-level design", title: "Design a payment / wallet system", body: "Idempotency keys on every write, a double-entry ledger, state machine for payment status, reconciliation with the provider, exactly-once effects via outbox + idempotent consumers, strong consistency where money moves." },
  { id: "hld-ride", group: "High-level design", title: "Design nearby-driver matching (ride hailing)", body: "Driver location updates every few seconds, geohash / quadtree index in memory (Redis GEO), matching service, trip state machine, surge as a separate pricing service." },
  { id: "hld-logs", group: "High-level design", title: "Design a log aggregation + search system", body: "Your home ground: agents → Kafka → processors → storage (hot index + cold object store), retention, partitioning by time + service, full-text index, query path. Compare with your LogLens design choices." },
  { id: "hld-kv", group: "High-level design", title: "Design a distributed cache / key-value store", body: "Consistent hashing, replication factor, quorum reads/writes (R + W > N), eviction (LRU), hot keys, cache-aside vs write-through for the callers." },
  { id: "hld-feed", group: "High-level design", title: "Design a news feed / timeline", body: "Fan-out on write vs on read (and the hybrid for celebrities), feed cache per user, ranking service, pagination by cursor." },

  // LLD
  { id: "lld-principles", group: "Low-level design", title: "OOP + SOLID + patterns, with examples from your own code", body: "- SOLID with one real example each\n- Strategy (routing mode per tenant!), Factory (datasource creation), Builder, Observer / pub-sub, Decorator, Adapter (gateway-agnostic auth!), Template method, Singleton (and why Spring beans make it mostly unnecessary)\n- Composition over inheritance; program to interfaces for testability\n- State pattern for anything with a lifecycle (orders, payments, allocations)" },
  { id: "lld-lru", group: "Low-level design", title: "LRU / LFU cache with thread safety", body: "HashMap + doubly linked list; then make it concurrent: a coarse lock, a ReadWriteLock (careful: LRU reads mutate order!), or striped segments. Mention LinkedHashMap(accessOrder = true) + removeEldestEntry." },
  { id: "lld-rate-limiter", group: "Low-level design", title: "Rate limiter class", body: "Interface RateLimiter { boolean allow(String key); } with TokenBucket and SlidingWindow implementations; ConcurrentHashMap of per-key state; clock injected so it's testable." },
  { id: "lld-parking", group: "Low-level design", title: "Parking lot", body: "Entities (Lot, Floor, Spot types, Vehicle, Ticket), spot assignment strategy, pricing strategy, concurrency on spot allocation." },
  { id: "lld-kv-txn", group: "Low-level design", title: "In-memory key-value store with transactions (BEGIN / ROLLBACK / COMMIT)", body: "A stack of change-logs (or overlay maps) supports nested transactions. This is exactly your Base + Overlay idea from the inventory agent — say so." },
  { id: "lld-scheduler", group: "Low-level design", title: "Task scheduler / job runner", body: "PriorityQueue by next run time, a worker pool (ExecutorService), recurring jobs, cancellation, retries. DelayQueue in Java." },
  { id: "lld-elevator", group: "Low-level design", title: "Elevator system", body: "State per elevator, request queues, scheduling strategy (SCAN/LOOK), extensibility for more elevators or priorities." },
  { id: "lld-logger", group: "Low-level design", title: "Logger / pub-sub event bus", body: "Levels, appenders (console / file / remote), an async appender with a bounded queue and backpressure; topics and subscribers." },

  // Machine coding
  { id: "mc-approach", group: "Machine coding", title: "How to run a 90-minute machine coding round", body: "- 10 min: list requirements, entities and operations; confirm what's in scope\n- Structure: models → repositories (in-memory maps) → services → strategies for anything that may vary → a driver/main that runs a demo\n- Get a thin end-to-end flow working first, then add features; keep it runnable at every step\n- Validate inputs and throw meaningful exceptions\n- Leave 10 minutes to run the demo and explain the extension points\n- Don't: over-engineer, leave it uncompilable, spend 30 minutes on one class" },
  { id: "mc-splitwise", group: "Machine coding", title: "Splitwise (expense sharing)", body: "Users, groups, expenses with EQUAL / EXACT / PERCENT splits (strategy per split type), balance sheet per pair, 'show balances', and simplify debts (net balances → greedy settle between max creditor and max debtor)." },
  { id: "mc-snake-ladder", group: "Machine coding", title: "Snake & ladder", body: "Board with jumps, players queue, dice strategy (normal / crooked / multiple dice), win condition, configurable input." },
  { id: "mc-booking", group: "Machine coding", title: "Movie ticket booking", body: "Cinemas, screens, shows, seats; search shows; hold seats with expiry; book; concurrency on the same seat (synchronized per show or ConcurrentHashMap.putIfAbsent)." },
  { id: "mc-cache", group: "Machine coding", title: "Cache with pluggable eviction", body: "Cache<K,V> backed by storage + an EvictionPolicy interface (LRU, LFU, FIFO); capacity; thread-safe get/put; add TTL as an extension." },
  { id: "mc-cab", group: "Machine coding", title: "Cab booking", body: "Riders, drivers with location and availability, find nearest available driver within a radius (strategy), trip lifecycle state machine, fare strategy." },
  { id: "mc-orders", group: "Machine coding", title: "Food delivery / order management", body: "Restaurants and menus, cart, order state machine (placed → accepted → preparing → picked → delivered / cancelled), assign delivery partner by strategy, rating." },
  { id: "mc-library", group: "Machine coding", title: "Library management", body: "Books vs copies, members, borrow/return with limits and due dates, fines, search by title/author; a good warm-up for timing yourself." },
];

// ─── Java, Spring & backend depth ─────────────────────────────────────────────
export const IK_JAVA = [
  { id: "java-hashmap", group: "Core Java", q: "How does HashMap work internally? What changed in Java 8?", a: "Array of buckets; index = (hash ^ hash>>>16) & (n−1). Collisions chain in a linked list; since Java 8 a bucket with ≥ 8 entries (and table ≥ 64) becomes a red-black tree → worst case O(log n) instead of O(n). Resizes at size > capacity × 0.75, doubling and splitting buckets (each entry stays or moves by +oldCap). Not thread-safe: concurrent puts can lose updates." },
  { id: "java-equals", group: "Core Java", q: "equals/hashCode contract — what breaks if you violate it?", a: "Equal objects must have equal hash codes. If not, HashMap/HashSet put them in different buckets and 'contains' fails. Mutating a field used in hashCode after insertion 'loses' the key. Records generate both correctly." },
  { id: "java-chm", group: "Core Java", q: "ConcurrentHashMap vs Collections.synchronizedMap vs Hashtable", a: "synchronizedMap/Hashtable lock the whole map. CHM (Java 8+) uses CAS for empty bins and synchronises on the individual bin head for updates; reads are lock-free (volatile). Use compute/computeIfAbsent/merge for atomic read-modify-write — get-then-put is still a race. Iterators are weakly consistent, no ConcurrentModificationException. No null keys/values." },
  { id: "java-immutability", group: "Core Java", q: "Why is String immutable? How do you make a class immutable?", a: "String: safe sharing in the string pool, cacheable hashCode, security (paths, class names), thread safety. Immutable class: final class, private final fields, no setters, defensive copies of mutable inputs/outputs. Or just use a record (shallowly immutable)." },
  { id: "java-17", group: "Core Java", q: "Java 17 features you've used", a: "Records (DTOs, value objects), sealed classes/interfaces (closed hierarchies, exhaustive switches), pattern matching for instanceof, switch expressions, text blocks, helpful NullPointerExceptions. Java 21 adds virtual threads, record patterns and pattern matching for switch." },
  { id: "java-streams", group: "Core Java", q: "Streams: lazy evaluation, intermediate vs terminal, when NOT to use parallel streams", a: "Intermediate ops (map/filter) are lazy and fused; nothing runs until a terminal op (collect/reduce/forEach). Parallel streams use the common ForkJoinPool — bad for blocking I/O, small datasets, or ordered/stateful ops; fine for CPU-heavy work on large, splittable data." },
  { id: "java-exceptions", group: "Core Java", q: "Checked vs unchecked exceptions; try-with-resources", a: "Checked must be declared/handled (recoverable conditions); unchecked (RuntimeException) are programming errors. Spring's @Transactional rolls back only on unchecked by default. try-with-resources closes AutoCloseable in reverse order and keeps suppressed exceptions." },
  { id: "java-collections-choice", group: "Core Java", q: "ArrayList vs LinkedList, HashMap vs TreeMap vs LinkedHashMap — when to use which?", a: "ArrayList almost always (cache-friendly, O(1) random access); LinkedList rarely wins even for inserts. HashMap for O(1) lookups, TreeMap when you need ordering or floor/ceiling queries (O(log n)), LinkedHashMap for insertion/access order (LRU). ArrayDeque over Stack and LinkedList for stacks/queues." },
  { id: "java-jvm-memory", group: "JVM", q: "JVM memory areas and what goes where", a: "Heap (objects; young gen = Eden + survivors, old gen), per-thread stacks (frames, local primitives, references), Metaspace (class metadata, native memory since Java 8), code cache, direct buffers. StackOverflowError = deep recursion; OutOfMemoryError: Java heap space vs Metaspace vs 'unable to create native thread' point to different fixes." },
  { id: "java-gc", group: "JVM", q: "How does G1 work? When would you choose ZGC?", a: "G1 (default): heap split into regions, concurrent marking, evacuates regions with the most garbage first to meet a pause target (MaxGCPauseMillis). ZGC/Shenandoah: mostly concurrent, sub-millisecond pauses even with huge heaps — for latency-sensitive services. Diagnose with GC logs, heap dumps, jstat/JFR." },
  { id: "java-memory-leak", group: "JVM", q: "How would you debug a memory leak in a Spring Boot service?", a: "Watch heap after GC trending up (metrics/GC logs), take heap dumps at two points (jcmd GC.heap_dump), compare in Eclipse MAT for dominator trees / growing collections. Usual suspects: unbounded caches/maps, ThreadLocals not cleared in pools, listeners never removed, large sessions." },
  { id: "java-jmm", group: "Concurrency", q: "volatile, synchronized and the happens-before relationship", a: "volatile gives visibility + ordering (a write happens-before subsequent reads) but not atomicity — count++ is still a race. synchronized gives mutual exclusion AND visibility on lock release/acquire. Use AtomicInteger/LongAdder for counters. Double-checked locking needs a volatile field." },
  { id: "java-locks", group: "Concurrency", q: "synchronized vs ReentrantLock vs ReadWriteLock vs StampedLock", a: "ReentrantLock adds tryLock with timeout, interruptible waits, fairness, multiple Conditions. ReadWriteLock for read-heavy data. StampedLock adds optimistic reads (not reentrant). Prefer synchronized for simple cases; with virtual threads on older JDKs, prefer ReentrantLock to avoid pinning." },
  { id: "java-executors", group: "Concurrency", q: "ExecutorService: pool types, sizing, and what happens when the queue is full", a: "ThreadPoolExecutor(core, max, keepAlive, queue, rejectionHandler). Threads grow past core only when the queue is full — an unbounded queue means max is never reached. CPU-bound: ~#cores; I/O-bound: more (cores × (1 + wait/compute)). Rejection policies: Abort, CallerRuns (natural backpressure), Discard, DiscardOldest. Always shut down pools." },
  { id: "java-cf", group: "Concurrency", q: "CompletableFuture — composing async calls, timeouts, error handling", a: "supplyAsync(task, executor) (don't rely on the common pool for I/O), thenApply/thenCompose (flatMap)/thenCombine, allOf for fan-out, exceptionally/handle for recovery, orTimeout/completeOnTimeout (Java 9+). This is how you'd implement the Pack Service 'sync with timeout, else async' pattern." },
  { id: "java-deadlock", group: "Concurrency", q: "Deadlock: conditions, detection, prevention", a: "Mutual exclusion, hold-and-wait, no preemption, circular wait. Prevent with global lock ordering, tryLock with timeout, smaller critical sections. Detect with a thread dump (jstack) — it reports found deadlocks." },
  { id: "java-threadlocal", group: "Concurrency", q: "ThreadLocal — uses and pitfalls (you used tenant context!)", a: "Per-thread values: tenant id, security context, request id. Pitfalls: leaks in thread pools if not removed (always clear in finally / a filter), and context is NOT inherited by async tasks — you must propagate it explicitly (TaskDecorator for @Async, MDC copying). Directly relevant to your identity propagation across sync/async/batch." },
  { id: "java-virtual", group: "Concurrency", q: "Virtual threads (Java 21) — when do they help?", a: "Cheap threads scheduled by the JVM on carrier threads; great for many blocking I/O calls (thread-per-request without pool exhaustion). No help for CPU-bound work. Watch for pinning (synchronized blocks on older JDKs, native calls) and ThreadLocal-heavy code." },
  { id: "java-producer-consumer", group: "Concurrency", q: "Write a producer–consumer (and a thread-safe singleton) on paper", a: "BlockingQueue (ArrayBlockingQueue with capacity) — put() blocks when full, take() when empty; or wait/notifyAll inside synchronized with a while-loop condition check. Singleton: enum singleton, or holder-class idiom (lazy, thread-safe, no locking). Both are common in bank/fintech rounds." },
  { id: "spring-di", group: "Spring", q: "IoC / DI — constructor vs field injection; bean scopes", a: "The container creates and wires beans. Prefer constructor injection: immutable, explicit dependencies, easy tests, fails fast on cycles. Scopes: singleton (default — must be thread-safe, no request state in fields), prototype, request, session. Injecting a prototype into a singleton gives one instance unless you use ObjectProvider / lookup." },
  { id: "spring-lifecycle", group: "Spring", q: "Bean lifecycle and how auto-configuration works", a: "Instantiate → inject → Aware callbacks → BeanPostProcessor before → @PostConstruct / afterPropertiesSet → BPP after (proxies created here) → ready → @PreDestroy. Auto-config: @SpringBootApplication → @EnableAutoConfiguration loads AutoConfiguration.imports; each class is guarded by @ConditionalOnClass / @ConditionalOnMissingBean / @ConditionalOnProperty, so your own bean wins." },
  { id: "spring-proxy", group: "Spring", q: "Why doesn't @Transactional (or @Async/@Cacheable) work when called from the same class?", a: "They're implemented with proxies (JDK dynamic or CGLIB). A self-call (this.method()) bypasses the proxy, so no advice runs. Fixes: move the method to another bean, inject self, or use AspectJ weaving. Also: only public methods are proxied by default." },
  { id: "spring-tx", group: "Spring", q: "@Transactional propagation and isolation — REQUIRED vs REQUIRES_NEW with a use case", a: "REQUIRED joins the existing transaction (default). REQUIRES_NEW suspends it and starts a fresh one — e.g., write an audit/failure record that must persist even if the outer transaction rolls back. NESTED uses savepoints. Isolation: READ_COMMITTED (Postgres default) prevents dirty reads; REPEATABLE_READ/SERIALIZABLE for stronger guarantees. Rollback by default only on RuntimeException/Error." },
  { id: "spring-errors", group: "Spring", q: "Global exception handling and validation in Spring Boot", a: "@RestControllerAdvice with @ExceptionHandler methods mapping exceptions to status codes and a consistent error body (ProblemDetail in Spring 6). Bean Validation (@Valid, @NotNull, custom validators) on request DTOs; MethodArgumentNotValidException → 400 with field errors." },
  { id: "jpa-n1", group: "JPA / Hibernate", q: "The N+1 problem — how to detect and fix it", a: "Loading N parents then lazily loading each child collection = 1 + N queries. Detect with SQL logging / Hibernate statistics. Fix: JOIN FETCH, @EntityGraph, batch fetching (@BatchSize / default_batch_fetch_size), or DTO projections. Avoid EAGER on collections." },
  { id: "jpa-lazy", group: "JPA / Hibernate", q: "LazyInitializationException and open-session-in-view", a: "Touching a lazy association after the persistence context closed. Fix by fetching what you need inside the transaction (fetch join / DTO). Spring Boot enables open-in-view by default (with a warning) — it hides the problem and holds DB connections for the whole request; disable it in services." },
  { id: "jpa-context", group: "JPA / Hibernate", q: "Persistence context: first-level cache, dirty checking, flush", a: "Within a transaction, each entity is loaded once (identity map). Managed entities are dirty-checked at flush — changing a field issues an UPDATE without save(). Flush happens before commit and before queries that may be affected. For bulk work, batch inserts (hibernate.jdbc.batch_size) and clear() periodically to avoid memory blowup." },
  { id: "jpa-locking", group: "JPA / Hibernate", q: "Optimistic vs pessimistic locking", a: "Optimistic: @Version column, UPDATE ... WHERE version = ?; 0 rows → OptimisticLockException → retry. Good for low contention. Pessimistic: SELECT ... FOR UPDATE (PESSIMISTIC_WRITE) holds row locks — for high-contention updates like decrementing inventory; mind lock ordering and timeouts." },
  { id: "db-indexes", group: "Databases & SQL", q: "How do indexes work? When is an index NOT used?", a: "B-tree indexes give O(log n) lookups and ordered range scans. Composite index (a, b) serves a, or a + b, but not b alone (leftmost prefix). Covering index avoids the table lookup. Not used when: a function wraps the column, low selectivity, leading wildcard LIKE '%x', type mismatch, or the planner thinks a scan is cheaper. Check with EXPLAIN ANALYZE. Cost: slower writes and more storage." },
  { id: "db-isolation", group: "Databases & SQL", q: "Isolation levels and the anomalies they prevent", a: "Dirty read (READ UNCOMMITTED allows), non-repeatable read (READ COMMITTED allows), phantom read (REPEATABLE READ allows in the standard; Postgres's snapshot prevents it), write skew (only SERIALIZABLE prevents). Postgres uses MVCC: readers don't block writers." },
  { id: "db-sql", group: "Databases & SQL", q: "SQL you should be able to write on paper", a: "- Second / Nth highest salary (DENSE_RANK or LIMIT/OFFSET)\n- Employees earning more than their manager (self-join)\n- Top N per group (ROW_NUMBER() OVER (PARTITION BY … ORDER BY …))\n- Duplicate rows (GROUP BY … HAVING COUNT(*) > 1)\n- Running totals (SUM() OVER (ORDER BY …))\n- LEFT JOIN … WHERE right.id IS NULL for 'rows with no match'" },
  { id: "db-sql-vs-nosql", group: "Databases & SQL", q: "SQL vs NoSQL — how do you choose? Why Postgres AND Snowflake at Blue Yonder?", a: "SQL: relations, transactions, flexible queries. NoSQL: scale-out for simple access patterns (key-value, document, wide-column), flexible schema. Postgres for transactional low-latency reads/writes (config, parameters, staged approvals); Snowflake for large analytical scans over historical data used by batch allocation — different workloads, different engines." },
  { id: "ms-api-design", group: "Microservices & APIs", q: "REST API design: idempotency, status codes, pagination, versioning", a: "GET/PUT/DELETE are idempotent, POST is not — add an Idempotency-Key header for creates/payments. Status codes: 201 created, 204 no content, 400 validation, 401 vs 403, 404, 409 conflict, 422, 429 rate limited, 503. Cursor pagination beats offset at scale. Version in the URL (/v2) or a header; never break existing clients." },
  { id: "ms-saga", group: "Microservices & APIs", q: "Distributed transactions: 2PC vs saga; the transactional outbox", a: "2PC locks across services and blocks on coordinator failure — rarely used. Saga: a sequence of local transactions with compensating actions, via choreography (events) or orchestration (a coordinator). Outbox: write the business change and the event in the same DB transaction, a relay publishes the event — no lost or phantom events. Consumers must be idempotent." },
  { id: "ms-patterns", group: "Microservices & APIs", q: "API gateway, service discovery, distributed tracing — and when NOT to use microservices", a: "Gateway: auth, rate limiting, routing (your APIM work). Discovery: Kubernetes services / Eureka. Tracing: propagate a trace id (OpenTelemetry) across sync and async hops. Don't split into microservices for a small team or unclear domain boundaries — a modular monolith is often better." },
  { id: "spring-kafka", group: "Messaging & caching", q: "Kafka: partitions, consumer groups, offsets, delivery guarantees", a: "Order is guaranteed only within a partition; parallelism = partitions per consumer group. Committing offsets after processing = at-least-once; before = at-most-once. Exactly-once effects in practice = at-least-once + idempotent consumers (dedupe keys / upserts) — which is exactly what LogLens does. Rebalances can re-deliver; handle poison messages with retries + a dead-letter topic." },
  { id: "spring-redis", group: "Messaging & caching", q: "Redis: caching patterns and pitfalls", a: "Cache-aside with TTLs; invalidate on write. Stampede protection (locks / early refresh / jitter on TTLs). Persistence (RDB/AOF) is not a durable database — for your staged writes, discuss what happens on eviction/restart and why that was acceptable (proposals can be regenerated; approval commits to Postgres)." },
  { id: "devops-k8s", group: "Docker & Kubernetes", q: "Docker and Kubernetes basics you should be able to explain", a: "Image layers and caching (order the Dockerfile so dependencies come before code), multi-stage builds. Kubernetes: pods, deployments (rolling updates), services, ConfigMaps/Secrets, liveness vs readiness probes (readiness gates traffic; liveness restarts), resource requests/limits, HPA scaling on CPU/custom metrics. For Java: set container-aware heap (MaxRAMPercentage)." },
  { id: "spring-testing", group: "Testing", q: "Unit vs integration testing in Spring; why Testcontainers?", a: "Unit: Mockito, no Spring context, fast. Slice tests: @WebMvcTest, @DataJpaTest. Integration: @SpringBootTest + Testcontainers for a real PostgreSQL — catches dialect/SQL/migration bugs that H2 or mocks hide. Reuse containers across tests for speed." },
  { id: "spring-routing-ds", group: "Your experience", q: "How would you implement per-tenant datasource routing in Spring? (Your Snowflake work)", a: "Extend AbstractRoutingDataSource: determineCurrentLookupKey() reads the tenant from a ThreadLocal context set by a filter/interceptor. For 1,000+ tenants, override determineTargetDataSource() to resolve lazily from a ConcurrentHashMap<String, DataSource> with computeIfAbsent, creating a Hikari pool on first use; evict idle pools. Mode (standard/OAuth/sharded) chosen via a strategy per tenant from feature flags. Clear the context in finally, propagate it into async/batch threads." },
  { id: "spring-hikari", group: "Your experience", q: "Connection pool sizing (HikariCP) — how many connections?", a: "Small pools usually win: roughly cores × 2 + effective spindles as a starting point, then measure. Per-tenant pools multiply quickly — 1,000 tenants × 10 = 10,000 connections — hence lazy creation, small minimumIdle, idleTimeout, and a cap on total pools. Watch connectionTimeout and pool-wait metrics." },
  { id: "spring-resilience", group: "Your experience", q: "Timeouts, retries, circuit breakers — how would you harden a downstream call? (Pack Service)", a: "Always set connect + read timeouts. Retry only idempotent operations, with exponential backoff + jitter and a cap. Circuit breaker (Resilience4j) to stop hammering a failing service and fail fast / fall back. Bulkhead to isolate thread pools. Your design adds a smarter fallback: time out the sync path and continue asynchronously, with idempotency keys so a late success and the async retry can't double-apply." },
  { id: "spring-security", group: "Your experience", q: "OAuth 2.0 client credentials for service-to-service auth — how does it work? (APIM work)", a: "The service authenticates to the token endpoint with its client id/secret (or certificate), gets a short-lived access token (JWT) for a specific audience/scope, and sends it as a Bearer token. The resource server validates signature via the issuer's JWKS (cached, rotated), expiry, issuer and audience. Cache the token until near expiry. With two gateways/issuers, trust both issuers and normalise claims into one internal principal." },
];

// ─── LogLens depth ────────────────────────────────────────────────────────────
// Suggested answers are built from what the resume states; make sure every
// detail matches what you actually built before you say it out loud.
export const IK_LOGLENS = [
  { id: "ll-pitch", q: "Explain LogLens in 90 seconds.", a: "LogLens turns GB-scale log archives into answers. Ingest streams an archive in one pass, splits it into window-aligned byte ranges, and fans those out over Kafka to parallel consumers that read their range directly from blob storage — so memory stays constant regardless of file size. Deterministic parsers compute all the metrics and flag anomalous windows; only those go to the LLM, which cut LLM calls by ~90%. An ingest-time LangGraph graph writes incident narratives and checks them with an LLM-as-judge groundedness loop. At query time a corrective-RAG graph retrieves over hybrid vector + full-text search in Postgres/pgvector and answers with citations to exact log lines." },
  { id: "ll-why", q: "Why did you build it? What problem does it solve?", a: "Grepping huge log archives during an incident is slow, and pasting logs into an LLM is expensive, hits context limits and hallucinates. The design principle: let code compute facts, let the LLM only explain flagged windows, and force every claim to cite a log line." },
  { id: "ll-streaming", q: "How is ingest constant-heap at any file size?", a: "Never load the file. One sequential pass finds split points; each chunk is (offset, length), and consumers do ranged reads (HTTP Range on the blob) and stream-parse line by line. Memory is bounded by the buffer size × consumers, not the file size." },
  { id: "ll-split", q: "How do you split a byte range without cutting a log line — or a time window — in half?", a: "Pick a tentative offset, then advance to the next newline so every range starts at a line start. 'Window-aligned' means ranges end at time-window boundaries, so each window's metrics are computed by exactly one consumer and no cross-chunk merge is needed. Edge cases: multi-line entries (stack traces) — continuation lines belong to the previous entry." },
  { id: "ll-kafka", q: "Why Kafka rather than a thread pool?", a: "Durability (a crash doesn't lose the work plan), horizontal scaling (add consumers up to the partition count), retries and replay from offsets, and decoupling ingest planning from processing. Trade-off: operational complexity; a thread pool would do for a single machine." },
  { id: "ll-exactly-once", q: "Walk me through 'offsets commit only after durable writes' and 'at-least-once → exactly-once effects'.", a: "A consumer processes a range, writes results to Postgres, and only then commits the offset. A crash before the commit means the message is redelivered and reprocessed — at-least-once. Every row gets a fingerprint key (deterministic from e.g. source + byte offset/line + content hash), and writes are INSERT ... ON CONFLICT (fingerprint) DO UPDATE/NOTHING, so reprocessing produces the same rows — the effect is exactly-once without Kafka transactions." },
  { id: "ll-anomaly", q: "How do deterministic parsers decide which windows are anomalous?", a: "Parse lines into structured fields (timestamp, level, service, message template), aggregate per time window (error rate, volume, latency, new/rare templates), and flag windows that deviate from the baseline — e.g., z-score/threshold on error rate or never-seen templates. [Confirm your exact rules.] Everything is computed by code, so numbers in narratives are facts, not generations." },
  { id: "ll-90", q: "How did you measure '90% fewer LLM calls'?", a: "Baseline = one call per window (or per chunk) if you sent everything; actual = calls only for flagged windows. Ratio across your test archives. Be ready to say which archives and sizes." },
  { id: "ll-judge", q: "What is the LLM-as-judge groundedness loop?", a: "After the narrative is generated, a second LLM call checks every claim against the cited evidence. If something is unsupported, the graph loops back to regenerate with feedback, with a max retry count to bound cost; if it still fails, it's marked low-confidence instead of shipped silently." },
  { id: "ll-crag", q: "Explain corrective RAG: retrieve → grade → rewrite → re-retrieve.", a: "Retrieve candidate chunks, have the LLM grade relevance; if too few are relevant, rewrite the query (expand terms, add service names/time range) and retrieve again, bounded by a max number of iterations. Only graded-relevant chunks go into the answer, reducing hallucination from weak context." },
  { id: "ll-hybrid", q: "Why hybrid vector + full-text search? How do you merge results?", a: "Logs are full of exact tokens — error codes, request IDs, class names — that embeddings blur; full-text (Postgres tsvector + GIN) nails those, while vectors catch paraphrased questions. Merge with Reciprocal Rank Fusion (score = Σ 1/(k + rank)) which needs no score normalisation. [Confirm which fusion you used.]" },
  { id: "ll-hnsw", q: "HNSW vs IVFFlat in pgvector; what are m, ef_construction, ef_search?", a: "HNSW: a layered proximity graph — better recall/speed trade-off, no training step, more memory and slower builds. IVFFlat: k-means lists, needs data to train, recall depends on probes. m = neighbours per node (memory/recall), ef_construction = build-time search width (quality), ef_search = query-time width (recall vs latency)." },
  { id: "ll-per-session", q: "Why per-session chunk tables? What is 'post-filtered ANN recall loss'?", a: "With one shared table, 'nearest neighbours WHERE session = X' makes the ANN index find the top-k globally and THEN filter — if most neighbours belong to other sessions, you get fewer than k results or worse ones. A table (and HNSW index) per session means the index only contains that session's rows, so the ANN search is already scoped. Trade-offs: many tables/indexes to manage and clean up; alternatives are partitioning, pgvector's iterative index scans (0.8+), or a vector DB with native pre-filtering." },
  { id: "ll-indexes", q: "Why HNSW + GIN + B-tree on the same table?", a: "HNSW for semantic similarity, GIN on tsvector for keyword search, B-tree on timestamp (and maybe level/service) for time-range filters and ordering citations. Each query path hits the index built for it." },
  { id: "ll-citations", q: "How do citations point to exact log lines?", a: "Every chunk keeps its source coordinates (file, byte offset / line range). The prompt requires answers to reference chunk ids; the response is post-processed to map ids back to line numbers, and uncited claims are rejected/flagged." },
  { id: "ll-java-python", q: "The stack is Java/Spring Boot + Python/LangGraph — how do they talk, and why split?", a: "Java/Spring handles the heavy, concurrent, durable pipeline (Kafka consumers, parsing, Postgres writes); Python owns the LLM orchestration where LangGraph/LangChain live. They communicate over [HTTP API / Kafka topics — confirm]. Trade-off: two runtimes to deploy vs using the best ecosystem for each job." },
  { id: "ll-langgraph", q: "Why LangGraph instead of a simple chain?", a: "The flows have loops (judge → regenerate, grade → rewrite → re-retrieve), conditional edges and explicit state; LangGraph models that as a state machine with bounded cycles, checkpoints and interrupts. A linear chain can't express 'retry until grounded, max N times' cleanly." },
  { id: "ll-scale", q: "How would you scale LogLens to TBs/day or many concurrent users?", a: "More partitions + consumers for ingest; object storage for raw logs with metadata in Postgres; partition tables by time; move vectors to a dedicated store or partitioned pgvector; cache frequent queries; batch embeddings; queue LLM work with rate limits and per-tenant quotas; tiered retention." },
  { id: "ll-failure", q: "What fails, and how do you handle it?", a: "Consumer crash → redelivery + idempotent upserts. Poison chunk (unparseable) → retry then dead-letter with the offset for inspection. LLM timeouts/rate limits → retry with backoff, degrade to metrics-only output. Bad retrieval → corrective loop, then 'I don't know' rather than guessing." },
  { id: "ll-eval", q: "How did you evaluate answer quality?", a: "[Be honest about what you did.] Good answers: a small labelled set of questions with known answer lines; measure retrieval recall@k, citation correctness, groundedness score from the judge, and latency/cost per query." },
  { id: "ll-security", q: "Security/privacy — logs contain PII and secrets. What would you do?", a: "Redact at ingest (emails, tokens, IPs) with deterministic masking before anything reaches the LLM or the index, per-session access control, retention limits, and don't send raw logs to third-party LLMs without a data agreement." },
  { id: "ll-next", q: "What would you do differently / next?", a: "Pick 2 real ones: e.g., pgvector iterative scans or partitioning instead of per-session tables, learned anomaly baselines, streaming live logs instead of archives, an evaluation harness in CI." },
];

// ─── Blue Yonder resume deep-dive (non-STAR technical probes) ─────────────────
export const IK_RESUME_PROBES = [
  { id: "rp-fairshare-code", q: "Code it: split S units among stores with demands d[i], proportional to demand, integer units, deterministic.", a: "If S ≥ Σd, give everyone their demand. Otherwise share_i = S·d_i / Σd; give floor(share_i), then hand the remaining units one each by largest fractional remainder, tie-broken by a stable key (store id). O(n log n). Use long arithmetic (S·d_i can overflow int) or exact fractions instead of doubles. Variant: max-min fairness / water-filling when stores have caps." },
  { id: "rp-multitenant", q: "What does multi-tenancy mean in your platform? How is data isolated?", a: "[Confirm your model.] Options: database per tenant, schema per tenant, or shared tables with tenant_id + row-level security. Tenant id resolved per request from the token, held in a context, propagated to async/batch jobs, and used to route datasources. Noisy-neighbour protection via quotas/pool limits." },
  { id: "rp-feature-flags", q: "How do you use feature flags safely? What's the cost?", a: "Per-tenant targeting, gradual rollout, instant kill switch without deploy. Costs: combinatorial testing, stale flags as tech debt (add an owner + removal date), flag evaluation must be fast and fail-safe (default to the old behaviour if the flag service is down)." },
  { id: "rp-batch", q: "How did sharding cut batch runtime by 10%? Where was the bottleneck?", a: "[Fill in what you measured.] Typical story: queries for many tenants contended on one warehouse/connection path; routing tenants to their shard spread load and let batch steps run in parallel with less queuing." },
  { id: "rp-keyvault", q: "How were tenant OAuth credentials stored and rotated? (Azure Key Vault)", a: "Secrets in Key Vault, accessed via managed identity, cached in memory with a TTL, never logged. Rotation: support two valid secrets during the overlap window, refresh the cache on auth failure." },
  { id: "rp-agent-arch", q: "Draw the LLM inventory agent: nodes, state, and where a write goes.", a: "[Confirm your graph.] Typical shape: intent/parse node → hierarchy-aware read (Postgres) → propose change → stage in Redis overlay (scenario-scoped) → interrupt for human approval → on approve, commit to Postgres base; on reject, discard overlay. State lives in the LangGraph checkpointer while paused." },
  { id: "rp-github-actions", q: "How did the batch regression workflow work across 7 repos?", a: "[Confirm.] Reusable workflows triggered per repo (or on a schedule), running the batch against a known dataset, comparing outputs to a baseline, uploading results as artifacts; a master workflow aggregates them and publishes to GitHub Pages." },
];
