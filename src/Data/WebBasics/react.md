## React fundamentals

### re01 | What is React, and why use it?

React is a **JavaScript library for building user interfaces** out of **components**. It handles the view layer only; routing, data fetching and so on come from other libraries or a framework like Next.js.

Core ideas:
- **Declarative**: you describe *what* the UI should look like for a given state, `UI = f(state)`. React works out the DOM changes. No manual `appendChild`/`classList` bookkeeping.
- **Component-based**: small, reusable, composable pieces (`<Button>`, `<Cart>`), each with its own logic and markup.
- **One-way data flow**: data goes down through props; changes go up through callbacks. That makes the data flow predictable.
- **Efficient updates**: React re-renders components to a lightweight description (elements), **diffs** it against the previous one, and applies only the minimal real DOM changes.

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

Downsides worth admitting: it's only a library (you choose the rest of the stack), JSX and the build tooling, and performance work (memoisation) is sometimes needed for large trees.

### re02 | What is JSX, and what does it compile to?

**JSX** is a syntax extension that lets you write HTML-like markup inside JavaScript. Browsers don't understand it; a compiler (Babel, SWC, esbuild) turns it into function calls that create **React elements** (plain objects).

```jsx
const el = <h1 className="title">Hello {name}</h1>;

// compiles to (new JSX transform, React 17+):
import { jsx as _jsx } from "react/jsx-runtime";
const el = _jsx("h1", { className: "title", children: ["Hello ", name] });

// which produces a plain object, roughly:
// { type: "h1", props: { className: "title", children: [...] }, key: null }
```

JSX rules:
- Return **one root** element (or a fragment `<>...</>`).
- **Close every tag**: `<img />`, `<br />`.
- **camelCase** attributes: `className`, `htmlFor`, `onClick`, `tabIndex`; `style` takes an object: `style={{ fontSize: 14 }}`.
- `{}` embeds any JS **expression** (not statements like `if`/`for`).
- Component names must start with a **capital letter**: `<MyCard />`. Lowercase means an HTML tag.
- Values in `{}` are **escaped**, which protects against XSS.

### re03 | What is the difference between a React element, a component and a node?

- **Component**: a **function** (or class) that takes props and returns UI. `function Card(props) { ... }`.
- **Element**: an immutable **plain object** describing what to render, created by JSX. `<Card title="x" />` is an element `{ type: Card, props: { title: "x" } }`. It's cheap to create and is *not* the DOM node.
- **Node** (`ReactNode`): anything React can render: elements, strings, numbers, arrays of nodes, `null`, `undefined`, booleans (the last three render nothing).

```jsx
function Card({ title }) {           // component
  return <div>{title}</div>;         // returns an element
}
const el = <Card title="Hi" />;      // element (React hasn't called Card yet)
```

React calls the component when it **renders** the element. A component returns elements, React turns elements into **fibers** (its internal work units), and then into real **DOM nodes**.

### re04 | What is the difference between props and state?

| | Props | State |
|---|---|---|
| Owned by | the **parent** (passed in) | the **component itself** |
| Mutable by the component | **no** (read-only) | yes, via the setter |
| Purpose | configure a component from outside | remember data that changes over time |
| Changing it | the parent re-renders with new props | `setState` triggers a re-render |

```jsx
function Parent() {
  const [count, setCount] = useState(0);                 // state lives here
  return <Child count={count} onInc={() => setCount((c) => c + 1)} />;
}
function Child({ count, onInc }) {                       // props: read-only
  return <button onClick={onInc}>{count}</button>;
}
```

Both trigger re-renders when they change. Rule: keep state as **low** as possible but as **high** as necessary (in the nearest common parent of every component that needs it), and pass it down as props.

### re05 | What is one-way data flow, and what does "lifting state up" mean?

**One-way data flow**: data moves **down** the tree through props. A child can't change a parent's data directly. It calls a **callback** the parent passed down, and the parent updates its own state. Data changes happen in a predictable place.

**Lifting state up**: when two siblings need the same data, move the state to their **closest common parent** and pass it down.

```jsx
function TemperatureApp() {
  const [celsius, setCelsius] = useState(0);   // lifted to the parent
  return (
    <>
      <CelsiusInput value={celsius} onChange={setCelsius} />
      <Fahrenheit value={celsius * 9 / 5 + 32} />
    </>
  );
}
function CelsiusInput({ value, onChange }) {
  return <input type="number" value={value} onChange={(e) => onChange(+e.target.value)} />;
}
```

There's then a **single source of truth**, so the siblings can never disagree. When lifting gets too deep (prop drilling), consider composition or Context.

### re06 | How does composition work with props.children?

React favours **composition over inheritance**: build components by nesting them, not by extending classes. `children` is whatever you put between the opening and closing tags.

```jsx
function Card({ title, children, footer }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="body">{children}</div>
      {footer && <div className="footer">{footer}</div>}
    </div>
  );
}

<Card title="Profile" footer={<button>Save</button>}>
  <p>Any content here</p>
  <Avatar />
</Card>
```

Uses: layouts, modals, wrappers (`<ThemeProvider>`), and "slots" (passing elements as named props like `footer`). Composition also **avoids prop drilling**: the parent renders `<Layout><Sidebar user={user} /></Layout>`, so `Layout` never needs to know about `user`.

### re07 | What are fragments, and how do you render conditionally?

**Fragments** group elements without adding an extra DOM node:

```jsx
return (
  <>
    <td>A</td>
    <td>B</td>
  </>
);
// <React.Fragment key={id}> when you need a key (lists)
```

Conditional rendering patterns:

```jsx
// if / early return
if (loading) return <Spinner />;

// ternary
{isLoggedIn ? <Dashboard /> : <Login />}

// && (render or nothing)
{items.length > 0 && <List items={items} />}

// careful: 0 && <X/> renders "0"!
{count && <Badge />}        // shows 0 when count is 0
{count > 0 && <Badge />}    // correct

// lookup object for many cases
const views = { list: <ListView />, grid: <GridView /> };
{views[mode]}
```

Returning `null` renders nothing, but the component still mounts and runs its hooks.

### re08 | Why are keys needed in lists?

Keys tell React **which item is which** between renders, so it can match old and new children correctly when a list **changes** (insert, delete, reorder).

```jsx
<ul>
  {todos.map((todo) => (
    <TodoItem key={todo.id} todo={todo} />
  ))}
</ul>
```

Without stable keys, React matches children **by position**. Insert an item at the top and every item "becomes" the next one, so React re-renders (or worse, reuses the wrong state) for all of them.

Rules:
- Unique **among siblings** (not globally).
- **Stable**: the same item keeps the same key across renders. Use the database ID.
- Never generate keys during render (`Math.random()`, `crypto.randomUUID()` inside map): every render would remount every item.
- `key` isn't passed to the component as a prop.

### re09 | What goes wrong when you use the array index as the key?

Index keys break when the list can be **reordered, filtered, or have items inserted or removed anywhere except the end**: the key stays with the **position**, not the **item**.

```jsx
// list: [A, B, C] with keys 0, 1, 2. Delete A -> [B, C] with keys 0, 1
// React thinks: key 0 changed from A to B, key 1 from B to C, key 2 was deleted
```

Consequences:
- **Wrong state stays with the wrong row**: each item has an `<input>` or checkbox (uncontrolled or local state); after a delete, the text typed into A's input appears on B.
- Unnecessary re-renders of every item after the change.
- Broken animations and focus.

Index keys are fine **only** when the list is static: never reordered or filtered, items never inserted or deleted in the middle, and items have no state. Otherwise use a stable ID.

### re10 | What is the difference between function and class components?

```jsx
// class component (legacy)
class Counter extends React.Component {
  state = { count: 0 };
  componentDidMount() { document.title = `${this.state.count}`; }
  render() {
    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>{this.state.count}</button>;
  }
}

// function component + hooks (modern)
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = `${count}`; }, [count]);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

Why function components won:
- Less boilerplate: no `this`, no binding methods.
- **Hooks** let you share stateful logic through custom hooks (classes needed HOCs or render props).
- Related logic stays together instead of being split across lifecycle methods.
- Concurrent features and the React Compiler target function components.

Classes are still needed for one thing: **error boundaries** (`componentDidCatch` / `getDerivedStateFromError`), though libraries wrap that for you.

## State and events

### re11 | How does useState work?

`useState` adds a piece of state to a function component. It returns the **current value** and a **setter**.

```jsx
const [count, setCount] = useState(0);              // initial value
const [user, setUser] = useState(() => loadUser()); // lazy init: runs only on the first render

setCount(5);                    // replace the value
setCount((prev) => prev + 1);   // updater function: based on the latest value
```

How it works:
- React stores state **outside** your function, attached to the component's fiber, in a list ordered by the **call order of the hooks**. That's why hooks can't be called conditionally.
- Calling the setter **schedules** a re-render. It doesn't change the variable in the current render.
- If the new value is the **same** (`Object.is`) as the current one, React skips the re-render.
- The initial value only matters on the first render. Changing it later does nothing; use a `key` to reset.

For complex state with many related fields or transitions, use `useReducer`.

### re12 | Why does console.log show the old value right after setState?

Because **state is a snapshot**. Each render has its own fixed `count`. Calling `setCount` asks React to render **again** with a new value; it doesn't change the `count` variable in the render that's already running.

```jsx
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  console.log(count);        // 0, still this render's snapshot
  setCount(count + 1);
  setCount(count + 1);       // all three compute 0 + 1, so the result is 1, not 3
}

function handleClickFixed() {
  setCount((c) => c + 1);    // updater functions queue up and use the latest value
  setCount((c) => c + 1);
  setCount((c) => c + 1);    // result: 3
}
```

The same snapshot rule explains **stale closures**: a timeout or async callback created during render N sees render N's state, even if it runs later.

To act on the new value, compute it first (`const next = count + 1; setCount(next); use(next);`), or react to it in an effect.

### re13 | What is batching in React?

**Batching**: React groups several state updates into **one re-render** instead of rendering after each one.

```jsx
function handleClick() {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  setName("A");
  // ONE re-render, not three
}
```

- **Before React 18**: batching happened only inside React event handlers. Updates in `setTimeout`, promises or native listeners caused **one render each**.
- **React 18+ (automatic batching)**: updates are batched **everywhere**: timeouts, promises, `fetch().then`, native events.

```jsx
fetch("/api").then(() => {
  setData(d);
  setLoading(false);   // React 18: one render
});
```

To force an immediate synchronous render (rarely needed, e.g. to measure the DOM right after an update): `flushSync(() => setX(1))` from `react-dom`.

### re14 | Why must you never mutate state directly?

React decides whether to re-render by comparing the old and new state **by reference** (`Object.is`). If you mutate the same object, the reference doesn't change, so React may **skip the update**, and anything that relies on reference changes (memo, effects with deps) breaks.

```jsx
// WRONG
const [user, setUser] = useState({ name: "A", tags: [] });
user.name = "B";
setUser(user);                 // same reference -> no re-render

// RIGHT: create new objects and arrays
setUser({ ...user, name: "B" });
setUser((u) => ({ ...u, tags: [...u.tags, "new"] }));         // add
setItems((items) => items.filter((i) => i.id !== id));        // remove
setItems((items) => items.map((i) => (i.id === id ? { ...i, done: true } : i))); // update one
setUser((u) => ({ ...u, address: { ...u.address, city: "Pune" } }));  // nested update
```

Immutability also gives you cheap change detection, time-travel debugging and predictable renders. For deeply nested updates, **Immer** (built into Redux Toolkit) lets you write "mutating" code that produces immutable copies.

### re15 | How do events work in React (SyntheticEvent)?

React event handlers are camelCase props that take **functions**:

```jsx
<button onClick={handleClick}>Save</button>          // pass the function
<button onClick={handleClick()}>Save</button>        // WRONG: calls it during render
<button onClick={() => remove(item.id)}>Delete</button> // pass arguments with an arrow
```

- Handlers receive a **SyntheticEvent**: React's cross-browser wrapper with the same interface as native events (`e.target`, `e.preventDefault()`, `e.stopPropagation()`). The native one is at `e.nativeEvent`.
- React uses **event delegation**: one listener per event type on the **root container** (since React 17), not on every element.
- Events still bubble through the **React tree** (even through portals).
- `onChange` on inputs fires on **every keystroke** (like the native `input` event), not on blur.
- To stop the default action you must call `e.preventDefault()`; `return false` doesn't work.

### re16 | What is the difference between controlled and uncontrolled components?

**Controlled**: React state is the **single source of truth** for the input's value.

```jsx
function NameForm() {
  const [name, setName] = useState("");
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

You can validate, format or disable on every keystroke, and the value is always in state.

**Uncontrolled**: the **DOM** keeps the value; you read it when needed through a `ref` or the form data.

```jsx
function QuickForm() {
  const inputRef = useRef(null);
  const submit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value);
    // or: new FormData(e.currentTarget).get("email")
  };
  return (
    <form onSubmit={submit}>
      <input name="email" ref={inputRef} defaultValue="" />
    </form>
  );
}
```

| | Controlled | Uncontrolled |
|---|---|---|
| Value lives in | React state | DOM |
| Re-renders per keystroke | yes | no |
| Live validation | easy | harder |
| Good for | most forms, dependent fields | simple forms, file inputs (always uncontrolled), big forms (React Hook Form) |

Don't switch an input from uncontrolled to controlled: `value={undefined}` becoming a string triggers a warning. Initialise with `""`.

### re17 | How do you handle forms in React?

```jsx
function SignupForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  // one handler for every field, using the input's name
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();                       // stop the page reload
    const errs = validate(form);
    if (Object.keys(errs).length) return setErrors(errs);
    await api.signup(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={form.email} onChange={handleChange} />
      {errors.email && <span>{errors.email}</span>}
      <input name="password" type="password" value={form.password} onChange={handleChange} />
      <button type="submit">Sign up</button>
    </form>
  );
}
```

For larger forms, use **React Hook Form** (uncontrolled inputs, few re-renders) with a schema validator like **Zod**. React 19 adds **form Actions**: `<form action={fn}>` with `useActionState` and `useFormStatus` for pending and error state.

## Rendering and reconciliation

### re18 | What triggers a re-render in React?

A component re-renders when:
1. **Its state changes** (`setState` with a different value).
2. **Its parent re-renders**. By default **all children re-render**, whether or not their props changed.
3. **A context it consumes** (`useContext`) changes value.
4. (A custom hook it uses changes state; that's really case 1.)

**Props changing is not itself the trigger**: props only change because the parent re-rendered.

```jsx
function Parent() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>+</button>
      <ExpensiveChild />   {/* re-renders on every click, even with no props */}
    </>
  );
}
```

Ways to avoid unnecessary re-renders: move the state down into a smaller component; pass the child as `children` from above (it's then created by a component that didn't re-render); or `React.memo` the child.

"Re-render" means React **calls your function again** and diffs the result. It doesn't necessarily touch the DOM: if nothing changed, the DOM is untouched.

### re19 | What are the render and commit phases?

Every update goes through two phases:

1. **Render phase**: React **calls your components** to get new elements, then **diffs** them against the previous tree (reconciliation) to work out the changes.
   - Must be **pure**: no side effects, no DOM mutation, no subscriptions.
   - Can be **paused, interrupted, restarted or thrown away** (concurrent rendering), and runs twice in StrictMode during development.

2. **Commit phase**: React **applies the changes to the real DOM** in one go, then runs effects:
   - DOM mutations
   - Refs are attached
   - `useLayoutEffect` runs (synchronously, **before** the browser paints)
   - The browser paints
   - `useEffect` runs (after the paint)

The commit phase is **synchronous and can't be interrupted**, so users never see a half-updated UI.

That's why side effects go in **effects or event handlers**, never in the component body: the render phase may run more times than you expect.

### re20 | What is the virtual DOM, and how does it help?

The **virtual DOM** is React's lightweight, in-memory **JavaScript description of the UI**: a tree of plain objects (elements), not real DOM nodes.

On every update:
1. React builds a new virtual tree by rendering components.
2. It **compares** the new tree with the **previous virtual tree** (diffing / reconciliation).
3. It applies **only the necessary changes** to the real DOM, in a batch.

```jsx
// before: <ul><li>A</li><li>B</li></ul>
// after:  <ul><li>A</li><li>B</li><li>C</li></ul>
// DOM work: append one <li>C</li>; nothing else is touched
```

Why it helps:
- Real DOM operations (and the layout or paint they trigger) are expensive; JS object comparisons are cheap.
- You write declarative "render everything" code, and React turns it into minimal imperative updates.

Nuance: the virtual DOM isn't "faster than the DOM". Carefully written manual DOM code can be faster. Its value is making **declarative UI fast enough by default**. React compares old vs new **virtual** trees; it never diffs against the real DOM.

### re21 | What is reconciliation, and what are the diffing rules?

**Reconciliation** is how React compares the new element tree with the **previous** one (both virtual) to decide the minimum DOM updates. A perfect tree diff is O(n³), so React uses **heuristics** that make it O(n):

1. **Different element type → replace the whole subtree.** `<div>` → `<span>`, or `<Article>` → `<Comment>`: React **unmounts** the old one (destroying its state) and mounts the new one fresh.
2. **Same DOM element type → keep the node, update the changed attributes.** `<div className="a">` → `<div className="b">` only changes `className`.
3. **Same component type → keep the instance and its state**, re-render it with the new props.
4. **Lists → match children by `key`** (or by position if there are no keys).

```jsx
// condition flips: same type in the same position -> state is KEPT
{isAdmin ? <Profile role="admin" /> : <Profile role="user" />}

// different types -> state is RESET
{isAdmin ? <AdminPanel /> : <UserPanel />}
```

Practical consequences: don't define components **inside** other components (a new function type on every render means a remount and lost state every time), and use `key` deliberately to keep or reset state.

### re22 | How do you reset a component's state with key?

React keeps a component's state while the **same type stays in the same position with the same key**. Changing the `key` makes React treat it as a **different component**: the old one unmounts (state discarded) and a fresh one mounts.

```jsx
function ChatPage({ contactId }) {
  // Without the key, switching contacts would keep the previous draft message in state.
  return <ChatBox key={contactId} contactId={contactId} />;
}

function ChatBox({ contactId }) {
  const [draft, setDraft] = useState("");   // reset for every new contact
  return <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />;
}
```

This is cleaner than an effect that calls `setDraft("")` when `contactId` changes (an extra render, and a flash of stale state).

Also use it for: resetting a form after submit (`key={submissionCount}`), or restarting an animation.

### re23 | What is React Fiber?

**Fiber** is React's reconciliation engine, rewritten in React 16. A "fiber" is a JS object representing **one unit of work**: a component or element, with its state, props, hooks and links to its parent, child and sibling.

Why it was built: the old "stack reconciler" rendered the whole tree **recursively and synchronously**. A big update blocked the main thread, so typing and animations stuttered.

What Fiber enables:
- **Incremental rendering**: rendering is split into small units of work that can **pause and resume**, yielding to the browser between them.
- **Priorities**: urgent updates (typing, clicks) can interrupt less urgent ones (rendering a big filtered list).
- **Concurrent features**: `useTransition`, `useDeferredValue`, `Suspense`, streaming SSR.
- Error boundaries and fragments returned from render.

Mental model: Fiber turns rendering from one uninterruptible call stack into a **linked list of work items** that React's scheduler can process in chunks. Only the render phase is interruptible; the commit phase is still synchronous.

### re24 | What does React.StrictMode do?

`<StrictMode>` is a **development-only** tool that surfaces bugs early. It renders nothing visible and has no effect in production.

In development it:
- **Renders components twice** to expose impure render logic (side effects in render, mutations).
- **Runs effects twice on mount** (mount → unmount → mount) to expose **missing cleanup**. If your subscription doubles or a connection isn't closed, your effect has no proper cleanup.
- Warns about deprecated APIs (legacy lifecycles, string refs, `findDOMNode`).

```jsx
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

The "why does my effect fetch twice in dev?" question: that's StrictMode. The fix is not to disable it but to make the effect safe to run twice (clean up, or ignore stale results with an AbortController). In production it runs once.

### re25 | What is React.memo?

`React.memo` wraps a component so it **skips re-rendering when its props are shallowly equal** to the last render's props.

```jsx
const UserRow = React.memo(function UserRow({ user, onSelect }) {
  console.log("render", user.id);
  return <li onClick={() => onSelect(user.id)}>{user.name}</li>;
});

function List({ users }) {
  const [filter, setFilter] = useState("");
  // without useCallback, a new function every render breaks memo
  const handleSelect = useCallback((id) => select(id), []);
  return users.map((u) => <UserRow key={u.id} user={u} onSelect={handleSelect} />);
}
```

- The comparison is **shallow** (`Object.is` per prop). New objects, arrays or functions created during the parent's render **defeat** it, so pair it with `useMemo`/`useCallback` for those props.
- It doesn't block re-renders caused by the component's **own state** or **context** changes.
- An optional second argument is a custom compare: `memo(Comp, (prev, next) => prev.id === next.id)`.

Use it for components that are **expensive to render** and often get the same props. Wrapping everything adds comparison overhead and noise. (The React Compiler can memoise automatically.)

## Hooks

### re26 | What are hooks, and why were they introduced?

**Hooks** are functions (`useState`, `useEffect`, `useContext`, …) that let function components **use state and other React features**. They were added in React 16.8.

Problems they solved (from the class era):
- **Reusing stateful logic** required HOCs or render props, which led to "wrapper hell". Hooks share logic through **custom hooks**.
- **Related logic was split** across lifecycle methods (subscribe in `componentDidMount`, unsubscribe in `componentWillUnmount`), while unrelated logic was mixed together. With hooks, each concern sits in one effect.
- **`this` confusion** and method binding.

```jsx
function useOnlineStatus() {                 // a reusable custom hook
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}
```

Common hooks: `useState`, `useReducer`, `useEffect`, `useLayoutEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useId`, `useTransition`, `useDeferredValue`; in React 19: `use`, `useActionState`, `useOptimistic`, `useFormStatus`.

### re27 | What are the rules of hooks, and why do they exist?

1. **Only call hooks at the top level**: not inside loops, conditions, nested functions, or after an early `return`.
2. **Only call hooks from React function components or custom hooks**, not from regular functions or classes.

Why: React doesn't know hooks by name. It stores each component's hook state in a **list** and matches the calls **by order**: the 1st `useState` call gets slot 1, the 2nd gets slot 2, and so on. If a condition skips a hook on some renders, every later hook reads **another hook's state**.

```jsx
// WRONG
function Profile({ user }) {
  if (!user) return null;                 // early return BEFORE hooks
  const [tab, setTab] = useState("info"); // called on some renders only
}

// RIGHT
function Profile({ user }) {
  const [tab, setTab] = useState("info");
  if (!user) return null;
  // ...
}

// conditional logic goes INSIDE the hook
useEffect(() => {
  if (!user) return;
  track(user.id);
}, [user]);
```

The `eslint-plugin-react-hooks` lint rules (`rules-of-hooks`, `exhaustive-deps`) catch these. The new `use()` API is the one exception that may be called conditionally.

### re28 | What is useEffect for?

`useEffect` **synchronises a component with something outside React**: network requests, subscriptions, timers, browser APIs, third-party widgets, the document title.

```jsx
useEffect(() => {
  // runs AFTER React commits and the browser paints
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();      // cleanup
}, [roomId]);                          // re-run when roomId changes
```

The mental model: don't think in lifecycles ("on mount"); think "**keep X in sync with these values**". React runs the effect after a render whose deps changed, and runs the **cleanup** before the next run and on unmount.

What it's **not** for:
- Computing values from props or state: calculate them during render.
- Handling user events (a click → API call belongs in the event handler).
- Resetting state when a prop changes: use `key`.

Effects run **only on the client** (not during SSR), and twice on mount in StrictMode (development) to check your cleanup.

### re29 | How does the dependency array of useEffect work?

```jsx
useEffect(() => { /* ... */ });            // no array: runs after EVERY render
useEffect(() => { /* ... */ }, []);        // empty: runs once after mount (+ cleanup on unmount)
useEffect(() => { /* ... */ }, [a, b]);    // runs after mount and whenever a or b changed
```

- React compares each dependency with its previous value using **`Object.is`** (reference equality for objects and functions).
- **Every reactive value used inside the effect** (props, state, and functions or values derived from them during render) must be listed. Leaving one out causes **stale values**; the `exhaustive-deps` lint rule warns you.
- Objects or functions created during render are **new every render**, so they make the effect run every time:

```jsx
const options = { roomId };                // new object every render
useEffect(() => connect(options), [options]); // runs on every render!

// fix: depend on primitives, or create the object inside the effect
useEffect(() => {
  const options = { roomId };
  connect(options);
}, [roomId]);
```

Don't silence the lint rule to "run it once"; restructure the code instead (move values inside the effect, use updater functions, or `useCallback`/`useMemo`).

### re30 | Why does useEffect need a cleanup function?

The function you **return** from an effect is the **cleanup**. React calls it:
- **before re-running** the effect (when deps change), and
- when the component **unmounts**.

It undoes whatever the effect set up, so you don't get leaks, duplicate subscriptions or updates after unmount.

```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  window.addEventListener("resize", onResize);
  const unsubscribe = store.subscribe(onChange);
  return () => {
    clearInterval(id);
    window.removeEventListener("resize", onResize);
    unsubscribe();
  };
}, []);
```

Order when `roomId` changes from "a" to "b": render with "b" → commit → **cleanup with "a"** (the old closure) → effect with "b".

Without cleanup: intervals pile up, listeners multiply, sockets stay open, and `setState` gets called on unmounted components. StrictMode's double-mount exists to catch exactly this.

### re31 | What is the difference between useEffect and useLayoutEffect?

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Runs | **after the browser paints** (asynchronously) | **after DOM changes, before paint** (synchronously) |
| Blocks painting | no | **yes** |
| Use for | almost everything: data fetching, subscriptions, logging | **measuring the DOM** and changing it before the user sees anything (tooltip positioning, scroll position) |

```jsx
function Tooltip({ targetRect, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(ref.current.getBoundingClientRect().height); // measure before paint
  }, []);

  const top = targetRect.top - height;   // no flicker at the wrong position
  return <div ref={ref} style={{ top }}>{children}</div>;
}
```

With `useEffect` here, the user might see the tooltip **flicker** at the wrong position for one frame. Default to `useEffect`, and switch to `useLayoutEffect` only to fix visible flicker; it can hurt performance. It doesn't run on the server.

### re32 | What is a stale closure in React, and how do you fix it?

Every render creates **new functions that close over that render's props and state**. If a function from an **old render** runs later (in a timer, a subscription, or an effect with missing deps), it sees **old values**.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);      // `count` is always 0 here (from the first render)
    }, 1000);
    return () => clearInterval(id);
  }, []);                        // count is missing from the deps -> stale

  return <h1>{count}</h1>;       // stuck at 1
}
```

Fixes:
1. **Updater function**, so you don't need to read the state at all:
   ```jsx
   setCount((c) => c + 1);
   ```
2. **Add the dependency**: `[count]`. Correct, but it re-creates the interval every tick.
3. **A ref for the latest value**, when a long-lived callback must read current state without re-subscribing:
   ```jsx
   const latest = useRef(count);
   latest.current = count;           // update after each render (or in an effect)
   // inside the long-lived callback: read latest.current
   ```
4. `useReducer`: `dispatch` is stable, and the reducer always gets the current state.

Stale closures are the most common hooks bug in interviews. Explain it as "each render's functions see that render's snapshot".

### re33 | How do you fetch data in an effect correctly, including race conditions?

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setUser)
      .catch((e) => { if (e.name !== "AbortError") setError(e); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();   // cancel when userId changes or on unmount
  }, [userId]);
  // render the loading / error / user states...
}
```

The **race condition**: `userId` changes 1 → 2 quickly. Request 1 is slow, request 2 is fast. Without cleanup, request 1 finishes **last** and overwrites the screen with the **wrong user**. Aborting (or an `ignore = true` flag set in the cleanup) discards stale responses.

Other pitfalls: no loading or error states, request waterfalls, no caching, double fetch in StrictMode. In real apps, prefer **TanStack Query** / SWR or your framework's data loading, which handle caching, deduplication, retries, cancellation and refetching.

### re34 | When don't you need an effect?

Many effects are unnecessary. They add an extra render and bugs. The common anti-patterns:

```jsx
// 1. Derived state: calculate during render instead
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(first + " " + last), [first, last]); // BAD
const fullName = first + " " + last;                             // GOOD

// 2. Expensive derived value: useMemo, not effect + state
const visible = useMemo(() => filterTodos(todos, tab), [todos, tab]);

// 3. Reacting to a user action: do it in the event handler
useEffect(() => { if (submitted) api.post(form); }, [submitted]); // BAD
const handleSubmit = () => api.post(form);                         // GOOD

// 4. Resetting state when a prop changes: use key
<Profile key={userId} userId={userId} />

// 5. Telling the parent about a change: call its callback in the same handler
const toggle = () => { const next = !on; setOn(next); onChange(next); };
```

Rule of thumb: you need an effect only to **synchronise with an external system** (network, DOM APIs, subscriptions, timers). If the logic is "when X changes, update state Y", it almost certainly belongs in render or in an event handler.

### re35 | What is useRef used for?

`useRef(initial)` returns a **mutable object `{ current }` that persists across renders**. **Changing `.current` does NOT trigger a re-render.**

Two main uses:

```jsx
// 1. Accessing DOM elements
function SearchBox() {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current.focus(); }, []);
  return <input ref={inputRef} />;
}

// 2. Keeping mutable values that aren't for display
function Stopwatch() {
  const intervalRef = useRef(null);            // timer id
  const renders = useRef(0);
  renders.current++;                           // counts renders without causing one

  const start = () => { intervalRef.current = setInterval(tick, 100); };
  const stop = () => clearInterval(intervalRef.current);
}
```

Other uses: the previous value of a prop, the latest callback for long-lived listeners (avoiding stale closures), and flags like "is mounted".

**ref vs state**: use state if the value appears in the UI; use a ref if it's only used in handlers or effects. Don't read or write `ref.current` **during render** (except lazy initialisation): it makes rendering impure.

### re36 | How do you pass a ref to a child component (forwardRef, and ref as a prop in React 19)?

By default a `ref` on **your own** component didn't reach its inner DOM node.

Before React 19: wrap the child in **`forwardRef`**:

```jsx
const FancyInput = forwardRef(function FancyInput(props, ref) {
  return <input ref={ref} className="fancy" {...props} />;
});
<FancyInput ref={inputRef} />;
```

**React 19**: `ref` is a **normal prop** for function components, so `forwardRef` isn't needed anymore:

```jsx
function FancyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

**`useImperativeHandle`** exposes a limited, custom API instead of the raw DOM node:

```jsx
function VideoPlayer({ ref, src }) {
  const videoRef = useRef(null);
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current.play(),
    pause: () => videoRef.current.pause(),
  }));
  return <video ref={videoRef} src={src} />;
}
// parent: playerRef.current.play()
```

Use refs for focus, scrolling, media playback and measurement. Don't use them for things props can express.

### re37 | What do useMemo and useCallback do?

Both **cache something between renders** until a dependency changes.

- **`useMemo(fn, deps)`** caches a **computed value** (the result of calling `fn`).
- **`useCallback(fn, deps)`** caches a **function** itself. It's `useMemo(() => fn, deps)`.

```jsx
function ProductPage({ products, query, onBuy }) {
  // skip an expensive recalculation when unrelated state changes
  const filtered = useMemo(
    () => products.filter((p) => p.name.includes(query)),
    [products, query]
  );

  // keep the same function reference so the memoised child doesn't re-render
  const handleBuy = useCallback((id) => onBuy(id), [onBuy]);

  return <ProductList items={filtered} onBuy={handleBuy} />; // ProductList is React.memo
}
```

Why reference stability matters: `React.memo` children, effect dependencies and custom hook deps compare **by reference**. A new object or function every render defeats them.

They're a **performance optimisation**, not a guarantee: React may throw the cache away. Your code must still be correct without them.

### re38 | When should you NOT use useMemo and useCallback?

Memoisation has a cost (memory, comparing deps, more complex code), and it only pays off in specific cases.

Worth it when:
- The calculation is **actually expensive** (measured; roughly ≥1ms, e.g. filtering or sorting thousands of items).
- The value or function is passed to a **`React.memo` child**.
- The value or function is a **dependency of an effect** or another hook, and shouldn't change every render.

Pointless when:
```jsx
const total = useMemo(() => a + b, [a, b]);             // cheap: just compute it
const onClick = useCallback(() => setOpen(true), []);   // passed to a plain <button>: nothing gains
```
- The child isn't memoised: it re-renders anyway.
- A dependency changes on every render anyway (e.g. an inline object), so the cache never hits.

Better first moves: **move state down**, pass JSX as `children`, avoid creating expensive objects during render, and **profile before optimising** (React DevTools Profiler).

The **React Compiler** (stable since 2025) memoises automatically at build time, which reduces the need for manual `useMemo`/`useCallback`/`memo` in new code.

### re39 | When should you use useReducer instead of useState?

`useReducer` centralises state updates in a **pure reducer function**: `(state, action) => newState`.

```jsx
const initial = { items: [], loading: false, error: null };

function cartReducer(state, action) {
  switch (action.type) {
    case "add":
      return { ...state, items: [...state.items, action.item] };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "fetchStart":
      return { ...state, loading: true, error: null };
    case "fetchError":
      return { ...state, loading: false, error: action.error };
    default:
      throw new Error("Unknown action " + action.type);
  }
}

const [state, dispatch] = useReducer(cartReducer, initial);
dispatch({ type: "add", item });
```

Use it when:
- State has **several related fields** that change together (loading, error, data).
- The next state depends on the previous state in **complex ways** (many transition types).
- You want the update logic **testable in isolation** (the reducer is a pure function).
- You pass updates deep down: **`dispatch` is stable** (never changes), so it's safe in deps and in context.

Use `useState` for simple, independent values. `useReducer` + Context is a lightweight Redux-like pattern.

### re40 | What are custom hooks? Give an example.

A **custom hook** is a function whose name starts with **`use`** and that calls other hooks. It lets you **reuse stateful logic** (not state itself: each component calling the hook gets its **own independent state**).

```jsx
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);            // reset the timer when value changes
  }, [value, delay]);
  return debounced;
}

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
}

// usage
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  useEffect(() => { if (debouncedQuery) search(debouncedQuery); }, [debouncedQuery]);
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

The `use` prefix is required so the linter can enforce the rules of hooks. Custom hooks replaced most HOCs and render props for sharing logic. Common ones: `useFetch`, `useOnlineStatus`, `useWindowSize`, `usePrevious`, `useToggle`.

## Context and state management

### re41 | What is the Context API, and when should you use it?

Context passes data **through the tree without threading props through every level** (prop drilling).

```jsx
const ThemeContext = createContext("light");             // default when no provider exists

function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>  {/* React 19: <ThemeContext value={...}> */}
      <Layout />
    </ThemeContext.Provider>
  );
}

function ThemeToggle() {                                 // any depth
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme}</button>;
}
```

Good for **global, rarely changing** data: theme, the logged-in user, locale, feature flags, and dependency injection (an API client).

Not ideal for **frequently changing** state used by many components (every consumer re-renders on every change), or as a replacement for all props. Try **composition** first: pass components as children so the middle layers don't need the data.

Context is a **transport mechanism**, not a state manager. The state still lives in `useState`/`useReducer` in the provider.

### re42 | What are the pitfalls of Context, and how do you avoid unnecessary re-renders?

**Every component that calls `useContext(Ctx)` re-renders when the provider's `value` changes** (compared with `Object.is`), even if it uses only a part that didn't change. `React.memo` doesn't stop it.

Pitfall 1: a new value object on every render:
```jsx
function Provider({ children }) {
  const [user, setUser] = useState(null);
  // new object every render -> every consumer re-renders whenever Provider re-renders
  return <Ctx.Provider value={{ user, setUser }}>{children}</Ctx.Provider>;
}
// fix:
const value = useMemo(() => ({ user, setUser }), [user]);
```

Pitfall 2: one giant context with everything in it:
```jsx
// split by how often things change and who needs them
<AuthContext.Provider value={auth}>
  <CartContext.Provider value={cart}>        // cart changes often
    <ThemeContext.Provider value={theme}>
```

More techniques:
- **Separate state and dispatch contexts**: components that only dispatch never re-render (`dispatch` is stable).
- Keep fast-changing state local, or use a store with **selectors** (Zustand, Redux, `useSyncExternalStore`), which re-renders only components whose selected slice changed.

### re43 | How do you choose between local state, Context, and an external store like Redux or Zustand?

Pick by **who needs the data** and **what kind of data** it is:

| Kind of state | Where it goes |
|---|---|
| UI state for one component (open/closed, input text) | `useState` locally |
| Shared by a few nearby components | lift it to the common parent |
| App-wide, rarely changing (theme, auth user, locale) | **Context** |
| Complex, frequently updated, global client state, many consumers | **Zustand / Redux Toolkit / Jotai** (selectors, devtools, middleware) |
| **Server data** (API responses: caching, refetching) | **TanStack Query / SWR / RTK Query**, not Redux by hand |
| URL-shareable state (filters, page, tab) | the **URL** (search params) |
| Form state | React Hook Form / local state |

Key insight: most "global state" in old Redux apps was **server cache**. Moving that to TanStack Query usually leaves very little real client state.

Redux Toolkit is worth it for large teams and complex client-side logic (predictable updates, time-travel debugging, middleware). Zustand is minimal: a hook-based store with no providers.

### re44 | What is Redux, and how does its data flow work?

Redux is a **predictable global state container** built on three principles:
1. A **single store** holds the app state.
2. State is **read-only**: the only way to change it is to **dispatch an action** (a plain object describing what happened).
3. Changes are made by **pure reducers**: `(state, action) => newState`.

Data flow (one-way): **UI → `dispatch(action)` → reducer computes the new state → store notifies subscribers → UI re-renders** with the selected data.

Modern Redux uses **Redux Toolkit (RTK)**:

```js
const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] },
  reducers: {
    added(state, action) { state.items.push(action.payload); }, // Immer: "mutating" code is safe
    removed(state, action) { state.items = state.items.filter((i) => i.id !== action.payload); },
  },
});
export const { added, removed } = cartSlice.actions;
const store = configureStore({ reducer: { cart: cartSlice.reducer } });

// component
const items = useSelector((s) => s.cart.items);   // re-renders only if this slice changes
const dispatch = useDispatch();
dispatch(added(item));
```

Async logic goes in **thunks** (`createAsyncThunk`) or **RTK Query** (data fetching plus caching). Middleware handles logging, analytics and side effects.

## Patterns

### re45 | What are higher-order components (HOCs)?

A **HOC** is a function that **takes a component and returns a new, enhanced component**: the higher-order-function idea applied to components.

```jsx
function withAuth(Component) {
  return function Protected(props) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} user={user} />;
  };
}
const ProtectedDashboard = withAuth(Dashboard);
```

Used for: auth guards, injecting data (`connect()` from react-redux, `withRouter`), logging, feature flags.

Downsides (why hooks mostly replaced them):
- **Wrapper hell**: deep nesting in DevTools.
- **Prop name collisions**: two HOCs injecting the same prop name.
- Hidden data source: it's unclear where a prop came from.
- Static methods and refs need special handling.

Today: use a **custom hook** for logic (`const user = useAuth()`). HOCs still make sense for wrapping a component's **render output** (e.g. route guards, error boundaries).

### re46 | What are render props?

A **render prop** is a prop whose value is a **function that returns UI**. The component calls it with its internal state, so the caller decides **what** to render while the component owns the **logic**.

```jsx
function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

<MouseTracker render={({ x, y }) => <p>Cursor at {x}, {y}</p>} />

// children-as-a-function variant
<DataFetcher url="/api/users">{({ data, loading }) => (loading ? <Spinner /> : <List data={data} />)}</DataFetcher>
```

They solved logic sharing before hooks. Today, **custom hooks** do the same with less nesting (`const pos = useMousePosition()`). Render props still appear in libraries for flexible rendering (virtualised lists' `rowRenderer`, Formik, headless UI components).

### re47 | What are error boundaries?

An **error boundary** is a component that **catches JavaScript errors in its child tree during rendering**, logs them, and shows a **fallback UI** instead of crashing the whole app. (An uncaught render error unmounts the **entire** root.)

They must be **class components** (there's no hook equivalent yet):

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) {
    return { hasError: true };             // render the fallback next
  }
  componentDidCatch(error, info) {
    logToService(error, info.componentStack);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

<ErrorBoundary fallback={<p>Something went wrong.</p>}>
  <Widget />
</ErrorBoundary>
```

They do **NOT** catch errors in:
- **event handlers** (use try/catch there),
- **async code** (setTimeout, promises),
- SSR,
- the boundary itself.

Put boundaries around independent sections (each widget or route) so one failure doesn't take down the whole page. The `react-error-boundary` package provides a ready-made one with reset support.

### re48 | What are portals?

A **portal** renders children into a **DOM node outside the parent's DOM hierarchy**, while keeping them in the same **React tree**.

```jsx
import { createPortal } from "react-dom";

function Modal({ children, onClose }) {
  return createPortal(
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body                    // rendered here in the DOM
  );
}
```

Why: modals, tooltips, dropdowns and toasts need to **escape** parents with `overflow: hidden`, `z-index` stacking contexts or `transform` that would clip them.

Behaviour to know:
- **Context still works**: the portal is a child in the React tree.
- **Events bubble through the React tree**, not the DOM tree. A click inside the portal reaches the React parent's `onClick`, even though in the DOM the modal is attached to body.
- Remember accessibility for modals: focus management and the Escape key.

## Performance

### re49 | How do you optimise a React app's performance?

Measure first (React DevTools **Profiler**, Lighthouse, Web Vitals), then:

**Rendering less**
- Keep state **local**; move state down; split big components.
- Pass components as `children` so they don't re-render with the parent.
- `React.memo` for expensive children + `useCallback`/`useMemo` for the props passed to them.
- Split contexts; use selector-based stores.
- Never define components inside components.

**Rendering faster**
- **Virtualise long lists** (react-window, TanStack Virtual): render only the visible rows.
- `useMemo` for genuinely expensive calculations.
- `useTransition`/`useDeferredValue` to keep typing responsive during heavy updates.
- Debounce expensive handlers (search).

**Loading less**
- **Code splitting**: `React.lazy` + `Suspense` per route or heavy widget.
- Tree shaking, smaller dependencies, analysing the bundle.
- Optimised images (sizes, lazy loading, modern formats).
- SSR/SSG or Server Components for a faster first paint; caching data with TanStack Query.

Always use the **production build** when measuring: dev mode is much slower and runs StrictMode's double renders.

### re50 | How do code splitting, React.lazy and Suspense work?

**Code splitting** breaks the bundle into chunks loaded **on demand**, so the initial JavaScript is smaller and the first load is faster.

```jsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));   // separate chunk
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>                          {/* shown while the chunk loads */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

- `lazy` takes a function returning a dynamic `import()`. The module must have a **default export** (for named ones: `lazy(() => import("./x").then((m) => ({ default: m.Named })))`).
- **Suspense** shows the `fallback` while anything inside it is "suspended": waiting on lazy code or Suspense-enabled data.
- Good split points: **routes**, modals, heavy libraries (charts, editors, maps), below-the-fold sections.
- Pair it with an **error boundary**: a chunk can fail to load (network, or a new deploy changed the file names).
- Preload likely next chunks (on hover) to hide the latency.

### re51 | What is list virtualisation?

Rendering 10,000 rows creates 10,000+ DOM nodes: slow mounting, heavy memory, janky scrolling. **Virtualisation (windowing)** renders **only the rows visible in the viewport** (plus a small buffer) and fakes the rest of the scroll height.

```jsx
import { FixedSizeList } from "react-window";

function BigList({ items }) {
  return (
    <FixedSizeList height={600} width="100%" itemCount={items.length} itemSize={48}>
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>   // style positions the row absolutely
      )}
    </FixedSizeList>
  );
}
```

How it works: a container with the **total height** gives a real scrollbar; on scroll, it computes which indices are visible from `scrollTop / rowHeight` and renders only those, absolutely positioned.

Libraries: **react-window**, **TanStack Virtual** (supports variable heights), react-virtuoso.

Trade-offs: browser find-in-page (Ctrl+F) can't find off-screen rows, variable heights need measuring, and screen readers need care. Alternatives: pagination or infinite scroll with a cap.

### re52 | What are useTransition and useDeferredValue?

Both are **concurrent features** (React 18+) that mark some updates as **non-urgent**, so urgent ones (typing, clicking) stay responsive.

**`useTransition`**: you wrap the **state update** yourself:

```jsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const onChange = (e) => {
    setQuery(e.target.value);                     // urgent: the input updates immediately
    startTransition(() => {
      setResults(filterHugeList(e.target.value)); // non-urgent: can be interrupted
    });
  };
  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <Spinner />}
      <List items={results} />
    </>
  );
}
```

**`useDeferredValue`**: you defer a **value** you receive (useful when you don't control the setter):

```jsx
function Results({ query }) {
  const deferredQuery = useDeferredValue(query);  // lags behind during fast typing
  const items = useMemo(() => filterHugeList(deferredQuery), [deferredQuery]);
  return <List items={items} style={{ opacity: query !== deferredQuery ? 0.6 : 1 }} />;
}
```

React renders the urgent update first and works on the transition in the background, **abandoning it** if newer input arrives. Unlike debouncing, there's no fixed delay: on a fast device it's near instant. Transitions also stop Suspense from replacing visible content with a fallback during navigation.

## Modern React (18 and 19) and rendering strategies

### re53 | What is concurrent rendering in React 18?

Before React 18, rendering was **synchronous**: once an update started, React rendered the whole tree before the browser could do anything else.

**Concurrent rendering** makes rendering **interruptible**. React can start an update, pause it to handle something more urgent (a keystroke), and resume or abandon it. It also lets React prepare a new UI in the background while the current one stays interactive.

It's **opt-in per update**, through features:
- `useTransition` / `startTransition`: mark updates as non-urgent.
- `useDeferredValue`: render with a lagging value.
- **Suspense** for data and code, plus **streaming SSR** with selective hydration.
- **Automatic batching** everywhere.

Enabled by the new root API:
```jsx
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")).render(<App />);   // ReactDOM.render was the legacy mode
```

Implication for your code: since renders can be started, thrown away and restarted, **render must be pure**. Side effects in the component body can run more times than expected.

### re54 | What are CSR, SSR, SSG and ISR?

| Strategy | Where HTML is built | When | Good for |
|---|---|---|---|
| **CSR** (client-side rendering) | in the browser, by JS | at runtime | dashboards and apps behind a login; SEO doesn't matter |
| **SSR** (server-side rendering) | on the server | **every request** | personalised, frequently changing pages that need SEO and a fast first paint |
| **SSG** (static site generation) | at **build time** | once | blogs, docs, marketing pages (served from a CDN, fastest) |
| **ISR** (incremental static regeneration) | build time + background re-generation | after `revalidate` seconds | mostly static pages that change sometimes (product pages) |

CSR flow: an empty HTML shell → download JS → fetch data → render. Slow first paint and bad SEO, but simple hosting.

SSR flow: the server renders full HTML → the user **sees content quickly** → JS loads → **hydration** makes it interactive. Costs: server load and a higher TTFB.

Frameworks such as **Next.js**, Remix/React Router and Astro let you choose **per route**. React Server Components add another dimension: rendering *components* on the server, not just whole pages.

### re55 | What is hydration?

**Hydration** is the step after SSR where React, running in the browser, **attaches event handlers and state to the server-rendered HTML** instead of re-creating the DOM. React walks the existing markup, matches it to the component tree and makes it interactive.

```jsx
import { hydrateRoot } from "react-dom/client";
hydrateRoot(document.getElementById("root"), <App />);
```

- Before hydration, the page is **visible but not interactive** (clicks do nothing).
- **Hydration mismatch**: if the client's first render differs from the server HTML (using `Date.now()`, `Math.random()`, `window` or `localStorage` during render, or invalid HTML nesting), React warns and may re-render. Fix: render the same thing on both sides, then update in `useEffect`, or use `suppressHydrationWarning` for things like timestamps.
- React 18 **selective hydration**: with Suspense boundaries, parts hydrate independently, and the part the user interacts with is prioritised.
- Server Components reduce hydration cost: their code never ships to the client.

### re56 | What are React Server Components?

**React Server Components (RSC)** run **only on the server** (at build time or request time). Their code **never ships to the browser**: the client receives the rendered result in a serialised format.

```jsx
// app/products/page.jsx: a Server Component (the default in the Next.js App Router)
import db from "@/lib/db";
export default async function ProductsPage() {
  const products = await db.product.findMany();   // query the DB directly, no API layer
  return (
    <ul>
      {products.map((p) => <li key={p.id}>{p.name} <AddToCart id={p.id} /></li>)}
    </ul>
  );
}

// AddToCart.jsx: a Client Component, needed for interactivity
"use client";
export function AddToCart({ id }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? "Added" : "Add"}</button>;
}
```

| Server Components | Client Components (`"use client"`) |
|---|---|
| can be `async`, access the DB, filesystem, secrets | can use state, effects, event handlers, browser APIs |
| zero JS sent to the browser | shipped and hydrated |
| no hooks like useState/useEffect | everything React offers |

Benefits: smaller bundles, data fetching close to the data, secrets stay on the server. Server Components can render Client Components (passing **serialisable** props), but not the other way round, except as `children`. This is not the same as SSR: SSR renders HTML for the first load, while RSC is about which components run where.

### re57 | What is new in React 19?

React 19 (stable since December 2024) highlights:

- **Actions**: async functions in transitions, which handle pending state, errors and optimistic updates. `<form action={asyncFn}>` works natively.
- **`useActionState`**: `const [state, formAction, isPending] = useActionState(fn, initial)` for form submission state.
- **`useFormStatus`**: a child can read whether its parent `<form>` is pending (for submit buttons).
- **`useOptimistic`**: show the expected result immediately and roll back if the server fails.
- **`use(resource)`**: read a **promise** (suspends until resolved) or **context** inside render; it **can be called conditionally**.
- **`ref` as a prop** for function components: `forwardRef` is no longer needed. Ref callbacks can return a cleanup function.
- **`<Context>` as the provider** directly, instead of `<Context.Provider>`.
- **Document metadata**: `<title>`, `<meta>` and `<link>` rendered anywhere are hoisted to `<head>`.
- Stylesheet and script loading support, plus resource preloading APIs (`preload`, `preinit`).
- Server Components and Server Actions are stable.
- Better hydration error messages.

```jsx
function UpdateName() {
  const [error, submit, isPending] = useActionState(async (prev, formData) => {
    const err = await updateName(formData.get("name"));
    return err ?? null;
  }, null);
  return (
    <form action={submit}>
      <input name="name" />
      <button disabled={isPending}>Save</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

Alongside it, the **React Compiler** (stable 1.0 in 2025) automatically memoises components and values at build time.

### re58 | How does Suspense work for data fetching?

**Suspense** lets a component "wait" for something, and shows the nearest `<Suspense fallback>` until it's ready. Loading states become **declarative** and are placed by the parent, not handled with `if (loading)` inside every component.

```jsx
import { Suspense, use } from "react";

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);     // suspends until the promise resolves
  return comments.map((c) => <p key={c.id}>{c.text}</p>);
}

function Post({ id }) {
  const commentsPromise = fetchComments(id); // start early (ideally cached/created outside render)
  return (
    <>
      <PostBody id={id} />
      <Suspense fallback={<Spinner />}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </>
  );
}
```

How it works: a component that isn't ready **suspends** (internally it throws a promise, or calls `use`). React shows the closest fallback and retries rendering when the promise resolves. Errors go to the nearest **error boundary**.

Works with: `React.lazy`, `use(promise)`, Suspense-enabled libraries (TanStack Query's `useSuspenseQuery`, Relay), and the Next.js App Router (`loading.js`). Server-side, Suspense enables **streaming HTML**: the shell is sent first and slow parts stream in later.

Don't create a new promise on every render without caching it: that's an endless suspend loop.

## Routing, testing and the rest

### re59 | How does client-side routing work in a single-page app?

In an SPA, the server sends **one HTML page**. Navigation then happens **in the browser without full page reloads**: the router changes the URL with the **History API** and renders the matching component.

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <nav><Link to="/">Home</Link> <Link to="/users/42">User</Link></nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<User />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function User() {
  const { id } = useParams();            // "42"
  const navigate = useNavigate();
  return <button onClick={() => navigate("/")}>Back home</button>;
}
```

Under the hood: `<Link>` prevents the default anchor navigation and calls `history.pushState`; the router listens for `popstate` (back/forward) and re-renders the matching route.

Deployment gotcha: refreshing `/users/42` asks the **server** for that path, so the server must be configured to return `index.html` for every route (an SPA fallback / rewrite). `HashRouter` (`/#/users/42`) avoids that but makes uglier URLs.

### re60 | How do you implement protected routes?

Wrap protected routes in a component that checks auth and **redirects** if the user isn't allowed:

```jsx
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;                       // don't redirect while auth is unknown
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;                                     // render the child routes
}

<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
  <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
    <Route path="/admin" element={<Admin />} />
  </Route>
</Routes>
```

After login, send the user back to `location.state.from`.

**Critical point**: frontend route protection is only **UX**. The JS bundle can be read and the checks bypassed. **Real authorisation must happen on the server**: every API call verifies the token and permissions.

### re61 | How do you test React applications?

Testing levels:
- **Unit**: pure functions, reducers, custom hooks (Jest/Vitest; `renderHook`).
- **Component/integration**: render components and interact like a user (**React Testing Library**).
- **End-to-end**: a real browser against the running app (**Playwright**, Cypress).

React Testing Library's philosophy is to **test behaviour, not implementation**: query elements the way users find them (role, label, text), not by class names or internal state.

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("adds a todo", async () => {
  const user = userEvent.setup();
  render(<TodoApp />);

  await user.type(screen.getByRole("textbox", { name: /new todo/i }), "Buy milk");
  await user.click(screen.getByRole("button", { name: /add/i }));

  expect(screen.getByText("Buy milk")).toBeInTheDocument();
});

// async UI: findBy* waits for the element
expect(await screen.findByText(/loaded/i)).toBeInTheDocument();
```

**Mock network calls** with MSW (Mock Service Worker) rather than mocking `fetch` by hand. Avoid snapshot tests for anything big: they break on every change and catch little.

### re62 | How do class lifecycle methods map to hooks?

You'll still meet class components in older codebases.

| Class lifecycle | Hooks equivalent |
|---|---|
| `constructor` (init state) | `useState(initial)` / lazy init `useState(() => ...)` |
| `componentDidMount` | `useEffect(() => {...}, [])` |
| `componentDidUpdate(prevProps)` | `useEffect(() => {...}, [dep])` |
| `componentWillUnmount` | the cleanup returned from `useEffect` |
| `shouldComponentUpdate` | `React.memo` |
| `getDerivedStateFromProps` | compute during render / `key` reset |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` (roughly) |
| `componentDidCatch` / `getDerivedStateFromError` | no hook yet: still a class error boundary |
| `this.forceUpdate()` | a state toggle |

```jsx
// class: subscribe and unsubscribe split across two methods
componentDidMount() { this.sub = api.subscribe(this.props.id); }
componentDidUpdate(prev) { if (prev.id !== this.props.id) { this.sub.close(); this.sub = api.subscribe(this.props.id); } }
componentWillUnmount() { this.sub.close(); }

// hook: one place
useEffect(() => {
  const sub = api.subscribe(id);
  return () => sub.close();
}, [id]);
```

Mounting order in classes: `constructor → render → componentDidMount`; updating: `render → componentDidUpdate`. Deprecated: `componentWillMount`, `componentWillReceiveProps` and `componentWillUpdate` (prefixed `UNSAFE_`, because they're unsafe with concurrent rendering).

### re63 | Why shouldn't you define a component inside another component?

Every render of the parent creates a **new function**, which is a **new component type**. Reconciliation sees a different type in that position, so it **unmounts and remounts** the child every time.

```jsx
function Parent() {
  const [text, setText] = useState("");

  function Input() {                         // a NEW component type on every render
    return <input value={text} onChange={(e) => setText(e.target.value)} />;
  }

  return <Input />;   // remounts on every keystroke: focus is lost and its state reset
}
```

Symptoms: an input **loses focus after each keystroke**, child state resets, effects re-run (mount/unmount) constantly, and performance suffers.

Fix: define components at the **module level** and pass what they need as props:

```jsx
function Input({ value, onChange }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}
function Parent() {
  const [text, setText] = useState("");
  return <Input value={text} onChange={setText} />;
}
```

(Calling a helper **function** that returns JSX, `{renderRow(item)}`, is fine. The problem is using a nested function as a **component type**, `<Row />`.)

### re64 | What is the difference between server state and client state, and why use TanStack Query?

- **Client state**: owned by the browser and fully under your control: UI toggles, form inputs, the selected tab, theme.
- **Server state**: data that **lives on a server** and is just *cached* in the UI. It can go **stale**, be changed by other users, needs loading and error handling, refetching, deduplication and pagination.

Managing server state with `useEffect` + `useState` (or Redux) by hand means re-implementing caching, request dedupe, retries, cancellation, background refresh, stale-while-revalidate and garbage collection.

**TanStack Query** (React Query) handles all of that:

```jsx
function Todos() {
  const { data, isPending, error } = useQuery({
    queryKey: ["todos"],                       // cache key
    queryFn: () => fetch("/api/todos").then((r) => r.json()),
    staleTime: 60_000,                         // fresh for 1 min, no refetch
  });

  const queryClient = useQueryClient();
  const addTodo = useMutation({
    mutationFn: (t) => fetch("/api/todos", { method: "POST", body: JSON.stringify(t) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }), // refetch
  });

  if (isPending) return <Spinner />;
  if (error) return <p>{error.message}</p>;
  return data.map((t) => <p key={t.id}>{t.title}</p>);
}
```

Components using the same `queryKey` share **one request and one cache**. Alternatives: SWR, RTK Query, Apollo (GraphQL), or framework loaders and RSC.

### re65 | How does React protect against XSS, and where can it still happen?

React **escapes** every value embedded with `{}` before putting it in the DOM: it's inserted as **text**, so `<script>` or `<img onerror>` in user data is shown literally, not executed.

```jsx
const comment = '<img src=x onerror="alert(1)">';
<p>{comment}</p>                                     // safe: renders the text
```

Where XSS can still get in:
```jsx
// 1. dangerouslySetInnerHTML: the name is the warning
<div dangerouslySetInnerHTML={{ __html: userHtml }} />          // sanitise first:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userHtml) }} />

// 2. URLs with the javascript: scheme
<a href={user.website}>Site</a>        // "javascript:alert(1)": validate http(s) only

// 3. Direct DOM writes through refs
ref.current.innerHTML = userInput;

// 4. Spreading untrusted objects as props
<div {...userControlledProps} />

// 5. Server-rendered state injected into a <script> without escaping
```

Also: keep auth tokens in HttpOnly cookies (XSS can't read them), and add a Content-Security-Policy as defence in depth.

### re66 | How do you debug a React application?

- **React DevTools** (browser extension):
  - **Components** tab: inspect the tree, props, state and hooks of any component; edit values live; find which component rendered a DOM node.
  - **Profiler**: record an interaction and see **which components rendered, how long they took, and why** (enable "Record why each component rendered"). "Highlight updates when components render" shows wasted renders visually.
- **Browser DevTools**: breakpoints, a `debugger;` statement, the Network tab for API calls, the Performance tab for long tasks and layout thrashing.
- **StrictMode** surfaces impure renders and missing effect cleanup in development.
- **Error boundaries** + logging (Sentry) for production errors, with source maps.
- **ESLint** with `eslint-plugin-react-hooks`, which catches rule-of-hooks and dependency bugs before runtime.
- For "why does this keep re-rendering": check for new object/function props each render, context value changes, or state set during render. For "why is this value old": a stale closure / missing dependency.
- Redux DevTools or TanStack Query DevTools to inspect store and cache state.


## Practical React

### re67 | What does it mean that components must be pure?

React expects every component to behave like a **pure function of its props, state and context**:
1. **The same inputs give the same JSX.**
2. **No side effects during render**: don't change variables that existed before the render, don't mutate props or state, no API calls, no DOM changes, no subscriptions.

```jsx
// IMPURE: changes an outside variable during render
let guestCount = 0;
function Guest() {
  guestCount++;                       // different output on every render; StrictMode doubles it
  return <p>Guest #{guestCount}</p>;
}

// PURE: the value comes in as a prop
function Guest({ number }) {
  return <p>Guest #{number}</p>;
}

// Local mutation is fine: the object is created during this render
function List({ items }) {
  const sorted = [...items].sort();  // copy first (never items.sort())
  return sorted.map((i) => <li key={i}>{i}</li>);
}
```

Why it matters: React may render a component **many times, in any order, or throw a render away** (concurrent rendering, StrictMode, Suspense retries). Purity makes that safe, and makes memoisation and the React Compiler possible.

Side effects belong in **event handlers** (first choice) or **`useEffect`**.

### re68 | What is prop drilling, and how do you avoid it?

**Prop drilling**: passing data through several layers of components that **don't use it**, just to reach a deep child.

```jsx
<App user={user}>
  <Layout user={user}>          {/* doesn't need user */}
    <Sidebar user={user}>       {/* doesn't need user */}
      <Avatar user={user} />    {/* the only real consumer */}
```

Problems: noisy props, tight coupling, painful refactors, and middle layers re-rendering for data they don't use.

Solutions, in the order to try them:
1. **Composition**: pass the finished element down as `children` or a slot prop, so the middle layers never see the data:
   ```jsx
   <Layout sidebar={<Sidebar avatar={<Avatar user={user} />} />} />
   ```
2. **Context** for truly widely needed data (auth user, theme).
3. **A state library** (Zustand/Redux) with selectors for complex shared state.
4. Fetch the data where it's needed (TanStack Query keyed caches, Server Components).

A few levels of props is **fine and explicit**. Don't reach for Context just to avoid passing a prop twice.

### re69 | What causes "Too many re-renders" and infinite effect loops?

**"Too many re-renders"** comes from setting state **during render**:

```jsx
function Bad() {
  const [n, setN] = useState(0);
  setN(n + 1);                                  // render -> setState -> render -> ...
  return <button onClick={setN(5)}>x</button>;  // calls setN DURING render (missing arrow)
}
// fix: onClick={() => setN(5)}
```

**Infinite effect loops**: an effect updates state that is also its dependency, or depends on something recreated every render:

```jsx
useEffect(() => {
  setCount(count + 1);                 // changes count -> effect runs again -> ...
}, [count]);

const filters = { status: "open" };    // new object every render
useEffect(() => {
  fetchItems(filters).then(setItems);  // setItems -> re-render -> new filters -> effect again
}, [filters]);
```

Fixes:
- Pass **functions** to handlers (`onClick={() => ...}`), don't call them.
- Compute derived values during render instead of syncing them through effect + state.
- Depend on **primitives** (`filters.status`), or memoise objects/functions (`useMemo`/`useCallback`), or create them **inside** the effect.
- Use updater functions so the state doesn't need to be a dependency.

### re70 | Why can't the useEffect callback be async, and how do you use async code inside it?

`useEffect` expects its callback to return **nothing or a cleanup function**. An `async` function always returns a **promise**, which React would treat as the cleanup. It warns, and your real cleanup can't be returned.

```jsx
// WRONG
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);

// RIGHT: define an async function inside and call it
useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      const data = await fetchData(id);
      if (!cancelled) setData(data);       // ignore results that arrive after cleanup
    } catch (err) {
      if (!cancelled) setError(err);
    }
  }
  load();

  return () => { cancelled = true; };      // cleanup still works
}, [id]);
```

An IIFE also works: `(async () => { ... })();`. For real apps, a data library (TanStack Query) removes this boilerplate.

### re71 | What is the full flow when a useState setter is called?

```jsx
const [count, setCount] = useState(0);
<button onClick={() => setCount((c) => c + 1)} />
```

1. **The update is queued**: React adds `{ action: c => c + 1 }` to that hook's update queue on the component's fiber and **schedules** a re-render with a priority (a click is a discrete, high-priority event).
2. **Bail-out check**: if React can tell the new state equals the current one (`Object.is`), it may skip the render entirely.
3. **Batching**: other `setState` calls in the same event are collected; there's one render at the end (automatic batching, React 18+).
4. **Render phase**: React calls `Counter()` again. `useState` processes the queue in order and returns the **new** value. The component and its children produce new JSX.
5. **Reconciliation**: the new elements are diffed against the previous fiber tree to find the changes.
6. **Commit phase**: the DOM updates are applied in one go; refs update; `useLayoutEffect` runs; the browser paints; `useEffect`s whose deps changed run (cleanup first).

Things this explains: why `count` is still old right after `setCount` (the snapshot), why multiple updater functions add up, why children re-render, and why setting the same value doesn't re-render.

### re72 | How do you implement infinite scroll in React?

Load the next page when the user scrolls near the end. Watch a **sentinel element** with `IntersectionObserver` rather than listening to scroll events (cheaper, no throttling needed).

```jsx
function Feed() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchPage(page).then((res) => {
      if (ignore) return;
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, [page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) setPage((p) => p + 1);
    }, { rootMargin: "300px" });          // start loading before reaching the very bottom
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <>
      {items.map((it) => <Post key={it.id} post={it} />)}
      {hasMore && <div ref={sentinelRef}>{loading ? "Loading..." : null}</div>}
    </>
  );
}
```

Production concerns: **cursor-based pagination** on the API (stable while new items arrive); deduping items; error and retry states; **virtualising** once the list gets long; keeping the scroll position when going back. `useInfiniteQuery` from TanStack Query handles most of this.

### re73 | How do you handle authentication in a React SPA?

Typical flow:
1. The login form posts credentials to the API.
2. The server returns a session: ideally it **sets an `HttpOnly; Secure; SameSite` cookie** (or returns a short-lived access token plus a refresh cookie).
3. The app keeps the **current user** in context/store (from `/me`), and shows protected routes.
4. API calls include credentials; on a **401**, try one silent refresh, else log out.

```jsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error("Invalid credentials");
    setUser(await r.json());
  };
  const logout = () =>
    fetch("/api/logout", { method: "POST", credentials: "include" }).then(() => setUser(null));

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
```

Token storage trade-off:
- **localStorage**: simple, but any XSS can steal the token.
- **HttpOnly cookie**: JS can't read it, so it's safe from XSS theft, but you need CSRF protection (`SameSite`, CSRF tokens).
- **In-memory access token + HttpOnly refresh cookie**: a common middle ground.

Third-party login (Google, etc.) uses **OAuth 2.0 / OIDC** with the **Authorization Code + PKCE** flow. And remember: hiding routes is UX only; the API must authorise every request.

### re74 | How do you type React components with TypeScript?

```tsx
type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";            // optional + union of literals
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;                   // anything renderable
};

function Button({ label, variant = "primary", onClick, children }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{label}{children}</button>;
}

// state: inferred, or explicit when it starts as null
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// refs
const inputRef = useRef<HTMLInputElement>(null);

// events
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);

// extend native element props
type InputProps = React.ComponentProps<"input"> & { label: string };

// generic component
function List<T>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  return <ul>{items.map(render)}</ul>;
}

// reducer actions as a discriminated union
type Action = { type: "add"; item: Item } | { type: "remove"; id: string };
```

Benefits: props are checked at every usage, autocomplete, safer refactors, and discriminated unions for reducers and API states. `React.FC` is optional and mostly no longer recommended; plain functions with typed props are the norm.

### re75 | What are the main ways to style React components?

| Approach | How | Pros | Cons |
|---|---|---|---|
| Plain CSS / global | `import "./app.css"`, `className="card"` | simple, standard | global namespace, naming clashes |
| **CSS Modules** | `import s from "./Card.module.css"`, `className={s.card}` | **locally scoped** class names, zero runtime | separate files, dynamic styles are clunkier |
| **Tailwind CSS** | utility classes: `className="p-4 rounded-xl bg-white"` | fast to build, consistent design tokens, tiny CSS (unused classes purged) | long class strings, a learning curve |
| CSS-in-JS (styled-components, Emotion) | styles written in JS, props-based | dynamic styling, co-located | **runtime cost**, SSR and Server Component friction |
| Zero-runtime CSS-in-JS (vanilla-extract, Panda) | written in TS, extracted at build time | type-safe, no runtime | build setup |
| Inline `style={{}}` | a JS object | truly dynamic values | no pseudo-classes or media queries |

Current trend: **Tailwind** or **CSS Modules** (both work well with Server Components and have no runtime cost), plus a component library (shadcn/ui, MUI, Radix). For conditional classes, use the `clsx` / `cn()` helpers.

### re76 | What is Vite, and why is it faster than older setups like Create React App?

**Vite** is a modern frontend build tool and dev server. Create React App (webpack-based) is **deprecated**; Vite or a framework (Next.js, React Router) is the recommended start.

Why the dev server is fast:
- **No bundling in development**: it serves your source as **native ES modules**; the browser requests only the files the current page imports, and Vite transforms them on demand. Start-up is near instant, regardless of app size. (webpack bundled the whole app before the first page load.)
- **Dependencies are pre-bundled once** with **esbuild** (written in Go, 10–100× faster than JS-based tools).
- **Hot Module Replacement (HMR)** updates only the changed module and keeps React state (React Fast Refresh).

For production, Vite **bundles** with Rollup (moving to Rolldown) for an optimised output: tree shaking, code splitting, minification and hashed file names for caching.

```bash
npm create vite@latest my-app -- --template react-ts
npm run dev       # dev server
npm run build     # optimised production build in dist/
```

Environment variables exposed to the client must be prefixed `VITE_` (and are **public**: never put secrets there).

### re77 | What is Next.js, and when would you choose it over plain React?

**Next.js** is a full-stack **React framework** that adds what React (a library) leaves out:
- **File-based routing** (the App Router: `app/products/[id]/page.tsx`), layouts, loading and error files.
- **Rendering choices per route**: SSR, SSG, ISR, CSR, and **React Server Components** by default.
- **Data fetching on the server** (async components) with caching and revalidation.
- **Server Actions / API routes**: backend endpoints in the same project.
- Built-in optimisations: `next/image`, fonts, script loading, code splitting per route, streaming.
- Middleware (auth checks and redirects at the edge).

Choose **Next.js** when you need **SEO**, a fast first load on public pages (e-commerce, marketing, content), or full-stack features in one codebase.

Choose **plain React + Vite (SPA)** for apps behind a login (dashboards, internal tools) where SEO doesn't matter, when you already have a separate backend, or when you want simple static hosting.

Alternatives: **React Router v7** (formerly Remix) as a framework, Astro (content sites), TanStack Start.

### re78 | What is the compound component pattern?

**Compound components** are a set of components that **work together and share implicit state** through context, giving users a flexible, declarative API. HTML's `<select>` and `<option>` work this way.

```jsx
const TabsContext = createContext(null);

function Tabs({ defaultValue, children }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.List = function List({ children }) {
  return <div role="tablist">{children}</div>;
};
Tabs.Trigger = function Trigger({ value, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button role="tab" aria-selected={active === value} onClick={() => setActive(value)}>
      {children}
    </button>
  );
};
Tabs.Panel = function Panel({ value, children }) {
  const { active } = useContext(TabsContext);
  return active === value ? <div role="tabpanel">{children}</div> : null;
};

// usage: the consumer controls structure and order
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="profile"><Profile /></Tabs.Panel>
  <Tabs.Panel value="billing"><Billing /></Tabs.Panel>
</Tabs>
```

Benefits: no giant prop list (`tabs={[...]}`, `renderTab=...`), and consumers can rearrange or add markup freely. Used by Radix UI, Headless UI and Reach UI.

### re79 | What are the basics of accessibility (a11y) in React?

- **Use semantic HTML first**: `<button>` for actions (not a clickable `<div>`), `<a href>` for navigation, `<nav>`, `<main>`, headings in order, `<label>` for inputs. Semantic elements bring keyboard support and screen-reader roles for free.
  ```jsx
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  // or: const id = useId(); for unique, SSR-safe ids
  ```
- **Keyboard support**: everything clickable must be reachable with Tab and work with Enter/Space; visible focus styles; no keyboard traps.
- **Focus management** in SPAs: move focus into opened modals, return it on close, and announce route changes.
- **ARIA only when HTML can't express it**: `aria-label` for icon-only buttons, `aria-expanded`, `aria-live` for dynamic messages, `role="dialog"` + `aria-modal`.
- Meaningful **`alt` text** on images (`alt=""` for decorative ones).
- Enough **colour contrast**; don't convey information by colour alone.
- Respect `prefers-reduced-motion`.

Tools: eslint-plugin-jsx-a11y, axe DevTools, Lighthouse, and testing with a keyboard and a screen reader. React Testing Library's `getByRole` queries also nudge you toward accessible markup.

### re80 | How would you structure a medium-to-large React project?

Group **by feature (domain)**, not by file type:

```
src/
  app/                 # app shell: routes, providers, global layout
  features/
    auth/
      components/      # LoginForm.tsx
      hooks/           # useAuth.ts
      api.ts           # login(), logout()
      types.ts
      index.ts         # public API of the feature
    orders/
      components/ hooks/ api.ts ...
  components/ui/       # shared, dumb UI: Button, Modal, Input
  hooks/               # shared generic hooks: useDebounce
  lib/                 # API client, utils, config
  styles/
```

Principles:
- **Colocate**: keep a component's styles, tests and hooks next to it; move code to `shared` only when a second feature needs it.
- Features talk to each other through their **public `index.ts`**, not deep imports.
- **Separate UI from data**: components render; hooks or services fetch (TanStack Query hooks per feature).
- Keep components small; extract custom hooks for logic.
- Absolute import aliases (`@/features/auth`) instead of `../../../`.
- One consistent approach to state, styling and data fetching across the codebase.

"Bulletproof React" is a well-known reference architecture for this layout.
