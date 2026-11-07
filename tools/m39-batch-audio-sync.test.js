const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('M39.1: Định nghĩa các hàm quản lý và quét hàng loạt audio trong IndexedDB', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  assert.ok(playerCode.includes('function getAllLocalArticleAudios'), 'Phải có hàm getAllLocalArticleAudios');
  assert.ok(playerCode.includes('function syncAllLocalArticleAudiosToCloud'), 'Phải có hàm syncAllLocalArticleAudiosToCloud');
  assert.ok(playerCode.includes('function markArticleAudioSynced'), 'Phải có hàm markArticleAudioSynced');
  assert.ok(playerCode.includes('window.syncAllLocalArticleAudiosToCloud = syncAllLocalArticleAudiosToCloud'), 'Phải xuất ra window.syncAllLocalArticleAudiosToCloud');
});

test('M39.2: getArticleAudioBlob tự động kích hoạt đẩy audio lên Cloud khi mở bài cũ có sẵn trong IndexedDB', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  const fnMatch = playerCode.match(/function getArticleAudioBlob\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được hàm getArticleAudioBlob');

  const body = fnMatch[0];
  assert.ok(body.includes('window.FSS_SUPABASE.uploadArticleAudio'), 'Phải gọi uploadArticleAudio khi có blob');
  assert.ok(body.includes('markArticleAudioSynced'), 'Phải đánh dấu đã sync sau khi upload thành công');
});

test('M39.3: fssManualSync và fssForcePushLocalToCloud kích hoạt đồng bộ hàng loạt file audio bài báo', () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf8');

  assert.ok(syncCode.includes('window.syncAllLocalArticleAudiosToCloud'), 'supabase-sync.js phải gọi syncAllLocalArticleAudiosToCloud');
  
  const manualSyncMatch = syncCode.match(/window\.fssManualSync\s*=\s*function\s*\([\s\S]*?\n  \};/);
  assert.ok(manualSyncMatch, 'Trích xuất được fssManualSync');
  assert.ok(manualSyncMatch[0].includes('syncAllLocalArticleAudiosToCloud'), 'fssManualSync phải đồng bộ cả audio bài báo');
});
