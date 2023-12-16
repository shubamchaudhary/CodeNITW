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
  plugins: [],
};

