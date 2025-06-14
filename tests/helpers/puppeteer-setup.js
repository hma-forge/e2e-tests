const puppeteer = require('puppeteer');

/**
 * Standard Puppeteer launch configuration
 */
const LAUNCH_OPTIONS = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions'
  ],
  defaultViewport: { width: 1280, height: 800 },
  timeout: 60000
};

/**
 * Standard page configuration
 */
const PAGE_CONFIG = {
  navigationTimeout: 30000,
  defaultTimeout: 30000
};

/**
 * Launch browser with standard configuration
 */
async function launchBrowser() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch(LAUNCH_OPTIONS);
  console.log('✅ Browser launched successfully');
  return browser;
}

/**
 * Create and configure a new page
 */
async function createPage(browser) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(PAGE_CONFIG.navigationTimeout);
  page.setDefaultTimeout(PAGE_CONFIG.defaultTimeout);
  await page.setViewport(LAUNCH_OPTIONS.defaultViewport);
  return page;
}

/**
 * Clear all cookies and storage for a clean test
 */
async function clearSession(page) {
  await page.deleteCookie(...(await page.cookies()));
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore security errors
    }
  });
}

/**
 * Login helper function
 */
async function login(page, baseUrl, email = 'admin@forge.local', password = 'admin123') {
  await clearSession(page);
  await page.goto(`${baseUrl}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);
  
  // Verify we're on dashboard
  await page.waitForSelector('h2', { timeout: 10000 });
}

/**
 * Close browser safely
 */
async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

/**
 * Close page safely
 */
async function closePage(page) {
  if (page && !page.isClosed()) {
    await page.close();
  }
}

module.exports = {
  LAUNCH_OPTIONS,
  PAGE_CONFIG,
  launchBrowser,
  createPage,
  clearSession,
  login,
  closeBrowser,
  closePage
};