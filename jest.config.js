module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx)',
    '**/*.(test|spec).(js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],
  collectCoverageFrom: [
    'services/**/*.{js,jsx}',
    'utils/**/*.{js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
  verbose: true,
  clearMocks: true,
  resetMocks: true,
}; 