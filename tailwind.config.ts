import type { Config } from 'tailwindcss'

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
        sans: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Marca "Señal": grafito neutro para la interfaz y amarillo señal como único acento.
        // Se redefinen las escalas que usan los componentes para rebrandear sin tocar cientos de clases.
        slate: {
          50: '#F5F5F2', 100: '#ECECE8', 200: '#DEDED9', 300: '#C4C4BE', 400: '#8E8E87',
          500: '#686863', 600: '#52524E', 700: '#3B3B39', 800: '#24252A', 900: '#17181C', 950: '#0F1013',
        },
        blue: {
          50: '#FFF8E0', 100: '#FFEFB8', 200: '#FFE184', 300: '#FFD452', 400: '#FFC931',
          500: '#E8B000', 600: '#8C6400', 700: '#6E4E00', 800: '#523A00', 900: '#3D2B00', 950: '#2A1D00',
        },
        indigo: {
          50: '#FFF8E0', 100: '#FFEFB8', 200: '#FFE184', 300: '#FFD452', 400: '#FFC931',
          500: '#E8B000', 600: '#8C6400', 700: '#6E4E00', 800: '#523A00', 900: '#3D2B00', 950: '#2A1D00',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
