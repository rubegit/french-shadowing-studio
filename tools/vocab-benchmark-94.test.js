'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

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
    escapeHtml: (s) => String(s || ''),
    escHtml: (s) => String(s || ''),
    formatTime: () => '0:00',
    FrenchMorphology: FrenchMorphology
  };
  Object.assign(mockGlobal.window, mockGlobal);

  const fn = new Function('global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology',
    codeVocabList + '\nreturn { findVariantSpan, scoreSentenceForVocab, tryAlignSingleVocabItem };'
  );
  return fn(mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage, mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology);
}

const { findVariantSpan } = createEnv();

test('M14c: Ranh giới lược âm hai nhánh tường minh & Chống nuốt từ giả', () => {
  // 1. Tiền tố hợp lệ m', jusqu' phải khớp đúng từ sau nháy
  const spEvite = findVariantSpan("Oui, ça m'évite d'acheter tout de suite des meubles.", 'éviter');
  assert.ok(spEvite, 'Phải tìm thấy évite sau m\'');
  assert.equal(spEvite.match, 'évite');

  const spA = findVariantSpan("jusqu'à transformer les rues", 'à');
  assert.ok(spA, 'Phải tìm thấy à sau jusqu\'');
  assert.equal(spA.match, 'à');

  // 2. Chống nuốt nhầm từ giả trong các từ ghép cố định
  const spUn = findVariantSpan("quelqu'un est là", 'un');
  assert.equal(spUn, null, 'KHÔNG được nuốt nhầm un trong quelqu\'un');

  const spHui = findVariantSpan("aujourd'hui il fait beau", 'hui');
  assert.equal(spHui, null, 'KHÔNG được nuốt nhầm hui trong aujourd\'hui');
});

test('M14c: Span phản thân chỉ tô động từ nòng cốt (bỏ me/se/te/vous)', () => {
  // Ca 23: On se rend dans... -> chỉ lấy "rend"
  const spRend = findVariantSpan('On se rend dans un boulanger', 'se rendre');
  assert.ok(spRend);
  assert.equal(spRend.match, 'rend');
  assert.equal(spRend.start, 6);
  assert.equal(spRend.end, 10);

  // Ca 24: vous abonner à -> chỉ lấy "abonner à"
  const spAbonner = findVariantSpan("n'oubliez pas de vous abonner à notre chaîne", "s'abonner à");
  assert.ok(spAbonner);
  assert.equal(spAbonner.match, 'abonner à');
});

test('M14c: homograph-priority vs saved-form-priority', () => {
  const sentence = 'Je suis là.';

  // 1. Term là 'suivre' -> bị homograph-priority từ chối vì 'suis' thuộc về 'être'
  const spSuivre = findVariantSpan(sentence, 'suivre');
  assert.equal(spSuivre, null, 'suivre không được nhận vơ suis của être');

  // 2. Term là 'être' -> nhận suis bình thường
  const spEtre = findVariantSpan(sentence, 'être');
  assert.ok(spEtre);
  assert.equal(spEtre.match, 'suis');

  // 3. Term lưu chính xác là 'suis' -> saved-form-priority thắng homograph-priority!
  const spSuis = findVariantSpan(sentence, 'suis');
  assert.ok(spSuis);
  assert.equal(spSuis.match, 'suis');
});

test('M14c: Mở rộng hình thái họ -cevoir, suffire và mạo từ danh từ', () => {
  // Họ -cevoir
  const conjs = FrenchMorphology.getVerbConjugations('percevoir');
  assert.ok(conjs.includes('perçoivent'), 'percevoir phải sinh perçoivent');
  assert.ok(conjs.includes('perçois'), 'percevoir phải sinh perçois');
  assert.ok(!conjs.includes('perreçoivent'), 'KHÔNG được sinh perreçoivent với 2 chữ r');

  // Họ suffire
  const suffConjs = FrenchMorphology.getVerbConjugations('suffire');
  assert.ok(suffConjs.includes('suffit'), 'suffire phải sinh suffit');

  // Bóc mạo từ danh từ
  const pVars = FrenchMorphology.expandVocabVariants('une personne');
  assert.ok(pVars.includes('personnes'), 'une personne phải sinh dạng số nhiều personnes');

  const oVars = FrenchMorphology.expandVocabVariants('une odeur');
  assert.ok(oVars.includes('odeur'), 'une odeur phải sinh dạng không mạo từ odeur');

  // Cụm từ giữ dạng ngắn của avoir
  const malVars = FrenchMorphology.expandVocabVariants('avoir mal à');
  assert.ok(malVars.includes('ai mal à'), 'avoir mal à phải giữ ai mal à');
});
