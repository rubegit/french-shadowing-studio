// tools/punct-manual-merge.test.js
// Kiểm tra tính năng "Ghép toàn bộ chữ chuẩn" (mergeManualIntoAsr) cho phụ đề video,
// kiểm tra việc bảo toàn userPunct cho video ngoài YouTube trong saveToLocalHistory,
// và kiểm tra prompt Song ngữ sau khi ghép chữ chuẩn.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

class MockHTMLInputElement {}
Object.defineProperty(MockHTMLInputElement.prototype, 'value', {
  configurable: true,
  get() { return this._value || ''; },
  set(v) { this._value = v; }
});

const dummyEl = {
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  appendChild: () => {},
  removeChild: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => dummyEl,
  querySelectorAll: () => [],
  setAttribute: () => {},
  getAttribute: () => null,
  closest: () => dummyEl,
  textContent: '',
  innerHTML: '',
  value: '',
  scrollTop: 0
};

function createSubtitlesEnv() {
  const filePath = path.join(__dirname, '..', 'js', '01c-subtitles.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    setTimeout, clearTimeout,
    HTMLInputElement: MockHTMLInputElement,
    window: { addEventListener: () => {}, removeEventListener: () => {} }
  };
  const fn = new Function('sandbox', 'with(sandbox) {\n' + code + '\n return { mergeManualIntoAsr, aicPlainTranscript }; }');
  return fn(sandbox);
}

function createPlayerEnv() {
  const codeSub = fs.readFileSync(path.join(__dirname, '..', 'js', '01c-subtitles.js'), 'utf8');
  const codePlayer = fs.readFileSync(path.join(__dirname, '..', 'js', '01d-player.js'), 'utf8');

  let store = {};
  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; }
    },
    categoryStructure: {},
    hiddenVideoMap: {},
    videoMetadataMap: {},
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
    selectCategoryVideo: () => {},
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
    parseYouTubeId: () => null,
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
    setTimeout, clearTimeout,
    HTMLInputElement: MockHTMLInputElement,
    window: { ensureYouTubeIframeApi: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
  };

  const fn = new Function('sandbox', 'with(sandbox) {\n' + codeSub + '\n' + codePlayer + '\n return { saveToLocalHistory, getLocalHistory, isLibraryVideo, setUserPunctVid: (v) => { userPunctVid = v; } }; }');
  return fn(sandbox);
}

function createAiEnv() {
  const codeSub = fs.readFileSync(path.join(__dirname, '..', 'js', '01c-subtitles.js'), 'utf8');
  const codeAi = fs.readFileSync(path.join(__dirname, '..', 'js', '01e-translate-ai.js'), 'utf8');

  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    sentences: [],
    currentVideoId: '',
    currentVideoTitle: '',
    isTextMode: false,
    subtitleFormat: 'srt',
    settings: { bilingual: false },
    searchQuery: '',
    document: {
      body: dummyEl,
      createElement: () => dummyEl,
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    window: { addEventListener: () => {}, removeEventListener: () => {} }
  };

  const fn = new Function('sandbox', 'with(sandbox) {\n' + codeSub + '\n' + codeAi + '\n return { aiBuildPrompt, setSentences: (s) => { sentences = s; }, aiApplyManualMerge }; }');
  return fn(sandbox);
}

test('Test 1: saveToLocalHistory cho phép lưu userPunct và userPunctAt cho video ngoài YouTube (isLib = false)', () => {
  const { saveToLocalHistory, getLocalHistory, isLibraryVideo } = createPlayerEnv();
  const vid = '-4p0fngSbUs';
  const now = Date.now();

  assert.equal(isLibraryVideo(vid), false, 'Video -4p0fngSbUs không phải video thư viện');

  // Lưu history với userPunct: true
  saveToLocalHistory({
    videoId: vid,
    title: 'Easy French 67',
    sentences: [{ id: 1, text: 'test', words: [{ word: 'test', startTime: 0, endTime: 1 }] }],
    userPunct: true,
    userPunctAt: now
  });

  const hist = getLocalHistory();
  const item = hist.find((h) => h.videoId === vid);
  assert.ok(item, 'Item phải được lưu trong local history');
  assert.equal(item.userPunct, true, 'userPunct phải là true kể cả khi !isLib');
  assert.equal(item.userPunctAt, now, 'userPunctAt phải được bảo toàn kể cả khi !isLib');
});

test('Test 2: mergeManualIntoAsr thay thế toàn bộ chữ theo bản transcript chuẩn cho video Easy French 67', () => {
  const { mergeManualIntoAsr, aicPlainTranscript } = createSubtitlesEnv();

  // Mock ASR có các từ nghe nhầm của YouTube
  const rawAsr = [
    'Bonjour! Bienvenue dans un nouvel épisode des French.',
    'On se rend dans un boulanger ou éventuellement dans un magasin plus important,',
    'et ensuite on paye concept baguette en fonction du prix qui est octroyé par la boulangerie.',
    'je j\'vais vous prendre le bail est, s\'il vous plaît.',
    'Bonjour, j\'aimerais acheter un poisson it bags.',
    'Merci beaucoup d\'avoir regardé l\'autre épisode daisy French,',
    'Merci, à bientôt.'
  ];

  let t = 0;
  const mockSents = rawAsr.map((line, idx) => {
    const words = line.split(/\s+/).filter(Boolean).map((w) => ({ word: w, startTime: t, endTime: (t += 0.5) }));
    return { id: idx + 1, startTime: words[0].startTime, endTime: words[words.length - 1].endTime, text: line, words };
  });

  const correctedText = [
    'Bonjour ! Bienvenue dans un nouvel épisode d\'Easy French.',
    'On se rend dans une boulangerie ou éventuellement dans un magasin plus important,',
    'et ensuite on paye pour cette baguette en fonction du prix qui est octroyé par la boulangerie.',
    'Bonjour, j\'vais vous prendre une baguette, s\'il vous plaît.',
    'Bonjour, j\'aimerais acheter un croissant et une baguette, s\'il vous plaît.',
    'Merci beaucoup d\'avoir regardé notre épisode d\'Easy French,',
    'Merci, à bientôt.'
  ].join('\n');

  const res = mergeManualIntoAsr(mockSents, correctedText);
  assert.equal(res.ok, true, 'mergeManualIntoAsr phải thành công');

  const plain = aicPlainTranscript(res.sentences);

  // Phải có chữ đúng
  assert.ok(plain.includes("d'Easy French"), "Phải chứa d'Easy French");
  assert.ok(plain.includes('une boulangerie'), 'Phải chứa une boulangerie');
  assert.ok(plain.includes('pour cette baguette'), 'Phải chứa pour cette baguette');
  assert.ok(plain.includes('une baguette'), 'Phải chứa une baguette');
  assert.ok(plain.includes('un croissant et une baguette'), 'Phải chứa un croissant et une baguette');

  // Không còn chữ sai
  assert.equal(plain.includes('des French'), false, 'Không còn des French');
  assert.equal(plain.includes('concept baguette'), false, 'Không còn concept baguette');
  assert.equal(plain.includes('bail est'), false, 'Không còn bail est');
  assert.equal(plain.includes('poisson it bags'), false, 'Không còn poisson it bags');
  assert.equal(plain.includes('daisy French'), false, 'Không còn daisy French');
});

test('Test 3: aiBuildPrompt("trans-player") xuất ra văn bản tiếng Pháp đã sửa sau khi ghép chữ chuẩn', () => {
  const { aiBuildPrompt, setSentences } = createAiEnv();

  const mockSents = [
    {
      id: 1,
      startTime: 0,
      endTime: 2,
      words: [
        { word: 'Bonjour,', startTime: 0, endTime: 0.5 },
        { word: "j'aimerais", startTime: 0.5, endTime: 1.0 },
        { word: 'acheter', startTime: 1.0, endTime: 1.5 },
        { word: 'un', startTime: 1.5, endTime: 1.7 },
        { word: 'croissant', startTime: 1.7, endTime: 2.0 }
      ]
    }
  ];

  setSentences(mockSents);
  const prompt = aiBuildPrompt('trans-player');

  assert.ok(prompt.includes('<<<'), 'Prompt có khối <<<');
  assert.ok(prompt.includes('>>>'), 'Prompt có khối >>>');
  assert.ok(prompt.includes("Bonjour, j'aimerais acheter un croissant"), 'Prompt chứa câu tiếng Pháp đã sửa');
  assert.equal(prompt.includes('poisson it bags'), false, 'Prompt không chứa lỗi ASR cũ');
});
