// Frosted-glass surfaces shared by every page, so the whole app reads as one
// system. Two levels only:
//   GLASS       — an outer card sitting on the page backdrop (deep frost)
//   GLASS_PANEL — an inner panel or row sitting *on* a card (lighter frost)
// Panels carry a real grey edge in light mode: a white border on a white card
// reads as no border at all.
export const GLASS =
  "backdrop-blur-2xl bg-white/60 dark:bg-white/[0.04] border border-white/70 dark:border-white/[0.08] shadow-[0_8px_32px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]";

// Deliberately no backdrop-blur: a panel sits on an already-frosted card, so
// re-blurring an blurred backdrop changes nothing visually while costing a
// compositing layer each. Long lists put hundreds of these on screen, and past
// ~50 stacked backdrop-filters Chromium starts tearing them into black blocks.
export const GLASS_PANEL =
  "bg-white/75 dark:bg-white/[0.03] border border-gray-200/90 dark:border-white/[0.07]";
