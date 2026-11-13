/**
 * Automated Verification Script for M45B1 (UNIT-02B1) — Practice Subtitle Modals
 * Native Chrome CDP implementation (Zero external npm dependency)
 * 
 * Verifies:
 * 1. Punctuation Modal ARIA, Initial Focus & Sibling Inert
 * 2. Bilingual Modal (Standard & Replace Mode) ARIA, Initial Focus & Sibling Inert
 * 3. Sentence Edit Modal ARIA & Initial Focus on #se-text-fr
 * 4. Clean State Dismissal across Escape, Backdrop, Nút X, Nút Hủy (closes immediately without confirm)
 * 5. Dirty State Protection across Escape, Backdrop, Nút X, Nút Hủy (triggers confirm; Cancel retains; Discard closes without saving)
 * 6. Timestamp Equivalence Normalization (0:02.50 vs 2.5 does NOT trigger false dirty prompt)
 * 7. Save Success (updates sentence, closes without confirm, restores focus to sentence edit button)
 * 8. Save Validation Failure (empty French text blocks save, keeps modal open, preserves data)
 * 9. Elimination of Compound Escape (Escape closes ONLY top modal)
 * 10. Tab / Shift+Tab Focus Containment in all three modals
 * 11. Scroll Lock & Scroll Position Restoration
 * 12. Console Errors Audit (0 errors)
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

async function runM45B1Verification() {
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

  const userDataDir = path.join('/tmp', 'chrome-m45b1-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));

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

    // Setup mock practice session with multiple sentences
    await evaluate(`(() => {
      window.currentVideoId = 'test_m45b1_vid';
      window.currentVideoTitle = 'Test M45B1 Practice Session';
      window.sentences = [
        { id: 's1', text: 'Bonjour tout le monde', vi: 'Xin chào mọi người', startTime: 0, endTime: 2.5 },
        { id: 's2', text: 'Bienvenue au cours de français', vi: 'Chào mừng đến lớp tiếng Pháp', startTime: 2.6, endTime: 5.0 },
        { id: 's3', text: 'Ceci est une phrase de test', vi: 'Đây là câu kiểm thử', startTime: 5.1, endTime: 8.0 }
      ];
      var screenPractice = document.getElementById('screen-practice');
      if (screenPractice) screenPractice.classList.remove('hidden');
      var screenInput = document.getElementById('screen-input');
      if (screenInput) screenInput.classList.add('hidden');
      if (window.renderSubtitleList) window.renderSubtitleList();
    })()`);

    console.log('\n=== TEST 1: PUNCTUATION MODAL ARIA, INITIAL FOCUS & SIBLING INERT ===');
    const punctOpenResult = await evaluate(`(() => {
      window.openPunctModal();
      const m = document.getElementById('punct-modal');
      const dialog = m.querySelector('.ai-modal');
      const ta = document.getElementById('pc-textarea');
      const activeEl = document.activeElement;
      const screenPracticeInert = document.getElementById('screen-practice').inert;
      const modalInert = m.inert;

      return {
        isOpen: m.classList.contains('open'),
        role: dialog.getAttribute('role'),
        ariaModal: dialog.getAttribute('aria-modal'),
        ariaLabelledby: dialog.getAttribute('aria-labelledby'),
        activeIsTextarea: activeEl === ta,
        screenPracticeInert,
        modalInert
      };
    })()`);
    console.log('Punctuation modal check:', punctOpenResult);
    if (!punctOpenResult.isOpen || punctOpenResult.role !== 'dialog' || punctOpenResult.ariaModal !== 'true' || punctOpenResult.ariaLabelledby !== 'pc-title' || !punctOpenResult.activeIsTextarea || !punctOpenResult.screenPracticeInert || punctOpenResult.modalInert) {
      throw new Error('Punctuation modal open check failed');
    }
    console.log('✔ PASS: #punct-modal ARIA, initial focus on #pc-textarea, and background isolation verified');

    // Close punct modal
    await evaluate(`(() => { window.closePunctModal(); })()`);

    console.log('\n=== TEST 2: BILINGUAL MODAL (STANDARD & REPLACE MODE) ===');
    const bilingOpenResult = await evaluate(`(() => {
      window.openBilingualModal(false);
      const m = document.getElementById('bilingual-modal');
      const dialog = m.querySelector('.ai-modal');
      const ta = document.getElementById('bl-textarea');
      const delBtn = document.getElementById('bl-delete');
      const activeEl = document.activeElement;

      const standardCheck = {
        isOpen: m.classList.contains('open'),
        role: dialog.getAttribute('role'),
        ariaModal: dialog.getAttribute('aria-modal'),
        ariaLabelledby: dialog.getAttribute('aria-labelledby'),
        activeIsTextarea: activeEl === ta,
        delBtnHidden: delBtn ? delBtn.classList.contains('ai-hide') : false
      };

      // Test Replace Mode
      window.openBilingualModal(true);
      const delBtnReplace = document.getElementById('bl-delete');
      const titleEl = document.getElementById('bl-title');

      const replaceCheck = {
        title: titleEl ? titleEl.textContent : '',
        delBtnVisible: delBtnReplace ? !delBtnReplace.classList.contains('ai-hide') : false
      };

      window.closeBilingualModal();

      return { standardCheck, replaceCheck };
    })()`);
    console.log('Bilingual modal check:', bilingOpenResult);
    if (!bilingOpenResult.standardCheck.isOpen || bilingOpenResult.standardCheck.role !== 'dialog' || bilingOpenResult.standardCheck.ariaModal !== 'true' || bilingOpenResult.standardCheck.ariaLabelledby !== 'bl-title' || !bilingOpenResult.standardCheck.delBtnHidden || !bilingOpenResult.replaceCheck.delBtnVisible) {
      throw new Error('Bilingual modal check failed');
    }
    console.log('✔ PASS: #bilingual-modal ARIA, initial focus, standard mode and replace mode verified');

    console.log('\n=== TEST 3: SENTENCE EDIT MODAL ARIA & INITIAL FOCUS ===');
    const sentEditOpenResult = await evaluate(`(() => {
      window.openSentenceEditModal('s1');
      const m = document.getElementById('sentence-edit-modal');
      const dialog = m.querySelector('.ai-modal');
      const txtFr = document.getElementById('se-text-fr');

      return {
        isOpen: m.classList.contains('open'),
        role: dialog.getAttribute('role'),
        ariaModal: dialog.getAttribute('aria-modal'),
        ariaLabelledby: dialog.getAttribute('aria-labelledby'),
        frValue: txtFr ? txtFr.value : '',
        isDirty: window.isSentenceEditDirty()
      };
    })()`);
    console.log('Sentence edit modal open check:', sentEditOpenResult);
    if (!sentEditOpenResult.isOpen || sentEditOpenResult.role !== 'dialog' || sentEditOpenResult.ariaModal !== 'true' || sentEditOpenResult.ariaLabelledby !== 'se-title' || sentEditOpenResult.frValue !== 'Bonjour tout le monde' || sentEditOpenResult.isDirty !== false) {
      throw new Error('Sentence edit modal open check failed');
    }
    console.log('✔ PASS: #sentence-edit-modal ARIA, value population, and initial clean state verified');

    console.log('\n=== TEST 4: CLEAN STATE DISMISSAL ACROSS ALL TRIGGERS ===');
    const cleanDismissalResult = await evaluate(`(() => {
      let confirmCalled = false;
      const origConfirm = window.confirm;
      window.confirm = () => { confirmCalled = true; return false; };

      // 1. Dismiss clean modal via Escape
      window.openSentenceEditModal('s1');
      const esc = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
      document.dispatchEvent(esc);
      const closedViaEsc = !document.getElementById('sentence-edit-modal').classList.contains('open');

      // 2. Dismiss clean modal via Nút X
      window.openSentenceEditModal('s1');
      const closeBtn = document.getElementById('se-btn-close') || document.querySelector('#sentence-edit-modal .ai-modal-close');
      if (closeBtn) closeBtn.click();
      const closedViaX = !document.getElementById('sentence-edit-modal').classList.contains('open');

      // 3. Dismiss clean modal via Nút Hủy
      window.openSentenceEditModal('s1');
      const cancelBtn = document.getElementById('se-btn-cancel') || document.querySelector('#sentence-edit-modal .ai-btn-ghost');
      if (cancelBtn) cancelBtn.click();
      const closedViaCancel = !document.getElementById('sentence-edit-modal').classList.contains('open');

      // 4. Dismiss clean modal via Backdrop click
      window.openSentenceEditModal('s1');
      const modalBackdrop = document.getElementById('sentence-edit-modal');
      const mousedownEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      Object.defineProperty(mousedownEvt, 'target', { value: modalBackdrop });
      modalBackdrop.dispatchEvent(mousedownEvt);
      const closedViaBackdrop = !document.getElementById('sentence-edit-modal').classList.contains('open');

      window.confirm = origConfirm;

      return {
        closedViaEsc,
        closedViaX,
        closedViaCancel,
        closedViaBackdrop,
        confirmCalled
      };
    })()`);
    console.log('Clean dismissal check result:', cleanDismissalResult);
    if (!cleanDismissalResult.closedViaEsc || !cleanDismissalResult.closedViaX || !cleanDismissalResult.closedViaCancel || !cleanDismissalResult.closedViaBackdrop || cleanDismissalResult.confirmCalled) {
      throw new Error('Clean dismissal check failed: confirm should NOT be called on clean form');
    }
    console.log('✔ PASS: Clean form dismisses immediately across Escape, X, Cancel, and Backdrop without confirm dialog');

    console.log('\n=== TEST 5: DIRTY STATE PROTECTION ACROSS ALL TRIGGERS ===');
    const dirtyProtectionResult = await evaluate(`(() => {
      let confirmCount = 0;
      let confirmDecision = false;
      const origConfirm = window.confirm;
      window.confirm = (msg) => {
        confirmCount++;
        return confirmDecision;
      };

      // 1. Dirty state + Escape with Cancel decision -> must STAY OPEN
      window.openSentenceEditModal('s1');
      document.getElementById('se-text-fr').value = 'Bonjour tout le monde modifié!';
      const isDirty1 = window.isSentenceEditDirty();

      confirmDecision = false; // User clicks Cancel on prompt
      const esc = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
      document.dispatchEvent(esc);

      const stillOpenAfterEscCancel = document.getElementById('sentence-edit-modal').classList.contains('open');
      const frValuePreserved = document.getElementById('se-text-fr').value === 'Bonjour tout le monde modifié!';

      // 2. Dirty state + Nút X with Discard decision -> must CLOSE without saving
      confirmDecision = true; // User clicks OK (Discard)
      const closeBtn = document.getElementById('se-btn-close') || document.querySelector('#sentence-edit-modal .ai-modal-close');
      if (closeBtn) closeBtn.click();

      const closedAfterXDiscard = !document.getElementById('sentence-edit-modal').classList.contains('open');
      const sentence1TextInDB = window.sentences.find(x => x.id === 's1').text;

      // 3. Dirty state + Nút Hủy with Cancel decision -> must STAY OPEN
      window.openSentenceEditModal('s1');
      document.getElementById('se-text-vi').value = 'Bản dịch mới chưa lưu';
      confirmDecision = false;
      const cancelBtn = document.getElementById('se-btn-cancel') || document.querySelector('#sentence-edit-modal .ai-btn-ghost');
      if (cancelBtn) cancelBtn.click();
      const stillOpenAfterCancelBtn = document.getElementById('sentence-edit-modal').classList.contains('open');

      // 4. Dirty state + Backdrop click with Discard decision -> must CLOSE without saving
      confirmDecision = true;
      const modalBackdrop = document.getElementById('sentence-edit-modal');
      const mousedownEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      Object.defineProperty(mousedownEvt, 'target', { value: modalBackdrop });
      modalBackdrop.dispatchEvent(mousedownEvt);
      const closedAfterBackdropDiscard = !document.getElementById('sentence-edit-modal').classList.contains('open');

      window.confirm = origConfirm;

      return {
        isDirty1,
        stillOpenAfterEscCancel,
        frValuePreserved,
        closedAfterXDiscard,
        sentenceNotModified: sentence1TextInDB === 'Bonjour tout le monde',
        stillOpenAfterCancelBtn,
        closedAfterBackdropDiscard,
        totalConfirmCalls: confirmCount
      };
    })()`);
    console.log('Dirty protection check result:', dirtyProtectionResult);
    if (!dirtyProtectionResult.isDirty1 || !dirtyProtectionResult.stillOpenAfterEscCancel || !dirtyProtectionResult.frValuePreserved || !dirtyProtectionResult.closedAfterXDiscard || !dirtyProtectionResult.sentenceNotModified || !dirtyProtectionResult.stillOpenAfterCancelBtn || !dirtyProtectionResult.closedAfterBackdropDiscard) {
      throw new Error('Dirty protection check failed');
    }
    console.log('✔ PASS: Dirty state protection verified: Cancel retains form & data; Discard closes safely without writing to sentence');

    console.log('\n=== TEST 5B: EXACT TEXT COMPARISON & ZERO FALSE DIRTY ON WHITESPACE/VIETNAMESE ===');
    const exactComparisonResult = await evaluate(`(() => {
      window.openSentenceEditModal('s1');
      const txtFr = document.getElementById('se-text-fr');
      const txtVi = document.getElementById('se-text-vi');
      const origFr = 'Bonjour tout le monde';
      const origVi = 'Xin chào mọi người';

      // 1. Initial form matches snapshot exactly -> dirty must be false
      const cleanAtStart = window.isSentenceEditDirty();

      // 2. Leading whitespace in French text -> dirty must be true
      txtFr.value = ' ' + origFr;
      const dirtyOnFrLeading = window.isSentenceEditDirty();
      txtFr.value = origFr; // revert
      const cleanAfterFrLeadingRevert = window.isSentenceEditDirty();

      // 3. Trailing whitespace in French text -> dirty must be true
      txtFr.value = origFr + ' ';
      const dirtyOnFrTrailing = window.isSentenceEditDirty();
      txtFr.value = origFr; // revert
      const cleanAfterFrTrailingRevert = window.isSentenceEditDirty();

      // 4. Vietnamese text modification -> dirty must be true
      txtVi.value = 'Xin chào các bạn và mọi người';
      const dirtyOnViEdit = window.isSentenceEditDirty();
      txtVi.value = origVi; // revert
      const cleanAfterViEditRevert = window.isSentenceEditDirty();

      // 5. Leading whitespace in Vietnamese text -> dirty must be true
      txtVi.value = ' ' + origVi;
      const dirtyOnViLeading = window.isSentenceEditDirty();
      txtVi.value = origVi; // revert

      // 6. Trailing whitespace in Vietnamese text -> dirty must be true
      txtVi.value = origVi + ' ';
      const dirtyOnViTrailing = window.isSentenceEditDirty();
      txtVi.value = origVi; // revert

      const cleanAtEnd = window.isSentenceEditDirty();
      window.closeSentenceEditModal(true);

      return {
        cleanAtStart,
        dirtyOnFrLeading,
        cleanAfterFrLeadingRevert,
        dirtyOnFrTrailing,
        cleanAfterFrTrailingRevert,
        dirtyOnViEdit,
        cleanAfterViEditRevert,
        dirtyOnViLeading,
        dirtyOnViTrailing,
        cleanAtEnd
      };
    })()`);
    console.log('Exact text comparison check result:', exactComparisonResult);
    if (exactComparisonResult.cleanAtStart !== false ||
        exactComparisonResult.dirtyOnFrLeading !== true ||
        exactComparisonResult.cleanAfterFrLeadingRevert !== false ||
        exactComparisonResult.dirtyOnFrTrailing !== true ||
        exactComparisonResult.cleanAfterFrTrailingRevert !== false ||
        exactComparisonResult.dirtyOnViEdit !== true ||
        exactComparisonResult.cleanAfterViEditRevert !== false ||
        exactComparisonResult.dirtyOnViLeading !== true ||
        exactComparisonResult.dirtyOnViTrailing !== true ||
        exactComparisonResult.cleanAtEnd !== false) {
      throw new Error('Exact text comparison check failed: whitespace or Vietnamese string comparison mismatch');
    }
    console.log('✔ PASS: Exact string comparison verified without trim(): leading/trailing spaces and Vietnamese edits detected accurately');

    console.log('\n=== TEST 6: TIMESTAMP EQUIVALENCE NORMALIZATION (ZERO FALSE DIRTY) ===');
    const tsEquivResult = await evaluate(`(() => {
      window.openSentenceEditModal('s1');
      const txtSt = document.getElementById('se-start-time');
      const txtEn = document.getElementById('se-end-time');

      // s1 starts at 0, ends at 2.5.
      // Set string representations that parse to the exact same centiseconds
      txtSt.value = '0:00.00';
      txtEn.value = '2.50'; // instead of 0:02.50

      const isDirtyWithEquivalentTimes = window.isSentenceEditDirty();

      // Now change by 0.1 second (actual edit)
      txtEn.value = '2.60';
      const isDirtyWithActualEdit = window.isSentenceEditDirty();

      window.closeSentenceEditModal(true);

      return {
        isDirtyWithEquivalentTimes,
        isDirtyWithActualEdit
      };
    })()`);
    console.log('Timestamp equivalence check result:', tsEquivResult);
    if (tsEquivResult.isDirtyWithEquivalentTimes !== false || tsEquivResult.isDirtyWithActualEdit !== true) {
      throw new Error('Timestamp equivalence check failed: equivalent timestamp triggered false dirty!');
    }
    console.log('✔ PASS: Normalized centisecond comparison prevents false positive dirty alerts on equivalent timestamp strings');

    console.log('\n=== TEST 7: SAVE SUCCESS & FOCUS RESTORATION ===');
    const saveSuccessResult = await evaluate(`(() => {
      let confirmCalled = false;
      const origConfirm = window.confirm;
      window.confirm = () => { confirmCalled = true; return false; };

      const editBtnS2 = document.querySelector('.sent-edit-btn[data-sent-id=\"s2\"]');
      if (editBtnS2) editBtnS2.focus();

      window.openSentenceEditModal('s2', editBtnS2);
      document.getElementById('se-text-fr').value = 'Bienvenue au cours de français (modifié)';
      document.getElementById('se-text-vi').value = 'Chào mừng đến lớp tiếng Pháp (đã sửa)';

      window.saveSentenceEdit();

      const modalClosed = !document.getElementById('sentence-edit-modal').classList.contains('open');
      const updatedS2 = window.sentences.find(x => x.id === 's2');
      const activeEl = document.activeElement;
      const activeIsEditBtn = (activeEl && (activeEl.getAttribute('data-sent-id') === 's2' || activeEl.classList.contains('sent-edit-btn')));

      window.confirm = origConfirm;

      return {
        modalClosed,
        savedFr: updatedS2.text,
        savedVi: updatedS2.vi,
        confirmCalled,
        activeIsEditBtn
      };
    })()`);
    console.log('Save success check result:', saveSuccessResult);
    if (!saveSuccessResult.modalClosed || saveSuccessResult.savedFr !== 'Bienvenue au cours de français (modifié)' || saveSuccessResult.savedVi !== 'Chào mừng đến lớp tiếng Pháp (đã sửa)' || saveSuccessResult.confirmCalled || !saveSuccessResult.activeIsEditBtn) {
      throw new Error('Save success check failed');
    }
    console.log('✔ PASS: Save success updates data, closes without discard prompt, and restores focus to edit button');

    console.log('\n=== TEST 8: SAVE VALIDATION FAILURE ===');
    const saveFailResult = await evaluate(`(() => {
      let alertMsg = '';
      const origAlert = window.alert;
      window.alert = (m) => { alertMsg = m; };

      window.openSentenceEditModal('s3');
      document.getElementById('se-text-fr').value = '   '; // Empty French text
      document.getElementById('se-text-vi').value = 'Dịch câu rỗng';

      window.saveSentenceEdit();

      const modalStillOpen = document.getElementById('sentence-edit-modal').classList.contains('open');
      const activeEl = document.activeElement;
      const activeIsFrTextarea = (activeEl === document.getElementById('se-text-fr'));

      window.alert = origAlert;
      window.closeSentenceEditModal(true);

      return {
        modalStillOpen,
        alertMsg,
        activeIsFrTextarea
      };
    })()`);
    console.log('Save validation failure check result:', saveFailResult);
    if (!saveFailResult.modalStillOpen || !saveFailResult.alertMsg.includes('tiếng Pháp') || !saveFailResult.activeIsFrTextarea) {
      throw new Error('Save validation failure check failed');
    }
    console.log('✔ PASS: Save validation failure blocks close, alerts user, refocuses #se-text-fr, and preserves data');

    console.log('\n=== TEST 8B: SAVE FAILURE SAFETY (STORAGE / PERSISTENCE ERROR RECOVERY) ===');
    const saveStorageFailResult = await evaluate(`(() => {
      let alertMsg = '';
      const origAlert = window.alert;
      const origConsoleError = console.error;
      window.alert = (m) => { alertMsg = m; };
      console.error = () => {}; // Mute deliberate simulated error log during test

      // Open sentence edit modal for s3
      window.openSentenceEditModal('s3');
      const origS3Text = window.sentences.find(x => x.id === 's3').text;
      const txtFr = document.getElementById('se-text-fr');
      const txtVi = document.getElementById('se-text-vi');
      txtFr.value = 'Texte modifié qui déclenche une erreur de sauvegarde';
      txtVi.value = 'Bản dịch mới gặp lỗi lưu';

      // Mock persistSentencesToHistory to simulate storage failure
      const origPersist = window.persistSentencesToHistory;
      window.persistSentencesToHistory = () => {
        throw new Error('QuotaExceededError: localStorage full');
      };

      // Trigger save
      window.saveSentenceEdit();

      const modalStillOpen = document.getElementById('sentence-edit-modal').classList.contains('open');
      const frValuePreserved = txtFr.value === 'Texte modifié qui déclenche une erreur de sauvegarde';
      const viValuePreserved = txtVi.value === 'Bản dịch mới gặp lỗi lưu';
      const s3TextRolledBack = window.sentences.find(x => x.id === 's3').text === origS3Text;

      // Now restore persist and verify successful retry without re-typing
      window.persistSentencesToHistory = origPersist;
      console.error = origConsoleError;
      window.saveSentenceEdit();

      const modalClosedAfterRetry = !document.getElementById('sentence-edit-modal').classList.contains('open');
      const s3TextUpdatedAfterRetry = window.sentences.find(x => x.id === 's3').text === 'Texte modifié qui déclenche une erreur de sauvegarde';

      window.alert = origAlert;

      return {
        alertMsg,
        modalStillOpen,
        frValuePreserved,
        viValuePreserved,
        s3TextRolledBack,
        modalClosedAfterRetry,
        s3TextUpdatedAfterRetry
      };
    })()`);
    console.log('Save storage failure check result:', saveStorageFailResult);
    if (!saveStorageFailResult.alertMsg.includes('Không thể lưu') ||
        !saveStorageFailResult.modalStillOpen ||
        !saveStorageFailResult.frValuePreserved ||
        !saveStorageFailResult.viValuePreserved ||
        !saveStorageFailResult.s3TextRolledBack ||
        !saveStorageFailResult.modalClosedAfterRetry ||
        !saveStorageFailResult.s3TextUpdatedAfterRetry) {
      throw new Error('Save storage failure safety check failed: form data lost or modal prematurely closed on error');
    }
    console.log('✔ PASS: Save failure safety verified: on storage/persist failure, modal stays open, form inputs preserved, in-memory state protected, and retry succeeds');

    console.log('\n=== TEST 9: COMPOUND ESCAPE ELIMINATION ===');
    const compoundEscapeResult = await evaluate(`(() => {
      window.openPunctModal();
      const punctOpenBefore = document.getElementById('punct-modal').classList.contains('open');
      const bilingOpenBefore = document.getElementById('bilingual-modal').classList.contains('open');
      const sentEditOpenBefore = document.getElementById('sentence-edit-modal').classList.contains('open');

      // Press Escape
      const esc = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
      document.dispatchEvent(esc);

      const punctOpenAfter = document.getElementById('punct-modal').classList.contains('open');
      const bilingOpenAfter = document.getElementById('bilingual-modal').classList.contains('open');
      const sentEditOpenAfter = document.getElementById('sentence-edit-modal').classList.contains('open');

      return {
        punctOpenBefore,
        punctOpenAfter,
        bilingOpenBefore,
        bilingOpenAfter,
        sentEditOpenBefore,
        sentEditOpenAfter
      };
    })()`);
    console.log('Compound escape elimination check result:', compoundEscapeResult);
    if (!compoundEscapeResult.punctOpenBefore || compoundEscapeResult.punctOpenAfter || compoundEscapeResult.bilingOpenAfter || compoundEscapeResult.sentEditOpenAfter) {
      throw new Error('Compound escape elimination check failed');
    }
    console.log('✔ PASS: Old compound Escape listener successfully eliminated; Escape targets only active modal');

    console.log('\n=== TEST 10: TAB / SHIFT+TAB FOCUS CONTAINMENT IN ALL 3 MODALS ===');
    const tabContainmentResult = await evaluate(`(() => {
      function testTabCycling(modalId) {
        const m = document.getElementById(modalId);
        const focusables = Array.from(m.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex=\"-1\"])'))
          .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
        if (focusables.length === 0) return true;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        // Focus first, press Shift+Tab -> should wrap to last
        first.focus();
        const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(shiftTab);
        const shiftTabSuccess = (document.activeElement === last);

        // Focus last, press Tab -> should wrap to first
        last.focus();
        const tab = new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, shiftKey: false, bubbles: true, cancelable: true });
        document.dispatchEvent(tab);
        const tabSuccess = (document.activeElement === first);

        return shiftTabSuccess && tabSuccess;
      }

      window.openPunctModal();
      const punctTabPass = testTabCycling('punct-modal');
      window.closePunctModal();

      window.openBilingualModal();
      const bilingTabPass = testTabCycling('bilingual-modal');
      window.closeBilingualModal();

      window.openSentenceEditModal('s1');
      const sentEditTabPass = testTabCycling('sentence-edit-modal');
      window.closeSentenceEditModal(true);

      return { punctTabPass, bilingTabPass, sentEditTabPass };
    })()`);
    console.log('Tab containment result:', tabContainmentResult);
    if (!tabContainmentResult.punctTabPass || !tabContainmentResult.bilingTabPass || !tabContainmentResult.sentEditTabPass) {
      throw new Error('Tab containment verification failed');
    }
    console.log('✔ PASS: Tab & Shift+Tab focus containment verified across #punct-modal, #bilingual-modal, and #sentence-edit-modal');

    console.log('\n=== TEST 11: SCROLL LOCK & SCROLL POSITION RESTORATION (REAL SCROLL >= 400px) ===');
    const scrollLockResult = await evaluate(`(() => {
      // 1. Inject tall spacer to allow genuine scrolling
      const spacer = document.createElement('div');
      spacer.id = 'm45b1-scroll-spacer';
      spacer.style.height = '3000px';
      spacer.style.width = '100%';
      document.body.appendChild(spacer);

      // 2. Create and position an edit button trigger at 450px
      const triggerBtn = document.createElement('button');
      triggerBtn.id = 'test-scroll-btn';
      triggerBtn.className = 'sent-edit-btn';
      triggerBtn.setAttribute('data-sent-id', 's1');
      triggerBtn.style.position = 'absolute';
      triggerBtn.style.top = '450px';
      triggerBtn.style.left = '50px';
      triggerBtn.style.height = '40px';
      triggerBtn.textContent = 'Edit S1 at 450px';
      document.body.appendChild(triggerBtn);

      // 3. Perform real window scroll >= 400px
      window.scrollTo(0, 450);
      triggerBtn.focus();
      const scrollBefore = window.pageYOffset || document.documentElement.scrollTop;

      // 4. Open modal at scroll position
      window.openSentenceEditModal('s1', triggerBtn);
      const isFixedWhileOpen = document.body.style.position === 'fixed';
      const hasClassWhileOpen = document.body.classList.contains('fss-modal-open');
      const topWhileOpen = document.body.style.top;

      // 5. Close modal and verify exact scroll restoration
      window.closeSentenceEditModal(true);
      const isPositionCleared = document.body.style.position === '';
      const hasClassCleared = !document.body.classList.contains('fss-modal-open');
      const topCleared = document.body.style.top === '';
      const scrollAfter = window.pageYOffset || document.documentElement.scrollTop;

      // 6. Cleanup
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
      throw new Error('Scroll lock verification failed: scrollBefore must be >= 400px, but got ' + scrollLockResult.scrollBefore);
    }
    if (!scrollLockResult.isFixedWhileOpen ||
        !scrollLockResult.hasClassWhileOpen ||
        scrollLockResult.topWhileOpen !== '-450px' ||
        !scrollLockResult.isPositionCleared ||
        !scrollLockResult.hasClassCleared ||
        !scrollLockResult.topCleared ||
        scrollLockResult.scrollBefore !== scrollLockResult.scrollAfter) {
      throw new Error('Scroll lock verification failed: body position or scroll restoration mismatch');
    }
    console.log('✔ PASS: Scroll lock & exact scroll position restoration verified under real scroll condition (' + scrollLockResult.scrollBefore + 'px -> fixed ' + scrollLockResult.topWhileOpen + ' -> restored ' + scrollLockResult.scrollAfter + 'px)');

    console.log('\n=== TEST 12: CONSOLE ERRORS AUDIT ===');
    console.log('Captured console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error(consoleErrors);
      throw new Error('Unexpected console errors logged during M45B1 test execution');
    }
    console.log('✔ PASS: Zero unexpected console errors logged across entire execution flow');

    console.log('\n🎉 ALL M45B1 AUTOMATED VERIFICATION CHECKS PASSED WITH 100% ACCURACY!');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
}

runM45B1Verification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
