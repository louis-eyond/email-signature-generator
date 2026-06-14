
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');

test('application logic', async (t) => {
  const html = fs.readFileSync('index.html', 'utf8');
  const scriptMatch = html.match(/<script>\s*\(\s*function\s*\(\)\s*\{([\s\S]*?)\}\)\(\);\s*<\/script>/);
  if (!scriptMatch) {
    throw new Error("Could not find script block in index.html");
  }
  const scriptContent = scriptMatch[1];

  // We append code to export the internal functions we want to test
  const testCode = scriptContent + `
    module.exports = {
      esc, escAttr, stripProto, addProto, sanitizePhone,
      getValues, render, defaults, flash
    };
  `;

  // Mock DOM implementation for the application logic
  const domElements = {};
  const createClassListMock = () => ({
    classes: new Set(),
    add: function(cls) { this.classes.add(cls); },
    remove: function(cls) { this.classes.delete(cls); }
  });

  const mockDocument = {
    createElement: (tag) => {
      return {
        _textContent: '',
        set textContent(val) { this._textContent = val; },
        get textContent() { return this._textContent; },
        get innerHTML() {
          return this._textContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        },
        style: {},
        classList: createClassListMock()
      };
    },
    getElementById: (id) => {
      if (!domElements[id]) {
        // Create standard mock element with common properties used
        domElements[id] = {
          value: '',
          checked: false,
          addEventListener: () => {},
          style: {},
          classList: createClassListMock()
        };
      }
      return domElements[id];
    },
    querySelectorAll: () => ([]),
  };

  const mockTimeouts = [];
  const context = {
    document: mockDocument,
    window: { ClipboardItem: function(){} },
    navigator: { clipboard: { write: () => {} } },
    FileReader: function() {},
    setTimeout: (cb, delay) => {
      mockTimeouts.push({ cb, delay });
      return mockTimeouts.length;
    },
    console: console,
    module: {},
    DOMPurify: { sanitize: (html) => html }
    mockTimeouts: mockTimeouts // Expose for testing
  };

  vm.createContext(context);
  vm.runInContext(testCode, context);

  const helpers = context.module.exports;

  await t.test('Utility: esc()', () => {
    assert.strictEqual(helpers.esc('hello <world> & "quotes"'), 'hello &lt;world&gt; &amp; "quotes"');
  });

  await t.test('Utility: escAttr()', () => {
    assert.strictEqual(helpers.escAttr('hello <world> & "quotes" \'single\''), 'hello &lt;world&gt; &amp; &quot;quotes&quot; &#39;single&#39;');
  });

  await t.test('Utility: stripProto()', () => {
    assert.strictEqual(helpers.stripProto('https://example.com/'), 'example.com');
    assert.strictEqual(helpers.stripProto('http://example.com'), 'example.com');
    assert.strictEqual(helpers.stripProto('example.com'), 'example.com');
  });

  await t.test('Utility: addProto()', () => {
    assert.strictEqual(helpers.addProto('example.com'), 'https://example.com');
    assert.strictEqual(helpers.addProto('http://example.com'), 'http://example.com');
    assert.strictEqual(helpers.addProto('https://example.com'), 'https://example.com');
    assert.strictEqual(helpers.addProto(''), '#');
  });

  await t.test('Utility: sanitizePhone()', () => {
    // Happy paths
    assert.strictEqual(helpers.sanitizePhone('+1 (555) 123-4567'), '+15551234567');
    assert.strictEqual(helpers.sanitizePhone('555-123-4567'), '5551234567');
    assert.strictEqual(helpers.sanitizePhone('555 123 4567'), '5551234567');
    assert.strictEqual(helpers.sanitizePhone('5551234567'), '5551234567');

    // Edge cases
    assert.strictEqual(helpers.sanitizePhone(''), '');
    assert.strictEqual(helpers.sanitizePhone('   '), '');
    assert.strictEqual(helpers.sanitizePhone('555-123-4567 ext 123'), '5551234567123');
    assert.strictEqual(helpers.sanitizePhone('!@#$%^&*()_+-=[]{}|;:",.<>/?~`'), '+');
    assert.strictEqual(helpers.sanitizePhone('++11 555'), '++11555');
    assert.strictEqual(helpers.sanitizePhone('55+51'), '55+51');
    assert.strictEqual(helpers.sanitizePhone('phone number'), '');
    assert.strictEqual(helpers.sanitizePhone('(123) 456-7890'), '1234567890');
    assert.strictEqual(helpers.sanitizePhone('+1 234 567 8900'), '+12345678900');
    assert.strictEqual(helpers.sanitizePhone('abc 123'), '123');
  });

  await t.test('Logic: render() handles empty fields gracefully', () => {
    // Reset all values to empty
    for (const key in domElements) {
      if (domElements[key].hasOwnProperty('value')) domElements[key].value = '';
      if (domElements[key].hasOwnProperty('checked')) domElements[key].checked = false;
    }

    // Call render
    helpers.render();

    // With all empty, it should output placeholder text
    const preview = domElements['sig-preview'];
    assert.ok(preview.innerHTML.includes('Fill in the form above to generate your signature.'));
  });

  await t.test('Logic: render() generates signature with minimal identity', () => {
    // Set minimal identity
    domElements['sig-name'].value = 'Test User';
    domElements['sig-color'].value = '#ff0000';
    domElements['sig-font'].value = 'Arial';

    helpers.render();

    const preview = domElements['sig-preview'];
    assert.ok(!preview.innerHTML.includes('Fill in the form above'));
    assert.ok(preview.innerHTML.includes('Test User'));
  });

  await t.test('Logic: render() generates signature with all fields populated', () => {
    // Populate all fields
    domElements['sig-name'].value = 'Full Name';
    domElements['sig-title'].value = 'CEO';
    domElements['sig-company'].value = 'Corp';
    domElements['sig-phone'].value = '555-1234';
    domElements['sig-email'].value = 'test@example.com';
    domElements['sig-website'].value = 'https://example.com';
    domElements['sig-meeting'].value = 'https://cal.com/test';
    domElements['sig-logo'].value = 'https://example.com/logo.png';
    domElements['sig-font'].value = 'Arial';
    domElements['sig-color'].value = '#ff0000';
    domElements['sig-linkedin'].value = 'https://linkedin.com/in/test';
    domElements['sig-twitter'].value = 'https://twitter.com/test';
    domElements['sig-facebook'].value = 'https://facebook.com/test';
    domElements['sig-instagram'].value = 'https://instagram.com/test';
    domElements['sig-github'].value = 'https://github.com/test';
    domElements['sig-disclaimer-toggle'].checked = true;
    domElements['sig-disclaimer'].value = 'Test disclaimer.';

    helpers.render();

    const preview = domElements['sig-preview'];
    const html = preview.innerHTML;

    assert.ok(!html.includes('Fill in the form above'));
    assert.ok(html.includes('Full Name'));
    assert.ok(html.includes('CEO'));
    assert.ok(html.includes('Corp'));
    assert.ok(html.includes('5551234')); // sanitized phone
    assert.ok(html.includes('test@example.com'));
    assert.ok(html.includes('example.com')); // stripped proto
    assert.ok(html.includes('cal.com/test')); // stripped proto
    assert.ok(html.includes('logo.png'));
    assert.ok(html.includes('linkedin.com'));
    assert.ok(html.includes('twitter.com'));
    assert.ok(html.includes('facebook.com'));
    assert.ok(html.includes('instagram.com'));
    assert.ok(html.includes('github.com'));
    assert.ok(html.includes('Test disclaimer.'));
  await t.test('UI: flash() provides visual feedback and resets', () => {
    // Clear previous timeouts if any
    context.mockTimeouts.length = 0;

    const btn = {
      textContent: 'Original',
      classList: {
        classes: new Set(),
        add: function(cls) { this.classes.add(cls); },
        remove: function(cls) { this.classes.delete(cls); },
        contains: function(cls) { return this.classes.has(cls); }
      }
    };

    helpers.flash(btn, 'Original', 'Copied!');

    // Check immediate state
    assert.strictEqual(btn.textContent, 'Copied!');
    assert.ok(btn.classList.contains('copied'));

    // Check setTimeout was called with 1800ms
    assert.strictEqual(context.mockTimeouts.length, 1);
    const timeout = context.mockTimeouts[0];
    assert.strictEqual(timeout.delay, 1800);

    // Execute the callback
    timeout.cb();

    // Check restored state
    assert.strictEqual(btn.textContent, 'Original');
    assert.ok(!btn.classList.contains('copied'));
  });
});
