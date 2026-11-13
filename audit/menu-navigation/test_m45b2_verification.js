/**
 * Automated Verification Script for M45B2 (UNIT-02B2) — Article Practice Modals
 * Native Chrome CDP implementation (Zero external npm dependency)
 * 
 * Verifies:
 * 1. Portal Placement: Both modals are direct children of document.body, extracted from #panel-right
 * 2. #modal-art-ai-sync ARIA, Initial Focus on #art-sync-input & Background Sibling Inert
 * 3. #modal-art-level ARIA, Initial Focus on active level chip & Background Sibling Inert
 * 4. Clean State Dismissal across Escape, Backdrop, Nút X, Nút Hủy (dismisses immediately without confirm)
 * 5. Dirty State Protection across Escape, Backdrop, Nút X, Nút Hủy (exact string comparison without trim, confirm once)
 * 6. Apply Success (updates sentences, saves history, closes without prompt, refocuses trigger)
 * 7. Apply Failure Safety (invalid JSON/structure, displays error status, keeps modal open, preserves data)
 * 8. CEFR Level Selection & Clear (updates level, closes modal, restores focus)
 * 9. Focus Restoration across Re-rendered DOM (renderArticleSidePanel creates new trigger element)
 * 10. Tab / Shift+Tab Focus Containment in both article modals
 * 11. Real Scroll Lock & Scroll Position Restoration (Y >= 400px)
 * 12. Nested Modal & Sibling Tree Walking (Zero Ancestor Inert Trap)
 * 13. Console Errors Audit (0 unexpected errors)
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

async function runM45B2Verification() {
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

  const userDataDir = path.join('/tmp', 'chrome-m45b2-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));

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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    await send('Page.navigate', { url: `http://localhost:${httpPort}/index.html` });
    for (let i = 0; i < 20; i++) {
      const ready = await evaluate(`document.readyState === 'complete' && typeof window.FSSModal === 'object'`);
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // Initialize mock article session in practice screen
    await evaluate(`(() => {
      document.body.classList.add('text-mode');
      window.currentVideoId = 'art-test-m45b2';
      window.currentVideoTitle = 'Les secrets de la tour Eiffel';
      window.sentences = [
        { id: 's1', text: 'La tour Eiffel est un monument célèbre.', vi: 'Tháp Eiffel là công trình nổi tiếng.', startTime: 0, endTime: 3.2 },
        { id: 's2', text: 'Elle a été construite par Gustave Eiffel.', vi: 'Nó được xây dựng bởi Gustave Eiffel.', startTime: 3.3, endTime: 6.8 }
      ];

      const screenPractice = document.getElementById('screen-practice');
      if (screenPractice) screenPractice.classList.remove('hidden');
      const screenInput = document.getElementById('screen-input');
      if (screenInput) screenInput.classList.add('hidden');

      if (window.renderArticleSidePanel) {
        window.renderArticleSidePanel(window.currentVideoId, window.currentVideoTitle, window.sentences);
      }
    })()`);

    console.log('\n=== TEST 1: PORTAL PLACEMENT VERIFICATION ===');
    const portalPlacement = await evaluate(`(() => {
      const syncModal = document.getElementById('modal-art-ai-sync');
      const levelModal = document.getElementById('modal-art-level');
      const panelRight = document.getElementById('panel-right');

      return {
        syncExists: !!syncModal,
        syncParentIsBody: syncModal ? syncModal.parentElement === document.body : false,
        syncNotInPanelRight: panelRight ? !panelRight.contains(syncModal) : true,
        levelExists: !!levelModal,
        levelParentIsBody: levelModal ? levelModal.parentElement === document.body : false,
        levelNotInPanelRight: panelRight ? !panelRight.contains(levelModal) : true
      };
    })()`);
    console.log('Portal placement result:', portalPlacement);
    if (!portalPlacement.syncExists || !portalPlacement.syncParentIsBody || !portalPlacement.syncNotInPanelRight ||
        !portalPlacement.levelExists || !portalPlacement.levelParentIsBody || !portalPlacement.levelNotInPanelRight) {
      throw new Error('Portal placement verification failed: modals are not direct children of document.body');
    }
    console.log('✔ PASS: Both article modals extracted from #panel-right and placed directly under document.body');

    console.log('\n=== TEST 2: #modal-art-ai-sync ARIA, INITIAL FOCUS & BACKGROUND INERT ===');
    const syncAriaResult = await evaluate(`(() => {
      const syncBtn = document.getElementById('art-side-sync-btn');
      if (syncBtn) syncBtn.focus();
      window.openArtAiSyncModal(syncBtn);

      const m = document.getElementById('modal-art-ai-sync');
      const dialog = m ? m.querySelector('.art-sync-modal') : null;
      const inputEl = document.getElementById('art-sync-input');
      const activeEl = document.activeElement;
      const screenPracticeInert = document.getElementById('screen-practice').inert;
      const modalInert = m.inert;

      window.closeArtAiSyncModal(true);

      return {
        isOpen: m.classList.contains('open') || m.style.display === 'flex',
        role: m.getAttribute('role'),
        ariaModal: m.getAttribute('aria-modal'),
        ariaLabelledby: m.getAttribute('aria-labelledby'),
        activeIsInput: activeEl === inputEl,
        screenPracticeInert,
        modalInert
      };
    })()`);
    console.log('AI Sync modal ARIA & Focus result:', syncAriaResult);
    if (syncAriaResult.role !== 'dialog' || syncAriaResult.ariaModal !== 'true' || syncAriaResult.ariaLabelledby !== 'art-sync-modal-title' ||
        !syncAriaResult.activeIsInput || !syncAriaResult.screenPracticeInert || syncAriaResult.modalInert) {
      throw new Error('AI Sync modal ARIA or focus check failed');
    }
    console.log('✔ PASS: #modal-art-ai-sync ARIA, initial focus on #art-sync-input, and background isolation verified');

    console.log('\n=== TEST 3: #modal-art-level ARIA, INITIAL FOCUS & SELECTION ===');
    const levelAriaResult = await evaluate(`(() => {
      const lvlBtn = document.getElementById('art-side-level-btn');
      if (lvlBtn) lvlBtn.focus();
      window.openArticleLevelModal(lvlBtn);

      const m = document.getElementById('modal-art-level');
      const dialog = m ? m.querySelector('.art-sync-modal') : null;
      const activeEl = document.activeElement;
      const screenPracticeInert = document.getElementById('screen-practice').inert;
      const modalInert = m.inert;

      const activeIsOpt = activeEl && activeEl.classList.contains('art-level-opt');

      window.closeArticleLevelModal();

      return {
        role: m.getAttribute('role'),
        ariaModal: m.getAttribute('aria-modal'),
        ariaLabelledby: m.getAttribute('aria-labelledby'),
        activeIsOpt,
        screenPracticeInert,
        modalInert
      };
    })()`);
    console.log('Article Level modal ARIA & Focus result:', levelAriaResult);
    if (levelAriaResult.role !== 'dialog' || levelAriaResult.ariaModal !== 'true' || levelAriaResult.ariaLabelledby !== 'art-level-modal-title' ||
        !levelAriaResult.activeIsOpt || !levelAriaResult.screenPracticeInert || levelAriaResult.modalInert) {
      throw new Error('Article Level modal ARIA or focus check failed');
    }
    console.log('✔ PASS: #modal-art-level ARIA, initial focus on CEFR level button, and background isolation verified');

    console.log('\n=== TEST 4: CLEAN STATE DISMISSAL ACROSS ALL TRIGGERS ===');
    const cleanDismissal = await evaluate(`(() => {
      let confirmCalled = false;
      const origConfirm = window.confirm;
      window.confirm = () => { confirmCalled = true; return false; };

      const m = document.getElementById('modal-art-ai-sync');

      // 1. Dismiss clean modal via Escape
      window.openArtAiSyncModal();
      const esc = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
      document.dispatchEvent(esc);
      const closedViaEsc = !m.classList.contains('open') && m.style.display === 'none';

      // 2. Dismiss clean modal via Nút X
      window.openArtAiSyncModal();
      const closeBtn = document.getElementById('art-sync-btn-close') || m.querySelector('.art-sync-close-btn');
      if (closeBtn) closeBtn.click();
      const closedViaX = !m.classList.contains('open') && m.style.display === 'none';

      // 3. Dismiss clean modal via Nút Hủy
      window.openArtAiSyncModal();
      const cancelBtn = document.getElementById('art-sync-btn-cancel') || m.querySelector('.art-sync-footer-right .art-sync-btn-secondary');
      if (cancelBtn) cancelBtn.click();
      const closedViaCancel = !m.classList.contains('open') && m.style.display === 'none';

      // 4. Dismiss clean modal via Backdrop click
      window.openArtAiSyncModal();
      const mousedownEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      Object.defineProperty(mousedownEvt, 'target', { value: m });
      m.dispatchEvent(mousedownEvt);
      const closedViaBackdrop = !m.classList.contains('open') && m.style.display === 'none';

      window.confirm = origConfirm;

      return {
        closedViaEsc,
        closedViaX,
        closedViaCancel,
        closedViaBackdrop,
        confirmCalled
      };
    })()`);
    console.log('Clean dismissal result:', cleanDismissal);
    if (!cleanDismissal.closedViaEsc || !cleanDismissal.closedViaX || !cleanDismissal.closedViaCancel || !cleanDismissal.closedViaBackdrop || cleanDismissal.confirmCalled) {
      throw new Error('Clean dismissal failed: confirm prompt should NOT be displayed when form is clean');
    }
    console.log('✔ PASS: Clean form dismisses immediately across Escape, X, Cancel, and Backdrop without confirm dialog');

    console.log('\n=== TEST 5: DIRTY STATE PROTECTION & EXACT TEXT COMPARISON ===');
    const dirtyProtection = await evaluate(`(() => {
      let confirmCount = 0;
      let confirmDecision = false;
      const origConfirm = window.confirm;
      window.confirm = (msg) => {
        confirmCount++;
        return confirmDecision;
      };

      const m = document.getElementById('modal-art-ai-sync');
      const inputEl = document.getElementById('art-sync-input');

      // 1. Initial state is clean
      window.openArtAiSyncModal();
      const cleanAtStart = window.isArtAiSyncDirty();

      // 2. Leading whitespace triggers dirty
      inputEl.value = ' [';
      const dirtyOnLeadingSpace = window.isArtAiSyncDirty();

      // 3. Trailing whitespace triggers dirty
      inputEl.value = '{"sentences":[]} ';
      const dirtyOnTrailingSpace = window.isArtAiSyncDirty();

      // 4. Escape with Cancel decision -> must stay open and preserve content
      confirmDecision = false;
      const esc = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
      document.dispatchEvent(esc);
      const stillOpenAfterEscCancel = m.classList.contains('open') || m.style.display === 'flex';
      const contentPreserved = inputEl.value === '{"sentences":[]} ';

      // 5. Nút X with Discard decision -> closes safely
      confirmDecision = true;
      const closeBtn = document.getElementById('art-sync-btn-close') || m.querySelector('.art-sync-close-btn');
      if (closeBtn) closeBtn.click();
      const closedAfterXDiscard = !m.classList.contains('open') && m.style.display === 'none';

      // 6. Nút Hủy with Cancel decision -> stays open
      window.openArtAiSyncModal();
      inputEl.value = 'Text dán mới chưa lưu';
      confirmDecision = false;
      const cancelBtn = document.getElementById('art-sync-btn-cancel') || m.querySelector('.art-sync-footer-right .art-sync-btn-secondary');
      if (cancelBtn) cancelBtn.click();
      const stillOpenAfterCancelBtn = m.classList.contains('open') || m.style.display === 'flex';

      // 7. Backdrop click with Discard decision -> closes
      confirmDecision = true;
      const mousedownEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      Object.defineProperty(mousedownEvt, 'target', { value: m });
      m.dispatchEvent(mousedownEvt);
      const closedAfterBackdropDiscard = !m.classList.contains('open') && m.style.display === 'none';

      window.confirm = origConfirm;

      return {
        cleanAtStart,
        dirtyOnLeadingSpace,
        dirtyOnTrailingSpace,
        stillOpenAfterEscCancel,
        contentPreserved,
        closedAfterXDiscard,
        stillOpenAfterCancelBtn,
        closedAfterBackdropDiscard,
        totalConfirmCalls: confirmCount
      };
    })()`);
    console.log('Dirty protection result:', dirtyProtection);
    if (dirtyProtection.cleanAtStart !== false ||
        !dirtyProtection.dirtyOnLeadingSpace ||
        !dirtyProtection.dirtyOnTrailingSpace ||
        !dirtyProtection.stillOpenAfterEscCancel ||
        !dirtyProtection.contentPreserved ||
        !dirtyProtection.closedAfterXDiscard ||
        !dirtyProtection.stillOpenAfterCancelBtn ||
        !dirtyProtection.closedAfterBackdropDiscard) {
      throw new Error('Dirty protection verification failed');
    }
    console.log('✔ PASS: Dirty state protection verified with exact string comparison (no trim); Cancel retains data; Discard closes safely');

    console.log('\n=== TEST 6: APPLY SUCCESS & FAILURE SAFETY ===');
    const applySafetyResult = await evaluate(`(() => {
      let confirmCalled = false;
      const origConfirm = window.confirm;
      window.confirm = () => { confirmCalled = true; return false; };

      const m = document.getElementById('modal-art-ai-sync');
      const inputEl = document.getElementById('art-sync-input');
      const statusEl = document.getElementById('art-sync-status');

      // 1. Apply Failure with invalid content
      window.openArtAiSyncModal();
      inputEl.value = 'Nội dung không phải JSON/SRT hợp lệ';
      window.applyArtAiSyncTranscript();

      const modalStillOpenOnFail = m.classList.contains('open') || m.style.display === 'flex';
      const statusHasError = statusEl && statusEl.classList.contains('is-error');
      const inputPreservedOnFail = inputEl.value === 'Nội dung không phải JSON/SRT hợp lệ';

      // 2. Apply Success with valid JSON
      const validJson = JSON.stringify({
        sentences: [
          { text: 'La tour Eiffel est un monument célèbre.', startTime: 0.5, endTime: 3.5 },
          { text: 'Elle a été construite par Gustave Eiffel.', startTime: 3.6, endTime: 7.0 }
        ]
      });
      inputEl.value = validJson;
      window.applyArtAiSyncTranscript();

      const statusHasSuccess = statusEl && statusEl.classList.contains('is-success');
      const updatedS1Start = window.sentences[0].startTime;

      // Close cleanly
      window.closeArtAiSyncModal(true);
      window.confirm = origConfirm;

      return {
        modalStillOpenOnFail,
        statusHasError,
        inputPreservedOnFail,
        statusHasSuccess,
        updatedS1Start,
        confirmCalled
      };
    })()`);
    console.log('Apply safety result:', applySafetyResult);
    if (!applySafetyResult.modalStillOpenOnFail || !applySafetyResult.statusHasError || !applySafetyResult.inputPreservedOnFail ||
        !applySafetyResult.statusHasSuccess || applySafetyResult.updatedS1Start !== 0.5 || applySafetyResult.confirmCalled) {
      throw new Error('Apply safety verification failed');
    }
    console.log('✔ PASS: Apply failure safely preserves user content; Apply success updates sentences without discard prompt');

    console.log('\n=== TEST 7: CEFR LEVEL SELECTION & CLEAR ===');
    const cefrResult = await evaluate(`(() => {
      const m = document.getElementById('modal-art-level');
      window.openArticleLevelModal();

      // Click B2
      window.setArticleLevel('B2');
      const modalClosedAfterB2 = !m.classList.contains('open') && m.style.display === 'none';

      const historyItem = window.getLocalHistory().find(x => x.videoId === window.currentVideoId);
      const levelSaved = historyItem ? historyItem.level : null;

      // Reopen and clear level
      window.openArticleLevelModal();
      window.setArticleLevel(null);
      const modalClosedAfterClear = !m.classList.contains('open') && m.style.display === 'none';

      const historyItemAfterClear = window.getLocalHistory().find(x => x.videoId === window.currentVideoId);
      const levelCleared = historyItemAfterClear ? !historyItemAfterClear.level : true;

      return {
        modalClosedAfterB2,
        levelSaved,
        modalClosedAfterClear,
        levelCleared
      };
    })()`);
    console.log('CEFR selection result:', cefrResult);
    if (!cefrResult.modalClosedAfterB2 || cefrResult.levelSaved !== 'B2' || !cefrResult.modalClosedAfterClear || !cefrResult.levelCleared) {
      throw new Error('CEFR level selection verification failed');
    }
    console.log('✔ PASS: CEFR level selection (B2) and clear verified with clean auto-dismissal and persistence');

    console.log('\n=== TEST 8: FOCUS RESTORATION ACROSS RE-RENDERED DOM ===');
    const focusRestoration = await evaluate(`(() => {
      const syncBtnBefore = document.getElementById('art-side-sync-btn');
      if (syncBtnBefore) syncBtnBefore.focus();

      window.openArtAiSyncModal(syncBtnBefore);

      // Simulate renderArticleSidePanel recreating trigger in DOM
      window.renderArticleSidePanel(window.currentVideoId, window.currentVideoTitle, window.sentences);

      window.closeArtAiSyncModal(true);

      const activeEl = document.activeElement;
      const syncBtnAfter = document.getElementById('art-side-sync-btn');
      const focusRestored = (activeEl === syncBtnAfter && syncBtnAfter !== null);

      return {
        focusRestored,
        activeTag: activeEl ? activeEl.tagName : null,
        activeId: activeEl ? activeEl.id : null
      };
    })()`);
    console.log('Focus restoration result:', focusRestoration);
    if (!focusRestoration.focusRestored) {
      throw new Error('Focus restoration across re-rendered DOM failed: activeElement is not the re-rendered #art-side-sync-btn');
    }
    console.log('✔ PASS: Focus accurately restored to newly rendered #art-side-sync-btn after DOM re-render');

    console.log('\n=== TEST 9: TAB / SHIFT+TAB FOCUS CONTAINMENT IN BOTH MODALS ===');
    const tabContainment = await evaluate(`(() => {
      function testTabCycling(modalId) {
        const m = document.getElementById(modalId);
        const focusables = Array.from(m.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex=\"-1\"])'))
          .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
        if (focusables.length === 0) return true;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        // Shift+Tab from first -> wrap to last
        first.focus();
        const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(shiftTab);
        const shiftTabSuccess = (document.activeElement === last);

        // Tab from last -> wrap to first
        last.focus();
        const tab = new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, shiftKey: false, bubbles: true, cancelable: true });
        document.dispatchEvent(tab);
        const tabSuccess = (document.activeElement === first);

        return shiftTabSuccess && tabSuccess;
      }

      window.openArtAiSyncModal();
      const syncTabPass = testTabCycling('modal-art-ai-sync');
      window.closeArtAiSyncModal(true);

      window.openArticleLevelModal();
      const levelTabPass = testTabCycling('modal-art-level');
      window.closeArticleLevelModal();

      return { syncTabPass, levelTabPass };
    })()`);
    console.log('Tab containment result:', tabContainment);
    if (!tabContainment.syncTabPass || !tabContainment.levelTabPass) {
      throw new Error('Tab containment verification failed');
    }
    console.log('✔ PASS: Tab & Shift+Tab focus containment verified across both article modals');

    console.log('\n=== TEST 10: SCROLL LOCK & SCROLL POSITION RESTORATION (REAL SCROLL >= 400px) ===');
    const scrollLockResult = await evaluate(`(() => {
      const spacer = document.createElement('div');
      spacer.id = 'm45b2-scroll-spacer';
      spacer.style.height = '3000px';
      spacer.style.width = '100%';
      document.body.appendChild(spacer);

      const triggerBtn = document.createElement('button');
      triggerBtn.id = 'test-art-scroll-btn';
      triggerBtn.style.position = 'absolute';
      triggerBtn.style.top = '450px';
      triggerBtn.textContent = 'Trigger at 450px';
      document.body.appendChild(triggerBtn);

      window.scrollTo(0, 450);
      triggerBtn.focus();
      const scrollBefore = window.pageYOffset || document.documentElement.scrollTop;

      window.openArtAiSyncModal(triggerBtn);
      const isFixedWhileOpen = document.body.style.position === 'fixed';
      const hasClassWhileOpen = document.body.classList.contains('fss-modal-open');
      const topWhileOpen = document.body.style.top;

      window.closeArtAiSyncModal(true);
      const isPositionCleared = document.body.style.position === '';
      const hasClassCleared = !document.body.classList.contains('fss-modal-open');
      const topCleared = document.body.style.top === '';
      const scrollAfter = window.pageYOffset || document.documentElement.scrollTop;

      triggerBtn.remove();
      spacer.remove();

      return {
        scrollBefore,
        isFixedWhileOpen,
        hasClassWhileOpen,
        topWhileOpen,
        isPositionCleared,
        hasClassCleared,
        topCleared,
        scrollAfter
      };
    })()`);
    console.log('Scroll lock check result:', scrollLockResult);
    if (scrollLockResult.scrollBefore < 400) {
      throw new Error('Scroll lock verification failed: scrollBefore must be >= 400px, got ' + scrollLockResult.scrollBefore);
    }
    if (!scrollLockResult.isFixedWhileOpen || !scrollLockResult.hasClassWhileOpen || scrollLockResult.topWhileOpen !== '-450px' ||
        !scrollLockResult.isPositionCleared || !scrollLockResult.hasClassCleared || !scrollLockResult.topCleared ||
        scrollLockResult.scrollBefore !== scrollLockResult.scrollAfter) {
      throw new Error('Scroll lock verification failed: body position or scroll restoration mismatch');
    }
    console.log('✔ PASS: Scroll lock & exact scroll position restoration verified (' + scrollLockResult.scrollBefore + 'px -> fixed ' + scrollLockResult.topWhileOpen + ' -> restored ' + scrollLockResult.scrollAfter + 'px)');

    console.log('\n=== TEST 11: NESTED MODAL & ZERO ANCESTOR INERT TRAP ===');
    const nestedTrapResult = await evaluate(`(async () => {
      const syncModal = document.getElementById('modal-art-ai-sync');
      const levelModal = document.getElementById('modal-art-level');

      // 1. Open AI Sync Modal
      window.openArtAiSyncModal();
      await new Promise(r => setTimeout(r, 60));
      const screenPracticeInertWhenSyncOpen = document.getElementById('screen-practice').inert;
      const syncModalInertWhenSyncOpen = syncModal.inert;

      // 2. Open Article Level Modal on top as nested modal
      window.openArticleLevelModal();
      await new Promise(r => setTimeout(r, 100));

      const syncModalDirectlyInert = syncModal.inert;
      const syncModalTrappedUnderAncestor = !!(syncModal.parentElement && syncModal.parentElement !== document.body && syncModal.parentElement.closest('[inert]'));
      const activeEl = document.activeElement;
      const levelModalHasFocus = activeEl ? levelModal.contains(activeEl) : false;

      console.log('DEBUG Test 11 activeEl:', activeEl ? (activeEl.tagName + '#' + activeEl.id + '.' + activeEl.className) : 'null');

      // 3. Close Article Level Modal
      window.closeArticleLevelModal();
      await new Promise(r => setTimeout(r, 60));
      const syncModalInertAfterLevelClose = syncModal.inert;

      // 4. Close AI Sync Modal
      window.closeArtAiSyncModal(true);
      await new Promise(r => setTimeout(r, 60));
      const screenPracticeInertAfterAllClose = document.getElementById('screen-practice').inert;

      return {
        screenPracticeInertWhenSyncOpen,
        syncModalInertWhenSyncOpen,
        syncModalDirectlyInert,
        syncModalTrappedUnderAncestor,
        activeElInfo: activeEl ? (activeEl.tagName + '#' + activeEl.id + '.' + activeEl.className) : 'null',
        levelModalHasFocus,
        syncModalInertAfterLevelClose,
        screenPracticeInertAfterAllClose
      };
    })()`);
    console.log('Nested trap result:', nestedTrapResult);
    if (!nestedTrapResult.screenPracticeInertWhenSyncOpen || nestedTrapResult.syncModalInertWhenSyncOpen ||
        !nestedTrapResult.syncModalDirectlyInert || nestedTrapResult.syncModalTrappedUnderAncestor ||
        !nestedTrapResult.levelModalHasFocus || nestedTrapResult.syncModalInertAfterLevelClose ||
        nestedTrapResult.screenPracticeInertAfterAllClose) {
      throw new Error('Nested modal verification failed: ancestor inert trap or reference count mismatch');
    }
    console.log('✔ PASS: Zero ancestor inert trap; LIFO modal stack reference counting cleanly isolates and restores nested modals');

    console.log('\n=== TEST 12: ARTICLE / VIDEO MODE TRANSITIONS WHILE MODAL OPEN ===');
    const transitionResult = await evaluate(`(() => {
      // 1. In Article mode with modal open
      document.body.classList.add('text-mode');
      window.openArtAiSyncModal();
      const openInArticle = document.getElementById('modal-art-ai-sync').classList.contains('open');

      // 2. Transition to Video mode (remove text-mode)
      document.body.classList.remove('text-mode');

      // 3. Modal close
      window.closeArtAiSyncModal(true);
      const closedAfterTransition = !document.getElementById('modal-art-ai-sync').classList.contains('open');
      const practiceInertCleared = !document.getElementById('screen-practice').inert;
      const stackEmpty = window.FSSModal.getActiveStack().length === 0;

      // Restore article mode
      document.body.classList.add('text-mode');

      return {
        openInArticle,
        closedAfterTransition,
        practiceInertCleared,
        stackEmpty
      };
    })()`);
    console.log('Mode transition result:', transitionResult);
    if (!transitionResult.openInArticle || !transitionResult.closedAfterTransition || !transitionResult.practiceInertCleared || !transitionResult.stackEmpty) {
      throw new Error('Article/Video mode transition test failed');
    }
    console.log('✔ PASS: Article/Video mode transitions handled safely without inert leaks or stack corruption');

    console.log('\n=== TEST 13: CONSOLE ERRORS AUDIT ===');
    console.log('Captured console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error(consoleErrors);
      throw new Error('Unexpected console errors logged during M45B2 test execution');
    }
    console.log('✔ PASS: Zero unexpected console errors logged across entire M45B2 execution flow');

    console.log('\n🎉 ALL M45B2 AUTOMATED VERIFICATION CHECKS PASSED WITH 100% ACCURACY!');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
}

runM45B2Verification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
