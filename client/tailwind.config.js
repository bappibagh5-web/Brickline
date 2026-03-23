/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif']
      },
      colors: {
        brickline: {
          50: '#eef2ff',
          100: '#dfe7ff',
          200: '#bfd0ff',
          400: '#4e6bf0',
          500: '#2f54eb',
          600: '#2246d0',
          700: '#1a359f',
          900: '#12256f'
        }
      },
      boxShadow: {
        panel: '0 8px 30px rgba(24, 37, 77, 0.08)'
      }
    }
  },
  plugins: []
};
