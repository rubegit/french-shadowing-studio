# BÁO CÁO KIỂM TOÁN KHẢ NĂNG TIẾP CẬN (ACCESSIBILITY AUDIT - WCAG 2.2 AA)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_ACCESSIBILITY_REPORT.md`  
**Ngày thực hiện:** 2026-11-07  
**Chế độ:** READ-ONLY AUDIT (Kiểm thử tự động bằng script CDP kết hợp phân tích tĩnh mã nguồn)  
**Tiêu chuẩn đối chiếu:** Web Content Accessibility Guidelines (WCAG) 2.2 Level AA

---

## 1. TỔNG KẾT KẾT QUẢ ĐO ĐẠC ACCESSIBILITY (A11Y METRICS)

| Hạng mục kiểm tra | Số lượng phát hiện | Đánh giá tuân thủ |
|---|---|---|
| **Tổng số phần tử tương tác quét được** | **344** phần tử | Button, Anchor link, Select, Input, Range slider |
| **Nút thiếu Accessible Name (Tên tiếp cận)** | **0** phần tử | **100% PASS** (Tất cả icon button đều có `aria-label`, `title` hoặc text) |
| **Nút vi phạm kích thước vùng chạm ($\mathbf{< 24\text{px}}$)** | **1** phần tử | **FAIL**: Nút "Xóa tất cả" video (`height: 16px`) |
| **Modal thiếu Nhãn nhận diện (`aria-label`/`labelledby`)** | **6** modal | **FAIL**: `share-modal`, `keyvocab-modal`, `vocab-meaning-modal`, `bk-imp`, `bk-tr`, `vt-ai` |
| **Modal thiếu Bẫy Tiêu điểm (Focus Trapping)** | **13** modal | **FAIL**: Phím `Tab` có thể lọt ra ngoài nền trang web đang bị che |
| **Hộp thoại / Menu thiếu Phím tắt Escape (`Esc`)** | **3** thành phần | **FAIL**: Modal Cloud (`#fss-cloud-modal`), Modal Căn mốc (`#modal-art-ai-sync`), Modal Gán trình độ (`#modal-art-level`) |
| **Thẻ điều khiển thiếu `aria-expanded` hợp lệ** | **0** phần tử | **PASS**: Các nút toggle dropdown đều có cập nhật `aria-expanded` |
| **Hỗ trợ Giảm chuyển động (`prefers-reduced-motion`)** | **9** quy tắc trong CSS | **PASS**: Tắt animation xoay và trượt khi người dùng bật reduced-motion |

---

## 2. PHÂN TÍCH CHI TIẾT CÁC LỖI ACCESSIBILITY PHÁT HIỆN ĐƯỢC

### 2.1. Lỗi Thiếu Bẫy Tiêu điểm trong Modal (Missing Focus Trapping - WCAG 2.1.2 No Keyboard Trap & 2.4.3 Focus Order)
- **Mô tả:** Khi một hộp thoại dạng modal mở ra (như `modal-bilingual`, `modal-sentence-edit`, `modal-keyvocab`, `fss-cloud-modal`, `vph-backdrop`...), người dùng khiếm thị dùng phím `Tab` để di chuyển con trỏ.
- **Thực tế:** Các modal trong ứng dụng chỉ được làm mờ nền bằng CSS (`backdrop-blur`) và phủ đen (`bg-black/70`), nhưng **không có vòng lặp Tab (Focus Trap)**. Khi nhấn `Tab` qua nút cuối cùng trong modal, tiêu điểm bàn phím nhảy ra ngoài và rơi vào các phần tử của trang web nằm ngầm bên dưới modal!
- **Hậu quả:** Người dùng khiếm thị hoặc người chỉ dùng bàn phím sẽ bị lạc hướng hoàn toàn, không biết mình đang tương tác với modal hay trang nền.
- **Giải pháp chuẩn:** Khi modal mở, bắt sự kiện `keydown` trên phím `Tab`: nếu đang ở phần tử focusable cuối cùng mà bấm `Tab`, đưa focus về phần tử đầu tiên; nếu ở phần tử đầu tiên mà bấm `Shift + Tab`, đưa focus về phần tử cuối cùng.

---

### 2.2. Lỗi Không Phục hồi Tiêu điểm khi Đóng Modal (Missing Focus Restoration - WCAG 2.4.3)
- **Mô tả:** Khi người dùng bấm phím `Esc` hoặc bấm nút "Đóng" để thoát modal, tiêu điểm bàn phím (`document.activeElement`) bị rơi tự do về thẻ `<body>` thay vì quay trở lại đúng nút vừa kích hoạt mở modal đó (ví dụ nút "Dịch song ngữ" hoặc nút "Gán trình độ").
- **Hậu quả:** Người dùng bàn phím phải bấm `Tab` lại từ đầu trang để quay lại vị trí đang làm việc.
- **Giải pháp:** Lưu trữ biến `lastActiveElement = document.activeElement` trước khi mở modal, và gọi `lastActiveElement.focus()` khi đóng modal.

---

### 2.3. Lỗi Thiếu Phím tắt Escape trên Một số Modal Mới (Missing Escape Key Handler - WCAG 2.1.1)
Khảo sát mã nguồn cho thấy:
- Hầu hết các modal lâu năm (`bilingual-modal`, `punct-modal`, `sentence-edit-modal`, `tcf-modal`, `vph-backdrop`) đều lắng nghe phím `Escape` rất chu đáo.
- **Tuy nhiên, 3 modal mới được tạo gần đây bị bỏ quên sự kiện `Escape`:**
  1. `#fss-cloud-modal` trong `js/supabase-sync.js`: Không hề có đoạn code nào bắt `e.key === 'Escape'`. Người dùng chỉ có thể dùng chuột bấm nút ✕ hoặc bấm ra vùng backdrop để đóng.
  2. `#modal-art-ai-sync` trong `js/01d-player.js`: Không có Escape listener.
  3. `#modal-art-level` trong `js/01d-player.js`: Không có Escape listener.

---

### 2.4. Lỗi Vùng Chạm Quá Bé (Small Touch Targets - WCAG 2.5.8 Target Size Minimum)
- **Vị trí vi phạm:** Nút `"Xóa tất cả"` trong header lịch sử video trang chủ (`partials/view-home.html:510`):
  ```html
  <button type="button" onclick="clearAllHistory()" class="text-xs fs-text-muted hover:fs-text-danger transition-colors cursor-pointer" title="Xóa toàn bộ lịch sử">Xóa tất cả</button>
  ```
- **Kích thước đo thực tế qua CDP:** Chiều rộng: **54px**, Chiều cao: **16px**.
- **Tiêu chuẩn WCAG 2.2 AA:** Chiều cao tối thiểu của vùng tương tác độc lập phải đạt ít nhất **24px × 24px** (ngoại trừ inline link trong đoạn văn).
- **Hậu quả:** Trên màn hình cảm ứng di động, chiều cao 16px là quá mỏng, rất dễ dẫn đến tình trạng chạm hụt hoặc chạm nhầm vào thẻ đếm tổng số video bên cạnh.

---

### 2.5. Lỗi Thiếu Nhãn Ngữ Nghĩa Hộp thoại (Missing Dialog Accessible Labels - WCAG 4.1.2)
Các modal sau đây được gán `role="dialog"` và `aria-modal="true"` nhưng thiếu thuộc tính `aria-labelledby` trỏ tới tiêu đề của hộp thoại:
1. `partials/modal-share.html` (`#share-modal`)
2. `partials/modal-keyvocab.html` (`#keyvocab-modal`)
3. `partials/modal-vocab-meaning.html` (`#vocab-meaning-modal`)
4. `partials/modal-book-import.html` (`#bk-import-modal`)
5. `partials/modal-book-translate.html` (`#bk-tr-modal`)
6. `partials/modal-translate-ai.html` (`#vt-ai-modal`)

*Khắc phục:* Gán `id="share-modal-title"` cho thẻ chứa tên modal và thêm thuộc tính `aria-labelledby="share-modal-title"` vào thẻ cha `role="dialog"`.

---

## 3. BẢNG PHÂN LOẠI MỨC ĐỘ ƯU TIÊN ACCESSIBILITY

| Mã lỗi | Vấn đề | Tiêu chuẩn WCAG | Mức độ | Khuyến nghị khắc phục |
|---|---|---|---|---|
| **A11Y-01** | Thiếu Focus Trap trên toàn bộ 13 modal | 2.1.2, 2.4.3 | **P1 (High)** | Viết utility `trapFocus(modalEl)` trong `01-core.js` dùng chung cho mọi modal |
| **A11Y-02** | 3 Modal không đóng được bằng phím `Escape` | 2.1.1 | **P1 (High)** | Bổ sung `document.addEventListener('keydown', e => { if(e.key === 'Escape') close... })` |
| **A11Y-03** | Thiếu phục hồi tiêu điểm (`focus restoration`) | 2.4.3 | **P2 (Medium)** | Lưu `lastActiveElement` và gọi `.focus()` khi đóng modal |
| **A11Y-04** | Nút "Xóa tất cả" cao 16px vi phạm kích thước tối thiểu | 2.5.8 | **P2 (Medium)** | Đệm thêm padding `py-1.5 px-2` và `min-height: 28px` |
| **A11Y-05** | 6 Modal thiếu `aria-labelledby` | 4.1.2 | **P3 (Low)** | Thêm `id` vào tiêu đề và liên kết `aria-labelledby` |
| **A11Y-06** | Nút chọn tốc độ co xuống 22px chiều rộng ở cấp `a5` | 2.5.8 | **P2 (Medium)** | Giới hạn chiều rộng tối thiểu của nút tốc độ $\ge 28\text{px}$ |
