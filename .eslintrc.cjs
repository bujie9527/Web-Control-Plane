module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // 必须放最后，禁用与 Prettier 冲突的规则
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // React 17+ 不需要 import React
    'react/react-in-jsx-scope': 'off',
    // prop-types 由 TypeScript 替代
    'react/prop-types': 'off',
    // 允许 any（mock 阶段大量使用）
    '@typescript-eslint/no-explicit-any': 'warn',
    // 允许空函数（占位 handler 常见）
    '@typescript-eslint/no-empty-function': 'warn',
    // 未使用变量报 warn 而非 error（开发阶段友好）
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 禁止 console.log 进生产代码（warn 提醒）
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.config.ts',
    'vite.config.ts',
  ],
}
