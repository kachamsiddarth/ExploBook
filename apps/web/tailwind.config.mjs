/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F3EED7',
        ink: '#292728',
        muted: '#777164',
        accent: '#B6A46A',
        'paper-2': '#E9E2C7',
      },
    },
  },
  plugins: [],
};
