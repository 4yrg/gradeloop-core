/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gradeloop: {
          'primary': '#2AB6B6',
          'secondary': '#4ADE80',
          'tertiary': '#1E6091',
          'dark': '#1A2226',
          'light': '#F8FAFC',
          'text-dark': '#0F172A',
          'text-medium': '#475569',
          'border-light': '#E2E8F0',
        },
        feedback: {
          'success': '#22C55E',
          'warning': '#FACC15',
          'error': '#EF4444',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #287845, #2AB6B6)',
        'gradient-secondary': 'linear-gradient(135deg, #2AB6B6, #1E6091)',
      }
    },
  },
  plugins: [],
}
