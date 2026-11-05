const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('M15b.1: supabase-schema.sql chứa định nghĩa bucket article-audios và RLS policies an toàn', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase-schema.sql'), 'utf8');

  assert.ok(sql.includes("'article-audios'"), 'Phải chứa tên bucket article-audios');
  assert.ok(sql.includes('26214400'), 'Giới hạn kích thước file 25MB');
  assert.ok(sql.includes("array['audio/mpeg', 'audio/mp3']"), 'Chỉ cho phép định dạng audio/mpeg, audio/mp3');

  // Kiểm tra 4 chính sách RLS
  assert.ok(sql.includes('Users can upload their own article audios'), 'Chính sách insert');
  assert.ok(sql.includes('Users can update their own article audios'), 'Chính sách update');
  assert.ok(sql.includes('Users can view their own article audios'), 'Chính sách select');
  assert.ok(sql.includes('Users can delete their own article audios'), 'Chính sách delete');
  assert.ok(sql.includes('(storage.foldername(name))[1]'), 'Cô lập dữ liệu thư mục theo auth.uid()');
});

test('M15b.2: uploadArticleAudio & downloadArticleAudio từ chối an toàn khi chưa đăng nhập', async () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  const windowObj = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    location: { origin: 'http://localhost' },
    document: {
      addEventListener: () => {},
      head: { appendChild: () => {} },
      createElement: () => ({})
    }
  };

  const fn = new Function('window', 'document', 'localStorage', syncCode);
  fn(windowObj, windowObj.document, { getItem: () => null, setItem: () => {} });

  assert.ok(windowObj.FSS_SUPABASE, 'FSS_SUPABASE phải được export lên window');
  assert.strictEqual(typeof windowObj.FSS_SUPABASE.uploadArticleAudio, 'function');
  assert.strictEqual(typeof windowObj.FSS_SUPABASE.downloadArticleAudio, 'function');

  // Khi chưa đăng nhập (client/user = null)
  const upRes = await windowObj.FSS_SUPABASE.uploadArticleAudio('txt_test_doc', { size: 100, type: 'audio/mpeg' });
  assert.strictEqual(upRes, null, 'Chưa đăng nhập thì upload trả về null an toàn');

  const downRes = await windowObj.FSS_SUPABASE.downloadArticleAudio('txt_test_doc');
  assert.strictEqual(downRes, null, 'Chưa đăng nhập thì download trả về null an toàn');
});

test('M15b.3: uploadArticleAudio & downloadArticleAudio định dạng đường dẫn chính xác và bắt lỗi êm ái', async () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  let uploadedBucket = '';
  let uploadedPath = '';
  let downloadedBucket = '';
  let downloadedPath = '';

  const mockClient = {
    storage: {
      from: (bucket) => ({
        upload: (p, file, opts) => {
          uploadedBucket = bucket;
          uploadedPath = p;
          return Promise.resolve({ data: { path: p }, error: null });
        },
        download: (p) => {
          downloadedBucket = bucket;
          downloadedPath = p;
          return Promise.resolve({ data: new Blob(['audio-data'], { type: 'audio/mpeg' }), error: null });
        }
      })
    }
  };

  const mockUser = { id: 'usr_abc_123', email: 'test@example.com' };

  const windowObj = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    location: { origin: 'http://localhost' },
    document: {
      addEventListener: () => {},
      head: { appendChild: () => {} },
      createElement: () => ({})
    }
  };

  // Nạp code với client và user giả lập
  const patchedCode = syncCode
    .replace('var client = null;', 'var client = mockClient;')
    .replace('var currentUser = null;', 'var currentUser = mockUser;');

  const fn = new Function('window', 'document', 'localStorage', 'mockClient', 'mockUser', patchedCode);
  fn(windowObj, windowObj.document, { getItem: () => null, setItem: () => {} }, mockClient, mockUser);

  // Test upload
  const mockFile = { size: 500, type: 'audio/mpeg' };
  const resUp = await windowObj.FSS_SUPABASE.uploadArticleAudio('local:txt_my_article_99', mockFile);

  assert.strictEqual(uploadedBucket, 'article-audios', 'Upload vào đúng bucket article-audios');
  assert.strictEqual(uploadedPath, 'usr_abc_123/txt_my_article_99.mp3', 'Đường dẫn phải gọt sạch tiền tố local:');
  assert.deepStrictEqual(resUp, { path: 'usr_abc_123/txt_my_article_99.mp3' });

  // Test download
  const resDown = await windowObj.FSS_SUPABASE.downloadArticleAudio('yt:local:txt_my_article_99');

  assert.strictEqual(downloadedBucket, 'article-audios', 'Download từ đúng bucket article-audios');
  assert.strictEqual(downloadedPath, 'usr_abc_123/txt_my_article_99.mp3', 'Đường dẫn download phải gọt sạch yt:local:');
  assert.ok(resDown, 'Nhận được data blob từ storage');
});
