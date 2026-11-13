# BÁO CÁO KIỂM KÊ DANH MỤC MENU & NAVIGATION (MENU INVENTORY)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_INVENTORY.md`  
**Ngày thực hiện:** 2026-11-07  
**Chế độ:** READ-ONLY AUDIT (Không can thiệp mã nguồn)  
**Phạm vi:** Toàn bộ ứng dụng (Trang chủ, Phòng luyện tập, Sổ từ vựng, Đọc sách, Luyện dịch, Hướng dẫn, Các Modal & Dynamic JS Menus)

---

## 1. TỔNG QUAN THỐNG KÊ (INVENTORY METRICS)

| Chỉ số kiểm kê | Số lượng | Ghi chú |
|---|---|---|
| **Tổng số Menu Definitions** | **34** | Định danh độc lập từ `MN-01` đến `MN-34` |
| **Tổng số Menu Instances** | **42** | Một số menu xuất hiện ở nhiều trạng thái màn hình |
| **Tổng số Menu Items** | **196** | Tổng số mục điều hướng, thao tác, bộ lọc, tab có thể tương tác |
| **Số loại Menu (Menu Types)** | **13** | Phân loại chuẩn kiến trúc IA |
| **Menu dùng chung đa màn hình** | **5** | Đổi Theme, Đồng bộ Cloud, Sổ từ vựng, Thanh tua Audio, Cỡ chữ |
| **Menu chỉ xuất hiện trên Mobile** | **3** | Mobile Drawer (`MN-02`), Dictation Hint Switch, Accents Bar |
| **Menu chỉ xuất hiện trên Desktop** | **4** | Subtitle Tabs (`MN-10`), Catalog 3-Col View, Video Timeline Hover, Article Side Panel |
| **Menu được tạo động qua JS** | **7** | Vocab Practice Hub (`MN-20`), Cloud Sync Modal, TCF Exam, Level CEFR Modal, v.v. |

---

## 2. PHÂN LOẠI CHI TIẾT THEO HẠNG MỤC (MENU CLASSIFICATION)

1. **Top Navigation (4):** `MN-01` (Home Top), `MN-03` (Practice Header), `MN-22` (E-Book Header), `MN-26` (Translate Header).
2. **Hamburger / Drawer Navigation (1):** `MN-02` (Home Mobile Navigation Drawer).
3. **Dropdown Menus (2):** `MN-04` (Practice View Switcher), `MN-20` (Vocab Practice Hub Mode Switcher).
4. **Sandwich / Overflow Menus (2):** `MN-05` (Practice Sandwich Menu), `MN-20` (Vocab Practice Hub Sandwich Menu).
5. **Popover Settings Menus (3):** `MN-06` (Typography & Spacing Popup `#fs-pop`), `MN-07` (CC & Subtitle Popup `#cc-pop`), `MN-24` (E-Book Reader Settings `#bk-set`).
6. **Tab Navigations (3):** `MN-10` (Right Subtitle Panel Tabs), `MN-23` (E-Book Drawer TOC/Search Tabs), `MN-33` (Article AI Sync Modal Tabs).
7. **Action / Control Bars (5):** `MN-08` (Video Speed Controls), `MN-09` (Current Sentence Nav), `MN-11` (Article Audio Player Bar), `MN-12` (Article Sentence Nav), `MN-16` (Dictation Accents Toolbar).
8. **Sidebar Action Navigations (2):** `MN-13` (Article Reading Side Panel), `MN-15` (Dictation Side Sentence List).
9. **Filter & Toolbar Navigations (3):** `MN-14` (Shadowing Filter Bar), `MN-19` (Vocab Filter Toolbar), `MN-21` (Vocab Practice Controls Right).
10. **Contextual Action Menus (1):** `MN-30` (Selection Lookup Tooltip Menu `#lookup-tooltip`).
11. **Pagination Navigation (1):** `MN-29` (Catalog Video List Pagination Bar).
12. **Collapsible / Accordion Navigation (1):** `MN-34` (Home Input Accordions).
13. **Modal Dialog Navigations (6):** `MN-18` (Vocab Top Actions), `MN-25` (E-Book Bottom Nav), `MN-27` (Translate Sentence Nav), `MN-28` (Catalog History Toolbar), `MN-31` (Guide Nav), `MN-32` (Article CEFR Level Modal).

---

## 3. BẢNG DANH MỤC TOÀN BỘ 34 MENU DEFINITIONS

| ID | Tên Menu (Menu Name) | Loại (Menu Type) | Vị trí (Location) | Tệp nguồn (Source File) | Kích hoạt (Trigger) | Số mục (Items) | Desktop | Tablet | Mobile |
|---|---|---|---|---|---|---|---|---|---|
| **MN-01** | Home Header Navigation Bar | Top Navigation | Trang chủ (`#screen-input > header`) | `partials/view-home.html` | Luôn hiển thị ở trang chủ | 5 | Hiển thị đầy đủ | Hiển thị đầy đủ | Rút gọn icon |
| **MN-02** | Home Mobile Navigation Drawer | Hamburger / Drawer | Trang chủ (`#mobile-nav-drawer`) | `partials/view-home.html` | Bấm `#btn-mobile-menu` | 8 | Ẩn (`hidden`) | Ẩn (`hidden`) | Hiển thị trượt từ trên |
| **MN-03** | Practice Header Navigation Bar | Top Navigation | Phòng luyện (`#screen-practice > header`) | `partials/view-practice.html` | Luôn hiển thị ở phòng luyện | 6 | Hiển thị đầy đủ | Thu gọn nhãn | Ẩn bớt nút phụ |
| **MN-04** | Practice View Switcher Dropdown | Dropdown Menu | Phòng luyện (`#pv-menu`) | `partials/view-practice.html` | Bấm `#pv-switch-btn` | 3 | Dropdown nổi | Dropdown nổi | Dropdown nổi |
| **MN-05** | Practice Sandwich Menu | Sandwich / Overflow | Phòng luyện (`#practice-sandwich-menu`) | `partials/view-practice.html` | Bấm `#practice-sandwich-btn` | 15 | Dropdown nổi | Dropdown nổi | Tràn cạnh phải |
| **MN-06** | Subtitle Typography Popup | Popover Settings | Phòng luyện (`#fs-pop`) | `partials/view-practice.html` | Bấm `#fs-btn` hoặc từ Sandwich Menu | 12 | Popover nổi | Popover nổi | Popover nổi |
| **MN-07** | Video CC & Subtitle Popup | Popover Settings | Phòng luyện (`#cc-pop`) | `partials/view-practice.html` | Bấm `#cc-btn` | 4 | Popover nổi | Popover nổi | Popover nổi |
| **MN-08** | Video Playback Speed Group | Action / Control Group | Phòng luyện (`#pv-ctl .pv-speeds`) | `partials/view-practice.html` | Luôn hiển thị trên video player | 6 | 5 nút + ô gõ | 5 nút + ô gõ | Co rút (`a1`–`a5`) |
| **MN-09** | Sentence Nav Bar (Video) | Action Navigation Bar | Phòng luyện (`#cs-card .cs-nav`) | `partials/view-practice.html` | Dưới thẻ câu video hiện tại | 4 | Hiển thị đầy đủ | Hiển thị đầy đủ | Hiển thị đầy đủ |
| **MN-10** | Right Subtitle Panel Tabs | Tab Navigation | Phòng luyện (`#sub-panel-tabs`) | `partials/view-practice.html` | Đầu cột phụ đề bên phải | 2 | 2 Tab song song | 2 Tab song song | Ẩn khi video dọc |
| **MN-11** | Article Audio Player Bar | Action / Control Group | Phòng luyện (`#art-player-bar`) | `partials/view-practice.html` | Khi đọc bài có file Audio | 9 | Đầy đủ 2 hàng | Đầy đủ 2 hàng | Co nhỏ tự động |
| **MN-12** | Article Sentence Nav Card | Action Navigation Bar | Phòng luyện (`#art-cs-card .cs-nav`) | `partials/view-practice.html` | Dưới thẻ câu bài đọc | 5 | `< [Play] Dừng >` | `< [Play] Dừng >` | `< [Play] Dừng >` |
| **MN-13** | Article Sidebar Action Panel | Sidebar Action Menu | Phòng luyện (`#article-side-panel`) | `js/01d-player.js` | Sidebar phải khi đọc bài | 6 | Cột cố định | Cột cố định | Dàn xuống dưới |
| **MN-14** | Shadowing Mode Filter Bar | Filter Segmented Nav | Phòng luyện (`#sh-filter`) | `partials/view-practice.html` | Chế độ Shadowing | 2 | Tất cả / Chưa luyện | Tất cả / Chưa luyện | Tất cả / Chưa luyện |
| **MN-15** | Dictation Sentence Nav Bar | Action Navigation Bar | Phòng luyện (`#pv-dictation .dc-nav`) | `partials/view-practice.html` | Đầu giao diện chép chính tả | 4 | Đầy đủ + popup | Đầy đủ + popup | Đầy đủ + popup |
| **MN-16** | Dictation Accents Toolbar | Virtual Keyboard Toolbar | Phòng luyện (`#dc-accents-bar`) | `partials/view-practice.html` | Dưới ô gõ chép chính tả | 15 | 14 ký tự + Shift | 14 ký tự + Shift | 14 ký tự + Shift |
| **MN-17** | Dictation Action Buttons | Action Menu | Phòng luyện (`#pv-dictation .dc-actions`) | `partials/view-practice.html` | Dưới ô gõ và bảng kết quả | 7 | 4 nút gõ + 3 nút kq | 4 nút gõ + 3 nút kq | 4 nút gõ + 3 nút kq |
| **MN-18** | Vocabulary Screen Top Bar | Top Action Navigation | Sổ từ vựng (`#screen-vocab .vocab-top`) | `partials/view-vocab.html` | Luôn hiển thị trong Sổ từ vựng | 8 | Đầy đủ 8 nút | Cuộn ngang / gộp | Cuộn ngang / gộp |
| **MN-19** | Vocabulary Filter Toolbar | Filter / Toolbar Menu | Sổ từ vựng (`#screen-vocab .vocab-toolbar`)| `partials/view-vocab.html` | Dưới tiêu đề sổ từ vựng | 4 | Tìm kiếm + 3 Select | Tìm kiếm + 3 Select | Xếp chồng 2 hàng |
| **MN-20** | Vocab Practice Hub Sandwich | Sandwich / Dropdown | Modal Luyện từ (`#vph-sandwich-dropdown`) | `js/vocab-practice.js` | Bấm `#vph-sandwich-btn` | 6 | Dropdown 6 chế độ | Dropdown 6 chế độ | Dropdown 6 chế độ |
| **MN-21** | Vocab Practice Right Controls | Filter & Goal Nav Bar | Modal Luyện từ (`.vph-controls-right`) | `js/vocab-practice.js` | Góc phải thanh điều khiển Hub | 4 | Đến hạn + 3 Select | Đến hạn + 3 Select | Xếp dọc trên mobile |
| **MN-22** | E-Book Top Navigation Header | Top Navigation | Màn hình Đọc sách (`.bk-top`) | `partials/view-book.html` | Luôn hiển thị trong Đọc sách | 9 | Đầy đủ 9 nút | Thu gọn nhãn | Ẩn bớt nút phụ |
| **MN-23** | E-Book Reader Drawer Tabs | Drawer / Tab Navigation | Màn hình Đọc sách (`#bk-drawer`) | `partials/view-book.html` | Bấm nút Mục lục hoặc Tìm kiếm | 3 | Drawer trái | Drawer trái | Tràn toàn màn hình |
| **MN-24** | E-Book Settings Panel | Dropdown Settings Menu | Màn hình Đọc sách (`#bk-set`) | `partials/view-book.html` | Bấm `#bk-btn-set` | 9 | Modal/Panel nổi | Modal/Panel nổi | Modal/Panel nổi |
| **MN-25** | E-Book Bottom Navigation Bar | Bottom Navigation | Màn hình Đọc sách (`.bk-bottom`) | `partials/view-book.html` | Footer màn hình đọc sách | 4 | Prev + Slider + Next | Prev + Slider + Next | Thu gọn nhãn |
| **MN-26** | Translate Header Navigation | Top Navigation | Màn hình Luyện dịch (`.vt-header`) | `partials/view-translate.html` | Đầu màn hình luyện dịch | 4 | Đầy đủ 4 nút | Đầy đủ 4 nút | Rút gọn icon |
| **MN-27** | Translate Sentence Nav Bar | Action Navigation Bar | Màn hình Luyện dịch (`.vt-nav`) | `partials/view-translate.html` | Thanh điều hướng câu dịch | 4 | Đầy đủ + popup | Đầy đủ + popup | Đầy đủ + popup |
| **MN-28** | Catalog History Toolbar | Toolbar / View Mode Nav | Trang chủ (`.video-catalog-toolbar`) | `partials/view-home.html` | Trên lưới video đã luyện | 5 | Search + Sort + 3 View | Search + Sort + 3 View | Search + Sort + 3 View |
| **MN-29** | Catalog Pagination Bar | Pagination Navigation | Trang chủ (`#video-pagination-bar`) | `partials/view-home.html` | Cuối danh sách video dạng List | 2 | Prev + Next | Prev + Next | Prev + Next |
| **MN-30** | Text Selection Tooltip Menu | Contextual Action Menu | Toàn ứng dụng (`#lookup-tooltip`) | `src/index.src.html` | Bôi đen văn bản tiếng Pháp | 4 | 4 nút hành động | 4 nút hành động | 4 nút hành động |
| **MN-31** | Guide Navigation Bar | Top/Bottom Navigation | Màn hình Hướng dẫn (`#screen-guide`) | `partials/view-guide.html` | Đầu và cuối màn hướng dẫn | 2 | 2 nút Quay lại | 2 nút Quay lại | 2 nút Quay lại |
| **MN-32** | CEFR Level Selection Modal | Modal Selection Menu | Modal Gán trình độ (`#modal-art-level`)| `partials/view-practice.html` | Bấm `#art-side-level-btn` | 8 | Lưới 6 cấp + Bỏ + Đóng | Lưới 6 cấp + Bỏ + Đóng | Lưới 6 cấp + Bỏ + Đóng |
| **MN-33** | Article AI Sync Modal Tabs | Modal Tab Navigation | Modal Căn mốc (`#modal-art-ai-sync`) | `partials/view-practice.html` | Bấm `#art-side-sync-btn` | 5 | 2 Tab + 3 Nút action | 2 Tab + 3 Nút action | 2 Tab + 3 Nút action |
| **MN-34** | Collapsible Input Cards | Accordion Navigation | Trang chủ (`#text-input-card`, `#own-yt-wrap`)| `partials/view-home.html` | Bấm tiêu đề thanh thu gọn | 2 | Thu gọn / Mở rộng | Thu gọn / Mở rộng | Thu gọn / Mở rộng |

---

## 4. CHI TIẾT TỪNG MỤC CON THEO ĐỊNH DANH (ITEMIZED INVENTORY)

Dưới đây là bảng phân rã toàn bộ **196 menu items** thuộc 34 Menu Definitions:

### Nhóm 1: Navigation Trang chủ (Home Views)
- **MN-01 (5 items):**
  1. `MN-01.1`: Logo thương hiệu (`.fs-brand`) — Nhận diện thương hiệu
  2. `MN-01.2`: Nút Từ vựng đã lưu (`.vocab-btn.home-top-btn`) — Mở màn hình Sổ từ vựng (`openVocabScreen()`)
  3. `MN-01.3`: Nút Đồng bộ Cloud (`#btn-cloud-sync`) — Mở modal đồng bộ Supabase (`openCloudSyncModal()`)
  4. `MN-01.4`: Nút Chế độ Sáng / Tối (`.fs-theme-toggle`) — Chuyển đổi giao diện (`toggleFsTheme()`)
  5. `MN-01.5`: Nút Hamburger Menu (`#btn-mobile-menu`) — Mở Mobile Navigation Drawer (`toggleMobileMenu()`)
- **MN-02 (8 items):**
  1. `MN-02.1`: Luyện Video (`[data-mode="video"]`) — Chuyển tab nhập video YouTube
  2. `MN-02.2`: Đọc báo tiếng Pháp (`[data-mode="text"]`) — Chuyển tab nhập bài báo
  3. `MN-02.3`: Đọc sách (`[data-mode="book"]`) — Chuyển tab nạp sách văn học
  4. `MN-02.4`: Luyện dịch câu (`[data-mode="vt"]`) — Chuyển tab luyện dịch Việt - Pháp
  5. `MN-02.5`: Video của bạn (`[data-mode="custom-yt"]`) — Chuyển tab video cá nhân
  6. `MN-02.6`: Lối tắt Từ vựng (`.mobile-nav-action-btn:nth-child(1)`) — Đóng drawer & mở Sổ từ vựng
  7. `MN-02.7`: Lối tắt Đồng bộ Cloud (`.mobile-nav-action-btn:nth-child(2)`) — Đóng drawer & mở Modal Cloud
  8. `MN-02.8`: Lối tắt Theme Sáng / Tối (`.mobile-nav-action-btn:nth-child(3)`) — Chuyển theme Sáng / Tối
- **MN-28 (5 items):**
  1. `MN-28.1`: Ô tìm kiếm video (`#library-search-input`) — Lọc video theo từ khóa
  2. `MN-28.2`: Bộ chọn sắp xếp (`#video-sort-select`) — Sắp xếp theo Gần đây / Cũ nhất / A-Z / Z-A
  3. `MN-28.3`: Chế độ Lưới 2 cột (`#btn-view-grid-2`) — Hiển thị video dạng 2 cột
  4. `MN-28.4`: Chế độ Lưới 3 cột (`#btn-view-grid-3`) — Hiển thị video dạng 3 cột
  5. `MN-28.5`: Chế độ Danh sách hàng (`#btn-view-list`) — Hiển thị video dạng danh sách hàng ngang
- **MN-29 (2 items):**
  1. `MN-29.1`: Trang trước (`#btn-page-prev`) — Lùi về trang video trước
  2. `MN-29.2`: Trang sau (`#btn-page-next`) — Chuyển sang trang video kế tiếp
- **MN-34 (2 items):**
  1. `MN-34.1`: Thanh thu gọn Nhập bài báo (`#text-input-toggle-btn`) — Mở/đóng khung soạn bài báo
  2. `MN-34.2`: Thanh thu gọn Video YouTube của bạn (`#own-yt-toggle`) — Mở/đóng khung nạp video riêng

### Nhóm 2: Navigation Phòng luyện tập (Practice Room Views)
- **MN-03 (6 items):**
  1. `MN-03.1`: Nút Quay lại (`header button:first-child`) — Về màn hình nhập liệu (`backToInputScreen()`)
  2. `MN-03.2`: Nút Từ vựng bài này (`.vocab-btn.primary`) — Mở Sổ từ vựng lọc theo bài (`openVocabScreen('lesson')`)
  3. `MN-03.3`: Nút Đồng bộ Cloud (`.practice-sync-btn`) — Mở modal Supabase
  4. `MN-03.4`: Nút Chế độ Sáng / Tối (`.practice-theme-btn`) — Chuyển theme Sáng / Tối
  5. `MN-03.5`: Nút Giao diện luyện tập (`#pv-switch-btn`) — Mở dropdown chọn 3 giao diện
  6. `MN-03.6`: Nút Menu Sandwich 3 sọc (`#practice-sandwich-btn`) — Mở menu tiện ích luyện tập
- **MN-04 (3 items):**
  1. `MN-04.1`: Giao diện Mặc định (`[data-v="default"]`) — Video + phụ đề karaoke song ngữ
  2. `MN-04.2`: Giao diện Shadowing (`[data-v="shadowing"]`) — Chỉ nghe mẫu và nhại theo từng câu
  3. `MN-04.3`: Giao diện Chép chính tả (`[data-v="dictation"]`) — Nghe gõ lại và chấm điểm từ
- **MN-05 (15 items):**
  1. `MN-05.1`: Đồng bộ đám mây — Mở modal Supabase
  2. `MN-05.2`: Chuyển chế độ Sáng / Tối — Toggle Light/Dark Theme
  3. `MN-05.3`: Cỡ chữ & Giãn dòng — Mở popover căn chỉnh font chữ phụ đề
  4. `MN-05.4`: Phiên âm IPA (`#psm-btn-ipa`) — Bật/tắt hàng phiên âm quốc tế dưới câu
  5. `MN-05.5`: Chạy chữ Karaoke (`#psm-btn-karaoke`) — Bật/tắt highlight từng từ theo giọng nói
  6. `MN-05.6`: Dịch Song ngữ (`#psm-btn-bilingual`) — Bật/tắt hiện bản dịch tiếng Việt
  7. `MN-05.7`: Sửa bản dịch song ngữ — Mở modal nạp/chỉnh sửa bản dịch AI
  8. `MN-05.8`: Tự dừng sau mỗi câu (`#psm-btn-autostop`) — Tự động pause khi kết thúc câu
  9. `MN-05.9`: Tự động cuộn (`#psm-btn-autoscroll`) — Cuộn phụ đề khớp với tiến trình phát
  10. `MN-05.10`: Thêm dấu câu AI — Mở modal thêm dấu câu cho phụ đề ASR
  11. `MN-05.11`: Từ vựng khó AI — Mở modal trích xuất từ vựng quan trọng theo CEFR
  12. `MN-05.12`: Thi thử nghe TCF — Mở modal mô phỏng đề thi nghe TCF Canada
  13. `MN-05.13`: AI tra nghĩa ChatGPT (`[data-ai="chatgpt"]`) — Chọn nhà cung cấp tra từ
  14. `MN-05.14`: AI tra nghĩa Gemini AI (`[data-ai="gemini"]`) — Chọn nhà cung cấp tra từ
  15. `MN-05.15`: AI tra nghĩa Google Search (`[data-ai="google"]`) — Chọn nhà cung cấp tra từ
- **MN-06 (12 items):**
  1. `MN-06.1`–`MN-06.3`: Câu hiện tại: Cỡ chữ A-, Mặc định, A+
  2. `MN-06.4`–`MN-06.6`: Câu hiện tại: Giãn dòng L-, Mặc định, L+
  3. `MN-06.7`–`MN-06.9`: Danh sách câu: Cỡ chữ A-, Mặc định, A+
  4. `MN-06.10`–`MN-06.12`: Danh sách câu: Giãn dòng L-, Mặc định, L+
- **MN-07 (4 items):**
  1. `MN-07.1`: Công tắc Bật/Tắt Phụ đề Việt trên video (`#cc-vi`)
  2. `MN-07.2`: Giảm cỡ chữ phụ đề video A- (`#cc-dec`)
  3. `MN-07.3`: Tăng cỡ chữ phụ đề video A+ (`#cc-inc`)
  4. `MN-07.4`: Gợi ý nạp bản dịch song ngữ (`#cc-hint`)
- **MN-08 (6 items):**
  1. `MN-08.1`–`MN-08.5`: Nút chọn nhanh tốc độ: `0.5x`, `0.75x`, `0.9x`, `1.0x`, `1.25x`
  2. `MN-08.6`: Ô nhập tốc độ phát tự do (`#rate-input`)
- **MN-09 (4 items):**
  1. `MN-09.1`: Câu trước (`#cs-prev`)
  2. `MN-09.2`: Tự dừng cuối câu (`#cs-auto`)
  3. `MN-09.3`: Câu sau (`#cs-next`)
  4. `MN-09.4`: Căn chỉnh thời gian câu (`#cs-ts`)
- **MN-10 (2 items):**
  1. `MN-10.1`: Tab Danh sách câu (`#tab-sub-sentences`)
  2. `MN-10.2`: Tab Từ khó (`#tab-sub-keyvocab`)
- **MN-11 (9 items):**
  1. `MN-11.1`: Đổi hiển thị Giây/Phút (`#art-pb-cur-time`)
  2. `MN-11.2`: Nút tròn Dịch song ngữ (`#art-translate-btn`)
  3. `MN-11.3`: Nút Thu âm giọng đọc bài báo (`#art-rec-btn`)
  4. `MN-11.4`: Ô nhập tốc độ phát audio bài báo (`#art-rate-input`)
  5. `MN-11.5`–`MN-11.9`: 5 nút chọn nhanh tốc độ (`0.5x`, `0.75x`, `0.9x`, `1.0x`, `1.25x`)
- **MN-12 (5 items):**
  1. `MN-12.1`: Câu trước (`#art-cs-prev`)
  2. `MN-12.2`: Phát / Tạm dừng câu (`#art-cs-play`)
  3. `MN-12.3`: Tự dừng câu (`#art-cs-auto`)
  4. `MN-12.4`: Câu sau (`#art-cs-next`)
  5. `MN-12.5`: Căn chỉnh mốc thời gian câu bài báo (`#art-cs-ts`)
- **MN-13 (6 items):**
  1. `MN-13.1`: Dịch song ngữ (`#art-side-bilingual-btn`)
  2. `MN-13.2`: Sửa bản dịch (`#art-side-edit-trans-btn`)
  3. `MN-13.3`: Từ khó AI (`#art-side-keyvocab-btn`)
  4. `MN-13.4`: Gán trình độ (`#art-side-level-btn`)
  5. `MN-13.5`: Căn mốc Audio AI (`#art-side-sync-btn`)
  6. `MN-13.6`: Sao chép nội dung bài (`#art-side-copy-btn`)
- **MN-14 (2 items):**
  1. `MN-14.1`: Lọc tất cả câu Shadowing (`[data-f="all"]`)
  2. `MN-14.2`: Lọc câu chưa luyện Shadowing (`[data-f="todo"]`)
- **MN-15 (4 items):**
  1. `MN-15.1`: Ẩn/Hiện danh sách câu (`#dc-side-show`)
  2. `MN-15.2`: Câu trước (`#dc-prev`)
  3. `MN-15.3`: Nút chọn câu / Xem tiến độ (`#dc-count`)
  4. `MN-15.4`: Câu sau (`#dc-next`)
- **MN-16 (15 items):**
  1. `MN-16.1`–`MN-16.14`: 14 phím ký tự đặc biệt (`é`, `è`, `ê`, `ë`, `à`, `â`, `ù`, `û`, `ô`, `î`, `ï`, `ç`, `œ`, `æ`)
  2. `MN-16.15`: Phím Shift chuyển hoa/thường (`#dc-acc-shift`)
- **MN-17 (7 items):**
  1. `MN-17.1`: Gợi ý từ (`#dc-hintword`)
  2. `MN-17.2`: Xóa ô gõ (`#dc-clear`)
  3. `MN-17.3`: Nghe lại (`#dc-listen-again`)
  4. `MN-17.4`: Kiểm tra đáp án (`#dc-check`)
  5. `MN-17.5`: Gõ lại câu này (`#dc-retry`)
  6. `MN-17.6`: Nghe lại câu kết quả (`#dc-res-replay`)
  7. `MN-17.7`: Câu tiếp theo (`#dc-next2`)

### Nhóm 3: Navigation Sổ từ vựng & Practice Hub
- **MN-18 (8 items):**
  1. `MN-18.1`: Quay lại (`.vocab-back-btn`)
  2. `MN-18.2`: Căn mốc tự động (`#vocab-auto-align-btn`)
  3. `MN-18.3`: Luyện tập SRS (`#vocab-practice-btn`)
  4. `MN-18.4`: Điền nghĩa AI (`.vocab-btn:has(languages)`)
  5. `MN-18.5`: Xuất CSV (`.vocab-btn:has(download)`)
  6. `MN-18.6`: Import xem trước (`.vocab-btn:has(upload)`)
  7. `MN-18.7`: Xóa từ bài này (`#vocab-del-scope-btn`)
  8. `MN-18.8`: Xóa tất cả (`.vocab-btn.danger:has(trash-2)`)
- **MN-19 (4 items):**
  1. `MN-19.1`: Tìm kiếm từ vựng (`#vocab-search`)
  2. `MN-19.2`: Lọc theo nguồn video/bài (`#vocab-source`)
  3. `MN-19.3`: Lọc theo cấp độ CEFR (`#vocab-level`)
  4. `MN-19.4`: Sắp xếp theo Mới/Cũ/A-Z
- **MN-20 (6 items):**
  1. `MN-20.1`: 🎯 Trắc nghiệm 4 đáp án (`[data-mode="quiz"]`)
  2. `MN-20.2`: 🎧 Nghe & Điền từ (`[data-mode="cloze"]`)
  3. `MN-20.3`: 🃏 Ghép thẻ nhanh (`[data-mode="match"]`)
  4. `MN-20.4`: 🎴 Flashcard 3D SRS (`[data-mode="flashcard"]`)
  5. `MN-20.5`: ✍️ Dịch Việt → Pháp (`[data-mode="translate"]`)
  6. `MN-20.6`: 🧩 Sắp xếp câu (`[data-mode="reorder"]`)
- **MN-21 (4 items):**
  1. `MN-21.1`: Công tắc lọc từ đến hạn SRS (`#vph-srs-filter-btn`)
  2. `MN-21.2`: Bộ chọn chỉ tiêu từ mới mỗi ngày (`#vph-daily-goal-select`)
  3. `MN-21.3`: Lọc theo cấp độ CEFR (`#vph-level-select`)
  4. `MN-21.4`: Bộ chọn phạm vi bài học (`#vph-scope-select`)

### Nhóm 4: Navigation Đọc sách (E-Book Reader)
- **MN-22 (9 items):**
  1. `MN-22.1`: Về thư viện (`.bk-ib:has(arrow-left)`)
  2. `MN-22.2`: Nút Mục lục (`#bk-btn-toc`)
  3. `MN-22.3`: Tiêu đề sách (Bấm mở mục lục) (`.bk-titlebox`)
  4. `MN-22.4`: Tìm trong sách (`.bk-ib:has(search)`)
  5. `MN-22.5`: Từ vựng đã lưu (`.bk-ib:has(bookmark)`)
  6. `MN-22.6`: Bật/Tắt Song ngữ (`#bk-btn-bi`)
  7. `MN-22.7`: Tạo/dịch tiếp bản dịch (`.bk-ib:has(sparkles)`)
  8. `MN-22.8`: Cài đặt đọc sách (`#bk-btn-set`)
  9. `MN-22.9`: Chế độ tập trung Fullscreen (`.bk-ib:has(maximize)`)
- **MN-23 (3 items):**
  1. `MN-23.1`: Tab Mục lục (`#bk-tab-toc`)
  2. `MN-23.2`: Tab Tìm kiếm (`#bk-tab-search`)
  3. `MN-23.3`: Đóng Drawer (`.bk-dclose`)
- **MN-24 (9 items):**
  1. `MN-24.1`: Chọn nền đọc (Night / Dim / Sepia / Paper)
  2. `MN-24.2`: Chọn phông chữ (Literata / Georgia / Sans)
  3. `MN-24.3`: Tăng/Giảm cỡ chữ (`A-` / `A+`)
  4. `MN-24.4`: Tăng/Giảm giãn dòng (`-` / `+`)
  5. `MN-24.5`: Độ nổi bật chữ (`-` / `+`)
  6. `MN-24.6`: Độ rộng cột chữ (Hẹp / Vừa / Rộng)
  7. `MN-24.7`: Căn lề chữ (Trái / Đều hai bên)
  8. `MN-24.8`: Bố cục bản dịch (Dưới mỗi đoạn / Dưới từng câu)
  9. `MN-24.9`: Checkbox gạch chân từ đã lưu (`#bk-chk-hl`)
- **MN-25 (4 items):**
  1. `MN-25.1`: Chương trước (`.bk-bottom button:first-child`)
  2. `MN-25.2`: Thanh trượt tiến độ đọc toàn sách (`#bk-slider`)
  3. `MN-25.3`: Nút dịch tiếp theo tiến độ (`#bk-trpill`)
  4. `MN-25.4`: Chương sau (`.bk-bottom button:last-child`)

### Nhóm 5: Navigation Luyện dịch (Translate Practice)
- **MN-26 (4 items):**
  1. `MN-26.1`: Quay lại Thư viện (`.vt-hl button`)
  2. `MN-26.2`: Hiện hết bản dịch (`#vt-readall`)
  3. `MN-26.3`: Nhờ AI dịch (`.vt-ai-btn`)
  4. `MN-26.4`: Chuyển chế độ Sáng / Tối (`.vt-hr .fs-theme-toggle`) — **GỌI SAI HÀM `toggleTheme()`!**
- **MN-27 (4 items):**
  1. `MN-27.1`: Hiện danh sách câu (`#vt-side-show`)
  2. `MN-27.2`: Câu trước (`#vt-prev`)
  3. `MN-27.3`: Chọn câu / Xem tiến độ (`#vt-count`)
  4. `MN-27.4`: Câu sau (`#vt-next`)

### Nhóm 6: Contextual Menus & Modals
- **MN-30 (4 items):**
  1. `MN-30.1`: Tra nghĩa AI (`#btn-lookup-action`)
  2. `MN-30.2`: Phát âm / Từ điển Larousse (`#btn-pronounce-action`)
  3. `MN-30.3`: Loop câu phát âm (`#btn-loop-action`)
  4. `MN-30.4`: Lưu từ vựng nhanh (`#btn-save-action`)
- **MN-31 (2 items):**
  1. `MN-31.1`: Về trang chủ ở header (`.gd-topbar .gd-back`)
  2. `MN-31.2`: Quay lại Studio ở footer (`.gd-end .gd-back`)
- **MN-32 (8 items):**
  1. `MN-32.1`–`MN-32.6`: 6 nút chọn cấp độ CEFR (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`)
  2. `MN-32.7`: Nút Bỏ gán trình độ
  3. `MN-32.8`: Nút Đóng modal gán trình độ
- **MN-33 (5 items):**
  1. `MN-33.1`: Tab 1. Căn chỉnh bài đọc hiện tại (`#art-sync-tab-align`)
  2. `MN-33.2`: Tab 2. Trích xuất từ Audio thuần (`#art-sync-tab-transcribe`)
  3. `MN-33.3`: Khôi phục mặc định (`resetArticleTimestamps()`)
  4. `MN-33.4`: Hủy / Đóng modal (`closeArtAiSyncModal()`)
  5. `MN-33.5`: Áp dụng Timestamps (`applyArtAiSyncTranscript()`)
