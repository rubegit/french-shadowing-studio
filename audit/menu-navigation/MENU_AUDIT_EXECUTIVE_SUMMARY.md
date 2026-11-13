# BÁO CÁO TỔNG QUAN KIỂM TOÁN HỆ THỐNG MENU, NAVIGATION & RESPONSIVE
## (MENU AUDIT EXECUTIVE SUMMARY)
### Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_AUDIT_EXECUTIVE_SUMMARY.md`  
**Ngày hoàn thành:** 2026-11-07  
**Phiên làm việc:** M41 -> M42 Handover / Comprehensive Audit  
**Chế độ thực hiện:** READ-ONLY AUDIT (Không sửa đổi mã nguồn ứng dụng)  
**Tiêu chuẩn đối chiếu:** WCAG 2.2 Level AA, W3C HTML5, FSS Design System, AGENTS.md Guidelines

---

## 1. MỤC TIÊU & PHẠM VI KIỂM TOÁN (OBJECTIVES & SCOPE)

Báo cáo này là kết quả của đợt tổng kiểm toán kỹ thuật chuyên sâu đối với toàn bộ hệ thống menu, thanh điều hướng (navigation), bố cục responsive và khả năng tiếp cận (accessibility) của ứng dụng **French Shadowing Studio (FSS)**.

Mục tiêu chính:
1. **Kiểm kê 100% các thành phần Menu & Navigation:** Phát hiện mọi menu tĩnh, partials và các menu sinh động bằng JavaScript.
2. **Kiểm tra tính toàn vẹn chức năng & Luồng điều hướng:** Bắt lỗi runtime, liên kết chết, tính năng bị chôn vùi và xung đột hiển thị.
3. **Đánh giá Responsive đa thiết bị:** Kiểm tra thực tế bằng trình duyệt Google Chrome thông qua giao thức Chrome DevTools Protocol (CDP) trên 9 kích thước viewport chuẩn (từ 320px đến 1920px), đo lường hiện tượng tràn viền ngang/dọc.
4. **Kiểm toán Tiếp cận (A11y) & Tính nhất quán thị giác:** Đánh giá việc hỗ trợ bàn phím, bẫy tiêu điểm (focus trap), phím Escape, kích thước vùng chạm (touch target $\ge 24\text{px}$) và sự tuân thủ Design Tokens (Light/Dark mode).
5. **Đề xuất lộ trình khắc phục & Tái cấu trúc:** Xây dựng kế hoạch hành động phân kỳ khả thi, an toàn, không gây breaking change.

---

## 2. PHƯƠNG PHÁP & CÔNG CỤ THỰC NGHIỆM (METHODOLOGY)

Để đảm bảo tính chính xác tuyệt đối, toàn bộ quá trình audit được thực hiện theo phương pháp kép: **Phân tích tĩnh (Static Analysis)** kết hợp **Đo lường động bằng Trình duyệt thực tế (Dynamic Browser Inspection)**.

- **Máy chủ kiểm thử nội bộ:** Chạy Python HTTP Server (`http://localhost:8088`) phục vụ trực tiếp thư mục dự án.
- **Trình duyệt thực tế:** Điều khiển phiên bản Google Chrome 156.0 native trên macOS (`/Applications/Google Chrome.app`) ở chế độ headless với cờ remote debugging port 9222.
- **Công cụ kết nối:** Sử dụng lớp `WebSocket` native của Node.js kết nối trực tiếp vào Chrome DevTools Protocol (CDP) — **hoàn toàn không cài đặt thêm bất kỳ thư viện bên thứ 3 nào** (`puppeteer`, `playwright`, v.v.), tuân thủ tuyệt đối quy định an toàn của dự án.
- **Kích thước Viewport kiểm tra thực tế (9 mốc):**
  - Small Mobile: `320 × 568` (iPhone SE đời đầu)
  - Mobile: `375 × 667` (iPhone 8 / SE2)
  - Large Mobile: `430 × 932` (iPhone 15 Pro Max)
  - Small Tablet: `600 × 960` (Nexus 7)
  - Tablet Portrait: `768 × 1024` (iPad Mini / Air)
  - Tablet Landscape: `1024 × 768` (iPad ngang)
  - Small Laptop: `1280 × 720` (HD Display)
  - Desktop: `1440 × 900` (MacBook / Full HD tiêu chuẩn)
  - Large Desktop: `1920 × 1080` (Màn hình máy tính bàn lớn)
- **Hình ảnh bằng chứng:** Thu thập 15 ảnh chụp màn hình độ phân giải gốc lưu trữ tại thư mục `audit/menu-navigation/screenshots/`.

---

## 3. CÁC CHỈ SỐ KỸ THUẬT QUAN TRỌNG (KEY METRICS)

| Chỉ số kiểm kê | Số lượng | Ghi chú |
|---|---|---|
| **Tổng số định nghĩa Menu (Menu Definitions)** | **34** | Khai báo độc lập trong HTML partials & JS templates |
| **Tổng số thực thể Menu (Menu Instances)** | **42** | Tính cả các trường hợp nhân bản theo ngữ cảnh/thiết bị |
| **Tổng số loại Menu (Menu Types)** | **13** | Top Nav, Dropdown, Tabs, Action Bar, Modal Nav, Context Menu, v.v. |
| **Tổng số mục Menu (Total Menu Items)** | **196** | Toàn bộ các nút, liên kết và tùy chọn tương tác |
| **Menu tạo động qua JavaScript** | **12** | Sinh động lúc runtime (CEFR Levels, Speed presets, Word actions, v.v.) |
| **Menu dùng chung đa màn hình** | **6** | Bao gồm Global Header, Theme Toggle, Cloud Sync, Sandwich Menu |
| **Số lỗi/khuyết tật phát hiện (Defects)** | **15** | Đã xác minh bằng chứng mã nguồn và runtime CDP |

### Phân bổ mức độ nghiêm trọng của lỗi (Defect Severity Breakdown):
- 🔴 **P0 (Critical — Tê liệt hệ thống):** **0** lỗi (Ứng dụng nạp được, các luồng chính vẫn hoạt động).
- 🟠 **P1 (High — Lỗi runtime, mất tính năng, xung đột dropdown, tràn viền):** **5** lỗi.
- 🟡 **P2 (Medium — Vi phạm WCAG A11y, vỡ theme Light mode, phân mảnh điểm ngắt):** **7** lỗi.
- 🔵 **P3 (Low — DOM rác bị đóng băng, thiếu nhãn ARIA, bất nhất nhãn Quay lại):** **3** lỗi.

---

## 4. TOP 10 PHÁT HIỆN & RỦI RO QUAN TRỌNG NHẤT (TOP 10 CRITICAL FINDINGS)

1. **Lỗi Runtime đỏ `ReferenceError: toggleTheme is not defined` (ISSUE-01 - P1):** Nút chuyển Dark/Light Mode trên thanh Header của Màn hình Luyện dịch gọi hàm không tồn tại, khiến tính năng này hoàn toàn vô tác dụng tại màn hình dịch.
2. **Khóa chết tính năng Cốt lõi trong DOM ẩn (ISSUE-02 - P1):** Tính năng "Sao chép toàn bộ phụ đề" (`copyTranscript`) và "Chia sẻ video" (`shareCurrentVideo`) bị phong tỏa vĩnh viễn trong khối `#sub-search-bar` (`display:none !important`). Người dùng hoàn toàn không có cách nào kích hoạt được.
3. **Trùng lặp DOM ID `#sub-search-input` (ISSUE-03 - P1):** Tồn tại 2 thẻ `<input>` cùng ID trong phòng luyện tập, vi phạm chuẩn W3C và có nguy cơ khiến hàm tìm kiếm phụ đề nhắm sai phần tử.
4. **Xung đột hiển thị đè nhau giữa 2 Dropdown (ISSUE-04 - P1):** Khi mở menu đổi giao diện (`#pv-menu`) rồi mở tiếp Sandwich Menu (`#practice-sandwich-menu`), cả hai menu cùng hiển thị nổi đè lên nhau, che khuất nội dung bài học.
5. **Tràn viền ngang (+2px) tại Viewport 320px (ISSUE-05 - P1):** Thanh công cụ video tại trang chủ (`.video-catalog-toolbar`) vượt khỏi biên màn hình (`rect.right = 322px`), gây ra thanh cuộn ngang khó chịu trên các dòng điện thoại nhỏ.
6. **3 Hộp thoại Modal không đóng được bằng phím `Escape` (ISSUE-06 - P2):** Cloud Sync Modal, CEFR Level Modal, và Audio Sync Modal không đăng ký phím Escape, bắt buộc người dùng bàn phím phải dùng chuột bấm nút ✕.
7. **Toàn bộ 13 Modal trong ứng dụng thiếu Bẫy Tiêu điểm (Focus Trap) (ISSUE-07 - P2):** Người dùng khi mở modal nhấn phím `Tab` có thể đưa con trỏ bàn phím lọt ra ngoài nền ứng dụng, vi phạm nghiêm trọng chuẩn WCAG 2.1.2.
8. **Cloud Sync Modal phá vỡ hệ thống Mint Pastel Light Theme (ISSUE-08 - P2):** `#fss-cloud-modal` dùng mã màu đen cứng `bg-[#0b1329]`, khi mở ở chế độ sáng thì modal lại có màu xanh đen tối sầm.
9. **Phân mảnh 16 mốc Media Queries trong CSS (ISSUE-10 - P2):** Các mốc breakpoint nằm rải rác từ 340px đến 1023px khiến giao diện co giãn không đồng bộ khi đổi kích thước cửa sổ.
10. **Hơn 140 dòng HTML rác bị đóng băng (ISSUE-13 - P3):** Cụm công cụ điều khiển cũ `#practice-header-tools` bị ẩn `display:none !important` nhưng vẫn tồn tại trong DOM gây lãng phí bộ nhớ và khó bảo trì.

---

## 5. ĐÁNH GIÁ TỔNG THỂ KIẾN TRÚC & HỆ THỐNG GIAO DIỆN

| Trục đánh giá | Điểm chất lượng | Nhận xét kiến trúc |
|---|---|---|
| **Tính sẵn sàng chức năng (Functionality)** | **Khá (8/10)** | Các tính năng cốt lõi (Phát video, Đồng bộ phụ đề, Shadowing mic) hoạt động rất tốt; tuy nhiên có 1 hàm lỗi gọi tên và 2 tính năng bị chôn vùi trong DOM ẩn. |
| **Độ phủ Responsive (Responsive Coverage)** | **Tốt (8.5/10)** | Hoạt động mượt mà từ 375px đến 1920px. Chỉ có khuyết tật tràn viền nhỏ (+2px) duy nhất tại mốc cực hạn 320px và hiện tượng phân mảnh media query. |
| **Tính tiếp cận (Accessibility - A11y)** | **Trung bình (6/10)** | Cần nâng cấp đáng kể về bẫy tiêu điểm (Focus Trap) cho hộp thoại modal, đăng ký phím Escape và nâng chiều cao vùng chạm nút bấm đạt chuẩn $\ge 24\text{px}$. |
| **Tính nhất quán thị giác (Design System)** | **Khá (7.5/10)** | Phần lớn tuân thủ biến `--fs-*`, nhưng còn một số thành phần (như Cloud Modal) sử dụng màu cứng độc lập. Nhãn nút Quay lại chưa đồng nhất giữa các màn hình. |

---

## 6. DANH MỤC CÁC TÀI LIỆU KIỂM TOÁN ĐÃ XUẤT XƯỞNG

Toàn bộ 9/9 tài liệu báo cáo chi tiết đã được tạo lập hoàn chỉnh trong thư mục `audit/menu-navigation/`:

1. [`MENU_AUDIT_EXECUTIVE_SUMMARY.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_AUDIT_EXECUTIVE_SUMMARY.md) — Bản tổng quan điều hành (Tài liệu này).
2. [`MENU_INVENTORY.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_INVENTORY.md) — Danh mục kiểm kê 34 menu, 196 mục tương tác, phân loại chi tiết.
3. [`MENU_NAVIGATION_MATRIX.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_NAVIGATION_MATRIX.md) — Ma trận kiểm thử luồng điều hướng từng mục menu, trigger, handler, destination.
4. [`MENU_DUPLICATION_REPORT.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_DUPLICATION_REPORT.md) — Phân tích trùng lặp, mã rác DOM và sơ đồ cây Kiến trúc thông tin (IA).
5. [`MENU_RESPONSIVE_MATRIX.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_RESPONSIVE_MATRIX.md) — Ma trận đo lường tràn viền ngang/dọc trên 9 viewport thực tế qua CDP.
6. [`MENU_UI_CONSISTENCY_REPORT.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_UI_CONSISTENCY_REPORT.md) — Báo cáo sai lệch Design Tokens, màu sắc, font chữ và bán kính bo góc.
7. [`MENU_ACCESSIBILITY_REPORT.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_ACCESSIBILITY_REPORT.md) — Báo cáo đánh giá khả năng tiếp cận theo chuẩn WCAG 2.2 AA.
8. [`MENU_ISSUES_REGISTER.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_ISSUES_REGISTER.md) — Sổ đăng ký 15 lỗi kỹ thuật kèm nguyên nhân và cách khắc phục.
9. [`MENU_REFACTOR_RECOMMENDATIONS.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/MENU_REFACTOR_RECOMMENDATIONS.md) — Kế hoạch hành động 4 giai đoạn, ma trận rủi ro và giải pháp.

---

## 7. GIỚI HẠN KIỂM THỬ (TEST COVERAGE LIMITATIONS)

1. **Kiểm thử trên thiết bị phần cứng vật lý di động:** Toàn bộ kiểm thử mobile/tablet được thực hiện bằng trình duyệt native Google Chrome với cơ chế giả lập Viewport và Touch Emulation qua CDP; chưa chạy trực tiếp trên thiết bị iOS Safari thật (cần bước nghiệm thu thủ công bổ sung trên iPhone vật lý sau khi code).
2. **Tương tác Micro ghi âm trong môi trường Headless:** Headless Chrome không có microphone vật lý, do đó luồng ghi âm giọng nói của menu Shadowing được kiểm tra qua logic DOM và giả lập trạng thái (`isRecording`), không thu âm thanh thực.

---

## 8. BƯỚC TIẾP THEO (NEXT STEPS & WORKFLOW COMPLIANCE)

Tuân thủ nghiêm ngặt quy trình làm việc cốt lõi của `AGENTS.md`:
- Quá trình kiểm toán này **hoàn toàn ở chế độ Read-Only**. Không có bất kỳ dòng mã nguồn nào của ứng dụng (`src/`, `partials/`, `js/`, `css/`) bị sửa đổi.
- Bản báo cáo này đóng vai trò là cơ sở kỹ thuật để bắt đầu **Bước 4 (Thực thi)** sau khi người dùng xem xét và phê duyệt.
- **DỪNG LẠI VÀ CHỜ ĐỢI:** Chờ người dùng phản hồi và cung cấp từ khóa **"Đồng ý"** trước khi mở Module Card M42 để tiến hành sửa lỗi Giai đoạn 1.
