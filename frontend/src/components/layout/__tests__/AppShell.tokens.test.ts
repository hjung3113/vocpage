import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Coupling guard for Issue 166.
 *
 * AppShell <main>'s padding and VocListHeader's sticky `top` must remain
 * driven by the same semantic token (--app-main-pad). If anyone reverts
 * <main> to a Tailwind p-* class or a raw --sp-* var, this test fires
 * before the gap regression (Issue 162) can re-ship.
 */
describe('AppShell token coupling (Issue 166)', () => {
  const source = readFileSync(resolve(__dirname, '../AppShell.tsx'), 'utf-8');

  it('<main> padding is driven by --app-main-pad', () => {
    expect(source).toMatch(/var\(--app-main-pad\)/);
  });

  it('<main> does not use Tailwind p-* shorthand for padding (would silently un-couple from sticky offset)', () => {
    // Allow only padding-side utilities (px-, py-, pt-, pr-, pb-, pl-) — disallow bare p-N which sets all sides.
    const mainOpenTag = source.match(/<main[^>]*>/);
    expect(mainOpenTag).toBeTruthy();
    expect(mainOpenTag![0]).not.toMatch(/\bp-\d/);
  });

  it('<main> does not consume raw --sp-* vars for padding (must go through --app-main-pad)', () => {
    const mainOpenTag = source.match(/<main[^>]*>/);
    expect(mainOpenTag![0]).not.toMatch(/--sp-\d/);
  });
});
