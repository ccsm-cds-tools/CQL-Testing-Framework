const globals = require('globals');
const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = [
  ...compat.extends('eslint:recommended'),
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      },
      ecmaVersion: 2020,
      sourceType: 'commonjs'
    },
    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error']
        }
      ],
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none'
        }
      ],
      quotes: [
        'error',
        'single',
        {
          allowTemplateLiterals: true
        }
      ],
      semi: ['error', 'always']
    }
  }
];
