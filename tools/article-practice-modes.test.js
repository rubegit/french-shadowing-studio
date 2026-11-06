/**
 * tools/article-practice-modes.test.js
 * Kiểm thử tính năng luyện Shadowing & Chép chính tả (Dictation) cho Bài báo (Module M19)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const THEME_LIGHT_CSS = path.resolve('css/theme-light.css');
const PRACTICE_ENGINE_JS = path.resolve('js/03-practice-engine.js');
const INDEX_HTML = path.resolve('index.html');

test('M19.1 Header Switcher: Menu đổi chế độ (#pv-switch) không bị ẩn ở chế độ đọc báo', () => {
  const css = fs.readFileSync(THEME_LIGHT_CSS, 'utf-8');
  assert.ok(!css.includes('body.text-mode #pv-switch'), 'css/theme-light.css không được ẩn #pv-switch trong body.text-mode');

  const index = fs.readFileSync(INDEX_HTML, 'utf-8');
  assert.ok(index.includes('id="pv-switch"'), 'index.html chứa thành phần #pv-switch');
});

test('M19.2 Article Audio Router: getArticleAudioEl nhận diện audio bài báo đúng chuẩn', () => {
  const code = fs.readFileSync(PRACTICE_ENGINE_JS, 'utf-8');
  assert.ok(code.includes('function getArticleAudioEl()'), 'Có hàm getArticleAudioEl để trích xuất phần tử art-audio-el');
  assert.ok(code.includes("document.getElementById('art-audio-el')"), 'Trỏ chính xác vào phần tử art-audio-el của bài báo');
});

test('M19.3 Dictation Audio Routing: Hỗ trợ cả 2 nhánh MP3 thực và Web Speech TTS cho bài báo', () => {
  const code = fs.readFileSync(PRACTICE_ENGINE_JS, 'utf-8');
  assert.ok(code.includes('const artEl = getArticleAudioEl();'), 'Dictation play() kiểm tra audio MP3 bài báo');
  assert.ok(code.includes('artEl.currentTime = from;'), 'Tua đến đúng mốc thời gian câu trong file MP3 bài báo');
  assert.ok(code.includes('speak(s.text);'), 'Fallback về Web Speech TTS khi bài báo không có audio MP3');
});

test('M19.4 Shadowing Audio Routing: Hỗ trợ cả 2 nhánh MP3 thực và Web Speech TTS cho bài báo', () => {
  const code = fs.readFileSync(PRACTICE_ENGINE_JS, 'utf-8');
  assert.ok(code.includes('shPlay('), 'Có hàm shPlay');
  assert.ok(code.includes('artEl.currentTime = start;'), 'Shadowing tua đến đúng mốc bắt đầu câu trong file MP3 bài báo');
  assert.ok(code.includes('shSpeak(range && range.text ? range.text : s.text);'), 'Fallback về Web Speech TTS khi bài báo không có audio MP3');
});

test('M19.5 Dọn dẹp an toàn khi dừng hoặc rời chế độ luyện tập bài báo', () => {
  const code = fs.readFileSync(PRACTICE_ENGINE_JS, 'utf-8');
  assert.ok(code.includes('if (artEl) { try { artEl.pause(); } catch (e) {} }'), 'Dừng audio MP3 an toàn khi kết thúc câu hoặc chuyển giao diện');
});
