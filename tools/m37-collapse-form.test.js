const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('M37.1: css/theme-light.css ẩn hoàn toàn form nhập khi chưa có class is-expanded', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/theme-light.css'), 'utf8');

  assert.ok(css.includes('.txt-collapsible-card:not(.is-expanded) .txt-collapse-body'), 'Phải có quy tắc CSS cho thẻ chưa mở');
  assert.ok(css.includes('display: none !important;'), 'Trạng thái chưa mở bắt buộc phải display: none !important');
  assert.ok(css.includes('.txt-collapsible-card.is-expanded .txt-collapse-body'), 'Phải có quy tắc CSS cho thẻ đã mở');
});

test('M37.2: partials/view-home.html khởi tạo form với class hidden', () => {
  const homeHtml = fs.readFileSync(path.join(__dirname, '../partials/view-home.html'), 'utf8');
  assert.ok(homeHtml.includes('id="text-input-collapse-body" class="txt-collapse-body hidden"'), 'Thẻ body phải có class hidden khi khởi tạo');
});

test('M37.3: js/01d-player.js toggleTextInputCollapse điều khiển class is-expanded chính xác', () => {
  const playerCode = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  const fnMatch = playerCode.match(/window\.toggleTextInputCollapse\s*=\s*function\s*\([\s\S]*?\n    \};/);
  assert.ok(fnMatch, 'Trích xuất được hàm toggleTextInputCollapse');

  // Test giả lập logic toggle
  let cardClassList = new Set();
  let bodyClassList = new Set(['hidden']);
  let hintText = '';

  const mockCard = {
    classList: {
      contains: (c) => cardClassList.has(c),
      toggle: (c, val) => {
        if (val === undefined) val = !cardClassList.has(c);
        if (val) cardClassList.add(c); else cardClassList.delete(c);
      }
    },
    querySelector: () => ({ set textContent(val) { hintText = val; } })
  };

  const mockBody = {
    classList: {
      toggle: (c, val) => {
        if (val) bodyClassList.add(c); else bodyClassList.delete(c);
      }
    },
    style: {}
  };

  const mockBtn = { setAttribute: () => {} };

  const fn = new Function('forceOpen', 'document', `
    let window = {};
    ${fnMatch[0]}
    window.toggleTextInputCollapse(forceOpen);
  `);

  const mockDoc = {
    getElementById: (id) => {
      if (id === 'text-input-card') return mockCard;
      if (id === 'text-input-toggle-btn') return mockBtn;
      if (id === 'text-input-collapse-body') return mockBody;
      return null;
    }
  };

  // 1. Mặc định: card không có is-expanded
  assert.equal(cardClassList.has('is-expanded'), false);

  // 2. Bấm mở lần 1
  fn(undefined, mockDoc);
  assert.equal(cardClassList.has('is-expanded'), true, 'Lần 1 bấm phải thêm is-expanded');
  assert.equal(hintText, '(Bấm để thu gọn)', 'Gợi ý phải là (Bấm để thu gọn)');
  assert.equal(bodyClassList.has('hidden'), false, 'Không được có class hidden khi mở');

  // 3. Bấm lần 2 để thu gọn
  fn(undefined, mockDoc);
  assert.equal(cardClassList.has('is-expanded'), false, 'Lần 2 bấm phải gỡ is-expanded');
  assert.equal(hintText, '(Bấm để mở khung nhập bài)', 'Gợi ý phải là (Bấm để mở khung nhập bài)');
  assert.equal(bodyClassList.has('hidden'), true, 'Phải có class hidden khi đóng');
});
