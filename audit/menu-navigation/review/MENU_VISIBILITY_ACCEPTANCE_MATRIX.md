# MA TRẬN KHẢ DỤNG & HIỂN THỊ MENU ĐA VIEWPORT
## (MENU VISIBILITY & ACCESSIBILITY ACCEPTANCE MATRIX)
### Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/review/MENU_VISIBILITY_ACCEPTANCE_MATRIX.md`  
**Ngày lập:** 2026-11-07  
**Phạm vi áp dụng:** Quy chuẩn nghiệm thu cho Decision B (UNIT-06)  
**Chế độ thực thi:** PLANNING ONLY  

---

## 1. NGUYÊN TẮC BẤT BIẾN KHẢ DỤNG (THE "NEVER-LOST" INVARIANT)

Để bảo đảm người dùng không bao giờ bị mất khả năng tiếp cận hai tính năng quan trọng: **Đồng bộ Đám mây (Cloud Sync)** và **Chuyển Chế độ Sáng / Tối (Theme Toggle)**, hệ thống quy định 2 điều kiện bất biến:
1. **Tính Khả Dụng Tuyệt Đối (100% Reachable):** Tại mọi kích thước màn hình từ 320px đến 3840px, ở mọi tỷ lệ zoom và hướng xoay (portrait / landscape), luôn tồn tại ít nhất 1 nút kích hoạt khả dụng cho mỗi tính năng.
2. **Triệt Tiêu Trùng Lặp Trên Màn Hình Lớn (Zero Desktop Redundancy):** Khi màn hình đủ rộng ($\ge 769\text{px}$) để các nút Header hiển thị đầy đủ, menu Sandwich tự động ẩn các mục này để tránh lãng phí diện tích và giảm độ rối thị giác.

---

## 2. MA TRẬN KHẢ DỤNG TRÊN CÁC VIEWPORT THỰC TẾ & MỐC CHUYỂN TIẾP (±1PX)

| Kích thước (Width × Height) | Ngữ cảnh Thiết bị (Device Context) | Header Cloud (`.practice-sync-btn`) | Header Theme (`.practice-theme-btn`) | Sandwich Cloud (`.psm-cloud`) | Sandwich Theme (`.psm-theme`) | Trạng thái Khả dụng (Reachable Status) | Ghi chú Trải nghiệm (UX Note) |
|---|---|---|---|---|---|---|---|
| **320 × 568** | Small Mobile (iPhone SE1) | Ẩn (`none !important`) | Ẩn (`none !important`) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | **REACHABLE** (Qua Sandwich Menu) | Header cực hẹp, chỉ chứa Back + Từ vựng + Giao diện. Nút Cloud/Theme nằm trong Sandwich menu với nhãn rõ ràng. |
| **375 × 667** | Mobile Standard (iPhone 8/SE2) | Ẩn (`none !important`) | Ẩn (`none !important`) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | **REACHABLE** (Qua Sandwich Menu) | Không có trùng lặp. Vùng chạm Sandwich menu rộng rãi, dễ thao tác ngón cái. |
| **430 × 932** | Large Mobile (iPhone 15 Pro Max) | Ẩn (`none !important`) | Ẩn (`none !important`) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | **REACHABLE** (Qua Sandwich Menu) | Bố cục 1 cột thoải mái, 0 thanh cuộn ngang. |
| **600 × 960** | Small Tablet (Nexus 7 dọc) | Ẩn (`none !important`) | Ẩn (`none !important`) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | **REACHABLE** (Qua Sandwich Menu) | Vẫn áp dụng quy tắc mobile header thu gọn. |
| **767 × 1024** | **Breakpoint -1px (Tablet sát mép)** | Ẩn (`none !important`) | Ẩn (`none !important`) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | **REACHABLE** (Qua Sandwich Menu) | Điểm ngắt mobile tối đa; bảo đảm không bị mất nút. |
| **768 × 1024** | **Breakpoint Chuẩn `md` (iPad dọc)** | Ẩn (`none !important`) | Ẩn (`none !important`) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | **REACHABLE** (Qua Sandwich Menu) | iPad dọc vẫn dùng Sandwich menu để giữ header gọn gàng. |
| **769 × 1024** | **Breakpoint +1px (Bắt đầu Desktop)**| **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | Ẩn (`none !important`) | Ẩn (`none !important`) | **REACHABLE** (Trực tiếp trên Header) | Bắt đầu hiển thị nút trên Header; tự động ẩn trong Sandwich menu. Không trùng lặp! |
| **1023 × 768** | Small Laptop / iPad ngang (-1px) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | Ẩn (`none !important`) | Ẩn (`none !important`) | **REACHABLE** (Trực tiếp trên Header) | Header có đủ diện tích; thao tác 1-click. |
| **1024 × 768** | **Breakpoint `lg` (Bố cục 2 Cột)** | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | Ẩn (`none !important`) | Ẩn (`none !important`) | **REACHABLE** (Trực tiếp trên Header) | Kích hoạt Split-pane 2 cột (Video trái, Phụ đề phải). |
| **1280 × 720** | Small Laptop HD | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | Ẩn (`none !important`) | Ẩn (`none !important`) | **REACHABLE** (Trực tiếp trên Header) | Trải nghiệm tiêu chuẩn máy tính xách tay. |
| **1440 × 900** | Desktop Standard (MacBook / FHD) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | Ẩn (`none !important`) | Ẩn (`none !important`) | **REACHABLE** (Trực tiếp trên Header) | Trải nghiệm tối ưu; Sandwich menu chỉ chứa các tính năng nâng cao. |
| **1920 × 1080** | Large Desktop (Màn hình lớn) | **HIỂN THỊ** (`flex`) | **HIỂN THỊ** (`flex`) | Ẩn (`none !important`) | Ẩn (`none !important`) | **REACHABLE** (Trực tiếp trên Header) | Khung hình cân đối hoàn hảo. |

---

## 3. CÁC ĐIỀU KIỆN KIỂM TRA ĐẶC BIỆT (EDGE CASE VERIFICATION)

### 3.1. Điểm Chuyển Tiếp Xoay Màn Hình (Orientation Transition)
- **Kịch bản:** Người dùng đang mở phòng luyện trên iPad ở chế độ dọc (768px - nút nằm trong Sandwich menu), sau đó xoay ngang máy sang chế độ landscape (1024px - nút chuyển lên Header).
- **Yêu cầu kiểm thử:**
  - Sự kiện `window.addEventListener('orientationchange')` và `resize` phải tự động đóng menu Sandwich nếu đang mở dở ([`js/03-practice-engine.js#L190-L197`](file:///Users/linhvu/AI%20Project/Shadowing/js/03-practice-engine.js#L190-L197)).
  - Trạng thái chấm báo đồng bộ Cloud (`.cloud-sync-dot`) trên Header phải lập tức phản ánh đúng trạng thái kết nối mà không cần tải lại trang.

### 3.2. Kiểm tra Trợ Năng & Thuộc tính ARIA (A11y Checks)
1. **Accessible Name:**
   - Header Cloud Button: `title="Đồng bộ đám mây (Supabase)"` kèm `aria-label="Đồng bộ đám mây"`.
   - Header Theme Toggle: `title="Chuyển chế độ Sáng / Tối"` kèm `aria-label="Chuyển chế độ Sáng / Tối"`.
   - Sandwich Cloud Item: Văn bản rõ ràng `"Đồng bộ đám mây"`.
   - Sandwich Theme Item: Văn bản rõ ràng `"Chuyển chế độ Sáng / Tối"`.
2. **Keyboard Focus:**
   - Nhấn phím `Tab` trên Desktop: Tiêu điểm đi tuần tự qua nút Back $\rightarrow$ Từ vựng $\rightarrow$ Cloud Sync $\rightarrow$ Theme Toggle $\rightarrow$ Giao diện Switcher $\rightarrow$ Sandwich Button.
   - Nhấn phím `Tab` trên Mobile: Nút Cloud và Theme trên Header có `display: none !important`, trình duyệt tự động bỏ qua (không gây hiện tượng "focus vào khoảng trắng"). Khi mở Sandwich menu, phím Tab tuần hoàn đến 2 mục này bình thường.

---

## 4. KẾT LUẬN NGHIỆM THU CHO UNIT-06

Bản ma trận trên chứng minh rằng giải pháp phân định theo mốc $768\text{px}$ là tối ưu, chặt chẽ về toán học không gian và hoàn toàn tương thích với kiến trúc CSS hiện hữu của FSS.
