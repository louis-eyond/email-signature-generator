const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>\s*\(\s*function\s*\(\)\s*\{([\s\S]*?)\}\)\(\);\s*<\/script>/);
const scriptContent = scriptMatch[1];

const testCode = scriptContent + `
  module.exports = { render, getValues, el };
`;

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
      get innerHTML() { return this._textContent; },
      style: {},
      classList: createClassListMock()
    };
  },
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        value: 'test',
        checked: true,
        addEventListener: () => {},
        style: {},
        classList: createClassListMock()
      };
    }
    return domElements[id];
  },
  querySelectorAll: () => ([]),
};

const context = {
  document: mockDocument,
  window: { ClipboardItem: function(){} },
  navigator: { clipboard: { write: () => {} } },
  FileReader: function() {},
  console: console,
  module: {}
};

vm.createContext(context);
vm.runInContext(testCode, context);

const { render } = context.module.exports;

// Warmup
for (let i = 0; i < 10000; i++) {
  render();
}

// Benchmark
const start = process.hrtime.bigint();
const ITERS = 100000;
for (let i = 0; i < ITERS; i++) {
  render();
}
const end = process.hrtime.bigint();

const durationNs = Number(end - start);
const msPerIter = durationNs / ITERS / 1e6;
const opsPerSec = ITERS / (durationNs / 1e9);

console.log(`Render time: ${msPerIter.toFixed(5)} ms/iter`);
console.log(`Operations per second: ${opsPerSec.toFixed(0)} ops/sec`);
