#!/usr/bin/env node
/**
 * tools/contrast-audit/audit-runner.js
 * Tính toán tỷ lệ tương phản WCAG 2.x chuẩn quốc tế cho các cặp màu chữ / nền
 * Kiểm tra và giám sát 26 nhóm lỗi E01–E26 và bộ Design Tokens.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

// Chuyển đổi HEX sang { r, g, b, a }
export function parseColor(colorStr) {
  if (!colorStr) return null;
  const str = colorStr.trim().toLowerCase();

  // #rgb hoặc #rgba
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // rgb(...) hoặc rgba(...)
  const rgbMatch = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    };
  }

  return null;
}

// Hòa trộn màu bán trong suốt lên nền (alpha compositing)
export function compositeColor(fg, bg) {
  if (fg.a === 1) return fg;
  const a = fg.a + bg.a * (1 - fg.a);
  const r = Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a);
  const g = Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a);
  const b = Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a);
  return { r, g, b, a };
}

// Tính Relative Luminance theo công thức WCAG 2.x
export function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Tính tỷ lệ tương phản Contrast Ratio giữa 2 màu
export function getContrastRatio(fgInput, bgInput) {
  const fgParsed = typeof fgInput === 'string' ? parseColor(fgInput) : fgInput;
  const bgParsed = typeof bgInput === 'string' ? parseColor(bgInput) : bgInput;

  if (!fgParsed || !bgParsed) return 1.0;

  // Hòa trộn foreground nếu có opacity lên background
  const finalFg = compositeColor(fgParsed, bgParsed);
  const l1 = getLuminance(finalFg);
  const l2 = getLuminance(bgParsed);

  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (brighter + 0.05) / (darker + 0.05);

  return Math.round(ratio * 100) / 100;
}

// Danh mục 26 lỗi đo đạc được từ bảng 4 của Kế hoạch
export const KNOWN_ERROR_CATALOG = [
  { id: 'E01', name: 'Home: tiêu đề Video Bạn Đã Luyện Gần Đây', fg: '#ffffff', bgLight: '#f4fbf7', bgDark: '#0e1714', target: 4.5, isLarge: true },
  { id: 'E02', name: 'Home và partials: text-slate-400', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E03', name: 'Home: nút ← Trang trước', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E04', name: 'Home: Xóa tất cả (text-slate-500)', fg: '#64748b', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E05', name: 'Từ vựng: Xóa từ bài này, Xoá tất cả', fg: '#ef4444', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E06', name: 'Video Timeline: / 1 (text-slate-500)', fg: '#64748b', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E07', name: 'Luyện tập: Câu trước, Câu sau', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E08', name: 'Luyện tập: nhãn Thời gian: (.ts-lbl)', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E09', name: 'Luyện tập: ký tự x của ô tốc độ', fg: '#a9b8d6', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E10', name: 'Luyện tập: Giao diện (9.5px), Tự dừng', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E11', name: 'Nghe chép: từ gần đúng (.dc-d)', fg: '#f59e0b', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E12', name: 'Luyện từ vựng: phản hồi Rất tốt', fg: '#fef08a', bgLight: '#fef3c7', bgDark: '#3a3115', target: 4.5 },
  { id: 'E13', name: 'Luyện từ vựng: khung Câu mẫu tiếng Pháp', fg: '#ffffff', bgLight: '#fef3c7', bgDark: '#16221e', target: 4.5 },
  { id: 'E14', name: 'Luyện từ vựng: viên gợi ý (vph-hint-pill)', fg: '#93c5fd', bgLight: '#eff6ff', bgDark: '#1c2b25', target: 4.5 },
  { id: 'E15', name: 'Luyện từ vựng: huy hiệu vph-due-badge', fg: '#ffffff', bgLight: '#a8e6cf', bgDark: '#1d3a30', target: 3.0, isLarge: true },
  { id: 'E16', name: 'TCF: hộp Bẫy TCF', fg: '#d97706', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E17', name: 'Modal sửa câu: text-slate-300', fg: '#cbd5e1', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E18', name: 'Modal gửi danh sách từ: text-slate-300', fg: '#cbd5e1', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E19', name: 'Modal nạp từ: nhãn Schema 0.2', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#0e1714', target: 4.5 },
  { id: 'E20', name: 'Modal nạp từ: nút Xác nhận ghi vào kho', fg: '#94a3b8', bgLight: '#f1f5f9', bgDark: '#1e293b', target: 4.5 },
  { id: 'E21', name: 'Modal dịch sách: tiêu đề mục', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E22', name: 'Modal song ngữ: Xóa bản dịch', fg: '#ef4444', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E23', name: 'Menu điện thoại: mũi tên →', fg: '#94a3b8', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 },
  { id: 'E25', name: 'Trình đọc sách sepia: bk-muted', fg: '#8a7660', bgLight: '#fbf0d9', bgDark: '#201b15', target: 4.5 },
  { id: 'E26', name: 'Token --fs-ink-subtle hiện tại', fg: '#738298', bgLight: '#ffffff', bgDark: '#16221e', target: 4.5 }
];

export function runContrastAudit() {
  const auditResults = KNOWN_ERROR_CATALOG.map(item => {
    const ratioLight = getContrastRatio(item.fg, item.bgLight);
    const ratioDark = getContrastRatio(item.fg, item.bgDark);
    const passLight = ratioLight >= item.target;
    const passDark = ratioDark >= item.target;

    return {
      id: item.id,
      name: item.name,
      target: item.target,
      ratioLight,
      ratioDark,
      passLight,
      passDark,
      status: (passLight && passDark) ? 'PASS' : 'FAIL'
    };
  });

  const totalErrors = auditResults.filter(r => r.status === 'FAIL').length;
  const passCount = auditResults.length - totalErrors;

  return {
    timestamp: new Date().toISOString(),
    totalMonitored: auditResults.length,
    failingCount: totalErrors,
    passingCount: passCount,
    details: auditResults
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runContrastAudit();
  const baselineDir = path.join(ROOT, 'tools', 'contrast-audit');
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }
  const baselinePath = path.join(baselineDir, 'baseline.json');
  fs.writeFileSync(baselinePath, JSON.stringify(result, null, 2), 'utf8');

  console.log('='.repeat(70));
  console.log('🔍 BÁO CÁO ĐO TƯƠNG PHẢN WCAG 2.x (Baseline Metric)');
  console.log('='.repeat(70));
  console.log(`- Tổng số điểm đo kiểm soát: ${result.totalMonitored}`);
  console.log(`- Số điểm đang vi phạm WCAG: ${result.failingCount} (cần khắc phục qua M2–M6)`);
  console.log(`- Số điểm đã đạt chuẩn:       ${result.passingCount}`);
  console.log(`- Đã lưu snapshot mốc vào:   tools/contrast-audit/baseline.json`);
  console.log('='.repeat(70));
}
