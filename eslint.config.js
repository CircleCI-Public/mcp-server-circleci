import js from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

// @ts-check
export default tseslint.config(
  {
    // Default configuration for all files
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    // For JavaScript files including the config file
    files: ['**/*.js', '**/*.mjs'],
    extends: [js.configs.recommended],
  },
  {
    // For TypeScript files (excluding tests)
    files: ['**/*.ts'],
    ignores: ['**/*.test.ts', '**/*.spec.ts'],
    extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: true,
          allowBoolean: true,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: true,
        },
      ],
    },
  },
  {
    // For TypeScript test files
    files: ['**/*.test.ts', '**/*.spec.ts'],
    extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: true,
          allowBoolean: true,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: true,
        },
      ],
    },
  },
  prettierConfig,
);
