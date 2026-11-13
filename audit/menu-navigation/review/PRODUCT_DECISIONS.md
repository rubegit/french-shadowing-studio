# QUYẾT ĐỊNH SẢN PHẨM CHÍNH THỨC & NGUYÊN TẮC THIẾT KẾ
## (OFFICIAL PRODUCT DECISIONS & ARCHITECTURAL SPECS)
### Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/review/PRODUCT_DECISIONS.md`  
**Ngày phê duyệt:** 2026-11-07  
**Cơ quan phê duyệt:** Product Owner / Project Lead  
**Tác giả biên soạn:** Principal Frontend Architect  
**Trạng thái:** APPROVED & LOCKED (Quy chuẩn kỹ thuật bắt buộc cho toàn bộ tiến trình Remediation)  
**Chế độ thực thi:** PLANNING ONLY (Chưa sửa mã nguồn)  

---

## 1. BẢNG TỔNG HỢP BA QUYẾT ĐỊNH SẢN PHẨM ĐÃ KHÓA

| Mã Quyết định | Hạng mục Sản phẩm | Nội dung Quyết định Chính thức | Rationale (Lý do Quyết định) | Delivery Unit Phụ trách |
|---|---|---|---|---|
| **DECISION-A** | **Khôi phục Sao chép Phụ đề & Chia sẻ Video** | Khôi phục 2 tính năng (`copyTranscript` và `shareCurrentVideo`) vào bên trong **Practice Sandwich Menu** (`#practice-sandwich-menu`). **Tuyệt đối không đưa lên Header phụ đề**. | Giữ cho Header phụ đề (`#sub-panel-hd`) thanh thoát, tối giản; tránh làm chật chội ô tìm kiếm mở rộng; tập trung toàn bộ các hành động xuất bản/chia sẻ vào menu tiện ích tập trung. | **UNIT-05** |
| **DECISION-B** | **Hiển thị Đáp ứng cho Đồng bộ Cloud & Đổi Theme** | **Desktop ($> 768\text{px}$):** Hiển thị trên Header, ẩn trong Sandwich Menu.<br>**Mobile ($\le 768\text{px}$):** Ẩn trên Header, hiển thị trong Sandwich Menu. | Triệt tiêu hoàn toàn sự trùng lặp vô ích trên màn hình lớn, trong khi bảo đảm trên màn hình điện thoại người dùng luôn có đường truy cập rõ ràng với nhãn văn bản đầy đủ. | **UNIT-06** |
| **DECISION-C** | **Dọn dẹp Legacy DOM & Giải quyết Trùng lặp ID** | Tách việc dọn dẹp các khối HTML kế thừa (`#practice-header-tools`, `#sub-search-bar`, `#sub-search-input`) thành một **Delivery Unit độc lập riêng**, chỉ thực thi sau khi đã khử sạch phụ thuộc trong JavaScript. | Ngăn chặn triệt để nguy cơ sập ứng dụng (Null Pointer Runtime Crash) do JavaScript vẫn đang truy vấn các phần tử con bên trong. | **UNIT-07** |

---

## 2. QUY CHUẨN KỸ THUẬT CHI TIẾT: DECISION-A (COPY & SHARE IN SANDWICH MENU)

### 2.1. Vị trí & Cấu trúc Hiển thị trong Sandwich Menu
- **Container đích:** `#practice-sandwich-menu` (`partials/view-practice.html:223`).
- **Phân nhóm (Section):** Tạo một nhóm chức năng chuyên biệt hoặc đặt trong Section tiện ích:
  - **Mục 1 — Sao chép phụ đề:**
    - Icon: `copy` (`data-lucide="copy"` hoặc SVG copy chuẩn 16px).
    - Nhãn văn bản: `Sao chép toàn bộ phụ đề`.
    - Thuộc tính phụ: Hiển thị tooltip hoặc badge thông tin khi đang bật chế độ Song ngữ (sao chép cả tiếng Pháp lẫn tiếng Việt).
    - Hành vi Click: Gọi `copyTranscript(); window.closePracticeMobileMenu();`.
  - **Mục 2 — Chia sẻ bài học / video:**
    - Icon: `share-2` (`data-lucide="share-2"`).
    - Nhãn văn bản: `Chia sẻ bài học này`.
    - Hành vi Click: Gọi `shareCurrentVideo(); window.closePracticeMobileMenu();`.

### 2.2. Kiểm tra Tính toàn vẹn Logic & Trạng thái Dữ liệu
1. **Hàm `copyTranscript()` ([`js/01e-translate-ai.js#L236`](file:///Users/linhvu/AI%20Project/Shadowing/js/01e-translate-ai.js#L236)):**
   - Đã xác minh: Sử dụng Clipboard API hiện đại kết hợp fallback `textarea execCommand`.
   - Kiểm tra dữ liệu: Nếu bài học chưa nạp phụ đề hoặc mảng câu rỗng (`!text.trim()`), hàm tự động hiển thị toast cảnh báo: *"Chưa có phụ đề nào để copy"*.
   - Bảo mật & Dữ liệu: Không đưa dữ liệu cá nhân hay token vào clipboard; chỉ copy nội dung văn bản phụ đề thuần túy.
2. **Hàm `shareCurrentVideo()` ([`js/01g-vocab-list.js#L3343`](file:///Users/linhvu/AI%20Project/Shadowing/js/01g-vocab-list.js#L3343)):**
   - Đã xác minh: Tạo payload JSON xuất bản chuẩn (`${videoId}.share.json`), sinh link URL chia sẻ kèm tham số `?v=...&b=1` (nếu đang bật song ngữ), và kích hoạt hộp thoại `#share-modal`.
   - Quyền riêng tư: Link chia sẻ chỉ mang ID video và cờ bật/tắt song ngữ, không kèm thông tin tài khoản Supabase hay lịch sử cá nhân của người dùng.
3. **Quy tắc UX sau thao tác:**
   - Ngay sau khi click, menu Sandwich tự động đóng lại (`closePracticeMobileMenu()`) để nhường không gian cho Toast thông báo thành công hoặc Hộp thoại Share Modal xuất hiện.

---

## 3. QUY CHUẨN KỸ THUẬT CHI TIẾT: DECISION-B (RESPONSIVE CLOUD & THEME VISIBILITY)

### 3.1. Xác định Ngưỡng Điểm ngắt Chuẩn (Breakpoint Authority)
Rà soát mã nguồn CSS tại [`css/14-subtitle-card.css#L66-L85`](file:///Users/linhvu/AI%20Project/Shadowing/css/14-subtitle-card.css#L66-L85) xác định:
- Header phòng luyện tập sử dụng mốc `@media (max-width: 768px)` để chuyển đổi sang giao diện thu gọn.
- Tại màn hình $\le 768\text{px}$, CSS hiện tại đã ẩn các nút header:
  ```css
  #screen-practice header .practice-sync-btn,
  #screen-practice header .practice-theme-btn {
    display: none !important;
  }
  ```
- **Quy tắc thiết kế mới:**
  - Áp dụng class `.sm-hide-desktop` (hoặc `@media (min-width: 769px) { .psm-cloud-item, .psm-theme-item { display: none !important; } }`) cho 2 nút trong Sandwich Menu.
  - Ngưỡng phân định: **768px (Điểm ngắt `md`)**.
    - $W \ge 769\text{px}$ (Desktop / Laptop): Header nút Cloud & Theme hiển thị $\rightarrow$ Sandwich Menu ẩn Cloud & Theme.
    - $W \le 768\text{px}$ (Tablet dọc / Điện thoại): Header nút Cloud & Theme ẩn $\rightarrow$ Sandwich Menu hiển thị Cloud & Theme.

### 3.2. Tiêu chuẩn Bất biến "Luôn Khả Dụng" (Never-Lost Invariant)
Bắt buộc bảo đảm: **Tại mọi kích thước viewport (từ 320px đến 3840px), người dùng luôn có ít nhất một cách trực tiếp để đổi Theme và mở Đồng bộ Cloud**. Tuyệt đối không để xảy ra "vùng chết" (gap) nơi cả 2 vị trí đều bị ẩn.

---

## 4. QUY CHUẨN KỸ THUẬT CHI TIẾT: DECISION-C (LEGACY DOM CLEANUP PROTOCOL)

### 4.1. Điều kiện Tiên quyết Bắt buộc Trước khi Xóa
Không một dòng HTML kế thừa nào được phép xóa bỏ nếu chưa vượt qua 3 điều kiện:
1. **Khử tham chiếu hoàn toàn trong JavaScript:**
   - Sửa dòng 241 trong `js/03-practice-engine.js` để kiểm tra null an toàn trước khi gọi `.classList.toggle`.
   - Sửa các dòng 2572, 2580, 2587 trong `js/01g-vocab-list.js` để không truy vấn `#sub-search-bar`.
   - Sửa dòng 7, 34, 45 trong `js/08-responsive-height.js` để không observe phần tử null.
2. **Di dời an toàn các phần tử con đang hoạt động:**
   - Khối popover cỡ chữ & giãn dòng `#fs-pop` phải được di chuyển ra khỏi `#practice-header-tools` và trở thành một popover độc lập nằm trong `#screen-practice`.
3. **Giải phóng Trùng lặp ID `#sub-search-input`:**
   - Thẻ `<input>` thừa tại dòng 671 (nằm trong `#sub-search-bar`) phải được loại bỏ hoàn toàn, trả lại tính duy nhất cho thẻ `<input id="sub-search-input">` đang hoạt động tại dòng 438 (`#sub-search-expandable`).

---

## 5. CÁC THAY ĐỔI TUYỆT ĐỐI BỊ NGHIÊM CẤM (STRICT PROHIBITIONS)

- 🚫 **NGHIÊM CẤM** tự ý đưa nút Copy Transcript và Share Video lên thanh Header phụ đề `#sub-panel-hd`.
- 🚫 **NGHIÊM CẤM** xóa bỏ hoặc gộp cứng 16 media queries thành 4 breakpoint.
- 🚫 **NGHIÊM CẤM** đổi tên hàm `toggleFsTheme` hay thay đổi cơ chế lưu `localStorage.getItem('fss_ui_theme')`.
- 🚫 **NGHIÊM CẤM** xóa bỏ `#practice-header-tools` trước khi hoàn tất UNIT-01 đến UNIT-06.
- 🚫 **NGHIÊM CẤM** thêm bất kỳ mã màu HEX cứng nào ngoài danh mục token của `tools/lint-color.js`.
