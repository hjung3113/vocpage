/* eslint-env node */
/**
 * Frontend ESLint config — extends the root base and adds:
 *   - tailwindcss/recommended (Tailwind v4: arbitrary-value + custom-classname
 *     rules disabled because we thread design tokens via bg-[color:var(--*)])
 *   - per-area max-lines caps (pages/features 200, widgets 80)
 *
 * The custom no-raw-color check runs as a separate `lint:tokens` step
 * (frontend/eslint-rules/check-no-raw-color.js) wired into the `lint` script.
 */
module.exports = {
  // TODO(Wave 0-11): re-enable 'plugin:tailwindcss/recommended' once
  // eslint-plugin-tailwindcss adds Tailwind v4 inline-config support.
  // The plugin currently requires a tailwind.config.js path which v4 doesn't use.
  extends: ['../.eslintrc.base.js', 'plugin:react-hooks/recommended'],
  plugins: ['react-hooks'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: ['dist', 'node_modules', 'public/mockServiceWorker.js', 'eslint-rules/**'],
  rules: {
    'react-hooks/exhaustive-deps': 'error',
    // We intentionally use arbitrary class values like bg-[color:var(--brand)]
    // to thread design tokens through Tailwind v4.
    'tailwindcss/no-arbitrary-value': 'off',
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/classnames-order': 'off',
  },
  overrides: [
    {
      files: ['src/pages/**', 'src/features/**'],
      rules: {
        'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      },
    },
    {
      files: ['src/components/**/widgets/**'],
      rules: {
        'max-lines': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      },
    },
  ],
};
