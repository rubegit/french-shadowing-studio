const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('M35.1: buildTextHistoryCardHTML sinh thẻ bài chuẩn art-sample-row, không còn txt-thumb hay dấu nháy kép', () => {
  const catalogCode = fs.readFileSync(path.join(__dirname, '../js/01b-catalog.js'), 'utf8');

  // Kiểm tra mã nguồn chứa các class cốt lõi của phong cách thẻ bài báo
  assert.ok(catalogCode.includes('art-sample-row'), 'phải có class art-sample-row');
  assert.ok(catalogCode.includes('art-sample-desc'), 'phải có class art-sample-desc hiển thị trích đoạn');
  assert.ok(catalogCode.includes('art-sample-meta'), 'phải có class art-sample-meta cho footer');
  assert.ok(catalogCode.includes('art-level-chip'), 'phải có class art-level-chip cho huy hiệu cấp độ');
  
  // Trích xuất hàm buildTextHistoryCardHTML để test trực tiếp
  const fnMatch = catalogCode.match(/function buildTextHistoryCardHTML\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Tìm thấy hàm buildTextHistoryCardHTML');

  // Tạo môi trường giả lập nhỏ để chạy hàm
  const escHtml = (s) => String(s || '').replace(/[&<>"']/g, '');
  const aicHasTranslation = (ss) => ss && ss.some((s) => s && s.vi);
  const deriveTextTitle = () => 'Tiêu đề bài';

  const fn = new Function('item', 'escHtml', 'aicHasTranslation', 'deriveTextTitle', `
    ${fnMatch[0]}
    return buildTextHistoryCardHTML(item);
  `);

  const mockItem = {
    videoId: 'txt_test_123',
    title: 'Une année dans ma vie',
    level: 'B1',
    desc: 'Ceci est un extrait de test.',
    sentences: [
      { text: 'Une année dans ma vie.', vi: 'Một năm trong đời tôi.' },
      { text: 'Du matin au fil des siècles.', vi: 'Từ ban mai qua các thế kỷ.' }
    ]
  };

  const html = fn(mockItem, escHtml, aicHasTranslation, deriveTextTitle);

  // 1. Phải có art-sample-row và art-sample-main
  assert.ok(html.includes('art-sample-row'), 'Thẻ phải có class art-sample-row');
  assert.ok(html.includes('art-sample-main'), 'Thẻ phải có class art-sample-main');
  assert.ok(html.includes('art-sample-title'), 'Thẻ phải có class art-sample-title');
  assert.ok(html.includes('Une année dans ma vie'), 'Thẻ phải hiển thị đúng tiêu đề');

  // 2. Phải có trích đoạn và cấp độ
  assert.ok(html.includes('art-sample-desc'), 'Thẻ phải có trích đoạn desc');
  assert.ok(html.includes('art-level-chip'), 'Thẻ phải có huy hiệu cấp độ');

  // 3. Phải có footer meta
  assert.ok(html.includes('art-sample-meta'), 'Thẻ phải có art-sample-meta');
  assert.ok(html.includes('câu'), 'Thẻ phải đếm số câu');
  assert.ok(html.includes('Có song ngữ'), 'Thẻ phải báo Có song ngữ');

  // 4. Phải có nút xóa thùng rác
  assert.ok(html.includes('yt-card-remove'), 'Thẻ phải có nút xóa khỏi lịch sử');
  assert.ok(html.includes('trash-2'), 'Thẻ phải có icon trash-2');

  // 5. KHÔNG ĐƯỢC chứa cấu trúc thumbnail video cũ (txt-thumb, txt-thumb-quote)
  assert.ok(!html.includes('txt-thumb-quote'), 'Không được còn dấu nháy kép txt-thumb-quote');
  assert.ok(!html.includes('txt-thumb-title'), 'Không được còn txt-thumb-title lặp lại tiêu đề');
});

test('M35.2: artCardHTML trong js/01d-player.js đồng bộ chuẩn art-sample-row', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  assert.ok(playerCode.includes('function artCardHTML'), 'Tìm thấy hàm artCardHTML');

  const fnMatch = playerCode.match(/function artCardHTML\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được hàm artCardHTML');

  const escHtml = (s) => String(s || '').replace(/[&<>"']/g, '');
  const aicHasTranslation = () => true;

  const fn = new Function('it', 'hist', 'escHtml', 'aicHasTranslation', `
    ${fnMatch[0]}
    return artCardHTML(it, hist);
  `);

  const mockArticle = {
    id: 'test_cannes',
    title: 'Le Festival de Cannes',
    words: 118,
    sentCount: 15,
    preview: 'Trích đoạn liên hoan phim Cannes...',
    level: 'B1'
  };

  const html = fn(mockArticle, [], escHtml, aicHasTranslation);

  assert.ok(html.includes('art-sample-row'), 'artCardHTML phải có class art-sample-row');
  assert.ok(html.includes('art-sample-title'), 'artCardHTML phải có tiêu đề');
  assert.ok(html.includes('art-sample-desc'), 'artCardHTML phải có trích đoạn');
  assert.ok(html.includes('art-level-chip'), 'artCardHTML phải có chip cấp độ');
  assert.ok(!html.includes('txt-thumb-quote'), 'artCardHTML không được chứa txt-thumb-quote');
});

test('M35.3: theme-light.css định dạng gọn gàng thẻ bài báo trong #text-history-container', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/theme-light.css'), 'utf8');

  assert.ok(css.includes('#text-history-container .art-sample-row') || css.includes('#text-history-container .yt-card.txt-card.art-sample-row'), 'Phải có CSS cho art-sample-row trong history');
  assert.ok(css.includes('#text-history-container .art-history-card .art-sample-title'), 'Phải có padding-right cho tiêu đề để tránh đè nút');
  assert.ok(css.includes('#text-history-container .art-sample-side'), 'Phải có định dạng cho art-sample-side');
});

test('M35.4: removeHistoryItem luôn hỏi xác nhận người dùng trước khi xóa để tránh nhấn nhầm', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  // Kiểm tra mã nguồn chứa logic hỏi xác nhận
  assert.ok(playerCode.includes('// Hỏi xác nhận trước khi xóa để tránh nhấn nhầm'), 'Phải có comment giải thích hỏi xác nhận');
  assert.ok(playerCode.includes('confirm(confirmMsg)'), 'Phải gọi confirm để hỏi người dùng');

  // Trích xuất hàm removeHistoryItem
  const fnMatch = playerCode.match(/function removeHistoryItem\s*\([\s\S]*?\n    \}/);
  assert.ok(fnMatch, 'Trích xuất được hàm removeHistoryItem');

  // Test giả lập logic confirm
  let promptAsked = false;
  let promptText = '';
  let deletedTombstone = false;

  const mockConfirm = (msg) => {
    promptAsked = true;
    promptText = msg;
    return false; // Người dùng bấm Hủy (Cancel) vì bấm nhầm
  };

  const mockRawHistory = [
    { videoId: 'txt_sample_01', title: 'Bài báo kiểm thử', isText: true, sentences: [{ text: 'Bonjour' }] }
  ];

  const fn = new Function('videoId', 'e', 'confirm', 'getRawHistory', 'renderHistorySection', `
    let STORAGE_KEY = 'mock';
    let aicHasTranslation = () => false;
    let setArchivedTranslation = () => {};
    let localStorage = { setItem: () => { deletedTombstone = true; } };
    ${fnMatch[0]}
    removeHistoryItem(videoId, e);
  `);

  fn('txt_sample_01', { stopPropagation: () => {} }, mockConfirm, () => mockRawHistory, () => {});

  assert.equal(promptAsked, true, 'Bắt buộc phải hiện hộp thoại xác nhận khi bấm xóa');
  assert.ok(promptText.includes('Bạn có chắc chắn muốn xóa bài đọc "Bài báo kiểm thử"'), 'Nội dung hỏi phải nêu rõ loại mục và tên bài báo');
  assert.equal(deletedTombstone, false, 'Khi người dùng bấm Hủy (Cancel), bài KHÔNG được phép bị xóa');
});

