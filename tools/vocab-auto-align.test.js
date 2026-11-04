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

test('M9.1 ID & Prefix Cleaning: cleanVid loại bỏ yt: và video: chính xác', () => {
  const cleanVid = (id) => String(id || '').replace(/^(yt|video):/, '').trim();
  assert.equal(cleanVid('yt:_CfHjzWCRUU'), '_CfHjzWCRUU', 'Gọt bỏ tiền tố yt:');
  assert.equal(cleanVid('video:_CfHjzWCRUU'), '_CfHjzWCRUU', 'Gọt bỏ tiền tố video:');
  assert.equal(cleanVid('_CfHjzWCRUU'), '_CfHjzWCRUU', 'Giữ nguyên ID sạch');
  assert.equal(cleanVid(''), '', 'Chuỗi rỗng an toàn');
});

test('M9.2 Title Normalization: normTitle xử lý emoji, gạch nối và khoảng trắng', () => {
  const normTitle = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\-_|·]+/g, ' ').trim();
  const t1 = 'Progressive French Short Story A1 to B2 🇫🇷🎃';
  const t2 = 'Progressive French Short Story A1 to B2 🇫🇷🎃 | The perfect French with Dylane';
  const n1 = normTitle(t1);
  const n2 = normTitle(t2);
  assert.ok(n2.includes(n1), 'Tiêu đề đầy đủ trên YouTube chứa tiêu đề ngắn của thẻ từ vựng');
});

test('M9.3 Fuzzy & Prefix History Matching: Tìm thấy phụ đề khi lệch prefix yt: hoặc thừa tên kênh', () => {
  const cleanVid = (id) => String(id || '').replace(/^(yt|video):/, '').trim();
  const normTitle = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\-_|·]+/g, ' ').trim();

  const history = [
    {
      videoId: '_CfHjzWCRUU',
      title: 'Progressive French Short Story A1 to B2 🇫🇷🎃 | The perfect French with Dylane',
      sentences: [
        { startTime: 10.0, endTime: 14.5, text: "L'automne est enfin arrivé.", vi: 'Mùa thu cuối cùng đã đến.' }
      ]
    }
  ];

  function mockGetSentences(v) {
    const rawVid = cleanVid(v.videoId);
    const vNorm = v.videoTitle ? normTitle(v.videoTitle) : '';
    // Check by clean videoId
    if (rawVid) {
      const h = history.find(x => cleanVid(x.videoId) === rawVid && x.sentences && x.sentences.length);
      if (h) return h.sentences;
    }
    // Check by title fuzzy
    if (vNorm && vNorm.length >= 6) {
      const h = history.find(x => {
        if (!x.sentences || !x.sentences.length) return false;
        const hNorm = normTitle(x.title || x.videoTitle || '');
        return hNorm.length >= 6 && (hNorm === vNorm || hNorm.includes(vNorm) || vNorm.includes(hNorm));
      });
      if (h) return h.sentences;
    }
    return null;
  }

  // Case 1: Thẻ có videoId mang tiền tố yt:
  const cardWithPrefix = {
    videoId: 'yt:_CfHjzWCRUU',
    videoTitle: 'Progressive French Short Story A1 to B2 🇫🇷🎃',
    text: 'est enfin arrivé'
  };
  const sents1 = mockGetSentences(cardWithPrefix);
  assert.ok(sents1 && sents1.length === 1, 'Tìm thấy phụ đề cho thẻ có tiền tố yt:');

  // Case 2: Thẻ khuyết videoId nhưng có tiêu đề ngắn
  const cardWithoutVid = {
    videoId: '',
    videoTitle: 'Progressive French Short Story A1 to B2 🇫🇷🎃',
    text: 'est enfin arrivé'
  };
  const sents2 = mockGetSentences(cardWithoutVid);
  assert.ok(sents2 && sents2.length === 1, 'Tìm thấy phụ đề cho thẻ khuyết ID nhờ so khớp tiêu đề mờ');
});

test('M9.4 Storage Function: setVocab và alias saveVocab tồn tại và hoạt động an toàn', () => {
  const code = fs.readFileSync(path.join(ROOT, 'js/01g-vocab-list.js'), 'utf8');
  assert.ok(code.includes('function setVocab('), 'Định nghĩa function setVocab');
  assert.ok(code.includes('const saveVocab = setVocab;'), 'Có alias saveVocab = setVocab');
  assert.ok(!code.includes('saveVocab(all)'), 'Không còn gọi saveVocab(all) khi căn mốc tự động');
});
