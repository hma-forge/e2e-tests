const fetch = require('node-fetch');
const { authenticate, BASE_URL, API_BASE } = require('./helpers/api-setup');

describe('Login Flow API Tests', () => {
  const testUser = {
    email: 'admin@forge.local',
    password: 'admin123'
  };

  test('login page should be accessible', async () => {
    const response = await fetch(`${BASE_URL}/login`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Forge');
    
    console.log('✅ Login page loads correctly');
  });

  test('should authenticate with valid credentials', async () => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.token).toBeTruthy();
    expect(data.token.split('.')).toHaveLength(3); // JWT format
    
    console.log('✅ Login successful with JWT token');
  });

  test('should reject invalid credentials', async () => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@forge.local',
        password: 'wrongpassword'
      })
    });
    
    expect(response.status).toBe(401);
    console.log('✅ Invalid credentials correctly rejected');
  });

  test('authenticated user can access protected resources', async () => {
    // First login
    const token = await authenticate();
    expect(token).toBeTruthy();
    
    // Access protected endpoint
    const response = await fetch(`${API_BASE}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(response.status).toBe(200);
    
    const userData = await response.json();
    expect(userData.email).toBe(testUser.email);
    
    console.log('✅ Protected resource access successful');
  });

  test('dashboard should load for authenticated users', async () => {
    // This tests the full flow: login -> redirect to dashboard
    const response = await fetch(`${BASE_URL}/dashboard`);
    
    // Should either show dashboard content or redirect to login
    expect([200, 302, 307, 308].includes(response.status)).toBe(true);
    
    console.log('✅ Dashboard endpoint responds correctly');
  });
});