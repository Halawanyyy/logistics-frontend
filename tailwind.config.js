/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(var(--brand-primary) / <alpha-value>)',
        'brand-50': 'rgb(var(--brand-primary-light) / <alpha-value>)',
        'brand-500': 'rgb(var(--brand-primary) / <alpha-value>)',
        'brand-600': 'rgb(var(--brand-primary-dark) / <alpha-value>)',
        primary: 'rgb(var(--brand-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--brand-primary-dark) / <alpha-value>)',
        'primary-light': 'rgb(var(--brand-primary-light) / <alpha-value>)',
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
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
