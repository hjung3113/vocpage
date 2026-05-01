#!/usr/bin/env tsx
/**
 * shadcn-token-rewrite — rewrites shadcn/ui default Tailwind class names to our
 * design-token style (Tailwind v4 arbitrary values referencing CSS custom props).
 *
 * Usage: npx tsx scripts/shadcn-token-rewrite.ts <file>
 *
 * The MAPPING table is the single source of truth. When copying a new shadcn
 * component into frontend/src/components/ui/, run this script over it before
 * committing. Idempotent: applying twice yields the same output.
 */
import { readFileSync, writeFileSync } from 'node:fs';

export const MAPPING: Record<string, string> = {
  'bg-primary': 'bg-[color:var(--brand)]',
  'text-primary-foreground': 'text-[color:var(--text-on-brand)]',
  'hover:bg-primary/90': 'hover:bg-[color:var(--accent-hover)]',
  'bg-background': 'bg-[color:var(--bg-app)]',
  'text-foreground': 'text-[color:var(--text-primary)]',
  'bg-muted': 'bg-[color:var(--bg-elevated)]',
  'text-muted-foreground': 'text-[color:var(--text-secondary)]',
  'bg-accent': 'bg-[color:var(--bg-hover,var(--bg-elevated))]',
  'text-accent-foreground': 'text-[color:var(--text-primary)]',
  'bg-destructive': 'bg-[color:var(--danger)]',
  'text-destructive-foreground': 'text-[color:var(--text-on-brand)]',
  'bg-secondary': 'bg-[color:var(--bg-elevated)]',
  'text-secondary-foreground': 'text-[color:var(--text-primary)]',
  'bg-popover': 'bg-[color:var(--bg-surface)]',
  'text-popover-foreground': 'text-[color:var(--text-primary)]',
  'bg-card': 'bg-[color:var(--bg-surface)]',
  'text-card-foreground': 'text-[color:var(--text-primary)]',
  'ring-ring': 'ring-[color:var(--brand)]',
  'ring-offset-background': 'ring-offset-[color:var(--bg-app)]',
  'border-input': 'border-[color:var(--border-standard)]',
  'border-border': 'border-[color:var(--border-standard)]',
  'placeholder:text-muted-foreground': 'placeholder:text-[color:var(--text-tertiary)]',

  // Named raw-color usages found in shadcn defaults — map to design tokens.
  'bg-black/60': 'bg-[color:var(--bg-overlay)]',
  'bg-black/80': 'bg-[color:var(--bg-overlay)]',
  'bg-white': 'bg-[color:var(--bg-app)]',
  'text-white': 'text-[color:var(--text-on-brand)]',
  'text-black': 'text-[color:var(--text-primary)]',
};

export function rewrite(source: string): string {
  let out = source;
  for (const [from, to] of Object.entries(MAPPING)) {
    // word-boundary-like: not preceded by alnum or `-`/`/`/`:`
    const re = new RegExp(
      `(?<![A-Za-z0-9\\-/:\\[])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9\\-/])`,
      'g',
    );
    out = out.replace(re, to);
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('shadcn-token-rewrite.ts')) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: shadcn-token-rewrite <file>');
    process.exit(2);
  }
  const src = readFileSync(file, 'utf8');
  const out = rewrite(src);
  if (src !== out) {
    writeFileSync(file, out);
    console.log(`rewrote ${file}`);
  } else {
    console.log(`no changes ${file}`);
  }
}
