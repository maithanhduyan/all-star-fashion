import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        brand: {
          black: "#111111",
          white: "#FAFAFA",
          beige: "#F5F0EB",
          gray: "#6B6B6B",
          "light-gray": "#E5E5E5",
          gold: "#C9A96E",
        },
      },
      letterSpacing: {
        "extra-wide": "0.2em",
      },
    },
  },
} satisfies Config;
