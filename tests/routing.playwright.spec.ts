import { test, expect } from '@playwright/test'

test.describe('Routing and 404 Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@forge.local')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should show 404 for invalid routes', async ({ page }) => {
    // Navigate to invalid route
    await page.goto('/invalid-route')
    
    // Should show 404 page
    await expect(page.locator('h1')).toContainText('404')
    await expect(page.locator('text=Page not found')).toBeVisible()
    await expect(page.locator('button:has-text("Go to dashboard")')).toBeVisible()
  })

  test('should show 404 for old dashboard route', async ({ page }) => {
    // Navigate to old dashboard route
    await page.goto('/dashboard')
    
    // Should show 404 page
    await expect(page.locator('h1')).toContainText('404')
    await expect(page.locator('text=Page not found')).toBeVisible()
  })

  test('should navigate back to dashboard from 404', async ({ page }) => {
    // Go to invalid route
    await page.goto('/invalid-route')
    
    // Click back to dashboard
    await page.click('button:has-text("Go to dashboard")')
    
    // Should be on root (dashboard)
    await expect(page).toHaveURL('/')
    await expect(page.locator('h2')).toContainText('Welcome back!')
  })

  test('should handle deep invalid routes', async ({ page }) => {
    // Navigate to deep invalid route
    await page.goto('/some/deep/invalid/route')
    
    // Should show 404 page
    await expect(page.locator('h1')).toContainText('404')
  })

  test('should maintain auth on 404 pages', async ({ page }) => {
    // Go to invalid route
    await page.goto('/invalid-route')
    
    // Should still be authenticated (no redirect to login)
    await expect(page).not.toHaveURL('/login')
    
    // Navigate back to dashboard
    await page.click('button:has-text("Go to dashboard")')
    
    // Should show authenticated content
    await expect(page.locator('text=admin@forge.local')).toBeVisible()
  })

  test('should handle direct navigation to valid routes', async ({ page }) => {
    // Direct navigation to login (while authenticated)
    await page.goto('/login')
    
    // Should redirect to dashboard since already authenticated
    await expect(page).toHaveURL('/')
  })

  test('should handle browser back/forward with 404', async ({ page }) => {
    // Navigate to 404
    await page.goto('/invalid')
    await expect(page.locator('h1')).toContainText('404')
    
    // Click to dashboard
    await page.click('button:has-text("Go to dashboard")')
    await expect(page).toHaveURL('/')
    
    // Go back
    await page.goBack()
    
    // Should show 404 again
    await expect(page.locator('h1')).toContainText('404')
  })
})