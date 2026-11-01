import type { Chapter } from "../lib/types.ts";

// Java Part 1 (src/Data/coreStackDocs/JAVA-01.md): collections and HashMap
// internals, told through one map of player scores.

export const java01: Chapter = {
  id: "java01",
  label: "Java 1",
  title: "Collections and HashMap internals",
  voice: "en-US-AndrewMultilingualNeural",
  scenes: [
    {
      kind: "custom",
      name: "lookup",
      beats: [
        { say: "A game server keeps every player's score. Two million players. Ten thousand lookups a second. Keep them in a list, and every lookup checks about a million entries." },
        { say: "A HashMap gets there in about one step. It jumps straight to the right place.", tone: "key" },
        { say: "So how does it know where to jump?", tone: "ask" },
      ],
    },
    {
      kind: "title",
      eyebrow: "Java · Part 1",
      title: "Collections and HashMap internals",
      subtitle: "buckets, equals and hashCode, trees, resizing, threads",
      beats: [{ say: "Java, part one. Collections, and how a HashMap really works." }],
    },

    // ------------------------------------------------------------ 1
    { kind: "section", num: "1", title: "Buckets", beats: [{ say: "Let's open one up." }] },
    {
      kind: "custom",
      name: "bucketfill",
      beats: [
        {
          say: "Inside, a HashMap is just an array. Each slot is called a bucket, and a new map has sixteen of them. Each bucket holds a little chain of nodes: the hash, the key, the value, and a pointer to the next node.",
          term: { word: "Bucket", meaning: "one slot of the map's internal array" },
        },
        { say: "Put Dhoni with fifty six. Java takes the key's hash code, mixes its high bits into its low bits, and keeps the last four bits. One zero zero one. Bucket nine." },
        {
          say: "Now two famous strings. Capital A small a, and capital B capital B. They have exactly the same hash code: twenty one twelve. Same bucket. They share one chain. Two keys in one bucket is a collision.",
          tone: "excite",
          term: { word: "Collision", meaning: "two keys land in the same bucket" },
        },
        { say: "So how does get B B return twenty, and not ten? It walks the chain. It checks the hash first, a cheap number compare. Then it calls equals. A a? No. B B? Yes. Twenty.", tone: "key" },
        { say: "And keys can collide without equal hash codes. Rohit and Ishan have different hash codes, but the same last four bits. Bucket one, for both.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 2
    { kind: "section", num: "2", title: "equals and hashCode", beats: [{ say: "Which brings us to the most asked rule in Java." }] },
    {
      kind: "custom",
      name: "contract",
      beats: [
        { say: "Remember the split. Hash code picks the bucket. Equals picks the entry inside it.", tone: "key" },
        {
          say: "Now a Point class that overrides equals, but not hash code. Two equal points get different default hash codes. So the lookup goes to a different bucket, and equals never even runs. Get returns null, and the map holds duplicates.",
          term: { word: "hashCode contract", meaning: "equal objects must have equal hash codes" },
        },
        { say: "The fix: build equals and hash code from the same fields. Or just use a record, which writes both for you." },
      ],
    },
    {
      kind: "custom",
      name: "stranded",
      beats: [
        { say: "One more trap. Put a point, one comma two, as a key." },
        { say: "Then change its x to five. The node still sits in the bucket for one comma two. But the key now says five comma two." },
        { say: "Look it up with p, and Java searches the bucket for five comma two. Empty. Look it up with a fresh one comma two, and equals fails. The entry is still counted, but nobody can reach it. A memory leak.", tone: "excite" },
        { say: "So keys must be immutable. Strings, records, integers, enums.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 3
    { kind: "section", num: "3", title: "When buckets get crowded", beats: [{ say: "Now, what happens when a bucket gets crowded?" }] },
    {
      kind: "custom",
      name: "chaintree",
      beats: [
        { say: "Pile keys with the same hash code into one bucket. Eight of them. Every lookup in this bucket walks the whole chain." },
        { say: "Here comes the ninth. Java asks one question: does the table have at least sixty four buckets?", tone: "ask" },
        { say: "Not yet. So it resizes the whole table instead, sixteen to thirty two, then thirty two to sixty four. In a small table, a crowded bucket just means the table is too small." },
        {
          say: "Now at sixty four buckets, the chain becomes a red black tree. Lookups in this bucket drop from linear, to log n. That's treeify.",
          tone: "key",
          term: { word: "Treeify", meaning: "a crowded bucket's chain becomes a red-black tree" },
        },
        { say: "Three numbers to remember. Tree on the ninth node. Only with sixty four buckets. And back to a list at six.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "growtable",
      beats: [
        {
          say: "The whole table has a limit too. Sixteen buckets times a load factor of zero point seven five is twelve.",
          term: { word: "Load factor", meaning: "how full the table may get before it doubles" },
        },
        { say: "So the thirteenth put doubles the table, to thirty two buckets.", tone: "excite" },
        { say: "And Java doesn't recompute every bucket. Doubling adds exactly one bit. Rohit's bit is zero, so he stays in bucket one. Ishan's bit is one, so he moves to one plus sixteen, bucket seventeen.", tone: "key" },
        { say: "That one put copies everything, a latency spike. If you know the size, pre size the map.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "powertwo",
      beats: [
        { say: "That's why capacity is always a power of two. With sixteen buckets, hash and fifteen gives the same answer as hash mod sixteen, in one fast instruction." },
        { say: "And doubling adds one bit, so a resize can split each bucket on that one bit." },
        { say: "Why mix the high bits in? Only the low bits pick the bucket. Keys like sixty five five three six differ only in their high bits, so without mixing they'd all pile into bucket zero. Mixing spreads them out.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 4
    { kind: "section", num: "4", title: "Many threads", beats: [{ say: "Now add threads.", tone: "excite" }] },
    {
      kind: "custom",
      name: "lostupdate",
      beats: [
        { say: "A web server counts page views. Two threads each count fifty thousand views of the home page, with get, then put." },
        {
          say: "Thread A reads forty one. Thread B reads forty one. A writes forty two. B writes forty two. Two views, counted as one. Nothing crashes, so tests pass. This is check then act.",
          term: { word: "Check-then-act", meaning: "two calls that another thread can slip between" },
        },
        { say: "The fix is one atomic call on a ConcurrentHashMap. Merge. Exactly a hundred thousand.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "chmlocks",
      beats: [
        {
          say: "ConcurrentHashMap uses the same bucket array, built for many threads.",
          term: { word: "ConcurrentHashMap", meaning: "a thread-safe map that locks one bucket at a time" },
        },
        { say: "Filling an empty bucket takes no lock. It uses compare and swap: write only if the slot is still empty. Lose the race, and simply retry." },
        { say: "Writing to a busy bucket locks only that bucket's first node. Every other bucket stays free." },
        { say: "And reads take no lock at all.", tone: "key" },
        { say: "It allows no nulls, since a null from get would be ambiguous. And forget the sixteen segments. That was Java seven.", tone: "aside" },
      ],
    },

    // ------------------------------------------------------------ 5
    { kind: "section", num: "5", title: "Looping safely", beats: [{ say: "A bug you can hit with just one thread." }] },
    {
      kind: "custom",
      name: "modcount",
      beats: [
        { say: "Loop over players, and remove the ones who went offline. One thread. Plain for each loop." },
        {
          say: "The list counts every change in mod count. The iterator saved seven. Remove bumps it to eight. On the next step, eight isn't seven, and it throws a concurrent modification exception. That's fail fast.",
          term: { word: "Fail-fast", meaning: "the iterator throws when the collection changes under it" },
        },
        { say: "So use remove if, or the iterator's own remove.", tone: "key" },
      ],
    },

    // ------------------------------------------------------------ 6
    { kind: "section", num: "6", title: "The rest of the family", beats: [{ say: "Last, a quick tour of the rest of the family." }] },
    {
      kind: "custom",
      name: "arraygrow",
      beats: [
        { say: "An ArrayList is one array. It starts at ten, and grows one and a half times when full. Get by index jumps straight there." },
        { say: "A LinkedList is a chain of nodes. Get ten walks node by node. Its fast insert only starts after that walk." },
        { say: "So default to ArrayList. And for queues and stacks, ArrayDeque.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "lrulist",
      beats: [
        { say: "A LinkedHashMap is a HashMap plus a linked list through its entries." },
        {
          say: "In access order, every read moves that entry to the tail. So the head is always the least recently used.",
          term: { word: "LRU cache", meaning: "evicts the entry used least recently" },
        },
        { say: "Cap it at three, and evict the head on every put. That's an LRU cache, in five lines.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "treefloor",
      beats: [
        { say: "A TreeMap keeps keys sorted, in a red black tree. Its superpower is nearest key lookups. Tax slabs at zero, three lakh, and seven lakh. Floor entry of four point five lakh: the five percent slab." },
        { say: "It uses only compare to, never equals. So compare returning zero means the same key.", tone: "aside" },
      ],
    },
    {
      kind: "custom",
      name: "heap",
      beats: [
        { say: "And a PriorityQueue is a min heap in an array. Each parent is smaller than its children, so only the head is in order. Print it, and it looks unsorted." },
        { say: "Offer and poll are log n. Peek is constant time. For a max heap, pass reverse order.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "recap",
      props: {
        items: [
          ["🪣", "Bucket", "hashCode picks it"],
          ["⚖️", "equals + hashCode", "same fields, immutable"],
          ["🌳", "Treeify", "9th node, 64+ buckets"],
          ["📈", "Resize", "13th put, one-bit split"],
          ["🔒", "ConcurrentHashMap", "CAS, lock one bucket"],
          ["🚨", "Fail-fast", "modCount check"],
        ],
      },
      beats: [
        { say: "Let's lock it in." },
        { say: "Hash code picks the bucket. Equals picks the entry." },
        { say: "Equal objects need equal hash codes, from immutable fields." },
        { say: "A crowded bucket becomes a tree on the ninth node, with sixty four buckets." },
        { say: "The thirteenth put doubles the table, and each entry moves on one bit." },
        { say: "ConcurrentHashMap locks one bucket, and merge makes updates atomic." },
        { say: "And never remove inside a for each loop.", tone: "key" },
      ],
    },
    {
      kind: "custom",
      name: "drawit",
      beats: [
        { say: "Before the next part: from memory, draw the sixteen buckets after the six puts." },
        { say: "Then walk put Ishan through every step. And say where Ishan goes, when the table grows to thirty two.", tone: "key", hold: 3 },
      ],
    },
    {
      kind: "title",
      eyebrow: "Java · Part 1",
      title: "That's HashMap",
      subtitle: "next: streams, lambdas and functional interfaces",
      beats: [{ say: "That's HashMap. See you in part two.", tone: "excite" }],
    },
  ],
};
