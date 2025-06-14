module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  roots: ['<rootDir>/tests'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'tests/**/*.js',
    '!tests/**/*.spec.js',
    '!**/node_modules/**'
  ],
  
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Reporter configuration
  reporters: ['default'],
  
  // Verbose output for debugging
  verbose: process.env.NODE_ENV === 'debug',
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles for debugging
  detectOpenHandles: process.env.NODE_ENV === 'debug'
};