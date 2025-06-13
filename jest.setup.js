// Jest setup file for E2E tests

// Global test timeout
jest.setTimeout(30000);

// Global test environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Default URLs if not specified
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:8888';
}

if (!process.env.API_URL) {
  process.env.API_URL = 'http://localhost:8888';
}

// Global beforeAll hook
beforeAll(async () => {
  // Verify environment is accessible before running tests
  const fetch = require('node-fetch');
  
  try {
    console.log('🔍 Checking test environment...');
    const healthResponse = await fetch(`${process.env.API_URL}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ Test environment is ready');
    } else {
      console.warn(`⚠️  Health check returned status ${healthResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Test environment check failed:', error.message);
    console.log('Make sure the Forge infrastructure is running:');
    console.log('  cd ../infrastructure && ./scripts/status.sh dev');
  }
});

// Global afterAll hook
afterAll(async () => {
  // Cleanup resources
  console.log('🧹 Cleaning up test resources...');
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for tests
global.console = {
  ...console,
  // Override console.error to capture test errors
  error: (...args) => {
    if (args[0] && args[0].includes && args[0].includes('Test failed')) {
      console.log('🔍 Test Debug Info:', ...args);
    } else {
      console.error(...args);
    }
  }
};