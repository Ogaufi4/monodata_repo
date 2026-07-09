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
      },
    },
  },
  plugins: [],
} satisfies Config;
