const puppeteer = require('puppeteer');

describe('Routing and Navigation Tests', () => {
  let browser;
  let page;
  
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';

  beforeAll(async () => {
    console.log('🚀 Launching browser for routing tests...');
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

  test('should display 404 page for invalid routes', async () => {
    console.log('🗺️ Testing 404 page display...');
    
    const invalidUrl = `${BASE_URL}/this-page-does-not-exist`;
    console.log('Navigating to:', invalidUrl);
    
    await page.goto(invalidUrl);
    
    // Wait for 404 page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check for 404 heading
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('404');
    
    // Check for error message
    const errorMessage = await page.$eval('p', el => el.textContent);
    expect(errorMessage).toBe('Page not found');
    
    // Check for "Go to dashboard" button
    const dashboardButton = await page.$('button');
    expect(dashboardButton).toBeTruthy();
    
    const buttonText = await page.$eval('button', el => el.textContent);
    expect(buttonText).toBe('Go to dashboard');
    
    console.log('✅ 404 page displays correctly');
  });

  test('should navigate back to dashboard from 404 page', async () => {
    console.log('🗺️ Testing 404 → dashboard navigation...');
    
    // Navigate to 404 page
    const invalidUrl = `${BASE_URL}/another-invalid-page`;
    await page.goto(invalidUrl);
    
    // Wait for 404 page
    await page.waitForSelector('h1', { timeout: 10000 });
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('404');
    
    console.log('On 404 page, clicking "Go to dashboard" button...');
    
    // Click "Go to dashboard" button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button')
    ]);
    
    // Should now be on login page (since we're not authenticated)
    await page.waitForSelector('h1', { timeout: 10000 });
    const newHeading = await page.$eval('h1', el => el.textContent);
    expect(newHeading).toBe('Welcome to Forge');
    
    // Should see login form
    const emailInput = await page.$('input[type="email"]');
    expect(emailInput).toBeTruthy();
    
    console.log('✅ Successfully navigated back from 404 page');
  });

  test('should handle multiple invalid route patterns', async () => {
    console.log('🗺️ Testing various invalid route patterns...');
    
    const invalidRoutes = [
      '/users/123/profile',
      '/admin/dashboard',
      '/projects/create/new',
      '/settings/advanced/security',
      '/dashboard/analytics',
      '/profile/edit'
    ];
    
    for (const route of invalidRoutes) {
      console.log(`Testing invalid route: ${route}`);
      
      await page.goto(`${BASE_URL}${route}`);
      
      // Should show 404 page
      await page.waitForSelector('h1', { timeout: 10000 });
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('404');
      
      // Check URL hasn't changed (client-side routing)
      expect(page.url()).toBe(`${BASE_URL}${route}`);
    }
    
    console.log('✅ All invalid routes correctly show 404 page');
  });

  test('should allow valid routes to work normally', async () => {
    console.log('🗺️ Testing valid routes...');
    
    const validRoutes = ['/', '/login'];
    
    for (const route of validRoutes) {
      console.log(`Testing valid route: ${route}`);
      
      await page.goto(`${BASE_URL}${route}`);
      
      // Wait for page to load
      await page.waitForSelector('h1', { timeout: 10000 });
      const heading = await page.$eval('h1', el => el.textContent);
      
      // Should NOT be 404
      expect(heading).not.toBe('404');
      
      // Should be either login page or dashboard
      expect(heading).toMatch(/Welcome to Forge|Forge/);
      
      console.log(`✅ Valid route ${route} works correctly: "${heading}"`);
    }
    
    console.log('✅ All valid routes work correctly');
  });

  test('should handle browser back/forward navigation', async () => {
    console.log('🗺️ Testing browser navigation...');
    
    // Start at login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    let heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge');
    console.log('✅ Started at login page');
    
    // Navigate to 404 page
    await page.goto(`${BASE_URL}/some-invalid-page`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('404');
    console.log('✅ Navigated to 404 page');
    
    // Go back using browser back button
    await page.goBack();
    await page.waitForSelector('h1', { timeout: 10000 });
    
    heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge');
    console.log('✅ Browser back button works');
    
    // Go forward using browser forward button
    await page.goForward();
    await page.waitForSelector('h1', { timeout: 10000 });
    
    heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('404');
    console.log('✅ Browser forward button works');
    
    console.log('✅ Browser navigation tested successfully');
  });

  test('should handle direct URL access to different routes', async () => {
    console.log('🗺️ Testing direct URL access...');
    
    // Test direct access to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    let heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge');
    console.log('✅ Direct access to /login works');
    
    // Test direct access to root
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge'); // Should redirect to login
    console.log('✅ Direct access to / redirects to login');
    
    // Test direct access to invalid route
    await page.goto(`${BASE_URL}/definitely-not-a-real-page`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('404');
    console.log('✅ Direct access to invalid route shows 404');
    
    console.log('✅ Direct URL access behavior verified');
  });

  test('authenticated user routing behavior', async () => {
    console.log('🗺️ Testing authenticated user routing...');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Should be on dashboard
    await page.waitForSelector('h2', { timeout: 10000 });
    let welcomeHeading = await page.$eval('h2', el => el.textContent);
    expect(welcomeHeading).toBe('Welcome back!');
    console.log('✅ Successfully logged in');
    
    // Test that invalid routes still show 404 even when authenticated
    await page.goto(`${BASE_URL}/invalid-authenticated-route`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('404');
    console.log('✅ Authenticated user still sees 404 for invalid routes');
    
    // Test going back to dashboard from 404
    await page.click('button'); // "Go to dashboard" button
    await page.waitForSelector('h2', { timeout: 10000 });
    
    welcomeHeading = await page.$eval('h2', el => el.textContent);
    expect(welcomeHeading).toBe('Welcome back!');
    console.log('✅ Can navigate back to dashboard from 404 when authenticated');
    
    console.log('✅ Authenticated user routing behavior verified');
  });
});