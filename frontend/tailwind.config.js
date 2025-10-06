/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Hebrew"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#0b1220',
          card: '#101a30',
          border: '#1e2a48',
          text: '#e7ecf5',
          textMuted: '#9fb4d9',
        },
        light: {
          bg: '#f5f7fa',
          card: '#ffffff',
          border: '#e1e8ed',
          text: '#1a202c',
          textMuted: '#718096',
        },
      },
    },
  },
  plugins: [],
};
