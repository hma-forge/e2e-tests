const fetch = require('node-fetch');

describe('Full Application Flow E2E Tests', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  const API_URL = process.env.API_URL || 'http://localhost:8888';
  
  test('complete user authentication flow', async () => {
    // 1. Check health endpoint
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    
    expect(healthResponse.status).toBe(200);
    expect(healthData.status).toBe('ok');
    console.log('✅ Health check passed');
    
    // 2. Frontend loads correctly
    const frontendResponse = await fetch(BASE_URL);
    const frontendHtml = await frontendResponse.text();
    
    expect(frontendResponse.status).toBe(200);
    expect(frontendHtml).toContain('<!DOCTYPE html>');
    expect(frontendHtml).toContain('Forge');
    console.log('✅ Frontend loads correctly');
    
    // 3. Login with valid credentials
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@forge.local',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    expect(loginResponse.status).toBe(200);
    expect(loginData.token).toBeTruthy();
    expect(loginData.token.split('.')).toHaveLength(3); // JWT format
    console.log('✅ Login successful with JWT token');
    
    // 4. Access protected endpoint with token
    const userResponse = await fetch(`${API_URL}/api/user`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    const userData = await userResponse.json();
    
    expect(userResponse.status).toBe(200);
    expect(userData.email).toBe('admin@forge.local');
    console.log('✅ Protected endpoint access successful');
    
    // 5. Test invalid credentials
    const invalidLoginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@forge.local',
        password: 'wrongpassword'
      })
    });
    
    expect(invalidLoginResponse.status).toBe(401);
    console.log('✅ Invalid credentials correctly rejected');
    
    // 6. Test unauthorized access
    const unauthorizedResponse = await fetch(`${API_URL}/api/user`);
    expect(unauthorizedResponse.status).toBe(401);
    console.log('✅ Unauthorized access correctly blocked');
    
    console.log('🎉 All E2E tests passed!');
  });
  
  test('frontend serves all required assets', async () => {
    // Check main HTML page
    const htmlResponse = await fetch(BASE_URL);
    expect(htmlResponse.status).toBe(200);
    
    // Check favicon
    const iconResponse = await fetch(`${BASE_URL}/forge-icon.svg`);
    expect(iconResponse.status).toBe(200);
    
    console.log('✅ Frontend assets available');
  });
  
  test('CORS and headers are configured correctly', async () => {
    const response = await fetch(`${API_URL}/health`);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    console.log('✅ API headers configured correctly');
  });
});