# SỔ ĐĂNG KÝ VẤN ĐỀ & KHUYẾT TẬT GIAO DIỆN (ISSUES REGISTER)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_ISSUES_REGISTER.md`  
**Ngày thực hiện:** 2026-11-07  
**Chế độ:** READ-ONLY AUDIT (Bằng chứng trích xuất từ mã nguồn và Chrome DevTools Protocol)  

---

## 1. TỔNG HỢP THEO MỨC ĐỘ NGHIÊM TRỌNG (SEVERITY BREAKDOWN)

- **P0 — Critical (Lỗi tê liệt hệ thống):** **0** lỗi (Ứng dụng nạp được, các luồng chính vẫn hoạt động).
- **P1 — High (Lỗi chức năng, lỗi runtime, mất tính năng, tràn viền):** **5** lỗi.
- **P2 — Medium (Lỗi tiếp cận a11y, bất nhất theme, xung đột popup, điểm ngắt):** **7** lỗi.
- **P3 — Low (Mã rác DOM, thiếu nhãn ngữ nghĩa ARIA, lệch thuật ngữ):** **3** lỗi.
- **TỔNG CỘNG:** **15 vấn đề kỹ thuật đã được xác minh bằng chứng.**

---

## 2. BẢNG ĐĂNG KÝ CHI TIẾT CÁC VẤN ĐỀ (DEFECT REGISTER)

### ISSUE-01 (P1 — High): Gọi hàm không tồn tại `toggleTheme()` trong Màn hình Luyện dịch
- **Menu ID:** `MN-26.4`
- **Mô tả:** Nút chuyển chế độ Sáng / Tối trên thanh header của Màn hình Luyện dịch gắn thuộc tính sự kiện `onclick="toggleTheme()"`. Tuy nhiên, trong toàn bộ mã nguồn JavaScript của dự án chỉ định nghĩa hàm `window.toggleFsTheme()`.
- **Tệp & Dòng mã:** [`partials/view-translate.html#L13`](file:///Users/linhvu/AI%20Project/Shadowing/partials/view-translate.html#L13)
- **Viewport bị ảnh hưởng:** Toàn bộ mọi viewport (Desktop, Tablet, Mobile).
- **Điều kiện & Các bước tái hiện:**
  1. Mở màn hình Luyện dịch bằng cách nạp link hoặc gõ URL hash `#/translate/sample_vi_fr_1`.
  2. Bấm vào nút icon Mặt trăng/Mặt trời trên góc phải header.
- **Kỳ vọng (Expected):** Giao diện chuyển đổi giữa Light Mode và Dark Mode.
- **Thực tế (Actual):** Không có gì thay đổi trên màn hình. Mở Chrome Console xuất hiện lỗi đỏ:  
  `Uncaught ReferenceError: toggleTheme is not defined at HTMLButtonElement.onclick`
- **Nguyên nhân gốc rễ:** Lỗi đánh máy / quên cập nhật khi dự án đổi tên hàm từ `toggleTheme` sang `toggleFsTheme` ở các module trước.
- **Đề xuất khắc phục:** Sửa `onclick="toggleTheme()"` thành `onclick="toggleFsTheme()"`.

---

### ISSUE-02 (P1 — High): Tính năng "Sao chép phụ đề" và "Chia sẻ video" bị khóa chết trong DOM ẩn
- **Menu ID:** `DEAD-01`, `DEAD-02` (thuộc Phòng luyện tập)
- **Mô tả:** Hai chức năng cốt lõi là **Sao chép toàn bộ phụ đề song ngữ (`copyTranscript`)** và **Chia sẻ video (`shareCurrentVideo`)** nằm bên trong khối `#sub-search-bar`. Khối này bị áp đặt thuộc tính inline `style="display:none !important;"` vĩnh viễn và không còn bất kỳ nút nào khác trên giao diện gọi đến 2 hàm này.
- **Tệp & Dòng mã:** [`partials/view-practice.html#L664-L699`](file:///Users/linhvu/AI%20Project/Shadowing/partials/view-practice.html#L664-L699)
- **Viewport bị ảnh hưởng:** Toàn bộ mọi viewport.
- **Điều kiện & Các bước tái hiện:**
  1. Mở bất kỳ video nào trong phòng luyện tập.
  2. Quan sát toàn bộ giao diện: Không có bất kỳ nút nào để copy toàn bộ transcript phụ đề hoặc chia sẻ video.
- **Kỳ vọng:** Người dùng có thể copy transcript dạng text hoặc mở modal chia sẻ link video.
- **Thực tế:** Các nút `#btn-copy-transcript` và `#btn-share` tồn tại trong DOM nhưng bị ẩn 100%, người dùng hoàn toàn không thể tiếp cận.
- **Nguyên nhân gốc rễ:** Khi tái thiết kế thanh tìm kiếm phụ đề sang dạng kính lúp mở rộng ở header cột phụ đề (`#sub-search-expandable`), người phát triển đã ẩn khối cũ nhưng quên di chuyển 2 nút tiện ích này lên header mới.
- **Đề xuất khắc phục:** Di chuyển nút Copy và Share lên cạnh nút kính lúp trong `#sub-panel-hd`.

---

### ISSUE-03 (P1 — High): Trùng lặp DOM ID `#sub-search-input` trong cùng một trang
- **Menu ID:** `CONFLICT-02`
- **Mô tả:** Tồn tại hai thẻ `<input>` cùng mang `id="sub-search-input"` trong `partials/view-practice.html`:
  - Thẻ 1 (đang dùng): Dòng 438, nằm trong `#sub-search-expandable`.
  - Thẻ 2 (bị ẩn): Dòng 672, nằm trong `#sub-search-bar`.
- **Tệp & Dòng mã:** [`partials/view-practice.html#L438`](file:///Users/linhvu/AI%20Project/Shadowing/partials/view-practice.html#L438) và [`partials/view-practice.html#L672`](file:///Users/linhvu/AI%20Project/Shadowing/partials/view-practice.html#L672)
- **Viewport bị ảnh hưởng:** Toàn bộ mọi viewport.
- **Hậu quả:** Vi phạm tiêu chuẩn W3C HTML. Các hàm JavaScript sử dụng `document.getElementById('sub-search-input')` hoặc thư viện DOM query có thể nhắm sai vào phần tử ẩn, gây lỗi tìm kiếm phụ đề chập chờn.
- **Đề xuất khắc phục:** Xóa bỏ khối `#sub-search-bar` cũ.

---

### ISSUE-04 (P1 — High): Xung đột hiển thị đồng thời hai menu Dropdown (`#pv-menu` và `#practice-sandwich-menu`)
- **Menu ID:** `MN-04`, `MN-05`, `CONFLICT-01`
- **Mô tả:** Khi người dùng bấm mở menu đổi giao diện (`#pv-switch-btn`), menu `#pv-menu` mở ra. Nếu người dùng tiếp tục bấm nút Sandwich menu (`#practice-sandwich-btn`), menu `#practice-sandwich-menu` mở ra nhưng **không hề đóng `#pv-menu`**.
- **Tệp & Dòng mã:** [`js/03-practice-engine.js#L127-L142`](file:///Users/linhvu/AI%20Project/Shadowing/js/03-practice-engine.js#L127-L142) và [`js/03-practice-engine.js#L182-L188`](file:///Users/linhvu/AI%20Project/Shadowing/js/03-practice-engine.js#L182-L188)
- **Bằng chứng thực nghiệm (CDP Test):** Script `test_overlap.js` xác nhận trạng thái runtime:  
  `Dual Open Result: { pvMenuOpen: true, sandwichMenuOpen: true }`
- **Kỳ vọng:** Khi mở menu B, menu A phải tự động đóng lại.
- **Thực tế:** Cả hai menu dạng card cùng hiển thị nổi đè lên nhau trên màn hình, che khuất nội dung bài học và gây hỗn loạn tiêu điểm bàn phím.
- **Nguyên nhân gốc rễ:** Hàm `togglePracticeMobileMenu` không gọi `closeMenu()` và hàm `pvToggleMenu` không gọi `closePracticeMobileMenu()`.
- **Đề xuất khắc phục:** Thêm lệnh đóng menu đối ứng vào đầu mỗi hàm toggle.

---

### ISSUE-05 (P1 — High): Tràn viền ngang (+2px) tại Viewport Small Mobile 320px
- **Menu ID:** `MN-28`
- **Mô tả:** Tại kích thước màn hình 320px (iPhone SE thế hệ đầu hoặc các thiết bị siêu nhỏ), thanh công cụ lịch sử video (`.video-catalog-toolbar`) vượt khỏi biên màn hình: `rect.right = 322px` (vượt +2px).
- **Tệp & Dòng mã:** [`partials/view-home.html#L515-L558`](file:///Users/linhvu/AI%20Project/Shadowing/partials/view-home.html#L515-L558)
- **Bằng chứng thực nghiệm (CDP Test):**  
  `Overflow element: { tag: 'div', class: 'view-mode-toggle-group flex items-center...', right: 322, excess: 2 }`
- **Kỳ vọng:** Toàn bộ phần tử nằm gọn trong 320px, không có thanh cuộn ngang trang.
- **Nguyên nhân gốc rễ:** Cụm 3 nút chuyển chế độ hiển thị (`view-mode-toggle-group`) và ô chọn sắp xếp (`sort-select-wrap`) được đặt `shrink-0` kèm khoảng đệm `gap-3.5` khiến tổng chiều rộng cố định vượt quá bề ngang 320px trừ padding hai bên.
- **Đề xuất khắc phục:** Thêm quy tắc CSS `@media (max-width: 360px)` để ẩn nút 3 cột hoặc chuyển sang `flex-wrap: wrap`.

---

### ISSUE-06 (P2 — Medium): 3 Hộp thoại Modal không đóng được bằng phím `Escape`
- **Menu ID:** `MN-01.3` (Cloud Modal), `MN-32` (CEFR Level Modal), `MN-33` (Audio Sync Modal)
- **Mô tả:** Nhấn phím `Escape` khi các modal này đang mở không có tác dụng. Người dùng bắt buộc phải dùng chuột tìm và bấm nút ✕.
- **Tệp & Dòng mã:** [`js/supabase-sync.js#L848`](file:///Users/linhvu/AI%20Project/Shadowing/js/supabase-sync.js#L848) và [`js/01d-player.js#L2041-L2055`](file:///Users/linhvu/AI%20Project/Shadowing/js/01d-player.js#L2041-L2055)
- **Vi phạm tiêu chuẩn:** WCAG 2.1.1 Keyboard Navigation.
- **Đề xuất khắc phục:** Đăng ký sự kiện `keydown` bắt `e.key === 'Escape'` cho cả 3 modal.

---

### ISSUE-07 (P2 — Medium): Toàn bộ 13 Modal trong ứng dụng thiếu Bẫy Tiêu điểm (Focus Trap)
- **Menu ID:** Toàn bộ các Modal
- **Mô tả:** Khi mở modal, nhấn phím `Tab` cho phép tiêu điểm bàn phím lọt ra ngoài modal và rơi vào các phần tử của trang web nền bị che bên dưới.
- **Vi phạm tiêu chuẩn:** WCAG 2.1.2 No Keyboard Trap & 2.4.3 Focus Order.
- **Đề xuất khắc phục:** Xây dựng module dùng chung `trapFocus(modalElement)` để khoanh vùng phím `Tab` chỉ tuần hoàn bên trong modal đang active.

---

### ISSUE-08 (P2 — Medium): Modal Đồng bộ Cloud sử dụng màu đen cứng phá vỡ hệ thống Light Theme
- **Menu ID:** `MN-01.3`
- **Mô tả:** `#fss-cloud-modal` sử dụng class CSS cứng `bg-[#0b1329] border-blue-900/80 text-slate-200`. Khi ứng dụng đang ở chế độ Mint Pastel Light Mode mặc định, modal mở ra có màu xanh đen tối sầm.
- **Tệp & Dòng mã:** [`js/supabase-sync.js#L877`](file:///Users/linhvu/AI%20Project/Shadowing/js/supabase-sync.js#L877)
- **Tác động:** Phá vỡ tính đồng bộ thẩm mỹ của giao diện Light Mode.
- **Đề xuất khắc phục:** Chuyển sang sử dụng CSS Variables Semantic Tokens `--fs-*`.

---

### ISSUE-09 (P2 — Medium): Trùng lặp vô ích nút Đồng bộ Cloud & Đổi Theme trên Desktop
- **Menu ID:** `MN-03`, `MN-05`
- **Mô tả:** Trên Desktop, cả 2 tính năng "Đồng bộ Cloud" và "Chế độ Sáng / Tối" xuất hiện cùng lúc trên thanh Header và lặp lại y hệt trong Sandwich Menu.
- **Đề xuất khắc phục:** Sử dụng CSS responsive để ẩn 2 mục này trong Sandwich Menu khi ở màn hình rộng $\ge 641\text{px}$.

---

### ISSUE-10 (P2 — Medium): Phân mảnh Điểm ngắt Responsive qua 16 mốc Media Query
- **Mô tả:** Hệ thống CSS chứa 16 mốc `@media` khác nhau (`340px`, `360px`, `380px`, `420px`, `440px`, `480px`, `560px`, `600px`, `639px`, `640px`, `680px`, `700px`, `767px`, `768px`, `820px`, `900px`, `1023px`).
- **Tác động:** Khi co giãn màn hình, các thành phần co rút và nhảy layout lệch pha nhau, đặc biệt trên thiết bị màn hình gập hoặc tablet cỡ nhỏ.
- **Đề xuất khắc phục:** Hợp nhất về 4 điểm ngắt chuẩn: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.

---

### ISSUE-11 (P2 — Medium): Nút "Xóa tất cả" có chiều cao 16px vi phạm kích thước vùng chạm tối thiểu
- **Menu ID:** `MN-28`
- **Mô tả:** Nút "Xóa tất cả" video lịch sử (`partials/view-home.html:510`) có kích thước thực tế đo được qua CDP là **54px × 16px**.
- **Vi phạm tiêu chuẩn:** WCAG 2.2 Level AA (Tiêu chí 2.5.8 Target Size Minimum $\ge 24\text{px}$).
- **Đề xuất khắc phục:** Tăng padding dọc lên `py-1.5` để chiều cao nút đạt tối thiểu $28\text{px}$.

---

### ISSUE-12 (P2 — Medium): Dải nút chọn nhanh tốc độ co hẹp dưới 24px ở cấp độ hẹp `a5`
- **Menu ID:** `MN-08`, `MN-11`
- **Mô tả:** Khi co màn hình hẹp khiến thanh player chuyển sang bậc thu nhỏ `a5`, CSS đặt padding `0 4px` và font `10.5px`, làm chiều rộng nút `0.5x` giảm xuống chỉ còn $\approx 22\text{px}$.
- **Vi phạm tiêu chuẩn:** WCAG 2.5.8.
- **Đề xuất khắc phục:** Giới hạn `min-width: 28px` cho các nút chọn tốc độ.

---

### ISSUE-13 (P3 — Low): Hơn 140 dòng mã HTML rác bị đóng băng trong `#practice-header-tools`
- **Mô tả:** Toàn bộ cụm nút điều khiển cũ bị ẩn `display:none !important` nhưng vẫn nằm trong DOM, gây tốn băng thông tải và dễ làm lập trình viên nhầm lẫn khi tra cứu ID.
- **Tệp & Dòng mã:** [`partials/view-practice.html#L58-L200`](file:///Users/linhvu/AI%20Project/Shadowing/partials/view-practice.html#L58-L200)
- **Đề xuất khắc phục:** Xóa bỏ hoàn toàn khối HTML chết này.

---

### ISSUE-14 (P3 — Low): 6 Modal thiếu thuộc tính `aria-labelledby`
- **Mô tả:** Các modal `share-modal`, `keyvocab-modal`, `vocab-meaning-modal`, `bk-import-modal`, `bk-tr-modal`, `vt-ai-modal` có `role="dialog"` nhưng thiếu nhãn ngữ nghĩa liên kết với tiêu đề.
- **Vi phạm tiêu chuẩn:** WCAG 4.1.2 Name, Role, Value.
- **Đề xuất khắc phục:** Bổ sung `aria-labelledby` trỏ tới thẻ tiêu đề tương ứng.

---

### ISSUE-15 (P3 — Low): Bất nhất trong tên gọi nhãn điều hướng Quay lại
- **Mô tả:** 5 màn hình sử dụng 4 nhãn khác nhau cho cùng một hành động quay về trang chủ: `"Luyện video khác"`, `"Quay lại"`, `"Thư viện"`, `"Về trang chủ"`.
- **Đề xuất khắc phục:** Chuẩn hóa nhãn và icon thống nhất `"← Trang chủ"` hoặc `"← Quay lại"`.
