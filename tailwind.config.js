/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ffe5e8',
          100: '#ffccd2',
          200: '#ff99a6',
          300: '#ff6679',
          400: '#ff334d',
          500: '#ff001f', // rouge Persona
          600: '#d4001a',
          700: '#aa0015',
          800: '#7f0010',
          900: '#55000b'
        }
      }
    }
  },
  plugins: []
};

