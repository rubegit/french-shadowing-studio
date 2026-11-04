import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function countHistoryBreakdown(list) {
  var arr = Array.isArray(list) ? list : [];
  var videos = 0;
  var articles = 0;
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    if (!item || item._deleted) continue;
    if (item.isText) {
      articles++;
    } else {
      videos++;
    }
  }
  return {
    videos: videos,
    articles: articles,
    total: videos + articles
  };
}

function formatHistoryBreakdown(list) {
  var c = countHistoryBreakdown(list);
  var parts = [];
  if (c.videos > 0) parts.push(c.videos + ' video');
  if (c.articles > 0) parts.push(c.articles + ' bài báo');
  if (parts.length === 0) return '0 bài';
  return parts.join(', ');
}

function formatHistoryBullet(list) {
  var c = countHistoryBreakdown(list);
  var parts = [];
  if (c.videos > 0) parts.push(c.videos + ' video');
  if (c.articles > 0) parts.push(c.articles + ' bài báo');
  if (parts.length === 0) return '0 bài';
  return parts.join(' &bull; ');
}

test('M-Cloud-Article.1 countHistoryBreakdown: Phân loại chính xác giữa Video (!h.isText) và Bài báo (h.isText)', () => {
  const sample = [
    { videoId: 'yt_vid_1', title: 'Video 1', isText: false },
    { videoId: 'yt_vid_2', title: 'Video 2' },
    { videoId: 'yt_vid_3', title: 'Video 3' },
    { videoId: 'doc_1', title: 'Bài báo RFI', isText: true },
    { videoId: 'doc_2', title: 'Bài báo Le Monde', isText: true },
    { videoId: 'yt_vid_del', title: 'Video đã xóa', _deleted: true }
  ];

  const counts = countHistoryBreakdown(sample);
  assert.equal(counts.videos, 3, 'Đếm đúng 3 video');
  assert.equal(counts.articles, 2, 'Đếm đúng 2 bài báo');
  assert.equal(counts.total, 5, 'Tổng cộng đúng 5 bài học active (bỏ qua _deleted)');
});

test('M-Cloud-Article.2 formatHistoryBreakdown: Định dạng chuỗi thân thiện với người dùng', () => {
  const mixed = [
    { videoId: 'v1' },
    { videoId: 'v2' },
    { videoId: 'v3' },
    { videoId: 'd1', isText: true },
    { videoId: 'd2', isText: true }
  ];
  assert.equal(formatHistoryBreakdown(mixed), '3 video, 2 bài báo');
  assert.equal(formatHistoryBullet(mixed), '3 video &bull; 2 bài báo');

  const onlyVideos = [{ videoId: 'v1' }, { videoId: 'v2' }];
  assert.equal(formatHistoryBreakdown(onlyVideos), '2 video');

  const onlyArticles = [{ videoId: 'd1', isText: true }];
  assert.equal(formatHistoryBreakdown(onlyArticles), '1 bài báo');

  const empty = [];
  assert.equal(formatHistoryBreakdown(empty), '0 bài');
});

test('M-Cloud-Article.3 Codebase Audit: js/supabase-sync.js tích hợp 4 cột KPI và các hàm phân loại', () => {
  const code = fs.readFileSync(path.resolve('js/supabase-sync.js'), 'utf-8');
  assert.ok(code.includes('countHistoryBreakdown'), 'Có hàm countHistoryBreakdown');
  assert.ok(code.includes('formatHistoryBreakdown'), 'Có hàm formatHistoryBreakdown');
  assert.ok(code.includes('grid-cols-4'), 'Modal cloud dùng layout 4 cột KPI');
  assert.ok(code.includes('hBreakdown.videos'), 'Hiển thị KPI Video riêng');
  assert.ok(code.includes('hBreakdown.articles'), 'Hiển thị KPI Bài báo riêng');
});
