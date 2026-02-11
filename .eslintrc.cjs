module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    '/.vscode/*',
    '/coverage/*',
    '/dist/*',
    '/experiments/*',
    '/node_modules/*',
    '.eslintrc.cjs',
    '.eslintrc.production.cjs',
  ],
  rules: {
    // already checked by typescript
    '@typescript-eslint/no-redeclare': 'off',
    // allow namespace declaration for types
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    // warn instead of error to prevent covering more specific errors
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    // allow explicit unused variables
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
}
