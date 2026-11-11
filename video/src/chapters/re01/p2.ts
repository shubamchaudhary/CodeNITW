import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 2: module 3 (rendering and reconciliation) and module 4 (hooks).
export const p2: Scene[] = [
  // ================================================================ module 3
  sec("3", "Rendering and reconciliation", "Module three. Rendering and reconciliation. Eight questions about what React does between your setState and the pixels changing."),
  custom(
    "pypipe",
    {
      title: "The idea: render, then commit",
      stages: [
        { name: "Trigger", icon: "⚡", sub: "setState, parent render, context" },
        { name: "Render phase", icon: "🧮", sub: "call components, diff" },
        { name: "Commit phase", icon: "🖊️", sub: "apply DOM changes" },
        { name: "Effects", icon: "🔔", sub: "layout, then passive" },
      ],
      steps: [
        { at: 0, text: "A render is triggered by a state update in the component, its parent re-rendering, or a context it reads changing." },
        { at: 1, text: "Render phase: React calls your components to get new elements and compares them with the last ones. Pure, and can be paused or thrown away." },
        { at: 2, text: "Commit phase: React applies the minimal changes to the DOM, all at once. Never interrupted." },
        { at: 3, text: "Then useLayoutEffect runs (before paint), the browser paints, and useEffect runs after." },
        { at: [1, 2], text: "Rendering is not the same as updating the DOM: a component can re-render and change nothing on screen." },
      ],
    },
    B(
      "Here's the idea of the module. Something triggers a render: a state update, the parent re-rendering, or a context value changing.",
      "Then the render phase. React calls your components to get new elements, and compares them with the previous ones. This phase must be pure, because React may pause it, or throw the result away.",
      "Then the commit phase. React applies only the necessary changes to the DOM, all at once, and this part is never interrupted.",
      "Then effects. Layout effects run before the browser paints, and ordinary effects run after.",
      { say: "And the distinction interviewers look for: rendering is not the same as updating the DOM. A component can re-render, produce the same output, and nothing on screen changes.", tone: "key" },
    ),
  ),
  qa(18, "What triggers a re-render in React?", [
    "Its own state changes (to a different value by Object.is)",
    "Its parent re-renders: children re-render by default, even with the same props",
    "A context it reads changes value",
    "Props changing is not a trigger by itself: the parent rendering is",
  ]),
  qa(19, "What are the render and commit phases?", [
    "Render: call components, build the new tree, diff it; pure, interruptible",
    "Commit: apply DOM changes, attach refs, run layout effects; synchronous",
    "Then the browser paints, and passive effects (useEffect) run",
  ]),
  qa(20, "What is the virtual DOM, and how does it help?", [
    "A lightweight tree of plain objects describing the UI (the elements)",
    "React diffs the new tree against the old one and updates only what changed",
    "The win is the declarative model with reasonable updates, not raw speed over hand-written DOM code",
  ]),
  {
    kind: "flow",
    title: "Reconciliation: React's two diffing rules",
    cols: 4,
    rows: 2,
    nodeW: 380,
    nodeH: 130,
    nodes: [
      { id: "a1", label: "<div>\n  <Profile />", c: 0, r: 0 },
      { id: "a2", label: "<section>\n  <Profile />", c: 1, r: 0, tone: "red" },
      { id: "r1", label: "different type:\nthrow away the subtree,\nstate lost", c: 1, r: 1, tone: "red" },
      { id: "b1", label: "<li key=\"a\">\n<li key=\"b\">", c: 2, r: 0 },
      { id: "b2", label: "<li key=\"b\">\n<li key=\"a\">", c: 3, r: 0, tone: "green" },
      { id: "r2", label: "same type + key:\nkeep, update props,\nstate kept (moved)", c: 3, r: 1, tone: "green" },
    ],
    edges: [
      { from: "a1", to: "a2", label: "re-render" },
      { from: "a2", to: "r1" },
      { from: "b1", to: "b2", label: "reorder" },
      { from: "b2", to: "r2" },
    ],
    show: [["a1", "a2"], ["r1"], ["b1", "b2", "r2"]],
    beats: B(
      "Reconciliation is how React compares the trees, and it uses two rules to keep it fast. Rule one: compare elements at the same position by type.",
      "If the type changed, a div became a section, React throws away the whole subtree and builds a new one. Every component inside loses its state.",
      { say: "Rule two: among siblings, keys identify elements. Same type and same key means the same component, just update its props, even if it moved. That's why keys matter, and why changing a key is a deliberate way to reset a component.", tone: "key" },
    ),
  },
  qa(21, "What is reconciliation, and what are the diffing rules?", [
    "Comparing the new element tree with the old one to find the changes",
    "Different type at a position → unmount the old subtree, mount a new one",
    "Same type → keep the instance, update props; children matched by key",
    "That makes diffing O(n) instead of the general O(n³)",
  ]),
  qa(22, "How do you reset a component's state with key?", [
    "Give it a key that changes when it should start fresh: <Form key={userId} />",
    "A new key means a new component instance: all its state is reset",
    "Cleaner than effects that copy props into state",
  ]),
  qa(23, "What is React Fiber?", [
    "React's reconciliation engine since React 16",
    "Rendering is split into small units of work that can be paused, resumed or dropped",
    "That enables priorities and concurrent rendering (transitions, Suspense)",
  ]),
  qa(24, "What does React.StrictMode do?", [
    "Development-only checks; nothing changes in production",
    "Renders components twice and runs effects mount → unmount → mount, to expose impure code and missing cleanups",
    "Warns about deprecated APIs",
  ]),
  qa(25, "What is React.memo?", [
    "Wraps a component so it skips re-rendering when its props are shallowly equal",
    "Useless if you pass new objects or functions every render: pair it with useMemo / useCallback",
    "Use it for expensive components that often receive the same props",
  ]),
  check({
    topic: "rendering",
    q: "A parent re-renders; its child receives exactly the same props. Does the child re-render?",
    say: "A parent re-renders, and its child receives exactly the same props. Does the child re-render?",
    a: "Yes, by default: children re-render with their parent. Only React.memo (with stable props) skips it.",
    aSay: "Yes, by default. Children re-render whenever their parent does. Only React memo, with props that are actually stable, lets it skip.",
  }),

  // ================================================================ module 4
  sec("4", "Hooks", "Module four. Hooks. Fifteen questions, the biggest module, and the one interviews dig into hardest. It starts with why hooks have rules at all."),
  custom(
    "pytape",
    {
      title: "The idea: React finds each hook by its call order",
      sub: "the component's hooks, as React stores them",
      cells: ["useState: name", "useEffect", "useState: age"],
      idx: true,
      steps: [
        { cells: ["useState: name", "useEffect", "useState: age"], note: "render 1: three hooks, in this order; React stores them as slots 0, 1, 2" },
        { cells: ["useState: name", "useEffect", "useState: age"], ptr: 2, label: "slot 2 → age", out: "render 2, same order: each call gets its own slot back" },
        { cells: ["useState: name", "useState: age"], pick: [1], ptr: 1, label: "slot 1 → ?", out: "if (x) useEffect(…) skipped: age now reads slot 1, the effect's slot", note: "a hook in a condition shifts every hook after it: so hooks only at the top level" },
      ],
    },
    B(
      "Here's the idea behind hooks. React doesn't know your hooks by name. It stores them in a list for each component, in the order they're called. Name is slot zero, the effect is slot one, age is slot two.",
      "On the next render, the same calls come in the same order, so each one gets its own slot back.",
      { say: "Now put the effect inside an if, and skip it once. Age is now the second call, so it reads slot one, the effect's slot. Everything after the skipped hook is shifted. That's why the rules of hooks exist: call them at the top level, in the same order, every render.", tone: "key" },
    ),
  ),
  qa(26, "What are hooks, and why were they introduced?", [
    "Functions (useState, useEffect…) that let function components use state and React features",
    "They replaced classes' problems: logic split across lifecycles, this, wrapper hell from HOCs",
    "Custom hooks let you reuse stateful logic between components",
  ]),
  qa(27, "What are the rules of hooks, and why do they exist?", [
    "Only call hooks at the top level: never in conditions, loops or after an early return",
    "Only call them from components or other hooks",
    "React identifies hooks by call order; the ESLint plugin enforces both rules",
  ]),
  qa(28, "What is useEffect for?", [
    "Synchronising with something outside React: subscriptions, timers, the DOM, network",
    "Runs after the commit and paint; returns an optional cleanup",
    "Not for computing values from props or state, and not for handling events",
  ]),
  custom(
    "chipcols",
    {
      title: "Effects on a timeline: run, clean up, run again",
      sub: "useEffect(() => { subscribe(roomId); return () => unsubscribe(roomId) }, [roomId])",
      cols: [
        { title: "RENDER", sub: "your function runs" },
        { title: "COMMIT + PAINT", sub: "DOM updated, screen drawn" },
        { title: "EFFECTS", sub: "after paint" },
      ],
      steps: [
        { cols: [["render: roomId = a"], ["DOM updated", "paint"], ["subscribe(a)"]], note: "mount: render, paint, then the effect runs" },
        { cols: [["render: roomId = a"], ["DOM updated", "paint"], []], note: "a re-render with the same roomId: deps unchanged, so the effect is skipped" },
        { cols: [["render: roomId = b"], ["DOM updated", "paint"], ["unsubscribe(a)", "subscribe(b)"]], note: "roomId changed: the old cleanup runs first, then the new effect" },
        { cols: [["(unmount)"], ["DOM removed"], ["unsubscribe(b)"]], note: "unmount: the last cleanup runs" },
      ],
    },
    B(
      "Effects on a timeline. On mount, the component renders, React commits and the browser paints, and then the effect runs: subscribe to room a.",
      "The component re-renders, but room id is still a. The dependency array hasn't changed, so the effect is skipped.",
      "Room id changes to b. First the previous effect's cleanup runs, unsubscribe from a, and then the new effect, subscribe to b.",
      { say: "And on unmount, the last cleanup runs. So an effect is a pair: start syncing with something, and stop. The dependency array decides when to stop and restart.", tone: "key" },
    ),
  ),
  qa(29, "How does the dependency array of useEffect work?", [
    "No array: runs after every render",
    "[]: runs once after mount (cleanup on unmount)",
    "[a, b]: runs when a or b changed (compared with Object.is)",
    "List every reactive value the effect reads; the linter checks it",
  ]),
  qa(30, "Why does useEffect need a cleanup function?", [
    "To undo what the effect started: unsubscribe, clear timers, abort fetches, remove listeners",
    "It runs before the effect re-runs and on unmount",
    "Without it: leaks, duplicate subscriptions, setState on unmounted components",
  ]),
  qa(31, "What is the difference between useEffect and useLayoutEffect?", [
    "useEffect: after the browser paints; doesn't block the screen; the default",
    "useLayoutEffect: after the DOM update but before paint; blocks painting",
    "Use the layout one only to measure the DOM and fix layout before the user sees a flicker",
  ]),
  qa(32, "What is a stale closure in React, and how do you fix it?", [
    "A function created in an old render keeps that render's state values",
    "e.g. setInterval in an effect with [] keeps reading count = 0 forever",
    "Fixes: correct dependencies, the updater form setCount(c => c + 1), or a ref for the latest value",
  ], { code: `useEffect(() => {\n  const id = setInterval(() => {\n    setCount(count + 1);       // ✗ count is always 0\n    setCount((c) => c + 1);    // ✓ latest value\n  }, 1000);\n  return () => clearInterval(id);\n}, []);` }),
  qa(33, "How do you fetch data in an effect correctly, including race conditions?", [
    "Fetch in the effect, keyed on its inputs; track loading and error state",
    "Race: an old, slower response arrives after a newer one and overwrites it",
    "Fix: an ignore flag or AbortController in the cleanup; or use TanStack Query",
  ], { code: `useEffect(() => {\n  const ctrl = new AbortController();\n  fetch(\`/api/users/\${id}\`, { signal: ctrl.signal })\n    .then((r) => r.json())\n    .then(setUser)\n    .catch((e) => e.name !== "AbortError" && setError(e));\n  return () => ctrl.abort();   // the old request is cancelled\n}, [id]);` }),
  qa(34, "When don't you need an effect?", [
    "Deriving values from props or state: compute them during render (or useMemo)",
    "Reacting to a user action: do it in the event handler",
    "Resetting state when a prop changes: use a key",
    "Effects are for syncing with outside systems only",
  ]),
  qa(35, "What is useRef used for?", [
    "A mutable box ({ current }) that survives renders without causing them",
    "Holding DOM nodes: inputRef.current.focus()",
    "Holding values that shouldn't trigger renders: timer ids, the previous value, the latest callback",
  ]),
  qa(36, "How do you pass a ref to a child component (forwardRef, and ref as a prop in React 19)?", [
    "Before React 19: wrap the child in forwardRef((props, ref) => …)",
    "React 19: ref is a normal prop for function components; forwardRef isn't needed",
    "useImperativeHandle exposes a limited API instead of the raw DOM node",
  ]),
  qa(37, "What do useMemo and useCallback do?", [
    "useMemo(fn, deps): remembers a computed value until deps change",
    "useCallback(fn, deps): remembers a function instance (useMemo returning a function)",
    "Uses: skip expensive work, and keep props stable for memoised children or effect deps",
  ]),
  qa(38, "When should you NOT use useMemo and useCallback?", [
    "Cheap calculations: the memo bookkeeping costs more than it saves",
    "When the child isn't memoised: a stable callback changes nothing",
    "Measure first with the Profiler; the React Compiler automates much of this",
  ]),
  qa(39, "When should you use useReducer instead of useState?", [
    "Several related values updated together, or the next state depends on complex rules",
    "Logic goes into a pure reducer(state, action) you can test on its own",
    "dispatch is stable, so it's easy to pass down (often with context)",
  ]),
  qa(40, "What are custom hooks? Give an example.", [
    "A function whose name starts with use and calls other hooks: reusable stateful logic",
    "Each component that calls it gets its own state",
    "Examples: useFetch, useDebounce, useLocalStorage, useOnline",
  ], { code: `function useDebounce(value, ms = 300) {\n  const [v, setV] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setV(value), ms);\n    return () => clearTimeout(t);\n  }, [value, ms]);\n  return v;\n}` }),
  check({
    topic: "effects",
    q: "useEffect(() => { setInterval(tick, 1000) }, []). What's missing, and what goes wrong in StrictMode?",
    say: "An effect with an empty dependency array starts a set interval, and returns nothing. What's missing, and what goes wrong in strict mode?",
    a: "A cleanup (return () => clearInterval(id)). StrictMode mounts twice in development, so you get two intervals, and they leak after unmount.",
    aSay: "A cleanup that clears the interval. Strict mode mounts the component twice in development, so you'd get two intervals running, and both keep running after the component unmounts.",
  }),
];
