import React from "react";

// The design system's small parts (the InterviewPlanPrep Design System
// artifact), shared by the reading pages so a button, a tag or a progress bar
// looks the same wherever it appears. Every colour is a token
// (src/styles/tokens.css); none needs a `dark:` partner.

// Buttons: 32px, 6px radius, four variants. One primary in sight at a time.
//   primary   — ink fill: the main action of the view
//   secondary — outlined: every other labelled action
//   ghost     — no border: low-weight actions in rows and toolbars
//   success / brand — a secondary that is switched on (done, planned)
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-md font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none";
const BUTTON_VARIANT = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-canvas text-fg border border-line-strong hover:bg-surface-subtle",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-hover",
  success: "bg-success-subtle text-success-fg border border-transparent",
  brand: "bg-brand-subtle text-brand-fg border border-transparent",
};
const BUTTON_SIZE = {
  md: "h-8 px-3 text-[13px]",
  sm: "h-7 px-2.5 text-[12px]",
  icon: "h-8 w-8 text-[13px]",
  "icon-sm": "h-7 w-7 text-[12px]",
};

export function buttonClass(variant = "secondary", size = "md") {
  return `${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]}`;
}

export const Button = React.forwardRef(function Button(
  { variant = "secondary", size = "md", className = "", children, ...rest },
  ref
) {
  return (
    <button ref={ref} type="button" className={`${buttonClass(variant, size)} ${className}`} {...rest}>
      {children}
    </button>
  );
});

// Two to five exclusive options on a grey track; the chosen one is a raised
// white thumb. `options`: [{ key, label, title?, ...rest }] — the rest (e.g.
// data-tour) lands on the option's button.
export function Segmented({ options, value, onChange, size = "md", className = "" }) {
  const h = size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-3 text-[13px]";
  return (
    <div role="group" className={`inline-flex gap-0.5 p-0.5 rounded-md bg-surface-hover ${className}`}>
      {options.map(({ key, label, ...rest }) => {
        const on = key === value;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className={`${h} rounded font-medium transition-colors ${
              on ? "bg-canvas text-fg shadow-xs" : "text-fg-muted hover:text-fg"
            }`}
            {...rest}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// A 4px bar in the brand colour. `value` is 0–1.
export function ProgressBar({ value, className = "", title }) {
  return (
    <div className={`h-1 rounded-full bg-surface-hover overflow-hidden ${className}`} title={title}>
      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${Math.round(value * 1000) / 10}%` }} />
    </div>
  );
}

// A priority (P0–P3) or chapter id: mono, boxed, coloured only by `tag.cls`.
export function PriorityTag({ tag, className = "" }) {
  return (
    <span
      className={`inline-flex items-center h-[18px] px-[5px] rounded border border-line font-mono text-[11px] font-medium leading-none tracking-[0.02em] shrink-0 ${tag.cls} ${className}`}
    >
      {tag.label}
    </span>
  );
}

// 16px line icons: 1.5px strokes, round caps, currentColor.
const Svg = ({ className = "w-4 h-4", children }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    {children}
  </svg>
);
const S = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };

export const Icon = {
  plus: (p) => (
    <Svg {...p}>
      <path d="M8 3.5v9M3.5 8h9" {...S} />
    </Svg>
  ),
  check: (p) => (
    <Svg {...p}>
      <path d="M3.5 8.5l3 3 6-7" {...S} strokeWidth={1.6} />
    </Svg>
  ),
  external: (p) => (
    <Svg {...p}>
      <path d="M6.5 3.5h-3v9h9v-3M9.5 2.5h4v4M13.5 2.5 7.5 8.5" {...S} />
    </Svg>
  ),
  copy: (p) => (
    <Svg {...p}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" {...S} />
      <path d="M10.5 3.5V3a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" {...S} />
    </Svg>
  ),
  play: (p) => (
    <Svg {...p}>
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" {...S} />
      <path d="M6.75 6v4l3.5-2z" fill="currentColor" />
    </Svg>
  ),
  doc: (p) => (
    <Svg {...p}>
      <path d="M4 1.75h5l3 3v9.5H4z" {...S} />
      <path d="M9 1.75v3h3M6 8.5h4M6 11h4" {...S} />
    </Svg>
  ),
  history: (p) => (
    <Svg {...p}>
      <path d="M2.6 8a5.4 5.4 0 1 0 1.6-3.8" {...S} />
      <path d="M2.4 2.4v2.4h2.4M8 5.2V8l2 1.4" {...S} />
    </Svg>
  ),
  expand: (p) => (
    <Svg {...p}>
      <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" {...S} />
    </Svg>
  ),
  collapse: (p) => (
    <Svg {...p}>
      <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" {...S} />
    </Svg>
  ),
  menu: (p) => (
    <Svg {...p}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" {...S} />
    </Svg>
  ),
  note: (p) => (
    <Svg {...p}>
      <path d="M3 4.5h10M3 8h10M3 11.5h6" {...S} />
    </Svg>
  ),
};
