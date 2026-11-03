import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContrastRatio, parseColor, getLuminance, runContrastAudit } from './contrast-audit/audit-runner.js';
import { runLint, scanCssFile, scanJsFile, scanHtmlFile } from './lint-color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

test('M1.1 WCAG 2.x Contrast Ratio Math: Công thức tính toán độ tương phản chuẩn xác', () => {
  // Trắng trên Đen = 21:1
  const blackWhite = getContrastRatio('#ffffff', '#000000');
  assert.equal(blackWhite, 21.0, 'Trắng trên đen phải là 21:1');

  // Trắng trên Trắng = 1:1 (hoàn toàn vô hình)
  const whiteWhite = getContrastRatio('#ffffff', '#ffffff');
  assert.equal(whiteWhite, 1.0, 'Trắng trên trắng phải là 1:1');

  // Chữ Navy chuẩn #14213D trên nền trắng #FFFFFF
  const navyWhite = getContrastRatio('#14213d', '#ffffff');
  assert.ok(navyWhite >= 15.0, `Chữ Navy trên trắng phải >= 15:1 (thực tế: ${navyWhite})`);

  // Parse color hex 3 chữ số, 6 chữ số và rgba
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor('#000000'), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor('rgba(16, 185, 129, 0.5)'), { r: 16, g: 185, b: 129, a: 0.5 });
});

test('M1.2 Lint Color: Quét và thống kê chính xác số lượng mã màu tồn dư', () => {
  const result = runLint();

  assert.ok(result.summary, 'Phải có bảng summary');
  assert.ok(result.summary.totalCssHexOutsideTokens > 0 && result.summary.totalCssHexOutsideTokens <= 2362, 'Số lượng mã hex trong CSS ngoài token phải giảm dần từ mốc baseline 2362');
  assert.ok(result.summary.totalJsInlineColorStyles <= 64, 'Số lượng inline style màu trong JS phải giảm dần từ mốc baseline 64');
  assert.strictEqual(result.summary.totalHtmlTailwindColors, 0, 'Toàn bộ class màu Tailwind trong HTML đã được dọn sạch về 0');

  // Kiểm tra file js/vocab-practice.js đã được dọn sạch hoàn toàn inline style màu
  const vocabPracticeResult = result.jsResults.find(r => r.file.includes('vocab-practice.js'));
  assert.ok(vocabPracticeResult, 'Phải quét vocab-practice.js');
  assert.strictEqual(vocabPracticeResult.inlineColorStylesCount, 0, 'vocab-practice.js đã được dọn sạch hoàn toàn 0 inline style màu');
});

test('M1.3 Baseline Snapshot: Tệp baseline.json tồn tại và ghi lại mốc đo ban đầu', () => {
  const baselinePath = path.join(ROOT, 'tools', 'contrast-audit', 'baseline.json');
  assert.ok(fs.existsSync(baselinePath), 'Tệp tools/contrast-audit/baseline.json phải tồn tại');

  const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  assert.ok(baselineData.totalMonitored >= 25, 'Phải giám sát ít nhất 25 điểm lỗi');
  assert.ok(baselineData.failingCount > 0, 'Phải ghi nhận số lỗi ban đầu làm mốc giảm dần');
  assert.ok(Array.isArray(baselineData.details), 'details phải là mảng');
});

test('M5-fix: Khắc phục triệt để độ tương phản chip câu đang ghép, pill từ trọng tâm và ghi chú gợi ý SRS', () => {
  const cssContent = fs.readFileSync(path.join(ROOT, 'css', 'vocab-practice.css'), 'utf8');

  // Chip câu đang ghép trong Light mode phải dùng --fs-accent-text (đậm nét), không dùng --fs-primary mờ
  assert.match(cssContent, /html\[data-ui="light"\]\s+\.vph-reorder-chip\.in-answer\s*\{[^}]*color:\s*var\(--fs-accent-text\)/);

  // Pill từ trọng tâm trong Light mode phải dùng --fs-accent-text
  assert.match(cssContent, /html\[data-ui="light"\]\s+\.vph-hint-pill\s*\{[^}]*color:\s*var\(--fs-accent-text\)/);

  // Thẻ gợi ý .vph-reorder-hint-note phải tồn tại với container bo góc và màu chữ cảnh báo độ tương phản cao
  assert.match(cssContent, /\.vph-reorder-hint-note\s*\{/);
  assert.match(cssContent, /html\[data-ui="light"\]\s+\.vph-reorder-hint-note\s*\{[^}]*color:\s*var\(--fs-stat-near-ink/);

  // Thẻ tiếng Việt Flashcard 3D phải dùng --fs-accent-text
  assert.match(cssContent, /\.vph-fc-top-tag-vi\s*\{[^}]*color:\s*var\(--fs-accent-text\)/);
});
