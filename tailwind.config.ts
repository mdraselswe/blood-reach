import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E11D48',
          foreground: '#FFFFFF',
          50: '#FFE4E8',
          100: '#FFCCD5',
          200: '#FF9BB0',
          300: '#FF688A',
          400: '#FA406D',
          500: '#E11D48',
          600: '#C00F39',
          700: '#9F0B2F',
          800: '#7F0825',
          900: '#67061E',
        },
        surface: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(225, 29, 72, 0.1)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
