const test = require('node:test');
const assert = require('node:assert/strict');
const {
  definiteArticle,
  indefiniteArticle,
  partitiveArticle,
  elide,
  contract,
  pluralize,
  fillFrame,
  normalizeAnswer,
  formatFrenchPunctuation,
  conjugate
} = require('./french-utils.js');

// ============================================================================
// 1. definiteArticle
// ============================================================================
test('definiteArticle: ca 1 - eau (bắt đầu bằng nguyên âm -> l\')', () => {
  assert.strictEqual(definiteArticle({ fr: 'eau', gender: 'f' }), "l'");
});

test('definiteArticle: ca 2 - hôtel (bắt đầu bằng h câm / h muet -> l\')', () => {
  assert.strictEqual(definiteArticle({ fr: 'hôtel', gender: 'm' }), "l'");
});

test('definiteArticle: ca 3 - héros (h aspiré -> le, không lược âm)', () => {
  assert.strictEqual(definiteArticle({ fr: 'héros', gender: 'm', h_aspire: true }), 'le');
});

test('definiteArticle: ca 4 - l\'addition (danh từ giống cái bắt đầu bằng phụ âm)', () => {
  assert.strictEqual(definiteArticle({ fr: 'addition', gender: 'f' }), "l'");
  assert.strictEqual(definiteArticle({ fr: 'table', gender: 'f' }), 'la');
});

test('definiteArticle: ca 5 - số nhiều (plural -> les)', () => {
  assert.strictEqual(definiteArticle({ fr: 'amis', plural: true }), 'les');
});

test('definiteArticle: ca 6 - thiếu giống (gender missing) -> trả về null, không đoán', () => {
  assert.strictEqual(definiteArticle({ fr: 'mot' }), null);
  assert.strictEqual(definiteArticle({ fr: 'inconnu', gender: null }), null);
});

// ============================================================================
// 2. indefiniteArticle
// ============================================================================
test('indefiniteArticle: ca 1 - un (giống đực số ít)', () => {
  assert.strictEqual(indefiniteArticle({ fr: 'café', gender: 'm' }), 'un');
});

test('indefiniteArticle: ca 2 - une (giống cái số ít)', () => {
  assert.strictEqual(indefiniteArticle({ fr: 'table', gender: 'f' }), 'une');
});

test('indefiniteArticle: ca 3 - ami & œuf (un ami, un œuf)', () => {
  assert.strictEqual(indefiniteArticle({ fr: 'ami', gender: 'm' }), 'un');
  assert.strictEqual(indefiniteArticle({ fr: 'œuf', gender: 'm' }), 'un');
});

test('indefiniteArticle: ca 4 - số nhiều -> des', () => {
  assert.strictEqual(indefiniteArticle({ fr: 'livres', plural: true }), 'des');
});

test('indefiniteArticle: ca 5 - thiếu giống -> trả về null, không đoán', () => {
  assert.strictEqual(indefiniteArticle({ fr: 'mot' }), null);
});

// ============================================================================
// 3. partitiveArticle
// ============================================================================
test('partitiveArticle: ca 1 - de l\'eau (nguyên âm -> de l\')', () => {
  assert.strictEqual(partitiveArticle({ fr: 'eau', gender: 'f' }), "de l'");
});

test('partitiveArticle: ca 2 - de l\'hôtel (h muet -> de l\')', () => {
  assert.strictEqual(partitiveArticle({ fr: 'hôtel', gender: 'm' }), "de l'");
});

test('partitiveArticle: ca 3 - du héros (h aspiré -> du, không lược âm)', () => {
  assert.strictEqual(partitiveArticle({ fr: 'héros', gender: 'm', h_aspire: true }), 'du');
});

test('partitiveArticle: ca 4 - de la bière (giống cái phụ âm -> de la)', () => {
  assert.strictEqual(partitiveArticle({ fr: 'bière', gender: 'f' }), 'de la');
});

test('partitiveArticle: ca 5 - du pain & des (giống đực phụ âm -> du, số nhiều -> des)', () => {
  assert.strictEqual(partitiveArticle({ fr: 'pain', gender: 'm' }), 'du');
  assert.strictEqual(partitiveArticle({ fr: 'frites', plural: true }), 'des');
});

test('partitiveArticle: ca 6 - thiếu giống -> trả về null', () => {
  assert.strictEqual(partitiveArticle({ fr: 'chose' }), null);
});

// ============================================================================
// 4. elide
// ============================================================================
test('elide: ca 1 - l\'eau (le/la + eau -> l\'eau)', () => {
  assert.strictEqual(elide('le', 'eau'), "l'eau");
  assert.strictEqual(elide('la', 'eau'), "l'eau");
});

test('elide: ca 2 - d\'ami & d\'accord (de + ami -> d\'ami)', () => {
  assert.strictEqual(elide('de', 'ami'), "d'ami");
  assert.strictEqual(elide('de', 'accord'), "d'accord");
});

test('elide: ca 3 - héros (h aspiré: le héros, không lược âm)', () => {
  assert.strictEqual(elide('le', 'héros', { h_aspire: true }), 'le héros');
  assert.strictEqual(elide('de', 'héros', { h_aspire: true }), 'de héros');
});

test('elide: ca 4 - si trước il / ils (s\'il, s\'ils) vs si trước elle (si elle)', () => {
  assert.strictEqual(elide('si', 'il'), "s'il");
  assert.strictEqual(elide('si', 'ils'), "s'ils");
  assert.strictEqual(elide('si', 'elle'), 'si elle');
});

test('elide: ca 5 - các đại từ j\', n\', c\', qu\'', () => {
  assert.strictEqual(elide('je', 'aime'), "j'aime");
  assert.strictEqual(elide('ne', 'est'), "n'est");
  assert.strictEqual(elide('ce', 'est'), "c'est");
  assert.strictEqual(elide('que', 'il'), "qu'il");
});

// ============================================================================
// 5. contract
// ============================================================================
test('contract: ca 1 - à + le -> au', () => {
  assert.strictEqual(contract('à', 'le'), 'au');
  assert.strictEqual(contract('a', 'le'), 'au');
});

test('contract: ca 2 - à + les -> aux', () => {
  assert.strictEqual(contract('à', 'les'), 'aux');
});

test('contract: ca 3 - de + le -> du', () => {
  assert.strictEqual(contract('de', 'le'), 'du');
});

test('contract: ca 4 - de + les -> des', () => {
  assert.strictEqual(contract('de', 'les'), 'des');
});

test('contract: ca 5 - không rút gọn trước la và l\' (à la, à l\', de la, de l\')', () => {
  assert.strictEqual(contract('à', 'la'), 'à la');
  assert.strictEqual(contract('à', "l'"), "à l'");
  assert.strictEqual(contract('de', 'la'), 'de la');
  assert.strictEqual(contract('de', "l'"), "de l'");
});

test('contract: ca 6 - dữ liệu không hợp lệ -> null', () => {
  assert.strictEqual(contract('pour', 'le'), null);
  assert.strictEqual(contract('à', 'un'), null);
});

// ============================================================================
// 6. pluralize
// ============================================================================
test('pluralize: ca 1 - đuôi -s, -x, -z giữ nguyên', () => {
  assert.strictEqual(pluralize('temps'), 'temps');
  assert.strictEqual(pluralize('prix'), 'prix');
  assert.strictEqual(pluralize('nez'), 'nez');
});

test('pluralize: ca 2 - đuôi -eau, -eu thêm -x (eau -> eaux, chapeau -> chapeaux, jeu -> jeux)', () => {
  assert.strictEqual(pluralize('eau'), 'eaux');
  assert.strictEqual(pluralize('chapeau'), 'chapeaux');
  assert.strictEqual(pluralize('jeu'), 'jeux');
});

test('pluralize: ca 3 - ngoại lệ đuôi -eu: pneu và bleu thêm -s (không thêm -x)', () => {
  assert.strictEqual(pluralize('pneu'), 'pneus');
  assert.strictEqual(pluralize('bleu'), 'bleus');
});

test('pluralize: ca 4 - quy tắc thông thường thêm -s (ami -> amis, œuf -> œufs, table -> tables)', () => {
  assert.strictEqual(pluralize('ami'), 'amis');
  assert.strictEqual(pluralize('œuf'), 'œufs');
  assert.strictEqual(pluralize('table'), 'tables');
});

test('pluralize: ca 5 - danh từ đuôi -al, -ail, -au, -ou và danh từ bất quy tắc đặc biệt nếu không có sẵn noun.plural -> trả về null, không tự đoán', () => {
  // -al và -ail
  assert.strictEqual(pluralize('cheval'), null);
  assert.strictEqual(pluralize('journal'), null);
  assert.strictEqual(pluralize('travail'), null);
  assert.strictEqual(pluralize('bal'), null);

  // 11 từ kiểm tra cụ thể theo yêu cầu: tuyau, noyau, bijou, chou, trou, œil, ciel, monsieur, madame, os, bonhomme
  assert.strictEqual(pluralize('tuyau'), null); // đuôi -au không tự đoán
  assert.strictEqual(pluralize('noyau'), null); // đuôi -au không tự đoán
  assert.strictEqual(pluralize('bijou'), null); // đuôi -ou không tự đoán
  assert.strictEqual(pluralize('chou'), null);  // đuôi -ou không tự đoán
  assert.strictEqual(pluralize('trou'), null);  // đuôi -ou không tự đoán
  assert.strictEqual(pluralize('œil'), null);   // bất quy tắc không đoán
  assert.strictEqual(pluralize('ciel'), null);  // bất quy tắc không đoán
  assert.strictEqual(pluralize('monsieur'), null); // bất quy tắc không đoán
  assert.strictEqual(pluralize('madame'), null);   // bất quy tắc không đoán
  assert.strictEqual(pluralize('os'), 'os');       // đuôi -s giữ nguyên chính xác ở số nhiều
  assert.strictEqual(pluralize('bonhomme'), null); // bất quy tắc không đoán
});

test('pluralize: ca 6 - có sẵn noun.plural thì ưu tiên trả về đúng giá trị đó', () => {
  assert.strictEqual(pluralize({ lemma: 'cheval', plural: 'chevaux' }), 'chevaux');
  assert.strictEqual(pluralize({ lemma: 'journal', plural: 'journaux' }), 'journaux');
  assert.strictEqual(pluralize({ lemma: 'travail', plural: 'travaux' }), 'travaux');
  assert.strictEqual(pluralize({ lemma: 'bal', plural: 'bals' }), 'bals');
  assert.strictEqual(pluralize({ lemma: 'œil', plural: 'yeux', irregular: true }), 'yeux');
  assert.strictEqual(pluralize({ lemma: 'tuyau', plural: 'tuyaux' }), 'tuyaux');
  assert.strictEqual(pluralize({ lemma: 'bijou', plural: 'bijoux' }), 'bijoux');
  assert.strictEqual(pluralize({ lemma: 'monsieur', plural: 'messieurs' }), 'messieurs');
  assert.strictEqual(pluralize({ lemma: 'madame', plural: 'mesdames' }), 'mesdames');
  assert.strictEqual(pluralize({ lemma: 'trou', plural: 'trous' }), 'trous');
});

// ============================================================================
// 7. fillFrame
// ============================================================================
test('fillFrame: ca 1 - điền ô trống đơn giản', () => {
  assert.strictEqual(fillFrame('Je voudrais {item}.', 'un café'), 'Je voudrais un café.');
});

test('fillFrame: ca 2 - điền khung với {NOUN_INDEF}: chambre (f) -> "Je voudrais une chambre."', () => {
  const nounChambre = { fr: 'chambre', gender: 'f' };
  assert.strictEqual(fillFrame('Je voudrais {NOUN_INDEF}.', nounChambre), 'Je voudrais une chambre.');
});

test('fillFrame: ca 3 - điền khung với {NOUN_PART}: chọn mạo từ bộ phận theo từ', () => {
  // m phụ âm -> du pain
  assert.strictEqual(fillFrame('Vous avez {NOUN_PART} ?', { fr: 'pain', gender: 'm' }), 'Vous avez du pain ?');
  // f phụ âm -> de la bière
  assert.strictEqual(fillFrame('Vous avez {NOUN_PART} ?', { fr: 'bière', gender: 'f' }), 'Vous avez de la bière ?');
  // nguyên âm -> de l'eau
  assert.strictEqual(fillFrame('Vous avez {NOUN_PART} ?', { fr: 'eau', gender: 'f' }), "Vous avez de l'eau ?");
  // h muet -> de l'hôtel
  assert.strictEqual(fillFrame('Vous avez {NOUN_PART} ?', { fr: 'hôtel', gender: 'm' }), "Vous avez de l'hôtel ?");
  // h aspiré -> du héros (không lược âm)
  assert.strictEqual(fillFrame('Vous avez {NOUN_PART} ?', { fr: 'héros', gender: 'm', h_aspire: true }), 'Vous avez du héros ?');
});

test('fillFrame: ca 4 - tự động lược âm ở ranh giới ô trống', () => {
  assert.strictEqual(fillFrame('Je bois de {drink}.', 'eau'), "Je bois d'eau.");
});

test('fillFrame: ca 5 - tự động rút gọn giới từ ở ranh giới ô trống (à + le -> au)', () => {
  assert.strictEqual(fillFrame('Tu vas à {place} ?', 'le parc'), 'Tu vas au parc ?');
});

test('fillFrame: ca 6 - chuẩn hóa dấu cách tiếng Pháp trước ? ! : ;', () => {
  const res = fillFrame('Comment vas-tu{punc}', '?');
  assert.strictEqual(res, 'Comment vas-tu ?');
});

test('fillFrame: ca 7 - thiếu frame, thiếu slotValue, hoặc thiếu gender với thẻ yêu cầu mạo từ -> trả về null', () => {
  assert.strictEqual(fillFrame(null, 'test'), null);
  assert.strictEqual(fillFrame('Je suis {name}', null), null);
  assert.strictEqual(fillFrame('Không có ô trống', 'test'), null);
  // Thiếu gender khi dùng {NOUN_INDEF} hoặc {NOUN_PART} -> trả null (không đoán)
  assert.strictEqual(fillFrame('Je voudrais {NOUN_INDEF}.', { fr: 'chambre' }), null);
  assert.strictEqual(fillFrame('Vous avez {NOUN_PART} ?', { fr: 'pain' }), null);
});

// ============================================================================
// 8. formatFrenchPunctuation (Tối thiểu 5 ca riêng biệt)
// ============================================================================
test('formatFrenchPunctuation: ca 1 - thêm 1 khoảng trắng chuẩn trước ? ! : ; khi đứng sau chữ cái/dấu câu', () => {
  assert.strictEqual(formatFrenchPunctuation('Comment allez-vous?'), 'Comment allez-vous ?');
  assert.strictEqual(formatFrenchPunctuation('Incroyable!'), 'Incroyable !');
  assert.strictEqual(formatFrenchPunctuation('Attention: stop;'), 'Attention : stop ;');
});

test('formatFrenchPunctuation: ca 2 - các trường hợp đặc biệt (15:30, URL, Note: ok, Quoi?!, 10h30)', () => {
  // Không chèn khoảng trắng giữa 2 chữ số (giờ) hoặc trong URL
  assert.strictEqual(formatFrenchPunctuation('Il est 15:30'), 'Il est 15:30');
  assert.strictEqual(formatFrenchPunctuation('https://example.com'), 'https://example.com');
  // Chèn/giữ khoảng trắng trước : sau chữ cái
  assert.strictEqual(formatFrenchPunctuation('Note : ok'), 'Note : ok');
  assert.strictEqual(formatFrenchPunctuation('Note: ok'), 'Note : ok');
  // Cụm ?! gộp chung, chỉ chèn khoảng trắng trước cả cụm
  assert.strictEqual(formatFrenchPunctuation('Quoi?!'), 'Quoi ?!');
  // 10h30 giữ nguyên
  assert.strictEqual(formatFrenchPunctuation('10h30'), '10h30');
});

test('formatFrenchPunctuation: ca 3 - chuẩn hóa nháy cong ’ -> \' và dọn khoảng trắng quanh nháy', () => {
  assert.strictEqual(formatFrenchPunctuation('c’est l’eau'), "c'est l'eau");
  assert.strictEqual(formatFrenchPunctuation("d ' accord"), "d'accord");
  assert.strictEqual(formatFrenchPunctuation("j ’ aime"), "j'aime");
});

test('formatFrenchPunctuation: ca 4 - thu gọn nhiều khoảng trắng liên tiếp và dọn trước dấu chấm/phẩy', () => {
  assert.strictEqual(formatFrenchPunctuation('Je   voudrais    un   café'), 'Je voudrais un café');
  assert.strictEqual(formatFrenchPunctuation('\tBonjour \t le   monde\t'), 'Bonjour le monde');
  assert.strictEqual(formatFrenchPunctuation('Bonjour , le monde .'), 'Bonjour, le monde.');
  assert.strictEqual(formatFrenchPunctuation('Oui , bien sûr .'), 'Oui, bien sûr.');
});

test('formatFrenchPunctuation: ca 5 - chuỗi rỗng, null, undefined hoặc chỉ toàn khoảng trắng -> trả về \'\'', () => {
  assert.strictEqual(formatFrenchPunctuation(''), '');
  assert.strictEqual(formatFrenchPunctuation(null), '');
  assert.strictEqual(formatFrenchPunctuation(undefined), '');
  assert.strictEqual(formatFrenchPunctuation('   '), '');
});

// ============================================================================
// 9. normalizeAnswer
// ============================================================================
test('normalizeAnswer: ca 1 - BỎ khoảng trắng trước ? ! : ; để so sánh nhất quán và không lệch diff', () => {
  const res = normalizeAnswer("C’est bon ?", "C'est bon ?");
  assert.strictEqual(res.isCorrect, true);
  // Cả hai đều được bỏ khoảng trắng trước ? ! : ; theo đúng đặc tả
  assert.strictEqual(res.normalizedUser, "c'est bon?");
  assert.strictEqual(res.normalizedExpected, "c'est bon?");
  // Diff không có khoảng trắng thừa/thiếu trước dấu ?
  assert.strictEqual(res.diff.every(d => d.status === 'match'), true);
});

test('normalizeAnswer: ca 2 - chế độ strict phân biệt dấu phụ (ou vs où)', () => {
  const res = normalizeAnswer('Ou vas-tu ?', 'Où vas-tu ?', { mode: 'strict' });
  assert.strictEqual(res.isCorrect, false);
  assert.strictEqual(res.diff.some(d => d.status === 'missing' || d.status === 'extra'), true);
});

test('normalizeAnswer: ca 3 - chế độ lenient tha thứ dấu phụ', () => {
  const res = normalizeAnswer('Ou vas-tu', 'Où vas-tu ?', { mode: 'lenient' });
  assert.strictEqual(res.isCorrect, true);
});

test('normalizeAnswer: ca 4 - trả mảng diff ký tự chi tiết', () => {
  const res = normalizeAnswer('chat', 'char');
  assert.strictEqual(res.isCorrect, false);
  assert.strictEqual(Array.isArray(res.diff), true);
  assert.strictEqual(res.diff.length > 0, true);
});

test('normalizeAnswer: ca 5 - câu trả lời rỗng hoặc sai khác hoàn toàn', () => {
  const res = normalizeAnswer('', 'bonjour');
  assert.strictEqual(res.isCorrect, false);
});

// ============================================================================
// 10. conjugate (Thứ tự tham số: verbItem, tense, person)
// ============================================================================
test('conjugate: ca 1 - tra cứu đúng thì và ngôi theo thứ tự (verbItem, tense, person)', () => {
  const verb = {
    inf: 'être',
    conjugation: {
      present: {
        '1s': 'suis',
        '2s': 'es',
        '3s': 'est',
        '1p': 'sommes',
        '2p': 'êtes',
        '3p': 'sont'
      }
    }
  };
  assert.strictEqual(conjugate(verb, 'present', '1s'), 'suis');
  assert.strictEqual(conjugate(verb, 'present', '2p'), 'êtes');
});

test('conjugate: ca 2 - thiếu thì (tense) -> trả về null, không tự đoán', () => {
  const verb = { inf: 'avoir', conjugation: { present: { '1s': 'ai' } } };
  assert.strictEqual(conjugate(verb, 'imparfait', '1s'), null);
});

test('conjugate: ca 3 - thiếu ngôi (person) -> trả về null, không tự đoán', () => {
  const verb = { inf: 'aller', conjugation: { present: { '1s': 'vais' } } };
  assert.strictEqual(conjugate(verb, 'present', '2s'), null);
});

test('conjugate: ca 4 - hoàn toàn không có trường conjugation -> trả về null', () => {
  const verb = { inf: 'faire' };
  assert.strictEqual(conjugate(verb, 'present', '1s'), null);
});

test('conjugate: ca 5 - đối tượng verb không hợp lệ -> trả về null', () => {
  assert.strictEqual(conjugate(null, 'present', '1s'), null);
  assert.strictEqual(conjugate('parler', 'present', '1s'), null);
});
