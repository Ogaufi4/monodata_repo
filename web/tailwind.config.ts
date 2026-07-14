import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17221d",
        sand: "#f5efe2",
        reed: "#2f6a4f",
        sun: "#e6a735",
        // Landing palette
        cream: "#f4eee1",
        shell: "#fdfbf3",
        clay: "#9a5124",
        leaf: "#6db35b",
        night: "#14120f",
        stone: "#6f6259",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
