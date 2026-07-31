import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'docs/',
      '.ai/',
      '.cache/',
      '.continue/',
      '.scripts/',
      '.vs/',
      '.vscode/',
      'temp/',
      '**/*.md'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
    }
  }
]