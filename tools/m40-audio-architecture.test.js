const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('M40.1: Xóa hoàn toàn nút xóa ✕ khỏi thanh pill audio trong sidebar', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  // Kiểm tra không còn thẻ button chứa art-side-pill-del trong renderArticleSidePanel
  assert.ok(!playerCode.includes('class="art-side-pill-del"'), 'Không được còn class art-side-pill-del');
  assert.ok(!playerCode.includes('onclick="removeCurrentArticleAudio()"'), 'Không còn nút bấm xóa audio');
});

test('M40.2: CSS theme-light.css ẩn triệt để .art-side-file-pill khi không có audio', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/theme-light.css'), 'utf8');

  // Đảm bảo không còn display: flex !important vô điều kiện cho .art-side-file-pill
  assert.ok(css.includes('.art-side-file-pill:not(.hidden):not([style*="display: none"])'), 'Chỉ flex khi không bị ẩn');
  assert.ok(css.includes('.art-side-file-pill[style*="display: none"]'), 'Có rule ẩn !important khi style display: none');
});

test('M40.3: Kiểm tra giới hạn 25MB và định dạng MP3 ở frontend và Storage upload', async () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  assert.ok(syncCode.includes('MAX_AUDIO_BYTES = 26214400'), 'Có hằng số 25MB (26214400 bytes)');
  assert.ok(syncCode.includes('vượt quá giới hạn 25MB'), 'Báo lỗi khi file quá 25MB');

  // Test giả lập hàm uploadArticleAudioToSupabase với file > 25MB
  const fnMatch = syncCode.match(/function uploadArticleAudioToSupabase\s*\([\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'Trích xuất được uploadArticleAudioToSupabase');

  const client = {};
  const currentUser = { id: 'usr_test_123' };
  const AUDIO_BUCKET = 'article-audios';
  const MAX_AUDIO_BYTES = 26214400;

  const fn = new Function('client', 'currentUser', 'AUDIO_BUCKET', 'MAX_AUDIO_BYTES', 'docId', 'fileOrBlob', 'fileName', `
    ${fnMatch[0]}
    return uploadArticleAudioToSupabase(docId, fileOrBlob, fileName);
  `);

  // Ca 1: File quá 25MB
  const hugeFile = { size: 30 * 1024 * 1024, type: 'audio/mpeg', name: 'big.mp3' };
  const resOver = await fn(client, currentUser, AUDIO_BUCKET, MAX_AUDIO_BYTES, 'txt_1', hugeFile);
  assert.equal(resOver.success, false);
  assert.ok(resOver.error.includes('25MB'), 'Phải từ chối file > 25MB');

  // Ca 2: File sai định dạng
  const wrongFile = { size: 1000, type: 'image/png', name: 'image.png' };
  const resWrong = await fn(client, currentUser, AUDIO_BUCKET, MAX_AUDIO_BYTES, 'txt_1', wrongFile);
  assert.equal(resWrong.success, false);
  assert.ok(resWrong.error.includes('.mp3'), 'Phải từ chối file không phải mp3');
});

test('M40.4: Chống ghi đè - Đường dẫn lưu trữ duy nhất theo docId', async () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  const client = {
    storage: {
      from: (bucket) => ({
        upload: async (filePath, file, opts) => ({ data: { path: filePath }, error: null })
      })
    }
  };
  const currentUser = { id: 'user_xyz' };
  const AUDIO_BUCKET = 'article-audios';
  const MAX_AUDIO_BYTES = 26214400;

  const fnMatch = syncCode.match(/function uploadArticleAudioToSupabase\s*\([\s\S]*?\n  \}/);
  const fn = new Function('client', 'currentUser', 'AUDIO_BUCKET', 'MAX_AUDIO_BYTES', 'docId', 'fileOrBlob', 'fileName', `
    ${fnMatch[0]}
    return uploadArticleAudioToSupabase(docId, fileOrBlob, fileName);
  `);

  // Hai bài khác nhau dù cùng tên file "Audio.mp3" đều có đường dẫn riêng biệt
  const file = { size: 5000, type: 'audio/mpeg', name: 'Audio.mp3' };
  const res1 = await fn(client, currentUser, AUDIO_BUCKET, MAX_AUDIO_BYTES, 'txt_doc_A', file);
  const res2 = await fn(client, currentUser, AUDIO_BUCKET, MAX_AUDIO_BYTES, 'txt_doc_B', file);

  assert.equal(res1.path, 'user_xyz/txt_doc_A.mp3');
  assert.equal(res2.path, 'user_xyz/txt_doc_B.mp3');
  assert.notEqual(res1.path, res2.path, 'Hai bài khác nhau không được trùng path');
});

test('M40.5: RLS Policies bảo vệ đầy đủ 4 thao tác INSERT, SELECT, UPDATE, DELETE', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase-schema.sql'), 'utf8');

  assert.ok(sql.includes('for insert\n  with check'), 'INSERT phải có WITH CHECK');
  assert.ok(sql.includes('for select\n  using'), 'SELECT phải có USING');
  assert.ok(sql.includes('for update\n  using (bucket_id = \'article-audios\' and auth.uid()::text = (storage.foldername(name))[1])\n  with check'), 'UPDATE phải có cả USING và WITH CHECK');
  assert.ok(sql.includes('for delete\n  using'), 'DELETE phải có USING');
  assert.ok(sql.includes('file_size_limit = 26214400'), 'Giới hạn 25MB trên Storage Bucket');
});

test('M40.6: buildTextHistoryCardHTML hiển thị chỉ báo 🎵 Audio trên thẻ bài ở trang chủ', () => {
  const catalogCode = fs.readFileSync(path.join(__dirname, '../js/01b-catalog.js'), 'utf8');

  const fnMatch = catalogCode.match(/function buildTextHistoryCardHTML\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được buildTextHistoryCardHTML');

  const escHtml = (s) => String(s || '').replace(/[&<>"']/g, '');
  const aicHasTranslation = () => false;
  const deriveTextTitle = () => 'Tiêu đề';
  const detectCefrLevel = () => null;

  const fn = new Function('item', 'escHtml', 'aicHasTranslation', 'deriveTextTitle', 'detectCefrLevel', `
    ${fnMatch[0]}
    return buildTextHistoryCardHTML(item);
  `);

  // Ca 1: Bài có audio Cloud
  const htmlWithAudio = fn({
    videoId: 'txt_1',
    title: 'Bài báo có audio',
    sentences: [],
    audio: { name: 'podcast.mp3', cloudStatus: 'available' }
  }, escHtml, aicHasTranslation, deriveTextTitle, detectCefrLevel);

  assert.ok(htmlWithAudio.includes('🎵 Audio ☁️'), 'Phải có biểu tượng 🎵 Audio ☁️');

  // Ca 2: Bài không có audio
  const htmlNoAudio = fn({
    videoId: 'txt_2',
    title: 'Bài báo thuần văn bản',
    sentences: []
  }, escHtml, aicHasTranslation, deriveTextTitle, detectCefrLevel);

  assert.ok(!htmlNoAudio.includes('🎵 Audio'), 'Bài không có audio thì không được hiện');
});

test('M40.7: Phân tách Cloud metadata và Local cache - Thiết bị B tải on-demand từ Cloud theo storage.path', async () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  let downloadedPath = null;
  const mockBlob = { size: 1024, type: 'audio/mpeg' };
  const mockClient = {
    storage: {
      from: () => ({
        download: async (p) => {
          downloadedPath = p;
          return { data: mockBlob, error: null };
        }
      })
    }
  };
  const currentUser = { id: 'usr_test_user' };

  const fnMatch = syncCode.match(/function downloadArticleAudioFromSupabase\s*\([\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'Trích xuất được downloadArticleAudioFromSupabase');

  const fn = new Function('client', 'currentUser', 'AUDIO_BUCKET', 'docId', 'customPath', `
    ${fnMatch[0]}
    return downloadArticleAudioFromSupabase(docId, customPath);
  `);

  // Thiết bị B đọc metadata Cloud từ Thiết bị A đã lưu
  const cloudItemFromDeviceA = {
    videoId: 'txt_article_456',
    audio: {
      name: 'le_monde.mp3',
      storage: {
        provider: 'supabase',
        bucket: 'article-audios',
        path: 'usr_test_user/txt_article_456.mp3'
      },
      cloudStatus: 'available'
    }
  };

  const res = await fn(mockClient, currentUser, 'article-audios', cloudItemFromDeviceA.videoId, cloudItemFromDeviceA.audio.storage.path);
  assert.equal(downloadedPath, 'usr_test_user/txt_article_456.mp3', 'Thiết bị B phải tải đúng đường dẫn lưu trữ từ Cloud metadata');
  assert.equal(res, mockBlob, 'Nhận đúng dữ liệu blob để cache vào IndexedDB của thiết bị B');
});

test('M40.8: Reconciliation tự động khôi phục metadata sau reload nếu history update từng thất bại', () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };

  // Giả lập lịch sử hiện tại chưa có audio metadata
  const initialHistory = [{ videoId: 'txt_doc_reconcile', title: 'Bài kiểm thử' }];
  mockLocalStorage.setItem('fss_history', JSON.stringify(initialHistory));

  // Giả lập sự cố: Storage upload thành công nhưng history update gặp lỗi -> lưu vào fss_pending_audio_meta
  const pendingMeta = {
    name: 'test_audio.mp3',
    size: 2048,
    mimeType: 'audio/mpeg',
    storage: { provider: 'supabase', bucket: 'article-audios', path: 'user_1/txt_doc_reconcile.mp3' },
    cloudStatus: 'available',
    updatedAt: new Date().toISOString()
  };
  mockLocalStorage.setItem('fss_pending_audio_meta', JSON.stringify({
    'txt_doc_reconcile': pendingMeta
  }));

  // Đọc mã player.js và trích xuất hàm reconcilePendingAudioMetadata
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');
  const fnMatch = playerCode.match(/function reconcilePendingAudioMetadata\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được reconcilePendingAudioMetadata');

  let syncTriggered = false;
  const mockWindow = {
    FSS_SUPABASE: {
      syncHistoryDebounced: () => { syncTriggered = true; }
    }
  };

  const fn = new Function('localStorage', 'STORAGE_KEY', 'getRawHistory', 'window', `
    ${fnMatch[0]}
    reconcilePendingAudioMetadata();
  `);

  fn(mockLocalStorage, 'fss_history', () => JSON.parse(mockLocalStorage.getItem('fss_history') || '[]'), mockWindow);

  // Kiểm tra sau khi reload / reconcile:
  const updatedHistory = JSON.parse(mockLocalStorage.getItem('fss_history'));
  assert.ok(updatedHistory[0].audio, 'Bài viết đã được khôi phục metadata audio');
  assert.equal(updatedHistory[0].audio.cloudStatus, 'available');
  assert.equal(updatedHistory[0].audio.storage.path, 'user_1/txt_doc_reconcile.mp3');

  // Hàng chờ pending đã được giải phóng
  const remainingPending = JSON.parse(mockLocalStorage.getItem('fss_pending_audio_meta'));
  assert.equal(remainingPending['txt_doc_reconcile'], undefined, 'Pending item đã được xóa sau khi reconcile');
  assert.equal(syncTriggered, true, 'Đã kích hoạt đồng bộ Cloud sau khi khôi phục');
});

test('M40.9: Báo lỗi Supabase Storage thực tế (Bucket not found / RLS / Network) không nuốt lỗi', async () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  const fnMatch = syncCode.match(/function uploadArticleAudioToSupabase\s*\([\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'Trích xuất được uploadArticleAudioToSupabase');

  const currentUser = { id: 'usr_abc' };
  const AUDIO_BUCKET = 'article-audios';
  const MAX_AUDIO_BYTES = 26214400;

  const fn = new Function('client', 'currentUser', 'AUDIO_BUCKET', 'MAX_AUDIO_BYTES', 'docId', 'fileOrBlob', 'fileName', `
    ${fnMatch[0]}
    return uploadArticleAudioToSupabase(docId, fileOrBlob, fileName);
  `);

  // Giả lập server Supabase trả về lỗi "bucket not found"
  const clientBucketError = {
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Bucket not found' } })
      })
    }
  };

  const resError = await fn(clientBucketError, currentUser, AUDIO_BUCKET, MAX_AUDIO_BYTES, 'txt_123', { size: 1000, type: 'audio/mpeg' }, 'audio.mp3');
  assert.equal(resError.success, false, 'Phải đánh dấu thất bại khi server lỗi');
  assert.ok(resError.error.includes('Supabase chưa tạo bucket "article-audios"'), 'Báo lỗi chi tiết hướng dẫn chạy SQL tạo bucket');
});

test('M40.10: QuotaExceededError - Bảo toàn metadata qua sessionStorage/fallback và đẩy in-memory lên Cloud', () => {
  const sessionStore = {};
  const mockSessionStorage = {
    getItem: (k) => sessionStore[k] || null,
    setItem: (k, v) => { sessionStore[k] = String(v); },
    removeItem: (k) => { delete sessionStore[k]; }
  };

  // Giả lập localStorage bị đầy hoàn toàn: ném QuotaExceededError
  const mockLocalStorage = {
    getItem: () => null,
    setItem: () => {
      const err = new Error('The quota has been exceeded.');
      err.name = 'QuotaExceededError';
      throw err;
    }
  };

  const rawHistory = [{ videoId: 'txt_doc_quota', title: 'Bài viết test quota' }];
  let syncedRawList = null;

  const mockWindow = {
    FSS_SUPABASE: {
      syncHistoryDebounced: (list) => {
        syncedRawList = list;
      }
    }
  };

  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');
  const fnUpdateMatch = playerCode.match(/function updateArticleAudioMetadata\s*\([\s\S]*?\n    \}/);
  const fnSaveMatch = playerCode.match(/function savePendingAudioReconciliation\s*\([\s\S]*?\n    \}/);
  assert.ok(fnUpdateMatch && fnSaveMatch, 'Trích xuất được updateArticleAudioMetadata và savePendingAudioReconciliation');

  const fn = new Function('localStorage', 'sessionStorage', 'STORAGE_KEY', 'getRawHistory', 'window', 'getArtAudioDb', `
    ${fnSaveMatch[0]}
    ${fnUpdateMatch[0]}
    return updateArticleAudioMetadata;
  `);

  const updateFn = fn(mockLocalStorage, mockSessionStorage, 'fss_history', () => rawHistory, mockWindow, () => Promise.resolve({ transaction: () => ({ objectStore: () => ({ get: () => ({}) }) }) }));

  const audioMeta = {
    name: 'safe_audio.mp3',
    size: 5000,
    mimeType: 'audio/mpeg',
    storage: { provider: 'supabase', bucket: 'article-audios', path: 'user/txt_doc_quota.mp3' },
    cloudStatus: 'available'
  };

  // Thực thi cập nhật khi localStorage bị lỗi Quota
  assert.doesNotThrow(() => {
    updateFn('txt_doc_quota', audioMeta);
  }, 'Không được làm sập ứng dụng khi localStorage bị QuotaExceededError');

  // Xác minh 1: Metadata được bảo toàn an toàn qua fallback (sessionStorage)
  const pendingInSession = JSON.parse(sessionStore['fss_pending_audio_meta'] || '{}');
  assert.ok(pendingInSession['txt_doc_quota'], 'Metadata phải được giữ lại trong pending reconciliation fallback');
  assert.equal(pendingInSession['txt_doc_quota'].name, 'safe_audio.mp3');

  // Xác minh 2: Vẫn gửi danh sách raw trong bộ nhớ lên Cloud thành công
  assert.ok(syncedRawList, 'Phải gửi mảng raw trong bộ nhớ lên Cloud');
  assert.equal(syncedRawList[0].audio.cloudStatus, 'available');
});

test('M40.11: Tự động khôi phục và đồng bộ lại khi kết nối mạng phục hồi hoặc reload sau lỗi push', () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  const fnMatch = syncCode.match(/function mergeHistoryLists\s*\([\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'Trích xuất được mergeHistoryLists');

  const fn = new Function(`
    ${fnMatch[0]}
    return mergeHistoryLists;
  `);

  const mergeFn = fn();

  // Ca 1: Local đã lưu audio nhưng push Cloud thất bại -> Cloud chưa có audio
  const localHistory = [{
    videoId: 'txt_offline_art',
    updatedAt: 2000,
    audio: {
      name: 'voice.mp3',
      storage: { provider: 'supabase', bucket: 'article-audios', path: 'usr/txt_offline_art.mp3' },
      cloudStatus: 'available'
    }
  }];

  const cloudHistory = [{
    videoId: 'txt_offline_art',
    updatedAt: 1000
    // Chưa có audio
  }];

  const res = mergeFn(localHistory, cloudHistory);

  // Khi mạng phục hồi hoặc reload, applySmartMerge kiểm tra hasLocalNew:
  assert.equal(res.hasLocalNew, true, 'Phải đánh dấu hasLocalNew = true để kích hoạt pushAllDataToCloud');
  assert.ok(res.merged[0].audio, 'Bản ghi gộp phải bảo toàn audio metadata');
  assert.equal(res.merged[0].audio.name, 'voice.mp3');

  // Ca 2: Ngay cả khi Cloud updatedAt mới hơn (ví dụ sửa tiêu đề ở máy khác), audio của Local vẫn không bị mất và kích hoạt đồng bộ
  const cloudNewerWithoutAudio = [{
    videoId: 'txt_offline_art',
    updatedAt: 3000,
    title: 'Tiêu đề sửa từ máy khác'
  }];

  const res2 = mergeFn(localHistory, cloudNewerWithoutAudio);
  assert.equal(res2.hasLocalNew, true, 'Vẫn phải đánh dấu hasLocalNew khi local có audio mà Cloud chưa có');
  assert.ok(res2.merged[0].audio, 'Audio metadata vẫn được giữ vững');
});
