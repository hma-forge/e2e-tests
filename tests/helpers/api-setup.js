/**
 * Common API test setup and utilities
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
const API_BASE = `${BASE_URL}/api`;

/**
 * Default test user credentials
 */
const TEST_USER = {
  email: 'admin@forge.local',
  password: 'admin123'
};

/**
 * Authenticate and get JWT token
 */
async function authenticate(customCredentials = {}) {
  const credentials = { ...TEST_USER, ...customCredentials };
  
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
    
    return null;
  } catch (error) {
    console.log('Authentication failed:', error.message);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function authenticatedRequest(endpoint, options = {}) {
  const token = options.token || await authenticate();
  
  if (!token) {
    throw new Error('Authentication failed');
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  
  return response;
}

/**
 * Check if service is available
 */
async function checkServiceHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

module.exports = {
  BASE_URL,
  API_BASE,
  TEST_USER,
  authenticate,
  authenticatedRequest,
  checkServiceHealth
};