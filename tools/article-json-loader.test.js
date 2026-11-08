/**
 * tools/article-json-loader.test.js
 * Kiểm thử tính năng nạp file JSON & Trợ lý AI sửa cấu trúc cho Đọc báo (Module M18)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Trích xuất các hàm logic thẩm định và sinh prompt từ js/01d-player.js
function validateAiSyncJson(data) {
  if (!data) return { ok: false, reason: 'Dữ liệu JSON rỗng' };
  const items = Array.isArray(data) ? data : (data.sentences || data.subtitles || data.cues || []);
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, reason: 'JSON không chứa danh sách các câu (cần mảng array hoặc thuộc tính "sentences")' };
  }
  const sample = items[0];
  if (!sample || typeof sample !== 'object') {
    return { ok: false, reason: 'Các phần tử trong danh sách không phải đối tượng câu' };
  }
  const hasText = sample.text != null || sample.sentence != null || sample.t != null || sample.words != null;
  const hasTime = sample.startTime != null || sample.start != null || (Array.isArray(sample.words) && sample.words[0] && sample.words[0].startTime != null);
  if (!hasText) {
    return { ok: false, reason: 'Thiếu trường nội dung câu ("text") trong các phần tử' };
  }
  if (!hasTime) {
    return { ok: false, reason: 'Thiếu mốc thời gian phát âm ("startTime" hoặc "start") trong các phần tử' };
  }
  return { ok: true, items };
}

function generateAiSyncFixPrompt(rawJsonStr) {
  const truncated = (rawJsonStr || '').length > 3000 ? rawJsonStr.slice(0, 3000) + '\n... (đã cắt ngắn dữ liệu)' : rawJsonStr;
  return `Tôi có một file JSON chứa phụ đề/timestamps nhưng cấu trúc hiện tại chưa đúng với chuẩn của French Shadowing Studio.

YÊU CẦU:
Hãy chuyển đổi dữ liệu JSON dưới đây sang ĐÚNG cấu trúc JSON chuẩn của French Shadowing Studio (chỉ trả về DUY NHẤT khối mã JSON, không thêm bất kỳ lời chào hay giải thích nào khác):

[CẤU TRÚC CHUẨN MẪU]:
[
  {
    "id": 1,
    "startTime": 0.00,
    "endTime": 3.20,
    "text": "Nội dung câu tiếng Pháp.",
    "words": [
      { "word": "Từ1", "startTime": 0.00, "endTime": 0.60 },
      { "word": "Từ2", "startTime": 0.65, "endTime": 1.10 }
    ]
  }
]

[DỮ LIỆU CẦN CHUYỂN ĐỔI]:
${truncated}`;
}

function validateArticleJson(data) {
  if (!data) return { ok: false, reason: 'Dữ liệu JSON rỗng' };
  if (typeof data === 'string') {
    const t = data.trim();
    return t ? { ok: true, text: t, title: '', sentences: null } : { ok: false, reason: 'Chuỗi JSON rỗng' };
  }
  if (Array.isArray(data)) {
    if (!data.length) return { ok: false, reason: 'Mảng JSON rỗng' };
    const text = data.map(item => (typeof item === 'string' ? item : (item.text || item.sentence || item.t || ''))).filter(Boolean).join('\n\n');
    if (!text.trim()) return { ok: false, reason: 'Mảng JSON không chứa văn bản câu tiếng Pháp nào' };
    const hasTimings = data.some(item => typeof item === 'object' && item && (item.startTime != null || item.start != null));
    return { ok: true, text: text.trim(), title: '', sentences: hasTimings ? data : null };
  }
  if (typeof data === 'object') {
    const title = String(data.title || data.name || data.heading || '').trim();
    let text = String(data.text || data.content || data.body || data.article || '').trim();
    let sentences = null;
    if (Array.isArray(data.sentences) && data.sentences.length) {
      if (!text) {
        text = data.sentences.map(s => (typeof s === 'string' ? s : (s.text || s.sentence || s.t || ''))).filter(Boolean).join('\n\n');
      }
      sentences = data.sentences;
    }
    if (!text.trim()) {
      return { ok: false, reason: 'File JSON không có các trường nội dung bài báo: "text", "content" hoặc "sentences"' };
    }
    return { ok: true, text: text.trim(), title, sentences };
  }
  return { ok: false, reason: 'Định dạng JSON không tương thích' };
}

function generateArticleJsonFixPrompt(rawJsonStr) {
  const truncated = (rawJsonStr || '').length > 3000 ? rawJsonStr.slice(0, 3000) + '\n... (đã cắt ngắn dữ liệu)' : rawJsonStr;
  return `Tôi có một file JSON chứa nội dung bài báo/bài đọc tiếng Pháp nhưng cấu trúc chưa khớp với chuẩn của French Shadowing Studio.

YÊU CẦU:
Hãy chuyển đổi dữ liệu JSON dưới đây sang ĐÚNG cấu trúc JSON chuẩn của French Shadowing Studio (chỉ trả về DUY NHẤT khối mã JSON, không thêm lời chào hay giải thích):

[CẤU TRÚC CHUẨN MẪU]:
{
  "title": "Tiêu đề bài báo tiếng Pháp",
  "text": "Toàn bộ nội dung bài báo tiếng Pháp được phân tách thành các đoạn hoặc các câu...",
  "sentences": [
    { "text": "Câu tiếng Pháp thứ nhất..." },
    { "text": "Câu tiếng Pháp thứ hai..." }
  ]
}

[DỮ LIỆU CẦN CHUYỂN ĐỔI]:
${truncated}`;
}

test('M18.1 AI Sync Validator: Phê duyệt JSON chuẩn có timestamps và nhận diện đúng lỗi cấu trúc', () => {
  // Ca 1: Chuẩn FSS
  const valid = [
    {
      id: 1,
      startTime: 0.0,
      endTime: 3.5,
      text: "Bonjour la France.",
      words: [{ word: "Bonjour", startTime: 0.0, endTime: 1.0 }]
    }
  ];
  const res1 = validateAiSyncJson(valid);
  assert.equal(res1.ok, true);
  assert.equal(res1.items.length, 1);

  // Ca 2: Sai cấu trúc - thiếu timestamps
  const noTime = [
    { text: "Chỉ có text nhưng không có startTime hay endTime" }
  ];
  const res2 = validateAiSyncJson(noTime);
  assert.equal(res2.ok, false);
  assert.ok(res2.reason.includes('startTime'));

  // Ca 3: Sai cấu trúc - thiếu text
  const noText = [
    { startTime: 0.0, endTime: 2.0 }
  ];
  const res3 = validateAiSyncJson(noText);
  assert.equal(res3.ok, false);
  assert.ok(res3.reason.includes('text'));
});

test('M18.2 AI Sync Fixer Prompt: Sinh prompt chuẩn hóa chứa mẫu FSS và dữ liệu gốc', () => {
  const badJson = JSON.stringify({ myCustomCaptions: ["Hello", "World"] }, null, 2);
  const prompt = generateAiSyncFixPrompt(badJson);
  assert.ok(prompt.includes('[CẤU TRÚC CHUẨN MẪU]'));
  assert.ok(prompt.includes('"startTime"'));
  assert.ok(prompt.includes('"words"'));
  assert.ok(prompt.includes('myCustomCaptions'));
});

test('M18.3 Article JSON Validator: Trích xuất chuẩn xác các biến thể bài báo và từ chối file lạ', () => {
  // Ca 1: Object chuẩn { title, text }
  const art1 = {
    title: "Le Figaro - Économie",
    text: "L'inflation ralentit en zone euro."
  };
  const res1 = validateArticleJson(art1);
  assert.equal(res1.ok, true);
  assert.equal(res1.title, "Le Figaro - Économie");
  assert.equal(res1.text, "L'inflation ralentit en zone euro.");

  // Ca 2: Object có mảng sentences kèm timestamps
  const art2 = {
    title: "TV5 - Culture",
    sentences: [
      { text: "Le festival de Cannes débute.", startTime: 0.0, endTime: 2.5 },
      { text: "Plusieurs films sont en compétition.", startTime: 2.6, endTime: 5.0 }
    ]
  };
  const res2 = validateArticleJson(art2);
  assert.equal(res2.ok, true);
  assert.equal(res2.title, "TV5 - Culture");
  assert.ok(res2.text.includes("Le festival de Cannes débute."));
  assert.equal(res2.sentences.length, 2);

  // Ca 3: File lạ không có bài báo (ví dụ config server)
  const badArt = {
    port: 8080,
    database: "postgres",
    debug: true
  };
  const res3 = validateArticleJson(badArt);
  assert.equal(res3.ok, false);
  assert.ok(res3.reason.includes('nội dung bài báo'));
});

test('M18.4 Article Fixer Prompt: Sinh prompt chuẩn hóa bài báo chứa schema { title, text, sentences }', () => {
  const badJson = JSON.stringify({ unformatted_article: "C'est un test." });
  const prompt = generateArticleJsonFixPrompt(badJson);
  assert.ok(prompt.includes('[CẤU TRÚC CHUẨN MẪU]'));
  assert.ok(prompt.includes('"title"'));
  assert.ok(prompt.includes('"sentences"'));
  assert.ok(prompt.includes('unformatted_article'));
});

test('M18.5 Giao diện & Template HTML: Chứa đầy đủ các nút nạp file JSON và hộp trợ giúp AI (Body-Level Portal M45B2)', () => {
  const modalArticleHtml = fs.readFileSync(path.resolve('partials/modal-article.html'), 'utf-8');
  const homeHtml = fs.readFileSync(path.resolve('partials/view-home.html'), 'utf-8');
  const srcIndexHtml = fs.readFileSync(path.resolve('src/index.src.html'), 'utf-8');
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. AI Sync modal trong partials/modal-article.html (Body-Level Portal)
  assert.ok(modalArticleHtml.includes('id="art-sync-file-input"'), 'Modal có input nạp file');
  assert.ok(modalArticleHtml.includes('id="art-sync-ai-fix-box"'), 'Modal có box hỗ trợ sửa AI');
  assert.ok(modalArticleHtml.includes('copyArtAiSyncFixPrompt()'), 'Modal có hàm copy prompt AI');

  // 2. Article Input trong partials/view-home.html
  assert.ok(homeHtml.includes('id="text-json-input"'), 'Nhập bài báo có input file JSON');
  assert.ok(homeHtml.includes('id="text-json-ai-fix-box"'), 'Nhập bài báo có box hỗ trợ sửa AI');
  assert.ok(homeHtml.includes('copyTextJsonFixPrompt()'), 'Nhập bài báo có hàm copy prompt AI');

  // 3. src/index.src.html include đúng partial mới
  assert.ok(srcIndexHtml.includes('<!-- @include partials/modal-article.html -->'), 'src/index.src.html include partials/modal-article.html');

  // 4. index.html sau build đồng bộ đầy đủ các modal và input
  assert.ok(indexHtml.includes('id="art-sync-file-input"'), 'index.html chứa input art-sync');
  assert.ok(indexHtml.includes('id="text-json-input"'), 'index.html chứa input text-json');

  // 5. Kiểm tra tính duy nhất (không duplicate ID)
  const syncMatches = indexHtml.match(/id="modal-art-ai-sync"/g) || [];
  assert.strictEqual(syncMatches.length, 1, '#modal-art-ai-sync xuất hiện đúng một lần trong index.html');

  const levelMatches = indexHtml.match(/id="modal-art-level"/g) || [];
  assert.strictEqual(levelMatches.length, 1, '#modal-art-level xuất hiện đúng một lần trong index.html');

  const syncInputMatches = indexHtml.match(/id="art-sync-file-input"/g) || [];
  assert.strictEqual(syncInputMatches.length, 1, '#art-sync-file-input xuất hiện đúng một lần trong index.html');
});
