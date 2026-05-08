/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "768px",
      xl: "768px",
      "2xl": "1366px",
    },
    extend: {},
  },
  plugins: [],
};
