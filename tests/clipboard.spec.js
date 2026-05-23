const { test, expect } = require('@playwright/test');

test.describe('Clipboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Copy HTML source button copies HTML to clipboard and flashes "Copied!"', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyHtmlBtn = page.locator('#copy-html');
    await copyHtmlBtn.click();

    // Check clipboard content
    const clipboardText = await page.evaluate('navigator.clipboard.readText()');
    expect(clipboardText).toContain('Louis Lavin');
    expect(clipboardText).toContain('<table');

    // Check button text flashes
    await expect(copyHtmlBtn).toHaveText('Copied!');
  });

  test('Copy HTML source button does nothing when form is empty (placeholder present)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Clear clipboard initially
    await page.evaluate('navigator.clipboard.writeText("initial")');

    // Clear the form to show placeholder
    const ids = [
      '#sig-name', '#sig-title', '#sig-company',
      '#sig-phone', '#sig-email', '#sig-website', '#sig-meeting',
      '#sig-logo'
    ];
    for (const id of ids) {
      await page.locator(id).fill('');
    }

    const previewLocator = page.locator('#sig-preview');
    await expect(previewLocator).toContainText('Fill in the form above to generate your signature.');

    const copyHtmlBtn = page.locator('#copy-html');
    await copyHtmlBtn.click();

    // Check clipboard content has not changed
    const clipboardText = await page.evaluate('navigator.clipboard.readText()');
    expect(clipboardText).toBe('initial');

    // Check button text does not flash
    await expect(copyHtmlBtn).toHaveText('Copy HTML source');
  });
});
