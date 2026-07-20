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
          primary:   '#080F1C',   // deepest navy — page background
          secondary: '#0D1A2E',   // card / sidebar background
          tertiary:  '#122238',   // hover rows, inputs
        },
        accent: {
          primary:   '#29ABE2',   // logo cyan — CTAs, active nav, links
          secondary: '#2474B5',   // logo medium blue — secondary elements
          danger:    '#FF4466',   // red for errors / losses
        },
        text: {
          primary:   '#E8EDF4',
          secondary: '#7A9EC5',   // blue-tinted secondary text
          muted:     '#4A6585',   // blue-tinted muted text
        },
        border:  '#1A3050',       // subtle navy border
        success: '#00C875',       // green for gains / positive
        warning: '#FFBB00',
      },
      fontFamily: {
        sans: ['Instrument Sans', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'btn':  '8px',
      },
      boxShadow: {
        'card':    '0 4px 16px rgba(0, 0, 0, 0.3)',
        'glow':    '0 8px 24px rgba(41, 171, 226, 0.35)',
        'glow-sm': '0 4px 12px rgba(41, 171, 226, 0.2)',
      },
      animation: {
        'gradient-shift': 'gradientShift 20s ease-in-out infinite',
        'chart-pulse':    'chartPulse 3s ease-in-out infinite',
        'fade-in-up':     'fadeInUp 0.6s ease-out backwards',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%':       { transform: 'translate(-5%, -5%) rotate(2deg)' },
        },
        chartPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%':       { opacity: '0.8' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
