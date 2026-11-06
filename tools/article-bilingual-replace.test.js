const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// Helper đọc file
function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('M20.1 Placement: Nút "Sửa bản dịch" nằm trong .art-side-actions dưới nút "Dịch song ngữ", không thêm vào header', () => {
  const playerJs = readFile('js/01d-player.js');

  // Kiểm tra nút được khai báo trong renderArticleSidePanel
  assert.ok(playerJs.includes('id="art-side-btn-edit-trans"'), 'Phải có nút id art-side-btn-edit-trans');
  assert.ok(playerJs.includes('onclick="openBilingualModal(true)"'), 'Nút phải gọi openBilingualModal(true)');
  assert.ok(playerJs.includes('art-btn-edit-bilingual'), 'Nút phải có class art-btn-edit-bilingual');
  assert.ok(playerJs.includes('Sửa bản dịch'), 'Nút phải hiển thị nhãn "Sửa bản dịch"');

  // Xác minh thứ tự: Dịch song ngữ -> Sửa bản dịch -> Kèm/Đổi Audio MP3
  const sidePanelMatch = playerJs.match(/<div class="art-side-actions">([\s\S]*?)<\/div>/);
  assert.ok(sidePanelMatch, 'Phải có container art-side-actions');
  const actionsHtml = sidePanelMatch[1];
  const posBilingual = actionsHtml.indexOf('art-btn-bilingual');
  const posEditTrans = actionsHtml.indexOf('art-side-btn-edit-trans');
  const posAudio = actionsHtml.indexOf('art-side-audio-file-input');

  assert.ok(posBilingual >= 0, 'Phải có nút Dịch song ngữ');
  assert.ok(posEditTrans > posBilingual, 'Nút Sửa bản dịch phải nằm ngay DƯỚI nút Dịch song ngữ');
  assert.ok(posAudio > posEditTrans, 'Nút Sửa bản dịch phải nằm TRÊN nút Audio MP3');

  // Xác minh KHÔNG thêm nút Sửa bản dịch vào header
  const headerHtml = readFile('partials/view-practice.html');
  const headerBlockMatch = headerHtml.match(/<header[\s\S]*?<\/header>/);
  assert.ok(headerBlockMatch, 'Phải tìm thấy header trong view-practice');
  assert.ok(!headerBlockMatch[0].includes('art-side-btn-edit-trans'), 'Tuyệt đối không thêm nút sửa bản dịch vào header');
});

test('M20.2 Modal & Replace Mode: openBilingualModal(true) mở modal ở chế độ thay thế', () => {
  const transJs = readFile('js/01e-translate-ai.js');
  assert.ok(transJs.includes('blReplaceMode = replace === true;'), 'openBilingualModal phải nhận tham số replace');
  assert.ok(transJs.includes('title.textContent = \'Thay bản dịch song ngữ\';'), 'Phải đổi tiêu đề thành Thay bản dịch song ngữ');
  assert.ok(transJs.includes('const start = blReplaceMode ? 0 : aiTranslateStartIndex();'), 'blReplaceMode phải ép start về 0 để nạp đè toàn bộ bài');
});

test('M20.3 AI Translation with French Corrections: Thay thế câu tiếng Pháp chuẩn khi replaceFrench=true', () => {
  // Nạp module 01c-subtitles
  const subCode = readFile('js/01c-subtitles.js');
  const mockGlobal = {
    Math,
    Set,
    Array,
    Object,
    Number,
    String,
    Boolean,
    parseFloat,
    parseInt,
    console
  };
  const fn = new Function('window', subCode + '; return { applyBilingualFromAi, aicParseBilingual };');
  const { applyBilingualFromAi } = fn(mockGlobal);

  const mockSentences = [
    { id: 1, startTime: 0, endTime: 2, text: 'Bonjour je mapelle Matthew' },
    { id: 2, startTime: 2, endTime: 4, text: 'Je suis vietnamien' }
  ];

  const aiBilingualText = `
Bonjour, je m'appelle Matthew.
Xin chào, tôi tên là Matthew.

Je suis vietnamienne.
Tôi là người Việt Nam.
`;

  // Khi replaceFrench = true (chế độ thay thế hoặc chế độ đọc báo)
  const res = applyBilingualFromAi(mockSentences, aiBilingualText, { replaceFrench: true });
  assert.ok(res.ok, 'Ghép bản dịch phải thành công: ' + (res.error || ''));
  assert.equal(res.sentences.length, 2, 'Phải có đủ 2 câu');

  // Câu 1: Text tiếng Pháp phải được thay bằng bản chuẩn của AI
  assert.equal(res.sentences[0].text, "Bonjour, je m'appelle Matthew.");
  assert.equal(res.sentences[0].vi, 'Xin chào, tôi tên là Matthew.');

  // Câu 2: Text tiếng Pháp phải được sửa lỗi chính tả theo AI
  assert.equal(res.sentences[1].text, 'Je suis vietnamienne.');
  assert.equal(res.sentences[1].vi, 'Tôi là người Việt Nam.');

  // Các từ trong words cũng phải được đồng bộ theo câu chuẩn mới
  assert.ok(res.sentences[0].words.length > 0, 'Phải có words');
  assert.equal(res.sentences[0].words[0].word, 'Bonjour,');
  assert.equal(res.sentences[1].words[1].word, 'suis');
});

test('M20.4 Cho phép nạp đè bản dịch ngay cả khi bài đã đạt 100%', () => {
  const transJs = readFile('js/01e-translate-ai.js');
  // Trong aiRunApply: khi blReplaceMode bật, luôn thử từ vị trí 0
  assert.ok(transJs.includes('const start = blReplaceMode ? 0 : aiTranslateStartIndex();'), 'aiRunApply phải xử lý start=0 khi blReplaceMode');
  // Trong aiApply: khi blReplaceMode bật, khởi tạo reset vi
  assert.ok(transJs.includes('sentences = sentences.map((x) => { const c = Object.assign({}, x); delete c.vi; return c; });'), 'aiApply phải xóa sạch vi cũ khi thay thế để tránh lỗi dồn câu');
});

test('M20.5 Giao diện & Template: partials/modal-bilingual.html chứa checkbox thay thế câu tiếng Pháp chuẩn AI', () => {
  const modalHtml = readFile('partials/modal-bilingual.html');
  assert.ok(modalHtml.includes('id="bl-replace-fr-wrap"'), 'Phải có wrapper bl-replace-fr-wrap');
  assert.ok(modalHtml.includes('id="bl-replace-fr-cb"'), 'Phải có checkbox bl-replace-fr-cb');
  assert.ok(modalHtml.includes('checked'), 'Checkbox phải được bật mặc định');

  const indexHtml = readFile('index.html');
  assert.ok(indexHtml.includes('id="bl-replace-fr-cb"'), 'index.html build xong phải chứa checkbox này');
});
