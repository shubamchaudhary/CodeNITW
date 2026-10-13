// Frosted-glass surfaces shared by every page, so the whole app reads as one
// system. Two levels only:
//   GLASS       — an outer card sitting on the page backdrop (deep frost)
//   GLASS_PANEL — an inner panel or row sitting *on* a card (lighter frost)
// Panels carry a real grey edge in light mode: a white border on a white card
// reads as no border at all.
//
// Light mode (the `light:` classes, which never apply in dark mode) drops the
// frost for the look of Linear, Vercel and Stripe: solid white surfaces on an
// off-white canvas, each lifted by a hairline edge and a soft two-layer shadow
// rather than a heavy grey border. Edges are translucent slate, so they read
// the same on white, on the canvas and on a tinted row.
const FROST =
  "backdrop-blur-2xl bg-white/60 dark:bg-white/[0.04] border border-white/70 dark:border-white/[0.08] shadow-[0_8px_32px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]";

export const GLASS = `${FROST} light:backdrop-filter-none light:bg-white light:border-slate-900/[0.08] light:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.06)]`;

// A light-mode lift on hover, for cards that open or link somewhere.
export const LIGHT_LIFT =
  "light:hover:border-slate-900/[0.12] light:hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_28px_-10px_rgba(15,23,42,0.14)]";

// A card in dark mode that, in light mode, is a row inside a light card (a
// plan's tasks): flat white on a hairline, lifting only on hover. A second
// layer of full card shadows inside a card reads as clutter in light mode.
export const GLASS_ROW = `${FROST} light:backdrop-filter-none light:bg-white light:border-slate-900/[0.08] light:shadow-[0_1px_1px_rgba(15,23,42,0.03)] light:hover:border-slate-900/[0.14] light:hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.10)]`;

// The track of a segmented control (filter tabs, Read/Write): frosted like a
// card in dark mode; in light mode a recessed grey well whose selected option
// is a raised white pill (SEGMENT_ON), the way macOS and Vercel draw tabs.
export const GLASS_TRACK = `${FROST} light:backdrop-filter-none light:bg-slate-900/[0.045] light:border-slate-900/[0.04] light:shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]`;
export const SEGMENT_ON =
  "light:bg-none light:bg-white light:text-slate-900 light:shadow-[0_1px_2px_rgba(15,23,42,0.10),0_0_0_1px_rgba(15,23,42,0.05)]";
export const SEGMENT_OFF = "light:text-slate-500 light:hover:text-slate-900 light:hover:bg-white/60";

// Deliberately no backdrop-blur: a panel sits on an already-frosted card, so
// re-blurring an blurred backdrop changes nothing visually while costing a
// compositing layer each. Long lists put hundreds of these on screen, and past
// ~50 stacked backdrop-filters Chromium starts tearing them into black blocks.
export const GLASS_PANEL =
  "bg-white/75 dark:bg-white/[0.03] border border-gray-200/90 dark:border-white/[0.07] light:bg-white light:border-slate-900/[0.07]";

// A small secondary button in light mode (LeetCode, Tomorrow, Copy): white,
// hairline edge, a 1px shadow so it reads as pressable.
export const LIGHT_BUTTON =
  "light:bg-white light:border-slate-900/[0.10] light:text-slate-600 light:shadow-[0_1px_1px_rgba(15,23,42,0.04)] light:hover:bg-slate-50 light:hover:text-slate-900 light:hover:border-slate-900/[0.16]";

// Light-mode form fields: hairline edge, ink text, and a soft violet halo on
// focus (Stripe's and Linear's inputs) instead of a hard coloured ring.
export const LIGHT_FIELD =
  "light:bg-white light:border-slate-900/[0.12] light:text-slate-800 light:placeholder-slate-400 light:shadow-[0_1px_1px_rgba(15,23,42,0.03)] light:focus:outline-none light:focus:border-violet-500 light:focus:ring-4 light:focus:ring-violet-500/10";

// The one primary button colour in light mode: brand violet (the logo's),
// with a hairline inner highlight so it reads as raised, not flat.
export const LIGHT_PRIMARY =
  "light:bg-none light:bg-violet-600 light:hover:bg-violet-700 light:text-white light:shadow-[0_1px_2px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.16)]";
