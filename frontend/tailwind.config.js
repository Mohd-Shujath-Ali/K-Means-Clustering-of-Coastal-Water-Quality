/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#0369A1',
        // Suitability tiers: S1 Prime → S4 Unsuitable
        p1: '#0E7490',
        p2: '#0891B2',
        p3: '#06B6D4',
        p4: '#64748B',
        // Regime palette
        r1: '#0E7490',
        r2: '#0F766E',
        r3: '#065F46',
        r4: '#7C3AED',
        r5: '#B91C1C',
      },
    },
  },
  plugins: [],
}
