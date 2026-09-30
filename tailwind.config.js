const plugin = require("tailwindcss/plugin");

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
    extend: {},
  },
  plugins: [
    // `light:` styles apply only in light mode (no `dark` class on <html>), so
    // light mode can be restyled without any chance of touching dark mode.
    plugin(({ addVariant }) => addVariant("light", "html:not(.dark) &")),
  ],
};

