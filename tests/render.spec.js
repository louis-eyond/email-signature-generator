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
    // Actually the phone number in the default is (866)795-8386
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

  test('Reset Button restores default values', async ({ page }) => {
    const nameInput = page.locator('#sig-name');
    const companyInput = page.locator('#sig-company');
    const previewLocator = page.locator('#sig-preview');
    const resetBtn = page.locator('#reset-btn');

    // Default values
    const defaultName = 'Louis Lavin';
    const defaultCompany = 'EYOND, Inc.';

    // Change input fields
    await nameInput.fill('John Doe');
    await companyInput.fill('Acme Corp');

    // Verify changes are reflected
    await expect(previewLocator).toContainText('John Doe');
    await expect(previewLocator).toContainText('Acme Corp');
    await expect(nameInput).toHaveValue('John Doe');
    await expect(companyInput).toHaveValue('Acme Corp');

    // Click reset button
    await resetBtn.click();

    // Verify the fields are restored to defaults
    await expect(nameInput).toHaveValue(defaultName);
    await expect(companyInput).toHaveValue(defaultCompany);

    // Verify the preview reflects defaults
    await expect(previewLocator).toContainText(defaultName);
    await expect(previewLocator).toContainText(defaultCompany);
    await expect(previewLocator).not.toContainText('John Doe');
    await expect(previewLocator).not.toContainText('Acme Corp');
  });
});