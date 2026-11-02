/**
 * French Shadowing Studio - Punctuation & Word Corrections Test Suite
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

class MockHTMLInputElement {}
Object.defineProperty(MockHTMLInputElement.prototype, 'value', {
  configurable: true,
  get() { return this._value || ''; },
  set(v) { this._value = v; }
});

function createSubtitlesEnv() {
  const filePath = path.join(__dirname, '..', 'js', '01c-subtitles.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    console,
    Set,
    Map,
    Math,
    String,
    Array,
    Date,
    Infinity,
    parseFloat,
    parseInt,
    Boolean,
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    setTimeout,
    clearTimeout,
    HTMLInputElement: MockHTMLInputElement,
    window: {
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  };
  const fn = new Function('sandbox', 'with(sandbox) {\n' + code + '\n return { applyPunctuationFromAi, aicRestoreAsrOriginal, aicAdoptPunct }; }');
  return fn(sandbox);
}

test('1. Sửa từ 1:1 hợp lệ: "tu a" → "tu as" (từ ngắn trong allowlist)', () => {
  const { applyPunctuationFromAi } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 4.0, text: 'bonjour je suis content tu a raison mon ami',
      words: [
        { word: 'bonjour', startTime: 0.0, endTime: 0.5 },
        { word: 'je', startTime: 0.6, endTime: 0.8 },
        { word: 'suis', startTime: 0.9, endTime: 1.2 },
        { word: 'content', startTime: 1.3, endTime: 1.8 },
        { word: 'tu', startTime: 2.0, endTime: 2.3 },
        { word: 'a', startTime: 2.4, endTime: 2.7 },
        { word: 'raison', startTime: 2.8, endTime: 3.4 },
        { word: 'mon', startTime: 3.5, endTime: 3.7 },
        { word: 'ami', startTime: 3.8, endTime: 4.0 }
      ]
    }
  ];
  const aiText = 'Bonjour, je suis content, tu as raison mon ami.';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.ok, true, 'Xử lý thành công');
  
  const w = res.sentences[0].words[5];
  assert.strictEqual(w.word, 'as', 'Từ phải được sửa thành "as"');
  assert.strictEqual(w.asr_original, 'a', 'Giữ chữ gốc ASR là "a"');
  assert.strictEqual(w.corrected, true, 'Đánh dấu w.corrected = true');
  assert.strictEqual(res.candidateCorrections.length, 1, 'Có 1 đề xuất sửa từ');
  assert.strictEqual(res.candidateCorrections[0].asrWord, 'a');
  assert.strictEqual(res.candidateCorrections[0].aiWord, 'as');
});

test('2. Chuẩn hóa nháy âm: "cest" → "c\'est" (cùng norm_key)', () => {
  const { applyPunctuationFromAi } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 3.0, text: 'bonjour cest vrai mon ami cest clair',
      words: [
        { word: 'bonjour', startTime: 0.0, endTime: 0.5 },
        { word: 'cest', startTime: 0.6, endTime: 0.9 },
        { word: 'vrai', startTime: 1.0, endTime: 1.5 },
        { word: 'mon', startTime: 1.6, endTime: 1.8 },
        { word: 'ami', startTime: 1.9, endTime: 2.2 },
        { word: 'cest', startTime: 2.3, endTime: 2.6 },
        { word: 'clair', startTime: 2.7, endTime: 3.0 }
      ]
    }
  ];
  const aiText = 'Bonjour, c\'est vrai mon ami, c\'est clair.';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.ok, true);
  const w1 = res.sentences[0].words[1];
  assert.strictEqual(w1.word, "c'est");
  assert.strictEqual(w1.asr_original, 'cest');
  assert.strictEqual(w1.corrected, true);
});

test('3. Nối gạch nối: "est ce" → "est-ce" (gộp 2 từ ASR trùng 100% chữ cái)', () => {
  const { applyPunctuationFromAi } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 3.0, text: 'bonjour est ce que tu viens mon cher ami',
      words: [
        { word: 'bonjour', startTime: 0.0, endTime: 0.5 },
        { word: 'est', startTime: 0.6, endTime: 0.9 },
        { word: 'ce', startTime: 1.0, endTime: 1.3 },
        { word: 'que', startTime: 1.4, endTime: 1.7 },
        { word: 'tu', startTime: 1.8, endTime: 2.0 },
        { word: 'viens', startTime: 2.1, endTime: 2.4 },
        { word: 'mon', startTime: 2.5, endTime: 2.6 },
        { word: 'cher', startTime: 2.7, endTime: 2.8 },
        { word: 'ami', startTime: 2.9, endTime: 3.0 }
      ]
    }
  ];
  const aiText = 'Bonjour, est-ce que tu viens mon cher ami ?';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.ok, true);
  const wEstCe = res.sentences[0].words[1];
  assert.strictEqual(wEstCe.word, 'est-ce');
  assert.strictEqual(wEstCe.asr_original, 'est ce');
  assert.strictEqual(wEstCe.corrected, true);
  assert.strictEqual(wEstCe.startTime, 0.6);
  assert.strictEqual(wEstCe.endTime, 1.3, 'Bao trọn thời gian của cả 2 từ gốc');
});

test('4. Sửa dấu thanh tiếng Pháp: "e" → "é" (chỉ khác accents)', () => {
  const { applyPunctuationFromAi } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 3.0, text: 'il a regarde le film hier soir chez moi',
      words: [
        { word: 'il', startTime: 0.0, endTime: 0.3 },
        { word: 'a', startTime: 0.4, endTime: 0.6 },
        { word: 'regarde', startTime: 0.7, endTime: 1.2 },
        { word: 'le', startTime: 1.3, endTime: 1.5 },
        { word: 'film', startTime: 1.6, endTime: 1.9 },
        { word: 'hier', startTime: 2.0, endTime: 2.3 },
        { word: 'soir', startTime: 2.4, endTime: 2.6 },
        { word: 'chez', startTime: 2.7, endTime: 2.8 },
        { word: 'moi', startTime: 2.9, endTime: 3.0 }
      ]
    }
  ];
  const aiText = 'Il a regardé le film hier soir chez moi.';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.ok, true);
  const wRegarde = res.sentences[0].words[2];
  assert.strictEqual(wRegarde.word, 'regardé');
  assert.strictEqual(wRegarde.asr_original, 'regarde');
  assert.strictEqual(wRegarde.corrected, true);
});

test('5. Từ ngắn bị CHẶN: "le" → "la", "un" → "une"', () => {
  const { applyPunctuationFromAi } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 3.0, text: 'je vois le pomme et un table dans le salon',
      words: [
        { word: 'je', startTime: 0.0, endTime: 0.3 },
        { word: 'vois', startTime: 0.4, endTime: 0.7 },
        { word: 'le', startTime: 0.8, endTime: 1.0 },
        { word: 'pomme', startTime: 1.1, endTime: 1.5 },
        { word: 'et', startTime: 1.6, endTime: 1.8 },
        { word: 'un', startTime: 1.9, endTime: 2.1 },
        { word: 'table', startTime: 2.2, endTime: 2.5 },
        { word: 'dans', startTime: 2.6, endTime: 2.7 },
        { word: 'le', startTime: 2.8, endTime: 2.9 },
        { word: 'salon', startTime: 3.0, endTime: 3.3 }
      ]
    }
  ];
  // AI cố đổi "le" thành "la", "un" thành "une"
  const aiText = 'Je vois la pomme et une table dans le salon.';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.ok, true);
  
  const wLe = res.sentences[0].words[2];
  assert.strictEqual(wLe.word, 'le', 'Từ "le" không được đổi thành "la"');
  assert.strictEqual(wLe.corrected, undefined);

  const wUn = res.sentences[0].words[5];
  assert.strictEqual(wUn.word, 'un', 'Từ "un" không được đổi thành "une"');
  assert.strictEqual(wUn.corrected, undefined);

  assert.strictEqual(res.rejectedCorrections.length, 2, 'Có 2 đề xuất bị từ chối');
  assert.strictEqual(res.rejectedCorrections[0].asrWord, 'le');
  assert.strictEqual(res.rejectedCorrections[0].aiWord, 'la');
  assert.strictEqual(res.rejectedCorrections[1].asrWord, 'un');
  assert.strictEqual(res.rejectedCorrections[1].aiWord, 'une');
});

test('6. Tách/chèn/bỏ giữ nguyên chữ ASR', () => {
  const { applyPunctuationFromAi } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 4.0, text: 'bonjour euh je vais bien merci beaucoup mon cher ami',
      words: [
        { word: 'bonjour', startTime: 0.0, endTime: 0.5 },
        { word: 'euh', startTime: 0.6, endTime: 0.8 },
        { word: 'je', startTime: 0.9, endTime: 1.2 },
        { word: 'vais', startTime: 1.3, endTime: 1.6 },
        { word: 'bien', startTime: 1.7, endTime: 2.0 },
        { word: 'merci', startTime: 2.1, endTime: 2.4 },
        { word: 'beaucoup', startTime: 2.5, endTime: 2.8 },
        { word: 'mon', startTime: 2.9, endTime: 3.1 },
        { word: 'cher', startTime: 3.2, endTime: 3.4 },
        { word: 'ami', startTime: 3.5, endTime: 4.0 }
      ]
    }
  ];
  // AI bỏ "euh", chèn thêm từ "oui" ở đầu
  const aiText = 'Oui bonjour, je vais bien, merci beaucoup mon cher ami.';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.ok, true);
  
  // Từ "euh" mà AI bỏ vẫn phải được giữ lại
  const words = res.sentences[0].words;
  assert.strictEqual(words.some(w => w.word.startsWith('euh')), true, 'Từ "euh" của ASR vẫn được giữ lại');
  // Từ "oui" mà AI tự chèn không được chèn vào
  assert.strictEqual(words[0].word.toLowerCase().startsWith('bonjour'), true, 'Không nhận từ chèn bừa');
});

test('7. Hoàn tác từ asr_original về lại chữ gốc ASR (giữ nguyên dấu câu)', () => {
  const { applyPunctuationFromAi, aicRestoreAsrOriginal } = createSubtitlesEnv();
  const sents = [
    {
      id: 1, startTime: 0, endTime: 4.0, text: 'bonjour je suis content tu a raison mon cher ami',
      words: [
        { word: 'bonjour', startTime: 0.0, endTime: 0.5 },
        { word: 'je', startTime: 0.6, endTime: 0.8 },
        { word: 'suis', startTime: 0.9, endTime: 1.2 },
        { word: 'content', startTime: 1.3, endTime: 1.8 },
        { word: 'tu', startTime: 2.0, endTime: 2.3 },
        { word: 'a', startTime: 2.4, endTime: 2.7 },
        { word: 'raison', startTime: 2.8, endTime: 3.4 },
        { word: 'mon', startTime: 3.5, endTime: 3.6 },
        { word: 'cher', startTime: 3.7, endTime: 3.8 },
        { word: 'ami', startTime: 3.9, endTime: 4.0 }
      ]
    }
  ];
  const aiText = 'Bonjour, je suis content, tu as raison mon cher ami.';
  const res = applyPunctuationFromAi(sents, aiText, { lineChunks: false });
  assert.strictEqual(res.sentences[0].words[5].word, 'as');

  // Gọi hoàn tác
  const restored = aicRestoreAsrOriginal(res.sentences);
  const wRestored = restored[0].words[5];
  assert.strictEqual(wRestored.word, 'a', 'Đã hoàn tác về chữ "a"');
  assert.strictEqual(wRestored.corrected, undefined, 'Bỏ cờ corrected');
  assert.strictEqual(wRestored.asr_original, undefined, 'Bỏ trường asr_original');
});

test('8. aicPlainTranscript xuất mỗi câu một dòng (\\n) và generateKeyVocabPrompt giữ nguyên \\n', () => {
  const filePath = path.join(__dirname, '..', 'js', '01c-subtitles.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean, window: {} };
  const fn = new Function('sandbox', 'with(sandbox) {\n' + code + '\n return { aicPlainTranscript }; }');
  const { aicPlainTranscript } = fn(sandbox);

  const { generateKeyVocabPrompt } = require('./extract-prompt-template.js');

  const sents = [
    { id: 1, text: 'Bonjour tout le monde.' },
    { id: 2, text: 'Comment allez-vous aujourd\'hui ?' },
    { id: 3, text: 'Très bien, merci.' }
  ];

  const plain = aicPlainTranscript(sents);
  const expected = 'Bonjour tout le monde.\nComment allez-vous aujourd\'hui ?\nTrès bien, merci.';
  assert.strictEqual(plain, expected, 'aicPlainTranscript phải xuất mỗi câu một dòng (\\n)');

  const prompt = generateKeyVocabPrompt({
    videoId: 'dwt1yeNtKeQ',
    videoTitle: 'Test Video',
    transcript: plain
  });

  assert.ok(prompt.includes('<<<VAN_BAN\n' + expected + '\n>>>'), 'Prompt phải bảo toàn các dấu \\n giữa các câu');
});

test('9. F5 giả lập: video thư viện có cờ userPunct được giữ trong lịch sử và openVideo ưu tiên dùng phụ đề đã lưu', async () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); }
  };

  const dummyEl = new MockHTMLInputElement();
  Object.assign(dummyEl, {
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    innerHTML: '',
    textContent: '',
    focus: () => {},
    remove: () => {},
    appendChild: () => dummyEl,
    querySelector: () => dummyEl,
    querySelectorAll: () => [],
    closest: () => dummyEl
  });

  const codePlayer = fs.readFileSync(path.join(__dirname, '..', 'js', '01d-player.js'), 'utf8');
  let selectedCategoryVideoCalled = false;

  const sandbox = {
    console,
    Set,
    Map,
    Math,
    String,
    Array,
    Date,
    Infinity,
    parseFloat,
    parseInt,
    Boolean,
    localStorage: mockLocalStorage,
    STORAGE_KEY: 'fss_history_test',
    categoryStructure: { 'A1': { 'lib_vid_1': 'Thư viện mẫu' } },
    hiddenVideoMap: {},
    hiddenVideoList: [],
    currentVideoId: '',
    currentVideoTitle: '',
    sentences: [],
    subtitleFormat: '',
    currentSentenceIndex: 0,
    isTextMode: false,
    userTransVid: '',
    userPunctVid: '',
    pendingSeekTime: null,
    aicHasTranslation: () => false,
    aiClone: (x) => JSON.parse(JSON.stringify(x)),
    selectCategoryVideo: () => { selectedCategoryVideoCalled = true; },
    captureHomeState: () => {},
    inputUrl: dummyEl,
    startBtn: dummyEl,
    parseErrorMessage: dummyEl,
    parseErrorAlert: dummyEl,
    fileStatusBadge: dummyEl,
    checkStartReady: () => {},
    resetPlaybackTrackingState: () => {},
    initYouTubePlayer: () => {},
    renderSubtitleList: () => {},
    parseYouTubeId: (url) => (url && url.includes('lib_vid_1') ? 'lib_vid_1' : null),
    resetSubtitleSearch: () => {},
    resetBilingualForNewVideo: () => {},
    stopSubtitleLoop: () => {},
    updateActiveSentenceDisplay: () => {},
    ensurePageFocus: () => {},
    trackAndShowVideoStats: () => {},
    document: {
      body: dummyEl,
      createElement: () => dummyEl,
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    setTimeout: (fn, ms) => { if (ms && ms > 1000) return 0; return setTimeout(fn, ms); },
    clearTimeout: () => {},
    HTMLInputElement: MockHTMLInputElement,
    window: {
      ensureYouTubeIframeApi: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  };

  const fnPlayer = new Function('sandbox', 'with(sandbox) {\n' + codePlayer + '\n return { saveToLocalHistory, loadFromHistory, getLocalHistory, getUserPunctVid: () => userPunctVid }; }');
  const { saveToLocalHistory, loadFromHistory, getLocalHistory, getUserPunctVid } = fnPlayer(sandbox);
  sandbox.getLocalHistory = getLocalHistory;
  sandbox.loadFromHistory = loadFromHistory;

  // 1. Áp dụng thêm dấu câu/sửa từ cho video thư viện và lưu vào lịch sử
  const mockSentences = [
    {
      id: 1, startTime: 0, endTime: 3.0, text: 'Tu as raison mon ami.',
      words: [
        { word: 'Tu', startTime: 0, endTime: 0.5 },
        { word: 'as', asr_original: 'a', corrected: true, startTime: 0.6, endTime: 1.0 },
        { word: 'raison', startTime: 1.1, endTime: 1.8 }
      ]
    }
  ];

  saveToLocalHistory({
    videoId: 'lib_vid_1',
    title: 'Thư viện mẫu',
    duration: 120,
    format: 'json3',
    isText: false,
    sentences: mockSentences,
    userPunct: true
  });

  // 2. Kiểm tra dữ liệu được lưu trong lịch sử
  const hist = getLocalHistory();
  assert.strictEqual(hist.length, 1, 'Lịch sử có 1 mục');
  assert.strictEqual(hist[0].videoId, 'lib_vid_1');
  assert.strictEqual(hist[0].userPunct, true, 'Đã lưu cờ userPunct: true');
  assert.strictEqual(hist[0].sentences.length, 1, 'Mảng sentences không bị xóa rỗng');
  assert.strictEqual(hist[0].sentences[0].words[1].word, 'as');
  assert.strictEqual(hist[0].sentences[0].words[1].asr_original, 'a');

  // 3. Giả lập F5: openVideo tìm trong getLocalHistory rồi gọi loadFromHistory
  const codeEbook = fs.readFileSync(path.join(__dirname, '..', 'js', '01h-ebook.js'), 'utf8');
  // Trích hàm openVideo để test logic
  const matchOpenVideo = codeEbook.match(/async function openVideo\(id\) \{[\s\S]*?return false;\s*\}/);
  assert.ok(matchOpenVideo, 'Tìm thấy hàm openVideo trong 01h-ebook.js');

  const fnOpenVideo = new Function('sandbox', 'with(sandbox) {\n' + matchOpenVideo[0] + '\n return openVideo; }');
  const openVideo = fnOpenVideo(sandbox);

  sandbox.vis = (screen) => screen === 'screen-practice';

  await openVideo('lib_vid_1');

  // Kiểm tra loadFromHistory đã mở trực tiếp phụ đề đã lưu, KHÔNG tải lại từ server qua selectCategoryVideo
  assert.strictEqual(selectedCategoryVideoCalled, false, 'Không được gọi selectCategoryVideo khi đã có userPunct: true');
  assert.strictEqual(sandbox.currentVideoId, 'lib_vid_1');
  assert.strictEqual(sandbox.sentences.length, 1);
  assert.strictEqual(sandbox.sentences[0].words[1].word, 'as', 'Phụ đề đã sửa vẫn nguyên vẹn sau khi F5');
  assert.strictEqual(getUserPunctVid(), 'lib_vid_1', 'Cờ userPunctVid được khôi phục');
});

test('10. Đồng bộ Cloud đa thiết bị: mergeHistoryLists khi thiết bị B mở video thư viện (chạy cả 2 ca: local mới hơn / cloud mới hơn)', () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'supabase-sync.js'), 'utf8');
  const match = syncCode.match(/function mergeHistoryLists\(localHist, cloudHist\) \{[\s\S]*?\n  \}/);
  assert.ok(match, 'Tìm thấy mergeHistoryLists');
  const fnMerge = new Function('localHist', 'cloudHist', match[0] + '\n return mergeHistoryLists(localHist, cloudHist);');

  const sentA = [
    {
      id: 1, startTime: 0, endTime: 3.0, text: 'Tu as raison.',
      words: [
        { word: 'Tu', startTime: 0, endTime: 0.5 },
        { word: 'as', asr_original: 'a', corrected: true, startTime: 0.6, endTime: 1.0 },
        { word: 'raison', startTime: 1.1, endTime: 1.8 }
      ]
    }
  ];

  // TH1: Local B mới hơn Cloud A (B vừa mở video lúc t=2000 > t=1000, có userPunct: false)
  const cloudItem1 = {
    videoId: 'lib_vid_1', title: 'Thư viện mẫu', duration: 120, lib: true,
    sentences: sentA, userPunct: true, updatedAt: 1000
  };
  const localItemB1 = JSON.parse(JSON.stringify({
    videoId: 'lib_vid_1', title: 'Thư viện mẫu', duration: 120, lib: true,
    userPunct: false, sentences: [], updatedAt: 2000
  }));

  const res1 = fnMerge([localItemB1], [cloudItem1]);
  const itemB1 = res1.merged[0];
  const b1HasSentences = itemB1.sentences && itemB1.sentences.length > 0;
  const b1HasCorrected = b1HasSentences && itemB1.sentences[0].words[1].word === 'as' && itemB1.sentences[0].words[1].corrected === true;
  const pushBackCloud1 = res1.merged.filter(h => h && (!h.lib || h.userTrans || h.isText || (h.sentences && h.sentences.length)));
  const cloud1HasSentences = pushBackCloud1.length > 0 && pushBackCloud1[0].sentences.length > 0;

  console.log('\n--- TH1: Local B mới hơn Cloud (lUpTime = 2000 > cUpTime = 1000, local B userPunct: false) ---');
  console.log('B còn phụ đề đã sửa:', b1HasCorrected ? 'CÓ (từ: as, w.corrected=true)' : 'KHÔNG');
  console.log('B còn cờ userPunct:', itemB1.userPunct ? 'CÓ (userPunct=true)' : 'KHÔNG');
  console.log('Cloud sau khi B đẩy lại còn bản sửa:', cloud1HasSentences ? 'CÓ' : 'KHÔNG');

  assert.strictEqual(itemB1.userPunct, true, 'TH1: userPunct được bảo vệ thành true dù localItemB có userPunct: false');
  assert.strictEqual(b1HasCorrected, true, 'TH1: B nhận được sentences có w.corrected từ Cloud');
  assert.strictEqual(cloud1HasSentences, true, 'TH1: Cloud sau khi B đẩy lại vẫn còn bản sửa do có sentences');

  // TH2: Cloud A mới hơn Local B (A vừa sửa xong lúc t=2000 > t=1000, local B userPunct: false)
  const cloudItem2 = {
    videoId: 'lib_vid_1', title: 'Thư viện mẫu', duration: 120, lib: true,
    sentences: sentA, userPunct: true, updatedAt: 2000
  };
  const localItemB2 = JSON.parse(JSON.stringify({
    videoId: 'lib_vid_1', title: 'Thư viện mẫu', duration: 120, lib: true,
    userPunct: false, sentences: [], updatedAt: 1000
  }));

  const res2 = fnMerge([localItemB2], [cloudItem2]);
  const itemB2 = res2.merged[0];
  const b2HasSentences = itemB2.sentences && itemB2.sentences.length > 0;
  const b2HasCorrected = b2HasSentences && itemB2.sentences[0].words[1].word === 'as' && itemB2.sentences[0].words[1].corrected === true;
  const pushBackCloud2 = res2.merged.filter(h => h && (!h.lib || h.userTrans || h.isText || (h.sentences && h.sentences.length)));
  const cloud2HasSentences = pushBackCloud2.length > 0 && pushBackCloud2[0].sentences.length > 0;

  console.log('\n--- TH2: Cloud A mới hơn Local B (cUpTime = 2000 > lUpTime = 1000, local B userPunct: false) ---');
  console.log('B còn phụ đề đã sửa:', b2HasCorrected ? 'CÓ (từ: as, w.corrected=true)' : 'KHÔNG');
  console.log('B còn cờ userPunct:', itemB2.userPunct ? 'CÓ (userPunct=true)' : 'KHÔNG');
  console.log('Cloud sau khi B đẩy lại còn bản sửa:', cloud2HasSentences ? 'CÓ' : 'KHÔNG');

  assert.strictEqual(itemB2.userPunct, true, 'TH2: userPunct được bảo vệ thành true dù localItemB có userPunct: false');
  assert.strictEqual(b2HasCorrected, true, 'TH2: B nhận được sentences có w.corrected từ Cloud');
  assert.strictEqual(cloud2HasSentences, true, 'TH2: Cloud vẫn giữ được bản sửa');
});

test('11. Test nối tiếp: sau merge, B gọi loadFromHistory rồi saveToLocalHistory; sentences đã sửa vẫn được giữ và không bị cleanHistory loại', () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); }
  };

  const dummyEl = new MockHTMLInputElement();
  Object.assign(dummyEl, {
    addEventListener: () => {}, removeEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {}, innerHTML: '', textContent: '', focus: () => {}, remove: () => {},
    appendChild: () => dummyEl, querySelector: () => dummyEl, querySelectorAll: () => [], closest: () => dummyEl
  });

  const codePlayer = fs.readFileSync(path.join(__dirname, '..', 'js', '01d-player.js'), 'utf8');

  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    localStorage: mockLocalStorage,
    STORAGE_KEY: 'fss_history_test_11',
    categoryStructure: { 'A1': { 'lib_vid_1': 'Thư viện mẫu' } },
    hiddenVideoMap: {}, hiddenVideoList: [],
    currentVideoId: '', currentVideoTitle: '', sentences: [], subtitleFormat: '',
    currentSentenceIndex: 0, isTextMode: false, userTransVid: '', userPunctVid: '',
    pendingSeekTime: null,
    aicHasTranslation: () => false,
    aiClone: (x) => JSON.parse(JSON.stringify(x)),
    selectCategoryVideo: () => {},
    captureHomeState: () => {},
    inputUrl: dummyEl, startBtn: dummyEl, parseErrorMessage: dummyEl, parseErrorAlert: dummyEl,
    fileStatusBadge: dummyEl, checkStartReady: () => {}, resetPlaybackTrackingState: () => {},
    initYouTubePlayer: () => {}, renderSubtitleList: () => {},
    parseYouTubeId: (url) => (url && url.includes('lib_vid_1') ? 'lib_vid_1' : null),
    resetSubtitleSearch: () => {}, resetBilingualForNewVideo: () => {}, stopSubtitleLoop: () => {},
    updateActiveSentenceDisplay: () => {}, ensurePageFocus: () => {}, trackAndShowVideoStats: () => {},
    document: {
      body: dummyEl, createElement: () => dummyEl, getElementById: () => dummyEl,
      querySelector: () => dummyEl, querySelectorAll: () => [],
      addEventListener: () => {}, removeEventListener: () => {}
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0), cancelAnimationFrame: () => {},
    setTimeout: (fn, ms) => { if (ms && ms > 1000) return 0; return setTimeout(fn, ms); },
    clearTimeout: () => {},
    HTMLInputElement: MockHTMLInputElement,
    window: { ensureYouTubeIframeApi: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
  };

  const fnPlayer = new Function('sandbox', 'with(sandbox) {\n' + codePlayer + '\n return { saveToLocalHistory, loadFromHistory, getLocalHistory, getUserPunctVid: () => userPunctVid }; }');
  const { saveToLocalHistory, loadFromHistory, getLocalHistory, getUserPunctVid } = fnPlayer(sandbox);
  sandbox.getLocalHistory = getLocalHistory;
  sandbox.loadFromHistory = loadFromHistory;

  // 1. Giả lập kết quả sau mergeHistoryLists được lưu vào máy B
  const mergedItemFromCloud = {
    videoId: 'lib_vid_1',
    title: 'Thư viện mẫu',
    duration: 120,
    format: 'json3',
    isText: false,
    lib: true,
    userPunct: true,
    updatedAt: 2500,
    sentences: [
      {
        id: 1, startTime: 0, endTime: 3.0, text: 'Tu as raison.',
        words: [
          { word: 'Tu', startTime: 0, endTime: 0.5 },
          { word: 'as', asr_original: 'a', corrected: true, startTime: 0.6, endTime: 1.0 },
          { word: 'raison', startTime: 1.1, endTime: 1.8 }
        ]
      }
    ]
  };
  saveToLocalHistory(mergedItemFromCloud);

  // 2. Thiết bị B mở video này từ lịch sử (loadFromHistory)
  loadFromHistory('lib_vid_1');

  // Kiểm tra cờ và phụ đề sau khi load
  assert.strictEqual(sandbox.currentVideoId, 'lib_vid_1');
  assert.strictEqual(getUserPunctVid(), 'lib_vid_1', 'Cờ userPunctVid được khôi phục thành công');
  assert.strictEqual(sandbox.sentences.length, 1);
  assert.strictEqual(sandbox.sentences[0].words[1].word, 'as');

  // 3. Giả lập thiết bị B lưu lại lịch sử (saveToLocalHistory)
  saveToLocalHistory({
    videoId: 'lib_vid_1',
    title: 'Thư viện mẫu',
    duration: 120,
    format: 'json3',
    isText: false,
    sentences: sandbox.sentences
  });

  const updatedHist = getLocalHistory();
  assert.strictEqual(updatedHist.length, 1);
  assert.strictEqual(updatedHist[0].userPunct, true, 'Vẫn giữ cờ userPunct: true sau khi saveToLocalHistory');
  assert.strictEqual(updatedHist[0].sentences.length, 1, 'sentences không bị xóa rỗng');
  assert.strictEqual(updatedHist[0].sentences[0].words[1].word, 'as');
  assert.strictEqual(updatedHist[0].sentences[0].words[1].asr_original, 'a');

  // 4. Kiểm tra qua bộ lọc cleanHistory trước khi push lên Cloud
  const cleanHistory = updatedHist.filter(h => h && (!h.lib || h.userTrans || h.isText || (h.sentences && h.sentences.length)));
  assert.strictEqual(cleanHistory.length, 1, 'Mục video thư viện KHÔNG bị cleanHistory loại bỏ');
  assert.strictEqual(cleanHistory[0].sentences.length, 1);
});

