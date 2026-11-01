const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  fr_basic,
  norm_key,
  slug,
  mapTagToType,
  generateItemId,
  areSuspiciousDuplicates,
  classifyImportItem,
  parseText2A,
  parseJson2B,
  readExistingVocabToSchemaV02
} = require('./schema-v02.js');

test('fr_basic, norm_key & item_id: ép Unicode NFC, NFD và NFC sinh ra cùng fr_basic, norm_key và item_id', () => {
  // NFD (ký tự rời: 'e' + combining acute accent '\u0301') vs NFC ('\u00e9')
  const nfdWord = 'e\u0301cole';
  const nfcWord = '\u00e9cole';
  assert.notStrictEqual(nfdWord, nfcWord, 'Chuỗi thô NFD và NFC khác nhau về mã nhị phân');
  assert.strictEqual(fr_basic(nfdWord), fr_basic(nfcWord), 'fr_basic của NFD và NFC phải bằng nhau');
  assert.strictEqual(fr_basic(nfdWord), '\u00e9cole', 'fr_basic phải trả về chuỗi NFC');
  assert.strictEqual(norm_key(nfdWord), norm_key(nfcWord), 'norm_key của NFD và NFC phải bằng nhau');
  assert.strictEqual(generateItemId('word', nfdWord), generateItemId('word', nfcWord), 'item_id của NFD và NFC phải bằng nhau');

  // Trường hợp où (o + combining grave accent '\u0300') vs '\u00f9'
  const nfdOu = 'ou\u0300';
  const nfcOu = 'o\u00f9';
  assert.strictEqual(fr_basic(nfdOu), fr_basic(nfcOu));
  assert.strictEqual(norm_key(nfdOu), norm_key(nfcOu));
  assert.strictEqual(generateItemId('word', nfdOu), generateItemId('word', nfcOu));
});

test('classifyImportItem: NFD (e + \\u0301) khi đối chiếu với NFC (é) được xếp vào "ĐÃ CÓ", KHÔNG phải "NGHI TRÙNG"', () => {
  const existingVocab = [
    { fr: '\u00e9cole', meaning_vi: 'trường học', tag: 'từ' } // Lưu dưới dạng NFC
  ];

  // Đầu vào import ở dạng NFD
  const importItemNFD = { fr: 'e\u0301cole' };
  const result = classifyImportItem(importItemNFD, existingVocab);

  assert.ok(result, 'Phải có kết quả phân loại');
  assert.strictEqual(result.status, 'EXISTS', 'Phải được phân loại là EXISTS (ĐÃ CÓ)');
  assert.strictEqual(result.label, 'ĐÃ CÓ');
  assert.notStrictEqual(result.status, 'SUSPICIOUS', 'TUYỆT ĐỐI KHÔNG được phân loại là NGHI TRÙNG');
  assert.strictEqual(result.matchedItem.fr, '\u00e9cole');

  // Kiểm tra chiều ngược lại: existing lưu NFD, import vào dạng NFC
  const existingVocabNFD = [{ fr: 'e\u0301cole', meaning_vi: 'trường học' }];
  const importItemNFC = { fr: '\u00e9cole' };
  const resultReverse = classifyImportItem(importItemNFC, existingVocabNFD);
  assert.strictEqual(resultReverse.status, 'EXISTS');
  assert.strictEqual(resultReverse.label, 'ĐÃ CÓ');
});

test('classifyImportItem: đối chiếu 3 ca tiêu biểu (école NFD/NFC, ou/où, avoir besoin de / d\')', () => {
  const existingVocab = [
    { fr: '\u00e9cole', meaning_vi: 'trường học' },
    { fr: 'ou', meaning_vi: 'hoặc' },
    { fr: 'avoir besoin de', meaning_vi: 'cần' }
  ];

  // Ca 1: école NFD vs NFC -> EXISTS (ĐÃ CÓ)
  const r1 = classifyImportItem({ fr: 'e\u0301cole' }, existingVocab);
  assert.strictEqual(r1.status, 'EXISTS');
  assert.strictEqual(r1.label, 'ĐÃ CÓ');

  // Ca 2: ou vs où -> SUSPICIOUS (NGHI TRÙNG vì khác dấu phụ, cảnh báo người dùng kiểm tra)
  const r2 = classifyImportItem({ fr: 'où' }, existingVocab);
  assert.strictEqual(r2.status, 'SUSPICIOUS');
  assert.strictEqual(r2.label, 'NGHI TRÙNG');
  assert.strictEqual(r2.matchedItem.fr, 'ou');

  // Ca 3: avoir besoin de vs avoir besoin d' -> SUSPICIOUS (NGHI TRÙNG vì biến thể lược âm đuôi)
  const r3 = classifyImportItem({ fr: "avoir besoin d'" }, existingVocab);
  assert.strictEqual(r3.status, 'SUSPICIOUS');
  assert.strictEqual(r3.label, 'NGHI TRÙNG');
  assert.strictEqual(r3.matchedItem.fr, 'avoir besoin de');

  // Ca hoàn toàn mới: không trùng, không nghi trùng -> NEW
  const r4 = classifyImportItem({ fr: 'bonjour' }, existingVocab);
  assert.strictEqual(r4.status, 'NEW');
  assert.strictEqual(r4.label, 'MỤC MỚI');
});

test('norm_key: giữ tiền tố phản xạ s\' để phân biệt động từ nguyên mẫu và phản xạ', () => {
  const k1 = norm_key('améliorer');
  const k2 = norm_key("s'améliorer");
  assert.strictEqual(k1, 'améliorer');
  assert.strictEqual(k2, "s'améliorer");
  assert.notStrictEqual(k1, k2, "améliorer và s'améliorer phải có norm_key khác nhau, không được tự gộp");
});

test('norm_key: giữ nguyên dấu tiếng Pháp để phân biệt từ vựng khác nghĩa (ou vs où)', () => {
  const ou = norm_key('ou');
  const ouWhere = norm_key('où');
  assert.strictEqual(ou, 'ou');
  assert.strictEqual(ouWhere, 'où');
  assert.notStrictEqual(ou, ouWhere, 'ou và où phải có norm_key khác nhau');
});

test('norm_key: chuẩn hóa ligatures œuf == oeuf', () => {
  const o1 = norm_key('œuf');
  const o2 = norm_key('oeuf');
  assert.strictEqual(o1, 'oeuf');
  assert.strictEqual(o2, 'oeuf');
  assert.strictEqual(o1, o2, 'œuf và oeuf phải có norm_key giống nhau');
});

test('norm_key: chuẩn hóa nháy cong ’ thành nháy thẳng \'', () => {
  const curly = norm_key('d’accord');
  const straight = norm_key("d'accord");
  assert.strictEqual(curly, "d'accord");
  assert.strictEqual(straight, "d'accord");
  assert.strictEqual(curly, straight, "Nháy cong ’ phải được chuyển thành nháy thẳng '");
});

test('norm_key: xử lý s\'il vous plaît', () => {
  const key = norm_key("  S'il   vous plaît.  ");
  assert.strictEqual(key, "s'il vous plaît", "s'il vous plaît phải được chuẩn hóa khoảng trắng, chữ thường và dấu chấm viền");
});

test('slug & item_id bất biến: giữ nguyên chữ tiếng Pháp, hoàn toàn độc lập với thứ tự nạp', () => {
  // Slug giữ nguyên dấu tiếng Pháp để phân biệt từ khác nghĩa
  assert.strictEqual(slug('ou'), 'ou');
  assert.strictEqual(slug('où'), 'où');
  assert.strictEqual(slug('a'), 'a');
  assert.strictEqual(slug('à'), 'à');
  assert.strictEqual(slug('sur'), 'sur');
  assert.strictEqual(slug('sûr'), 'sûr');
  assert.strictEqual(slug("s'il vous plaît"), 's-il-vous-plaît');

  // Thứ tự 1: ou trước, où sau
  const order1 = [
    { id: '1', text: 'ou', tag: 'Từ' },
    { id: '2', text: 'où', tag: 'Từ' },
    { id: '3', text: 'a', tag: 'Từ' },
    { id: '4', text: 'à', tag: 'Từ' },
    { id: '5', text: 'sur', tag: 'Từ' },
    { id: '6', text: 'sûr', tag: 'Từ' }
  ];
  const res1 = readExistingVocabToSchemaV02(order1);

  // Thứ tự 2: đảo ngược thứ tự nạp (où trước, ou sau; à trước, a sau; sûr trước, sur sau)
  const order2 = [
    { id: '2', text: 'où', tag: 'Từ' },
    { id: '1', text: 'ou', tag: 'Từ' },
    { id: '4', text: 'à', tag: 'Từ' },
    { id: '3', text: 'a', tag: 'Từ' },
    { id: '6', text: 'sûr', tag: 'Từ' },
    { id: '5', text: 'sur', tag: 'Từ' }
  ];
  const res2 = readExistingVocabToSchemaV02(order2);

  // Đối chiếu ID của res1 và res2: phải giống hệt nhau 100%
  const getMap = (items) => new Map(items.map(x => [x.fr, x.item_id]));
  const map1 = getMap(res1.items);
  const map2 = getMap(res2.items);

  assert.strictEqual(map1.get('ou'), 'word:ou');
  assert.strictEqual(map2.get('ou'), 'word:ou');
  assert.strictEqual(map1.get('où'), 'word:où');
  assert.strictEqual(map2.get('où'), 'word:où');

  assert.strictEqual(map1.get('a'), 'word:a');
  assert.strictEqual(map2.get('a'), 'word:a');
  assert.strictEqual(map1.get('à'), 'word:à');
  assert.strictEqual(map2.get('à'), 'word:à');

  assert.strictEqual(map1.get('sur'), 'word:sur');
  assert.strictEqual(map2.get('sur'), 'word:sur');
  assert.strictEqual(map1.get('sûr'), 'word:sûr');
  assert.strictEqual(map2.get('sûr'), 'word:sûr');

  // Đã có sẵn item_id thì giữ nguyên, không tính lại
  const withExistingId = [{ id: '99', text: 'ou', tag: 'Từ', item_id: 'legacy:word-123' }];
  const resExisting = readExistingVocabToSchemaV02(withExistingId);
  assert.strictEqual(resExisting.items[0].item_id, 'legacy:word-123', 'Phải giữ nguyên item_id đã có');
});

test('parser 2A: test đủ 3 mẫu (mục mới, dòng ≈ nghi trùng, OCC) và bỏ qua dòng #, ghi chú', () => {
  const sample = `# SOURCE: yt:test1234 | Bài học thử nghiệm
# Đây là dòng ghi chú đầu file, phải bỏ qua
Đã xuất xong từ số 1 đến 200

213. s'il vous plaît || cụm từ || A1 || [loc.] làm ơn, xin vui lòng
Trong bài: Oui, s'il vous plaît.
VD1: Un café, s'il vous plaît. || Cho tôi một ly cà phê, làm ơn.
VD2: L'addition, s'il vous plaît. || Cho tôi tính tiền, làm ơn.
VD3: Une table pour deux, s'il vous plaît. || Cho một bàn hai người, làm ơn.

# Dòng chú thích giữa chừng
195. avoir表达 d' || cụm từ || A2 || [loc.] cần || ≈ avoir besoin de
Trong bài: J'ai besoin d'aide.
VD1: J'ai besoin d'eau. || Tôi cần nước.
VD2: Tu as besoin de repos. || Bạn cần nghỉ ngơi.
VD3: Nous avons besoin de temps. || Chúng tôi cần thời gian.

214. OCC || s'il vous plaît
Trong bài: Un café, s'il vous plaît.

Điểm dừng: Hết bài học`;

  const parsed = parseText2A(sample, 'fallback_id');
  assert.strictEqual(parsed.source.source_id, 'yt:test1234');
  assert.strictEqual(parsed.source.title, 'Bài học thử nghiệm');
  assert.strictEqual(parsed.items.length, 2, 'Phải parse được 2 mục mới');
  assert.strictEqual(parsed.occurrences.length, 1, 'Phải parse được 1 occurrence');
  assert.strictEqual(parsed.errors.length, 0, 'Không có lỗi cú pháp');

  // Mục 1: s'il vous plaît
  const it1 = parsed.items[0];
  assert.strictEqual(it1.seq, 213);
  assert.strictEqual(it1.fr, "s'il vous plaît");
  assert.strictEqual(it1.type, 'chunk');
  assert.strictEqual(it1.level, 'A1');
  assert.strictEqual(it1.pos, 'loc.');
  assert.strictEqual(it1.meaning_vi, 'làm ơn, xin vui lòng');
  assert.strictEqual(it1.possible_dup_of, null);
  assert.strictEqual(it1.examples.length, 3);

  // Mục 2: dòng có ≈ nghi trùng
  const it2 = parsed.items[1];
  assert.strictEqual(it2.seq, 195);
  assert.strictEqual(it2.possible_dup_of, 'avoir besoin de');

  // Occurrence
  const occ = parsed.occurrences[0];
  assert.strictEqual(occ.seq, 214);
  assert.strictEqual(occ.fr, "s'il vous plaît");
  assert.strictEqual(occ.source_text, 'Un café, s\'il vous plaît.');
});

test('parser 2A: báo lỗi kèm số dòng cụ thể khi dòng sai quy cách', () => {
  const badSample = `213. Thiếu dấu phân cách
Dòng này sai quy cách`;
  const res = parseText2A(badSample, 'src');
  assert.strictEqual(res.errors.length > 0, true);
  assert.strictEqual(res.errors[0].line, 1);
});

test('parser 2B: phân tích JSON và phân giải occurrences bằng fr', () => {
  const jsonObj = {
    source: { source_id: 'yt:json_test', title: 'JSON Test' },
    items: [
      {
        seq: 1,
        fr: 'bonjour',
        type: 'từ',
        level: 'A1',
        pos: 'interj.',
        meaning_vi: 'xin chào',
        source_text: 'Bonjour tout le monde.',
        examples: [{ fr: 'Bonjour !', vi: 'Xin chào !' }]
      }
    ],
    occurrences: [
      { seq: 2, fr: 'bonjour', source_text: 'Bonjour madame.' },
      { seq: 3, fr: 'inconnu_xyz', source_text: 'Một câu chưa có từ trong items.' }
    ]
  };

  const res = parseJson2B(jsonObj, []);
  assert.strictEqual(res.items.length, 1);
  assert.strictEqual(res.occurrences.length, 1, 'Occurrence khớp với bonjour phải phân giải thành công');
  assert.strictEqual(res.occurrences[0].item_id, 'word:bonjour');
  assert.strictEqual(res.unresolved_occurrences.length, 1, 'Occurrence không tìm thấy phải đưa vào danh sách unresolved');
  assert.strictEqual(res.unresolved_occurrences[0].occ.fr, 'inconnu_xyz');
});

test('tombstone: tôn trọng 770 tombstone, không tự hồi sinh', () => {
  const rawWithTombstones = [
    { id: 'active1', text: 'bonjour', tag: 'Từ' },
    { id: 'del1', text: 'salut', _deleted: true, _deletedAt: 1793528592306 }
  ];
  const res = readExistingVocabToSchemaV02(rawWithTombstones);
  assert.strictEqual(res.items.length, 1);
  assert.strictEqual(res.items[0].fr, 'bonjour');
  assert.strictEqual(res.tombstones.length, 1);
  assert.strictEqual(res.tombstones[0].text, 'salut');
});

test('dữ liệu thật: Parser 2A chạy trên backup/video1_291.txt (tự bỏ qua nếu file không tồn tại)', (t) => {
  const filePath = path.join(__dirname, '..', 'backup', 'video1_291.txt');
  if (!fs.existsSync(filePath)) {
    t.skip('Bỏ qua: File backup/video1_291.txt không tồn tại trong môi trường này');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const res = parseText2A(content, 'yt:UoxA5R0tcFA');

  assert.strictEqual(res.errors.length, 0, 'Parser 2A không được có lỗi cú pháp trên file 291');
  assert.strictEqual(res.items.length, 291, 'Phải parse chính xác đủ 291 mục');
});
