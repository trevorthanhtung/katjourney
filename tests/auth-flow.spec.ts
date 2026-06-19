import { test, expect } from '@playwright/test';

test.describe('Auth Flow — Luồng xác thực', () => {

  test('should display the welcome screen on first visit', async ({ page }) => {
    await page.goto('/');
    
    // Expect to see the WelcomeScreen since localStorage is empty (fresh context)
    const guestButton = page.getByText('Khám phá tư cách Khách');
    await expect(guestButton).toBeVisible({ timeout: 15000 });

    // Also verify the Google login button is visible
    const googleButton = page.getByText('Tiếp tục với Google');
    await expect(googleButton).toBeVisible();
  });

  test('should enter the app as a Guest and see the Trip Manager', async ({ page }) => {
    await page.goto('/');

    // Wait for the welcome screen to fully render
    const guestButton = page.getByText('Khám phá tư cách Khách');
    await expect(guestButton).toBeVisible({ timeout: 15000 });

    // Click the guest login button
    await guestButton.click();

    // After guest login, the WelcomeScreen should dismiss.
    // Use specific heading selector to avoid strict mode violations
    const emptyHeading = page.getByRole('heading', { name: 'Chưa có chuyến đi nào' });
    await expect(emptyHeading).toBeVisible({ timeout: 30000 });

    // Verify the "Tạo chuyến đi đầu tiên" CTA button is visible
    const createButton = page.getByRole('button', { name: /Tạo chuyến đi đầu tiên/ });
    await expect(createButton).toBeVisible();
  });

  test('should persist session across page reload', async ({ page }) => {
    await page.goto('/');

    // Enter as guest
    const guestButton = page.getByText('Khám phá tư cách Khách');
    await expect(guestButton).toBeVisible({ timeout: 15000 });
    await guestButton.click();

    // Wait for the trip manager heading to appear
    await expect(
      page.getByRole('heading', { name: 'Chưa có chuyến đi nào' })
    ).toBeVisible({ timeout: 30000 });

    // Reload the page — should NOT show the welcome screen again
    await page.reload();

    // Wait for the app to initialize after reload
    await page.waitForTimeout(3000);

    // The welcome screen guest button should NOT be visible
    await expect(page.getByText('Khám phá tư cách Khách')).not.toBeVisible();
  });
});
