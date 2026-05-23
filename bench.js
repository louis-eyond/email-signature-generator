const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <script>
      function escOld(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
      }

      var _escDiv = document.createElement('div');
      function escNew(str) {
        _escDiv.textContent = str;
        return _escDiv.innerHTML;
      }

      window.runBenchmark = function() {
        const testStr = 'Hello <world> & "quotes" \\'single\\'';
        const iterations = 1000000;

        // Warmup
        for (let i = 0; i < 10000; i++) {
          escOld(testStr);
          escNew(testStr);
        }

        const startOld = performance.now();
        for (let i = 0; i < iterations; i++) {
          escOld(testStr);
        }
        const endOld = performance.now();

        const startNew = performance.now();
        for (let i = 0; i < iterations; i++) {
          escNew(testStr);
        }
        const endNew = performance.now();

        return {
          iterations,
          oldTime: endOld - startOld,
          newTime: endNew - startNew
        };
      }
    </script>
  `);

  const results = await page.evaluate(() => window.runBenchmark());
  console.log('Results:', results);

  await browser.close();
})();
