const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('M36.1: partials/view-home.html không còn mục Thử đọc bài viết có sẵn', () => {
  const homeHtml = fs.readFileSync(path.join(__dirname, '../partials/view-home.html'), 'utf8');
  assert.ok(!homeHtml.includes('Thử đọc bài viết có sẵn'), 'Phải gỡ bỏ hoàn toàn tiêu đề Thử đọc bài viết có sẵn');
  assert.ok(!homeHtml.includes('art-lib-grid'), 'Phải gỡ bỏ hoàn toàn art-lib-grid');
});

test('M36.2: Khung nhập bài báo có cấu trúc collapsible (mặc định thu gọn)', () => {
  const homeHtml = fs.readFileSync(path.join(__dirname, '../partials/view-home.html'), 'utf8');
  assert.ok(homeHtml.includes('txt-collapsible-card'), 'Khung nhập phải có class txt-collapsible-card');
  assert.ok(homeHtml.includes('text-input-toggle-btn'), 'Phải có nút bấm toggle');
  assert.ok(homeHtml.includes('text-input-collapse-body'), 'Phải có body thu gọn');
  assert.ok(homeHtml.includes('style="display:none;"'), 'Mặc định body phải ẩn style="display:none;"');
});

test('M36.3: js/01b-catalog.js render Văn bản Bạn Đã Luyện dạng grid', () => {
  const catalogCode = fs.readFileSync(path.join(__dirname, '../js/01b-catalog.js'), 'utf8');
  assert.ok(catalogCode.includes('art-history-grid'), 'Phải render art-history-grid');
  assert.ok(catalogCode.includes('art-sample-list'), 'Phải dùng class art-sample-list để hiển thị lưới responsive');
  assert.ok(!catalogCode.includes("'netflix-row-text-history'"), 'Không còn dùng hàng cuộn netflix cho bài báo');
});

test('M36.4: startTextShadowingFromPaste tự động xóa trắng form và thu gọn khung sau khi nạp', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');
  assert.ok(playerCode.includes('toggleTextInputCollapse'), 'Phải có hàm toggleTextInputCollapse');
  assert.ok(playerCode.includes('clearTextInputFields'), 'Phải có hàm clearTextInputFields');

  // Kiểm tra startTextShadowingFromPaste gọi xóa trắng và thu gọn
  const fnMatch = playerCode.match(/function startTextShadowingFromPaste\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được startTextShadowingFromPaste');
  assert.ok(fnMatch[0].includes('clearTextInputFields'), 'startTextShadowingFromPaste phải gọi clearTextInputFields');
  assert.ok(fnMatch[0].includes('toggleTextInputCollapse'), 'startTextShadowingFromPaste phải gọi toggleTextInputCollapse');
});
