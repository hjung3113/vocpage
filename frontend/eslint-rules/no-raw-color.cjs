/**
 * ESLint rule: no-raw-color
 *
 * Flags raw color literals (hex / rgb / rgba / oklch) in JSX className strings.
 * Use design tokens via var(--token-name) instead (Phase 8 §0 token rule).
 *
 * NOTE: this rule is currently NOT registered in .eslintrc.cjs — the project
 * uses the standalone scanner at ./check-no-raw-color.js (run via
 * `npm run lint:tokens`). Keeping this file lets future migrations to flat
 * config plug it in without rewriting detection logic.
 */
'use strict';

const RAW_COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\boklch\s*\()/;

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow raw color literals in className strings.' },
    schema: [],
    messages: {
      raw: 'Use design tokens via var(--token-name) instead of raw color literals (Phase 8 §0 token rule).',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== 'className') return;
        const v = node.value;
        if (!v) return;
        if (v.type === 'Literal' && typeof v.value === 'string') {
          if (RAW_COLOR_RE.test(v.value)) {
            context.report({ node: v, messageId: 'raw' });
          }
        }
      },
    };
  },
};
