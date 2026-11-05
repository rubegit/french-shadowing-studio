const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function createEnv() {
  const windowObj = {
    screen: { width: 1024, height: 768 }
  };
  const globalMock = {
    window: windowObj,
    document: {
      addEventListener: () => {},
      documentElement: { dataset: {} },
      getElementById: (id) => null,
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    getLocalHistory: () => []
  };

  const code = fs.readFileSync(path.join(__dirname, '../js/01-core.js'), 'utf8');
  const fn = new Function('window', 'document', 'localStorage', 'getLocalHistory', code);
  fn(windowObj, globalMock.document, globalMock.localStorage, globalMock.getLocalHistory);

  return windowObj;
}

test('M15a.1: isArticleVideoId & cleanArticleDocId nhận diện chính xác các tiền tố bài báo', () => {
  const win = createEnv();
  const { isArticleVideoId, cleanArticleDocId } = win;

  // Nhận diện bài báo / văn bản
  assert.strictEqual(isArticleVideoId('txt_1f173g2qb'), true, 'txt_ phải được nhận diện là bài báo');
  assert.strictEqual(isArticleVideoId('local:txt_1f173g2qb'), true, 'local:txt_ phải được nhận diện là bài báo');
  assert.strictEqual(isArticleVideoId('yt:local:txt_1f173g2qb'), true, 'yt:local:txt_ phải được nhận diện là bài báo');
  assert.strictEqual(isArticleVideoId('text:my_doc_1'), true, 'text: phải được nhận diện là bài báo');

  // Từ chối video YouTube thông thường
  assert.strictEqual(isArticleVideoId('aMx0d42wzBs'), false, 'ID YouTube chuẩn không phải bài báo');
  assert.strictEqual(isArticleVideoId('yt:aMx0d42wzBs'), false, 'yt:ID YouTube không phải bài báo');
  assert.strictEqual(isArticleVideoId(''), false, 'Chuỗi rỗng không phải bài báo');
  assert.strictEqual(isArticleVideoId(null), false, 'null không phải bài báo');

  // Chuẩn hóa docId sạch
  assert.strictEqual(cleanArticleDocId('txt_1f173g2qb'), 'txt_1f173g2qb');
  assert.strictEqual(cleanArticleDocId('local:txt_1f173g2qb'), 'txt_1f173g2qb');
  assert.strictEqual(cleanArticleDocId('yt:local:txt_1f173g2qb'), 'txt_1f173g2qb');
  assert.strictEqual(cleanArticleDocId('text:article_01'), 'article_01');
});

test('M15a.2: playVideoAudioSegment với bài báo không có audio blob thì gọi onError tức thì, không bị treo 10s', async () => {
  const win = createEnv();

  // Giả lập window.getArticleAudioBlob trả về null (bài báo chưa có file MP3)
  win.getArticleAudioBlob = async () => null;

  let errorReported = null;
  const start = Date.now();

  const success = await win.playVideoAudioSegment('txt_1f173g2qb', 10, 4, {
    onError: (err) => { errorReported = err; }
  });

  const durationMs = Date.now() - start;

  assert.strictEqual(success, false, 'Khi không có audio bài báo thì Promise trả về false');
  assert.strictEqual(errorReported, 'no_article_audio', 'Báo lỗi đúng mã no_article_audio');
  assert.ok(durationMs < 1000, `Phải phản hồi tức thì (< 1000ms), thời gian thực tế: ${durationMs}ms`);
});

test('M15a.3: playVideoAudioSegment với bài báo có audio blob thì phát trích đoạn và dừng đúng thời lượng', async () => {
  const win = createEnv();

  let playCalled = false;
  let pauseCalled = false;
  let simulatedTime = 5.0;

  // Giả lập audio element
  const fakeAudio = {
    currentTime: 0,
    playbackRate: 1.0,
    paused: true,
    ended: false,
    play: () => {
      playCalled = true;
      fakeAudio.paused = false;
      return Promise.resolve();
    },
    pause: () => {
      pauseCalled = true;
      fakeAudio.paused = true;
    }
  };
  Object.defineProperty(fakeAudio, 'currentTime', {
    get: () => simulatedTime,
    set: (v) => { simulatedTime = v; }
  });

  win._bgArtAudioElement = fakeAudio;
  win.getArticleAudioBlob = async () => ({
    blob: { size: 1024, type: 'audio/mpeg' }
  });

  // Mock URL.createObjectURL
  global.URL = global.URL || {};
  global.URL.createObjectURL = () => 'blob:mock-url';
  global.URL.revokeObjectURL = () => {};

  let started = false;
  let ended = false;

  const playPromise = win.playVideoAudioSegment('txt_article_mock', 5.0, 2.0, {
    onStart: () => { started = true; },
    onEnd: () => { ended = true; }
  });

  // Chờ play() được gọi
  await new Promise(r => setTimeout(r, 50));
  assert.strictEqual(playCalled, true, 'Audio element play() phải được gọi');
  assert.strictEqual(started, true, 'onStart callback phải được kích hoạt');
  assert.strictEqual(simulatedTime, 5.0, 'Phải tua đúng startTime = 5.0s');

  // Giả lập thời gian chạy vượt qua endSec = 5.0 + 2.0 = 7.0s
  simulatedTime = 7.1;

  const result = await playPromise;
  assert.strictEqual(result, true, 'Play segment hoàn thành thành công');
  assert.strictEqual(pauseCalled, true, 'Audio element pause() phải được gọi khi hết đoạn');
  assert.strictEqual(ended, true, 'onEnd callback phải được kích hoạt');
});

test('M15a.4: stopVideoAudioSegment dừng cả YouTube player và Article audio element', () => {
  const win = createEnv();

  let ytPaused = false;
  let artPaused = false;

  win._bgYtReady = true;
  win._bgYtPlayer = {
    pauseVideo: () => { ytPaused = true; }
  };
  win._bgArtAudioElement = {
    pause: () => { artPaused = true; }
  };
  win._bgArtTimer = 999;

  win.stopVideoAudioSegment();

  assert.strictEqual(ytPaused, true, 'YouTube player phải được pause');
  assert.strictEqual(artPaused, true, 'Article audio element phải được pause');
  assert.strictEqual(win._bgArtTimer, null, 'Timer phải được dọn dẹp');
});
