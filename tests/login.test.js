const puppeteer = require('puppeteer');

describe('Login Flow', () => {
  let browser;
  let page;
  
  // URLs for local testing against real stack
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  const API_URL = process.env.API_URL || 'http://localhost:8888';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should display login form', async () => {
    try {
      console.log('Navigating to:', BASE_URL);
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      console.log('Page response status:', response.status());
      
      // Get page content for debugging
      const content = await page.content();
      console.log('Page content length:', content.length);
      console.log('Page title:', await page.title());
      
      // Wait for login form
      await page.waitForSelector('#login-form', { timeout: 5000 });
      
      // Check elements exist
      const emailInput = await page.$('#email');
      const passwordInput = await page.$('#password');
      const loginButton = await page.$('#login-button');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(loginButton).toBeTruthy();
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });

  test('should login successfully with valid credentials', async () => {
    await page.goto(BASE_URL);
    
    // Wait for form
    await page.waitForSelector('#login-form');
    
    // Fill credentials
    await page.type('#email', 'admin@forge.local');
    await page.type('#password', 'admin123');
    
    // Click login and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.click('#login-button')
    ]);
    
    // Should be on dashboard
    await page.waitForSelector('h1', { timeout: 5000 });
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge Dashboard');
    
    // Check user email is displayed
    await page.waitForSelector('#user-email', { timeout: 5000 });
    const email = await page.$eval('#user-email', el => el.textContent);
    expect(email).toBe('admin@forge.local');
  });

  test('should show error with invalid credentials', async () => {
    await page.goto(BASE_URL);
    
    // Wait for form
    await page.waitForSelector('#login-form');
    
    // Fill wrong credentials
    await page.type('#email', 'admin@forge.local');
    await page.type('#password', 'wrongpassword');
    
    // Click login
    await page.click('#login-button');
    
    // Wait for error message
    await page.waitForSelector('#error', { timeout: 5000 });
    const errorText = await page.$eval('#error', el => el.textContent);
    expect(errorText).toContain('Login failed');
  });

  test('should logout successfully', async () => {
    // First login
    await page.goto(BASE_URL);
    await page.waitForSelector('#login-form');
    await page.type('#email', 'admin@forge.local');
    await page.type('#password', 'admin123');
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('#login-button')
    ]);
    
    // Should be on dashboard
    await page.waitForSelector('.logout');
    
    // Click logout
    await Promise.all([
      page.waitForNavigation(),
      page.click('.logout')
    ]);
    
    // Should be back at login
    await page.waitForSelector('#login-form');
    const loginForm = await page.$('#login-form');
    expect(loginForm).toBeTruthy();
  });
});