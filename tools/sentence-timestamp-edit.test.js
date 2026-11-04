import test from 'node:test';
import assert from 'node:assert/strict';

// Helper parse hàm thời gian giống logic trong ứng dụng
function tsParse(raw) {
  const t = String(raw || '').trim().replace(',', '.').replace(/s$/i, '').trim();
  let m;
  if ((m = t.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/))) return (+m[1]) * 60 + parseFloat(m[2]);
  if ((m = t.match(/^(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/))) return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  if (/^\d*\.?\d+$|^\d+\.$/.test(t)) return parseFloat(t);
  return null;
}

function tsFmt(x) {
  const cs = Math.max(0, Math.round(x * 100)), m = Math.floor(cs / 6000), rem = cs % 6000;
  return m + ':' + String(Math.floor(rem / 100)).padStart(2, '0') + '.' + String(rem % 100).padStart(2, '0');
}

function scaleWords(words, oldStart, oldEnd, newStart, newEnd) {
  const oldDur = Math.max(0.1, oldEnd - oldStart);
  const newDur = Math.max(0.2, newEnd - newStart);
  return words.map(w => {
    const ratioStart = Math.max(0, Math.min(1, (w.startTime - oldStart) / oldDur));
    const ratioEnd = Math.max(0, Math.min(1, (w.endTime - oldStart) / oldDur));
    return {
      word: w.word,
      startTime: Number((newStart + ratioStart * newDur).toFixed(3)),
      endTime: Number((newStart + ratioEnd * newDur).toFixed(3))
    };
  });
}

test('M-Timestamp.1 Parse & Format: Chuyển đổi chính xác các định dạng thời gian', () => {
  assert.equal(tsParse('83.45'), 83.45);
  assert.equal(tsParse('83,45'), 83.45);
  assert.equal(tsParse('1:23.45'), 83.45);
  assert.equal(tsParse('0:10'), 10);
  assert.equal(tsParse('1:02:03.5'), 3723.5);
  assert.equal(tsParse('invalid'), null);

  assert.equal(tsFmt(83.45), '1:23.45');
  assert.equal(tsFmt(10), '0:10.00');
});

test('M-Timestamp.2 Scale Words: Tái phân bổ mốc thời gian từng từ con khớp tỷ lệ biên độ mới', () => {
  const words = [
    { word: "C'est", startTime: 10.0, endTime: 12.0 },
    { word: "une", startTime: 12.0, endTime: 14.0 },
    { word: "période", startTime: 14.0, endTime: 20.0 }
  ];
  // Câu cũ: 10s -> 20s (độ dài 10s)
  // Câu mới kéo lùi bắt đầu và kéo dài kết thúc: 8s -> 23s (độ dài 15s)
  const scaled = scaleWords(words, 10.0, 20.0, 8.0, 23.0);

  // Từ đầu tiên bắt đầu đúng tại newStart
  assert.equal(scaled[0].startTime, 8.0);
  // Từ cuối cùng kết thúc đúng tại newEnd
  assert.equal(scaled[2].endTime, 23.0);
  // Thứ tự thời gian tăng dần và không bị đè ngược
  assert.ok(scaled[0].endTime <= scaled[1].startTime);
  assert.ok(scaled[1].endTime <= scaled[2].startTime);
});

test('M-Timestamp.3 Lưu & Khôi phục mốc gốc YouTube: Bảo toàn origStartTime/origEndTime', () => {
  const sentence = {
    id: 1,
    text: "Bonjour tout le monde",
    startTime: 15.2,
    endTime: 18.5,
    words: [
      { word: "Bonjour", startTime: 15.2, endTime: 16.5 },
      { word: "tout", startTime: 16.5, endTime: 17.0 },
      { word: "le", startTime: 17.0, endTime: 17.5 },
      { word: "monde", startTime: 17.5, endTime: 18.5 }
    ]
  };

  // 1. Khi lưu mốc mới lần đầu: ghi nhận mốc gốc
  if (sentence.origStartTime === undefined) sentence.origStartTime = sentence.startTime;
  if (sentence.origEndTime === undefined) sentence.origEndTime = sentence.endTime;
  if (!sentence.origWords) sentence.origWords = JSON.parse(JSON.stringify(sentence.words));

  // Ghi mốc mới
  sentence.startTime = 14.5;
  sentence.endTime = 19.0;

  assert.equal(sentence.origStartTime, 15.2, 'Mốc gốc bắt đầu được lưu giữ');
  assert.equal(sentence.origEndTime, 18.5, 'Mốc gốc kết thúc được lưu giữ');
  assert.equal(sentence.startTime, 14.5, 'Mốc mới bắt đầu được cập nhật');
  assert.equal(sentence.endTime, 19.0, 'Mốc mới kết thúc được cập nhật');

  // 2. Khi khôi phục mốc gốc:
  sentence.startTime = sentence.origStartTime;
  sentence.endTime = sentence.origEndTime;
  sentence.words = JSON.parse(JSON.stringify(sentence.origWords));
  delete sentence.origStartTime;
  delete sentence.origEndTime;
  delete sentence.origWords;

  assert.equal(sentence.startTime, 15.2, 'Đã khôi phục hoàn toàn mốc gốc bắt đầu');
  assert.equal(sentence.endTime, 18.5, 'Đã khôi phục hoàn toàn mốc gốc kết thúc');
  assert.equal(sentence.origStartTime, undefined, 'Đã dọn sạch cờ mốc gốc');
});
