import type { Scene } from "../../lib/types.ts";
import { B, amap, arch, check, sec } from "./h.ts";
import { RESOLVER, RESOLVER_STEPS } from "./boards.ts";

// Part C: the data layer you built, first half: the four steps, per-instance
// connections, hierarchy-aware reads, Redis staging.
export const partC: Scene[] = [
  // ------------------------------------------------------------ 11
  sec("11", "Your layer: four steps, one write", "Topic eleven. Now your part: the data management layer. Everything from here to topic seventeen is what you built, so we slow down even more."),
  amap(
    "The write path is online shopping",
    "🛒 shopping online",
    "⚙️ the data layer",
    [
      { icon: "👀", a: "You browse, and see the products and their prices", b: "read · read_parameters: the rows the planner saw" },
      { icon: "🛒", a: "You put items in the cart. Nothing is bought yet", b: "stage · prepare_parameter_update → Redis" },
      { icon: "💳", a: "Checkout stops and asks you to confirm", b: "approve · a LangGraph interrupt; the planner says yes" },
      { icon: "📦", a: "Only now does the warehouse ship anything", b: "commit · UPSERT into the <kind>_u overlay" },
      { icon: "⏳", a: "An abandoned cart quietly empties itself", b: "TTL · an unapproved proposal just expires" },
    ],
    B(
      "Here's the whole write path as one picture you already know: shopping online.",
      "You browse, and see the products and their prices. That's the read. Read parameters fetches the live values, and these become the rows the planner saw.",
      "You put items in the cart, but nothing has been bought. That's staging. Prepare parameter update works out the change and parks it in Redis. The database hasn't been touched.",
      "At checkout, the site stops and asks you to confirm. That's the approval: a LangGraph interrupt pauses everything until the planner says yes.",
      { say: "Only after you confirm does the warehouse ship. That's the commit: an upsert into the overlay table.", tone: "key" },
      "And if you walk away, the cart quietly empties itself. An unapproved proposal in Redis has a time to live, and simply expires.",
      { say: "Read, stage, approve, commit. Four steps, and the database changes only in the last one.", tone: "key" },
    ),
    "the database changes only in the last step",
  ),
  check({
    topic: "the four steps",
    q: "In which of the four steps does the planning database change?",
    options: ["Read", "Stage", "Approve", "Commit"],
    answer: 3,
    a: "Only in commit. Read only SELECTs, stage writes to Redis, and approve is a pause.",
    aSay: "D. Only in commit. The read only selects. Staging writes to Redis, not the database. And approval is just a pause.",
  }),

  // ------------------------------------------------------------ 12
  sec("12", "Finding the right database", "Topic twelve. Before any read, the tool has to find the right database. Remember: one per planning instance."),
  {
    kind: "big",
    tone: "idea",
    lead: "The constraint",
    text: "There is no single database. Each planning instance has its own PostgreSQL, so credentials can't be static environment variables.",
    after: "like a courier serving many buildings: look up the address, sign out the key, remember both for a little while",
    beats: B(
      "Start from the constraint.",
      { say: "There is no single database. Each planning instance has its own PostgreSQL. So the credentials can't be a static environment variable, set once at deploy time.", tone: "key" },
      "Think of a courier serving many buildings. For each delivery, they look up the address in a directory, sign the right key out of a key safe, and remember both for a little while, because locks do get changed.",
    ),
  },
  arch(
    RESOLVER,
    RESOLVER_STEPS,
    B(
      "Here's that courier in code. A class called the U I cache connection resolver.",
      "A tool needs the database. It knows which planning instance from the graph state. Again, never from the model.",
      "First it checks: did we resolve this instance recently? If not, that's a miss, and the resolver calls the controller A P I, the directory, for this instance's host and schema.",
      "The controller also returns the hierarchy levels for the instance: which item and location levels exist. Those are cached separately, under their own key, U I cache colon hierarchy colon the instance id. We'll need them in the next topic.",
      { say: "Next, the key safe. The database password comes from Azure Key Vault, per instance, at the moment of resolving. It's never in config, and never anywhere near a prompt.", tone: "key" },
      "Host, port, database name, user, password, S S L mode and schema are put together into one connection dictionary, and cached with a short time to live.",
      "Then the connector opens the connection and sets the search path. Search path is like the current directory in a terminal: once it's set, a bare table name is looked up in that schema. So every query can use plain table names, and still hit the right customer's schema.",
      "On the next tool call within the time to live, it's a hit. No controller call. No Key Vault round trip.",
      { say: "And after a commit, the connection cache is invalidated on purpose, so the next read reflects the change.", tone: "key" },
    ),
    "UICacheConnectionResolver.resolve(...)",
  ),
  {
    kind: "bullets",
    title: "Two details worth saying",
    items: [
      { icon: "⏱", text: "Why a short TTL, not forever?", sub: "credentials rotate and instances move; a short TTL bounds how long a stale host or password can be used" },
      { icon: "🧪", text: "A local test mode", sub: "local credentials instead of Key Vault; schema and hierarchy still come from the controller" },
    ],
    beats: B(
      { say: "Why a short time to live, and not cache forever? Because credentials rotate, and instances move. A short time to live bounds how long a stale host or password can be used, while still saving a Key Vault round trip on almost every call.", tone: "key" },
      "And for development, there's a local test mode, which uses local credentials instead of Key Vault. The schema and the hierarchy still come from the controller.",
    ),
  },
  check({
    topic: "connections",
    q: "Where does the database password come from?",
    options: ["A .env file on the server", "The prompt", "Azure Key Vault, per planning instance, at resolve time", "The controller API"],
    answer: 2,
    a: "Azure Key Vault, per instance, fetched when resolving and cached briefly.",
    aSay: "C. Azure Key Vault, per planning instance, fetched when resolving, and cached briefly.",
    why: "The controller gives the host, schema and hierarchy; Key Vault gives the password.",
    whySay: "D is a common slip. The controller gives the host, the schema and the hierarchy. The password comes from Key Vault.",
  }),
  check({
    topic: "connections",
    q: "Why cache the resolved connection with a short TTL, instead of forever?",
    a: "Credentials rotate and instances move: a short TTL bounds how long a stale host or password is used, yet avoids a Key Vault round trip per call. Commits invalidate it on purpose.",
    aSay: "Because credentials rotate and instances move. A short time to live bounds how long a stale host or password can be used, but still avoids a Key Vault round trip on every tool call. And a commit invalidates it on purpose.",
  }),

  // ------------------------------------------------------------ 13
  sec("13", "Hierarchy-aware reads", "Topic thirteen. Hierarchy aware reads. The first of your four resume claims."),
  {
    kind: "big",
    tone: "idea",
    lead: "Facts and dimensions, from scratch",
    text: "The fact view has one row per item per location, with its parameters. The dimension tables say which class each item is in, and which region each location is in.",
    after: "like a class register: marks by roll number on one sheet, which section each roll number is in on another. To get “section B's marks”, you join them",
    beats: B(
      "Planners don't think in rows. They say, the Milk class in the West. To answer that, you need two kinds of table.",
      { say: "The fact view has one row per item per location, with its parameters. But it only knows item codes and location codes. The dimension tables are the lookups: for each item, its department and class. For each location, its region.", tone: "key" },
      "It's like a school register. One sheet has marks by roll number. Another sheet says which section each roll number belongs to. To get section B's marks, you join the two sheets on roll number.",
    ),
  },
  {
    kind: "custom",
    name: "hierarchy",
    beats: B(
      "On the left, the item hierarchy: department, then class, then item. On the right, locations: region, then distribution centre.",
      "The planner says: the Milk class. That lights up a whole subtree. Three items, in this example.",
      "In the West. Another subtree. Three distribution centres.",
      { say: "And the rows we want are every combination. Three items times three D Cs. Nine item location rows, from one short sentence.", tone: "key" },
      "One more twist. Which actual column holds class, or region, differs from one planning instance to another. So the code keeps a level to column map, built from the hierarchy the resolver fetched for this instance.",
    ),
  },
  {
    kind: "code",
    title: "The read, as SQL",
    lang: "sql",
    code: `SELECT ...
FROM <view> fact
JOIN <dim_item> dim_item ON fact.item = dim_item.item
JOIN <dim_loc>  dim_loc  ON fact.location = dim_loc.location
WHERE fact.item = ANY(%s)
  AND dim_item.<level_col> = ANY(%s)
  AND dim_loc.<level_col>  = ANY(%s)`,
    highlight: [null, [2, 2], [3, 4], [6, 7], [6, 7], [5, 7]],
    badge: { step: 5, from: 5, to: 7, label: "values: always bound as %s" },
    beats: B(
      "Here's the shape of the query. Slowly.",
      "From the Base view, the fact rows. This is the view, read only.",
      "Join it to the item dimension on the item code, and to the location dimension on the location code. Now each fact row knows its class and its region.",
      "Then filter at whatever level the planner asked. Item level column equals Milk. Location level column equals West.",
      "Those level columns come from the level to column maps: item level column map, and location level column map, resolved per instance.",
      { say: "And look at the percent S markers. Every value, the item codes, Milk, West, is bound as a parameter. Never pasted into the SQL text.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "SQL injection: two parts, two defences",
    cols: [
      { title: "Identifiers", icon: "🏷", tone: "amber", items: ["table and column names", "can't be bound as parameters", "checked against a safe-identifier pattern", "and they come from the hierarchy map, not the user"] },
      { title: "Values", icon: "✉️", tone: "green", items: ["Milk, West, item codes", "always bound as %s", "sent separately from the SQL text", "so they can never become SQL"] },
    ],
    footer: "a form letter can leave blanks for the name, not for which form it is",
    beats: B(
      "Now, SQL injection, done properly. A query has two kinds of moving part, and each gets its own defence. First, identifiers: the table and column names. Those can't be bound as parameters, because the database needs the query's structure, which table, which columns, fixed before any values arrive. So before an identifier goes into the SQL text, it's checked against a safe identifier pattern. And it comes from the instance's own hierarchy map, not from the user.",
      "Second, values. Milk, West, the item codes. Those are always bound with percent S. The driver sends them separately from the SQL text, so a value can never turn into SQL, whatever it contains.",
      { say: "Think of a form letter. You can leave blanks for the name and the amount. You can't leave a blank for which form it is. Values go in the blanks. Identifiers are part of the form, so they get checked against a guest list.", tone: "key" },
    ),
  },
  {
    kind: "bullets",
    title: "What the model sees, and what Redis keeps",
    items: [
      { icon: "🐼", text: "Rows come back as a pandas DataFrame" },
      { icon: "📝", text: "The model gets a markdown summary, not raw rows", sub: "fewer tokens; it reasons over a small readable table" },
      { icon: "🟥", text: "The raw rows are cached in Redis", sub: "param_read:{conversation_id}:… · the next step reuses exactly what the planner saw" },
    ],
    beats: B(
      "The rows come back as a pandas data frame.",
      "But the model doesn't get the raw rows. It gets a markdown summary. Fewer tokens, and the model reasons much better over a small readable table than over a dump.",
      { say: "And the raw rows are cached in Redis, under a key that starts with param read, and the conversation id. So the next step, staging, reuses exactly the rows the planner saw, without a second query.", tone: "key" },
    ),
  },
  {
    kind: "decision",
    question: "Why not let the model write the SQL itself?",
    answer: "Flexibility in what the model asks for; full control over how it's asked.",
    left: { title: "A tool with a typed schema ✓", items: ["a fixed query shape", "whitelisted identifiers", "bound values", "validated arguments"] },
    right: { title: "Text-to-SQL", items: ["any SQL against production data", "hard to bound or audit", "injection is the design", "every query a surprise"] },
    footer: "the cost: a new kind of question may need a tool change",
    beats: B(
      "The obvious follow up. Why not text to SQL? Why not let the model write the query?",
      "Because the goal is flexibility in what the model asks for, and full control over how it's asked.",
      "A tool with a typed schema gives a fixed query shape, whitelisted identifiers, bound values and validated arguments. Text to SQL lets a model run any SQL it likes against a production planning database.",
      { say: "Be honest about the cost: a genuinely new kind of question may need a change to the tool.", tone: "key" },
    ),
  },
  check({
    topic: "hierarchy reads",
    q: "Why can't a column name be passed as a %s parameter, like a value?",
    say: "Why can't a column name be passed as a percent S parameter, like a value?",
    options: ["It would be too slow", "Parameters stand only for values; the query's structure (tables, columns) must be fixed before values are bound", "It's a psycopg bug", "It can be"],
    answer: 1,
    a: "Placeholders stand only for values; the structure must be fixed first. So identifiers get a different defence: a safe-identifier check, and they come from the hierarchy map.",
    aSay: "B. Placeholders can only stand for values. The query's structure has to be fixed first. So identifiers get a different defence: a safe identifier pattern check, and they come from the instance's hierarchy map.",
  }),
  check({
    topic: "hierarchy reads",
    q: "The read returns a markdown summary to the model. Where do the raw rows go, and why?",
    a: "Into Redis under param_read:{conversation_id}:…, so staging works on exactly the rows the planner saw, with no second query and no raw rows in the model's context.",
    aSay: "Into Redis, under the param read key for this conversation. So staging works on exactly the rows the planner saw, with no second query, and the model never has to carry raw rows in its context.",
  }),
  check({
    topic: "hierarchy reads",
    q: "In one sentence: why not text-to-SQL?",
    a: "A typed tool gives the model flexibility in what to ask, and the code full control over how it is asked: fixed shape, whitelisted identifiers, bound values.",
    aSay: "Because a typed tool gives the model flexibility in what to ask for, and the code full control over how it's asked: a fixed shape, whitelisted identifiers, and bound values.",
  }),

  // ------------------------------------------------------------ 14
  sec("14", "Redis-staged writes", "Topic fourteen. Staging. The shopping cart, in detail."),
  {
    kind: "bullets",
    title: "prepare_parameter_update, in four steps",
    firstItemStep: 1,
    items: [
      { icon: "1️⃣", text: "Load the latest param_read entry", sub: "a read must come first: the change is computed against rows the planner saw" },
      { icon: "2️⃣", text: "Resolve and validate", sub: "“order cost” → the canonical column · range checks · only the targeted items and locations" },
      { icon: "3️⃣", text: "Stage the change set", sub: "param_prepared:{conversation_id}:{uuid}" },
      { icon: "4️⃣", text: "Return a summary", sub: "“Proposed Parameter Update”: N rows, old → new" },
    ],
    beats: B(
      "The planner says, set ordering cost to twelve. The model calls prepare parameter update. Here's what it does, in four steps.",
      { say: "One. It loads the latest param read entry from Redis. So a read must come first. A change is always computed against rows the planner has actually seen.", tone: "key" },
      "Two. It resolves fuzzy names. The planner might say order cost, and that's mapped to the real, canonical column. It checks the new value is in a valid range. And it filters down to just the targeted items and locations.",
      "Three. It stores the pending change set in Redis, under param prepared, the conversation id, and a fresh unique id.",
      "Four. It returns a readable summary to the model: proposed parameter update, so many rows, old value to new value. The model passes that on to the planner.",
    ),
  },
  {
    kind: "custom",
    name: "redis",
    beats: B(
      "Now watch the keys. Three tools on the left, Redis in the middle, the instance's Postgres on the right.",
      "The read selects rows from Postgres, and sets the param read key: the nine rows the planner saw.",
      "Prepare gets that key, computes the change, and sets a second key, param prepared, holding the pending changes and the affected rows. Postgres still hasn't been touched.",
      { say: "Only after approval does update parameters get the param prepared key, and upsert into the overlay.", tone: "key" },
      { say: "And if the planner never answers? The time to live runs out, both keys disappear, and there's nothing to clean up, because the database was never written.", tone: "key" },
    ),
  },
  {
    kind: "numbers",
    title: "What the staging buffer must do",
    items: [
      { value: "⏳", label: "survive between requests", sub: "the pause can span minutes and several HTTP calls" },
      { value: "👥", label: "be visible to any worker", sub: "the approval may land on another process" },
      { value: "🙈", label: "stay out of the LLM's context", sub: "it can be thousands of rows" },
      { value: "🧹", label: "vanish if abandoned", sub: "no cleanup job" },
    ],
    footer: "Redis + namespaced keys + a TTL does all four",
    beats: B(
      "Why Redis? List what the staging buffer has to do. One. Survive between requests. The approval pause can last minutes, across several HTTP calls.",
      "Two. Be visible to whichever worker handles the next request, because the approval may land on a different process.",
      "Three. Stay out of the LLM's context. A proposal can be thousands of rows.",
      "Four. Vanish on its own if the planner never answers.",
      { say: "Redis, with namespaced keys and a time to live, does all four.", tone: "key" },
    ),
  },
  {
    kind: "compare",
    title: "Where else could the proposal live?",
    cols: [
      { title: "In the graph state", icon: "🕸", tone: "red", items: ["thousands of rows through every super-step", "and every checkpoint flush", "state is read on every turn"] },
      { title: "A pending table in Postgres", icon: "🐘", tone: "amber", items: ["writes to production for something that may never be approved", "needs its own cleanup job", "couples staging to one instance's DB"] },
      { title: "Redis ✓", icon: "🟥", tone: "green", items: ["the state holds only the key", "TTL cleanup for free", "shared by every worker"] },
    ],
    footer: "the cost: if Redis evicts the key, the planner re-prepares",
    beats: B(
      "And the follow up: where else could it live? In the graph state? Then the checkpoint would carry thousands of rows through every super step, and every flush, and the state is read on every turn.",
      "In a pending table in Postgres? It works, but it writes to the production planning database for something that may never be approved, it needs its own cleanup job, and it ties staging to one instance's database.",
      "In Redis, the state only needs the key, cleanup is free, and every worker can see it.",
      { say: "And the honest cost: if Redis evicts the key before approval, the planner simply re-prepares the change.", tone: "key" },
    ),
  },
  check({
    topic: "staging",
    q: "prepare_parameter_update is called, but nothing was read in this conversation. What happens?",
    say: "Prepare parameter update is called, but nothing was read in this conversation. What happens?",
    options: ["It reads automatically", "It refuses: there's no param_read entry, and a change must be computed against rows the planner saw", "It writes directly to Postgres", "It guesses the current values"],
    answer: 1,
    a: "It refuses. No param_read entry means no rows the planner has seen, and a change is always computed against those.",
    aSay: "B. It refuses. With no param read entry, there are no rows the planner has seen, and a change is always computed against those.",
  }),
  check({
    topic: "staging",
    q: "Name the four things the staging buffer must do.",
    a: "Survive between requests · be visible to any worker · stay out of the LLM's context · vanish if abandoned. Redis + namespaced keys + TTL does all four.",
    aSay: "Survive between requests. Be visible to any worker. Stay out of the LLM's context. And vanish if abandoned. Redis, with namespaced keys and a time to live, does all four.",
  }),
  check({
    topic: "staging",
    q: "Why not keep the proposal in the graph state?",
    options: ["The state can't hold dictionaries", "The checkpoint would carry thousands of rows through every super-step and flush", "Redis is more secure", "LangGraph forbids it"],
    answer: 1,
    a: "The checkpoint would carry the rows through every super-step and every flush. Redis keeps the checkpoint small: the state only needs the key.",
    aSay: "B. The checkpoint would carry thousands of rows through every super step and every flush. With Redis, the checkpoint stays small, because the state only needs the key.",
  }),
];
