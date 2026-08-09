/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        panel: "var(--color-panel)",
        canvas: "var(--color-canvas)",
        line: "var(--color-line)",
        cyan: "#5ee7d8",
        violet: "#8b7cff",
      },
      boxShadow: { glow: "0 0 32px rgba(94, 231, 216, 0.12)" },
    },
  },
  plugins: [],
};
