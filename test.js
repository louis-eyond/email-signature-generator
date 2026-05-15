const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Use a more generic regex to extract the function
const funcMatch = html.match(/(function escAttr\([^)]*\)\s*\{[\s\S]*?\})/);

if (!funcMatch) {
  console.error("Could not find escAttr function in index.html");
  process.exitCode = 1;
  return;
}

const funcCode = funcMatch[1];
const sandbox = {};
vm.createContext(sandbox);

try {
  vm.runInContext(funcCode + '\nthis.escAttr = escAttr;', sandbox);
} catch (error) {
  console.error("Failed to parse or evaluate escAttr:", error);
  process.exitCode = 1;
  return;
}

const escAttr = sandbox.escAttr;

try {
  assert.strictEqual(escAttr('test'), 'test');
  assert.strictEqual(escAttr('&'), '&amp;');
  assert.strictEqual(escAttr('"'), '&quot;');
  assert.strictEqual(escAttr("'"), '&#39;');
  assert.strictEqual(escAttr('<'), '&lt;');
  assert.strictEqual(escAttr('>'), '&gt;');
  assert.strictEqual(escAttr("a & b \" c ' d < e > f"), 'a &amp; b &quot; c &#39; d &lt; e &gt; f');
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exitCode = 1;
}
