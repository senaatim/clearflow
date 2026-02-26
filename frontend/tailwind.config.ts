import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0e14',
          secondary: '#141922',
          tertiary: '#1a2030',
        },
        accent: {
          primary: '#00ffaa',
          secondary: '#00d4ff',
          danger: '#ff4466',
        },
        text: {
          primary: '#e8edf4',
          secondary: '#8b94a8',
          muted: '#5a6478',
        },
        border: '#252d3f',
        success: '#00ff88',
        warning: '#ffbb00',
      },
      fontFamily: {
        sans: ['Instrument Sans', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '8px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'glow': '0 8px 24px rgba(0, 255, 170, 0.3)',
        'glow-sm': '0 4px 12px rgba(0, 255, 170, 0.2)',
      },
      animation: {
        'gradient-shift': 'gradientShift 20s ease-in-out infinite',
        'chart-pulse': 'chartPulse 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out backwards',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(-5%, -5%) rotate(2deg)' },
        },
        chartPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
