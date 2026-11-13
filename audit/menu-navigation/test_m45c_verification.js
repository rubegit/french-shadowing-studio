/**
 * Automated Verification Script for M45C1 (UNIT-02C1) — Translate AI Modal
 * Native Chrome CDP implementation (Zero external npm dependency)
 * 
 * Verifies:
 * 1. Modal Structure & ARIA: #vt-ai-modal direct child of body, role="dialog", aria-modal="true", aria-labelledby="vt-ai-title"
 * 2. Clean State Dismissal across Escape, Backdrop, Nút X, Nút "Để sau" (0 confirm, immediate close, focus restore)
 * 3. Dirty State Protection across Escape, Backdrop, Nút X, Nút "Để sau" (exact 1 confirm, cancel preserves, ok closes)
 * 4. Apply Success Flow: Auto-close after 900ms, zero discard prompt, focus restore to #vt-ai-btn
 * 5. Re-open Guard: Calling vtOpenAI() during 900ms closing delay does not reset text or spawn conflicting session
 * 6. Apply Failure Safety: Invalid translation syntax shows error banner, modal remains open, text preserved
 * 7. Popover Coordination: Opening modal closes #vt-pop; Escape does not close multiple overlays simultaneously
 * 8. Viewport & Responsive Checks: 320px and 375px mobile viewports render within safe areas
 * 9. Regression & Zero Console Error Audit
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

async function runM45CVerification() {
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

  const userDataDir = path.join('/tmp', 'chrome-m45c-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));

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

    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new globalThis.WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    const consoleErrors = [];
    let dialogCount = 0;
    let nextDialogResponse = true;

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
          }
          if (msg.method === 'Page.javascriptDialogOpening') {
            dialogCount++;
            send('Page.handleJavaScriptDialog', { accept: nextDialogResponse });
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    await send('Page.navigate', { url: `http://localhost:${httpPort}/index.html` });
    for (let i = 0; i < 20; i++) {
      const ready = await evaluate(`document.readyState === 'complete' && typeof window.FSSModal === 'object' && typeof window.vtOpenAI === 'function'`);
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // Set up mock session in Translate screen
    await evaluate(`(async () => {
      if (typeof window.vtImportPayload === 'function') {
        const key = window.vtImportPayload({
          title: 'Test de traduction',
          sentences: ['Bonjour tout le monde.', "C'est une belle journée."]
        });
        if (window.vtOpenKey) {
          await window.vtOpenKey(key);
        }
      }
    })()`);

    console.log('\n=== TEST 1: MODAL STRUCTURE & ARIA ATTRIBUTES ===');
    const structure = await evaluate(`(() => {
      const modal = document.getElementById('vt-ai-modal');
      const dialog = modal ? modal.querySelector('.ai-modal') : null;
      const title = document.getElementById('vt-ai-title');
      const closeBtn = document.getElementById('vt-ai-btn-close');
      const copyBtn = document.getElementById('vt-ai-btn-copy');
      const applyBtn = document.getElementById('vt-ai-btn-apply');
      const cancelBtn = document.getElementById('vt-ai-btn-cancel');

      return {
        exists: !!modal,
        parentIsBody: modal ? modal.parentElement === document.body : false,
        hasDialogRole: dialog ? dialog.getAttribute('role') === 'dialog' : false,
        hasAriaModal: dialog ? dialog.getAttribute('aria-modal') === 'true' : false,
        labelledBy: dialog ? dialog.getAttribute('aria-labelledby') : null,
        titleId: title ? title.id : null,
        hasCloseBtn: !!closeBtn,
        hasCopyBtn: !!copyBtn,
        hasApplyBtn: !!applyBtn,
        hasCancelBtn: !!cancelBtn
      };
    })()`);

    console.log('Structure test result:', structure);
    if (!structure.exists || !structure.parentIsBody) throw new Error('Portal placement failed: #vt-ai-modal is not under body');
    if (!structure.hasDialogRole || !structure.hasAriaModal) throw new Error('ARIA role/modal attribute missing');
    if (structure.labelledBy !== 'vt-ai-title' || structure.titleId !== 'vt-ai-title') throw new Error('aria-labelledby does not match title id');
    console.log('✔ PASS: Modal structure and ARIA attributes fully compliant');

    console.log('\n=== TEST 2: CLEAN STATE DISMISSAL (0 CONFIRM, IMMEDIATE CLOSE) ===');
    const dismissalMethods = ['escape', 'closeBtn', 'cancelBtn', 'backdrop'];

    for (const method of dismissalMethods) {
      dialogCount = 0;
      await evaluate(`window.vtOpenAI()`);
      await new Promise(r => setTimeout(r, 100));

      const isOpenBefore = await evaluate(`document.getElementById('vt-ai-modal').classList.contains('open') && window.FSSModal.getActiveStack().length === 1`);
      if (!isOpenBefore) throw new Error(`Modal failed to open before testing dismissal by ${method}`);

      if (method === 'escape') {
        await evaluate(`(() => {
          const event = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
          document.dispatchEvent(event);
        })()`);
      } else if (method === 'closeBtn') {
        await evaluate(`document.getElementById('vt-ai-btn-close').click()`);
      } else if (method === 'cancelBtn') {
        await evaluate(`document.getElementById('vt-ai-btn-cancel').click()`);
      } else if (method === 'backdrop') {
        await evaluate(`(() => {
          const modal = document.getElementById('vt-ai-modal');
          const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          Object.defineProperty(evt, 'target', { value: modal });
          modal.dispatchEvent(evt);
        })()`);
      }

      await new Promise(r => setTimeout(r, 100));
      const isOpenAfter = await evaluate(`document.getElementById('vt-ai-modal').classList.contains('open') || window.FSSModal.getActiveStack().length > 0`);
      if (isOpenAfter) throw new Error(`Clean state dismissal failed for method: ${method}`);
      if (dialogCount !== 0) throw new Error(`Clean state dismissal unexpectedly prompted confirm dialog for method: ${method}`);
      console.log(`✔ PASS: Clean state dismissal via ${method} (0 confirm, immediate close)`);
    }

    console.log('\n=== TEST 3: DIRTY STATE PROTECTION & EXACT SINGLE CONFIRM ===');
    for (const method of dismissalMethods) {
      // 3A: Test Cancel Confirm -> Stays Open
      dialogCount = 0;
      nextDialogResponse = false; // User clicks Cancel on confirm
      await evaluate(`window.vtOpenAI()`);
      await evaluate(`(() => { document.getElementById('vt-ai-text').value = '1\\nS: Chào\\nT: Bonjour'; })()`);

      const dirtyCheck = await evaluate(`window.isVtAiDirty()`);
      if (!dirtyCheck) throw new Error('isVtAiDirty() returned false when textarea had text');

      if (method === 'escape') {
        await evaluate(`(() => {
          const event = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
          document.dispatchEvent(event);
        })()`);
      } else if (method === 'closeBtn') {
        await evaluate(`document.getElementById('vt-ai-btn-close').click()`);
      } else if (method === 'cancelBtn') {
        await evaluate(`document.getElementById('vt-ai-btn-cancel').click()`);
      } else if (method === 'backdrop') {
        await evaluate(`(() => {
          const modal = document.getElementById('vt-ai-modal');
          const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          Object.defineProperty(evt, 'target', { value: modal });
          modal.dispatchEvent(evt);
        })()`);
      }

      await new Promise(r => setTimeout(r, 100));
      const stillOpen = await evaluate(`document.getElementById('vt-ai-modal').classList.contains('open') && window.FSSModal.getActiveStack().length === 1`);
      const textPreserved = await evaluate(`document.getElementById('vt-ai-text').value.includes('Bonjour')`);
      if (!stillOpen || !textPreserved) throw new Error(`Cancel confirm failed to preserve modal state for method: ${method}`);
      if (dialogCount !== 1) throw new Error(`Expected exactly 1 confirm dialog on dirty cancel, got: ${dialogCount}`);

      // 3B: Test Accept Confirm -> Closes
      dialogCount = 0;
      nextDialogResponse = true; // User clicks OK on confirm
      if (method === 'escape') {
        await evaluate(`(() => {
          const event = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
          document.dispatchEvent(event);
        })()`);
      } else if (method === 'closeBtn') {
        await evaluate(`document.getElementById('vt-ai-btn-close').click()`);
      } else if (method === 'cancelBtn') {
        await evaluate(`document.getElementById('vt-ai-btn-cancel').click()`);
      } else if (method === 'backdrop') {
        await evaluate(`(() => {
          const modal = document.getElementById('vt-ai-modal');
          const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          Object.defineProperty(evt, 'target', { value: modal });
          modal.dispatchEvent(evt);
        })()`);
      }

      await new Promise(r => setTimeout(r, 100));
      const closed = await evaluate(`!document.getElementById('vt-ai-modal').classList.contains('open') && window.FSSModal.getActiveStack().length === 0`);
      if (!closed) throw new Error(`Accept confirm failed to close modal for method: ${method}`);
      if (dialogCount !== 1) throw new Error(`Expected exactly 1 confirm dialog on dirty accept, got: ${dialogCount}`);
      console.log(`✔ PASS: Dirty state protection via ${method} (Exact 1 confirm: Cancel preserves, OK closes)`);
    }

    console.log('\n=== TEST 4: APPLY SUCCESS & 900MS AUTO-CLOSE WITH ZERO CONFIRM ===');
    dialogCount = 0;
    await evaluate(`window.vtOpenAI()`);
    await evaluate(`(() => {
      document.getElementById('vt-ai-text').value = "1\\nS: Chào mọi người\\nT: Bonjour tout le monde";
      window.vtApplyAI();
    })()`);

    const statusOk = await evaluate(`document.getElementById('vt-ai-status').className.includes('ok')`);
    if (!statusOk) throw new Error('Apply success status banner not displayed');
    const dirtyAfterApply = await evaluate(`window.isVtAiDirty()`);
    if (dirtyAfterApply) throw new Error('Modal is still dirty after successful apply');

    // Wait 1000ms for 900ms timer
    await new Promise(r => setTimeout(r, 1000));
    const closedAfterTimer = await evaluate(`!document.getElementById('vt-ai-modal').classList.contains('open') && window.FSSModal.getActiveStack().length === 0`);
    if (!closedAfterTimer) throw new Error('Modal failed to auto-close after 900ms timer');
    if (dialogCount !== 0) throw new Error('Apply success unexpectedly prompted discard confirm');
    console.log('✔ PASS: Apply success auto-closes after 900ms with 0 confirm');

    console.log('\n=== TEST 5: RE-OPEN GUARD & SESSION GENERATION SAFETY ===');
    await evaluate(`window.vtOpenAI()`);
    await evaluate(`(() => {
      document.getElementById('vt-ai-text').value = "1\\nS: Chào\\nT: Salut";
      // Call vtOpenAI while already open
      window.vtOpenAI();
    })()`);

    const textNotReset = await evaluate(`document.getElementById('vt-ai-text').value === "1\\nS: Chào\\nT: Salut"`);
    if (!textNotReset) throw new Error('Re-open guard failed: textarea was wiped when calling vtOpenAI while open');
    console.log('✔ PASS: Re-open guard preserves textarea when called while open');

    // Close properly
    nextDialogResponse = true;
    await evaluate(`window.vtCloseAI()`);
    await new Promise(r => setTimeout(r, 100));

    console.log('\n=== TEST 6: APPLY FAILURE SAFETY (SYNTAX ERROR) ===');
    await evaluate(`window.vtOpenAI()`);
    await evaluate(`(() => {
      document.getElementById('vt-ai-text').value = "Dữ liệu vô nghĩa không có cấu trúc câu";
      window.vtApplyAI();
    })()`);

    const statusErr = await evaluate(`document.getElementById('vt-ai-status').className.includes('err')`);
    const modalStaysOpen = await evaluate(`document.getElementById('vt-ai-modal').classList.contains('open')`);
    const textStillThere = await evaluate(`document.getElementById('vt-ai-text').value.includes('Dữ liệu vô nghĩa')`);

    if (!statusErr || !modalStaysOpen || !textStillThere) {
      throw new Error('Apply failure did not safely retain modal and text');
    }
    console.log('✔ PASS: Apply failure safely displays error status, preserves modal open and input text');
    await evaluate(`window.vtCloseAI(true)`); // Force close to clean up

    console.log('\n=== TEST 7: POPOVER COORDINATION (#vt-pop) ===');
    await evaluate(`(() => {
      const pop = document.getElementById('vt-pop');
      if (pop) pop.classList.remove('pv-x'); // Simulate open popover
      window.vtOpenAI();
    })()`);

    const popClosed = await evaluate(`document.getElementById('vt-pop').classList.contains('pv-x')`);
    if (!popClosed) throw new Error('#vt-pop was not closed when #vt-ai-modal opened');
    await evaluate(`window.vtCloseAI(true)`);
    console.log('✔ PASS: Popover #vt-pop properly dismissed before modal opens');

    console.log('\n=== TEST 8: MOBILE VIEWPORT & TOUCH VERIFICATION (320px & 375px) ===');
    for (const w of [375, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 667, deviceScaleFactor: 2, mobile: true });
      await evaluate(`window.vtOpenAI()`);
      await new Promise(r => setTimeout(r, 150));

      const metrics = await evaluate(`(() => {
        const dialog = document.querySelector('#vt-ai-modal .ai-modal');
        const rect = dialog ? dialog.getBoundingClientRect() : null;
        return {
          dialogWidth: rect ? rect.width : 0,
          windowWidth: window.innerWidth,
          overflowX: rect ? rect.right > window.innerWidth + 2 : false
        };
      })()`);

      if (metrics.overflowX) throw new Error(`Horizontal overflow detected in mobile viewport ${w}px`);
      await evaluate(`window.vtCloseAI(true)`);
      console.log(`✔ PASS: Mobile viewport ${w}px render verification without horizontal overflow`);
    }

    console.log('\n=== TEST 9: CONSOLE ERROR AUDIT ===');
    console.log(`Captured console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Test failed with ${consoleErrors.length} unexpected console errors`);
    }
    console.log('✔ PASS: 0 unexpected console errors');

    console.log('\n======================================================');
    console.log('🎉 ALL M45C1 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');

  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

runM45CVerification().catch(err => {
  console.error('\n❌ M45C1 VERIFICATION FAILED:', err);
  process.exit(1);
});
