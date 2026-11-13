// Verificação estática do código: nomes não definidos, variáveis sem uso e erros comuns.
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] }
  },
  {
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.serviceworker } }
  },
  {
    files: ['tests/**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } }
  }
];
