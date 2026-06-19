import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Login as Guest and wait for Trip Manager screen.
 * Reused across all trip-flow tests.
 */
async function loginAsGuest(page: Page) {
  await page.goto('/');
  const guestButton = page.getByText('Khám phá tư cách Khách');
  await expect(guestButton).toBeVisible({ timeout: 15000 });
  await guestButton.click();

  // Wait for the Trip Manager empty state heading to appear
  await expect(
    page.getByRole('heading', { name: 'Chưa có chuyến đi nào' })
  ).toBeVisible({ timeout: 30000 });
}

test.describe('Trip Flow — Luồng tạo chuyến đi', () => {

  test('should open the trip creation form from empty state', async ({ page }) => {
    await loginAsGuest(page);

    // Click the "Tạo chuyến đi đầu tiên" button using role selector
    const createButton = page.getByRole('button', { name: /Tạo chuyến đi đầu tiên/ });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // The TripForm BottomSheet should appear
    // Check that the form label "Tên chuyến đi" is visible
    await expect(page.getByText('Tên chuyến đi')).toBeVisible({ timeout: 5000 });

    // The "Địa điểm" label should be visible (use exact to avoid matching the helper text)
    await expect(page.getByText('Địa điểm', { exact: true })).toBeVisible();

    // The "Thời gian chuyến đi" label should be visible
    await expect(page.getByText('Thời gian chuyến đi')).toBeVisible();
  });

  test('should create a new trip and see success toast', async ({ page }) => {
    await loginAsGuest(page);

    // Open the trip creation form using role selector
    const createButton = page.getByRole('button', { name: /Tạo chuyến đi đầu tiên/ });
    await createButton.click();

    // Wait for form to appear
    await expect(page.getByText('Tên chuyến đi')).toBeVisible({ timeout: 5000 });

    // Fill in the trip name
    const nameInput = page.getByPlaceholder('VD: Mùa hè rực rỡ');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Trip Đà Nẵng');

    // Submit the form by clicking the button with aria-label "Xác nhận tạo chuyến đi"
    const submitButton = page.getByLabel('Xác nhận tạo chuyến đi');
    await submitButton.click();

    // Success toast should appear
    const successToast = page.getByText('Đã tạo chuyến đi thành công');
    await expect(successToast).toBeVisible({ timeout: 10000 });
  });

  test('should show the created trip in Trip Manager after creation', async ({ page }) => {
    await loginAsGuest(page);

    // Create a trip using role selector
    const createButton = page.getByRole('button', { name: /Tạo chuyến đi đầu tiên/ });
    await createButton.click();

    await expect(page.getByText('Tên chuyến đi')).toBeVisible({ timeout: 5000 });

    const nameInput = page.getByPlaceholder('VD: Mùa hè rực rỡ');
    await nameInput.fill('Chuyến đi Phú Quốc');

    const submitButton = page.getByLabel('Xác nhận tạo chuyến đi');
    await submitButton.click();

    // Wait for the success toast
    await expect(page.getByText('Đã tạo chuyến đi thành công')).toBeVisible({ timeout: 10000 });

    // Click "Xem chi tiết" on the success toast to open the trip
    const viewDetailButton = page.getByText('Xem chi tiết');
    await viewDetailButton.click();

    // Should now be on the trip detail view.
    // The header should show "KAT Journey" heading
    await expect(page.getByRole('heading', { name: 'KAT Journey' })).toBeVisible({ timeout: 10000 });

    // The bottom navigation "Tổng quan" button should be visible
    // Use the specific mobile nav button (role + name pattern)
    await expect(page.getByRole('button', { name: 'Đi tới Tổng quan' })).toBeVisible();
  });

  test('should validate required trip name field', async ({ page }) => {
    await loginAsGuest(page);

    // Open trip creation form using role selector
    const createButton = page.getByRole('button', { name: /Tạo chuyến đi đầu tiên/ });
    await createButton.click();

    await expect(page.getByText('Tên chuyến đi')).toBeVisible({ timeout: 5000 });

    // The submit button should be disabled when the title is empty
    const submitButton = page.getByLabel('Xác nhận tạo chuyến đi');
    await expect(submitButton).toBeDisabled();

    // Type something and then clear to trigger the dirty state
    // (validation error only shows when dirty || submitAttempted)
    const nameInput = page.getByPlaceholder('VD: Mùa hè rực rỡ');
    await nameInput.fill('temp');
    await nameInput.fill('');

    // Validation error should now appear because dirty=true and title is empty
    const validationError = page.getByText('Vui lòng nhập tên chuyến đi.');
    await expect(validationError).toBeVisible({ timeout: 3000 });

    // The submit button should still be disabled
    await expect(submitButton).toBeDisabled();
  });
});
