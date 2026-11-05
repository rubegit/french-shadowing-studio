const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Tạo môi trường giả lập cho test
function createEnv() {
  const windowObj = {
    screen: { width: 1024, height: 768 }
  };
  const globalMock = {
    window: windowObj,
    document: {
      addEventListener: () => {},
      documentElement: { dataset: {} }
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    getLocalHistory: () => []
  };

  const code = fs.readFileSync(path.join(__dirname, '../js/01-core.js'), 'utf8');
  // Chạy trong function với context giả lập
  const fn = new Function('window', 'document', 'localStorage', 'getLocalHistory', code);
  fn(windowObj, globalMock.document, globalMock.localStorage, globalMock.getLocalHistory);

  return windowObj;
}

test('M1.1: resolveVocabAudioTiming định vị chính xác từ nằm ở cuối câu (ví dụ se promener)', () => {
  const win = createEnv();

  const words = [
    { word: 'Hélène', startTime: 175.71, endTime: 176.0 },
    { word: 'et', startTime: 176.0, endTime: 176.1 },
    { word: 'Judith', startTime: 176.1, endTime: 176.4 },
    { word: 'se', startTime: 176.4, endTime: 176.6 },
    { word: 'rencontrent', startTime: 176.6, endTime: 177.0 },
    { word: 'par', startTime: 177.0, endTime: 177.2 },
    { word: 'hasard', startTime: 177.2, endTime: 177.5 },
    { word: 'dans', startTime: 177.5, endTime: 177.7 },
    { word: 'la', startTime: 177.7, endTime: 177.8 },
    { word: 'rue', startTime: 177.8, endTime: 178.0 },
    { word: 'pendant', startTime: 178.0, endTime: 178.3 },
    { word: "qu'elles", startTime: 178.3, endTime: 178.6 },
    { word: 'se', startTime: 178.6, endTime: 178.9 },
    { word: 'promènent.', startTime: 178.9, endTime: 179.4 }
  ];

  const fakeSentences = [
    {
      id: 1,
      startTime: 175.71,
      endTime: 179.4,
      text: "Hélène et Judith se rencontrent par hasard dans la rue pendant qu'elles se promènent.",
      words: words
    }
  ];

  // Thẻ từ "se promener" nhưng mốc t đang lưu là đầu câu (175.71)
  const itemPromener = {
    id: 'vocab-promener',
    text: 'se promener',
    en: "pendant qu'elles se promènent",
    videoId: '7wUXSXZgNlU',
    t: 175.71
  };

  const timing = win.resolveVocabAudioTiming(itemPromener, { sentences: fakeSentences });

  // Phải bắt đầu tua từ quanh chữ "pendant" (178.0 - 0.35 = 177.65)
  assert.ok(timing.startTime >= 177.0 && timing.startTime <= 178.0, `Start time phải gần đoạn 'pendant' (nhận được: ${timing.startTime})`);
  // Thời lượng phát phải đủ dài để bao phủ hết chữ 'promènent' (kết thúc ở 179.4)
  const playEnd = timing.startTime + timing.duration;
  assert.ok(playEnd >= 179.4, `Thời điểm kết thúc phát (${playEnd}) phải vượt qua hoặc bằng mốc kết thúc câu (179.4)`);
  assert.strictEqual(timing.exactWord, true);
});

test('M1.2: resolveVocabAudioTiming định vị đúng từ nằm ở đầu câu (se rencontrer)', () => {
  const win = createEnv();

  const words = [
    { word: 'Hélène', startTime: 175.71, endTime: 176.0 },
    { word: 'et', startTime: 176.0, endTime: 176.1 },
    { word: 'Judith', startTime: 176.1, endTime: 176.4 },
    { word: 'se', startTime: 176.4, endTime: 176.6 },
    { word: 'rencontrent', startTime: 176.6, endTime: 177.0 },
    { word: 'par', startTime: 177.0, endTime: 177.2 },
    { word: 'hasard', startTime: 177.2, endTime: 177.5 },
    { word: 'dans', startTime: 177.5, endTime: 177.7 },
    { word: 'la', startTime: 177.7, endTime: 177.8 },
    { word: 'rue', startTime: 177.8, endTime: 178.0 },
    { word: 'pendant', startTime: 178.0, endTime: 178.3 },
    { word: "qu'elles", startTime: 178.3, endTime: 178.6 },
    { word: 'se', startTime: 178.6, endTime: 178.9 },
    { word: 'promènent.', startTime: 178.9, endTime: 179.4 }
  ];

  const fakeSentences = [
    {
      id: 1,
      startTime: 175.71,
      endTime: 179.4,
      text: "Hélène et Judith se rencontrent par hasard dans la rue pendant qu'elles se promènent.",
      words: words
    }
  ];

  const itemRencontrer = {
    id: 'vocab-rencontrer',
    text: 'se rencontrer',
    en: 'Hélène et Judith se rencontrent par hasard',
    videoId: '7wUXSXZgNlU',
    t: 175.71
  };

  const timing = win.resolveVocabAudioTiming(itemRencontrer, { sentences: fakeSentences });

  // Bắt đầu gần 175.36 - 175.71
  assert.ok(timing.startTime >= 175.0 && timing.startTime <= 176.0);
  // Bao trùm hết cụm "hasard" (~177.5)
  const playEnd = timing.startTime + timing.duration;
  assert.ok(playEnd >= 177.5, `Kết thúc phát (${playEnd}) phải qua chữ 'hasard' (~177.5)`);
});

test('M1.3: Dò tỷ lệ thời gian khi câu phụ đề không có mảng words', () => {
  const win = createEnv();

  const fakeSentences = [
    {
      id: 1,
      startTime: 10.0,
      endTime: 20.0,
      text: 'Ceci est le début de la phrase et voilà la fin magnifique.'
    }
  ];

  const itemLate = {
    id: 'vocab-late',
    text: 'magnifique',
    en: 'voilà la fin magnifique',
    videoId: 'vid123',
    t: 10.0
  };

  const timing = win.resolveVocabAudioTiming(itemLate, { sentences: fakeSentences });

  // Từ nằm ở nửa sau câu (cụm bắt đầu ở ký tự thứ 31/58)
  assert.ok(timing.startTime > 13.0, `startTime (${timing.startTime}) phải dời về sau chứ không đứng ở 10.0`);
  assert.ok(timing.startTime + timing.duration >= 20.0, 'Phải phát đến hết câu');
});

test('M1.4: Fallback khi không tìm thấy video hoặc câu', () => {
  const win = createEnv();

  const itemUnknown = {
    id: 'vocab-unknown',
    text: 'mot',
    en: 'un mot quelconque',
    videoId: 'vid-unknown',
    t: 5.5,
    duration: 3.2
  };

  const timing = win.resolveVocabAudioTiming(itemUnknown, { sentences: [] });
  assert.strictEqual(timing.startTime, 5.5);
  assert.strictEqual(timing.duration, 3.2);
});

test('M2.1: Text-First matching giải quyết chính xác trường hợp C\'est parti ! không bị bắt nhầm câu trước', () => {
  const win = createEnv();

  // Câu 1 kết thúc ở 16.20, câu 2 bắt đầu ở 16.23
  const fakeSentences = [
    {
      id: 1,
      startTime: 11.0,
      endTime: 16.20,
      text: "Aujourd'hui, on va vous présenter les verbes pronominaux avec des petites histoires.",
      words: [
        { word: "Aujourd'hui,", startTime: 11.0, endTime: 12.0 },
        { word: 'histoires.', startTime: 15.5, endTime: 16.20 }
      ]
    },
    {
      id: 2,
      startTime: 16.23,
      endTime: 21.77,
      text: "C'est parti!",
      words: [
        { word: "C'est", startTime: 16.23, endTime: 16.60 },
        { word: 'parti!', startTime: 16.60, endTime: 17.20 }
      ]
    }
  ];

  // Thẻ C'est parti ! mốc t = 16.0s (rơi vào phạm vi 16.20 +/- 0.5s của câu 1)
  const itemParti = {
    id: 'vocab-parti',
    text: "C'est parti !",
    en: "C'est parti!",
    videoId: '7wUXSXZgNlU',
    t: 16.0
  };

  const timing = win.resolveVocabAudioTiming(itemParti, { sentences: fakeSentences });

  // Phải bắt đúng câu 2 (16.23), TUYỆT ĐỐI không bắt câu 1 (11.0)
  assert.ok(timing.startTime >= 15.8 && timing.startTime <= 16.6, `Start time phải ở mốc C'est parti (nhận được: ${timing.startTime})`);
  assert.strictEqual(timing.exactWord, true);
});

test('M2.2: Text-First matching giải quyết trường hợp se balader không bị bắt nhầm câu liền kề trước đó', () => {
  const win = createEnv();

  const fakeSentences = [
    {
      id: 1,
      startTime: 181.0,
      endTime: 183.4,
      text: 'Ça va, et toi ?',
      words: [
        { word: 'Ça', startTime: 181.0, endTime: 181.5 },
        { word: 'toi', startTime: 182.8, endTime: 183.4 }
      ]
    },
    {
      id: 2,
      startTime: 183.60,
      endTime: 191.51,
      text: "Après avoir pris des nouvelles l'une de l'autre, elles partent se balader ensemble.",
      words: [
        { word: 'Après', startTime: 183.60, endTime: 184.2 },
        { word: 'avoir', startTime: 184.2, endTime: 184.7 },
        { word: 'pris', startTime: 184.7, endTime: 185.1 },
        { word: 'des', startTime: 185.1, endTime: 185.3 },
        { word: 'nouvelles', startTime: 185.3, endTime: 186.0 },
        { word: "l'une", startTime: 186.0, endTime: 186.4 },
        { word: 'de', startTime: 186.4, endTime: 186.6 },
        { word: "l'autre,", startTime: 186.6, endTime: 187.2 },
        { word: 'elles', startTime: 187.2, endTime: 187.6 },
        { word: 'partent', startTime: 187.6, endTime: 188.1 },
        { word: 'se', startTime: 188.1, endTime: 188.4 },
        { word: 'balader', startTime: 188.4, endTime: 189.1 },
        { word: 'ensemble.', startTime: 189.1, endTime: 190.0 }
      ]
    }
  ];

  // Thẻ se balader có mốc t = 183.60
  const itemBalader = {
    id: 'vocab-balader',
    text: 'se balader',
    en: 'elles partent se balader ensemble.',
    videoId: '7wUXSXZgNlU',
    t: 183.60
  };

  const timing = win.resolveVocabAudioTiming(itemBalader, { sentences: fakeSentences });

  // Phải nhảy đến đoạn 'elles partent se balader' (~187s), không được bắt ở đầu câu (183.6s) hay câu trước (181s)
  assert.ok(timing.startTime >= 186.5 && timing.startTime <= 187.5, `Start time phải bắt đầu ở đoạn 'elles partent' (~187s, nhận được: ${timing.startTime})`);
  assert.ok(timing.startTime + timing.duration >= 190.0, 'Thời lượng phải phủ hết chữ ensemble.');
  assert.strictEqual(timing.exactWord, true);
});

test('M2.3: smartHighlightInContext bôi sáng thông minh cho dạng chia, số nhiều và lệch hs/he', () => {
  // Nạp 01g-vocab-list.js vào môi trường giả lập
  const code = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');
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
  const win = {
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { href: 'http://localhost' }
  };
  const doc = {
    documentElement: { dataset: {} },
    addEventListener: () => {},
    getElementById: () => dummyEl,
    querySelector: () => dummyEl,
    querySelectorAll: () => [],
    createElement: () => dummyEl
  };
  win.document = doc;

  const fn = new Function('window', 'document', 'localStorage', code);
  fn(win, doc, win.localStorage);

  const smartHl = win.smartHighlightInContext;
  assert.ok(typeof smartHl === 'function', 'smartHighlightInContext phải được xuất ra window');

  // 1. C'est parti ! trong C'est parti! (khác khoảng trắng trước !)
  const hl1 = smartHl("C'est parti!", "C'est parti !", 0, 0);
  assert.ok(hl1.includes('<mark class="vocab-hl">C\'est parti</mark>'), 'Phải bôi sáng C\'est parti');

  // 2. point épineux trong points épineux (số ít vs số nhiều)
  const hl2 = smartHl('et même sur tous les autres points épineux de la grammaire', 'point épineux', 0, 0);
  assert.ok(hl2.includes('<mark class="vocab-hl">points épineux</mark>'), 'Phải bôi sáng points épineux');

  // 3. prendre des nouvelles trong Après avoir pris des nouvelles (quá khứ pris)
  const hl3 = smartHl("Après avoir pris des nouvelles l'une de l'autre", 'prendre des nouvelles', 0, 0);
  assert.ok(hl3.includes('<mark class="vocab-hl">pris des nouvelles</mark>'), 'Phải bôi sáng pris des nouvelles');

  // 4. se balader với hs=62, he=72 bị lệch vượt quá độ dài chuỗi 33 ký tự (phản thân chỉ tô động từ nòng cốt balader)
  const hl4 = smartHl('elles partent se balader ensemble.', 'se balader', 62, 72);
  assert.ok(hl4.includes('<mark class="vocab-hl">balader</mark>') || hl4.includes('<mark class="vocab-hl">se balader</mark>'), 'Phải bôi đúng chữ balader, không được văng ra đuôi câu');

  // 5. se faire du café trong elle se fait du café (ngôi elle)
  const hl5 = smartHl('elle se fait du café et se prépare un bon petit déjeuner.', 'se faire du café', 0, 0);
  assert.ok(hl5.includes('<mark class="vocab-hl">se fait du café</mark>'), 'Phải bôi đúng se fait du café');
});
