/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5E6',
          100: '#FFEACC',
          200: '#FFD599',
          300: '#FFC066',
          400: '#FFAB33',
          500: '#FF9600',
          600: '#CC7800',
          700: '#995A00',
          800: '#663C00',
          900: '#331E00',
        },
        neutral: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
        success: {
          50: '#E6F6ED',
          100: '#C2E8D1',
          200: '#9DD9B5',
          500: '#28A745',
          700: '#1E7E34',
        },
        warning: {
          50: '#FFF8E6',
          100: '#FFEFCC',
          200: '#FFE5B3',
          500: '#FFC107',
          700: '#D39E00',
        },
        error: {
          50: '#FCE8E8',
          100: '#F8D1D1',
          200: '#F4BABA',
          500: '#DC3545',
          700: '#BD2130',
        },
        rating: {
          yellow: {
            50: '#FFF9E6',
            100: '#FFF3CC',
            500: '#FFD700',
            700: '#CCAD00',
          },
          gray: {
            50: '#F8F9FA',
            100: '#F1F3F5',
            500: '#ADB5BD',
            700: '#6C757D',
          },
        },
      },
    },
  },
  plugins: [],
} 