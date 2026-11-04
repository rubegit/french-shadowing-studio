import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function isMp3File(file) {
  if (!file || !file.name) return false;
  const name = file.name.toLowerCase();
  return name.endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';
}

function findSentenceForAudioTime(sentences, ct) {
  return sentences.findIndex(s => typeof s.startTime === 'number' && ct >= s.startTime && ct <= (typeof s.endTime === 'number' ? s.endTime : (s.startTime + 15)));
}

test('M2.1 Audio Validation: CHỈ chấp nhận file .mp3 / audio/mpeg, từ chối mọi định dạng khác', () => {
  // Chấp nhận:
  assert.ok(isMp3File({ name: 'news-rfi.mp3', type: 'audio/mpeg' }), 'Chấp nhận file mp3 chuẩn');
  assert.ok(isMp3File({ name: 'PODCAST.MP3', type: '' }), 'Chấp nhận đuôi .MP3 hoa');
  assert.ok(isMp3File({ name: 'audio-record', type: 'audio/mpeg' }), 'Chấp nhận mime audio/mpeg');
  assert.ok(isMp3File({ name: 'track.mp3', type: 'audio/mp3' }), 'Chấp nhận mime audio/mp3');

  // Từ chối:
  assert.equal(isMp3File({ name: 'audio.wav', type: 'audio/wav' }), false, 'Từ chối .wav');
  assert.equal(isMp3File({ name: 'audio.m4a', type: 'audio/x-m4a' }), false, 'Từ chối .m4a');
  assert.equal(isMp3File({ name: 'audio.ogg', type: 'audio/ogg' }), false, 'Từ chối .ogg');
  assert.equal(isMp3File({ name: 'video.mp4', type: 'video/mp4' }), false, 'Từ chối .mp4');
  assert.equal(isMp3File({ name: 'doc.txt', type: 'text/plain' }), false, 'Từ chối .txt');
  assert.equal(isMp3File(null), false, 'Từ chối null');
});

test('M2.2 Time Tracking Sync: Tìm đúng câu tương ứng mốc thời gian của Audio MP3', () => {
  const sentences = [
    { id: 1, text: 'Câu 1', startTime: 0.0, endTime: 4.5 },
    { id: 2, text: 'Câu 2', startTime: 4.5, endTime: 9.8 },
    { id: 3, text: 'Câu 3', startTime: 9.8, endTime: 15.2 }
  ];

  assert.equal(findSentenceForAudioTime(sentences, 2.0), 0, 'Giây thứ 2 thuộc câu 1');
  assert.equal(findSentenceForAudioTime(sentences, 4.5), 0, 'Giây thứ 4.5 biên chạm câu 1');
  assert.equal(findSentenceForAudioTime(sentences, 6.0), 1, 'Giây thứ 6 thuộc câu 2');
  assert.equal(findSentenceForAudioTime(sentences, 12.0), 2, 'Giây thứ 12 thuộc câu 3');
  assert.equal(findSentenceForAudioTime(sentences, 20.0), -1, 'Vượt quá mốc câu cuối');
});

test('M2.3 HTML & Template Verification: Giao diện chứa đầy đủ thành phần Audio Player', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Ô nạp audio tại màn hình nhập bài báo
  assert.ok(indexHtml.includes('id="text-audio-input"'), 'Có input text-audio-input');
  assert.ok(indexHtml.includes('accept=".mp3,audio/mpeg"'), 'Input khai báo accept .mp3,audio/mpeg');
  assert.ok(indexHtml.includes('id="text-audio-badge"'), 'Có badge hiển thị file audio đã đính kèm');

  // 2. Thanh Article Audio Bar
  assert.ok(indexHtml.includes('id="art-audio-bar"'), 'Có container art-audio-bar');
  assert.ok(indexHtml.includes('id="art-audio-el"'), 'Có audio element art-audio-el');
  assert.ok(indexHtml.includes('id="art-audio-play-btn"'), 'Có nút Play/Pause art-audio-play-btn');
  assert.ok(indexHtml.includes('id="art-audio-slider"'), 'Có thanh scrubber art-audio-slider');
  assert.ok(indexHtml.includes('id="art-speeds"'), 'Có bộ chọn dải tốc độ art-speeds');
});

test('M4.1 Playing Time Seconds Format: Định dạng hiển thị giây chính xác cho Audio bài báo', () => {
  function formatArtTime(seconds, mode = 'sec') {
    if (isNaN(seconds) || seconds < 0) return mode === 'sec' ? '0.0s' : '0:00';
    if (mode === 'sec') {
      return Number(seconds).toFixed(1) + 's';
    } else {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  }

  assert.equal(formatArtTime(0), '0.0s', 'Giây 0');
  assert.equal(formatArtTime(14.28), '14.3s', 'Giây 14.28 làm tròn 1 chữ số thập phân');
  assert.equal(formatArtTime(74.64), '74.6s', 'Giây 74.64 hiển thị 74.6s (thay vì 1:14)');
  assert.equal(formatArtTime(74.64, 'min'), '1:14', 'Chế độ min hiển thị 1:14');
});

test('M6.1 Video Player Speeds: Có nút 1.25x trong cụm pv-speeds đồng bộ với article player', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="pv-speeds"'), 'Có cụm pv-speeds');
  assert.ok(indexHtml.includes('data-sp="1.25"'), 'Có nút data-sp="1.25" trong giao diện');
});

test('M6.2 Video Player Seconds Format: Định dạng hiển thị giây chính xác cho Video timeline', () => {
  function fmtVideo(t, mode = 'sec') {
    if (isNaN(t) || t < 0) t = 0;
    if (mode === 'sec') {
      return t.toFixed(1) + 's';
    }
    t = Math.floor(t);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') : m + ':' + String(s).padStart(2, '0');
  }

  assert.equal(fmtVideo(0), '0.0s', 'Giây 0');
  assert.equal(fmtVideo(5.42), '5.4s', 'Giây 5.42 làm tròn 5.4s');
  assert.equal(fmtVideo(744.38), '744.4s', 'Giây 744.38 hiển thị 744.4s');
  assert.equal(fmtVideo(744.38, 'min'), '12:24', 'Chế độ min hiển thị 12:24');
});
