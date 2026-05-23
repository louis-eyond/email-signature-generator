const { test, expect } = require('@playwright/test');

test.describe('Copy Signatures', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions for both read and write
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
  });

  test('Copy signature button copies HTML and text to clipboard', async ({ page }) => {
    const copyRichBtn = page.locator('#copy-rich');
    const previewLocator = page.locator('#sig-preview');

    // Wait for the preview to be populated with the default content
    await expect(previewLocator).toContainText('Louis Lavin');

    // Click the copy button
    await copyRichBtn.click();

    // Check that button text flashed "Copied!"
    await expect(copyRichBtn).toHaveText('Copied!');

    // Read clipboard using page.evaluate (using navigator.clipboard API)
    const clipboardData = await page.evaluate(async () => {
      try {
        const items = await navigator.clipboard.read();
        let text = '';
        let html = '';
        for (const item of items) {
          if (item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            text = await blob.text();
          }
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            html = await blob.text();
          }
        }
        return { text, html };
      } catch (e) {
        return { error: e.message };
      }
    });

    // Ensure reading the clipboard was successful
    expect(clipboardData.error).toBeUndefined();

    // Assert the content copied to the clipboard
    expect(clipboardData.text).toContain('Louis Lavin');
    expect(clipboardData.html).toContain('Louis Lavin');
    expect(clipboardData.html).toContain('<table'); // HTML tags should be present in the text/html representation
  });

  test('Copy HTML source button copies HTML source to clipboard', async ({ page }) => {
    const copyHtmlBtn = page.locator('#copy-html');
    const previewLocator = page.locator('#sig-preview');

    await expect(previewLocator).toContainText('Louis Lavin');

    // Click the copy button
    await copyHtmlBtn.click();

    // Check that button text flashed "Copied!"
    await expect(copyHtmlBtn).toHaveText('Copied!');

    // Read clipboard text
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return null;
      }
    });

    expect(clipboardText).toContain('Louis Lavin');
    expect(clipboardText).toContain('<table');
  });

  test('Copy buttons do not work if the preview is empty', async ({ page }) => {
    const copyRichBtn = page.locator('#copy-rich');
    const copyHtmlBtn = page.locator('#copy-html');

    // Clear all inputs so preview is empty
    const inputsToClear = [
      '#sig-name', '#sig-title', '#sig-company',
      '#sig-phone', '#sig-email', '#sig-website', '#sig-meeting',
      '#sig-logo'
    ];
    for (const selector of inputsToClear) {
      await page.locator(selector).fill('');
    }

    // Verify preview shows placeholder
    const previewLocator = page.locator('#sig-preview');
    await expect(previewLocator).toContainText('Fill in the form above');

    // Click "Copy signature" and verify it does NOT change text to "Copied!"
    await copyRichBtn.click();
    // Use an explicit short timeout, as the test would fail if the text does change.
    await expect(copyRichBtn).not.toHaveText('Copied!', { timeout: 1000 });

    // Click "Copy HTML source" and verify it does NOT change text to "Copied!"
    await copyHtmlBtn.click();
    await expect(copyHtmlBtn).not.toHaveText('Copied!', { timeout: 1000 });
  });
});
