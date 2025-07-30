module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!public/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/integration/',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
