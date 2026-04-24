module.exports = {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      ['color', 'background-color', 'border-color', 'fill', 'stroke'],
      { ignoreValues: ['transparent', 'inherit', 'currentColor'] },
    ],
  },
};
