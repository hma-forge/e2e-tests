import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access root without authentication
    await page.goto('/')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome to Forge')
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@forge.local')
    await page.fill('input[type="password"]', 'admin123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to root (dashboard)
    await page.waitForURL('/')
    await expect(page.locator('h2')).toContainText('Welcome back!')
    
    // Should show user email
    await expect(page.locator('text=admin@forge.local')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error
    await expect(page.locator('.text-red-600')).toContainText('Invalid credentials')
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@forge.local')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Click logout
    await page.click('button:has-text("Logout")')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
    
    // Try to access root again
    await page.goto('/')
    
    // Should redirect back to login
    await expect(page).toHaveURL('/login')
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@forge.local')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Reload page
    await page.reload()
    
    // Should still be on root (dashboard)
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=admin@forge.local')).toBeVisible()
  })
})