const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frenchUtils = require('./french-utils.js');

// Load vocab-practice.js in mock environment
function createPracticeContext(initialStorage = {}) {
  const practiceCode = fs.readFileSync(path.join(__dirname, '../js/vocab-practice.js'), 'utf-8');
  const store = Object.assign({}, initialStorage);
  const elements = {};

  function getEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        style: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        setAttribute() {},
        appendChild() {},
        querySelectorAll() { return []; },
        addEventListener() {},
        value: '',
        textContent: '',
        innerHTML: ''
      };
    }
    return elements[id];
  }

  const sandbox = {
    frenchUtils: frenchUtils,
    localStorage: {
      store: store,
      getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; },
      setItem(k, v) { this.store[k] = String(v); },
      removeItem(k) { delete this.store[k]; }
    },
    document: {
      body: {
        appendChild() {},
        removeChild() {}
      },
      readyState: 'complete',
      addEventListener() {},
      getElementById(id) { return getEl(id); },
      querySelectorAll() { return []; },
      createElement() {
        return {
          style: {},
          setAttribute() {},
          appendChild() {},
          querySelectorAll() { return []; },
          addEventListener() {}
        };
      }
    },
    window: {},
    Date: Date,
    Math: Math,
    console: console,
    setTimeout: (fn) => fn()
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(practiceCode, sandbox);

  return { sandbox, store };
}

// ============================================================================
// TEST 1: Bỏ qua thẻ thiếu dữ liệu và bỏ qua thẻ srs.reps < 2
// ============================================================================
test('M44.1 buildTranslateSession: bỏ qua thẻ thiếu ví dụ và thẻ srs.reps < 2', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  const mockItems = [
    // Thẻ 1: Đủ reps (3) nhưng không có examples
    { id: '1', text: 'maison', wordVi: 'ngôi nhà', srs: { reps: 3 } },
    // Thẻ 2: Đủ reps (2) nhưng examples rỗng fr hoặc vi
    { id: '2', text: 'chat', wordVi: 'con mèo', srs: { reps: 2 }, examples: [{ fr: '', vi: 'con mèo' }] },
    // Thẻ 3: Có examples đầy đủ nhưng srs.reps = 0 (chưa đạt độ nhận biết)
    {
      id: '3', text: 'chien', wordVi: 'con chó', srs: { reps: 0 },
      examples: [{ fr: 'Le chien aboie.', vi: 'Con chó sủa.' }]
    },
    // Thẻ 4: Có examples đầy đủ nhưng srs.reps = 1 (chưa đạt reps >= 2)
    {
      id: '4', text: 'livre', wordVi: 'cuốn sách', srs: { reps: 1 },
      examples: [{ fr: 'Je lis un livre.', vi: 'Tôi đọc một cuốn sách.' }]
    },
    // Thẻ 5: HỢP LỆ (reps = 2, có example đầy đủ)
    {
      id: '5', text: 'pomme', wordVi: 'quả táo', srs: { reps: 2 },
      examples: [{ fr: 'J\'aime la pomme.', vi: 'Tôi thích quả táo.' }]
    },
    // Thẻ 6: HỢP LỆ (reps = 5, có 3 examples)
    {
      id: '6', text: 'école', wordVi: 'trường học', srs: { reps: 5 },
      examples: [
        { fr: 'Je vais à l\'école.', vi: 'Tôi đi đến trường.' },
        { fr: 'L\'école est grande.', vi: 'Trường học rất to.' }
      ]
    }
  ];

  // 1. Khi công tắc includeLowReps = false (ngưỡng strict reps >= 2)
  const session = hub.buildTranslateSession(mockItems, { includeLowReps: false });

  assert.strictEqual(session.skippedLowReps, 2, 'Phải bỏ qua 2 thẻ có reps < 2 (thẻ 3 và thẻ 4)');
  assert.strictEqual(session.skippedNoExamples, 2, 'Phải bỏ qua 2 thẻ thiếu ví dụ (thẻ 1 và thẻ 2)');
  assert.strictEqual(session.eligibleCount, 2, 'Chỉ có 2 thẻ đủ điều kiện khi tắt công tắc (thẻ 5 và thẻ 6)');
  assert.strictEqual(session.questions.length, 2);

  // Đảm bảo question được dựng đúng trường
  const qPomme = session.questions.find(q => q.item.id === '5');
  assert.ok(qPomme);
  assert.strictEqual(qPomme.promptVi, 'Tôi thích quả táo.');
  assert.strictEqual(qPomme.expectedFr, 'J\'aime la pomme.');
  assert.strictEqual(qPomme.wordVi, 'quả táo');

  // 2. Khi công tắc includeLowReps = true (mặc định app chưa release)
  const sessionLow = hub.buildTranslateSession(mockItems, { includeLowReps: true });
  assert.strictEqual(sessionLow.skippedLowReps, 0, 'Không bỏ qua thẻ low reps khi bật công tắc');
  assert.strictEqual(sessionLow.skippedNoExamples, 2, 'Vẫn phải bỏ qua thẻ thiếu ví dụ (thẻ 1 và thẻ 2)');
  assert.strictEqual(sessionLow.eligibleCount, 4, 'Bao gồm 4 thẻ đủ ví dụ (thẻ 3, 4, 5, 6)');
});

// ============================================================================
// TEST 2: Chọn ngẫu nhiên 1 trong các câu ví dụ (VD1 đến VD3)
// ============================================================================
test('M44.2 buildTranslateSession: chọn example hợp lệ từ danh sách ví dụ', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  const itemWith3Ex = {
    id: 'multi_ex',
    text: 'dormir',
    wordVi: 'ngủ',
    srs: { reps: 3 },
    examples: [
      { fr: 'Il dort bien.', vi: 'Anh ấy ngủ ngon.' },
      { fr: 'Je vais dormir.', vi: 'Tôi đi ngủ đây.' },
      { fr: 'Nous dormons tard.', vi: 'Chúng tôi ngủ muộn.' }
    ]
  };

  const session = hub.buildTranslateSession([itemWith3Ex]);
  assert.strictEqual(session.questions.length, 1);
  const q = session.questions[0];

  const validVi = itemWith3Ex.examples.map(e => e.vi);
  const validFr = itemWith3Ex.examples.map(e => e.fr);
  assert.ok(validVi.includes(q.promptVi), 'Đề promptVi phải là 1 trong các ví dụ');
  assert.ok(validFr.includes(q.expectedFr), 'Đáp án expectedFr phải tương ứng với ví dụ được chọn');
});

// ============================================================================
// TEST 3: Chấm điểm bằng normalizeAnswer (đúng, sai, khác dấu nháy, khác dấu phụ)
// ============================================================================
test('M44.3 Chấm đáp án: normalizeAnswer hỗ trợ nháy cong/thẳng, dấu phụ strict/lenient, bỏ dấu câu cuối', () => {
  // 1. Khớp chính xác
  const r1 = frenchUtils.normalizeAnswer('J\'aime la pomme.', 'J\'aime la pomme.');
  assert.strictEqual(r1.isCorrect, true);

  // 2. Nháy cong ’ vs nháy thẳng '
  const r2 = frenchUtils.normalizeAnswer('J’aime la pomme', 'J\'aime la pomme.');
  assert.strictEqual(r2.isCorrect, true, 'Nháy cong và nháy thẳng phải được coi như nhau');

  // 3. Thiếu dấu chấm cuối câu
  const r3 = frenchUtils.normalizeAnswer('Je vais à l\'école', 'Je vais à l\'école.');
  assert.strictEqual(r3.isCorrect, true, 'Bỏ qua dấu câu cuối câu');

  // 4. Khác dấu phụ ở chế độ strict (mặc định) -> SAI
  const r4Strict = frenchUtils.normalizeAnswer('Je vais a l\'ecole', 'Je vais à l\'école', { mode: 'strict' });
  assert.strictEqual(r4Strict.isCorrect, false, 'Chế độ strict phải bắt lỗi thiếu dấu phụ');

  // 5. Khác dấu phụ ở chế độ lenient (bỏ qua dấu phụ) -> ĐÚNG
  const r5Lenient = frenchUtils.normalizeAnswer('Je vais a l\'ecole', 'Je vais à l\'école', { mode: 'lenient' });
  assert.strictEqual(r5Lenient.isCorrect, true, 'Chế độ lenient phải bỏ qua dấu phụ');

  // 6. Sai khác hoàn toàn -> SAI
  const r6 = frenchUtils.normalizeAnswer('Bonjour le monde', 'Je vais à l\'école');
  assert.strictEqual(r6.isCorrect, false);
});

// ============================================================================
// TEST 4: So sánh chi tiết theo từ (Word Diff)
// ============================================================================
test('M44.4 computeWordDiff: phân tách chính xác từ khớp, từ thiếu, từ thừa', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  // Người dùng gõ: "Je vais maison" (thiếu "à", thiếu "la")
  // Đáp án chuẩn: "Je vais à la maison"
  const diff = hub.computeWordDiff('Je vais maison', 'Je vais à la maison');
  
  const matches = diff.filter(d => d.status === 'match').map(d => d.value);
  const missings = diff.filter(d => d.status === 'missing').map(d => d.value);

  assert.strictEqual(JSON.stringify(matches), JSON.stringify(['Je', 'vais', 'maison']));
  assert.strictEqual(JSON.stringify(missings), JSON.stringify(['à', 'la']));

  // Kiểm tra HTML sinh ra
  const html = hub.renderWordDiffHtml('Je vais maison', 'Je vais à la maison');
  assert.ok(html.includes('vph-diff-match'));
  assert.ok(html.includes('vph-diff-missing'));
});

// ============================================================================
// TEST 5: Cập nhật skills.translate mà TUYỆT ĐỐI không đổi item.srs
// ============================================================================
test('M44.5 SM-2 Translate Skill: cập nhật skills.translate riêng biệt, bảo toàn 100% item.srs', () => {
  const initialItem = {
    id: 'word:pomme',
    text: 'pomme',
    wordVi: 'quả táo',
    srs: { reps: 4, interval: 14, ease: 2.6, due: 999999999, lastReview: 888888888 }
  };

  const { sandbox } = createPracticeContext({
    shadowing_saved_vocab_v1: JSON.stringify([initialItem])
  });
  const hub = sandbox.VocabPracticeHub;

  // Lần 1: Trả lời gõ đúng -> reps = 1, interval = 2 (tăng nhiều hơn trắc nghiệm)
  const skill1 = hub.updateItemTranslateSkill('word:pomme', true);
  assert.strictEqual(skill1.reps, 1);
  assert.strictEqual(skill1.interval, 2, 'Lần đầu đúng gõ câu: interval = 2 ngày');
  assert.ok(skill1.due > Date.now());

  // Kiểm tra item.srs: KHÔNG ĐƯỢC PHÉP THAY ĐỔI
  const storedList1 = JSON.parse(sandbox.localStorage.getItem('shadowing_saved_vocab_v1'));
  assert.strictEqual(storedList1[0].srs.reps, 4, 'srs.reps phải giữ nguyên 4');
  assert.strictEqual(storedList1[0].srs.interval, 14, 'srs.interval phải giữ nguyên 14');
  assert.strictEqual(storedList1[0].srs.ease, 2.6, 'srs.ease phải giữ nguyên 2.6');

  // Lần 2: Trả lời đúng tiếp -> reps = 2, interval = 4
  const skill2 = hub.updateItemTranslateSkill('word:pomme', true);
  assert.strictEqual(skill2.reps, 2);
  assert.strictEqual(skill2.interval, 4, 'Lần 2 đúng: interval = 4 ngày');
  const easeBeforeWrong = skill2.ease;

  // Lần 3: Trả lời sai -> reps = 0, ease giảm mạnh (giảm 0.25), interval = 0
  const skill3 = hub.updateItemTranslateSkill('word:pomme', false);
  assert.strictEqual(skill3.reps, 0, 'Sai: reps về 0');
  assert.strictEqual(skill3.interval, 0, 'Sai: interval về 0');
  assert.ok(skill3.ease < easeBeforeWrong, 'Sai: ease phải giảm mạnh hơn');
  assert.strictEqual(Math.round((easeBeforeWrong - skill3.ease) * 100) / 100, 0.25, 'Ease giảm đúng 0.25');

  // Kiểm tra item.srs lần nữa: VẪN BẢO TOÀN NGUYÊN VẸN
  const storedList3 = JSON.parse(sandbox.localStorage.getItem('shadowing_saved_vocab_v1'));
  assert.strictEqual(storedList3[0].srs.reps, 4, 'srs.reps tuyệt đối không bị ảnh hưởng');
  assert.strictEqual(storedList3[0].srs.interval, 14);
});

// ============================================================================
// TEST 6: Bài dịch với dữ liệu thực từ backup/yt-aMx0d42wzBs.txt
// ============================================================================
test('M44.6 Bài dịch với dữ liệu thực từ backup/yt-aMx0d42wzBs.txt trên localStorage giả lập', () => {
  const SchemaV02 = require('./schema-v02.js');
  const fileContent = fs.readFileSync(path.join(__dirname, '../backup/yt-aMx0d42wzBs.txt'), 'utf-8');

  // Nạp 37 mục vào danh sách từ vựng giả lập
  const staged = SchemaV02.stageMultiSourceImport([{
    fileName: 'yt-aMx0d42wzBs.txt',
    content: fileContent
  }], []);
  const commit = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, []);
  const realItems = commit.updatedVocabList;

  assert.strictEqual(realItems.length, 37, 'File phải nạp đúng 37 mục');

  const { sandbox } = createPracticeContext({
    shadowing_saved_vocab_v1: JSON.stringify(realItems)
  });
  const hub = sandbox.VocabPracticeHub;

  // 1. Khi công tắc tắt (chỉ lấy reps >= 2):
  // Vì 37 thẻ vừa nạp có srs.reps = 0, nên có 0 thẻ đủ điều kiện và 37 thẻ bị bỏ qua
  const sessionOff = hub.buildTranslateSession(realItems, { includeLowReps: false });
  assert.strictEqual(sessionOff.eligibleCount, 0, 'Khi tắt công tắc: 0 thẻ đủ điều kiện do srs.reps = 0');
  assert.strictEqual(sessionOff.skippedLowReps, 37, 'Toàn bộ 37 thẻ bị bỏ qua vì chưa đủ reps');
  assert.strictEqual(sessionOff.skippedNoExamples, 0, 'Không thẻ nào bị thiếu ví dụ');

  // 2. Khi công tắc bật (mặc định app chưa release):
  // Tất cả 37/37 thẻ đều có ví dụ song ngữ -> cả 37 thẻ đều đủ điều kiện
  const sessionOn = hub.buildTranslateSession(realItems, { includeLowReps: true });
  assert.strictEqual(sessionOn.eligibleCount, 37, 'Khi bật công tắc: đủ 37/37 thẻ');
  assert.strictEqual(sessionOn.skippedLowReps, 0);
  assert.strictEqual(sessionOn.skippedNoExamples, 0);
  assert.ok(sessionOn.questions.length > 0);

  // Kiểm tra 1 câu hỏi bất kỳ từ lô 37 mục
  const q0 = sessionOn.questions[0];
  assert.ok(q0.promptVi && q0.promptVi.length > 0, 'promptVi phải có nội dung tiếng Việt');
  assert.ok(q0.expectedFr && q0.expectedFr.length > 0, 'expectedFr phải có nội dung tiếng Pháp');
  assert.ok(q0.wordVi && q0.wordVi.length > 0, 'wordVi làm gợi ý');
});
