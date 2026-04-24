module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:n/recommended'],
  plugins: ['n'],
  env: { node: true },
  rules: {
    'n/no-missing-require': 'off',
    'n/no-unsupported-features/es-syntax': 'off',
  },
  overrides: [
    {
      // Server entry point — process.exit() is intentional for fatal startup errors
      files: ['src/index.ts'],
      rules: { 'n/no-process-exit': 'off' },
    },
  ],
};
