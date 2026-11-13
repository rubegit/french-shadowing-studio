/**
 * Runtime Verification Script for M42 (UNIT-01)
 * French Shadowing Studio
 * 
 * Tests:
 * 1. Mutual exclusive dropdown behavior (Order A & Order B)
 * 2. aria-expanded states on open, switch, close, re-open
 * 3. Escape key behavior
 * 4. Click outside behavior
 * 5. Mobile viewport (375x667)
 * 6. Translate view theme toggle (light -> dark -> light)
 * 7. Console error audit (0 errors)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function getFreePort() {
  return new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
}

async function main() {
  const httpPort = await getFreePort();
  const cdpPort = await getFreePort();

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0].split('#')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(projectRoot, reqPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(r => server.listen(httpPort, r));
  console.log(`HTTP Server active on ephemeral port http://localhost:${httpPort}`);

  const userDataDir = path.join('/tmp', 'chrome-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));

    // Connect to Chrome CDP
    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new globalThis.WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    const consoleErrors = [];

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
          }
          if (msg.id && pending.has(msg.id)) {
            const cb = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message));
            else cb.resolve(msg.result);
          }
        } catch (e) {}
      };
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        pending.set(curId, { resolve, reject });
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    async function evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return r && r.result ? r.result.value : null;
    }

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('=== TEST 1: DESKTOP PRACTICE DROPDOWN OVERLAP & ARIA (1440x900) ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `http://localhost:${httpPort}/index.html` });
    await new Promise(r => setTimeout(r, 1500));

    // Open sample video practice
    await evaluate(`
      if (window.openVideo) {
        window.openVideo('sample_fr_01', 'Sample Video');
      } else {
        document.getElementById('screen-input').classList.add('hidden');
        document.getElementById('screen-practice').classList.remove('hidden');
      }
    `);
    await new Promise(r => setTimeout(r, 600));

    // Initial state: both closed, aria-expanded="false"
    const initState = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('Initial state:', initState);
    if (initState.pvOpen !== false || initState.sandwichOpen !== false || initState.pvAria !== 'false' || initState.sandwichAria !== 'false') {
      throw new Error(`Initial state invalid: ${JSON.stringify(initState)}`);
    }

    // Step 1: Open pv-menu
    console.log('--- Step 1: Open #pv-menu ---');
    await evaluate(`window.pvToggleMenu();`);
    const s1 = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('State after opening pv-menu:', s1);
    if (!s1.pvOpen || s1.sandwichOpen || s1.pvAria !== 'true' || s1.sandwichAria !== 'false') {
      throw new Error(`Step 1 failed: ${JSON.stringify(s1)}`);
    }

    // Step 2: Switch to Sandwich Menu (Order A)
    console.log('--- Step 2: Click #practice-sandwich-btn while #pv-menu is open ---');
    await evaluate(`window.togglePracticeMobileMenu();`);
    const s2 = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('State after switching to Sandwich Menu:', s2);
    if (s2.pvOpen || !s2.sandwichOpen || s2.pvAria !== 'false' || s2.sandwichAria !== 'true') {
      throw new Error(`Step 2 (Order A) failed: ${JSON.stringify(s2)}`);
    }
    console.log('✔ PASS: Order A - Opening Sandwich closed #pv-menu, aria-expanded updated accurately');

    // Step 3: Switch back to pv-menu (Order B)
    console.log('--- Step 3: Click #pv-switch-btn while Sandwich Menu is open ---');
    await evaluate(`window.pvToggleMenu();`);
    const s3 = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('State after switching back to pv-menu:', s3);
    if (!s3.pvOpen || s3.sandwichOpen || s3.pvAria !== 'true' || s3.sandwichAria !== 'false') {
      throw new Error(`Step 3 (Order B) failed: ${JSON.stringify(s3)}`);
    }
    console.log('✔ PASS: Order B - Opening #pv-menu closed Sandwich Menu, aria-expanded updated accurately');

    // Step 4: Close with Escape
    console.log('--- Step 4: Press Escape ---');
    await evaluate(`
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escEvent);
    `);
    const s4 = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('State after Escape:', s4);
    if (s4.pvOpen || s4.sandwichOpen || s4.pvAria !== 'false' || s4.sandwichAria !== 'false') {
      throw new Error(`Step 4 (Escape) failed: ${JSON.stringify(s4)}`);
    }
    console.log('✔ PASS: Escape cleanly closed menu, both aria-expanded="false"');

    // Step 5: Re-open Sandwich and Close with Click Outside
    console.log('--- Step 5: Re-open Sandwich Menu -> Click Outside ---');
    await evaluate(`window.togglePracticeMobileMenu();`);
    await evaluate(`
      // click outside on main split container
      const sc = document.getElementById('split-container') || document.body;
      const mdown = new MouseEvent('mousedown', { bubbles: true });
      sc.dispatchEvent(mdown);
    `);
    const s5 = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('State after Click Outside:', s5);
    if (s5.pvOpen || s5.sandwichOpen || s5.pvAria !== 'false' || s5.sandwichAria !== 'false') {
      throw new Error(`Step 5 (Click outside) failed: ${JSON.stringify(s5)}`);
    }
    console.log('✔ PASS: Click outside cleanly closed menu, both aria-expanded="false"');

    console.log('\n=== TEST 2: MOBILE VIEWPORT TEST (375x667) ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });

    await evaluate(`window.pvToggleMenu();`);
    await evaluate(`window.togglePracticeMobileMenu();`);
    const mState = await evaluate(`({
      pvOpen: !document.getElementById('pv-menu').classList.contains('pv-x'),
      pvAria: document.getElementById('pv-switch-btn').getAttribute('aria-expanded'),
      sandwichOpen: window.practiceMobileMenuOpen ? window.practiceMobileMenuOpen() : !document.getElementById('practice-sandwich-menu').classList.contains('pv-x'),
      sandwichAria: document.getElementById('practice-sandwich-btn').getAttribute('aria-expanded')
    })`);
    console.log('Mobile dual open check:', mState);
    if (mState.pvOpen || !mState.sandwichOpen || mState.pvAria !== 'false' || mState.sandwichAria !== 'true') {
      throw new Error(`Mobile dual open test failed: ${JSON.stringify(mState)}`);
    }
    console.log('✔ PASS: Mobile viewport correctly prevents dual open');

    console.log('\n=== TEST 3: TRANSLATE SCREEN THEME TOGGLE CHECK (ISSUE-01) ===');
    await evaluate(`
      document.getElementById('screen-practice').classList.add('hidden');
      document.getElementById('screen-vt').classList.remove('hidden');
    `);
    await new Promise(r => setTimeout(r, 400));

    const initialTheme = await evaluate(`document.documentElement.getAttribute('data-theme') || 'light'`);
    console.log('Initial Theme on Translate Screen:', initialTheme);

    console.log('Clicking .fs-theme-toggle in .vt-header (Click 1)...');
    const t1 = await evaluate(`(() => {
      const themeBtn = document.querySelector('#screen-vt .vt-header .fs-theme-toggle');
      if (!themeBtn) throw new Error('Theme toggle button not found in .vt-header!');
      themeBtn.click();
      return document.documentElement.getAttribute('data-theme') || 'light';
    })()`);
    console.log('New Theme after click 1:', t1);
    if (t1 === initialTheme) throw new Error(`Click 1 did not toggle theme!`);
    console.log(`✔ PASS: Theme toggled from "${initialTheme}" to "${t1}"`);

    console.log('Clicking .fs-theme-toggle in .vt-header (Click 2)...');
    const t2 = await evaluate(`(() => {
      const themeBtn = document.querySelector('#screen-vt .vt-header .fs-theme-toggle');
      themeBtn.click();
      return document.documentElement.getAttribute('data-theme') || 'light';
    })()`);
    console.log('Restored Theme after click 2:', t2);
    if (t2 !== initialTheme) throw new Error(`Click 2 did not restore theme!`);
    console.log(`✔ PASS: Theme restored back to "${t2}"`);

    console.log('\n=== TEST 4: CONSOLE ERROR AUDIT ===');
    console.log('Console Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
      throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
    }
    console.log('✔ PASS: Zero console errors logged');

    console.log('\n🎉 ALL M42 FINAL PRE-COMMIT VERIFICATION CHECKS PASSED (100%)!');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    server.close();
  }
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
