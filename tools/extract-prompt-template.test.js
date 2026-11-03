const test = require('node:test');
const assert = require('node:assert');
const {
  PROMPT_TUVUNG_V1,
  PROMPT_TUVUNG_V2,
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

  // Kỳ vọng: Khối <<<DA_CO...>>> chỉ chứa "maison" và "école", không chứa "bonjour", "merci" (cùng video) và không chứa "café" (_deleted)
  const daCoBlock = (daCoOn.match(/<<<DA_CO\n([\s\S]*?)\n>>>/) || [])[1] || '';
  assert.ok(daCoBlock.includes('maison'), 'Phải chứa từ maison từ video khác');
  assert.ok(daCoBlock.includes('école'), 'Phải chứa từ école từ video khác');
  assert.ok(!daCoBlock.includes('bonjour'), 'TUYỆT ĐỐI KHÔNG chứa từ thuộc video hiện tại trong khối DA_CO');
  assert.ok(!daCoBlock.includes('merci'), 'TUYỆT ĐỐI KHÔNG chứa từ thuộc video hiện tại trong khối DA_CO');
  assert.ok(!daCoBlock.includes('café'), 'TUYỆT ĐỐI KHÔNG chứa từ đã xóa (_deleted)');

  // Kiểm tra loại trùng
  const occurrencesOfMaison = daCoBlock.split('maison').length - 1;
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

test('M4.1 PROMPT_TUVUNG_V1 và PROMPT_TUVUNG_V2 được bảo toàn và export đầy đủ', () => {
  assert.ok(PROMPT_TUVUNG_V1 && typeof PROMPT_TUVUNG_V1 === 'string', 'PROMPT_TUVUNG_V1 phải là chuỗi hợp lệ');
  assert.ok(PROMPT_TUVUNG_V2 && typeof PROMPT_TUVUNG_V2 === 'string', 'PROMPT_TUVUNG_V2 phải là chuỗi hợp lệ');
  assert.strictEqual(EXTRACT_PROMPT_TEMPLATE, PROMPT_TUVUNG_V2, 'EXTRACT_PROMPT_TEMPLATE mặc định phải là bản V2');
});

test('M4.2 PROMPT_TUVUNG_V2 chứa đủ 4 điểm mới và điền biến an toàn', () => {
  // Điểm 1: 2 luồng trích xuất và LOẠI TRỪ cụ thể
  assert.ok(PROMPT_TUVUNG_V2.includes('(1) Cụm phản xạ giao tiếp thực tế'), 'V2 phải có luồng 1 phản xạ giao tiếp');
  assert.ok(PROMPT_TUVUNG_V2.includes('(2) Từ vựng, động từ then chốt mang tính chủ đề'), 'V2 phải có luồng 2 từ vựng/động từ');
  assert.ok(PROMPT_TUVUNG_V2.includes('LOẠI TRỪ: Các từ ngữ pháp đơn lẻ rỗng nghĩa'), 'V2 phải có danh sách loại trừ cụ thể');

  // Điểm 2: Quét bao phủ toàn bài & Cân bằng danh mục
  assert.ok(PROMPT_TUVUNG_V2.includes('b) QUÉT BAO PHỦ TOÀN BÀI (Chống lười/dừng sớm)'), 'V2 phải có quy tắc chống dừng sớm');
  assert.ok(PROMPT_TUVUNG_V2.includes('c) CÂN BẰNG DANH MỤC: Bắt buộc trích xuất cân bằng cả 2 luồng'), 'V2 phải có quy tắc cân bằng danh mục');

  // Điểm 3: Quét vi mô từng câu
  assert.ok(PROMPT_TUVUNG_V2.includes('Bước 1: Đọc quét văn bản theo trình tự thời gian từ đầu đến cuối.'), 'V2 phải quét theo trình tự thời gian');
  assert.ok(PROMPT_TUVUNG_V2.includes('Bước 2: Với mỗi câu/mệnh đề, kiểm tra:'), 'V2 phải kiểm tra vi mô từng câu/mệnh đề');

  // Điểm 4: Động từ chủ đề
  assert.ok(PROMPT_TUVUNG_V2.includes('- từ: từ đơn, danh từ đơn/ghép, tính từ, trạng từ, liên từ, động từ chủ đề.'), 'V2 phải bổ sung động từ chủ đề');

  // Kiểm tra điền biến qua generateKeyVocabPrompt
  const out = generateKeyVocabPrompt({
    videoId: '7wUXSXZgNlU',
    videoTitle: '35 Verbes',
    transcript: 'Hélène se lève de bonne heure.'
  });
  assert.ok(out.includes('SOURCE_ID: yt:7wUXSXZgNlU'));
  assert.ok(out.includes('Hélène se lève de bonne heure.'));
  assert.strictEqual(out.match(/\{\{[A-Z_]+\}\}/g), null, 'Không được còn sót placeholder {{...}}');
});
