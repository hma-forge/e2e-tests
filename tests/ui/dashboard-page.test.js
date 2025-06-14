const puppeteer = require('puppeteer');

describe('Dashboard Page UI Tests', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  let browser;
  let page;

  beforeAll(async () => {
    console.log('🚀 Launching browser for dashboard tests...');
    
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
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Login before each test
    await loginToDashboard(page);
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

  async function loginToDashboard(page) {
    // Clear cookies first
    await page.deleteCookie(...(await page.cookies()));
    
    // Go to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login
    await page.type('input[type="email"]', 'admin@forge.local');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Should be on dashboard now
    await page.waitForSelector('h2', { timeout: 10000 });
  }

  test('should display welcome message', async () => {
    const welcomeHeading = await page.$eval('h2', el => el.textContent);
    expect(welcomeHeading).toBe('Welcome back!');
    
    const subtitle = await page.$eval('p', el => el.textContent);
    expect(subtitle).toContain('Manage your development environments and projects');
    
    console.log('✅ Welcome message displays correctly');
  });

  test('should display navigation bar', async () => {
    // Check Forge title in nav
    const forgeTitle = await page.$eval('h1', el => el.textContent);
    expect(forgeTitle).toBe('Forge');
    
    // Check logout button
    const logoutButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Sign Out'));
    });
    expect(logoutButton).toBeTruthy();
    
    console.log('✅ Navigation bar displays correctly');
  });

  test('should display dashboard cards', async () => {
    // Check for Projects card
    const projectsCard = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.find(h => h.textContent === 'Projects');
    });
    expect(projectsCard).toBeTruthy();
    
    // Check for Environments card
    const environmentsCard = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.find(h => h.textContent === 'Environments');
    });
    expect(environmentsCard).toBeTruthy();
    
    // Check for Settings card
    const settingsCard = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.find(h => h.textContent === 'Settings');
    });
    expect(settingsCard).toBeTruthy();
    
    console.log('✅ Dashboard cards display correctly');
  });

  test('should display quick stats', async () => {
    const statsSection = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.find(h => h.textContent === 'Quick Stats');
    });
    expect(statsSection).toBeTruthy();
    
    // Check for stat values
    const statValues = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.text-2xl')).map(el => el.textContent);
    });
    
    expect(statValues).toHaveLength(3);
    expect(statValues).toContain('0'); // Active Projects
    
    console.log('✅ Quick stats display correctly');
  });

  test('should navigate to projects page', async () => {
    // Click View Projects button
    const projectsButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent === 'View Projects');
    });
    
    await projectsButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const url = page.url();
    expect(url).toContain('/projects');
    
    console.log('✅ Navigation to projects page works');
  });

  test('should logout successfully', async () => {
    // Click logout button
    const logoutButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Sign Out'));
    });
    
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Should be back on login page
    const url = page.url();
    expect(url).toContain('/login');
    
    const heading = await page.$eval('h1', el => el.textContent);
    expect(heading).toBe('Welcome to Forge');
    
    console.log('✅ Logout functionality works correctly');
  });
});