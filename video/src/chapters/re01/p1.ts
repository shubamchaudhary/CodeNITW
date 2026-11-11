import type { Scene } from "../../lib/types.ts";
import { makeCheck } from "../checks.ts";
import { B, custom, qa, sec } from "../web/h.ts";

export const check = makeCheck();

// Part 1: the intro, module 1 (fundamentals) and module 2 (state and events).
export const p1: Scene[] = [
  {
    kind: "title",
    eyebrow: "React · interview lecture",
    title: "React, topic by topic",
    subtitle: "Every module of the React page, the idea behind it, and every question on it",
    beats: B("React, topic by topic. Like the other lectures, this one follows the React page exactly: ten modules, every question, in the page's order and with its numbers. Each module starts with the idea it hangs on, as a picture, then the questions, then a check."),
  },

  // ================================================================ module 1
  sec("1", "React fundamentals", "Module one. React fundamentals. Ten questions, and one idea behind all of them: the UI is a function of the state."),
  custom(
    "pypipe",
    {
      title: "The idea: UI = f(state)",
      stages: [
        { name: "State + props", icon: "🧾", sub: "the data" },
        { name: "Your component", icon: "⚛️", sub: "a function" },
        { name: "Elements (JSX)", icon: "🌳", sub: "a description" },
        { name: "React", icon: "🔁", sub: "compares, updates" },
        { name: "DOM", icon: "🖥️", sub: "what the user sees" },
      ],
      steps: [
        { at: 0, text: "You keep data in state and props. You never touch the DOM directly." },
        { at: [1, 2], text: "Your component is a function: given the data, it returns a description of the UI, written in JSX." },
        { at: 3, text: "React compares the new description with the previous one, and works out the smallest set of changes." },
        { at: 4, text: "It applies only those changes to the real DOM." },
        { at: [0, 1, 2, 3, 4], text: "When the data changes, React calls your function again. You describe what the screen should look like; React makes it so. That's declarative UI." },
      ],
    },
    B(
      "Here's the idea of React. Your data lives in state and props, and you never reach into the DOM yourself.",
      "A component is a function. Given the data, it returns a description of what the UI should look like, written in JSX.",
      "React compares that description with the previous one, and works out what actually changed.",
      "Then it applies just those changes to the real DOM.",
      { say: "And when the data changes, React simply calls your function again. You describe the result, not the steps to get there. That's what declarative means, and nearly every React question is a detail of this loop.", tone: "key" },
    ),
  ),
  qa(1, "What is React, and why use it?", [
    "A JavaScript library for building user interfaces from components",
    "Declarative: describe the UI for the current state; React updates the DOM",
    "Reusable components, one-way data flow, a huge ecosystem, React Native for mobile",
  ]),
  qa(2, "What is JSX, and what does it compile to?", [
    "A syntax extension that lets you write HTML-like markup in JavaScript",
    "It compiles to function calls: <h1 className=\"x\">Hi</h1> → jsx(\"h1\", { className: \"x\", children: \"Hi\" })",
    "Those calls return plain objects: React elements. Expressions go in { }",
  ], { code: `// you write\n<Button kind="primary">Save</Button>\n\n// the compiler emits\njsx(Button, { kind: "primary", children: "Save" })` }),
  qa(3, "What is the difference between a React element, a component and a node?", [
    "Component: a function (or class) that returns UI",
    "Element: the plain object describing what to render, e.g. what <Button /> creates",
    "Node: anything renderable: elements, strings, numbers, arrays, null",
  ]),
  qa(4, "What is the difference between props and state?", [
    "Props: inputs passed in by the parent; read-only for the child",
    "State: data the component owns and changes over time, with a setter",
    "Changing either causes a re-render; derive what you can instead of storing it",
  ]),
  qa(5, "What is one-way data flow, and what does \"lifting state up\" mean?", [
    "Data flows down through props; changes flow up through callbacks",
    "Two siblings that need the same data: move the state to their closest common parent",
    "The parent passes the value down and a setter (or handler) to change it",
  ]),
  qa(6, "How does composition work with props.children?", [
    "Whatever you put between a component's tags arrives as props.children",
    "Build wrappers (Card, Modal, Layout) that don't need to know their content",
    "Prefer composition to inheritance; slots can also be named props (header, footer)",
  ]),
  qa(7, "What are fragments, and how do you render conditionally?", [
    "<>…</> groups elements without adding an extra DOM node",
    "Conditional: if/else before return, the ternary a ? b : c, or cond && <X />",
    ["Careful: {count && <List />} renders 0 when count is 0: use count > 0", "Careful with and: if count is zero, React renders a zero on the screen. Use count greater than zero."],
  ]),
  custom(
    "pytape",
    {
      title: "Why keys: insert at the front, with index keys",
      sub: "each cell is a list item; the number above it is its key",
      cells: ["Ana", "Ben", "Cy"],
      steps: [
        { cells: ["Ana", "Ben", "Cy"], note: "three items, keyed by index 0, 1, 2; Ana's row has a half-typed note in its input" },
        { cells: ["Zoe", "Ana", "Ben", "Cy"], pick: [0], out: "key 0 is now Zoe, but React keeps key 0's DOM and state", note: "with index keys, React thinks item 0 changed and a new item 3 was added" },
        { cells: ["Zoe", "Ana", "Ben", "Cy"], pick: [0, 1, 2, 3], out: "Ana's half-typed note now shows on Zoe's row", note: "state and DOM stick to the key, not the data: use a stable id (user.id)" },
      ],
    },
    B(
      "Keys, in one picture. Three people in a list, keyed by their index, zero, one and two. Ana's row has an input where the user has half-typed a note.",
      "Now insert Zoe at the front. With index keys, Zoe gets key zero. React matches by key, so it thinks item zero just changed its text, and that a new item three appeared at the end.",
      { say: "So Ana's half-typed note, which belonged to key zero, now shows on Zoe's row. Component state and DOM stick to the key, not to the data. That's why keys must be stable ids, like the user's id, never the index, when the list can reorder.", tone: "key" },
    ),
  ),
  qa(8, "Why are keys needed in lists?", [
    "They tell React which item is which between renders",
    "So it can keep, move or remove the right DOM nodes and component state",
    "Unique among siblings and stable: an id from your data",
  ]),
  qa(9, "What goes wrong when you use the array index as the key?", [
    "Insert, delete or reorder, and every index after that point changes",
    "State and inputs attach to the wrong rows; extra re-renders and DOM updates",
    "Index keys are fine only for static lists that never reorder",
  ]),
  qa(10, "What is the difference between function and class components?", [
    "Function components: plain functions with hooks: the modern standard",
    "Class components: this.state, setState, lifecycle methods (componentDidMount…)",
    "Classes are still needed for error boundaries; otherwise write functions",
  ]),
  check({
    topic: "keys",
    q: "A todo list lets users reorder items, and uses key={index}. What bug appears?",
    say: "A todo list lets users reorder items, and uses the index as the key. What bug appears?",
    a: "After reordering, state (checkbox, input text, focus) stays with the position, so it shows on the wrong todo. Use key={todo.id}.",
    aSay: "After a reorder, each row's state, like a checked box or typed text, stays with the position, not the todo, so it shows up on the wrong item. Use the todo's id as the key.",
  }),

  // ================================================================ module 2
  sec("2", "State and events", "Module two. State and events. Seven questions, and one surprise behind most of them: state is a snapshot."),
  {
    kind: "code",
    title: "The idea: each render sees a snapshot of state",
    lang: "jsx",
    code: `function Counter() {
  const [count, setCount] = useState(0);

  function addThree() {
    setCount(count + 1);   // count is 0 in this render
    setCount(count + 1);   // still 0
    setCount(count + 1);   // still 0
    console.log(count);    // 0
  }                        // next render: count = 1

  // fix: updater functions queue on the latest value
  // setCount(c => c + 1) three times → 3
  return <button onClick={addThree}>{count}</button>;
}`,
    highlight: [[2, 2], [4, 9], [11, 12]],
    beats: B(
      "Here's the idea of the module. When a component renders, useState gives it the current value. Count is a plain constant for that whole render: a snapshot.",
      "So inside the click handler, count is zero, every time you read it. Three calls to set count with count plus one all ask for one. And the log prints zero, because setting state doesn't change this render's variable. It schedules a new render.",
      { say: "When the next value depends on the previous one, pass an updater function instead: c, arrow, c plus one. React queues them, and runs each on the latest value, so three of them give three. State is a snapshot per render, and setters schedule the next one.", tone: "key" },
    ),
  },
  qa(11, "How does useState work?", [
    "const [value, setValue] = useState(initial): React stores the value for this component",
    "Calling the setter schedules a re-render with the new value",
    "React matches state to the component by call order (hence the rules of hooks)",
    "useState(() => expensive()) runs the initialiser only once",
  ]),
  qa(12, "Why does console.log show the old value right after setState?", [
    "The setter doesn't change the current render's variable: it's a snapshot",
    "It schedules a re-render; the new value arrives in the next render",
    "Use the value you just computed, or read it in the next render or an effect",
  ]),
  qa(13, "What is batching in React?", [
    "Several state updates in the same event are grouped into one re-render",
    "Since React 18, automatic everywhere: timeouts, promises, native events too",
    "flushSync forces an immediate update when you really need it (rare)",
  ]),
  qa(14, "Why must you never mutate state directly?", [
    "React compares by reference (Object.is): a mutated object looks unchanged, so no re-render",
    "Mutation also breaks memo, effects' dependencies and concurrent rendering",
    "Create new objects and arrays: { ...user, name }, [...items, item], items.map / filter",
  ], { code: `// ✗ same array: React sees no change\nitems.push(item); setItems(items);\n\n// ✓ a new array\nsetItems([...items, item]);\nsetUser({ ...user, name: "Ana" });` }),
  qa(15, "How do events work in React (SyntheticEvent)?", [
    "Handlers are props in camelCase: onClick={handle}, passing the function, not calling it",
    "React wraps native events in a SyntheticEvent with the same interface across browsers",
    "React attaches listeners at the root and delegates (since 17, the root container, not document)",
  ]),
  qa(16, "What is the difference between controlled and uncontrolled components?", [
    "Controlled: the input's value comes from state and changes through onChange",
    "Uncontrolled: the DOM keeps the value; read it with a ref or FormData when needed",
    "Controlled for instant validation and dependent fields; uncontrolled for simple forms and files",
  ]),
  qa(17, "How do you handle forms in React?", [
    "Controlled inputs with state, or uncontrolled with FormData on submit",
    "onSubmit with event.preventDefault() (or React 19 form actions)",
    "Larger forms: React Hook Form plus a schema validator like Zod",
  ]),
  check({
    topic: "state snapshot",
    q: "setCount(count + 1); setCount(count + 1); with count = 5. What is count after the re-render?",
    say: "Count is five. You call set count with count plus one, twice. What is count after the re-render?",
    a: "6: both calls read the same snapshot (5). Use setCount(c => c + 1) twice to get 7.",
    aSay: "Six. Both calls read the same snapshot, five, and ask for six. Use the updater form twice to get seven.",
  }),
];
