const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('M38.1: Nhận diện CEFR từ tiêu đề và không tự ý ép mặc định B1', () => {
  const catalogCode = fs.readFileSync(path.join(__dirname, '../js/01b-catalog.js'), 'utf8');

  assert.ok(catalogCode.includes('detectCefrLevel'), 'Phải có hàm detectCefrLevel');

  // Trích xuất hàm detectCefrLevel
  const fnMatch = catalogCode.match(/function detectCefrLevel\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được detectCefrLevel');

  const fn = new Function('text', `
    ${fnMatch[0]}
    return detectCefrLevel(text);
  `);

  assert.equal(fn('Bài báo tiếng Pháp [B2] mới nhất'), 'B2');
  assert.equal(fn('Chủ đề du lịch A1 cơ bản'), 'A1');
  assert.equal(fn('Festival de Cannes (C1)'), 'C1');
  assert.equal(fn('Bài viết thông thường không có nhãn'), null, 'Không có nhãn thì phải trả về null, không được ép B1');
});

test('M38.2: buildTextHistoryCardHTML không hiển thị art-level-chip khi không có cấp độ', () => {
  const catalogCode = fs.readFileSync(path.join(__dirname, '../js/01b-catalog.js'), 'utf8');

  // Kiểm tra không còn gán ép item.level || 'B1'
  assert.ok(!catalogCode.includes("item.level || 'B1'"), 'Không được ép mặc định B1');

  // Trích xuất buildTextHistoryCardHTML
  const fnMatch = catalogCode.match(/function buildTextHistoryCardHTML\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được buildTextHistoryCardHTML');

  const escHtml = (s) => String(s || '').replace(/[&<>"']/g, '');
  const aicHasTranslation = () => false;
  const deriveTextTitle = () => 'Tiêu đề';
  const detectCefrLevel = (t) => {
    const m = String(t || '').match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    return m ? m[1].toUpperCase() : null;
  };

  const fn = new Function('item', 'escHtml', 'aicHasTranslation', 'deriveTextTitle', 'detectCefrLevel', `
    ${fnMatch[0]}
    return buildTextHistoryCardHTML(item);
  `);

  // Ca 1: Bài không có nhãn
  const htmlWithoutLevel = fn({ videoId: 'txt_1', title: 'Une vie simple', sentences: [] }, escHtml, aicHasTranslation, deriveTextTitle, detectCefrLevel);
  assert.ok(!htmlWithoutLevel.includes('art-level-chip'), 'Bài không có cấp độ thì không được hiện art-level-chip');

  // Ca 2: Bài có cấp độ trong tiêu đề
  const htmlWithLevel = fn({ videoId: 'txt_2', title: 'Une vie simple [B2]', sentences: [] }, escHtml, aicHasTranslation, deriveTextTitle, detectCefrLevel);
  assert.ok(htmlWithLevel.includes('art-level-chip'), 'Bài có cấp độ B2 phải hiện chip');
  assert.ok(htmlWithLevel.includes('B2'), 'Chip phải hiển thị B2');
});

test('M38.3: Giao diện bài đọc có nút Gán trình độ dưới nút Từ khó AI', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  assert.ok(playerCode.includes('openArticleLevelModal'), 'Phải có hàm openArticleLevelModal');
  assert.ok(playerCode.includes('art-side-level-btn'), 'Sidebar phải có nút gán trình độ');
});

test('M38.4: startTextShadowingFromPaste bảo toàn file audio MP3 khi nạp bài', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  const fnMatch = playerCode.match(/function startTextShadowingFromPaste\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được startTextShadowingFromPaste');

  // Đảm bảo không gọi clearTextAudioInput trước khi enterTextShadowing
  assert.ok(!fnMatch[0].includes('clearTextAudioInput()'), 'Không được gọi clearTextAudioInput xóa mất file trước khi nạp');
});
