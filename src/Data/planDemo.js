// The sample plan a signed-out visitor sees on the Planning page: a realistic
// day, part done and part in progress, so the page shows what it's for. It
// lives only in memory — nothing is stored, a guest can't change it (every
// action asks them to sign in), and a signed-in account sees its own plan.

const MIN = 60;

export function demoPlan(day) {
  const items = [
    { uid: "demo-lru", source: "dsa", refId: "lru-cache", title: "LRU Cache", meta: "Design", estimatedMinutes: 45 },
    { uid: "demo-hashmap", source: "dsa", refId: "design-hashmap", title: "Design HashMap", meta: "Hashing", estimatedMinutes: 45 },
    { uid: "demo-threads", source: "corestack", refId: "CONC-01", title: "Threads, executors & ThreadPoolExecutor", meta: "P0", estimatedMinutes: 180 },
    { uid: "demo-hr", source: "custom", title: "Contact ABC HR", estimatedMinutes: 30, completed: true },
    { uid: "demo-xyz", source: "custom", title: "Finish XYZ task, check and reply emails", estimatedMinutes: 30 },
  ];
  // Done: both DSA problems and the HR call. In progress: the Core Stack topic.
  const complete = new Set(["demo-lru", "demo-hashmap", "demo-hr"]);
  const spent = { "dsa:lru-cache": 45 * MIN, "dsa:design-hashmap": 40 * MIN, "corestack:CONC-01": 85 * MIN, "custom:demo-hr": 25 * MIN };
  const timeLog = Object.fromEntries(
    items
      .map((i) => [i, i.source === "custom" ? `custom:${i.uid}` : `${i.source}:${i.refId}`])
      .filter(([, target]) => spent[target])
      .map(([i, target]) => [`${day}|${target}`, { day, target, source: i.source, title: i.title, sec: spent[target] }])
  );
  return { items, complete, timeLog };
}
