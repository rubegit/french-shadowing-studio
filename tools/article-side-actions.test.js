const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('M21.1 Element Order: Tên audio nằm dưới nút Đổi Audio và nút Sync AI nằm dưới tên audio', () => {
  const playerJs = readFile('js/01d-player.js');

  const match = playerJs.match(/<div class="art-side-actions">([\s\S]*?)<div class="art-vocab-section">/);
  assert.ok(match, 'Phải có container art-side-actions');
  const actionsHtml = match[1];

  const posBilingual = actionsHtml.indexOf('art-btn-bilingual');
  const posEditTrans = actionsHtml.indexOf('art-side-btn-edit-trans');
  const posAudioBtn = actionsHtml.indexOf('art-side-audio-file-input');
  const posFilePill = actionsHtml.indexOf('art-side-file-pill');
  const posSyncAi = actionsHtml.indexOf('art-side-sync-btn');
  const posCopyBtn = actionsHtml.indexOf('copyFullArticleText');

  assert.ok(posBilingual >= 0, 'Phải có nút Dịch song ngữ');
  assert.ok(posEditTrans > posBilingual, 'Nút Sửa bản dịch phải nằm dưới Dịch song ngữ');
  assert.ok(posAudioBtn > posEditTrans, 'Nút Đổi audio phải nằm dưới Sửa bản dịch');
  assert.ok(posFilePill > posAudioBtn, 'Tên audio pill (#art-side-file-pill) phải nằm dưới nút Đổi audio');
  assert.ok(posSyncAi > posFilePill, 'Nút Sync AI (#art-side-sync-btn) phải nằm dưới phần tên audio');
  assert.ok(posCopyBtn > posSyncAi, 'Nút Sao chép bài phải nằm sau nút Sync AI');

  // Kiểm tra nút Sync AI gọi đúng modal
  assert.ok(actionsHtml.includes('onclick="openArtAiSyncModal()"'), 'Nút Sync AI phải gọi openArtAiSyncModal()');
  // Kiểm tra tên audio pill không còn nút xóa (M40: đã lược bỏ theo yêu cầu người dùng)
  assert.ok(!actionsHtml.includes('class="art-side-pill-del"'), 'Pill tên audio không còn nút xóa ✕');
});

test('M21.2 Cleanup: Lược bỏ nút Sync AI và file pill cũ khỏi trình phát audio bài báo', () => {
  const viewPractice = readFile('partials/view-practice.html');
  const playerMatch = viewPractice.match(/<(div|section) id="(art-audio-bar|art-cs-card)"[\s\S]*?<\/(div|section)>/);
  assert.ok(playerMatch, 'Phải tìm thấy art-cs-card hoặc art-audio-bar trong view-practice');
  const playerHtml = playerMatch[0];

  assert.ok(!playerHtml.includes('id="art-audio-sync-btn"'), 'Trình phát audio không còn chứa nút art-audio-sync-btn');
  assert.ok(!playerHtml.includes('id="art-ab-file-pill"'), 'Trình phát audio không còn chứa pill art-ab-file-pill');
});

test('M21.3 Dynamic Audio Name: Cập nhật tên audio vào cột bên', () => {
  const playerJs = readFile('js/01d-player.js');
  assert.ok(playerJs.includes('document.getElementById(\'art-side-file-pill\')'), 'Phải cập nhật trạng thái art-side-file-pill');
  assert.ok(playerJs.includes('document.getElementById(\'art-side-pill-name\')'), 'Phải cập nhật tên vào art-side-pill-name');
});

test('M21.4 CSS Tokens: theme-light.css chứa định dạng cho file pill và sync btn', () => {
  const lightCss = readFile('css/theme-light.css');
  assert.ok(lightCss.includes('.art-side-file-pill'), 'Phải có style cho .art-side-file-pill');
  assert.ok(lightCss.includes('.art-side-pill-name'), 'Phải có style cho .art-side-pill-name');
  assert.ok(lightCss.includes('.art-side-pill-del'), 'Phải có style cho .art-side-pill-del');
  assert.ok(lightCss.includes('.art-btn-sync-ai'), 'Phải có style cho .art-btn-sync-ai');
});
