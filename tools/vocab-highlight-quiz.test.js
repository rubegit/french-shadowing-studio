'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

// Nạp 01g-vocab-list.js & vocab-practice.js vào môi trường mock
const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');
const codeVocabPractice = fs.readFileSync(path.join(__dirname, '../js/vocab-practice.js'), 'utf8');

function createEnv() {
  function createDummyEl() {
    return {
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      style: { setProperty: () => {} },
      setAttribute: () => {},
      getAttribute: () => '',
      removeAttribute: () => {},
      innerHTML: '',
      textContent: '',
      focus: () => {}
    };
  }

  const mockGlobal = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
      FrenchMorphology: FrenchMorphology
    },
    document: {
      getElementById: () => createDummyEl(),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => createDummyEl(),
      addEventListener: () => {},
      documentElement: { dataset: {} },
      readyState: 'complete',
      body: { appendChild: () => {}, removeChild: () => {} }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    escHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    formatTime: () => '0:00',
    FrenchMorphology: FrenchMorphology,
    module: { exports: {} }
  };
  Object.assign(mockGlobal.window, mockGlobal);

  // 1. Chạy 01g-vocab-list.js để khởi tạo findVariantSpan và findWordSpanInString
  const initVocabList = new Function(
    'global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology',
    codeVocabList + '\nreturn { findVariantSpan, findWordSpanInString, smartHighlightInContext, hlExample };'
  );
  const vocabListFns = initVocabList(
    mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
    mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology
  );
  Object.assign(mockGlobal.window, vocabListFns);
  Object.assign(mockGlobal, vocabListFns);

  // 2. Chạy vocab-practice.js
  const initPractice = new Function(
    'global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology', 'module',
    codeVocabPractice + '\nreturn window.VocabPracticeHub;'
  );
  const hub = initPractice(
    mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
    mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology, mockGlobal.module
  );

  return { hub, mockGlobal, vocabListFns };
}

const { hub } = createEnv();
const { resolveTargetWordSpan, checkWordMatches, maskWordInSentence } = hub;

test('M24: checkWordMatches - Nhận diện đúng từ mục tiêu và thể chia', () => {
  assert.ok(checkWordMatches("j'aimerais", "j'aimerais"), 'Trùng khớp trực tiếp');
  assert.ok(checkWordMatches("aimerais", "aimer"), 'Khớp thể chia điều kiện thì với nguyên mẫu');
  assert.ok(checkWordMatches("parlons", "parler"), 'Khớp ngôi nous với nguyên mẫu');
  assert.ok(checkWordMatches("« j'aimerais »", "j'aimerais"), 'Bỏ qua dấu ngoặc kép / nháy bao quanh');

  // Không được khớp những từ ngẫu nhiên hoặc chuỗi cắt cụt sai
  assert.equal(checkWordMatches("parler fra", "j'aimerais"), false, 'Chuỗi cắt sai "parler fra" không được khớp với "j\'aimerais"');
  assert.equal(checkWordMatches("pomme", "aimer"), false);
});

test('M24: resolveTargetWordSpan - Tự phục hồi khi hs/he bị lệch (Trường hợp lỗi trong ảnh)', () => {
  const sentence = "j'aimerais parler français";
  const targetWord = "j'aimerais";

  // Khi hs=11, he=21 (chuỗi bị cắt là "parler fra")
  const corruptedHs = 11;
  const corruptedHe = 21;
  assert.equal(sentence.slice(corruptedHs, corruptedHe), 'parler fra', 'Xác nhận tọa độ bị lệch trong dữ liệu cũ cắt ra "parler fra"');

  // resolveTargetWordSpan phải phát hiện "parler fra" sai và tự động tìm lại "j'aimerais" ở 0..10
  const healedSpan = resolveTargetWordSpan(sentence, targetWord, corruptedHs, corruptedHe);
  assert.ok(healedSpan, 'Phải tìm thấy span đã được phục hồi');
  assert.equal(healedSpan.start, 0);
  assert.equal(healedSpan.end, 10);
  assert.equal(sentence.slice(healedSpan.start, healedSpan.end), "j'aimerais");
});

test('M24: resolveTargetWordSpan - Tọa độ chuẩn (valid hs/he)', () => {
  const sentence = "j'aimerais parler français";
  const targetWord = "j'aimerais";
  const validSpan = resolveTargetWordSpan(sentence, targetWord, 0, 10);
  assert.ok(validSpan);
  assert.equal(validSpan.start, 0);
  assert.equal(validSpan.end, 10);
  assert.equal(validSpan.match, "j'aimerais");
});

test('M24: resolveTargetWordSpan - Tìm thể chia khi từ mục tiêu là động từ nguyên mẫu', () => {
  const sentence = "Hier, nous sommes allés au marché.";
  const span = resolveTargetWordSpan(sentence, "aller", 0, 0);
  assert.ok(span, 'Phải tìm được dạng chia allés của aller');
  assert.equal(sentence.slice(span.start, span.end), "allés");
});

test('M24: maskWordInSentence - Che từ chuẩn xác và không làm rách từ ngữ cảnh', () => {
  const sentence = "j'aimerais parler français";
  const targetWord = "j'aimerais";

  // Khi tọa độ hs/he bị lỗi (11..21)
  const res = maskWordInSentence(sentence, targetWord, 11, 21);
  assert.equal(res.targetWordInCtx, "j'aimerais");
  assert.equal(res.hs, 0);
  assert.equal(res.he, 10);
  assert.equal(
    res.masked,
    '<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span> parler français',
    'Phải che đúng "j\'aimerais" và giữ nguyên vẹn "parler français"'
  );
  assert.ok(res.masked.includes('parler français'), 'Phải giữ nguyên vẹn cụm "parler français"');
  assert.ok(!res.masked.includes('fra</span>'), 'Tuyệt đối không được làm rách "français" thành "fra</span>"');
});

test('M24: Quiz UI Simulation - Tránh lỗi cắt vụn câu trong trắc nghiệm', () => {
  const sentence = "j'aimerais parler français";
  const targetWord = "j'aimerais";
  const badHs = 11;
  const badHe = 21;

  // Mô phỏng logic render câu hỏi trắc nghiệm đã cập nhật
  const span = resolveTargetWordSpan(sentence, targetWord, badHs, badHe);
  assert.ok(span);

  // Direction: Vi -> Fr (Che từ tiếng Pháp)
  const viToFrHtml = sentence.slice(0, span.start) + `<mark class="vph-blank-ctx" id="vph-quiz-ctx-mark">_______</mark>` + sentence.slice(span.end);
  assert.equal(viToFrHtml, '<mark class="vph-blank-ctx" id="vph-quiz-ctx-mark">_______</mark> parler français');

  // Direction: Fr -> Vi (Tô sáng từ tiếng Pháp)
  const frToViHtml = sentence.slice(0, span.start) + `<mark class="vph-revealed-ctx">${sentence.slice(span.start, span.end)}</mark>` + sentence.slice(span.end);
  assert.equal(frToViHtml, '<mark class="vph-revealed-ctx">j\'aimerais</mark> parler français');
});
