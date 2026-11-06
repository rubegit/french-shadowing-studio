'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');
const codeVocabPractice = fs.readFileSync(path.join(__dirname, '../js/vocab-practice.js'), 'utf8');

function createEnv(initialVocab = []) {
  const elements = {};
  function createDummyEl(id) {
    return {
      id,
      style: { setProperty: () => {}, display: '' },
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      setAttribute: () => {},
      getAttribute: () => '',
      removeAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      innerHTML: '',
      textContent: '',
      focus: () => {}
    };
  }

  function getEl(id) {
    if (!elements[id]) elements[id] = createDummyEl(id);
    return elements[id];
  }

  const store = {
    shadowing_saved_vocab_v1: JSON.stringify(initialVocab)
  };

  const mockGlobal = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
      FrenchMorphology: FrenchMorphology,
      getVocab: () => JSON.parse(store.shadowing_saved_vocab_v1 || '[]'),
      setVocab: (list) => { store.shadowing_saved_vocab_v1 = JSON.stringify(list); return true; }
    },
    document: {
      getElementById: (id) => getEl(id),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => createDummyEl('dynamic'),
      addEventListener: () => {},
      documentElement: { dataset: {} },
      readyState: 'complete',
      body: { appendChild: () => {}, removeChild: () => {} }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: {
      getItem: (k) => store[k] !== undefined ? store[k] : null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    escapeHtml: (s) => String(s || ''),
    escHtml: (s) => String(s || ''),
    formatTime: () => '0:00',
    FrenchMorphology: FrenchMorphology,
    module: { exports: {} }
  };
  Object.assign(mockGlobal.window, mockGlobal);

  // Khởi tạo 01g-vocab-list.js
  const initVocabList = new Function(
    'global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology',
    codeVocabList + '\nreturn { srsCompute, getSrs, srsIsDue };'
  );
  const vocabListFns = initVocabList(
    mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
    mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology
  );
  Object.assign(mockGlobal.window, vocabListFns);

  // Khởi tạo vocab-practice.js
  const initPractice = new Function(
    'global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology', 'module',
    codeVocabPractice + '\nreturn window.VocabPracticeHub;'
  );
  const hub = initPractice(
    mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
    mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology, mockGlobal.module
  );

  return { hub, elements, store };
}

test('M25: Sửa bẫy toán học kẹt chu kỳ nút Hard (Fixed-Point Trap)', () => {
  const { hub } = createEnv();
  const { srsCompute } = hub;

  // Ca 1: Từ có interval = 1, bấm hard phải tăng lên tối thiểu 2 (trước đây bị kẹt tại 1)
  const s1 = { ease: 2.5, interval: 1, reps: 1 };
  const res1 = srsCompute(s1, 'hard');
  assert.ok(res1.interval > 1, `Interval từ 1 phải tăng lên (thực tế: ${res1.interval})`);
  assert.equal(res1.interval, 2);

  // Ca 2: Từ có interval = 2, bấm hard phải tăng lên tối thiểu 3 (trước đây bị kẹt tại 2)
  const s2 = { ease: 2.35, interval: 2, reps: 2 };
  const res2 = srsCompute(s2, 'hard');
  assert.ok(res2.interval > 2, `Interval từ 2 phải tăng lên (thực tế: ${res2.interval})`);
  assert.equal(res2.interval, 3);

  // Ca 3: 5 lần liên tiếp bấm hard từ interval = 0, interval phải tăng liên tục
  let cur = { ease: 2.5, interval: 0, reps: 0 };
  const intervals = [];
  for (let i = 0; i < 5; i++) {
    cur = srsCompute(cur, 'hard');
    intervals.push(cur.interval);
  }
  assert.deepEqual(intervals, [1, 2, 3, 4, 5], '5 lần bấm hard phải tăng dần đều: 1, 2, 3, 4, 5');
});

test('M25: Trần tối đa max_interval = 365 ngày', () => {
  const { hub } = createEnv();
  const { srsCompute } = hub;

  let s = { ease: 2.5, interval: 0, reps: 0 };
  for (let i = 0; i < 15; i++) {
    s = srsCompute(s, 'easy');
  }

  assert.ok(s.interval <= 365, `Interval không bao giờ được vượt quá 365 ngày (thực tế: ${s.interval})`);
  assert.equal(s.interval, 365);
});

test('M25: Cơ chế Relearning & Lapses khi bấm Again', () => {
  const { hub } = createEnv();
  const { srsCompute } = hub;

  // 1. Từ đã Mastered (interval = 20, reps = 4)
  const masteredItem = { ease: 2.5, interval: 20, reps: 4, lapses: 0 };
  const againRes = srsCompute(masteredItem, 'again');

  assert.equal(againRes.reps, 0, 'Reps phải reset về 0');
  assert.equal(againRes.interval, 0, 'Interval phải reset về 0');
  assert.equal(againRes.lapses, 1, 'Lapses phải được tăng lên 1');
  assert.equal(againRes.relearning, true, 'Phải gắn cờ relearning = true');
  assert.ok(againRes.due > Date.now(), 'Due phải được đặt trong tương lai gần (~10 phút)');

  // 2. Khi hoàn thành ôn tập lại thành công (good), cờ relearning được xóa
  const recoveredRes = srsCompute(againRes, 'good');
  assert.equal(recoveredRes.relearning, false, 'Cờ relearning phải được hạ về false');
  assert.equal(recoveredRes.reps, 1);
  assert.equal(recoveredRes.interval, 1);
});

test('M25: deduplicateVocabItems gộp SRS bảo toàn reps cao nhất', () => {
  const { hub } = createEnv();
  const { deduplicateVocabItems } = hub;

  const rawItems = [
    {
      id: 'item_1',
      text: 'maison',
      wordVi: 'ngôi nhà',
      srs: { reps: 0, interval: 0, ease: 2.5 }
    },
    {
      id: 'item_2',
      text: 'maison',
      wordVi: 'ngôi nhà (Mastered)',
      srs: { reps: 5, interval: 50, ease: 2.5 }
    }
  ];

  const deduped = deduplicateVocabItems(rawItems);
  assert.equal(deduped.length, 1, 'Chỉ giữ 1 từ maison');
  assert.ok(deduped[0].srs, 'Phải có trường srs');
  assert.equal(deduped[0].srs.reps, 5, 'Phải bảo toàn bản ghi có reps = 5 cao nhất');
  assert.equal(deduped[0].srs.interval, 50);
});

test('M25: Phân loại 4 trạng thái Mastery minh bạch trong updateMasteryStats', () => {
  const now = Date.now();
  const testItems = [
    // 1. Mới lưu (reps = 0, chưa từng ôn)
    { id: '1', text: 'nouveau', srs: { reps: 0, interval: 0, lastReview: null, due: now - 1000 } },
    // 2. Đang củng cố (reps = 1, interval = 1)
    { id: '2', text: 'pomme', srs: { reps: 1, interval: 1, lastReview: now - 5000, due: now + 86400000 } },
    // 3. Đã ghi nhớ (Mastered: reps >= 2, interval >= 14)
    { id: '3', text: 'bonjour', srs: { reps: 3, interval: 20, lastReview: now - 10000, due: now + 86400000 } },
    // 4. Cần học lại (Relearning: reps = 0, nhưng đã có lastReview hoặc cờ relearning)
    { id: '4', text: 'merci', srs: { reps: 0, interval: 0, lastReview: now - 20000, relearning: true, due: now - 500 } }
  ];

  const { hub, elements } = createEnv(testItems);
  hub.updateMasteryStats();

  assert.equal(elements['vph-stat-new'].textContent, 1, 'Mới lưu: 1');
  assert.equal(elements['vph-stat-learning'].textContent, 1, 'Đang củng cố: 1');
  assert.equal(elements['vph-stat-mastered'].textContent, 1, 'Đã ghi nhớ: 1');
  assert.equal(elements['vph-stat-relearning'].textContent, 1, 'Cần học lại: 1');
  assert.equal(elements['vph-relearning-tag'].style.display, 'inline-flex', 'Thẻ Cần học lại phải hiển thị khi > 0');
  // Đến hạn ôn: item 1 (due < now) và item 4 (due < now)
  assert.equal(elements['vph-due-badge'].textContent, 2, 'Cần ôn: 2');
});
