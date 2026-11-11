import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 3: module 5 (context and state management), module 6 (patterns),
// module 7 (performance) and module 8 (modern React and rendering strategies).
export const p3: Scene[] = [
  // ================================================================ module 5
  sec("5", "Context and state management", "Module five. Context and state management. Four questions about where state should live."),
  {
    kind: "flow",
    title: "The idea: context skips the middle, but re-renders every reader",
    cols: 3,
    rows: 3,
    nodeW: 400,
    nodeH: 110,
    nodes: [
      { id: "p", label: "<ThemeContext value={theme}>", c: 1, r: 0, tone: "amber" },
      { id: "l", label: "Layout\n(doesn't read it)", c: 0, r: 1 },
      { id: "s", label: "Sidebar\n(doesn't read it)", c: 2, r: 1 },
      { id: "b", label: "Button\nuseContext(ThemeContext)", c: 0, r: 2, tone: "green" },
      { id: "m", label: "Menu\nuseContext(ThemeContext)", c: 2, r: 2, tone: "green" },
    ],
    edges: [
      { from: "p", to: "l" },
      { from: "p", to: "s" },
      { from: "l", to: "b" },
      { from: "s", to: "m" },
    ],
    show: [["p", "l", "s"], ["b", "m"], []],
    overlay: { step: 2, text: "When value changes, every component that reads it re-renders: split contexts, memoise the value, or use a store with selectors", tone: "amber" },
    beats: B(
      "Here's the idea. A provider near the top holds a value, the theme. Layout and sidebar don't care about it, so they don't need it passed through their props.",
      "Deep down, any component that calls use context with that context reads the value directly. No prop drilling.",
      { say: "The cost: when the value changes, every component reading that context re-renders. And if the value is an object created fresh on every render of the provider, that's every time the provider renders. So split contexts by how often they change, memoise the value, or reach for a store with selectors.", tone: "key" },
    ),
  },
  qa(41, "What is the Context API, and when should you use it?", [
    "createContext + a Provider + useContext: share a value with a whole subtree",
    "For data many components need and that changes rarely: theme, user, locale, feature flags",
    "Not a state manager by itself: it only passes values down",
  ]),
  qa(42, "What are the pitfalls of Context, and how do you avoid unnecessary re-renders?", [
    "Every consumer re-renders whenever the value changes, even if it uses one field",
    "A new object as value each render ({ user, setUser }) re-renders consumers every time",
    "Fixes: useMemo the value, split state and dispatch contexts, split by topic, or a store with selectors",
  ]),
  qa(43, "How do you choose between local state, Context, and an external store like Redux or Zustand?", [
    "Local state first; lift it up when siblings share it",
    "Context for rarely-changing app-wide values",
    "A store (Zustand, Redux Toolkit) for big, frequently changing shared client state with selectors",
    "Server data belongs in a server-state library (TanStack Query), not in any of these",
  ]),
  custom(
    "pypipe",
    {
      title: "Redux: one store, one direction",
      stages: [
        { name: "UI", icon: "🖱️", sub: "dispatch(action)" },
        { name: "Action", icon: "📨", sub: "{ type, payload }" },
        { name: "Reducer", icon: "🧮", sub: "(state, action) → new state" },
        { name: "Store", icon: "🗄️", sub: "the single state tree" },
      ],
      steps: [
        { at: 0, text: "A component dispatches an action: { type: \"cart/added\", payload: item }." },
        { at: [1, 2], text: "The store passes the current state and the action to a pure reducer, which returns a new state, never mutating." },
        { at: 3, text: "The store saves the new state and notifies subscribers." },
        { at: 0, text: "Components re-render only if the slice they select (useSelector) changed. Middleware (thunks, RTK Query) handles async.", back: true },
      ],
    },
    B(
      "And Redux, the classic external store. A component dispatches an action, a plain object describing what happened.",
      "The store hands the current state and the action to a reducer, a pure function that returns a new state.",
      "The store keeps the new state, and notifies its subscribers.",
      { say: "And components re-render only when the slice they select actually changed. That one-way loop makes every change traceable, which is what Redux DevTools' time travel is built on. Today you'd write it with Redux Toolkit.", tone: "key" },
    ),
  ),
  qa(44, "What is Redux, and how does its data flow work?", [
    "A predictable store: the whole client state in one place, changed only by actions",
    "dispatch(action) → reducer(state, action) → new state → subscribed components update",
    "Redux Toolkit (createSlice, Immer, RTK Query) is the modern way; DevTools give time travel",
  ]),

  // ================================================================ module 6
  sec("6", "Patterns", "Module six. Patterns. Four questions about ways to share behaviour and structure between components."),
  qa(45, "What are higher-order components (HOCs)?", [
    "A function that takes a component and returns a new one with extra behaviour: withAuth(Page)",
    "Like decorators for components",
    "Mostly replaced by hooks: they hide where props come from and nest into wrapper hell",
  ]),
  qa(46, "What are render props?", [
    "A prop whose value is a function that returns UI: <Mouse render={(pos) => <Dot {...pos} />} />",
    "The component owns the logic; the caller decides what to render",
    "Also largely replaced by custom hooks",
  ]),
  qa(47, "What are error boundaries?", [
    "Components that catch errors thrown while rendering their children and show a fallback",
    "Class components with getDerivedStateFromError / componentDidCatch (or react-error-boundary)",
    "They don't catch errors in event handlers, async code or the boundary itself",
  ]),
  qa(48, "What are portals?", [
    "createPortal(children, domNode): render into a different DOM node, e.g. document.body",
    "For modals, tooltips and dropdowns that must escape overflow: hidden and z-index",
    "Events still bubble through the React tree, not the DOM tree",
  ]),

  // ================================================================ module 7
  sec("7", "Performance", "Module seven. Performance. Four questions, and one rule: measure first, then fix the thing you measured."),
  qa(49, "How do you optimise a React app's performance?", [
    "Measure with the React DevTools Profiler and Lighthouse before changing anything",
    "Fewer re-renders: keep state local, memo plus stable props, split contexts",
    "Less work: virtualise long lists, defer non-urgent updates, avoid heavy work in render",
    "Less code: code splitting, lazy loading, smaller dependencies, optimised images",
  ]),
  qa(50, "How do code splitting, React.lazy and Suspense work?", [
    "lazy(() => import(\"./Chart\")) loads the component's code only when it's first rendered",
    "<Suspense fallback={<Spinner />}> shows the fallback while it loads",
    "Split by route first: the biggest win for the least effort",
  ]),
  qa(51, "What is list virtualisation?", [
    "Render only the rows in view (plus a buffer), not all 10,000",
    "Spacers keep the scroll height right; rows are swapped as you scroll",
    "Libraries: TanStack Virtual, react-window",
  ]),
  qa(52, "What are useTransition and useDeferredValue?", [
    "useTransition: mark a state update as non-urgent; typing stays responsive while the heavy update renders",
    "useDeferredValue: a lagging copy of a value; render the expensive part with it",
    "Both rely on concurrent rendering: urgent updates interrupt the slow one",
  ]),
  check({
    topic: "performance",
    q: "Typing in a filter box is laggy because a 5,000-row table re-renders on every key. Name two fixes.",
    say: "Typing in a filter box is laggy, because a five thousand row table re-renders on every keystroke. Name two fixes.",
    a: "Virtualise the table; and/or render the table from useDeferredValue(filter) (or update it in startTransition) so typing stays urgent. Also memo the rows.",
    aSay: "Virtualise the table, so only the visible rows render. And render the table from a deferred copy of the filter, with use deferred value, or a transition, so typing stays urgent. Memoising rows helps too.",
  }),

  // ================================================================ module 8
  sec("8", "Modern React (18 and 19) and rendering strategies", "Module eight. Modern React, eighteen and nineteen, and where the HTML gets made. Six questions."),
  {
    kind: "compare",
    title: "The idea: where and when is the HTML made?",
    cols: [
      { title: "CSR", tone: "blue", items: ["In the browser, after JS loads", "Empty page first", "Dashboards behind login"] },
      { title: "SSR", tone: "cyan", items: ["On the server, per request", "Fresh, fast first paint", "Personalised pages"] },
      { title: "SSG", tone: "green", items: ["At build time, once", "Served from a CDN", "Docs, blogs, marketing"] },
      { title: "ISR", tone: "amber", items: ["Static, regenerated every N s", "Or on demand", "Product pages, catalogues"] },
    ],
    footer: "SSR, SSG and ISR all need hydration to become interactive",
    beats: B(
      "Here's the idea. Client-side rendering makes the HTML in the browser, after the JavaScript loads. The first response is an empty page. Fine for apps behind a login.",
      "Server-side rendering makes the HTML on the server, for every request. A fast, real first paint, and fresh data. Good for personalised pages that need SEO.",
      "Static generation makes it once, at build time, and serves it from a CDN. The fastest, for content that rarely changes.",
      "And incremental static regeneration is static pages that are rebuilt in the background, every so many seconds, or on demand.",
      { say: "And the three server options share one step: hydration, which turns the server's HTML into a working React app.", tone: "key" },
    ),
  },
  qa(53, "What is concurrent rendering in React 18?", [
    "React can prepare a render in the background and interrupt it for something more urgent",
    "Enabled by createRoot; used by transitions, useDeferredValue and Suspense",
    "Rendering must be pure, because a render can be started and thrown away",
  ]),
  qa(54, "What are CSR, SSR, SSG and ISR?", [
    "CSR: HTML built in the browser; SSR: on the server per request",
    "SSG: at build time; ISR: static, regenerated periodically or on demand",
    "Choose by freshness, SEO, personalisation and cost",
  ]),
  custom(
    "pypipe",
    {
      title: "Hydration: server HTML becomes a live app",
      stages: [
        { name: "Server renders", icon: "🖥️", sub: "HTML string" },
        { name: "Browser paints", icon: "👀", sub: "visible, not interactive" },
        { name: "JS loads", icon: "📦", sub: "the same components" },
        { name: "hydrateRoot", icon: "💧", sub: "attach to existing DOM" },
      ],
      steps: [
        { at: 0, text: "The server runs your components and sends real HTML." },
        { at: 1, text: "The browser shows it immediately: content is visible, but buttons don't work yet." },
        { at: 2, text: "The JavaScript bundle arrives, with the same components." },
        { at: 3, text: "React renders again in the browser and attaches event handlers to the existing DOM instead of rebuilding it." },
        { at: [0, 3], text: "If the browser's render differs (Date.now, Math.random, window checks), you get a hydration mismatch error.", fail: true },
      ],
    },
    B(
      "Hydration, step by step. The server runs your components and sends real HTML.",
      "The browser paints it right away. The user can see the content, but nothing is interactive yet.",
      "Then the JavaScript arrives, with the same components.",
      "React renders again in the browser, and instead of creating DOM, it attaches event handlers to the DOM that's already there. That's hydration.",
      { say: "Which is why the two renders must match. Using the current time, a random number, or checking window during render gives a different result in the browser, and React reports a hydration mismatch.", tone: "key" },
    ),
  ),
  qa(55, "What is hydration?", [
    "Making server-rendered HTML interactive by attaching React to it in the browser",
    "The client render must produce the same markup, or you get a mismatch",
    "Selective hydration with Suspense lets parts become interactive independently",
  ]),
  qa(56, "What are React Server Components?", [
    "Components that run only on the server: they can read the database directly, and ship no JS",
    "Client components ('use client') handle state, effects and events",
    "Server components can render client components and pass them serialisable props",
  ]),
  qa(57, "What is new in React 19?", [
    "Actions: async functions in transitions and <form action={fn}>; useActionState, useFormStatus",
    "useOptimistic for optimistic UI; use() to read promises and context",
    "ref as a normal prop; document metadata in components; Server Components stable",
  ]),
  qa(58, "How does Suspense work for data fetching?", [
    "A component that isn't ready suspends (a supporting library or use(promise) throws a promise)",
    "The nearest <Suspense> shows its fallback until the data is ready, then retries",
    "Lets you place loading states declaratively and stream server HTML in pieces",
  ]),
  check({
    topic: "hydration",
    q: "A component renders {new Date().toLocaleTimeString()} with SSR. What happens on load?",
    say: "A server-rendered component shows the current time, from new date. What happens when the page loads?",
    a: "A hydration mismatch: the server's time differs from the client's. Render it after mount (an effect) or suppress the warning for that node.",
    aSay: "A hydration mismatch. The server rendered one time, the browser renders a different one. Render the time only after mount, in an effect, or mark that one node to suppress the warning.",
  }),
];
