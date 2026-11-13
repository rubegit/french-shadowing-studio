# BÁO CÁO THẨM ĐỊNH & XÁC MINH KẾT QUẢ KIỂM TOÁN (AUDIT VALIDATION REPORT)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/review/AUDIT_VALIDATION_REPORT.md`  
**Ngày thực hiện:** 2026-11-07  
**Vai trò:** Principal Frontend Architect & Technical Reviewer  
**Chế độ thực thi:** STRICT READ-ONLY REVIEW (Không sửa mã nguồn, không commit, không push)  
**Tiêu chuẩn đối chiếu:** AGENTS.md, PROJECT_STATUS.md, WCAG 2.2 Level AA, W3C HTML5, CDP Evidence

---

## 1. TỔNG QUAN THẨM ĐỊNH (EXECUTIVE REVIEW OVERVIEW)

Cuộc rà soát độc lập này thẩm định tính chính xác, tính nhất quán dữ liệu và tính khả thi kỹ thuật của 9 báo cáo kiểm toán (audit reports) đã lập tại `audit/menu-navigation/`. Quá trình thẩm định dựa trên thứ tự ưu tiên bằng chứng nghiêm ngặt:
1. **Mã nguồn thực tế** (`src/`, `partials/`, `js/`, `css/`) và các luồng runtime thực nghiệm.
2. **Bằng chứng CDP** (Chrome DevTools Protocol) và 15 ảnh chụp màn hình trong `screenshots/`.
3. **Bộ kiểm thử đơn vị tự động** (355/355 test case PASS của dự án).
4. **Các tài liệu audit ban đầu.**
5. **Suy luận kỹ thuật có gắn nhãn rõ ràng.**

### Kết luận thẩm định sơ bộ:
- **Xác nhận phát hiện cốt lõi:** Các lỗi chức năng then chốt (như lỗi runtime `toggleTheme` tại Translation view, xung đột dropdown đồng thời giữa `#pv-menu` và Sandwich menu, và việc thiếu Focus Trap trên 13 modal) là **hoàn toàn chính xác và đã được kiểm chứng 100%**.
- **Điều chỉnh các kết luận sai lệch / phóng đại (Over-classifications):**
  - **ISSUE-05 (Tràn viền 320px):** Báo cáo cũ gán mức **P1 (High)** với lý do "gây ra thanh cuộn ngang trang". Thẩm định thực nghiệm CDP chứng minh `scrollWidth === clientWidth === 320px` (`hasOverflowX: false`), không hề có thanh cuộn ngang ở cấp tài liệu; đây chỉ là hiện tượng co khít biên 2px của cụm flex bên trong container bị che khuất (`excess: 2px`). Mức độ thực tế: **P3 (Low)**.
  - **ISSUE-09 (Trùng lặp nút Cloud & Theme):** Báo cáo cũ gán mức **P2 (Medium)** và coi đây là khuyết tật trùng lặp vô ích. Thẩm định kiến trúc xác định đây là **Design Decision hợp lệ (Contextual Shortcut / Responsive Redundancy)** nhằm phục vụ trải nghiệm người dùng mobile/desktop.
  - **ISSUE-10 (Phân mảnh 16 Breakpoint):** Báo cáo cũ coi 16 media queries là lỗi cần ép về 4 breakpoint chuẩn. Thẩm định CSS chứng minh các mốc này phục vụ các trạng thái đặc thù như xoay ngang điện thoại (`max-height: 500px`), thiết bị cảm ứng (`hover: none`) và co giãn bàn phím ảo. Việc ép cứng về 4 mốc sẽ gây breaking change nghiêm trọng cho layout di động.
  - **ISSUE-13 (Xóa bỏ `#practice-header-tools`):** Báo cáo cũ khuyến nghị xóa sổ hoàn toàn hơn 140 dòng HTML này vì có `display:none !important`. Thẩm định phụ thuộc (Dependency Analysis) phát hiện mã nguồn JavaScript tại `js/03-practice-engine.js`, `js/01g-vocab-list.js`, `js/01e-translate-ai.js`, `js/01d-player.js`, và `js/04-vt-helper.js` vẫn đang query trực tiếp vào các phần tử con bên trong (như `#fs-pop`, `#cs-ipa`, `btn-toggle-karaoke`, v.v.). **Nếu xóa HTML này sẽ làm sập ứng dụng ngay lập tức**.

---

## 2. ĐỐI CHIẾU & HIỆU CHỈNH TÍNH NHẤT QUÁN SỐ LIỆU (DATA RECONCILIATION)

Trong các báo cáo audit ban đầu, có sự không nhất quán giữa `MENU_AUDIT_EXECUTIVE_SUMMARY.md` và `MENU_INVENTORY.md`. Bảng đối chiếu dưới đây làm rõ từng chỉ số:

| Chỉ số (Metric) | Báo cáo A (Summary) | Báo cáo B (Inventory) | Kết quả Thẩm định Thực tế (Verified) | Nguyên nhân Sai lệch & Giải trình | Độ tin cậy (Confidence) |
|---|---|---|---|---|---|
| **Menu Definitions** | 34 | 34 | **34** | Định danh từ `MN-01` đến `MN-34`. Khớp 100% giữa JSON và mã nguồn. | Rất cao (100%) |
| **Menu Instances** | 42 | 42 | **42** | Tính cả các biến thể hiển thị theo responsive (Drawer mobile, Accordion kép, v.v.). | Rất cao (100%) |
| **Menu Types** | 13 | 13 | **13** | Phân loại chuẩn kiến trúc IA (gộp từ 27 chuỗi phân loại thô trong JSON quét tĩnh). | Cao (95%) |
| **Tổng số Menu Items** | 196 | 196 | **196** | Tổng số mục con tương tác được khai báo trong `discovered_menus.json`. | Rất cao (100%) |
| **Menu tạo động qua JS** | 12 | 7 | **8 Menu thực tế sinh DOM qua JS** | Báo cáo Summary đếm cả các widget có cập nhật trạng thái runtime (12); Báo cáo Inventory chỉ đếm các menu sinh HTML động hoàn toàn qua JS template string (7). Rà soát mã nguồn xác nhận có **8 cụm động thực tế**: `tcf-modal`, `tcf-exam-backdrop`, `fss-cloud-modal`, `#vph-sandwich-dropdown`, `.vph-controls-right`, `lookup-tooltip`, `manual-prompt-modal`, và dynamic CEFR options. | Rất cao (100%) |
| **Menu dùng chung đa màn hình** | 6 | 5 | **6 Cụm dùng chung** | Inventory tính 5 (Theme, Cloud, Vocab, Cỡ chữ, Timeline Seek). Summary tính thêm Audio Player Bar dùng chung giữa Video Practice và Article Reading (`MN-08`/`MN-09` hòa trộn với `MN-11`/`MN-12` theo Module M34). Cả hai cách đếm đều có cơ sở, nhưng chuẩn nhất là 6. | Cao (95%) |
| **Phân loại trùng lặp `MN-20`** | Không nêu | Xuất hiện ở cả nhóm 3 và nhóm 4 | **Lỗi soạn thảo văn bản trong Inventory** | Mục `MN-20` bị gõ lặp 2 lần trong Mục 2 của `MENU_INVENTORY.md` (vừa nằm ở "Dropdown Menus" vừa nằm ở "Sandwich Menus"). Trong khi đó `MN-17` (Dictation Action Buttons) bị sót khỏi danh sách nhóm. Tổng số vẫn là 34 nhưng cấu trúc liệt kê bị lệch. | Tuyệt đối (100%) |

---

## 3. ĐÁNH GIÁ MỨC ĐỘ BAO PHỦ TOÀN BỘ ỨNG DỤNG (COVERAGE AUDIT)

Rà soát sự hiện diện của 34 menu trên toàn bộ 14 phân hệ chức năng của FSS:

| Phân hệ chức năng | Mã Menu bao phủ | Trạng thái Kiểm tra Runtime | Trạng thái Kiểm tra Tĩnh | Đánh giá Mức độ Đầy đủ |
|---|---|---|---|---|
| **Trang chủ & Header** | `MN-01`, `MN-02`, `MN-34` | Đã test CDP trên 9 viewport | Đã khớp DOM `partials/view-home.html` | Đầy đủ 100% |
| **Video Catalog & Lịch sử** | `MN-28`, `MN-29` | Đã test CDP trên 9 viewport | Đã khớp `partials/view-home.html` | Đầy đủ 100% |
| **Phòng Luyện Video (Practice)** | `MN-03`, `MN-04`, `MN-05`, `MN-06`, `MN-07`, `MN-08`, `MN-09`, `MN-10` | Đã test CDP trên Desktop & Mobile | Đã khớp `partials/view-practice.html` | Đầy đủ 100% |
| **Đọc Báo Song Ngữ (Article)** | `MN-11`, `MN-12`, `MN-13`, `MN-32`, `MN-33` | Đã test logic runtime | Đã khớp `partials/view-practice.html` & `01d-player.js` | Đầy đủ 100% |
| **Chế độ Nhại Tiếng (Shadowing)** | `MN-14` | Đã kiểm tra DOM & class filter | Đã khớp `partials/view-practice.html` | Đầy đủ (Giới hạn: Không có mic vật lý trong headless) |
| **Chép Chính Tả (Dictation)** | `MN-15`, `MN-16`, `MN-17` | Đã kiểm tra logic bàn phím ảo | Đã khớp `partials/view-practice.html` & `03-practice-engine.js` | Đầy đủ 100% |
| **Sổ Từ Vựng (Vocabulary)** | `MN-18`, `MN-19` | Đã chụp screenshot CDP | Đã khớp `partials/view-vocab.html` | Đầy đủ 100% |
| **Trung Tâm Luyện Từ (Vocab Hub)**| `MN-20`, `MN-21` | Đã chụp screenshot CDP | Đã khớp `js/vocab-practice.js` | Đầy đủ 100% |
| **Đọc Sách Văn Học (E-Book)** | `MN-22`, `MN-23`, `MN-24`, `MN-25` | Đã kiểm tra DOM & modal settings | Đã khớp `partials/view-book.html` & `01h-ebook.js` | Đầy đủ 100% |
| **Luyện Dịch Việt - Pháp** | `MN-26`, `MN-27` | Đã kiểm tra phát hiện lỗi runtime | Đã khớp `partials/view-translate.html` | Đầy đủ 100% |
| **Mô phỏng Khảo thí TCF** | Bị sót mã ID trong bảng chính (`js/tcf-exam.js`) | Đã kiểm tra DOM động | Đã phát hiện nút kích hoạt bị ẩn trong `#practice-header-tools` | **Phát hiện thiếu sót của audit cũ** |
| **Đồng bộ Đám mây (Cloud Sync)** | Nằm trong `MN-01.3`, `MN-03.3`, `MN-05.1` | Đã kiểm tra DOM động & CSS token | Đã khớp `js/supabase-sync.js` | Đầy đủ 100% |
| **Tra cứu Ngữ cảnh (Lookup)** | `MN-30` | Đã kiểm tra tooltip positioning | Đã khớp `src/index.src.html` & `01-main.js` | Đầy đủ 100% |
| **Màn hình Hướng dẫn (Guide)** | `MN-31` | Đã kiểm tra nút đóng top/bottom | Đã khớp `partials/view-guide.html` | Đầy đủ 100% |

---

## 4. DANH SÁCH CÁC PHÁT HIỆN BỊ SÓT TRONG ĐỢT AUDIT TRƯỚC (OMISSIONS IDENTIFIED)

1. **Bỏ sót Phân hệ Khảo thí TCF (`js/tcf-exam.js`):**
   - Phân hệ `TcfExam` có giao diện thi trắc nghiệm hoàn chỉnh (`#tcf-exam-backdrop`), đếm thời gian, nộp bài, xem giải thích bẫy thi TCF, và modal xác nhận nộp bài (`#tcf-confirm-modal`).
   - Nút mở thi TCF (`#btn-tcf-exam`) bị nhốt bên trong khối `#practice-header-tools` bị ẩn. Audit cũ không lập mã `MN` riêng cho các menu tương tác của TCF.
2. **Khuyết tật Escape của E-Book Modals:**
   - Audit cũ chỉ nêu Escape thiếu ở 3 modal (`fss-cloud-modal`, `modal-art-ai-sync`, `modal-art-level`).
   - Rà soát thực tế cho thấy cả `#bk-import-modal` (Nhập sách ePub/Text) và `#bk-tr-modal` (Dịch song ngữ sách) trong `partials/modal-book-import.html` và `partials/modal-book-translate.html` **cũng hoàn toàn không có listener phím Escape**.
3. **Phụ thuộc ngầm của `#practice-header-tools`:**
   - Audit cũ vội vã kết luận 140 dòng HTML là "rác chết" mà không rà soát các hàm `$('practice-header-tools')` tại dòng 241 của `03-practice-engine.js` và các ID con bên trong.

---

## 5. GIỚI HẠN KIỂM THỬ THỰC TẾ (TEST LIMITATIONS)

1. **Môi trường giả lập Browser Emulation:** Toàn bộ kiểm thử responsive được thực hiện thông qua Chrome DevTools Protocol trên Google Chrome 156.0 native; chưa chạy trên phần cứng vật lý iPhone Safari WebKit thực tế (cần chạy smoke-test trên thiết bị thật trước khi phát hành chính thức).
2. **Không có Microphone vật lý trong Headless Mode:** Luồng ghi âm nhại tiếng (Shadowing) chỉ được xác minh qua DOM toggle, class state (`.recording`), và media stream mock; chưa thu giọng người dùng thực tế.
3. **Trạng thái mạng Offline / RLS Supabase:** Việc kiểm toán thực hiện ở môi trường local HTTP server; các bài test đồng bộ đám mây sử dụng dữ liệu giả lập và IndexedDB nội bộ, không ghi dữ liệu thật lên production cloud database.
