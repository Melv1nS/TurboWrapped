import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#191414',
          white: '#FFFFFF',
          grey: '#B3B3B3',
          'dark-grey': '#282828',
          'light-grey': '#404040',
        },
        'spotify-green': '#1DB954',
        'spotify-black': '#191414',
        'spotify-white': '#FFFFFF',
        'spotify-grey': '#B3B3B3',
        'spotify-dark-grey': '#282828',
        'spotify-darker-grey': '#181818', // Add this line
        'spotify-light-grey': '#404040',
      },
    },
  },
  plugins: [],
} satisfies Config;
