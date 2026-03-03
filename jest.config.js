module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!server/seeds/**',
    '!server/server.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
  testTimeout: 30000
};