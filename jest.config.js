module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
    'modules/**/*.js',
    'server.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};