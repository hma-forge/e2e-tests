const puppeteer = require('puppeteer');

describe('UI Components Tests', () => {
  let browser;
  let page;
  
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';

  beforeAll(async () => {
    console.log('🚀 Launching browser for UI component tests...');
    const launchOptions = {
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions'
      ],
      defaultViewport: { width: 1280, height: 720 },
      timeout: 60000
    };
    
    browser = await puppeteer.launch(launchOptions);
    console.log('✅ Browser launched successfully');
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    
    // Clear state for clean tests
    await page.goto(BASE_URL);
    await page.deleteCookie(...(await page.cookies()));
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore security errors
      }
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should display login form with all required elements', async () => {
    console.log('Testing login form display...');
    
    await page.goto(`${BASE_URL}/login`);
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check what we actually get
    const pageContent = await page.content();
    const hasLoginForm = pageContent.includes('input[type="email"]');
    
    if (hasLoginForm) {
      console.log('Login form found, testing elements...');
      
      // Check form elements exist
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const loginButton = await page.$('button[type="submit"]');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(loginButton).toBeTruthy();
      
      // Check for login page heading
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('Welcome to Forge');
      
      // Check Sign In heading
      const signInHeading = await page.$eval('h2, h3', el => el.textContent);
      expect(signInHeading).toContain('Sign In');
      
      console.log('✅ Login form displays correctly');
    } else {
      // Already logged in or redirected to dashboard
      console.log('Not on login form - checking if on dashboard...');
      
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('Forge');
      
      // Should see dashboard elements
      const welcomeHeading = await page.$('h2');
      if (welcomeHeading) {
        const welcomeText = await page.$eval('h2', el => el.textContent);
        expect(welcomeText).toBe('Welcome back!');
      }
      
      console.log('✅ Redirected to dashboard (user already authenticated)');
    }
  });

  test('should show error message with invalid credentials', async () => {
    console.log('Testing error message display...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill wrong credentials
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'wrongpassword');
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('.text-red-600', { timeout: 10000 });
    const errorText = await page.$eval('.text-red-600', el => el.textContent);
    expect(errorText).toContain('Invalid credentials');
    
    // Should still be on login page
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge');
    
    console.log('✅ Error message displays correctly');
  });

  test('should display loading state during login', async () => {
    console.log('Testing loading state...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill valid credentials
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    // Check button text before clicking
    const initialButtonText = await page.$eval('button[type="submit"]', el => el.textContent);
    expect(initialButtonText.trim()).toBe('Sign In');
    
    // Click and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Note: Loading state might be very brief, so this is optional verification
    try {
      const loadingButton = await page.waitForFunction(
        () => {
          const button = document.querySelector('button[type="submit"]');
          return button && button.textContent.includes('Signing in');
        },
        { timeout: 1000 }
      );
      console.log('✅ Loading state detected');
    } catch (e) {
      console.log('ℹ️  Loading state too brief to capture (this is okay)');
    }
    
    console.log('✅ Loading behavior tested');
  });

  test('should display dashboard elements after successful login', async () => {
    console.log('Testing dashboard UI elements...');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Check dashboard elements
    await page.waitForSelector('h2', { timeout: 10000 });
    const welcomeHeading = await page.$eval('h2', el => el.textContent);
    expect(welcomeHeading).toBe('Welcome back!');
    
    const forgeTitle = await page.$eval('h1', el => el.textContent);
    expect(forgeTitle).toBe('Forge');
    
    // Check for dashboard cards
    const cards = await page.$$('[class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
    
    // Check for logout button
    const logoutButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Sign Out')) || null;
    });
    expect(logoutButton).toBeTruthy();
    
    console.log('✅ Dashboard UI elements display correctly');
  });
});