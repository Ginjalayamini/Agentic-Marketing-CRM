import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0c1015",
        panel: "#111820",
        line: "#233142",
        ink: "#e8eef5",
        muted: "#94a3b8",
        teal: "#38d9c2",
        amber: "#f6c85f",
        coral: "#ff7a70"
      }
    }
  },
  plugins: []
};

export default config;
