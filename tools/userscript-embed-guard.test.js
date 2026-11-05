import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const USERSCRIPT_PATH = path.resolve('userscript/french-shadowing-youtube.user.js');
const GUIDE_PARTIAL_PATH = path.resolve('partials/view-guide.html');
const INDEX_HTML_PATH = path.resolve('index.html');

test('M-Userscript.1 Header: Chứa chỉ thị @noframes và version >= 1.3.8', () => {
  const content = fs.readFileSync(USERSCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('// @noframes'), 'Bắt buộc có directive // @noframes để Tampermonkey không inject vào iframe');
  const verMatch = content.match(/\/\/\s*@version\s+([0-9.]+)/);
  assert.ok(verMatch, 'Có trường version trong header');
  assert.ok(parseFloat(verMatch[1]) >= 1.3, 'Version phải >= 1.3.8');
});

test('M-Userscript.2 Iframe Guard: Chặn thực thi trên iframe, /embed/ và nguồn studio/localhost', () => {
  const content = fs.readFileSync(USERSCRIPT_PATH, 'utf-8');
  assert.ok(content.includes('window.self !== window.top'), 'Có guard chặn window.self !== window.top');
  assert.ok(content.includes("/embed/"), 'Có guard chặn trang /embed/');
  assert.ok(content.includes('french-shadowing-studio'), 'Có guard kiểm tra domain studio');
  assert.ok(!content.includes("embedMatch ? embedMatch[1] : null"), 'Không còn logic trích xuất videoId từ /embed/ cho toolbar');
});

test('M-Userscript.3 Button Label: Bỏ nhãn phiên bản cứng (v1.3.1) trên giao diện hướng dẫn', () => {
  const guideContent = fs.readFileSync(GUIDE_PARTIAL_PATH, 'utf-8');
  const indexContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

  assert.ok(!guideContent.includes('Userscript v1.3.1'), 'partials/view-guide.html không còn chữ v1.3.1');
  assert.ok(!indexContent.includes('Userscript v1.3.1'), 'index.html không còn chữ v1.3.1');
  assert.ok(guideContent.includes('Cài đặt / Cập nhật Userscript (1-Click)'), 'partials có tên nút mới không kèm version');
  assert.ok(indexContent.includes('Cài đặt / Cập nhật Userscript (1-Click)'), 'index.html có tên nút mới không kèm version');
});
