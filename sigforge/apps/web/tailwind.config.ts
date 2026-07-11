import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F62FE",
          fg: "#F4F4F4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
