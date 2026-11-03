// tools/vocab-examples.test.js
// Kiểm thử hiển thị câu ví dụ song ngữ (Pháp - Việt) trong màn hình Từ vựng và Tab Từ khó
// cho cả định dạng { fr, vi } và { en, vi }.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function createVocabEnv() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', '01g-vocab-list.js'), 'utf8');
  const dummyEl = {
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    hasAttribute: () => false,
    removeAttribute: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    escHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    document: {
      documentElement: { dataset: {} },
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [],
      createElement: () => dummyEl,
      addEventListener: () => {}
    },
    window: {
      addEventListener: () => {}
    }
  };
  const fn = new Function('sandbox', 'with(sandbox) {\n' + code + '\n return { vocabExamplesHtml, aiParseVocabAnswer }; }');
  return fn(sandbox);
}

test('Test 1: vocabExamplesHtml hiển thị 3 ví dụ khi item có định dạng { fr, vi }', () => {
  const { vocabExamplesHtml } = createVocabEnv();

  const item = {
    id: 'word-1',
    text: 'se promener',
    examples: [
      { fr: 'Je me promène dans le parc.', vi: 'Tôi đi dạo trong công viên.' },
      { fr: 'Nous nous promenons souvent.', vi: 'Chúng tôi thường đi dạo.' },
      { fr: 'Tu te promènes avec qui ?', vi: 'Bạn đi dạo với ai?' }
    ]
  };

  const html = vocabExamplesHtml(item);
  const plainTextHtml = html.replace(/<\/?mark>/g, '');
  assert.ok(html.includes('Xem thêm ví dụ (3)'), 'Nút mở ví dụ phải có số lượng là 3');
  assert.ok(html.includes('<mark>'), 'Từ vựng trong câu ví dụ phải được tô sáng');
  assert.ok(plainTextHtml.includes('Je me promène dans le parc.'), 'Phải chứa câu ví dụ 1 tiếng Pháp');
  assert.ok(html.includes('Tôi đi dạo trong công viên.'), 'Phải chứa bản dịch 1 tiếng Việt');
  assert.ok(plainTextHtml.includes('Nous nous promenons thường.') || plainTextHtml.includes('Nous nous promenons souvent.'), 'Phải chứa câu ví dụ 2 tiếng Pháp');
  assert.ok(plainTextHtml.includes('Tu te promènes avec qui ?'), 'Phải chứa câu ví dụ 3 tiếng Pháp');
});

test('Test 2: vocabExamplesHtml hiển thị ví dụ khi item có định dạng cũ { en, vi }', () => {
  const { vocabExamplesHtml } = createVocabEnv();

  const item = {
    id: 'word-2',
    text: 'découvrir',
    examples: [
      { en: 'Nous allons découvrir la ville.', vi: 'Chúng ta sẽ khám phá thành phố.' }
    ]
  };

  const html = vocabExamplesHtml(item);
  assert.ok(html.includes('Xem thêm ví dụ (1)'), 'Nút mở ví dụ phải có số lượng là 1');
  assert.ok(html.includes('Nous allons'), 'Phải chứa đầu câu');
  assert.ok(html.includes('découvrir'), 'Phải chứa từ được tô sáng');
  assert.ok(html.includes('la ville'), 'Phải chứa cuối câu');
  assert.ok(html.includes('Chúng ta sẽ khám phá thành phố.'), 'Phải chứa bản dịch tiếng Việt');
});

test('Test 3: aiParseVocabAnswer lưu cả fr và en khi đọc phản hồi từ AI', () => {
  const { aiParseVocabAnswer } = createVocabEnv();

  const aiResponse = `
1. se réveiller || động từ || B1 || thức giấc
VD1: Elle se réveille à 7 heures. || Cô ấy thức dậy lúc 7 giờ.
VD2: Je me réveille tôt. || Tôi thức dậy sớm.
VD3: Il a du mal à se réveiller. || Anh ấy khó thức dậy.
`;

  const parsed = aiParseVocabAnswer(aiResponse);
  assert.equal(parsed.length, 1, 'Đọc được 1 mục từ');
  assert.equal(parsed[0].term, 'se réveiller');
  assert.equal(parsed[0].examples.length, 3, 'Đọc đủ 3 câu ví dụ');
  assert.equal(parsed[0].examples[0].fr, 'Elle se réveille à 7 heures.', 'Có trường fr');
  assert.equal(parsed[0].examples[0].en, 'Elle se réveille à 7 heures.', 'Có trường en dự phòng');
  assert.equal(parsed[0].examples[0].vi, 'Cô ấy thức dậy lúc 7 giờ.', 'Có trường vi');
});
