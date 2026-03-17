import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // THIS IS THE MAGIC LINE THAT FIXES THE TOGGLE
  content:[
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          950: '#050505',
        }
      }
    },
  },
  plugins:[],
};
export default config;