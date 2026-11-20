// Configuração do ESLint (flat config).
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import ts from 'typescript-eslint'

/** Mensagem padrão para as regras de arquitetura (dependências apontam para dentro). */
const layer = (name) => `Arquitetura limpa: ${name} (ver CLAUDE.md, seção "Arquitetura").`

export default defineConfig(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.wrangler/',
      '**/test-results/',
      '**/playwright-report/',
      'apps/server/worker-configuration.d.ts',
      'docs/',
    ],
  },
  js.configs.recommended,
  ts.configs.strict,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { parser: ts.parser },
    },
  },
  {
    files: ['apps/web/src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // ---- Regras de arquitetura ----
  {
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@village-flood/*'],
              message: layer('o motor não depende de nenhum outro pacote'),
            },
            {
              group: ['node:*', 'cloudflare:*'],
              message: layer('o motor não usa APIs do Node nem da Cloudflare'),
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/kit/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@village-flood/*'],
              message: layer('o kit é agnóstico de jogo e só conhece GameDefinition'),
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/bots/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@village-flood/*', '!@village-flood/engine'],
              message: layer('os bots só dependem do motor'),
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@village-flood/sim', '@village-flood/server'],
              message: layer('a interface não importa a simulação nem o servidor'),
            },
          ],
        },
      ],
    },
  },
)
