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
  assert.ok(engineJs.includes('const hasArtAudio = isTextMode && !!(document.getElementById(\'art-audio-el\')'), 'tsRefresh không ẩn .ts-ctl khi có audio bài báo');
});

test('M22.5 CSS Styling: theme-light.css định dạng hoàn chỉnh thẻ câu và từ karaoke không vượt quota màu', () => {
  const css = readFile('css/theme-light.css');
  assert.ok(css.includes('.art-cs-card'), 'theme-light.css phải chứa class .art-cs-card');
  assert.ok(css.includes('#art-cs-text'), 'theme-light.css phải chứa selector #art-cs-text');
  assert.ok(css.includes('#art-cs-text .sub-word-unit.karaoke-word-active'), 'theme-light.css phải chứa định dạng từ active');
  assert.ok(css.includes('#art-cs-card .cs-nav'), 'theme-light.css phải chứa định dạng cho .cs-nav trong art-cs-card');
  assert.ok(css.includes('#art-cs-card .cs-ts'), 'theme-light.css phải chứa định dạng cho .cs-ts trong art-cs-card');
});
