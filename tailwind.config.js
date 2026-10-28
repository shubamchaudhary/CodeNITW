const plugin = require("tailwindcss/plugin");
const defaultTheme = require("tailwindcss/defaultTheme");

// The design system's tokens (src/styles/tokens.css) as Tailwind names. Each
// one already switches with the theme, so `bg-canvas text-fg border-line`
// needs no `dark:` partner.
const token = (name) => `var(--${name})`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  variants: {
    extend: {
      display: ['group-hover']
    }
  },
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",

    // Path to the tremor module
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or false
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        "surface-subtle": token("surface-subtle"),
        "surface-hover": token("surface-hover"),
        line: token("line"),
        "line-strong": token("line-strong"),
        fg: token("fg"),
        "fg-muted": token("fg-muted"),
        "fg-subtle": token("fg-subtle"),
        primary: token("primary"),
        "primary-hover": token("primary-hover"),
        "on-primary": token("on-primary"),
        brand: token("brand"),
        "brand-fg": token("brand-fg"),
        "brand-subtle": token("brand-subtle"),
        focus: token("focus"),
        success: token("success"),
        "success-fg": token("success-fg"),
        "success-subtle": token("success-subtle"),
        "warning-fg": token("warning-fg"),
        "warning-subtle": token("warning-subtle"),
        "danger-fg": token("danger-fg"),
        "danger-subtle": token("danger-subtle"),
      },
      fontFamily: {
        sans: ["Geist", ...defaultTheme.fontFamily.sans],
        mono: ['"Geist Mono"', ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        xs: token("shadow-xs"),
        overlay: token("shadow-overlay"),
      },
    },
  },
  plugins: [
    // `light:` styles apply only in light mode (no `dark` class on <html>), so
    // light mode can be restyled without any chance of touching dark mode.
    plugin(({ addVariant }) => addVariant("light", "html:not(.dark) &")),
  ],
};
