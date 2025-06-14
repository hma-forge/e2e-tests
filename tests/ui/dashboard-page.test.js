const { 
  launchBrowser, 
  createPage, 
  login, 
  closeBrowser, 
  closePage 
} = require('../helpers/puppeteer-setup');

describe('Dashboard Page UI Tests', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8888';
  let browser;
  let page;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  beforeEach(async () => {
    page = await createPage(browser);
    // Login before each test
    await login(page, BASE_URL);
  });

  afterEach(async () => {
    await closePage(page);
  });

  afterAll(async () => {
    await closeBrowser(browser);
  });

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