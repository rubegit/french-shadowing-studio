'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');
const codeVocabPractice = fs.readFileSync(path.join(__dirname, '../js/vocab-practice.js'), 'utf8');

function createEnv(initialVocab = [], initialStorage = {}) {
  const elements = {};
  function createDummyEl(id) {
    const classes = new Set();
    return {
      id,
      style: { setProperty: () => {}, display: '' },
      classList: {
        add: (...cls) => cls.forEach(c => classes.add(c)),
        remove: (...cls) => cls.forEach(c => classes.delete(c)),
        contains: (c) => classes.has(c),
        toggle: (c, force) => {
          if (typeof force === 'boolean') {
            if (force) classes.add(c); else classes.delete(c);
            return force;
          }
          if (classes.has(c)) { classes.delete(c); return false; }
          classes.add(c); return true;
        }
      },
      setAttribute: () => {},
      getAttribute: () => '',
      removeAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      innerHTML: '',
      textContent: '',
      title: '',
      value: '',
      focus: () => {}
    };
  }

  function getEl(id) {
    if (!elements[id]) elements[id] = createDummyEl(id);
    return elements[id];
  }

  const store = Object.assign({
    shadowing_saved_vocab_v1: JSON.stringify(initialVocab)
  }, initialStorage);

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

  const initVocabList = new Function(
    'global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology',
    codeVocabList + '\nreturn { srsCompute, getSrs, srsIsDue };'
  );
  const vocabListFns = initVocabList(
    mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
    mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology
  );
  Object.assign(mockGlobal.window, vocabListFns);

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

test('M26: getDailyGoal và setDailyGoal lưu và đọc từ localStorage', () => {
  const { hub, store } = createEnv();
  const { getDailyGoal, setDailyGoal } = hub;

  // 1. Mặc định là 20 khi chưa thiết lập
  assert.equal(getDailyGoal(), 20, 'Mặc định phải là 20 từ mới / ngày');

  // 2. Thiết lập 10, 30, 50
  setDailyGoal(10);
  assert.equal(getDailyGoal(), 10);
  assert.equal(store.fss_daily_new_vocab_limit, '10');

  setDailyGoal(30);
  assert.equal(getDailyGoal(), 30);

  // 3. Thiết lập tùy chỉnh (ví dụ: 45 từ)
  setDailyGoal(45);
  assert.equal(getDailyGoal(), 45);

  // 4. Thiết lập không giới hạn ('all')
  setDailyGoal('all');
  assert.equal(getDailyGoal(), Infinity);
});

test('M26: isItemLearnedToday & countTodayNewVocab nhận diện chính xác từ mới học hôm nay', () => {
  const { hub } = createEnv();
  const { isItemLearnedToday, countTodayNewVocab } = hub;

  const now = Date.now();
  const yesterday = now - 24 * 60 * 60 * 1000;
  const todayYmd = new Date().toISOString().slice(0, 10);

  // Từ 1: Mới học hôm nay (firstLearnedAt là hôm nay)
  const itemToday1 = {
    id: 't1',
    text: 'bonjour',
    srs: { reps: 1, interval: 1, firstLearnedAt: now, lastReview: now }
  };
  assert.equal(isItemLearnedToday(itemToday1, todayYmd), true);

  // Từ 2: Đã học từ hôm qua (firstLearnedAt là hôm qua)
  const itemYesterday = {
    id: 't2',
    text: 'merci',
    srs: { reps: 2, interval: 3, firstLearnedAt: yesterday, lastReview: now }
  };
  assert.equal(isItemLearnedToday(itemYesterday, todayYmd), false, 'Từ học từ hôm qua không được tính là từ mới hôm nay');

  // Từ 3: Từ chưa từng học (reps = 0, chưa có lastReview)
  const itemUnlearned = {
    id: 't3',
    text: 'maison',
    srs: { reps: 0, interval: 0, lastReview: null }
  };
  assert.equal(isItemLearnedToday(itemUnlearned, todayYmd), false, 'Từ chưa từng học không được tính');

  // Đếm danh sách 3 từ trên -> chỉ có 1 từ mới hôm nay
  const count = countTodayNewVocab([itemToday1, itemYesterday, itemUnlearned], todayYmd);
  assert.equal(count, 1);
});

test('M26: prioritizeSessionItems - Lọc bỏ từ mới khi đã đạt chỉ tiêu hôm nay', () => {
  const { hub } = createEnv();
  const { prioritizeSessionItems } = hub;

  const now = Date.now();
  // Tạo 6 từ cần ôn tập (reps >= 1)
  const reviewItems = [1, 2, 3, 4, 5, 6].map(i => ({
    id: `rev_${i}`,
    text: `word_rev_${i}`,
    srs: { reps: i, interval: i * 2, lastReview: now - 1000, due: now - 500 }
  }));

  // Tạo 4 từ mới tinh (reps = 0, chưa từng học)
  const brandNewItems = [1, 2, 3, 4].map(i => ({
    id: `new_${i}`,
    text: `word_new_${i}`,
    srs: { reps: 0, interval: 0, lastReview: null, due: 0 }
  }));

  const allItems = [...reviewItems, ...brandNewItems];

  // Ca 1: Chưa đạt chỉ tiêu (chỉ tiêu 20, hôm nay đã học 10)
  // Phải bao gồm cả từ mới để người học đạt chỉ tiêu
  const sessionWhenNotReached = prioritizeSessionItems(allItems, 20, 10);
  const hasNewWhenNotReached = sessionWhenNotReached.some(it => it.srs.reps === 0);
  assert.equal(hasNewWhenNotReached, true, 'Khi chưa đạt chỉ tiêu, phiên học phải chứa từ mới');

  // Ca 2: ĐÃ ĐẠT CHỈ TIÊU HÔM NAY (chỉ tiêu 20, hôm nay đã học 20)
  // Khi có đủ >= 5 từ ôn tập, phải lọc bỏ toàn bộ từ mới để người học tập trung ôn tập
  const sessionWhenReached = prioritizeSessionItems(allItems, 20, 20);
  const hasNewWhenReached = sessionWhenReached.some(it => it.srs.reps === 0);
  assert.equal(hasNewWhenReached, false, 'Khi đã đạt chỉ tiêu hôm nay, phải lọc bỏ từ mới để tập trung ôn tập');
  assert.equal(sessionWhenReached.length, reviewItems.length, 'Phiên học chỉ chứa các từ cần ôn');
});

test('M26: updateMasteryStats cập nhật huy hiệu tiến độ mục tiêu hôm nay', () => {
  const now = Date.now();
  // 2 từ mới học hôm nay
  const todayItems = [
    { id: '1', text: 'w1', srs: { reps: 1, interval: 1, firstLearnedAt: now, lastReview: now, due: now + 86400000 } },
    { id: '2', text: 'w2', srs: { reps: 1, interval: 1, firstLearnedAt: now, lastReview: now, due: now + 86400000 } },
    { id: '3', text: 'w3', srs: { reps: 0, interval: 0, lastReview: null, due: 0 } }
  ];

  // Khởi tạo với chỉ tiêu là 2 từ / ngày (để kiểm tra trạng thái hoàn thành)
  const { hub, elements } = createEnv(todayItems, { fss_daily_new_vocab_limit: '2' });
  hub.updateMasteryStats();

  assert.equal(elements['vph-today-new'].textContent, 2, 'Số từ mới hôm nay: 2');
  assert.equal(elements['vph-goal-target'].textContent, 2, 'Chỉ tiêu: 2');
  assert.equal(elements['vph-daily-goal-badge'].classList.contains('completed'), true, 'Phải gắn class completed khi đạt chỉ tiêu');
  assert.ok(elements['vph-daily-goal-badge'].title.includes('hoàn thành'));
});
