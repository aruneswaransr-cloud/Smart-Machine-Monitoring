/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e14',
        surface: '#111827',
        'surface-2': '#1a2332',
        border: '#1e2a3a',
        primary: '#00d9ff',
        'primary-dim': '#0a8aa8',
        success: '#00e676',
        warning: '#ffab00',
        error: '#ff3d57',
        'text-main': '#e6edf3',
        'text-dim': '#7d8590',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
