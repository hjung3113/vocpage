// Single source for design tokens — feeds Tailwind @theme and CSS custom properties.
// Dark-mode OKLCH values used for @theme; light-dark() pairs live in index.css :root.
// Never import hex values elsewhere — always go through this file.
export const tokens = {
  // Backgrounds (dark mode values)
  bgApp: 'oklch(11% 0.016 264)',
  bgPanel: 'oklch(14.5% 0.019 262)',
  bgSurface: 'oklch(18.5% 0.021 260)',
  bgElevated: 'oklch(23% 0.022 258)',

  // Text (dark mode values)
  textPrimary: 'oklch(95.5% 0.007 252)',
  textSecondary: 'oklch(79% 0.014 255)',
  textTertiary: 'oklch(59% 0.012 258)',
  textQuaternary: 'oklch(43% 0.010 260)',

  // Brand — Samsung Blue (dark mode values)
  brand: 'oklch(63% 0.19 258)',
  accent: 'oklch(70% 0.21 255)',
  accentHover: 'oklch(76% 0.18 252)',
  brandBg: 'oklch(22% 0.035 262)',
  brandBorder: 'oklch(35% 0.060 260)',

  // Borders (dark mode values)
  borderSubtle: 'oklch(20% 0.018 261 / 0.8)',
  borderStandard: 'oklch(27% 0.020 259 / 0.85)',
  borderSolid: 'oklch(25% 0.019 260)',

  // Chart colors (theme-independent)
  chartBlue: 'oklch(63% 0.19 258)',
  chartSky: 'oklch(72% 0.14 235)',
  chartEmerald: 'oklch(62% 0.19 158)',
  chartAmber: 'oklch(70% 0.16 72)',
  chartRed: 'oklch(58% 0.22 25)',
  chartTeal: 'oklch(65% 0.16 195)',
  chartIndigo: 'oklch(55% 0.17 270)',

  // Status colors (theme-independent fixed values)
  statusGreen: 'oklch(55% 0.17 150)',
  statusAmber: 'oklch(70% 0.16 72)',
  statusRed: 'oklch(58% 0.22 25)',
} as const;

export type TokenKey = keyof typeof tokens;
