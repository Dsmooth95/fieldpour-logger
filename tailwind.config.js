/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Construction palette
        hazard: { DEFAULT: '#ffc20e', dark: '#e0a800', light: '#ffe27a' },
        asphalt: { DEFAULT: '#18181b', soft: '#27272a', mid: '#3f3f46' },
        concrete: { DEFAULT: '#d8d5ce', light: '#ebe9e4', dark: '#b9b5ac' },
        cone: '#ff6a13',
        pass: { DEFAULT: '#2f8f3a', dark: '#1f6b29', light: '#d7efda' },
        reject: { DEFAULT: '#d62828', dark: '#a61b1b', light: '#fbdcdc' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'Impact', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        plate: '4px 4px 0 0 #18181b',
        'plate-sm': '2px 2px 0 0 #18181b',
      },
    },
  },
  plugins: [],
}
