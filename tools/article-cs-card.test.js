const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readFile(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

test('M22.1 Structure: partials/view-practice.html và index.html chứa thẻ điều khiển #art-cs-card', () => {
  const viewPractice = readFile('partials/view-practice.html');
  const indexHtml = readFile('index.html');

  for (const [name, content] of [['view-practice.html', viewPractice], ['index.html', indexHtml]]) {
    assert.ok(content.includes('id="art-cs-card"'), `${name} phải chứa section id="art-cs-card"`);
    assert.ok(content.includes('id="art-cs-text"'), `${name} phải chứa div id="art-cs-text"`);
    assert.ok(content.includes('id="art-cs-prev"'), `${name} phải chứa button id="art-cs-prev"`);
    assert.ok(content.includes('id="art-cs-auto"'), `${name} phải chứa button id="art-cs-auto"`);
    assert.ok(content.includes('id="art-cs-next"'), `${name} phải chứa button id="art-cs-next"`);
    assert.ok(content.includes('id="art-cs-ts"'), `${name} phải chứa div id="art-cs-ts"`);
  }
});

test('M22.2 Logic: renderArticleSentenceCard tạo word tokens bấm được và highlight', () => {
  const playerJs = readFile('js/01d-player.js');
  assert.ok(playerJs.includes('function renderArticleSentenceCard(idx)'), 'Phải khai báo hàm renderArticleSentenceCard');
  assert.ok(playerJs.includes('window.renderArticleSentenceCard = renderArticleSentenceCard'), 'Phải export renderArticleSentenceCard ra window');
  assert.ok(playerJs.includes('sp.className = \'sub-word-unit cs-w\''), 'Mỗi từ phải mang class sub-word-unit cs-w');
  assert.ok(playerJs.includes('data-start'), 'Phải gán mốc data-start cho từ');
  assert.ok(playerJs.includes('data-end'), 'Phải gán mốc data-end cho từ');
  assert.ok(playerJs.includes('highlightArticleCurrentWord'), 'Phải có logic highlightArticleCurrentWord');
});

test('M22.3 Navigation: prevArticleSentence và nextArticleSentence chuyển câu an toàn', () => {
  const playerJs = readFile('js/01d-player.js');
  assert.ok(playerJs.includes('window.prevArticleSentence = function()'), 'Phải khai báo window.prevArticleSentence');
  assert.ok(playerJs.includes('window.nextArticleSentence = function()'), 'Phải khai báo window.nextArticleSentence');
  assert.ok(playerJs.includes('window.toggleArticleAutoStop = function()'), 'Phải khai báo window.toggleArticleAutoStop');
});

test('M22.4 Timestamps: practice-engine hỗ trợ isTextMode với art-audio-el và art-cs-ts', () => {
  const engineJs = readFile('js/03-practice-engine.js');
  assert.ok(engineJs.includes('$(\'art-cs-ts\')'), 'Phải nạp tsMarkup() vào art-cs-ts');
  assert.ok(engineJs.includes('document.getElementById(\'art-audio-el\')'), 'tsCapture và tsAfter phải đọc art-audio-el khi isTextMode');
});

test('M22.5 CSS Styling: theme-light.css định dạng hoàn chỉnh thẻ câu và từ karaoke không vượt quota màu', () => {
  const css = readFile('css/theme-light.css');
  assert.ok(css.includes('.art-cs-card'), 'theme-light.css phải chứa class .art-cs-card');
  assert.ok(css.includes('#art-cs-text'), 'theme-light.css phải chứa selector #art-cs-text');
  assert.ok(css.includes('#art-cs-text .sub-word-unit.karaoke-word-active'), 'theme-light.css phải chứa định dạng từ active');
  assert.ok(css.includes('#art-cs-card .cs-nav'), 'theme-light.css phải chứa định dạng cho .cs-nav trong art-cs-card');
  assert.ok(css.includes('#art-cs-card .cs-ts'), 'theme-light.css phải chứa định dạng cho .cs-ts trong art-cs-card');
});

test('M23.1 Initial Display: openTextSession luôn hiển thị thẻ câu #art-cs-card và render câu 0', () => {
  const playerJs = readFile('js/01d-player.js');
  assert.ok(playerJs.includes('const artCard = document.getElementById(\'art-cs-card\')'), 'openTextSession phải tìm art-cs-card');
  assert.ok(playerJs.includes('artCard.style.display = \'flex\''), 'openTextSession phải đặt display flex cho art-cs-card');
  assert.ok(playerJs.includes('renderArticleSentenceCard(0)'), 'openTextSession phải render câu số 0 ngay lập tức');
});

test('M23.2 Audio-less Fallback: initArticleAudioPlayer duy trì thẻ câu khi bài báo chưa có file MP3', () => {
  const playerJs = readFile('js/01d-player.js');
  // Khi không có blob, card vẫn phải hiển thị flex và render câu
  assert.ok(playerJs.includes('card.style.display = \'flex\';\n          if (currentArtAudioObjUrl)'), 'Khi chưa có audio blob vẫn giữ card hiển thị flex');
});

test('M23.3 Timestamp Visibility: tsRefresh không gán .pv-x làm ẩn mốc thời gian', () => {
  const engineJs = readFile('js/03-practice-engine.js');
  assert.ok(engineJs.includes('ctl.classList.remove(\'pv-x\')'), 'tsRefresh phải bỏ class pv-x khỏi .ts-ctl');
  assert.ok(!engineJs.includes('ctl.classList.toggle(\'pv-x\', !!(isTextMode'), 'tsRefresh không còn ẩn .ts-ctl theo isTextMode');
});

test('M23.4 Timestamp Live Tick: tick() cập nhật mốc thời gian trong isTextMode', () => {
  const engineJs = readFile('js/03-practice-engine.js');
  // Lấy chính xác hàm tick() trong thẻ phụ đề (trước setInterval(tick, 80))
  const tickStart = engineJs.lastIndexOf('function tick() {');
  assert.ok(tickStart !== -1, 'Phải tìm thấy hàm tick() của thẻ câu');
  const tickCode = engineJs.slice(tickStart, engineJs.indexOf('setInterval(tick, 80)', tickStart));

  const tsUpdatePos = tickCode.indexOf('if (tk !== lastTsKey) { lastTsKey = tk; tsRefresh(); }');
  const textModeGuardPos = tickCode.indexOf('if (isTextMode) return;');
  assert.ok(tsUpdatePos !== -1, 'tick() phải có khối cập nhật lastTsKey & tsRefresh');
  assert.ok(textModeGuardPos !== -1, 'tick() phải có guard if (isTextMode) return sau phần cập nhật timestamp');
  assert.ok(tsUpdatePos < textModeGuardPos, 'Cập nhật timestamp phải diễn ra trước guard isTextMode');
});
