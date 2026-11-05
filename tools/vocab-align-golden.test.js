'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');

function createEnv(opts = {}) {
  function createDummyEl() {
    return {
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      style: {},
      setAttribute: () => {},
      getAttribute: () => '',
      removeAttribute: () => {}
    };
  }

  let storage = {};
  const mockGlobal = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
      FrenchMorphology: FrenchMorphology,
      ...opts.windowProps
    },
    document: {
      getElementById: () => createDummyEl(),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      documentElement: { dataset: {} }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: {
      getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
      clear: () => { storage = {}; }
    },
    escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    escHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    formatTime: () => '0:00',
    FrenchMorphology: FrenchMorphology,
    currentVideoId: opts.currentVideoId || 'UoxA5R0tcFA',
    currentVideoTitle: opts.currentVideoTitle || '50 Daily French Conversations',
    sentences: opts.sentences || []
  };
  Object.assign(mockGlobal.window, mockGlobal);

  const fn = new Function('global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology', 'currentVideoId', 'currentVideoTitle', 'sentences',
    codeVocabList + '\nreturn { scoreSentenceForVocab, tryAlignSingleVocabItem, autoAlignVocabTimestamps, undoAutoAlignVocabTimestamps, getVocab, setVocab };'
  );
  const exports = fn(
    mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
    mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology,
    mockGlobal.currentVideoId, mockGlobal.currentVideoTitle, mockGlobal.sentences
  );
  return { global: mockGlobal, exports };
}

test('M14b: scoreSentenceForVocab - Phân bổ điểm chính xác cho context và hình thái từ', () => {
  const { exports } = createEnv();
  const { scoreSentenceForVocab } = exports;

  // 1. Khớp hoàn hảo cả câu ngữ cảnh lẫn từ vựng
  const v1 = { text: 'savoir', en: 'Je ne sais pas du tout.', t: 0 };
  const s1 = { text: 'Je ne sais pas du tout.', startTime: 10 };
  const res1 = scoreSentenceForVocab(v1, s1);
  assert.ok(res1.score >= 15, 'Trùng cả câu ngữ cảnh phải đạt điểm cao');
  assert.match(res1.reason, /EN_EXACT/);
  assert.match(res1.reason, /WORD_VARIANT/);

  // 2. Không trùng câu nhưng khớp biến thể động từ
  const v2 = { text: 'aller', en: '', t: 0 };
  const s2 = { text: 'Demain, nous irons à Paris ensemble.', startTime: 25 };
  const res2 = scoreSentenceForVocab(v2, s2);
  assert.ok(res2.score >= 4, 'Khớp dạng biến thể irons phải được ít nhất 4 điểm');
  assert.match(res2.reason, /WORD_VARIANT/);
  assert.ok(res2.span && res2.span.match.toLowerCase() === 'irons');

  // 3. Phạt từ cực ngắn nếu không có context match
  const v3 = { text: 'va', en: '', t: 0 };
  const s3 = { text: 'Il va à la gare.', startTime: 30 };
  const res3 = scoreSentenceForVocab(v3, s3);
  // va là 2 ký tự, không có context -> bị phạt 2 điểm
  assert.ok(res3.score < 6, 'Từ cực ngắn <= 2 ký tự không kèm context phải bị trừ điểm phòng hờ');
});

test('M14b: MULTIPLE status - Từ chối tự gán khi có nhiều câu trùng khớp mà không có targetT', () => {
  const sentencesWithTie = [
    { text: 'Il prend un café le matin.', startTime: 15 },
    { text: 'Elle prend un thé le soir.', startTime: 80 }
  ];
  const { exports } = createEnv({ sentences: sentencesWithTie });
  const { tryAlignSingleVocabItem } = exports;

  // Ca 1: v.t = 0 (chưa có mốc), điểm 2 câu ngang nhau do cùng chứa 'prend' và không có en context
  const ambiguousItem = {
    id: 'ambig_1',
    text: 'prendre',
    en: '',
    t: 0,
    t_known: false,
    hs: 0,
    he: 0
  };
  const resultTie = tryAlignSingleVocabItem(ambiguousItem);
  assert.equal(resultTie, false, 'Phải từ chối gán khi 2 câu cùng điểm và không có mốc thời gian');
  assert.equal(ambiguousItem.t_known, false, 't_known vẫn phải là false để người dùng tự xác nhận');

  // Ca 2: v.t > 0 (người dùng có mốc ước lượng 18s gần câu 1), phân xử theo khoảng cách thời gian
  const knownItem = {
    id: 'ambig_2',
    text: 'prendre',
    en: '',
    t: 18,
    t_known: false,
    hs: 0,
    he: 0
  };
  const resultResolved = tryAlignSingleVocabItem(knownItem);
  assert.equal(resultResolved, true, 'Có mốc t ước lượng thì phân xử được');
  assert.equal(knownItem.t, 15, 'Phải chọn câu gần mốc 18s nhất (15s thay vì 80s)');
  assert.equal(knownItem.t_known, true);
});

test('M14b: In-memory snapshot & undoAutoAlignVocabTimestamps - Hoàn tác an toàn', () => {
  const testSubtitles = [
    { text: 'Bonjour tout le monde !', startTime: 5.5, vi: 'Chào mọi người!' },
    { text: 'Comment allez-vous aujourd\'hui ?', startTime: 12.0, vi: 'Hôm nay bạn thế nào?' }
  ];
  const { global, exports } = createEnv({ sentences: testSubtitles });
  const { autoAlignVocabTimestamps, undoAutoAlignVocabTimestamps, getVocab, setVocab } = exports;

  const initialVocab = [
    { id: 'v1', text: 'bonjour', en: 'Bonjour tout le monde !', t: 0, t_known: false, videoId: 'UoxA5R0tcFA' },
    { id: 'v2', text: 'aller', en: 'Comment allez-vous aujourd\'hui ?', t: 0, t_known: false, videoId: 'UoxA5R0tcFA' }
  ];
  setVocab(initialVocab);

  // 1. Chạy autoAlignVocabTimestamps
  autoAlignVocabTimestamps();

  const alignedVocab = getVocab();
  assert.equal(alignedVocab[0].t, 5.5);
  assert.equal(alignedVocab[0].t_known, true);
  assert.equal(alignedVocab[1].t, 12.0);
  assert.equal(alignedVocab[1].t_known, true);
  assert.ok(global.window._vocabAlignSnapshot, 'Snapshot in-memory phải được lưu trước khi sửa');

  // 2. Chạy hoàn tác
  const undoRes = undoAutoAlignVocabTimestamps();
  assert.equal(undoRes, true, 'Hoàn tác phải thành công');

  const revertedVocab = getVocab();
  assert.equal(revertedVocab[0].t, 0, 'Timestamp phải được trả về 0');
  assert.equal(revertedVocab[0].t_known, false, 't_known phải trở lại false');
  assert.equal(revertedVocab[1].t, 0);
  assert.equal(revertedVocab[1].t_known, false);

  // 3. Hoàn tác lần 2 khi không còn snapshot
  const secondUndo = undoAutoAlignVocabTimestamps();
  assert.equal(secondUndo, false, 'Không còn snapshot thì trả về false không văng lỗi');
});

test('M14b: Golden Test Suite - 60 cặp từ vựng - phụ đề thực tế đạt độ chính xác >= 90%', () => {
  const allVocab = JSON.parse(fs.readFileSync(path.join(__dirname, '../backup/local_vocab_backup_20261101.json'), 'utf8'));
  const testSet = allVocab.filter(x => x.text && x.en && typeof x.t === 'number' && x.t > 0).slice(0, 60);

  // Dựng subtitle track thực tế từ các câu trong bài
  const seenTime = new Set();
  const subtitleTrack = [];
  for (const item of testSet) {
    if (!seenTime.has(item.t)) {
      seenTime.add(item.t);
      subtitleTrack.push({
        text: item.en,
        startTime: item.t,
        endTime: item.t + 3,
        vi: item.vi || ''
      });
    }
  }

  const { exports } = createEnv({ sentences: subtitleTrack });
  const { tryAlignSingleVocabItem } = exports;

  let correctCount = 0;
  let totalTested = testSet.length;

  for (const item of testSet) {
    // Giả lập từ chưa có mốc t (t = 0, t_known = false)
    const testItem = {
      ...item,
      t: 0,
      t_known: false,
      hs: 0,
      he: 0
    };

    const success = tryAlignSingleVocabItem(testItem);
    if (success && Math.abs(testItem.t - item.t) < 0.01) {
      correctCount++;
      // Kiểm tra toạ độ highlight nếu tìm thấy
      if (testItem.hs !== undefined && testItem.he !== undefined && testItem.he > testItem.hs) {
        assert.ok(testItem.he <= item.en.length, 'Toạ độ he không được vượt quá độ dài câu');
      }
    }
  }

  const accuracy = (correctCount / totalTested) * 100;
  assert.ok(totalTested >= 50, 'Bộ test mẫu phải chứa ít nhất 50 phần tử thực tế');
  assert.ok(accuracy >= 90.0, `Độ chính xác phải >= 90% (thực tế: ${accuracy.toFixed(1)}%)`);
});
