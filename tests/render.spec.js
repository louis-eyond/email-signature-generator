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

  test('Reset Button restores all default values', async ({ page }) => {
    // 1. Identify all interactive input IDs based on the IDs used in the application
    const inputIds = [
      'sig-name', 'sig-title', 'sig-company',
      'sig-phone', 'sig-email', 'sig-website', 'sig-meeting',
      'sig-logo', 'sig-font', 'sig-color', 'sig-color-hex',
      'sig-linkedin', 'sig-twitter', 'sig-facebook', 'sig-instagram', 'sig-github',
      'sig-disclaimer-toggle', 'sig-disclaimer'
    ];

    const previewLocator = page.locator('#sig-preview');
    const resetBtn = page.locator('#reset-btn');

    // 2. Capture the initial state of all inputs and the preview
    const initialValues = {};
    for (const id of inputIds) {
      const locator = page.locator(`#${id}`);
      const type = await locator.evaluate(el => el.type);
      if (type === 'checkbox') {
        initialValues[id] = await locator.isChecked();
      } else {
        initialValues[id] = await locator.inputValue();
      }
    }
    const initialPreviewHTML = await previewLocator.innerHTML();

    // 3. Modify every single field
    const testValues = {
      'sig-name': 'Test Name',
      'sig-title': 'Test Title',
      'sig-company': 'Test Company',
      'sig-phone': '123-456-7890',
      'sig-email': 'test@example.com',
      'sig-website': 'https://test.com',
      'sig-meeting': 'https://meet.test.com',
      'sig-logo': 'https://test.com/logo.png',
      'sig-font': 'Courier New, Courier, monospace',
      'sig-color': '#ff0000',
      'sig-color-hex': '#ff0000',
      'sig-linkedin': 'https://linkedin.com/test',
      'sig-twitter': 'https://twitter.com/test',
      'sig-facebook': 'https://facebook.com/test',
      'sig-instagram': 'https://instagram.com/test',
      'sig-github': 'https://github.com/test',
      'sig-disclaimer-toggle': !initialValues['sig-disclaimer-toggle'],
      'sig-disclaimer': 'Test disclaimer'
    };

    for (const id of inputIds) {
      const locator = page.locator(`#${id}`);
      const type = await locator.evaluate(el => el.type);

      // If we unchecked the disclaimer toggle, the disclaimer field is hidden.
      // Make sure the disclaimer field is visible before we fill it,
      // or we handle the order correctly by avoiding filling it if it's hidden.
      if (id === 'sig-disclaimer') {
        const isVisible = await locator.isVisible();
        if (isVisible) {
          await locator.fill(testValues[id]);
        }
      } else if (type === 'checkbox') {
        if (testValues[id] !== initialValues[id]) {
          await locator.click(); // Toggle it
        }
      } else if (type === 'select-one') {
        await locator.selectOption({ label: 'Courier New' });
      } else {
        await locator.fill(testValues[id]);
      }
    }

    // Verify at least one change applied successfully
    await expect(page.locator('#sig-name')).toHaveValue('Test Name');

    // 4. Click the #reset-btn
    await resetBtn.click();

    // 5. Assert all fields match their original defaults
    for (const id of inputIds) {
      const locator = page.locator(`#${id}`);
      const type = await locator.evaluate(el => el.type);
      if (type === 'checkbox') {
        const isChecked = await locator.isChecked();
        expect(isChecked).toBe(initialValues[id]);
      } else {
        await expect(locator).toHaveValue(initialValues[id]);
      }
    }

    // 6. Assert the preview HTML matches the initial default preview HTML
    const finalPreviewHTML = await previewLocator.innerHTML();
    expect(finalPreviewHTML).toBe(initialPreviewHTML);
  });
});