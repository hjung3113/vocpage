// Single source for design tokens.
// Feeds Tailwind @theme (via index.css) and CSS custom properties.
// Full values populated in Phase 6-9 (Prototype → Components).
// Never import hex values elsewhere — always go through this file.
export const tokens = {
  // Dark-mode resolved values for JS/canvas usage (light-dark() not available in JS)
  brand: 'oklch(63% 0.19 258)',
  accent: 'oklch(70% 0.21 255)',
  bgApp: 'oklch(11% 0.016 264)',
  bgPanel: 'oklch(14.5% 0.019 262)',
  bgSurface: 'oklch(18.5% 0.021 260)',
  bgElevated: 'oklch(23% 0.022 258)',
  textPrimary: 'oklch(95.5% 0.007 252)',
  textSecondary: 'oklch(79% 0.014 255)',
  textTertiary: 'oklch(59% 0.012 258)',
  textQuaternary: 'oklch(43% 0.01 260)',
  borderDefault: 'oklch(27% 0.02 259 / 0.85)',
  overlayBg: 'oklch(8% 0.012 265 / 0.88)',
  defaultTypeColor: 'oklch(43% 0.01 260)',
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
