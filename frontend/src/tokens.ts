// Single source for design tokens.
// Feeds Tailwind @theme (via index.css) and CSS custom properties.
// Full values populated in Phase 6-9 (Prototype → Components).
// Never import hex values elsewhere — always go through this file.
export const tokens = {
  brand: 'oklch(56.5% 0.196 261.3)',
  accent: 'oklch(60% 0.15 200)',
  bgApp: 'oklch(14% 0.01 264)',
  textPrimary: 'oklch(95% 0.003 264.5)',
  textSecondary: 'oklch(65% 0.012 264)',
  overlayBg: 'oklch(0% 0 0 / 0.5)',
} as const;

export type TokenKey = keyof typeof tokens;
