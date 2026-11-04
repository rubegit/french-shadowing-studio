import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContrastRatio } from './contrast-audit/audit-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

test('M6.1 WCAG 2.4.7 & 2.4.11 Focus Indicator Contrast: >= 3.0:1 trên cả Light và Dark Mode', () => {
  // Focus ring màu chủ đạo trên Light surface (#ffffff)
  const focusLightRatio = getContrastRatio('#0B5A3C', '#FFFFFF');
  assert.ok(
    focusLightRatio >= 3.0,
    `Chỉ số tương phản focus Light (#0B5A3C trên trắng) phải >= 3.0:1 (thực tế: ${focusLightRatio})`
  );

  // Focus ring màu trên Dark surface (#16221E)
  const focusDarkRatio = getContrastRatio('#78D6B4', '#16221E');
  assert.ok(
    focusDarkRatio >= 3.0,
    `Chỉ số tương phản focus Dark (#78D6B4 trên #16221E) phải >= 3.0:1 (thực tế: ${focusDarkRatio})`
  );
});

test('M6.2 Focus-Visible Rules: CSS khai báo đầy đủ :focus-visible với outline và var(--fs-focus-ring)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-light.css'), 'utf8');

  // Kiểm tra khai báo :focus-visible
  assert.match(
    css,
    /html\[data-ui="light"\]\s+:focus-visible\s*\{[^}]*outline:[^}]+var\(--fs-accent\)/,
    'Phải có quy tắc :focus-visible toàn cục dùng var(--fs-accent) cho Light Mode'
  );

  assert.match(
    css,
    /html\[data-ui="light"\]\.dark\s+:focus-visible\s*\{[^}]*outline:[^}]+var\(--fs-primary-strong\)/,
    'Phải có quy tắc :focus-visible toàn cục dùng var(--fs-primary-strong) cho Dark Mode'
  );

  assert.match(
    css,
    /box-shadow:\s*var\(--fs-focus-ring\)/,
    'Các phần tử tương tác phải được đồng bộ box-shadow: var(--fs-focus-ring)'
  );
});

test('M6.3 Interactive States: Active tactile feedback (scale 0.98) và Disabled state', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-light.css'), 'utf8');

  assert.match(
    css,
    /transform:\s*scale\(0\.98\)/,
    'Phải có hiệu ứng active nhấn scale(0.98) theo đặc tả Spec M9'
  );

  assert.match(
    css,
    /cursor:\s*not-allowed/,
    'Phải có trạng thái disabled chuẩn với cursor: not-allowed'
  );
});

test('M6.4 Scrollbar Contrast: Thanh cuộn tùy chỉnh dùng token tương phản cao --fs-border-control', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-light.css'), 'utf8');

  assert.match(
    css,
    /::-webkit-scrollbar-thumb\s*\{[^}]*background:\s*var\(--fs-border-control\)/,
    'Scrollbar thumb phải sử dụng var(--fs-border-control) để đảm bảo độ tương phản >= 3.0:1'
  );
});

test('M6.5 E14 Hint Pill Contrast: .vph-hint-pill chuẩn hóa độ tương phản cao', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-light.css'), 'utf8');

  assert.match(
    css,
    /html\[data-ui="light"\]\s+\.vph-hint-pill\s*\{[^}]*color:\s*var\(--fs-accent-text\)/,
    '.vph-hint-pill trong theme-light.css phải dùng var(--fs-accent-text)'
  );
});
