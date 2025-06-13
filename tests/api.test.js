const fetch = require('node-fetch');

describe('API Tests', () => {
  const API_URL = process.env.API_URL || 'http://localhost:8888';
  let authToken = null;

  test('health endpoint should return ok', async () => {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  test('login should return JWT token', async () => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@forge.local',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.token).toBeTruthy();
    expect(data.token.split('.')).toHaveLength(3); // JWT format
    
    // Save token for next test
    authToken = data.token;
  });

  test('protected endpoint should work with valid token', async () => {
    // Use token from previous test
    expect(authToken).toBeTruthy();
    
    const response = await fetch(`${API_URL}/api/user`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.email).toBe('admin@forge.local');
  });

  test('protected endpoint should reject without token', async () => {
    const response = await fetch(`${API_URL}/api/user`);
    
    expect(response.status).toBe(401);
  });

  test('protected endpoint should reject with invalid token', async () => {
    const response = await fetch(`${API_URL}/api/user`, {
      headers: {
        'Authorization': 'Bearer invalid.token.here'
      }
    });
    
    expect(response.status).toBe(401);
  });

  test('login should reject invalid credentials', async () => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@forge.local',
        password: 'wrongpassword'
      })
    });
    
    expect(response.status).toBe(401);
  });
});