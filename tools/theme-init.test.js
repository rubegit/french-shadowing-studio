import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

test('M0.1 Thẻ <html> không có class="dark" viết cứng', () => {
  const indexSrc = fs.readFileSync(path.join(ROOT, 'src/index.src.html'), 'utf8');
  const htmlTagMatch = indexSrc.match(/<html[^>]*>/i);
  assert.ok(htmlTagMatch, 'Phải có thẻ <html>');
  assert.ok(!htmlTagMatch[0].includes('class="dark"'), 'Thẻ <html> không được chứa class="dark" viết cứng');
  assert.ok(!htmlTagMatch[0].includes("class='dark'"), 'Thẻ <html> không được chứa class="dark" viết cứng');
});

test('M0.2 resolveActiveTheme: Mặc định luôn là light mode trên hard reset', () => {
  function resolveActiveTheme(savedTheme) {
    return (savedTheme === 'dark') ? 'dark' : 'light';
  }

  // Hard reset / Incognito / Cache clear
  assert.equal(resolveActiveTheme(null), 'light', 'null phải trả về light');
  assert.equal(resolveActiveTheme(undefined), 'light', 'undefined phải trả về light');
  assert.equal(resolveActiveTheme(''), 'light', 'rỗng phải trả về light');
  assert.equal(resolveActiveTheme('random'), 'light', 'giá trị lạ phải trả về light');
  assert.equal(resolveActiveTheme('light'), 'light', 'light phải trả về light');
  assert.equal(resolveActiveTheme('dark'), 'dark', 'chỉ khi người dùng chọn dark mới trả về dark');
});

test('M1.2 getNextTheme: Bấm nút 1 lần duy nhất đổi ngay lập tức (không bao giờ phải bấm 2 lần)', () => {
  function getNextTheme(currentTheme) {
    var cur = currentTheme || 'light';
    return (cur === 'dark') ? 'light' : 'dark';
  }

  // Bắt đầu từ mặc định sau hard reset (light)
  let theme = getNextTheme('light');
  assert.equal(theme, 'dark', 'Lần bấm thứ 1 từ light phải sang dark ngay lập tức');

  // Bấm lần thứ 2
  theme = getNextTheme(theme);
  assert.equal(theme, 'light', 'Lần bấm thứ 2 từ dark phải sang light ngay lập tức');

  // Bấm lần thứ 3
  theme = getNextTheme(theme);
  assert.equal(theme, 'dark', 'Lần bấm thứ 3 phải sang dark');
});

test('M1.3 src/index.src.html: Chứa logic khởi tạo data-theme="light" và toggleFsTheme chuẩn hóa', () => {
  const indexSrc = fs.readFileSync(path.join(ROOT, 'src/index.src.html'), 'utf8');

  // Phải gán activeTheme mặc định là light
  assert.ok(indexSrc.includes("var activeTheme = (savedTheme === 'dark') ? 'dark' : 'light';"), 'Phải có logic gán activeTheme');
  assert.ok(indexSrc.includes("document.documentElement.setAttribute('data-theme', activeTheme);"), 'Phải setAttribute data-theme ngay khi khởi tạo');

  // toggleFsTheme không được phụ thuộc matchMedia gây lệch trạng thái
  assert.ok(indexSrc.includes("var cur = document.documentElement.getAttribute('data-theme') || 'light';"), 'toggleFsTheme phải đọc trực tiếp data-theme');
  assert.ok(!indexSrc.includes("var sysDark = window.matchMedia"), 'toggleFsTheme không còn matchMedia gây lỗi bấm 2 lần');
});

test('M1.4 css/theme-light.css: Đã gỡ bỏ toàn bộ @media (prefers-color-scheme: dark) tự ép Dark Mode', () => {
  const themeCss = fs.readFileSync(path.join(ROOT, 'css/theme-light.css'), 'utf8');

  // Không còn block media query prefers-color-scheme: dark nào trong code CSS
  const hasPrefersColorSchemeDark = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i.test(themeCss);
  assert.equal(hasPrefersColorSchemeDark, false, 'Không được còn @media (prefers-color-scheme: dark) trong css/theme-light.css');
});
