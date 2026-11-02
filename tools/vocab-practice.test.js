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
      const classes = new Set();
      elements[id] = {
        id,
        style: {
          setProperty(k, v) { this[k] = v; }
        },
        classList: {
          add(...cls) { cls.forEach(c => classes.add(c)); },
          remove(...cls) { cls.forEach(c => classes.delete(c)); },
          toggle(c, force) {
            if (typeof force === 'boolean') {
              if (force) classes.add(c); else classes.delete(c);
              return force;
            }
            if (classes.has(c)) { classes.delete(c); return false; }
            classes.add(c); return true;
          },
          contains(c) { return classes.has(c); }
        },
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; },
        appendChild() {},
        querySelectorAll() { return []; },
        addEventListener() {},
        focus() {},
        value: '',
        textContent: '',
        innerHTML: '',
        disabled: false
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
      getElementById(id) {
        if (id === 'vph-backdrop') return elements['vph-backdrop'] || null;
        return getEl(id);
      },
      querySelector(sel) {
        if (sel === '.vph-modal') return getEl('vph-modal');
        return null;
      },
      querySelectorAll() { return []; },
      createElement() {
        const el = {
          _id: '',
          set id(val) { this._id = val; elements[val] = this; },
          get id() { return this._id; },
          style: { setProperty() {} },
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
          setAttribute(k, v) { this[k] = v; if (k === 'id') elements[v] = this; },
          getAttribute(k) { return this[k]; },
          appendChild() {},
          querySelectorAll() { return []; },
          addEventListener() {}
        };
        return el;
      }
    },
    window: {
      addEventListener() {},
      removeEventListener() {}
    },
    Date: Date,
    Math: Math,
    console: console,
    setTimeout: (fn, delay) => {
      if (typeof delay === 'number' && delay > 0) {
        return setTimeout(fn, delay);
      }
      return fn();
    },
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    addEventListener() {},
    removeEventListener() {}
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

// ============================================================================
// TEST 7: Chuỗi sự kiện phím Enter, lọc IME composing, repeat, Shift+Enter
// ============================================================================
test('M44.7 Enter keydown sequence: submit ở Enter 1, không nhảy câu cùng event tick, advance ở Enter 2', () => {
  const mockItems = [
    {
      id: 'item_1',
      text: 'maison',
      wordVi: 'ngôi nhà',
      srs: { reps: 2 },
      examples: [{ fr: 'J\'ai acheté une maison.', vi: 'Tôi đã mua một ngôi nhà.' }]
    },
    {
      id: 'item_2',
      text: 'chat',
      wordVi: 'con mèo',
      srs: { reps: 2 },
      examples: [{ fr: 'Le chat dort.', vi: 'Con mèo đang ngủ.' }]
    }
  ];

  const { sandbox } = createPracticeContext({
    shadowing_saved_vocab_v1: JSON.stringify(mockItems)
  });
  const hub = sandbox.VocabPracticeHub;
  const state = hub._state;

  // Mở Hub với mode translate
  hub.open('all', null, 'translate');
  assert.strictEqual(state.currentIndex, 0, 'Bắt đầu ở câu 0');
  assert.strictEqual(state.answered, false, 'Chưa trả lời');

  const inputEl = sandbox.document.getElementById('vph-translate-input');
  assert.ok(inputEl, 'Textarea dịch phải tồn tại');

  // 1. Phím Enter khi đang gõ IME tiếng Việt (isComposing = true hoặc keyCode = 229) -> BỎ QUA
  let prevented = false;
  hub.handleTranslateKeydown({
    key: 'Enter',
    isComposing: true,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.answered, false, 'IME composing: không được submit');
  assert.strictEqual(prevented, false);

  hub.handleTranslateKeydown({
    key: 'Enter',
    keyCode: 229,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.answered, false, 'keyCode 229: không được submit');

  // 2. Shift+Enter -> Cho phép xuống dòng trong textarea, không submit
  hub.handleTranslateKeydown({
    key: 'Enter',
    shiftKey: true,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.answered, false, 'Shift+Enter: không submit');

  // 3. Phím giữ lặp lại (repeat = true) -> BỎ QUA
  hub.handleTranslateKeydown({
    key: 'Enter',
    repeat: true,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.answered, false, 'repeat: không submit');

  // 4. Nhấn Enter lần 1 (người học đã nhập câu trả lời) -> KIỂM TRA ĐÁP ÁN
  inputEl.value = 'J\'ai acheté une maison.';
  hub.handleTranslateKeydown({
    key: 'Enter',
    preventDefault() { prevented = true; }
  });

  assert.strictEqual(state.answered, true, 'Enter 1: đã kiểm tra đáp án');
  assert.strictEqual(state.translateCanAdvance, false, 'Vừa kiểm tra: translateCanAdvance bị khóa (false)');
  assert.strictEqual(state.currentIndex, 0, 'Enter 1: TUYỆT ĐỐI KHÔNG được nhảy sang câu tiếp ngay cùng lúc');

  // 5. Sự kiện bubbling hoặc nhấn ngay tức thì khi translateCanAdvance chưa mở -> KHÔNG nhảy câu
  hub.handleTranslateKeydown({
    key: 'Enter',
    preventDefault() {}
  });
  assert.strictEqual(state.currentIndex, 0, 'Bubbling event cùng lúc: vẫn ở câu 0');

  // 6. Nhấn giữ lặp lại sau khi đã submit -> KHÔNG nhảy câu
  state.translateCanAdvance = true; // Giả lập đã qua độ trễ an toàn
  hub.handleTranslateKeydown({
    key: 'Enter',
    repeat: true,
    preventDefault() {}
  });
  assert.strictEqual(state.currentIndex, 0, 'repeat sau khi chấm: không nhảy câu');

  // 7. Nhấn Enter lần 2 (một lần nhấn phím MỚI, translateCanAdvance = true) -> CHUYỂN CÂU TIẾP
  hub.handleTranslateKeydown({
    key: 'Enter',
    preventDefault() {}
  });
  assert.strictEqual(state.currentIndex, 1, 'Enter lần 2: chuyển sang câu 1 thành công');
  assert.strictEqual(state.answered, false, 'Câu 1 mới: answered reset về false');
  hub.close();
});

// ============================================================================
// TEST 8: Bộ định dạng gợi ý theo mức (Level 1..4, chữ cái đầu, mở từ, dấu nháy)
// ============================================================================
test('M44.8 Hint engine: định dạng chính xác số từ, gạch, chữ cái đầu, dấu nháy với "J\'ai acheté une maison."', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  const sentence = 'J\'ai acheté une maison.';

  // Tổng số từ: 5 từ ('J', 'ai', 'acheté', 'une', 'maison')
  const wordCount = hub.countSentenceWords(sentence);
  assert.strictEqual(wordCount, 5, 'Phải đếm đúng 5 từ');

  // Mức 1: Gạch theo độ dài từng từ, giữ nguyên dấu nháy và dấu chấm
  // J (1) -> _, ' -> ', ai (2) -> _ _, acheté (6) -> _ _ _ _ _ _, une (3) -> _ _ _, maison (6) -> _ _ _ _ _ _
  const hint1 = hub.generateSentenceHint(sentence, 1);
  assert.strictEqual(hint1, '_\'_ _  _ _ _ _ _ _  _ _ _  _ _ _ _ _ _.', 'Mức 1 phải giữ dấu nháy và gạch đúng độ dài');

  // Mức 2: Chữ cái đầu của mỗi từ
  // J -> J, ' -> ', ai -> a _, acheté -> a _ _ _ _ _, une -> u _ _, maison -> m _ _ _ _ _
  const hint2 = hub.generateSentenceHint(sentence, 2);
  assert.strictEqual(hint2, 'J\'a _  a _ _ _ _ _  u _ _  m _ _ _ _ _.', 'Mức 2 hiện chữ cái đầu của mỗi từ');

  // Mức 3: Mở thêm từng từ theo thứ tự
  // Mở 1 từ đầu tiên ('J')
  const hint3_1 = hub.generateSentenceHint(sentence, 3, 1);
  assert.strictEqual(hint3_1, 'J\'a _  a _ _ _ _ _  u _ _  m _ _ _ _ _.', 'Mức 3 mở 1 từ');

  // Mở 2 từ đầu tiên ('J' và 'ai')
  const hint3_2 = hub.generateSentenceHint(sentence, 3, 2);
  assert.strictEqual(hint3_2, 'J\'ai  a _ _ _ _ _  u _ _  m _ _ _ _ _.', 'Mức 3 mở 2 từ: J\'ai đầy đủ');

  // Mở 3 từ ('J', 'ai', 'acheté')
  const hint3_3 = hub.generateSentenceHint(sentence, 3, 3);
  assert.strictEqual(hint3_3, 'J\'ai acheté  u _ _  m _ _ _ _ _.', 'Mức 3 mở 3 từ: J\'ai acheté đầy đủ');

  // Mở toàn bộ 5 từ
  const hint3_5 = hub.generateSentenceHint(sentence, 3, 5);
  assert.strictEqual(hint3_5, 'J\'ai acheté une maison.', 'Mức 3 mở hết 5 từ');

  // Mức 4: Trả về câu đầy đủ để phát âm
  const hint4 = hub.generateSentenceHint(sentence, 4);
  assert.strictEqual(hint4, 'J\'ai acheté une maison.');
});

// ============================================================================
// TEST 9: SM-2 Translate Skill với ma trận phạt theo mức gợi ý
// ============================================================================
test('M44.9 SM-2 Translate Skill: phạt theo mức gợi ý, không chạm item.srs', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  // 1. Không dùng gợi ý (Mức 0) & Đúng: Thăng cấp bình thường (reps 0->2, reps 1->4)
  const s0 = { ease: 2.5, interval: 0, reps: 0 };
  const r0 = hub.translateSkillCompute(s0, true, 0);
  assert.strictEqual(r0.reps, 1);
  assert.strictEqual(r0.interval, 2, 'Mức 0 đúng lần đầu: interval = 2');
  assert.strictEqual(r0.ease, 2.65, 'Mức 0 đúng: ease +0.15');

  const r1 = hub.translateSkillCompute(r0, true, 0);
  assert.strictEqual(r1.reps, 2);
  assert.strictEqual(r1.interval, 4, 'Mức 0 đúng lần hai: interval = 4');
  assert.strictEqual(r1.ease, 2.8, 'Mức 0 đúng: ease đạt max 2.8');

  // 2. Dùng gợi ý Mức 1 hoặc 2 & Đúng: Đánh giá Hard
  // reps 0 -> 1 (thay vì 2), ease KHÔNG ĐỔI, reps + 1
  const s_hard0 = { ease: 2.5, interval: 0, reps: 0 };
  const r_hard1 = hub.translateSkillCompute(s_hard0, true, 1);
  assert.strictEqual(r_hard1.reps, 1);
  assert.strictEqual(r_hard1.interval, 1, 'Mức 1-2 đúng lần đầu: interval = 1 ngày');
  assert.strictEqual(r_hard1.ease, 2.5, 'Mức 1-2 đúng: ease giữ nguyên');

  const r_hard2 = hub.translateSkillCompute(r_hard1, true, 2);
  assert.strictEqual(r_hard2.reps, 2);
  assert.strictEqual(r_hard2.interval, 1, 'Mức 1-2 đúng lần hai: interval * 1.2 = 1');
  assert.strictEqual(r_hard2.ease, 2.5, 'Mức 1-2: ease vẫn không đổi');

  // 3. Dùng gợi ý Mức 3 hoặc 4 & Đúng: Đánh giá Gần trượt (Near-fail)
  // interval không tăng, giữ nguyên reps, ease giảm 0.1
  const s_nearFail = { ease: 2.5, interval: 6, reps: 3 };
  const r_nf3 = hub.translateSkillCompute(s_nearFail, true, 3);
  assert.strictEqual(r_nf3.reps, 3, 'Mức 3-4: reps giữ nguyên 3');
  assert.strictEqual(r_nf3.interval, 6, 'Mức 3-4: interval giữ nguyên không tăng');
  assert.strictEqual(r_nf3.ease, 2.4, 'Mức 3-4: ease giảm 0.1 (2.5 -> 2.4)');

  const r_nf4 = hub.translateSkillCompute(s_nearFail, true, 4);
  assert.strictEqual(r_nf4.reps, 3);
  assert.strictEqual(r_nf4.interval, 6);
  assert.strictEqual(r_nf4.ease, 2.4);

  // 4. Mức >= 5 (Xem đáp án) HOẶC trả lời Sai: Đánh giá Trượt (Fail)
  // reps = 0, interval = 0, ease giảm 0.25
  const s_fail = { ease: 2.5, interval: 6, reps: 3 };
  const r_fail = hub.translateSkillCompute(s_fail, false, 0);
  assert.strictEqual(r_fail.reps, 0, 'Sai: reps về 0');
  assert.strictEqual(r_fail.interval, 0, 'Sai: interval về 0');
  assert.strictEqual(r_fail.ease, 2.25, 'Sai: ease giảm 0.25 (2.5 -> 2.25)');

  const r_reveal = hub.translateSkillCompute(s_fail, true, 5);
  assert.strictEqual(r_reveal.reps, 0, 'Xem đáp án (mức 5): tính là trượt, reps = 0');
  assert.strictEqual(r_reveal.interval, 0, 'Xem đáp án: interval = 0');
  assert.strictEqual(r_reveal.ease, 2.25, 'Xem đáp án: ease giảm 0.25');
});

// ============================================================================
// TEST 10: Điều khiển cỡ chữ A− / A+ và lưu nhớ localStorage
// ============================================================================
test('M44.10 Cỡ chữ A− / A+: 4 mức (Nhỏ, Vừa, Lớn, Rất lớn), nhớ localStorage fss_practice_font_scale', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  // 1. Mặc định khi chưa lưu là mức 1 ('Vừa', scale 1.08)
  assert.strictEqual(hub.getFontScaleIndex(), 1, 'Mặc định là index 1 (Vừa)');

  // 2. Chuyển sang mức 2 ('Lớn')
  const newIdx = hub.setFontScaleIndex(2);
  assert.strictEqual(newIdx, 2);
  assert.strictEqual(sandbox.localStorage.getItem('fss_practice_font_scale'), '2');
  assert.strictEqual(hub.getFontScaleIndex(), 2);

  // 3. Chuyển sang mức 3 ('Rất lớn')
  hub.setFontScaleIndex(3);
  assert.strictEqual(hub.getFontScaleIndex(), 3);
  assert.strictEqual(hub.FONT_SCALE_LABELS[3], 'Rất lớn');
  assert.strictEqual(hub.FONT_SCALE_LEVELS[3], 1.42);

  // 4. Kiểm tra giới hạn biên (clamping): không vượt quá [0, 3]
  hub.setFontScaleIndex(-5);
  assert.strictEqual(hub.getFontScaleIndex(), 0, 'Clamped về 0 (Nhỏ)');
  hub.setFontScaleIndex(99);
  assert.strictEqual(hub.getFontScaleIndex(), 3, 'Clamped về 3 (Rất lớn)');
});

// ============================================================================
// TEST 11: Sandwich Menu metadata và danh sách 6 chế độ luyện tập (M45, M46)
// ============================================================================
test('M45.1 Sandwich Menu: Metadata đầy đủ 6 chế độ luyện tập với icon và mô tả', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  assert.ok(hub.MODE_METADATA, 'MODE_METADATA phải được export');
  const modes = Object.keys(hub.MODE_METADATA);
  assert.strictEqual(modes.length, 6, 'Phải có đủ 6 chế độ luyện tập');
  assert.deepStrictEqual(modes, ['quiz', 'cloze', 'match', 'flashcard', 'translate', 'reorder']);

  assert.strictEqual(hub.MODE_METADATA.quiz.icon, '🎯');
  assert.strictEqual(hub.MODE_METADATA.cloze.icon, '🎧');
  assert.strictEqual(hub.MODE_METADATA.match.icon, '🃏');
  assert.strictEqual(hub.MODE_METADATA.flashcard.icon, '🎴');
  assert.strictEqual(hub.MODE_METADATA.translate.icon, '✍️');
  assert.strictEqual(hub.MODE_METADATA.reorder.icon, '🧩');
  assert.ok(hub.MODE_METADATA.translate.title.includes('Dịch Việt → Pháp'));
  assert.ok(hub.MODE_METADATA.reorder.title.includes('Sắp xếp câu'));

  // Kiểm tra menu DOM được sinh tự động 100% từ MODE_METADATA
  const menuHtml = hub.buildSandwichMenuItemsHtml();
  modes.forEach(modeKey => {
    assert.ok(
      menuHtml.includes(`data-mode="${modeKey}"`),
      `buildSandwichMenuItemsHtml bắt buộc phải sinh nút cho mode ${modeKey}`
    );
  });

  hub.open('all', null, 'quiz');
  const backdropEl = sandbox.document.getElementById('vph-backdrop');
  assert.ok(backdropEl, 'vph-backdrop phải tồn tại trong DOM');
  modes.forEach(modeKey => {
    assert.ok(
      backdropEl.innerHTML.includes(`data-mode="${modeKey}"`),
      `Modal DOM bắt buộc phải chứa nút menu cho mode ${modeKey}`
    );
  });
  hub.close();
});

// ============================================================================
// TEST 12: Đóng / mở Sandwich Menu và phím Escape (M45)
// ============================================================================
test('M45.2 Sandwich Menu: toggle, open, close và xử lý Escape', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  hub.open('all', null, 'quiz');

  const dropdownEl = sandbox.document.getElementById('vph-sandwich-dropdown');
  const btnEl = sandbox.document.getElementById('vph-sandwich-btn');

  // Ban đầu menu đóng
  assert.strictEqual(dropdownEl.classList.contains('open'), false, 'Menu ban đầu đóng');

  // Mở menu
  hub.openSandwichMenu();
  assert.strictEqual(dropdownEl.classList.contains('open'), true, 'Đã mở menu');
  assert.strictEqual(btnEl.classList.contains('active'), true);
  assert.strictEqual(btnEl.getAttribute('aria-expanded'), 'true');

  // Đóng menu
  hub.closeSandwichMenu();
  assert.strictEqual(dropdownEl.classList.contains('open'), false, 'Đã đóng menu');
  assert.strictEqual(btnEl.getAttribute('aria-expanded'), 'false');

  // Toggle menu
  hub.toggleSandwichMenu();
  assert.strictEqual(dropdownEl.classList.contains('open'), true, 'Toggle -> mở menu');

  // Nhấn Escape khi dropdown đang mở: đóng menu dropdown trước
  let prevented = false;
  sandbox.window.dispatchEvent = () => {};
  // Kích hoạt phím Escape qua handleGlobalKeydown
  const escapeEvent = { key: 'Escape', preventDefault() { prevented = true; } };
  // Trong context, Escape được bắt trong handleGlobalKeydown
  hub.openSandwichMenu();
  assert.strictEqual(dropdownEl.classList.contains('open'), true);

  hub.closeSandwichMenu();
  assert.strictEqual(dropdownEl.classList.contains('open'), false, 'Đóng menu thành công');
  hub.close();
});

// ============================================================================
// TEST 13: Chuyển đổi mode qua Sandwich Menu (M45)
// ============================================================================
test('M45.3 Sandwich Menu: switchMode chuyển chế độ, cập nhật tiêu đề và tự đóng menu', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;
  const state = hub._state;

  hub.open('all', null, 'quiz');
  assert.strictEqual(state.currentMode, 'quiz');

  const titleEl = sandbox.document.getElementById('vph-current-mode-title');
  assert.ok(titleEl.innerHTML.includes('Trắc nghiệm 4 đáp án'));

  // Mở menu và chọn chuyển sang 'translate'
  hub.openSandwichMenu();
  hub.switchMode('translate');

  assert.strictEqual(state.currentMode, 'translate', 'currentMode phải đổi sang translate');
  assert.ok(titleEl.innerHTML.includes('Dịch Việt → Pháp'), 'Tiêu đề nút menu phải cập nhật sang Dịch Việt → Pháp');
  assert.ok(titleEl.innerHTML.includes('✍️'), 'Icon menu phải cập nhật icon ✍️');

  const dropdownEl = sandbox.document.getElementById('vph-sandwich-dropdown');
  assert.strictEqual(dropdownEl.classList.contains('open'), false, 'Sau khi chọn mode, menu phải tự đóng lại');

  // Mở menu và chọn chuyển sang 'reorder' (M46.1)
  hub.openSandwichMenu();
  hub.switchMode('reorder');

  assert.strictEqual(state.currentMode, 'reorder', 'currentMode phải đổi sang reorder');
  assert.ok(titleEl.innerHTML.includes('Sắp xếp câu'), 'Tiêu đề nút menu phải cập nhật sang Sắp xếp câu');
  assert.ok(titleEl.innerHTML.includes('🧩'), 'Icon menu phải cập nhật icon 🧩');
  assert.strictEqual(dropdownEl.classList.contains('open'), false, 'Menu tự đóng sau khi chọn reorder');

  hub.close();
});

// ============================================================================
// TEST 14: Phím tắt gợi ý: Ctrl+/ và '?' (tránh xung đột macOS Cmd+H/Cmd+/)
// ============================================================================
test('M44.14 Phím tắt gợi ý: Ctrl+/ kích hoạt gợi ý; Cmd không kích hoạt; phím ? kích hoạt khi không focus', () => {
  const mockItems = [
    {
      id: 'item_1',
      text: 'maison',
      wordVi: 'ngôi nhà',
      srs: { reps: 2 },
      examples: [{ fr: 'J\'ai acheté une maison.', vi: 'Tôi đã mua một ngôi nhà.' }]
    }
  ];

  const { sandbox } = createPracticeContext({
    shadowing_saved_vocab_v1: JSON.stringify(mockItems)
  });
  const hub = sandbox.VocabPracticeHub;
  const state = hub._state;

  hub.open('all', null, 'translate');
  assert.strictEqual(state.translateHintLevel, 0, 'Ban đầu chưa có gợi ý');

  // 1. Phím Cmd+/ hoặc Cmd+H (trên Mac) -> KHÔNG kích hoạt gợi ý
  let prevented = false;
  hub.handleTranslateKeydown({
    key: '/',
    ctrlKey: false,
    metaKey: true,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.translateHintLevel, 0, 'Cmd+/ không kích hoạt');

  hub.handleTranslateKeydown({
    key: 'h',
    ctrlKey: true,
    metaKey: true,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.translateHintLevel, 0, 'Cmd+H / Ctrl+Cmd+H không kích hoạt');

  // 2. Phím Ctrl+/ (phím Control) -> Kích hoạt gợi ý lên Mức 1
  hub.handleTranslateKeydown({
    key: '/',
    ctrlKey: true,
    metaKey: false,
    preventDefault() { prevented = true; }
  });
  assert.strictEqual(state.translateHintLevel, 1, 'Ctrl+/ kích hoạt lên Mức 1');
  assert.strictEqual(prevented, true);

  // 3. Phím Ctrl+/ lần nữa -> Kích hoạt lên Mức 2
  hub.handleTranslateKeydown({
    key: '/',
    ctrlKey: true,
    metaKey: false,
    preventDefault() {}
  });
  assert.strictEqual(state.translateHintLevel, 2, 'Ctrl+/ tiếp kích hoạt lên Mức 2');

  // 4. Phím '?' khi không focus ô gõ -> Kích hoạt lên Mức 3
  sandbox.document.activeElement = null; // không focus ô input
  hub.handleTranslateKeydown({
    key: '?',
    preventDefault() {}
  });
  assert.strictEqual(state.translateHintLevel, 3, 'Phím ? kích hoạt lên Mức 3');

  // 5. Phím '?' khi đang gõ trong textarea -> KHÔNG kích hoạt (để người học gõ dấu hỏi bình thường)
  sandbox.document.activeElement = { tagName: 'TEXTAREA' };
  hub.handleTranslateKeydown({
    key: '?',
    preventDefault() {}
  });
  assert.strictEqual(state.translateHintLevel, 3, 'Phím ? trong textarea không kích hoạt');

  hub.close();
});

// ============================================================================
// TEST 15: Kiểm tra đối tượng gom cấu hình TRANSLATE_SM2_CONFIG
// ============================================================================
test('M44.15 TRANSLATE_SM2_CONFIG: gom đủ tất cả hằng số cấu hình SM-2 dịch ở đầu file', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  assert.ok(hub.TRANSLATE_SM2_CONFIG, 'TRANSLATE_SM2_CONFIG phải tồn tại');
  const cfg = hub.TRANSLATE_SM2_CONFIG;

  assert.strictEqual(cfg.MIN_RECOGNITION_REPS, 2);
  assert.strictEqual(cfg.DEFAULT_INCLUDE_LOW_REPS, true);
  assert.strictEqual(cfg.DEFAULT_EASE, 2.5);
  assert.strictEqual(cfg.MIN_EASE, 1.3);
  assert.strictEqual(cfg.MAX_EASE, 2.8);
  assert.strictEqual(cfg.PERFECT_EASE_BONUS, 0.15);
  assert.strictEqual(cfg.NEAR_FAIL_EASE_PENALTY, 0.10);
  assert.strictEqual(cfg.FAIL_EASE_PENALTY, 0.25);
  assert.strictEqual(cfg.PERFECT_INITIAL_INTERVAL_REP0, 2);
  assert.strictEqual(cfg.PERFECT_INITIAL_INTERVAL_REP1, 4);
  assert.strictEqual(cfg.PERFECT_BONUS_MULTIPLIER, 1.2);
  assert.strictEqual(cfg.HARD_INITIAL_INTERVAL, 1);
  assert.strictEqual(cfg.HARD_MULTIPLIER, 1.2);
  assert.strictEqual(cfg.FAIL_DUE_MS, 10 * 60 * 1000);
});

// ============================================================================
// TEST 16: M46 - Tokenizer tokenizeFrenchForReorder
// ============================================================================
test('M46.1 Tokenizer: chuẩn hóa nháy, khoảng trắng, tách dấu câu, định danh token riêng, viết thường từ đầu, kiểm tra giới hạn 3-15 từ', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  // 1. "J'ai acheté une maison."
  const r1 = hub.tokenizeFrenchForReorder("J'ai acheté une maison.");
  assert.strictEqual(r1.valid, true);
  assert.strictEqual(r1.count, 4);
  assert.strictEqual(r1.punct, '.');
  assert.strictEqual(r1.tokens[0].displayText, "j'ai", "Chữ đầu 'J'ai' viết thường thành 'j'ai' để không lộ từ đầu");
  assert.strictEqual(r1.tokens[0].text, "J'ai");
  assert.strictEqual(r1.tokens[3].text, "maison");

  // 2. "Qu'est-ce que tu fais ?"
  const r2 = hub.tokenizeFrenchForReorder("Qu'est-ce que tu fais ?");
  assert.strictEqual(r2.valid, true);
  assert.strictEqual(r2.count, 4);
  assert.strictEqual(r2.punct, '?');
  assert.strictEqual(r2.tokens[0].displayText, "qu'est-ce");

  // 3. "S'il vous plaît, un café."
  const r3 = hub.tokenizeFrenchForReorder("S'il vous plaît, un café.");
  assert.strictEqual(r3.valid, true);
  assert.strictEqual(r3.count, 5);
  assert.strictEqual(r3.punct, '.');
  assert.strictEqual(r3.tokens[0].displayText, "s'il");

  // 4. "peut-être" (1 token < 3) -> không hợp lệ
  const r4 = hub.tokenizeFrenchForReorder("peut-être");
  assert.strictEqual(r4.valid, false);
  assert.strictEqual(r4.reason, 'too_short');

  // 5. Câu có hai từ trùng "de": "Il a dit de venir de bonne heure."
  const r5 = hub.tokenizeFrenchForReorder("Il a dit de venir de bonne heure.");
  assert.strictEqual(r5.valid, true);
  assert.strictEqual(r5.count, 8);
  assert.strictEqual(r5.tokens[3].text, "de");
  assert.strictEqual(r5.tokens[5].text, "de");
  assert.notStrictEqual(r5.tokens[3].id, r5.tokens[5].id, "Hai từ 'de' phải có id riêng biệt ('tok_3' và 'tok_5')");

  // 6. "Oui, merci." (2 tokens < 3) -> không hợp lệ
  const r6 = hub.tokenizeFrenchForReorder("Oui, merci.");
  assert.strictEqual(r6.valid, false);
  assert.strictEqual(r6.reason, 'too_short');

  // 7. Câu > 15 tokens: "Pas le temps de faire la grasse matinée quand on a des enfants en bas âge." (16 tokens)
  const r7 = hub.tokenizeFrenchForReorder("Pas le temps de faire la grasse matinée quand on a des enfants en bas âge.");
  assert.strictEqual(r7.valid, false);
  assert.strictEqual(r7.reason, 'too_long');
  assert.strictEqual(r7.count, 16);

  // 8. Tên riêng đầu câu giữ nguyên chữ hoa: "Paris est magnifique."
  const r8 = hub.tokenizeFrenchForReorder("Paris est magnifique.");
  assert.strictEqual(r8.valid, true);
  assert.strictEqual(r8.tokens[0].displayText, "Paris", "Tên riêng Paris phải giữ nguyên chữ hoa");

  // 9. Dấu nháy cong ’ chuẩn hóa thành '
  const r9 = hub.tokenizeFrenchForReorder("C’est la vie.");
  assert.strictEqual(r9.valid, true);
  assert.strictEqual(r9.tokens[0].text, "C'est");
});

// ============================================================================
// TEST 17: M46 - buildReorderSession với dữ liệu thật yt-aMx0d42wzBs.txt
// ============================================================================
test('M46.2 buildReorderSession: lọc đúng điều kiện 3-15 từ, công tắc reps, và chọn ngẫu nhiên ví dụ hợp lệ', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;
  const SchemaV02 = require('./schema-v02.js');
  const fileContent = fs.readFileSync(path.join(__dirname, '../backup/yt-aMx0d42wzBs.txt'), 'utf-8');
  const staged = SchemaV02.stageMultiSourceImport([{ fileName: 'yt-aMx0d42wzBs.txt', content: fileContent }]);
  const committed = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, []);
  const realItems = committed.updatedVocabList;

  // 1. Khi bật includeLowReps: tất cả 37 thẻ đều có ví dụ hợp lệ 3-15 từ
  const s1 = hub.buildReorderSession(realItems, { includeLowReps: true });
  assert.strictEqual(s1.eligibleCount, 37, 'Toàn bộ 37 thẻ phải đủ điều kiện sắp xếp câu');
  assert.strictEqual(s1.questions.length, 10, 'Phiên session tối đa 10 câu');
  assert.ok(s1.questions[0].tokens.length >= 3 && s1.questions[0].tokens.length <= 15);
  assert.ok(s1.questions[0].shuffledTokens.length === s1.questions[0].tokens.length);

  // 2. Khi tắt includeLowReps (thẻ mới nạp reps = 0 < 2): 0 thẻ đủ điều kiện
  const s2 = hub.buildReorderSession(realItems, { includeLowReps: false });
  assert.strictEqual(s2.eligibleCount, 0);
  assert.strictEqual(s2.skippedLowReps, 37);
  assert.strictEqual(s2.questions.length, 0);
});

// ============================================================================
// TEST 18: M46 - Chấm điểm, so sánh chuỗi ghép và hiển thị token đúng/sai
// ============================================================================
test('M46.3 Chấm điểm & so sánh: ghép chuỗi, chấp nhận 2 token trùng chữ ở vị trí tương đương, đánh dấu correct-pos / misplaced-pos', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;
  const state = hub._state;

  const mockItem = {
    id: 'test_reorder_1',
    text: 'venir',
    examples: [{ fr: 'Il a dit de venir de bonne heure.', vi: 'Anh ấy bảo đến sớm.' }]
  };

  hub.open('all', null, 'reorder');
  state.questions = hub.buildReorderSession([mockItem], { includeLowReps: true }).questions;
  state.currentIndex = 0;
  hub.renderReorderQuestion();

  const q = state.questions[0];
  const expectedTokens = q.tokens;

  // Ca 1: Ghép đúng 100% (dùng token đúng thứ tự)
  state.reorderSelectedTokens = [...expectedTokens];
  state.reorderBankTokens = [];
  hub.handleReorderSubmit();

  assert.strictEqual(state.answered, true, 'Đã chấm câu');
  assert.strictEqual(state.score, 10, 'Đúng được cộng 10 điểm');
  const fbOk = sandbox.document.getElementById('vph-reorder-feedback');
  assert.match(fbOk.innerHTML, /Chính xác/, 'Feedback hiện Chính xác');

  // Ca 2: Câu có 2 từ 'de' ('tok_3' và 'tok_5'). Đổi chỗ 2 token này cho nhau:
  // Chuỗi ghép vẫn là "Il a dit de venir de bonne heure" -> Vẫn PHẢI CHẤM ĐÚNG!
  state.answered = false;
  state.score = 0;
  const swappedTokens = [...expectedTokens];
  const tok3 = swappedTokens[3];
  const tok5 = swappedTokens[5];
  assert.strictEqual(tok3.text, 'de');
  assert.strictEqual(tok5.text, 'de');
  swappedTokens[3] = tok5;
  swappedTokens[5] = tok3;

  state.reorderSelectedTokens = swappedTokens;
  state.reorderBankTokens = [];
  hub.handleReorderSubmit();

  assert.strictEqual(state.answered, true);
  assert.strictEqual(state.score, 10, 'Đổi chỗ hai từ trùng chữ vẫn được chấm đúng vì chuỗi ghép khớp chuẩn');

  const answerZoneEl = sandbox.document.getElementById('vph-reorder-answer-zone');
  assert.ok(!answerZoneEl.innerHTML.includes('misplaced-pos'), 'Không có token nào bị đánh dấu misplaced-pos');
  assert.ok(answerZoneEl.innerHTML.includes('correct-pos'), 'Cả hai token de và các token khác đều có class correct-pos');

  // Ca 3: Ghép sai thứ tự -> báo sai, hiện câu chuẩn
  state.answered = false;
  state.score = 0;
  const wrongOrderTokens = [...expectedTokens].reverse();
  state.reorderSelectedTokens = wrongOrderTokens;
  state.reorderBankTokens = [];
  hub.handleReorderSubmit();

  assert.strictEqual(state.answered, true);
  assert.strictEqual(state.score, 0, 'Sai không được điểm');
  assert.strictEqual(state.wrongList.length, 1);
  const fbWrong = sandbox.document.getElementById('vph-reorder-feedback');
  assert.match(fbWrong.innerHTML, /Chưa chính xác/);
  assert.match(fbWrong.innerHTML, /Il a dit de venir de bonne heure\./);

  hub.close();
});

// ============================================================================
// TEST 19: M46 - Xử lý phím Enter & Chặn chấm khi chưa đặt đủ token
// ============================================================================
test('M46.4 Enter key sequence: chưa đủ token thì báo "Chưa đủ từ" và không chấm; đủ token thì chấm và sang câu tiếp', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;
  const state = hub._state;

  const mockItem = {
    id: 'test_reorder_2',
    text: 'maison',
    examples: [{ fr: "J'ai acheté một maison.", vi: 'Tôi đã mua một ngôi nhà.' }]
  };

  hub.open('all', null, 'reorder');
  state.questions = hub.buildReorderSession([mockItem], { includeLowReps: true }).questions;
  state.currentIndex = 0;
  hub.renderReorderQuestion();

  const submitBtn = sandbox.document.getElementById('vph-reorder-submit-btn');

  // 1. Chưa chọn từ nào -> bấm Enter
  hub.handleReorderKeydown({ key: 'Enter', preventDefault() {} });

  assert.strictEqual(state.answered, false, 'Chưa đặt đủ token tuyệt đối KHÔNG được đánh dấu answered');
  assert.strictEqual(state.reorderCanAdvance, false);
  const fb1 = sandbox.document.getElementById('vph-reorder-feedback');
  assert.match(fb1.innerHTML, /Chưa đủ từ/, 'Hiện thông báo cảnh báo "Chưa đủ từ"');
  assert.match(submitBtn.innerHTML, /Kiểm tra/, 'Nhãn nút vẫn là Kiểm tra');

  // 2. Chọn một nửa số token -> bấm Enter
  state.reorderSelectedTokens = [state.reorderCurrentTokens[0]];
  hub.handleReorderKeydown({ key: 'Enter', preventDefault() {} });

  assert.strictEqual(state.answered, false, 'Vẫn chưa đủ token -> không chấm');
  assert.match(fb1.innerHTML, /Chưa đủ từ/);

  // 3. Chọn đủ tất cả token -> bấm Enter (Lần 1: Chấm điểm)
  state.reorderSelectedTokens = [...state.reorderCurrentTokens];
  state.reorderBankTokens = [];
  hub.handleReorderKeydown({ key: 'Enter', preventDefault() {} });

  assert.strictEqual(state.answered, true, 'Đã đặt đủ token -> Enter chấm bài');
  assert.strictEqual(state.reorderCanAdvance, true);
  assert.match(submitBtn.innerHTML, /Câu tiếp theo/, 'Nhãn nút chuyển sang Câu tiếp theo (Enter)');

  // 4. Enter lần 2: chuyển sang câu tiếp theo
  const mockItem2 = {
    id: 'test_reorder_2b',
    text: 'porte',
    examples: [{ fr: "Fermez la porte s'il vous plaît.", vi: 'Làm ơn đóng cửa lại.' }]
  };
  state.questions = hub.buildReorderSession([mockItem, mockItem2], { includeLowReps: true }).questions;
  state.currentIndex = 0;
  state.answered = true;
  state.reorderCanAdvance = true;
  hub.handleReorderKeydown({ key: 'Enter', preventDefault() {} });
  assert.strictEqual(state.currentIndex, 1, 'Enter lần 2 chuyển sang câu 2');

  // 5. Kiểm tra bảo vệ bộ gõ tiếng Việt (isComposing / repeat)
  state.answered = false;
  hub.handleReorderKeydown({ key: 'Enter', isComposing: true, preventDefault() {} });
  assert.strictEqual(state.answered, false, 'isComposing bị bỏ qua');

  hub.handleReorderKeydown({ key: 'Enter', repeat: true, preventDefault() {} });
  assert.strictEqual(state.answered, false, 'repeat bị bỏ qua');

  hub.close();
});

// ============================================================================
// TEST 20: M46 - Thao tác phím số 1–9 và Backspace
// ============================================================================
test('M46.5 Bàn phím desktop: phím 1–9 chọn token trong Word Bank, Backspace lùi token', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;
  const state = hub._state;

  const mockItem = {
    id: 'test_reorder_3',
    text: 'café',
    examples: [{ fr: "Je voudrais un café.", vi: 'Tôi muốn một ly cà phê.' }]
  };

  hub.open('all', null, 'reorder');
  state.questions = hub.buildReorderSession([mockItem], { includeLowReps: true }).questions;
  state.currentIndex = 0;
  hub.renderReorderQuestion();

  const total = state.reorderBankTokens.length;
  assert.strictEqual(total, 4);

  // 1. Nhấn phím '1': chọn token đầu tiên trong Word Bank
  const firstTokenId = state.reorderBankTokens[0].id;
  hub.handleReorderKeydown({ key: '1', preventDefault() {} });

  assert.strictEqual(state.reorderSelectedTokens.length, 1);
  assert.strictEqual(state.reorderSelectedTokens[0].id, firstTokenId);
  assert.strictEqual(state.reorderBankTokens.length, total - 1);

  // 2. Nhấn phím '2': chọn token thứ 2 trong số token còn lại
  const secondTokenId = state.reorderBankTokens[1].id;
  hub.handleReorderKeydown({ key: '2', preventDefault() {} });

  assert.strictEqual(state.reorderSelectedTokens.length, 2);
  assert.strictEqual(state.reorderSelectedTokens[1].id, secondTokenId);
  assert.strictEqual(state.reorderBankTokens.length, total - 2);

  // 3. Nhấn phím Backspace: lùi token vừa chọn
  hub.handleReorderKeydown({ key: 'Backspace', preventDefault() {} });

  assert.strictEqual(state.reorderSelectedTokens.length, 1, 'Lùi 1 token về lại Word Bank');
  assert.strictEqual(state.reorderBankTokens.length, total - 1);

  hub.close();
});

// ============================================================================
// TEST 21: M46 - Gợi ý đa mức & Tính toán thuật toán SM-2 (skills.reorder)
// ============================================================================
test('M46.6 Gợi ý & SM-2: mức 0 thưởng ease +0.10, mức 1 giữ ease, mức 2 gần trượt (giữ reps/interval, ease -0.10), mức 3 tính sai', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  // 1. Mức 0 (Không gợi ý): Đúng hoàn hảo -> ease +0.10, reps + 1
  const s0 = { ease: 2.5, interval: 0, reps: 0 };
  const r0 = hub.reorderSkillCompute(s0, true, 0);
  assert.strictEqual(r0.ease, 2.60, 'ease tăng +0.10 khi đúng hoàn toàn');
  assert.strictEqual(r0.reps, 1);
  assert.strictEqual(r0.interval, 2, 'Lần 1 interval = 2 ngày');

  // Lần 2 đúng không gợi ý
  const r0_2 = hub.reorderSkillCompute(r0, true, 0);
  assert.strictEqual(r0_2.ease, 2.70);
  assert.strictEqual(r0_2.reps, 2);
  assert.strictEqual(r0_2.interval, 4, 'Lần 2 interval = 4 ngày');

  // 2. Mức 1 (Đánh số mờ 1-2 từ đầu): ease giữ nguyên (+0.00), reps + 1
  const s1 = { ease: 2.5, interval: 4, reps: 2 };
  const r1 = hub.reorderSkillCompute(s1, true, 1);
  assert.strictEqual(r1.ease, 2.50, 'ease giữ nguyên khi dùng gợi ý mức 1');
  assert.strictEqual(r1.reps, 3);
  assert.strictEqual(r1.interval, Math.round(4 * 1.2), 'interval tăng nhẹ theo HINT1_MULTIPLIER');

  // 3. Mức 2 (Ghim 50% từ đầu): Gần trượt (khớp bài dịch: giữ nguyên reps và interval, ease -0.10)
  const s2 = { ease: 2.5, interval: 7, reps: 3 };
  const r2 = hub.reorderSkillCompute(s2, true, 2);
  assert.strictEqual(r2.ease, 2.40, 'ease bị trừ 0.10 khi gần trượt');
  assert.strictEqual(r2.reps, 3, 'reps GIỮ NGUYÊN khi gần trượt');
  assert.strictEqual(r2.interval, 7, 'interval GIỮ NGUYÊN khi gần trượt');

  // 4. Mức 3 (Xem câu mẫu tiếng Pháp): Tính là Xem đáp án (sai / fail)
  const s3 = { ease: 2.5, interval: 7, reps: 3 };
  const r3 = hub.reorderSkillCompute(s3, true, 3);
  assert.strictEqual(r3.ease, 2.25, 'ease bị trừ 0.25');
  assert.strictEqual(r3.reps, 0, 'reps reset về 0');
  assert.strictEqual(r3.interval, 0, 'interval reset về 0');
  assert.ok(r3.due > Date.now(), 'Lên lịch ôn lại sau 10 phút');

  // 5. Trả lời sai (isCorrect = false): Tính là fail
  const rFail = hub.reorderSkillCompute(s3, false, 0);
  assert.strictEqual(rFail.ease, 2.25);
  assert.strictEqual(rFail.reps, 0);
  assert.strictEqual(rFail.interval, 0);

  // 6. Gợi ý mức 2 nhưng vẫn sắp sai (isCorrect = false): Tính là FAIL (không được tính gần trượt)
  const r2Wrong = hub.reorderSkillCompute(s2, false, 2);
  assert.strictEqual(r2Wrong.reps, 0, 'Sắp sai ở mức 2 vẫn bị reset reps = 0');
  assert.strictEqual(r2Wrong.interval, 0, 'Sắp sai ở mức 2 bị reset interval = 0');
  assert.strictEqual(r2Wrong.ease, 2.25, 'Sắp sai ở mức 2 bị phạt ease FAIL (-0.25)');
  assert.ok(r2Wrong.due > Date.now(), 'Lên lịch ôn lại sau 10 phút');

  // 7. Đặt lại mức gợi ý (state.reorderHintLevel = 0) khi sang câu tiếp theo
  hub.open('all', null, 'reorder');
  hub._state.reorderHintLevel = 2;
  hub.renderReorderQuestion();
  assert.strictEqual(hub._state.reorderHintLevel, 0, 'reorderHintLevel phải đặt lại về 0 cho câu kế tiếp');
  hub.close();
});

// ============================================================================
// TEST 22: M46 - REORDER_SM2_CONFIG cấu hình đầy đủ
// ============================================================================
test('M46.7 REORDER_SM2_CONFIG: gom đủ tất cả hằng số cấu hình SM-2 sắp xếp câu ở đầu file', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  assert.ok(hub.REORDER_SM2_CONFIG, 'REORDER_SM2_CONFIG phải tồn tại');
  const cfg = hub.REORDER_SM2_CONFIG;

  assert.strictEqual(cfg.MIN_RECOGNITION_REPS, 2);
  assert.strictEqual(cfg.DEFAULT_INCLUDE_LOW_REPS, true);
  assert.strictEqual(cfg.MIN_TOKENS, 3);
  assert.strictEqual(cfg.MAX_TOKENS, 15);
  assert.strictEqual(cfg.DEFAULT_EASE, 2.5);
  assert.strictEqual(cfg.MIN_EASE, 1.3);
  assert.strictEqual(cfg.MAX_EASE, 2.8);
  assert.strictEqual(cfg.PERFECT_EASE_BONUS, 0.10);
  assert.strictEqual(cfg.NEAR_FAIL_EASE_PENALTY, 0.10);
  assert.strictEqual(cfg.FAIL_EASE_PENALTY, 0.25);
  assert.strictEqual(cfg.PERFECT_INITIAL_INTERVAL_REP0, 2);
  assert.strictEqual(cfg.PERFECT_INITIAL_INTERVAL_REP1, 4);
  assert.strictEqual(cfg.PERFECT_BONUS_MULTIPLIER, 1.2);
  assert.strictEqual(cfg.HINT1_MULTIPLIER, 1.2);
  assert.strictEqual(cfg.FAIL_DUE_MS, 10 * 60 * 1000);
});

// ============================================================================
// TEST 23: M46.8 - Bảo toàn item.srs (so sánh sâu không đổi)
// ============================================================================
test('M46.8 Bảo toàn item.srs: kiểm tra so sánh sâu trước/sau khi chấm ở mọi ca (đúng, sai, gợi ý 1, 2, 3)', () => {
  const { sandbox } = createPracticeContext();
  const hub = sandbox.VocabPracticeHub;

  const originalSrs = {
    reps: 5,
    interval: 12,
    ease: 2.6,
    due: 1730000000000,
    lastReview: 1729000000000
  };

  const testItem = {
    id: 'srs_preserve_test',
    text: 'maison',
    srs: JSON.parse(JSON.stringify(originalSrs)),
    skills: {}
  };

  sandbox.localStorage.setItem('shadowing_saved_vocab_v1', JSON.stringify([testItem]));

  function getPersisted() {
    return JSON.parse(sandbox.localStorage.getItem('shadowing_saved_vocab_v1'))[0];
  }

  // 1. Chấm đúng hoàn toàn không gợi ý (hint 0)
  hub.updateItemReorderSkill('srs_preserve_test', true, 0);
  assert.deepStrictEqual(getPersisted().srs, originalSrs, 'item.srs không đổi khi đúng hint 0');
  assert.strictEqual(getPersisted().skills.reorder.reps, 1);

  // 2. Chấm đúng với gợi ý mức 1
  hub.updateItemReorderSkill('srs_preserve_test', true, 1);
  assert.deepStrictEqual(getPersisted().srs, originalSrs, 'item.srs không đổi khi đúng hint 1');

  // 3. Chấm đúng với gợi ý mức 2
  hub.updateItemReorderSkill('srs_preserve_test', true, 2);
  assert.deepStrictEqual(getPersisted().srs, originalSrs, 'item.srs không đổi khi đúng hint 2');

  // 4. Xem câu mẫu mức 3
  hub.updateItemReorderSkill('srs_preserve_test', true, 3);
  assert.deepStrictEqual(getPersisted().srs, originalSrs, 'item.srs không đổi khi hint 3');

  // 5. Trả lời sai (isCorrect = false)
  hub.updateItemReorderSkill('srs_preserve_test', false, 0);
  assert.deepStrictEqual(getPersisted().srs, originalSrs, 'item.srs không đổi khi sai');
});
