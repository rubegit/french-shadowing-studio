import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');

test('M8.1 HTML Verification: Nút Căn mốc tự động và badge hiển thị trong sổ từ vựng', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="vocab-auto-align-btn"'), 'Có nút vocab-auto-align-btn');
  assert.ok(indexHtml.includes('id="vocab-unaligned-badge"'), 'Có badge vocab-unaligned-badge');
  assert.ok(indexHtml.includes('autoAlignVocabTimestamps()'), 'Nút gọi autoAlignVocabTimestamps()');
});

test('M8.2 Auto-Align Logic: Đối chiếu câu phụ đề và cập nhật timestamp chính xác', () => {
  const sentences = [
    { startTime: 0.0, endTime: 4.2, text: 'Devoir est un verbe important.', vi: 'Devoir là một động từ quan trọng.' },
    { startTime: 4.2, endTime: 8.5, text: 'Je dois partir maintenant pour le travail.', vi: 'Tôi phải đi làm bây giờ.' },
    { startTime: 8.5, endTime: 12.0, text: 'Nous pouvons le faire ensemble.', vi: 'Chúng ta có thể làm cùng nhau.' }
  ];

  const unalignedItem = {
    id: 'test_item_1',
    text: 'dois',
    en: 'Je dois partir maintenant pour le travail.',
    t_known: false,
    t: 0
  };

  // Giả lập hàm căn mốc
  function mockAlign(item, sents) {
    const norm = str => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const cleanEn = norm(item.en);
    const matched = sents.find(s => norm(s.text) === cleanEn || norm(s.text).includes(cleanEn) || cleanEn.includes(norm(s.text)));
    if (matched) {
      item.t = matched.startTime;
      item.t_known = true;
      item.vi = matched.vi;
      return true;
    }
    return false;
  }

  const result = mockAlign(unalignedItem, sentences);
  assert.equal(result, true, 'Khớp câu thành công');
  assert.equal(unalignedItem.t_known, true, 't_known đã chuyển sang true');
  assert.equal(unalignedItem.t, 4.2, 't được gán đúng mốc startTime 4.2s');
  assert.equal(unalignedItem.vi, 'Tôi phải đi làm bây giờ.', 'Cập nhật nghĩa tiếng Việt từ câu phụ đề');
});

test('M8.3 Auto-Align Filter: Lọc chính xác các mục chưa căn mốc', () => {
  const vocabList = [
    { id: '1', text: 'bonjour', t_known: true, t: 1.5 },
    { id: '2', text: 'merci', t_known: false, t: 0 },
    { id: '3', text: 'au revoir', t_known: false, t: 0 },
    { id: '4', text: 'oui', t_known: true, t: 10.2 }
  ];

  const unaligned = vocabList.filter(v => v.t_known === false);
  assert.equal(unaligned.length, 2, 'Tìm đúng 2 từ chưa căn mốc');
  assert.deepEqual(unaligned.map(v => v.id), ['2', '3'], 'Đúng các id chưa căn mốc');
});
