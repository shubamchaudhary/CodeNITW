// The surfaces and small controls every page shares, in the design system's
// tokens (src/styles/tokens.css), so the whole app reads as one system in
// both themes. The names are from the frosted-glass look these replaced; the
// look itself is now flat: white surfaces on a white page, each set apart by
// a 1px `line` border, no blur and no resting shadow.
//
// The control constants (SEGMENT_*, LIGHT_*) are overrides: a page puts them
// after its own classes (an old gradient, a coloured shadow), so they are
// marked important to win in either theme.

// An outer card on the page.
export const GLASS = "bg-canvas border border-line";

// A card that opens or links somewhere: the border darkens on hover.
export const LIGHT_LIFT = "hover:border-line-strong transition-colors";

// A row inside a card (a plan's tasks): flat, darkening its border on hover.
export const GLASS_ROW = "bg-canvas border border-line hover:border-line-strong transition-colors";

// The track of a segmented control (filter tabs, Read/Write): a grey well
// whose selected option is a raised white thumb (SEGMENT_ON).
export const GLASS_TRACK = "bg-surface-hover border border-transparent";
export const SEGMENT_ON = "!bg-none !bg-canvas !text-fg !shadow-xs";
export const SEGMENT_OFF = "!bg-none !bg-transparent !shadow-none !text-fg-muted hover:!text-fg";

// An inner panel sitting on a card.
export const GLASS_PANEL = "bg-canvas border border-line";

// A secondary button (LeetCode, Tomorrow, Copy): white, a `line-strong` edge.
export const LIGHT_BUTTON =
  "!bg-none !bg-canvas !border !border-line-strong !text-fg !shadow-none hover:!bg-surface-subtle";

// Form fields: a `line-strong` edge, ink text, a brand ring on focus.
export const LIGHT_FIELD =
  "!bg-canvas !border-line-strong !text-fg placeholder:!text-fg-subtle !shadow-none focus:!outline-none focus:!border-focus focus:!ring-1 focus:!ring-focus";

// The one primary button of a view: ink, not a hue.
export const LIGHT_PRIMARY = "!bg-none !bg-primary hover:!bg-primary-hover !text-on-primary !shadow-none";
