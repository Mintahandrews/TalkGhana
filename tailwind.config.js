/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eefbfa",
          100: "#d5f5f4",
          200: "#aeebea",
          300: "#75dbd9",
          400: "#39c3c1",
          500: "#14b8a6", // Main primary color
          600: "#0d8580",
          700: "#116e6a",
          800: "#115756",
          900: "#124948",
          950: "#032a29",
        },
        secondary: {
          50: "#f5f6fa",
          100: "#eaecf4",
          200: "#d1d6e7",
          300: "#abb5d3",
          400: "#7f8eba",
          500: "#5b6ba4",
          600: "#4d5a8a",
          700: "#414b70",
          800: "#39405c",
          900: "#33384e",
          950: "#1f2130",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        serif: [
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      spacing: {
        18: "4.5rem",
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [],
  // Safelist critical classes that might be dynamically generated
  safelist: [
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500",
    "text-red-500",
    "text-yellow-500",
    "text-green-500",
    {
      pattern: /bg-(red|green|blue|yellow|gray|purple|orange)-(100|500)/,
    },
    {
      pattern: /text-(red|green|blue|yellow|gray|purple|orange)-(100|500|800)/,
    },
    {
      pattern: /border-(red|green|blue|yellow|gray|purple|orange)-(200|300)/,
    },
  ],
};
