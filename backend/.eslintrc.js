module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:n/recommended'],
  plugins: ['n'],
  env: { node: true },
  rules: {
    'n/no-missing-require': 'off',
    'n/no-unsupported-features/es-syntax': 'off',
  },
};
