# BÁO CÁO TÍNH NHẤT QUÁN THIẾT KẾ GIAO DIỆN (UI DESIGN SYSTEM CONSISTENCY)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_UI_CONSISTENCY_REPORT.md`  
**Ngày thực hiện:** 2026-11-07  
**Chế độ:** READ-ONLY AUDIT  
**Quy chuẩn tham chiếu:** Mint Pastel Light Mode & Dark Mode Spec (CSS Variables Semantic Tokens `--fs-*`), WCAG AAA Contrast Guidelines

---

## 1. KHẢO SÁT HỆ THỐNG DESIGN TOKENS SO VỚI MÃ NGUỒN THỰC TẾ

Dự án có hệ thống Design Tokens ngữ nghĩa rất bài bản đặt tại `css/theme-light.css` với các biến CSS:
- Nền bề mặt: `--fs-surface-base`, `--fs-surface-card`, `--fs-surface-subtle`, `--fs-surface-hover`
- Màu chữ: `--fs-ink`, `--fs-text-primary`, `--fs-text-secondary`, `--fs-text-muted`, `--fs-text-subtle`
- Viền phân định: `--fs-border-base`, `--fs-border-control`, `--fs-border-focus`
- Màu điểm nhấn: `--fs-primary`, `--fs-tint`, `--fs-accent-text`, `--fs-danger`, `--fs-success`, `--fs-warn`

Tuy nhiên, trong quá trình phát triển qua 41 module, nhiều thành phần giao diện mới được thêm vào mà **chưa tuân thủ trọn vẹn Design Tokens**, dẫn đến các điểm lệch lạc dưới đây.

---

## 2. BẢNG PHÁT HIỆN BẤT NHẤT GIAO DIỆN (UI INCONSISTENCY REPORT)

| Thành phần (Component) | Kiểu dáng kỳ vọng (Expected Style) | Kiểu dáng thực tế (Actual Style) | Tệp nguồn (Source) | Tác động (Impact) | Khuyến nghị (Recommendation) |
|---|---|---|---|---|---|
| **Modal Đồng bộ Cloud (`#fss-cloud-modal`)** | Dùng token `--fs-surface-card`, tiệp màu Light Theme khi app đang ở Light Mode | Mã màu tối cứng: `bg-[#0b1329] border-blue-900/80 text-slate-200` | `js/supabase-sync.js:877` | Modal đen thui giữa trang web nền sáng pastel Mint, phá vỡ tính thẩm mỹ | Thay thế class hardcoded bằng `fs-surface-card border fs-border-base fs-text-primary` |
| **Nút Chuyển Theme Luyện dịch** | Icon Mặt trăng/Mặt trời chuẩn SVG và gọi `toggleFsTheme()` | Gọi hàm không tồn tại `onclick="toggleTheme()"` | `partials/view-translate.html:13` | Bấm vào không đổi theme mà gây lỗi JS trong Console | Sửa thành `toggleFsTheme()` |
| **Nút "Quay lại" trên các Header** | Nhất quán về kích thước, padding, border-radius và font-weight | 5 kiểu dáng và kích cỡ khác nhau (`rounded-lg`, `.bk-ib`, `.gd-back`, `.vocab-back-btn`) | `view-practice.html`, `view-vocab.html`, `view-book.html`, `view-guide.html`, `view-translate.html` | Người dùng cảm thấy mỗi màn hình như một website độc lập | Chuẩn hóa một component class `.fs-btn-back` dùng chung |
| **Hệ thống Iconography** | Sử dụng thư viện icon đồng nhất (Lucide Icons SVG) | Pha trộn Lucide (`data-lucide="..."`), SVG inline viết tay, và emoji Unicode (`🇨🇦`, `🎯`, `🧠`, ` 문A `) | Nhiều tệp trong `partials/` và `js/` | Thiếu đồng bộ về độ dày nét (stroke-width: 1.5, 2.0, 2.2, 2.6) và tỷ lệ kích thước | Chuẩn hóa icon qua Lucide hoặc bộ SVG wrapper nhất quán nét `2.0px` |
| **Bo góc (Border Radius)** | Hệ thống bậc chuẩn: `8px` (nút nhỏ), `12px` (nút lớn), `16px` (card) | Hỗn hợp: `7px`, `8px`, `11px`, `14px`, `16px`, `20px`, `full` | `theme-light.css`, `css/13-default-controls.css`, `css/18-controls-layout.css` | Mép bo của các nút đứng cạnh nhau không song song | Quy chuẩn theo thang 4 bậc: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-full: 9999px` |
| **Nút "Xóa tất cả" Video** | Chiều cao vùng chạm tối thiểu $\ge 24\text{px}$ (khuyên dùng $36\text{px}$) | `text-xs` không padding, chiều cao thực tế đo được chỉ **16px** | `partials/view-home.html:510` | Khó bấm trúng trên màn hình cảm ứng điện thoại | Thêm padding `py-1.5 px-2.5` và `min-height: 32px` |
| **Phông chữ E-Book Settings** | Kế thừa font hệ thống dự án (`Plus Jakarta Sans`) | Thiết lập riêng `Literata`, `Georgia`, `Sans` | `partials/view-book.html:55` | Chữ giao diện setting bị đổi font theo sách | Giữ font UI là `Plus Jakarta Sans`, chỉ đổi font bên trong thẻ `<article id="bk-content">` |
| **Hộp thoại tra từ (`#lookup-tooltip`)** | Màu nền tiệp theo theme (`--fs-surface-card`) | Màu nền đen kính mờ với viền riêng | `src/index.src.html:242`, `css/03-layout.css` | Tương phản tốt trên Dark Mode nhưng hơi gắt trên Light Mode | Điều chỉnh token nền tooltip theo `var(--fs-surface-card)` và đổ bóng `var(--fs-shadow-lg)` |

---

## 3. PHÂN TÍCH CHI TIẾT TRẠNG THÁI TƯƠNG TÁC (INTERACTION STATES)

### 3.1. Hiệu ứng Rê chuột (Hover State)
- **Tốt:** Các nút chính (`.vocab-btn`, `.cloud-sync-btn`, `.mobile-nav-item`, `.psm-item`) đều có background transition mượt mà (`duration-150`, tiệp màu `var(--fs-surface-hover)`).
- **Hạn chế:** Các nút trong `.dc-accents-bar` (phím ký tự tiếng Pháp) thiếu feedback rõ nét khi hover trên máy tính màn hình lớn, tạo cảm giác lì phím.

### 3.2. Vòng chỉ thị Tiêu điểm (Focus Rings)
- Bộ kiểm thử tự động `focus-rings.test.js` đã bảo đảm các nút chính có viền focus.
- Tuy nhiên, trong các thẻ option của `MN-32` (`.art-level-opt`) và các tab đồng bộ `MN-33` (`.art-sync-tab`), khi dùng phím `Tab` để duyệt, một số nút chỉ đổi nhẹ viền xám mờ khó nhận biết đối với người khiếm thị hoặc cận thị nặng.

### 3.3. Độ tương phản Màu sắc (Color Contrast - Light vs Dark)
- Các nhãn phụ (`.desc`, `small`, `.txt-collapse-hint`):
  - Trong Light Mode: đạt tỉ lệ $\ge 4.5:1$ theo WCAG AA nhờ biến `--fs-text-muted` và `--fs-text-subtle`.
  - Trong Dark Mode: Một số văn bản hướng dẫn phụ trong E-Book Settings (`.bk-dnote`) có màu xám đậm trên nền đen chỉ đạt $\approx 3.8:1$ (dưới ngưỡng 4.5:1).

---

## 4. BẢNG TỔNG HỢP NÉT CẮT THIẾT KẾ (DESIGN MATRIX SUMMARY)

```
[Font Family]        Primary: Plus Jakarta Sans | Monospace: JetBrains Mono | Serif: Literata
[Border Radius]      Pills: 9999px | Cards: 16px | Controls: 11px-12px | Chips: 6px-8px
[Shadow System]      Elevation-1: 0 1px 2px rgba(0,0,0,0.05) | Elevation-2: 0 4px 6px -1px rgba(0,0,0,0.1) | Elevation-3: 0 20px 25px -5px rgba(0,0,0,0.1)
[Transitions]        Standard: all 150ms cubic-bezier(0.4, 0, 0.2, 1) | Drawer: transform 200ms ease-out
```
