/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6D4AFF',
        'brand-50': '#EEE9FF',
        'brand-500': '#6D4AFF',
        'brand-600': '#4F2FD8',
        primary: '#6D4AFF',
        'primary-dark': '#4F2FD8',
        'primary-light': '#EEE9FF',
        surface: '#ffffff',
        'surface-dark': '#111827',
        'surface-elevated': '#1F2937',
        background: '#FAFAFC',
        'background-dark': '#0F172A',
        content: '#0F172A',
        muted: '#64748B',
        border: '#E5E7EB',
        success: '#22C55E',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        dropdown: '0 4px 12px rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
