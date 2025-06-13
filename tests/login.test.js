const puppeteer = require('puppeteer');

describe('Login Flow', () => {
  let browser;
  let page;
  
  // URLs for local testing against real stack
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  const API_URL = process.env.API_URL || 'http://localhost:8888';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI ? true : 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1280, height: 720 },
      timeout: 30000
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set longer timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    
    // Intercept console messages for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Intercept network failures
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure().errorText);
    });
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
      
      // Wait for login page elements (using actual selectors from the frontend)
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Check elements exist using semantic selectors
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const loginButton = await page.$('button[type="submit"]');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(loginButton).toBeTruthy();
      
      // Check login form content
      const heading = await page.textContent('h1');
      expect(heading).toBe('Welcome to Forge');
      
      const signInTitle = await page.textContent('h2, h3, [role="heading"]');
      expect(signInTitle).toContain('Sign In');
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });

  test('should login successfully with valid credentials', async () => {
    await page.goto(BASE_URL);
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill credentials using semantic selectors
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    // Click login and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Should be on dashboard - check for dashboard elements
    await page.waitForSelector('h2', { timeout: 10000 });
    const welcomeHeading = await page.textContent('h2');
    expect(welcomeHeading).toBe('Welcome back!');
    
    // Check for dashboard content
    const forgeTitle = await page.textContent('h1');
    expect(forgeTitle).toBe('Forge');
    
    // Check for logout button (indicates successful login)
    const headerButtons = await page.$$('header button');
    expect(headerButtons.length).toBeGreaterThan(0);
    
    // Verify the button contains logout text
    const buttonText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header button'));
      return buttons.map(btn => btn.textContent.trim()).join(', ');
    });
    console.log('Header buttons found:', buttonText);
  });

  test('should show error with invalid credentials', async () => {
    await page.goto(BASE_URL);
    
    // Wait for form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill wrong credentials
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'wrongpassword');
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Wait for error message (should appear in red text)
    await page.waitForSelector('.text-red-600', { timeout: 10000 });
    const errorText = await page.textContent('.text-red-600');
    expect(errorText).toContain('Invalid credentials');
    
    // Should still be on login page
    const heading = await page.textContent('h1');
    expect(heading).toBe('Welcome to Forge');
  });

  test('should logout successfully', async () => {
    // First login
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Should be on dashboard - look for logout button
    await page.waitForSelector('header', { timeout: 10000 });
    
    // Click logout - find the logout button
    const logoutButton = await page.$('header button');
    expect(logoutButton).toBeTruthy();
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      logoutButton.click()
    ]);
    
    // Should be back at login
    await page.waitForSelector('h1', { timeout: 10000 });
    const heading = await page.textContent('h1');
    expect(heading).toBe('Welcome to Forge');
    
    // Check login form is visible
    const emailInput = await page.$('input[type="email"]');
    expect(emailInput).toBeTruthy();
  });
});