import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const USERSCRIPT_PATH = path.resolve('userscript/french-shadowing-youtube.user.js');
const HOME_PARTIAL_PATH = path.resolve('partials/view-home.html');
const INDEX_HTML_PATH = path.resolve('index.html');
const TRANSLATE_ENGINE_PATH = path.resolve('js/05-translate-engine.js');

test('M16.1 Userscript v1.4.0: Loại bỏ hoàn toàn thanh toolbar inline dưới video', () => {
  const content = fs.readFileSync(USERSCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('// @version      1.4.0'), 'Userscript phải ở phiên bản 1.4.0');
  assert.ok(!content.includes('INLINE_BAR_ID'), 'Không còn hằng số INLINE_BAR_ID');
  assert.ok(!content.includes('injectInlineToolbar'), 'Không còn hàm injectInlineToolbar');
  assert.ok(!content.includes('fss-yt-inline-toolbar'), 'Không còn ID fss-yt-inline-toolbar');
});

test('M16.2 Userscript v1.4.0: Floating Pill All-in-One hỗ trợ cả Shadowing và Luyện dịch', () => {
  const content = fs.readFileSync(USERSCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('fss-yt-float-pill'), 'Có thanh nổi góc dưới Floating Pill');
  assert.ok(content.includes('selectVietnameseTrack'), 'Có hàm nhận diện phụ đề tiếng Việt');
  assert.ok(content.includes('PENDING_SHADOWING_VI_IMPORT'), 'Có cơ chế chuyển giao dữ liệu tiếng Việt sang Studio');
  assert.ok(content.includes('shadowingViExtension'), 'Tự động kích hoạt cờ shadowingViExtension trên Studio');
});

test('M16.3 Giao diện Luyện dịch: Loại bỏ nút tải zip thủ công 5 bước, thay bằng chỉ dẫn Userscript gọn gàng', () => {
  const homeContent = fs.readFileSync(HOME_PARTIAL_PATH, 'utf-8');
  const indexContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

  assert.ok(!homeContent.includes('ShadowingStudio-VN-Importer.zip'), 'Đã gỡ bỏ file zip');
  assert.ok(!indexContent.includes('ShadowingStudio-VN-Importer.zip'), 'index.html đã đồng bộ sạch file zip');
  assert.ok(!homeContent.includes('chrome://extensions'), 'Không còn bước thủ công chrome://extensions');
  assert.ok(!homeContent.includes('vt-ext-hint'), 'Không còn thẻ hướng dẫn 5 bước vt-ext-hint');

  assert.ok(homeContent.includes('vt-install-link'), 'Có đường dẫn cài đặt Userscript tiện lợi');
});

test('M16.4 An toàn Runtime: js/05-translate-engine.js bảo vệ chống lỗi null khi không có nút zip cũ', () => {
  const engineContent = fs.readFileSync(TRANSLATE_ENGINE_PATH, 'utf-8');
  assert.ok(engineContent.includes('const eb = $(\'vt-ext-btn\');\n    if (eb) {'), 'Có null-check an toàn cho vt-ext-btn');
});
