# MA TRẬN ĐÁNH GIÁ THIẾT KẾ ĐÁP ỨNG RESPONSIVE (RESPONSIVE MATRIX)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_RESPONSIVE_MATRIX.md`  
**Ngày thực hiện:** 2026-11-07  
**Chế độ:** READ-ONLY AUDIT (Kiểm thử thực tế với Chrome Headless 156.0 qua Chrome DevTools Protocol)  
**Ảnh chụp màn hình đối chiếu:** Đã lưu trữ đầy đủ tại `audit/menu-navigation/screenshots/`  

---

## 1. THIẾT BỊ & KÍCH THƯỚC VIEWPORT KIỂM ĐỊNH (TEST ENVIRONMENT)

| Nhóm thiết bị | Kích thước Viewport ($W \times H$) | Device Scale Factor | Chế độ Mobile | Tệp ảnh chụp minh chứng |
|---|---|---|---|---|
| **Small Mobile** | **320 × 568** (iPhone SE 1st gen) | 2.0 | Có | `viewport_320x568_small_mobile.png` |
| **Mobile** | **375 × 667** (iPhone 8 / SE 2nd gen) | 2.0 | Có | `viewport_375x667_mobile.png`, `mobile_drawer_open_375x667.png`, `practice_mobile_375x667.png` |
| **Large Mobile** | **430 × 932** (iPhone 14/15/16 Pro Max) | 3.0 | Có | `viewport_430x932_large_mobile.png` |
| **Small Tablet** | **600 × 960** (Android Tablet / Kindle) | 2.0 | Có | `viewport_600x960_small_tablet.png` |
| **Tablet Portrait**| **768 × 1024** (iPad Mini / 9th gen dọc) | 2.0 | Có | `viewport_768x1024_tablet_portrait.png` |
| **Tablet Landscape**| **1024 × 768** (iPad ngang / iPad Air) | 2.0 | Không | `viewport_1024x768_tablet_landscape.png` |
| **Small Laptop** | **1280 × 720** (MacBook Air 11" / HD) | 1.0 | Không | `viewport_1280x720_small_laptop.png` |
| **Desktop** | **1440 × 900** (MacBook Pro 14" / FHD) | 1.0 | Không | `viewport_1440x900_desktop.png`, `practice_desktop_1440x900.png`, `practice_sandwich_menu_open_1440x900.png` |
| **Large Desktop** | **1920 × 1080** (iMac / Màn hình 24"-27") | 1.0 | Không | `viewport_1920x1080_large_desktop.png` |

---

## 2. KẾT QUẢ ĐO ĐẠC TRÀN VIỀN THỰC TẾ (OVERFLOW AUDIT)

### 2.1. Tràn viền ngang (Horizontal Overflow - `scrollWidth > clientWidth`)
- **Tại Viewport Small Mobile (320px):**
  - `document.documentElement.clientWidth`: **320px**
  - `document.documentElement.scrollWidth`: **320px**
  - **Phát hiện phần tử tràn biên phải:**
    - Phần tử `.view-mode-toggle-group` trong thanh công cụ video (`.video-catalog-toolbar`) có tọa độ biên phải `rect.right = 322px` (vượt **+2px** so với cạnh phải màn hình).
    - *Nguyên nhân:* Khung chứa `.video-catalog-toolbar` sử dụng `gap-3.5` và không cho phép co nhỏ nhóm nút chuyển View mode (gồm 3 nút SVG 2 cột, 3 cột, list view) khi ô chọn sắp xếp chiếm quá nhiều không gian.
- **Tại các Viewport còn lại (375px đến 1920px):**
  - Hoàn toàn **KHÔNG có tràn viền ngang** (`scrollWidth === clientWidth`). Bố cục dàn trang thích ứng tốt.

---

### 2.2. Tràn viền dọc & Khả năng cuộn (Vertical Overflow)
- **Menu Sandwich trong Phòng luyện tập (`MN-05`):**
  - Chiều cao menu tổng thể khoảng **620px** (chứa 15 mục chức năng và bộ chọn AI).
  - *Tại màn hình có chiều cao hạn chế ($H < 650\text{px}$, ví dụ điện thoại xoay ngang $1024 \times 768$ hoặc $667 \times 375$):* Menu có thể dài hơn chiều cao màn hình.
  - *Kiểm tra:* Menu đã được trang bị `max-height: calc(100vh - 80px)` và `overflow-y: auto`. Tuy nhiên, thanh cuộn tùy biến trên iOS Safari đôi khi khó nhận biết nếu người dùng không vuốt trực tiếp vào giữa thẻ card.
- **Khung xem trước Từ vựng Import (`#fss-import-modal`):**
  - Hỗ trợ tốt `max-height: calc(100dvh - 2rem)` thích ứng dynamic viewport height trên thiết bị di động.

---

### 2.3. Hiện tượng phân mảnh Điểm ngắt Responsive (Breakpoint Fragmentation)
Hệ thống CSS hiện tại sử dụng tới **16 mốc Media Query khác nhau**, gây ra hiện tượng nhảy layout không đồng pha giữa các component:
1. `max-width: 560px` (18 lần — ảnh hưởng lưới bài viết và thẻ tiêu đề)
2. `max-width: 640px` / `639px` (22 lần — chuẩn Tailwind `sm`, ảnh hưởng ẩn nút header)
3. `max-width: 768px` / `767px` (19 lần — chuẩn Tailwind `md`, ảnh hưởng thanh điều khiển)
4. `max-width: 900px` (11 lần — ảnh hưởng thu gọn thanh tốc độ phát video)
5. `max-width: 1023px` / `1024px` (12 lần — chuẩn iPad/Desktop, ảnh hưởng split pane 2 cột sang 1 cột)
6. Các mốc vụn vặt: `340px`, `360px`, `380px`, `420px`, `440px`, `480px`, `600px`, `680px`, `700px`, `820px`.

*Hậu quả:* Trên các thiết bị gập (Foldables) hoặc tablet cỡ nhỏ (kích thước từ 560px đến 768px), một số nút header bị ẩn sớm trong khi phần thân bên dưới vẫn ở chế độ desktop, gây mất cân đối thị giác.

---

## 3. MA TRẬN ĐÁP ỨNG TỪNG MENU THEO VIEWPORT (RESPONSIVE MATRIX)

| Menu ID | Tên Menu | Small Mobile (320px) | Mobile (375-430px) | Small Tablet (600px) | Tablet Portrait (768px) | Tablet Landscape (1024px) | Desktop (1440px+) | Đánh giá Responsive |
|---|---|---|---|---|---|---|---|---|
| **MN-01** | Home Top Navigation | Co cụm icon | Co cụm icon | Hiển thị nút text | Đầy đủ nút | Đầy đủ nút | Đầy đủ nút | **PASS** |
| **MN-02** | Home Mobile Drawer | Tràn viền | Card 347px | Card trung tâm | Ẩn (`hidden`) | Ẩn (`hidden`) | Ẩn (`hidden`) | **PASS** |
| **MN-03** | Practice Header Bar | Ẩn Sync/Theme | Ẩn Sync/Theme | Ẩn text nhãn | Hiện Sync/Theme | Hiện đầy đủ | Hiện đầy đủ | **PASS** (Duplication on Desktop) |
| **MN-04** | View Switcher Dropdown | Dropdown nổi | Dropdown nổi | Dropdown nổi | Dropdown nổi | Dropdown nổi | Dropdown nổi | **PASS** |
| **MN-05** | Practice Sandwich Menu | Canh phải tràn mép | Canh phải | Canh phải | Canh phải | Canh phải | Canh phải | **PASS** (Cần trau chuốt mép phải 320px) |
| **MN-06** | Typography Popup Aa | Popover nổi | Popover nổi | Popover nổi | Popover nổi | Popover nổi | Popover nổi | **PASS** |
| **MN-07** | Video CC Popup | Popover nổi | Popover nổi | Popover nổi | Popover nổi | Popover nổi | Popover nổi | **PASS** |
| **MN-08** | Speed Control Group | Co cấp `a5` (chật) | Co cấp `a3`–`a4` | Co cấp `a2` | Đầy đủ | Đầy đủ | Đầy đủ | **WARNING:** Nút chạm 22px ở 320px |
| **MN-09** | Sentence Nav Bar | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | **PASS** |
| **MN-10** | Subtitle Panel Tabs | Ẩn khi cuộn dọc | Ẩn khi cuộn dọc | Ẩn khi cuộn dọc | 2 Tab song song | 2 Tab song song | 2 Tab song song | **PASS** |
| **MN-11** | Article Player Bar | Co nhỏ font | Co nhỏ font | Chuẩn video | Chuẩn video | Chuẩn video | Chuẩn video | **PASS** |
| **MN-12** | Article Sentence Nav | Đầy đủ 5 nút | Đầy đủ 5 nút | Đầy đủ 5 nút | Đầy đủ 5 nút | Đầy đủ 5 nút | Đầy đủ 5 nút | **PASS** |
| **MN-13** | Article Sidebar Panel | Dàn xuống dưới | Dàn xuống dưới | Dàn xuống dưới | Dàn xuống dưới | Cột cố định phải | Cột cố định phải | **PASS** |
| **MN-14** | Shadowing Filter Bar | Co nút tab | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | **PASS** |
| **MN-15** | Dictation Sentence Nav | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | **PASS** |
| **MN-16** | Dictation Accents Bar | Cuộn ngang | Cuộn ngang | Co 1 hàng | 1 hàng phẳng | 1 hàng phẳng | 1 hàng phẳng | **PASS** |
| **MN-17** | Dictation Actions | Xếp 2 hàng | Xếp 2 hàng | 1 hàng | 1 hàng | 1 hàng | 1 hàng | **PASS** |
| **MN-18** | Vocab Top Actions | Cuộn ngang | Cuộn ngang | Cuộn ngang | 2 hàng nút | Đầy đủ 8 nút | Đầy đủ 8 nút | **PASS** |
| **MN-19** | Vocab Filter Toolbar | 2 hàng dọc | 2 hàng dọc | 1 hàng ngang | 1 hàng ngang | 1 hàng ngang | 1 hàng ngang | **PASS** |
| **MN-20** | Vocab Hub Sandwich | Dropdown 6 mục | Dropdown 6 mục | Dropdown 6 mục | Dropdown 6 mục | Dropdown 6 mục | Dropdown 6 mục | **PASS** |
| **MN-21** | Vocab Hub Right Ctrl | Xếp dọc | Xếp dọc | 2 hàng | 1 hàng ngang | 1 hàng ngang | 1 hàng ngang | **PASS** |
| **MN-22** | E-Book Header Bar | Ẩn bớt nhãn | Ẩn bớt nhãn | Đầy đủ nhãn | Đầy đủ 9 nút | Đầy đủ 9 nút | Đầy đủ 9 nút | **PASS** |
| **MN-23** | E-Book Drawer Tabs | Tràn màn hình | Tràn màn hình | Drawer 320px | Drawer 320px | Drawer 360px | Drawer 360px | **PASS** |
| **MN-24** | E-Book Settings Panel | Panel giữa | Panel giữa | Popover nổi | Popover nổi | Popover nổi | Popover nổi | **PASS** |
| **MN-25** | E-Book Bottom Bar | Slider ngắn | Slider chuẩn | Slider rộng | Slider rộng | Slider rộng | Slider rộng | **PASS** |
| **MN-26** | Translate Header Bar | Rút gọn icon | Rút gọn icon | Đầy đủ nút | Đầy đủ nút | Đầy đủ nút | Đầy đủ nút | **PASS** (Ngoại trừ lỗi hàm theme) |
| **MN-27** | Translate Sentence Nav | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | Đầy đủ 4 nút | **PASS** |
| **MN-28** | Catalog History Toolbar | **Tràn +2px** | Vừa vặn | Vừa vặn | Vừa vặn | Vừa vặn | Vừa vặn | **DEFECT (P1):** Tràn ở 320px |
| **MN-29** | Catalog Pagination | Rút gọn nút | Rút gọn nút | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | **PASS** |
| **MN-30** | Text Selection Tooltip | Nổi tại touch | Nổi tại touch | Nổi tại chuột | Nổi tại chuột | Nổi tại chuột | Nổi tại chuột | **PASS** |
| **MN-31** | Guide Navigation Bar | Căn giữa nút | Căn giữa nút | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ | **PASS** |
| **MN-32** | CEFR Level Modal | Lưới 2 cột | Lưới 2 cột | Lưới 3 cột | Lưới 3 cột | Lưới 6 cột | Lưới 6 cột | **PASS** |
| **MN-33** | Article AI Sync Tabs | 2 Tab xếp dọc | 2 Tab xếp dọc | 2 Tab ngang | 2 Tab ngang | 2 Tab ngang | 2 Tab ngang | **PASS** |
| **MN-34** | Collapsible Cards | Co 100% | Co 100% | Co 100% | Co 100% | Co 100% | Co 100% | **PASS** |

---

## 4. KẾT LUẬN & ĐỀ XUẤT CHO RESPONSIVE

1. **Khắc phục lỗi tràn viền ngang 320px (`MN-28`):**
   - Bổ sung `flex-wrap: wrap` hoặc cho phép ẩn nút 3 cột (`#btn-view-grid-3`) khi màn hình $< 360\text{px}$ (vì trên màn hình 320px hiển thị 3 cột video là không thực tế và quá bé).
2. **Quy chuẩn hóa Điểm ngắt (Breakpoint Consolidation):**
   - Gom 16 mốc media query tản mác về **4 mốc tiêu chuẩn duy nhất**:
     - `sm`: `640px` (Điện thoại lớn / Phablet)
     - `md`: `768px` (Tablet dọc)
     - `lg`: `1024px` (Tablet ngang / Laptop nhỏ)
     - `xl`: `1280px` (Màn hình Desktop tiêu chuẩn)
3. **Bảo toàn Kích thước Vùng chạm (Touch Target Safety):**
   - Khi dải tốc độ `#pv-ctl .pv-speeds` co xuống cấp `a4` và `a5`, cần bảo đảm chiều rộng tối thiểu của mỗi nút là $\ge 28\text{px}$ để người dùng ngón tay cái trên điện thoại không bấm nhầm.
