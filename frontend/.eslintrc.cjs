module.exports = {
  extends: ['../.eslintrc.base.js', 'plugin:react-hooks/recommended'],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/exhaustive-deps': 'error',
  },
};
