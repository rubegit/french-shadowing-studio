'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

// Nạp 01g-vocab-list.js vào môi trường mock
const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');

function createEnv() {
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
      addEventListener: () => {},
      documentElement: { dataset: {} }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    escHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    formatTime: () => '0:00',
    FrenchMorphology: FrenchMorphology
  };
  Object.assign(mockGlobal.window, mockGlobal);

  const fn = new Function('global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology',
    codeVocabList + '\nreturn { findVariantSpan, findWordSpanInString, smartHighlightInContext, hlExample };'
  );
  return fn(mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage, mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology);
}

const { findVariantSpan, smartHighlightInContext, hlExample } = createEnv();

test('M14a: findVariantSpan - Khớp biến thể động từ chuẩn xác', () => {
  // 1. aller -> irons
  const s1 = 'Demain, nous irons au cinéma ensemble.';
  const spanAller = findVariantSpan(s1, 'aller');
  assert.ok(spanAller, 'Phải tìm thấy biến thể của aller');
  assert.equal(spanAller.match, 'irons');
  assert.equal(s1.slice(spanAller.start, spanAller.end), 'irons');

  // 2. savoir -> sait, su, saurai
  const s2 = 'Il ne sait pas encore la vérité, mais je saurai demain.';
  const spanSavoir1 = findVariantSpan(s2, 'savoir');
  assert.ok(spanSavoir1);
  assert.equal(spanSavoir1.match, 'sait');

  const s2b = 'J’ai su cette nouvelle hier soir.';
  const spanSavoir2 = findVariantSpan(s2b, 'savoir');
  assert.ok(spanSavoir2);
  assert.equal(spanSavoir2.match, 'su');

  // 3. prendre rendez-vous -> pris rendez-vous
  const s3 = 'J’ai pris rendez-vous chez le médecin.';
  const spanP3 = findVariantSpan(s3, 'prendre rendez-vous');
  assert.ok(spanP3, 'Phải tìm thấy cụm chia thì pris rendez-vous');
  assert.equal(spanP3.match, 'pris rendez-vous');
});

test('M14a: findVariantSpan - Ranh giới từ tiếng Pháp (Word Boundary & Elision)', () => {
  // 1. l'ami -> chỉ phủ đúng chữ ami
  const sAmi = "C'est l'ami d'enfance de Thomas.";
  const spanAmi = findVariantSpan(sAmi, 'ami');
  assert.ok(spanAmi);
  assert.equal(sAmi.slice(spanAmi.start, spanAmi.end), 'ami');

  // 2. dis-moi -> chỉ phủ đúng chữ dis
  const sDis = 'Dis-moi ce que tu en penses.';
  const spanDis = findVariantSpan(sDis, 'dire');
  assert.ok(spanDis);
  assert.equal(sDis.slice(spanDis.start, spanDis.end), 'Dis');

  // 3. Substring exclusion: va không được khớp cravate, carnaval, travail
  assert.equal(findVariantSpan('Elle porte une cravate.', 'va'), null, 'va không được khớp trong cravate');
  assert.equal(findVariantSpan('Le carnaval commence.', 'va'), null, 'va không được khớp trong carnaval');
  assert.equal(findVariantSpan('Bon courage pour votre travail.', 'va'), null, 'va không được khớp trong travail');

  // 4. Standalone match: va trong Comment ça va ?
  const sVa = 'Comment ça va aujourd’hui ?';
  const spanVa = findVariantSpan(sVa, 'va');
  assert.ok(spanVa);
  assert.equal(sVa.slice(spanVa.start, spanVa.end), 'va');
});

test('M14a: findVariantSpan - Chữ hoa và dấu nháy cong/thẳng', () => {
  const s = "HIER, J’AI COMPRIS LA LEÇON.";
  const span = findVariantSpan(s, 'comprendre');
  assert.ok(span, 'Phải khớp COMPRIS với comprendre');
  assert.equal(s.slice(span.start, span.end), 'COMPRIS');
});

test('M14a: smartHighlightInContext - Tô sáng an toàn XSS và chuẩn hóa thẻ', () => {
  // 1. Chống XSS
  const enXss = '<img src=x onerror=alert(1)> Il sait la réponse & part.';
  const resXss = smartHighlightInContext(enXss, 'savoir');
  assert.ok(!resXss.includes('<img src=x'), 'Phải escape mã HTML độc hại');
  assert.ok(resXss.includes('&lt;img src=x'), 'HTML phải được chuyển thành thực thể &lt;');
  assert.ok(resXss.includes('<mark class="vocab-hl">sait</mark>'), 'Phải chèn đúng thẻ mark');

  // 2. Term rỗng không tin hs/he mù quáng
  const resEmptyTerm = smartHighlightInContext('Texte ordinaire', '', 0, 5);
  assert.ok(!resEmptyTerm.includes('<mark'), 'Term rỗng không được tự tiện highlight theo hs/he');

  // 3. Trim khoảng trắng trong hs/he
  const enSpaces = 'Bonjour  monde  !';
  const resSpaces = smartHighlightInContext(enSpaces, 'monde', 7, 16);
  assert.ok(resSpaces.includes('<mark class="vocab-hl">monde</mark>'), 'Thẻ mark không được chứa khoảng trắng thừa');
});

test('M14a: hlExample - Hoạt động chuẩn xác với các câu ví dụ', () => {
  const ex = "Hier, nous avons pris rendez-vous pour demain.";
  const res = hlExample(ex, "prendre rendez-vous");
  assert.ok(res.includes('<mark>pris rendez-vous</mark>'), 'hlExample phải tô sáng cụm pris rendez-vous');
});

test('M13b: findVariantSpan & smartHighlightInContext - Danh từ & Tính từ biến thể', () => {
  // 1. nouveau -> nouvelle
  const sNouvelle = "C'est une nouvelle méthode très efficace.";
  const spanNouveau = findVariantSpan(sNouvelle, 'nouveau');
  assert.ok(spanNouveau, 'Phải tìm thấy biến thể nouvelle từ nouveau');
  assert.equal(spanNouveau.match, 'nouvelle');

  const hlNouvelle = smartHighlightInContext(sNouvelle, 'nouveau');
  assert.ok(hlNouvelle.includes('<mark class="vocab-hl">nouvelle</mark>'), 'smartHighlightInContext phải tô sáng nouvelle');

  // 2. travail -> travaux
  const sTravaux = 'Les travaux de rénovation commencent lundi.';
  const spanTravail = findVariantSpan(sTravaux, 'travail');
  assert.ok(spanTravail, 'Phải tìm thấy biến thể travaux từ travail');
  assert.equal(spanTravail.match, 'travaux');

  const hlTravaux = smartHighlightInContext(sTravaux, 'travail');
  assert.ok(hlTravaux.includes('<mark class="vocab-hl">travaux</mark>'), 'smartHighlightInContext phải tô sáng travaux');
});
