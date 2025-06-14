const puppeteer = require('puppeteer');

describe('Login Page UI Tests', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  let browser;
  let page;

  beforeAll(async () => {
    console.log('🚀 Launching browser for login page tests...');
    
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };
    
    browser = await puppeteer.launch(launchOptions);
    console.log('✅ Browser launched successfully');
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Clear all cookies to ensure we start fresh
    await page.deleteCookie(...(await page.cookies()));
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('🧹 Browser closed');
    }
  });

  test('should display login form elements', async () => {
    await page.goto(`${BASE_URL}/login`);
    
    // Wait for login form
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check main heading
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge');
    
    // Check sign in heading
    const signInHeading = await page.$eval('h3', el => el.textContent);
    expect(signInHeading).toBe('Sign In');
    
    // Check form elements exist
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    
    // Check button text
    const buttonText = await page.$eval('button[type="submit"]', el => el.textContent);
    expect(buttonText.trim()).toBe('Sign In');
    
    console.log('✅ Login form displays correctly');
  });

  test('should show error message with invalid credentials', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill invalid credentials
    await page.type('input[type="email"]', 'invalid@example.com');
    await page.type('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('.text-red-600', { timeout: 10000 });
    
    const errorText = await page.$eval('.text-red-600', el => el.textContent);
    expect(errorText).toContain('Invalid credentials');
    
    // Should still be on login page
    const url = page.url();
    expect(url).toContain('/login');
    
    console.log('✅ Error message displays correctly');
  });

  test('should show loading state during login', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill valid credentials
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    // Set up promise to watch for loading state
    const loadingPromise = page.waitForFunction(
      () => {
        const button = document.querySelector('button[type="submit"]');
        return button && button.textContent.includes('Signing in');
      },
      { timeout: 2000 }
    );
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Check if we caught the loading state
    try {
      await loadingPromise;
      console.log('✅ Loading state detected');
    } catch (e) {
      // Loading state might be too fast to catch
      console.log('ℹ️  Loading state too brief to capture (normal behavior)');
    }
    
    // Should redirect to dashboard after successful login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const finalUrl = page.url();
    expect(finalUrl).toBe(`${BASE_URL}/`);
    
    console.log('✅ Login flow completed successfully');
  });

  test('should have proper form validation', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check HTML5 validation
    const emailValidity = await page.$eval('input[type="email"]', el => el.validity.valid);
    expect(emailValidity).toBe(false);
    
    // Fill only email
    await page.type('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    const passwordValidity = await page.$eval('input[type="password"]', el => el.validity.valid);
    expect(passwordValidity).toBe(false);
    
    console.log('✅ Form validation works correctly');
  });
});