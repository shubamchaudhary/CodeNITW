import type { Scene } from "../../lib/types.ts";
import { B, custom, qa, sec } from "../web/h.ts";
import { check } from "./p1.ts";

// Part 4: module 9 (routing, testing and the rest), module 10 (practical
// React) and the close.
export const p4: Scene[] = [
  // ================================================================ module 9
  sec("9", "Routing, testing and the rest", "Module nine. Routing, testing and the rest. Eight questions that round out a React developer's toolkit."),
  qa(59, "How does client-side routing work in a single-page app?", [
    "The router listens to URL changes (the History API) instead of letting the browser reload",
    "<Link> calls history.pushState; the router renders the matching route's component",
    "The server must return index.html for every app URL (a fallback), or refreshes 404",
  ]),
  qa(60, "How do you implement protected routes?", [
    "A wrapper route checks the user; if not logged in, <Navigate to=\"/login\" replace />",
    "Remember where they were going and send them back after login",
    "It's only UX: the API must check authorisation on every request",
  ]),
  qa(61, "How do you test React applications?", [
    "Unit and component tests: Vitest or Jest with React Testing Library",
    "Test behaviour like a user: getByRole, userEvent, findBy for async; not internal state",
    "Mock the network with MSW; end-to-end flows with Playwright or Cypress",
  ], { code: `test("adds a todo", async () => {\n  render(<Todos />);\n  await userEvent.type(screen.getByRole("textbox"), "Milk");\n  await userEvent.click(screen.getByRole("button", { name: /add/i }));\n  expect(screen.getByText("Milk")).toBeInTheDocument();\n});` }),
  qa(62, "How do class lifecycle methods map to hooks?", [
    "componentDidMount → useEffect(…, [])",
    "componentDidUpdate → useEffect with dependencies",
    "componentWillUnmount → the effect's cleanup; shouldComponentUpdate → React.memo",
    "Think in synchronisation, not lifecycle moments",
  ]),
  qa(63, "Why shouldn't you define a component inside another component?", [
    "It's a new function on every render, so React sees a new type each time",
    "It unmounts and remounts the child on every render: state lost, inputs lose focus",
    "Define components at the top level; pass data through props",
  ]),
  qa(64, "What is the difference between server state and client state, and why use TanStack Query?", [
    "Client state: owned by the UI (open modal, form input). Server state: a cached copy of remote data",
    "Server state needs caching, deduplication, refetching, invalidation, retries, loading and error states",
    "TanStack Query does all of that: useQuery(['user', id], fetchUser), mutations with invalidation",
  ]),
  qa(65, "How does React protect against XSS, and where can it still happen?", [
    "Text in JSX is escaped automatically: a <script> in a string renders as text",
    "Still dangerous: dangerouslySetInnerHTML (sanitise with DOMPurify) and javascript: URLs in href",
    "Also server-rendered state injected into HTML, and third-party scripts",
  ]),
  qa(66, "How do you debug a React application?", [
    "React DevTools: inspect props, state and hooks; the Profiler for slow renders",
    "Browser DevTools: breakpoints, network, console; StrictMode warnings",
    "Error boundaries plus monitoring (Sentry) in production; source maps",
  ]),

  // ================================================================ module 10
  sec("10", "Practical React", "Module ten. Practical React. Fourteen questions from real projects, starting with the full journey of a setState call."),
  custom(
    "pypipe",
    {
      title: "What happens when you call setCount(5)",
      stages: [
        { name: "Queue update", icon: "📥", sub: "on the component" },
        { name: "Schedule", icon: "🗓️", sub: "batch, prioritise" },
        { name: "Render", icon: "🧮", sub: "call the component" },
        { name: "Commit", icon: "🖊️", sub: "update the DOM" },
        { name: "Effects", icon: "🔔", sub: "cleanup, then run" },
      ],
      steps: [
        { at: 0, text: "The update is queued on the component's hook. If the new value is the same (Object.is), React may skip the render." },
        { at: 1, text: "React schedules a render: updates in the same event are batched; transitions get lower priority." },
        { at: 2, text: "Render: React calls your component; useState now returns 5. Children re-render too; React diffs the result." },
        { at: 3, text: "Commit: the DOM changes are applied, refs attached, layout effects run; the browser paints." },
        { at: 4, text: "Effects whose dependencies changed run their previous cleanup, then the new effect." },
      ],
    },
    B(
      "Here's the full journey of a state update, which is question seventy one, and a favourite. First, the update is queued on that component's hook. If the new value is the same as the old one, React can bail out entirely.",
      "Then React schedules a render. Updates from the same event are batched into one, and transitions get lower priority than typing.",
      "Then the render. React calls your component again, and this time use state returns five. Its children re-render too, and React diffs the new elements against the old.",
      "Then the commit. DOM changes are applied, refs are attached, layout effects run, and the browser paints.",
      { say: "Finally, effects whose dependencies changed run their cleanup, then run again. Queue, schedule, render, commit, effects.", tone: "key" },
    ),
  ),
  qa(67, "What does it mean that components must be pure?", [
    "Same props and state → same JSX; no side effects while rendering",
    "Don't mutate props, state or outside variables, fetch or subscribe during render",
    "React may render twice, pause or discard a render: impure code breaks",
  ]),
  qa(68, "What is prop drilling, and how do you avoid it?", [
    "Passing props through many layers that don't use them, just to reach a deep child",
    "Fixes: composition (pass components as children), Context, or a store",
    "A few levels of props is fine and explicit",
  ]),
  qa(69, "What causes \"Too many re-renders\" and infinite effect loops?", [
    "Calling a setter during render: onClick={setOpen(true)} instead of onClick={() => setOpen(true)}",
    "An effect that sets state it depends on, with no condition",
    "Dependencies that are new every render (objects, arrays, inline functions)",
  ]),
  qa(70, "Why can't the useEffect callback be async, and how do you use async code inside it?", [
    "An async function returns a promise, but an effect must return nothing or a cleanup function",
    "Define an async function inside the effect and call it",
    "Use a flag or AbortController so a late result can't update after cleanup",
  ], { code: `useEffect(() => {\n  let alive = true;\n  async function load() {\n    const data = await getUser(id);\n    if (alive) setUser(data);\n  }\n  load();\n  return () => { alive = false; };\n}, [id]);` }),
  qa(71, "What is the full flow when a useState setter is called?", [
    "Queue the update → schedule (batch, priority) → render (call the component, diff)",
    "→ commit (DOM, refs, layout effects) → paint → passive effects (cleanup, then run)",
    "Same value → React can skip the re-render",
  ]),
  qa(72, "How do you implement infinite scroll in React?", [
    "An IntersectionObserver on a sentinel element at the bottom of the list",
    "When it becomes visible, fetch the next page (cursor-based), guard against duplicate loads",
    "useInfiniteQuery handles pages; virtualise once the list gets long",
  ]),
  qa(73, "How do you handle authentication in a React SPA?", [
    "Prefer an HttpOnly, Secure cookie session (scripts can't read it); or short-lived tokens in memory plus a refresh cookie",
    "Avoid long-lived tokens in localStorage: any XSS can steal them",
    "Keep the user in context; protected routes; the server checks every request",
  ]),
  qa(74, "How do you type React components with TypeScript?", [
    "Type props with an interface: function Button({ label }: ButtonProps)",
    "children: React.ReactNode; events: React.ChangeEvent<HTMLInputElement>",
    "useState<User | null>(null); generic components; ComponentProps<\"button\"> to extend native props",
  ]),
  qa(75, "What are the main ways to style React components?", [
    "Plain CSS / CSS Modules (scoped class names)",
    "Utility-first: Tailwind",
    "CSS-in-JS: styled-components, Emotion (runtime cost; awkward with Server Components)",
    "Component libraries: MUI, shadcn/ui, Radix primitives",
  ]),
  qa(76, "What is Vite, and why is it faster than older setups like Create React App?", [
    "Dev server serves native ES modules: no full bundle before starting",
    "Pre-bundles dependencies with esbuild; instant hot module replacement",
    "Production build with Rollup; Create React App is deprecated",
  ]),
  qa(77, "What is Next.js, and when would you choose it over plain React?", [
    "A React framework: file-based routing, SSR/SSG/ISR, Server Components, API routes, image optimisation",
    "Choose it for SEO, fast first loads, content sites, full-stack apps",
    "Plain React plus Vite for dashboards and apps behind a login",
  ]),
  qa(78, "What is the compound component pattern?", [
    "Components that work together sharing implicit state: <Tabs><Tabs.List/><Tabs.Panel/></Tabs>",
    "The parent holds state in context; the children read it",
    "A flexible, readable API for UI kits (Radix, Headless UI)",
  ]),
  qa(79, "What are the basics of accessibility (a11y) in React?", [
    "Semantic HTML first: button, label, nav, headings, alt text",
    "Keyboard support and visible focus; manage focus in modals",
    "ARIA only when needed (aria-label, aria-expanded); htmlFor; test with axe and a screen reader",
  ]),
  qa(80, "How would you structure a medium-to-large React project?", [
    "Group by feature: features/cart/{components, hooks, api, types}",
    "Shared UI components, lib/ for utilities, one API layer",
    "Absolute imports, clear boundaries, tests next to the code",
  ]),
  check({
    topic: "practical",
    q: "<button onClick={setOpen(true)}>Open</button> crashes with “Too many re-renders”. Why?",
    say: "A button has on click equals set open true, called directly. It crashes with too many re-renders. Why?",
    a: "setOpen(true) runs during render, which triggers a render, which runs it again. Pass a function: onClick={() => setOpen(true)}.",
    aSay: "Because set open true runs during render, which triggers another render, which runs it again, forever. Pass a function instead: an arrow that calls set open.",
  }),

  // ================================================================ close
  {
    kind: "drill",
    items: [
      { q: "UI = f(?)", a: "state (and props)" },
      { q: "Why not the index as key?", a: "Reorders attach state to the wrong rows" },
      { q: "console.log after setState shows?", a: "The old value: state is a snapshot" },
      { q: "Why can't hooks go in an if?", a: "React matches hooks by call order" },
      { q: "useEffect vs useLayoutEffect?", a: "After paint vs before paint" },
      { q: "Does a child re-render when its parent does?", a: "Yes, unless memoised with stable props" },
    ],
    beats: B(
      { say: "A last rapid-fire round. UI equals f of what?", hold: 3 },
      "Of the state, and props.",
      { say: "Why not use the index as a key?", hold: 3 },
      "Because reordering attaches state to the wrong rows.",
      { say: "What does console log show right after set state?", hold: 3 },
      "The old value. State is a snapshot.",
      { say: "Why can't a hook go inside an if?", hold: 3 },
      "Because React matches hooks by their call order.",
      { say: "Use effect versus use layout effect?", hold: 3 },
      "After paint, versus before paint.",
      { say: "Does a child re-render when its parent does?", hold: 3 },
      "Yes, unless it's memoised and its props are stable.",
    ),
  },
  {
    kind: "bullets",
    title: "Where to go from here",
    items: [
      { icon: "📖", text: "Each module page starts this lecture at its own part", sub: "rewatch exactly what you need" },
      { icon: "🧠", text: "Read the module's theory, then the answers", sub: "the same pictures as here" },
      { icon: "⌨️", text: "Build the small things yourself", sub: "a custom hook, a debounced search, a fetch with cleanup" },
    ],
    beats: B(
      "That's the whole React page. Each module page has a watch card that starts this lecture at that module.",
      "Read the module's theory first, then the answers.",
      { say: "And build the small things yourself: a custom hook, a debounced search, an effect that fetches and cleans up. Interviewers love asking you to write those live. Good luck.", tone: "key" },
    ),
  },
];
