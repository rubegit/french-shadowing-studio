const test = require('node:test');
const assert = require('node:assert');
const {
  EXTRACT_PROMPT_TEMPLATE,
  fillExtractPromptTemplate,
  buildDaCoList,
  generateKeyVocabPrompt
} = require('./extract-prompt-template.js');

test('M41.1 Điền an toàn: không lỗi khi transcript chứa $&, $$, $1, $`, {{, ký tự có dấu và dấu nháy', () => {
  const dangerousTranscript = "C'est l'été ! Prix: 50$ & 100$ && $1 for you. Regardez: {{placeholder}} et l'œuf à l'école.";
  const data = {
    MODE: 'TEXT',
    LEVELS: 'A1, A2',
    TYPES: 'từ, cụm từ, collocation, idiom, slang',
    SOURCE_ID: 'yt:testVid123',
    SOURCE_TITLE: 'Bài học tiếng Pháp $& special',
    SEQ_START: 1,
    SUA_LOI: 'erare -> erreur',
    DA_CO: 'bonjour\nau revoir',
    VAN_BAN: dangerousTranscript
  };

  const filled = fillExtractPromptTemplate(EXTRACT_PROMPT_TEMPLATE, data);

  // Xác nhận các chuỗi nhạy cảm có mặt chính xác và không bị regex thế sai
  assert.ok(filled.includes(dangerousTranscript), 'Transcript chứa $&, $$, $1, dấu nháy và ký tự có dấu phải được giữ nguyên vẹn');
  assert.ok(filled.includes('Bài học tiếng Pháp $& special'), 'Tiêu đề chứa $& phải hiển thị nguyên bản');
  assert.ok(filled.includes('yt:testVid123'));
});

test('M41.2 Điền đủ 9 biến và không còn sót ký tự {{ sau khi điền', () => {
  const result = generateKeyVocabPrompt({
    videoId: '0a8m1JaypTo',
    videoTitle: 'Tiêu đề thử nghiệm',
    levels: 'A1, A2, B1',
    types: 'từ, cụm từ, collocation, idiom, slang',
    mode: 'TEXT',
    seqStart: 1,
    suaLoi: 'ce pendant -> cependant',
    includeDaCo: false,
    transcript: 'Bonjour tout le monde.'
  });

  // Kiểm tra 9 biến xuất hiện đúng chỗ
  assert.ok(result.includes('MODE: TEXT'));
  assert.ok(result.includes('CẤP ĐỘ KÍCH HOẠT: A1, A2, B1'));
  assert.ok(result.includes('LOẠI KÍCH HOẠT: từ, cụm từ, collocation, idiom, slang'));
  assert.ok(result.includes('SOURCE_ID: yt:0a8m1JaypTo'));
  assert.ok(result.includes('SOURCE_TITLE: Tiêu đề thử nghiệm'));
  assert.ok(result.includes('SEQ_START: 1'));
  assert.ok(result.includes('BẢNG SỬA LỖI TRANSCRIPT: ce pendant -> cependant'));
  assert.ok(result.includes('<<<DA_CO\n\n>>>'), 'DA_CO khi tắt phải để trống');
  assert.ok(result.includes('<<<VAN_BAN\nBonjour tout le monde.\n>>>'));

  // Kiểm tra không còn sót bất kỳ placeholder {{...}} nào
  const remainingPlaceholderMatch = result.match(/\{\{[A-Z_]+\}\}/g);
  assert.strictEqual(remainingPlaceholderMatch, null, 'Không được còn sót bất kỳ placeholder {{...}} nào');
});

test('M41.3 DA_CO: khi tắt để trống; khi bật chỉ lấy từ các video khác và loại trùng', () => {
  const mockVocabList = [
    // 2 mục thuộc video hiện tại (UoxA5R0tcFA)
    { id: '1', text: 'bonjour', videoId: 'UoxA5R0tcFA' },
    { id: '2', text: 'merci', source_id: 'yt:UoxA5R0tcFA' },

    // 3 mục thuộc video khác
    { id: '3', text: 'maison', videoId: 'otherVid1' },
    { id: '4', text: 'école', source_id: 'yt:otherVid2' },
    { id: '5', text: 'maison', videoId: 'otherVid3' }, // trùng từ "maison"
    { id: '6', text: 'café', videoId: 'otherVid1', _deleted: true } // tombstone đã xóa
  ];

  // 1. Khi includeDaCo = false (mặc định)
  const daCoOff = generateKeyVocabPrompt({
    videoId: 'UoxA5R0tcFA',
    includeDaCo: false,
    vocabListOverride: mockVocabList,
    transcript: 'Sample text'
  });
  assert.ok(daCoOff.includes('<<<DA_CO\n\n>>>'), 'Khi tắt DA_CO phải hoàn toàn trống');

  // 2. Khi includeDaCo = true
  const daCoOn = generateKeyVocabPrompt({
    videoId: 'UoxA5R0tcFA',
    includeDaCo: true,
    vocabListOverride: mockVocabList,
    transcript: 'Sample text'
  });

  // Kỳ vọng: Chỉ chứa "maison" và "école", không chứa "bonjour", "merci" (cùng video) và không chứa "café" (_deleted)
  assert.ok(daCoOn.includes('maison'), 'Phải chứa từ maison từ video khác');
  assert.ok(daCoOn.includes('école'), 'Phải chứa từ école từ video khác');
  assert.ok(!daCoOn.includes('bonjour'), 'TUYỆT ĐỐI KHÔNG chứa từ thuộc video hiện tại');
  assert.ok(!daCoOn.includes('merci'), 'TUYỆT ĐỐI KHÔNG chứa từ thuộc video hiện tại');
  assert.ok(!daCoOn.includes('café'), 'TUYỆT ĐỐI KHÔNG chứa từ đã xóa (_deleted)');

  // Kiểm tra loại trùng
  const occurrencesOfMaison = daCoOn.split('maison').length - 1;
  assert.strictEqual(occurrencesOfMaison, 1, 'Mỗi từ đã có chỉ xuất hiện đúng 1 dòng');
});

test('M41.4 DA_CO vượt 1000 dòng: cắt đúng 1000 dòng và gắn cảnh báo an toàn', () => {
  // Tạo danh sách giả lập 1200 từ duy nhất từ video khác
  const largeVocabList = [];
  for (let i = 1; i <= 1200; i++) {
    largeVocabList.push({
      id: 'item_' + i,
      text: 'mot_' + i,
      videoId: 'other_video'
    });
  }

  const daCoText = buildDaCoList('current_video', 1000, largeVocabList);
  const lines = daCoText.split('\n');

  // 1000 dòng từ vựng + 1 dòng cảnh báo = 1001 dòng
  assert.strictEqual(lines.length, 1001, 'Phải có đúng 1000 dòng từ và 1 dòng cảnh báo');
  assert.ok(lines[lines.length - 1].includes('[CẢNH BÁO: Kho có 1200 từ khác; đã giới hạn 1000 dòng'), 'Phải có dòng cảnh báo số lượng');
});

test('M41.5 SOURCE_ID: từ chối chuỗi giả (yt:unknown), ném lỗi khi videoId rỗng, chấp nhận local:id', () => {
  // 1. Khi videoId rỗng -> ném lỗi, tuyệt đối không trả về chuỗi giả yt:unknown
  assert.throws(() => {
    generateKeyVocabPrompt({
      videoId: '',
      transcript: 'Test'
    });
  }, /Không có mã nguồn \(SOURCE_ID\) hợp lệ để tạo prompt/);

  // 2. Khi truyền local:id bài học -> sinh đúng SOURCE_ID: local:article_99
  const localRes = generateKeyVocabPrompt({
    videoId: 'local:article_99',
    transcript: 'Test'
  });
  assert.ok(localRes.includes('SOURCE_ID: local:article_99'));
  assert.ok(!localRes.includes('yt:unknown'));
});

test('M41.6 Lọc bỏ nhãn âm thanh [Musique] / [Applaudissements] / [...] khi tạo prompt', () => {
  const rawTranscript = "Bonjour à tous [Musique] et bienvenue ! [Applaudissements] C'est [Rires] parti.";
  const res = generateKeyVocabPrompt({
    videoId: 'yt:video123',
    transcript: rawTranscript
  });
  assert.ok(res.includes("Bonjour à tous et bienvenue ! C'est parti."), 'Transcript trong prompt phải được lọc sạch toàn bộ nhãn âm thanh dạng [...]');
  assert.ok(!res.includes('[Musique]'));
  assert.ok(!res.includes('[Applaudissements]'));
  assert.ok(!res.includes('[Rires]'));
});
