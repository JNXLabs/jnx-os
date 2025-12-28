import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // JNX Design System Radius
        'button': '0.5rem',    // 8px
        'card': '0.75rem',     // 12px
        'input': '0.75rem',    // 12px
        'bubble': '1rem',      // 16px
      },
      boxShadow: {
        // JNX Design System Shadows
        'glow-primary': '0 0 20px -5px rgba(6, 182, 212, 0.5)',
        'glow-hover': '0 0 30px -5px rgba(6, 182, 212, 0.7)',
        'glow-intense': '0 0 40px -5px rgba(6, 182, 212, 0.9)',
        'input': '0 0 20px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
      colors: {
        // JNX Dark Design System - Complete Palette
        jnx: {
          dark: '#030712',       // Very dark blue/black (base background)
          darker: '#060a14',     // Deeper background
          card: '#0b1221',       // Card background
          sidebar: 'rgba(2, 6, 23, 0.5)', // Sidebar background
          input: 'rgba(15, 23, 42, 0.5)', // Input background
          primary: '#06b6d4',    // Cyan 500 (primary accent)
          secondary: '#14b8a6',  // Teal 500 (secondary accent)
          accent: '#3b82f6',     // Blue 600 (tertiary accent)
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        // JNX Design System Animation
        'superGlow': {
          '0%, 100%': {
            boxShadow: '0 0 20px -5px rgba(6, 182, 212, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px -5px rgba(6, 182, 212, 0.9)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'super-glow': 'superGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
