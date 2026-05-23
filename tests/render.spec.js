const { test, expect } = require('@playwright/test');

test.describe('Signature Generator Render Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local server
    await page.goto('/');
  });

  test('Initial State matches default values', async ({ page }) => {
    // Check that the preview contains the default name "Louis Lavin"
    const previewLocator = page.locator('#sig-preview');
    await expect(previewLocator).toContainText('Louis Lavin');

    // Check for default job title
    await expect(previewLocator).toContainText('Founder');

    // Check for default company
    await expect(previewLocator).toContainText('EYOND, Inc.');
  });

  test('Update Input reflects in preview', async ({ page }) => {
    const nameInput = page.locator('#sig-name');
    const previewLocator = page.locator('#sig-preview');

    // Clear and type a new name
    await nameInput.fill('');
    await nameInput.fill('John Doe');

    // Verify the preview updates
    await expect(previewLocator).toContainText('John Doe');
    await expect(previewLocator).not.toContainText('Louis Lavin');
  });

  test('Conditional Rendering handles cleared inputs', async ({ page }) => {
    const phoneInput = page.locator('#sig-phone');
    const previewLocator = page.locator('#sig-preview');

    // The initial state should have a phone link (tel:8667958386)
    // Actually the phone number in the default is (866) 795-8386
    await expect(previewLocator).toContainText('(866) 795-8386');

    // Clear the phone input
    await phoneInput.fill('');

    // Verify the phone number is removed from the preview
    await expect(previewLocator).not.toContainText('(866) 795-8386');
  });

  test('Disclaimer Toggle removes disclaimer from preview', async ({ page }) => {
    const toggle = page.locator('#sig-disclaimer-toggle');
    const previewLocator = page.locator('#sig-preview');

    // Initially, it's checked and the text should be present.
    // We check for "Important:" and "The content of this email is confidential"
    await expect(previewLocator).toContainText('Important:');

    // Uncheck the toggle
    await toggle.uncheck();

    // Verify the text is removed
    await expect(previewLocator).not.toContainText('Important:');
  });
});