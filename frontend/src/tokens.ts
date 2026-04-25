// Single source for design tokens.
// Feeds Tailwind @theme (via index.css) and CSS custom properties.
// Full values populated in Phase 6-9 (Prototype → Components).
// Never import hex values elsewhere — always go through this file.
export const tokens = {
  brand: 'oklch(56.5% 0.196 261.3)',
  accent: 'oklch(60% 0.15 200)',
  bgApp: 'oklch(14% 0.01 264)',
  bgPanel: 'oklch(17% 0.01 264)',
  textPrimary: 'oklch(95% 0.003 264.5)',
  textSecondary: 'oklch(65% 0.012 264)',
  textTertiary: 'oklch(45% 0.01 264)',
  borderDefault: 'oklch(28% 0.012 264)',
  overlayBg: 'oklch(0% 0 0 / 0.5)',
  defaultTypeColor: 'oklch(38% 0.01 264)',
  // Chart series — mirrors --chart-* CSS vars in index.css
  chartBlue: 'oklch(63% 0.19 258)',
  chartSky: 'oklch(72% 0.14 235)',
  chartEmerald: 'oklch(62% 0.19 158)',
  chartAmber: 'oklch(70% 0.16 72)',
  chartRed: 'oklch(58% 0.22 25)',
  chartTeal: 'oklch(65% 0.16 195)',
  chartIndigo: 'oklch(55% 0.17 270)',
} as const;

export type TokenKey = keyof typeof tokens;
