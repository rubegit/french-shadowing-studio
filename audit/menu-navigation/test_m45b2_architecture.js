/**
 * Architecture Verification Script for M45B2 (Article Modals: #modal-art-ai-sync & #modal-art-level)
 * Evaluates Portal Pattern (Option A) vs In-place Pattern (Option B)
 * READ-ONLY EXPERIMENTATION — Zero Application Source Code Changes
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

async function runM45B2ArchitectureVerification() {
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

  const userDataDir = path.join('/tmp', 'chrome-m45b2-arch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));
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

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
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
      const ready = await evaluate(`document.readyState === 'complete' && typeof window.FSSModal === 'object'`);
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // 1. Inspect DOM Hierarchy
    const hierarchy = await evaluate(`(() => {
      const syncModal = document.getElementById('modal-art-ai-sync');
      const levelModal = document.getElementById('modal-art-level');
      
      function getAncestors(el) {
        const list = [];
        let cur = el ? el.parentElement : null;
        while (cur) {
          list.push({
            tag: cur.tagName.toLowerCase(),
            id: cur.id || '',
            className: cur.className || ''
          });
          cur = cur.parentElement;
        }
        return list;
      }

      return {
        syncExists: !!syncModal,
        levelExists: !!levelModal,
        syncParent: syncModal ? syncModal.parentElement.id : null,
        levelParent: levelModal ? levelModal.parentElement.id : null,
        syncAncestors: getAncestors(syncModal)
      };
    })()`);
    console.log('\n[1] DOM Hierarchy Inspection:', JSON.stringify(hierarchy, null, 2));

    // 2. Simulate In-place (Option B) Sibling Inert behavior
    const inplaceInertAnalysis = await evaluate(`(() => {
      const syncModal = document.getElementById('modal-art-ai-sync');
      const levelModal = document.getElementById('modal-art-level');
      
      // Setup Text Mode / Practice Screen
      document.body.classList.add('text-mode');
      const screenPractice = document.getElementById('screen-practice');
      if (screenPractice) screenPractice.classList.remove('hidden');

      // Test opening in-place with FSSModal
      syncModal.style.display = 'flex';
      syncModal.classList.add('open');

      window.FSSModal.open('modal-art-ai-sync', {
        initialFocus: '#art-sync-input'
      });

      const sidePanelInert = document.getElementById('article-side-panel') ? document.getElementById('article-side-panel').inert : false;
      const panelLeftInert = document.getElementById('panel-left') ? document.getElementById('panel-left').inert : false;
      const screenPracticeInert = screenPractice.inert;
      const syncModalInert = syncModal.inert;

      // Now simulate a Body-level modal opening while in-place modal is open (Ancestor Inert Trap test)
      // e.g. window.FSSModal.open('share-modal')
      const shareModal = document.getElementById('share-modal');
      shareModal.classList.add('open');
      window.FSSModal.open('share-modal');

      const screenPracticeInertAfterShare = screenPractice.inert;
      const syncModalInertAfterShare = syncModal.inert;
      const syncModalComputedInert = syncModal.closest('[inert]') !== null;

      // Close share modal and sync modal
      window.FSSModal.close('share-modal');
      shareModal.classList.remove('open');
      window.FSSModal.close('modal-art-ai-sync');
      syncModal.classList.remove('open');
      syncModal.style.display = 'none';

      return {
        whileSyncOnly: {
          sidePanelInert,
          panelLeftInert,
          screenPracticeInert,
          syncModalInert
        },
        afterShareModalOpened: {
          screenPracticeInertAfterShare,
          syncModalInertAfterShare,
          syncModalTrappedUnderAncestorInert: syncModalComputedInert
        }
      };
    })()`);
    console.log('\n[2] In-Place (Option B) Sibling Inert & Ancestor Trap Analysis:', JSON.stringify(inplaceInertAnalysis, null, 2));

    // 3. Simulate Portal Pattern (Option A: Modal moved to body)
    const portalPatternAnalysis = await evaluate(`(() => {
      const syncModal = document.getElementById('modal-art-ai-sync');
      const origParent = syncModal.parentElement;

      // Temporarily move syncModal to document.body
      document.body.appendChild(syncModal);

      syncModal.style.display = 'flex';
      syncModal.classList.add('open');

      window.FSSModal.open('modal-art-ai-sync', {
        initialFocus: '#art-sync-input'
      });

      const screenPracticeInert = document.getElementById('screen-practice').inert;
      const syncModalInert = syncModal.inert;

      // Now simulate Share modal opening
      const shareModal = document.getElementById('share-modal');
      shareModal.classList.add('open');
      window.FSSModal.open('share-modal');

      const syncModalInertAfterShare = syncModal.inert;
      const syncModalHasInertAncestor = (syncModal.parentElement && syncModal.parentElement !== document.body && syncModal.parentElement.closest('[inert]')) !== null;
      const activeEl = document.activeElement;

      // Close both
      window.FSSModal.close('share-modal');
      shareModal.classList.remove('open');
      window.FSSModal.close('modal-art-ai-sync');
      syncModal.classList.remove('open');
      syncModal.style.display = 'none';

      // Restore to original parent
      origParent.appendChild(syncModal);

      return {
        whileSyncOnly: {
          screenPracticeInert,
          syncModalInert
        },
        afterShareModalOpened: {
          syncModalInertDirectlyManaged: syncModalInertAfterShare,
          syncModalHasInertAncestor,
          shareModalHasFocus: activeEl ? activeEl.closest('#share-modal') !== null : false
        }
      };
    })()`);
    console.log('\n[3] Portal Pattern (Option A) Simulation Results:', JSON.stringify(portalPatternAnalysis, null, 2));

    // 4. Inspect CSS Computed Styles in both locations
    const styleCheck = await evaluate(`(() => {
      const syncModal = document.getElementById('modal-art-ai-sync');
      const computedInPlace = window.getComputedStyle(syncModal);
      const inPlaceStyles = {
        position: computedInPlace.position,
        zIndex: computedInPlace.zIndex,
        display: computedInPlace.display
      };

      // Check when moved to body
      const origParent = syncModal.parentElement;
      document.body.appendChild(syncModal);
      const computedInBody = window.getComputedStyle(syncModal);
      const inBodyStyles = {
        position: computedInBody.position,
        zIndex: computedInBody.zIndex,
        display: computedInBody.display
      };
      origParent.appendChild(syncModal);

      return { inPlaceStyles, inBodyStyles };
    })()`);
    console.log('\n[4] Computed Styles Check:', JSON.stringify(styleCheck, null, 2));

    console.log('\nArchitecture Verification complete.');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
}

runM45B2ArchitectureVerification().catch(e => {
  console.error(e);
  process.exit(1);
});
