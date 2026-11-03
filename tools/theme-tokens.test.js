import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContrastRatio } from './contrast-audit/audit-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

test('M2.1 Light Mode Tokens: Tất cả token chữ đạt WCAG AA >= 4.5:1 và viền điều khiển >= 3.0:1', () => {
  const bgSurface = '#FFFFFF';
  const bgCanvas = '#F4FBF7';

  // 1. Core text
  const inkRatio = getContrastRatio('#14213D', bgSurface);
  assert.ok(inkRatio >= 14.0, `--fs-ink trên trắng phải >= 14:1 (thực tế: ${inkRatio})`);

  const mutedRatio = getContrastRatio('#4A566B', bgSurface);
  assert.ok(mutedRatio >= 7.0, `--fs-muted trên trắng phải >= 7:1 (thực tế: ${mutedRatio})`);

  const subtleRatio = getContrastRatio('#5B6B80', bgSurface);
  assert.ok(subtleRatio >= 4.5, `--fs-ink-subtle (#5B6B80) trên trắng phải >= 4.5:1 (thực tế: ${subtleRatio})`);

  // 2. Status text tokens (Bảng 5.1)
  const successRatio = getContrastRatio('#047857', bgSurface);
  assert.ok(successRatio >= 4.5, `--fs-success-text (#047857) trên trắng phải >= 4.5:1 (thực tế: ${successRatio})`);

  const warnRatio = getContrastRatio('#92400E', bgSurface);
  assert.ok(warnRatio >= 4.5, `--fs-warn-text (#92400E) trên trắng phải >= 4.5:1 (thực tế: ${warnRatio})`);

  const dangerRatio = getContrastRatio('#B91C1C', bgSurface);
  assert.ok(dangerRatio >= 4.5, `--fs-danger-text (#B91C1C) trên trắng phải >= 4.5:1 (thực tế: ${dangerRatio})`);

  // 3. Viền điều khiển (Mục 5.1 & Mục 8: >= 3.0:1)
  const borderControlRatio = getContrastRatio('#8896AB', bgSurface);
  assert.ok(borderControlRatio >= 3.0, `--fs-border-control (#8896AB) trên trắng phải >= 3.0:1 (thực tế: ${borderControlRatio})`);

  // 4. Viên gợi ý (vph-hint-pill) - WCAG AAA >= 7:1
  const hintPillRatio = getContrastRatio('#1E40AF', '#EFF6FF');
  assert.ok(hintPillRatio >= 7.0, `--fs-hint-pill-text trên hint-bg phải >= 7:1 (thực tế: ${hintPillRatio})`);
});

test('M2.2 Dark Mode Tokens: Tất cả token chữ đạt WCAG AA >= 4.5:1 và viền điều khiển >= 3.0:1', () => {
  const bgSurfaceDark = '#16221E';
  const bgCanvasDark = '#0E1714';

  // 1. Core text
  const inkRatioDark = getContrastRatio('#E8F3EE', bgSurfaceDark);
  assert.ok(inkRatioDark >= 10.0, `--fs-ink trên nền tối phải >= 10:1 (thực tế: ${inkRatioDark})`);

  const mutedRatioDark = getContrastRatio('#A3B5AC', bgSurfaceDark);
  assert.ok(mutedRatioDark >= 5.5, `--fs-muted trên nền tối phải >= 5.5:1 (thực tế: ${mutedRatioDark})`);

  const subtleRatioDark = getContrastRatio('#93A89E', bgSurfaceDark);
  assert.ok(subtleRatioDark >= 4.5, `--fs-ink-subtle (#93A89E) trên nền tối phải >= 4.5:1 (thực tế: ${subtleRatioDark})`);

  // 2. Status text tokens (Dark)
  const successRatioDark = getContrastRatio('#6EE7B7', bgSurfaceDark);
  assert.ok(successRatioDark >= 4.5, `--fs-success-text trên nền tối phải >= 4.5:1 (thực tế: ${successRatioDark})`);

  const warnRatioDark = getContrastRatio('#FCD34D', bgSurfaceDark);
  assert.ok(warnRatioDark >= 4.5, `--fs-warn-text trên nền tối phải >= 4.5:1 (thực tế: ${warnRatioDark})`);

  const dangerRatioDark = getContrastRatio('#FCA5A5', bgSurfaceDark);
  assert.ok(dangerRatioDark >= 4.5, `--fs-danger-text trên nền tối phải >= 4.5:1 (thực tế: ${dangerRatioDark})`);

  // 3. Viền điều khiển dark (>= 3.0:1)
  const borderControlRatioDark = getContrastRatio('#6B8177', bgSurfaceDark);
  assert.ok(borderControlRatioDark >= 3.0, `--fs-border-control trên nền tối phải >= 3.0:1 (thực tế: ${borderControlRatioDark})`);

  // 4. Viên gợi ý dark
  const hintPillRatioDark = getContrastRatio('#93C5FD', '#1C2B25');
  assert.ok(hintPillRatioDark >= 4.5, `--fs-hint-pill-text trên nền hint dark phải >= 4.5:1 (thực tế: ${hintPillRatioDark})`);
});

test('M2.3 Book Reader Sepia & Paper: --bk-muted và --bk-saved đạt WCAG AA >= 4.5:1', () => {
  // Sepia: #6F5C47 trên #f3ead6
  const sepiaMutedRatio = getContrastRatio('#6F5C47', '#f3ead6');
  assert.ok(sepiaMutedRatio >= 4.5, `Sepia --bk-muted (#6F5C47) phải >= 4.5:1 (thực tế: ${sepiaMutedRatio})`);

  // Paper: #b45309 trên #fbfaf7
  const paperSavedRatio = getContrastRatio('#b45309', '#fbfaf7');
  assert.ok(paperSavedRatio >= 4.5, `Paper --bk-saved (#b45309) phải >= 4.5:1 (thực tế: ${paperSavedRatio})`);
});
