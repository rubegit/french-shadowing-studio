const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('M49.1 Structure: partials/view-practice.html & index.html chứa các khối menu ngữ cảnh', () => {
  const partial = readFile('partials/view-practice.html');
  const indexHtml = readFile('index.html');

  for (const [name, content] of [['view-practice.html', partial], ['index.html', indexHtml]]) {
    assert.ok(content.includes('class="psm-video-only"'), `${name} phải chứa khối .psm-video-only`);
    assert.ok(content.includes('class="psm-article-only"'), `${name} phải chứa khối .psm-article-only`);
    assert.ok(content.includes('id="psm-art-source"'), `${name} phải chứa #psm-art-source`);
    assert.ok(content.includes('id="psm-art-wc"'), `${name} phải chứa #psm-art-wc`);
    assert.ok(content.includes('id="psm-art-sc"'), `${name} phải chứa #psm-art-sc`);
    assert.ok(content.includes('id="psm-art-level"'), `${name} phải chứa #psm-art-level`);
    assert.ok(content.includes('id="psm-art-audio-file-input"'), `${name} phải chứa input kèm audio`);
    assert.ok(content.includes('id="psm-art-file-pill"'), `${name} phải chứa #psm-art-file-pill`);
  }
});

test('M49.2 CSS: Phân định ngữ cảnh Video vs Bài báo và ẩn #article-side-panel', () => {
  const subtitleCardCss = readFile('css/14-subtitle-card.css');
  const themeLightCss = readFile('css/theme-light.css');

  // Phân định ngữ cảnh
  assert.ok(subtitleCardCss.includes('body:not(.text-mode) .psm-article-only'), 'CSS phải ẩn bài báo khi ở video mode');
  assert.ok(subtitleCardCss.includes('body.text-mode .psm-video-only'), 'CSS phải ẩn video khi ở text-mode');
  assert.ok(subtitleCardCss.includes('body.text-mode .psm-article-only'), 'CSS phải hiện bài báo khi ở text-mode');

  // 1 cột duy nhất & ẩn #article-side-panel trên cả desktop và tablet
  assert.ok(themeLightCss.includes('body.text-mode #article-side-panel'), 'theme-light.css phải ẩn #article-side-panel');
  assert.ok(themeLightCss.includes('body.text-mode #art-player-bar'), 'theme-light.css phải style #art-player-bar');
  assert.ok(themeLightCss.includes('position: sticky'), 'theme-light.css phải ghim sticky #art-player-bar');
});

test('M49.3 JS: Điều hướng nút quay lại về tab "text" và đổi nhãn "Bài đọc"', () => {
  const playerJs = readFile('js/01d-player.js');

  // Đổi nhãn nút quay lại thành "Bài đọc" khi mở bài báo
  assert.ok(playerJs.includes("backLabel.textContent = 'Bài đọc'"), 'openTextSession phải đổi nhãn nút thành "Bài đọc"');
  
  // Khôi phục nhãn "Trang chủ" khi rời phòng luyện
  assert.ok(playerJs.includes("backLabel.textContent = 'Trang chủ'"), 'backToInputScreen phải trả nhãn về "Trang chủ"');

  // Chuyển đúng tab "text" ở trang chủ khi bấm quay lại từ bài báo
  assert.ok(playerJs.includes("setInputMode('text')"), 'backToInputScreen phải gọi setInputMode("text") khi quay lại từ bài báo');

  // Có hàm syncArticleSandwichMenu
  assert.ok(playerJs.includes('function syncArticleSandwichMenu'), 'js/01d-player.js phải định nghĩa syncArticleSandwichMenu');
  assert.ok(playerJs.includes('window.syncArticleSandwichMenu = syncArticleSandwichMenu'), 'syncArticleSandwichMenu phải export ra window');
});
