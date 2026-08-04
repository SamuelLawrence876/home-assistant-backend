import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'cdk.out/**', 'dist/**', 'eslint.config.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: { prettier },
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, ...globals.es2021 },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.test.ts'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // CDK's Template.hasResourceProperties / resourceCountIs throw on mismatch — they assert.
      'jest/expect-expect': ['warn', { assertFunctionNames: ['expect', 'template.*'] }],
    },
  },
  {
    files: ['infrastructure/**/*.ts'],
    rules: {
      'no-new': 'off',
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
