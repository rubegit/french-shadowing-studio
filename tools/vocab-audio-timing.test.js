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
