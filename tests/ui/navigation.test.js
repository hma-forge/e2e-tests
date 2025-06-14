const { 
  launchBrowser, 
  createPage, 
  clearSession,
  closeBrowser, 
  closePage 
} = require('../helpers/puppeteer-setup');

describe('Navigation Flow Tests', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  let browser;
  let page;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  beforeEach(async () => {
    page = await createPage(browser);
  });

  afterEach(async () => {
    await closePage(page);
  });

  afterAll(async () => {
    await closeBrowser(browser);
  });

  test('should redirect to login when not authenticated', async () => {
    // Clear cookies
    await clearSession(page);
    
    // Try to access dashboard
    await page.goto(`${BASE_URL}/`);
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const url = page.url();
    expect(url).toContain('/login');
    
    console.log('✅ Unauthenticated users redirected to login');
  });

  test('should redirect to dashboard after login', async () => {
    // Clear cookies
    await page.deleteCookie(...(await page.cookies()));
    
    // Go to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    const url = page.url();
    expect(url).toBe(`${BASE_URL}/`);
    
    console.log('✅ Login redirects to dashboard');
  });

  test('should maintain session across page navigations', async () => {
    // Clear cookies and login
    await clearSession(page);
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Navigate to projects
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(1000);
    
    // Should stay on projects page (not redirect to login)
    const projectsUrl = page.url();
    expect(projectsUrl).toContain('/projects');
    
    // Go back to dashboard
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    
    // Should stay on dashboard
    const dashboardUrl = page.url();
    expect(dashboardUrl).toBe(`${BASE_URL}/`);
    
    console.log('✅ Session maintained across navigations');
  });

  test('should handle direct URL access when authenticated', async () => {
    // Clear cookies and login first
    await clearSession(page);
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Now try direct access to projects
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(1000);
    
    const url = page.url();
    expect(url).toContain('/projects');
    
    console.log('✅ Direct URL access works when authenticated');
  });

  test('should handle browser back/forward navigation', async () => {
    // Clear cookies and login
    await clearSession(page);
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Navigate to projects
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(1000);
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);
    
    let url = page.url();
    expect(url).toBe(`${BASE_URL}/`);
    
    // Go forward
    await page.goForward();
    await page.waitForTimeout(1000);
    
    url = page.url();
    expect(url).toContain('/projects');
    
    console.log('✅ Browser navigation works correctly');
  });
});