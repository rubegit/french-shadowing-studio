# BẢN ĐỒ ÁNH XẠ GIAO DIỆN ĐỌC BÁO (UI-MAP-DOC-BAO)
> Dự án: French Shadowing Studio
> Nhánh: `feature/doc-bao-ui`
> Ngày thực hiện: 2026-10-27
> Tài liệu tham chiếu: `French-Shadowing-Studio-Reading-Aloud-Spec.md` (mục 2.1, 2.2, 2.6), `French-Shadowing-Studio-Layout-Spec.md` (mục 2.5), Mockup `Bao.dc.html`, `Article.dc.html`.

---

## PHẦN 1: BẢNG TRA CỨU 12 SELECTOR TRỌNG YẾU (LISTEN)

Dưới đây là thống kê chi tiết từng vị trí file, dòng và CSS bố cục hiện tại trong codebase:

### 1. `#text-input-mode` (Khung màn hình trang nạp bài báo)
- **HTML:**
  - `partials/view-home.html:105`: `<div id="text-input-mode" class="hidden">`
- **CSS hiện tại:**
  - `css/02-base.css:108`: `#main-card:has(#text-input-mode:not(.hidden)) > .lib-wrap { display: none !important; }` (Ẩn thư viện video YouTube khi mở tab Đọc báo).
  - `css/02-base.css:151`: `#text-input-mode:not(.hidden) { display: flex; flex-direction: column; gap: 18px; }`
  - `css/02-base.css:168, 170, 172, 174`: CSS định dạng input tiêu đề, textarea và placeholder trong chế độ nhập bài.
  - `css/theme-light.css:3463`: `html[data-ui="light"] #text-input-mode:not(.hidden) { display: flex !important; flex-direction: column !important; gap: 24px !important; }`
- **JS:**
  - `js/01b-catalog.js`: Kích hoạt hiển thị khi chuyển sang tab "Đọc báo".

---

### 2. `.fr-news-grid` (Lưới 6 thẻ trang báo tiếng Pháp khuyên đọc)
- **HTML:**
  - `partials/view-home.html:132`: `<div class="fr-news-grid">` chứa 6 thẻ `.fr-news-item` (RFI, Le Monde, France 24, Le Figaro, TV5Monde, Courrier International).
- **CSS hiện tại:**
  - `css/02-base.css:222`: `.fr-news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }`
  - `css/02-base.css:299`: `@media (max-width: 640px) { .fr-news-grid { grid-template-columns: 1fr; } }`
  - `css/theme-light.css:3590`: `html[data-ui="light"] .fr-news-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important; gap: 12px !important; }`
- **Mockup đối chiếu (`Bao.dc.html`):**
  - Sử dụng class `.g3` và `.src`: Lưới `repeat(auto-fill, minmax(220px, 1fr))`, `gap: 12px`. Mỗi thẻ có ô logo `.lg` cố định 44×44px màu thương hiệu, bo 12px, chữ trắng.

---

### 3. `.txt-card` (Khung dán bài báo tiếng Pháp trực tiếp)
- **HTML:**
  - `partials/view-home.html:190`: `<div class="txt-card">`
- **CSS hiện tại:**
  - `css/02-base.css:163`: `.txt-card { display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 20px; background: #070d1f; border: 1px solid #1e2d5c; }`
  - `css/02-base.css:298`: `@media (max-width: 640px) { .txt-card { padding: 14px; } }`
  - `css/03-layout.css:1469`: `.txt-card .yt-channel-avatar { background: rgba(37,99,235,0.2); ... }`
  - `css/theme-light.css:3665`: `html[data-ui="light"] #text-input-mode .txt-card { background: var(--fs-surface) !important; border: 1px solid var(--fs-line) !important; border-radius: var(--fs-radius-lg) !important; padding: 24px !important; box-shadow: var(--fs-shadow-sm) !important; }`
- **Mockup đối chiếu (`Bao.dc.html`):**
  - Thẻ `.card` với header `.hd` (h2 trái, đếm từ phải), ô tiêu đề `.ta` (min-height: 0), textarea `.ta` (min-height: 150px), hàng nút `.row` gồm 3 nút (Tải file, Xóa trắng, Bắt đầu đọc bài viết).

---

### 4. `.txt-chips` (Hàng chip tính năng giới thiệu đọc báo)
- **HTML:**
  - `partials/view-home.html:116`: `<div class="txt-chips">` (4 chip: Tra nghĩa nhanh, Lưu từ vựng, Dịch song ngữ, Tự động lưu lịch sử).
- **CSS hiện tại:**
  - `css/02-base.css:158`: `.txt-chips { display: flex; flex-wrap: wrap; gap: 10px; }`
  - `css/theme-light.css:3515`: `html[data-ui="light"] .txt-chips { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; }`
- **Mockup đối chiếu (`Bao.dc.html`):**
  - Trong mockup mới `Bao.dc.html`, khối này được tinh giản gọn gàng hoặc hòa vào mô tả dưới H1.

---

### 5. `#text-history-container` (Vùng chứa hàng thẻ bài đã đọc gần đây)
- **HTML:**
  - `partials/view-home.html:222`: `<div id="text-history-container"></div>`
- **CSS hiện tại:**
  - `css/02-base.css:146`: `#text-history-container:empty { display: none; }`
  - `css/02-base.css:147`: `#text-history-container .netflix-row-wrapper { margin: 0; }`
- **JS tham chiếu:**
  - `js/01b-catalog.js:418`: `renderTextHistoryRow()` lọc lịch sử text và xuất HTML thẻ vào container này.
  - `js/01b-catalog.js:533`, `js/01d-player.js:165`: Gọi `renderTextHistoryRow()`.
  - `js/02-pv-helper.js:6`: Đồng bộ cuộn ngang.
- **Mockup đối chiếu (`Bao.dc.html`):**
  - Khối `.hs` (cuộn ngang `display:flex; gap:12px; overflow-x:auto`), các thẻ `.hc` (min-width: 240px, bo 16px, có tiêu đề, nguồn, số từ và thanh tiến độ `.bar` 6px).

---

### 6. `#art-lib-grid` (Lưới các bài viết mẫu có sẵn)
- **HTML:**
  - `partials/view-home.html:231`: `<div id="art-lib-grid" class="art-lib-grid"></div>`
- **CSS hiện tại:**
  - `css/02-base.css:130, 142`: `.art-lib-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }`
  - `css/02-base.css:143-145`: Định dạng thẻ bên trong lưới.
- **JS tham chiếu:**
  - `js/01d-player.js:1102`: `window.renderArticleLibrary()` đổ dữ liệu danh sách bài đọc từ `articles/` hoặc fallback `window.__sampleArticles`.
  - `js/01d-player.js:1242, 1284`: Query các thẻ con `.art-yt-card`.
- **Mockup đối chiếu (`Bao.dc.html`):**
  - Lưới `.g3` (repeat auto-fill minmax 220px, 1fr, gap 12px) gồm các thẻ `.v` (thumbnail `.th` có badge cấp độ `.lv` A2/B1/B2, thân `.vb` có tóm tắt 2 dòng, số từ, thời lượng đọc). Bên dưới có nút "Xem thêm" `.btn.g`.

---

### 7. `#article-side-panel` (Thẻ thông tin bài đọc trong phòng đọc)
- **HTML:**
  - `partials/view-practice.html:192`: `<aside id="article-side-panel" class="art-side-panel" style="display:none;"></aside>`
  - *Hiện đang nằm bên trong `#panel-left` (nguyên nhân gây lỗi bị ẩn khi `#panel-left` bị ẩn).*
- **CSS hiện tại:**
  - `css/theme-light.css:4326`: `html[data-ui="light"] body.text-mode #panel-left > :not(#article-side-panel) { display: none !important; }`
  - `css/theme-light.css:4331`: `html[data-ui="light"] body.text-mode #article-side-panel { display: flex !important; flex-direction: column !important; gap: 16px !important; width: 100% !important; }`
  - `css/theme-light.css:4338-4500`: Định dạng chi tiết cho `.art-side-card`, `.art-side-hd`, `.art-side-stats`, `.art-side-actions`, `.art-vocab-section`.
- **JS tham chiếu:**
  - `js/01d-player.js:378`: Trong `backToInputScreen()`, ẩn panel: `sidePanel.style.display = 'none'`.
  - `js/01d-player.js:558`: Trong `openTextSession()`, gọi `renderArticleSidePanel(docId, currentVideoTitle, parsed)`.
  - `js/01d-player.js:564-671`: Định nghĩa hàm `renderArticleSidePanel(...)`: tìm element bằng `document.getElementById('article-side-panel')`, bật `p.style.display = 'flex'` và sinh HTML chi tiết.
- **Mockup đối chiếu (`Article.dc.html`):**
  - Thẻ `.card.sticky` (chiếm cột 340px, `position: sticky; top: 16px; align-self: start`), chứa: Tiêu đề H2 "Bài viết", chip tên báo, nhãn tự động lưu, thống kê số từ/số câu/thời gian, 2 nút hành động (Sao chép bài, Dịch song ngữ), danh sách "Từ vựng quan trọng" kèm nhãn từ loại và cấp độ.

---

### 8. `#panel-left` (Cột trái trong màn hình phòng luyện)
- **HTML:**
  - `partials/view-practice.html:190`: `<div id="panel-left" class="split-panel-left space-y-3.5 pr-0 lg:pr-1.5">`
  - Chứa: `#article-side-panel`, `#video-frame-wrapper`, `#pv-ctl`, `#cs-card`, `#vid-info`, `#video-stats-footer`.
- **CSS hiện tại:**
  - `css/03-layout.css:77`: `body.text-mode .split-panel-left, body.text-mode .split-resizer { display: none !important; }`
  - `css/06-view-news.css:133`: `body.text-mode .split-panel-left { display: none !important; }`
  - `css/09-text-mode-fix.css:2`: `body.text-mode .split-panel-left,body.text-mode #panel-left,body.text-mode .split-resizer{display:none!important}`
  - `css/theme-light.css:2009, 2318`: Bố cục video player bên trái.
  - `css/theme-light.css:4306`: `html[data-ui="light"] body.text-mode #panel-left { order: 2 !important; display: flex !important; ... }` (Cố gắng đảo vị trí nhưng xung đột với 3 rule `display: none !important` ở trên).
- **JS tham chiếu:**
  - `js/01c-subtitles.js:992`: `initSplitResizer()` lấy `leftPanel = document.getElementById('panel-left')` để phục vụ tính năng kéo chia màn hình khi xem video.

---

### 9. `#panel-right` (Cột phải trong màn hình phòng luyện)
- **HTML:**
  - `partials/view-practice.html:297`: `<div id="panel-right" class="split-panel-right bg-[#0a1124] ...">`
  - Chứa: `#sub-panel-hd`, `#subtitles-scroll-container`, `#sub-search-bar`, `#keyvocab-panel-container`.
- **CSS hiện tại:**
  - `css/03-layout.css:71`: `.split-panel-right { width: calc(50% - 4px); flex-shrink: 0; height: 100%; min-height: 0; }`
  - `css/03-layout.css:80`: `body.text-mode .split-panel-right { width: 100% !important; }`
  - `css/06-view-news.css:134`: `body.text-mode .split-panel-right { width: 100% !important; }`
  - `css/09-text-mode-fix.css:3`: `body.text-mode .split-panel-right,body.text-mode #panel-right{width:100%!important}`
  - `css/theme-light.css:4221`: `html[data-ui="light"] body.text-mode #panel-right { order: 1 !important; display: flex !important; ... }`
- **JS tham chiếu:**
  - `js/01c-subtitles.js:993`: `initSplitResizer()` lấy `rightPanel = document.getElementById('panel-right')`.
  - `js/08-responsive-height.js`: Đo chiều cao khả dụng.

---

### 10. `#subtitles-scroll-container` (Vùng cuộn nội dung bài đọc / phụ đề)
- **HTML:**
  - `partials/view-practice.html:307`: `<div id="subtitles-scroll-container" class="flex-1 overflow-y-auto p-4 select-text relative" ...>`
- **CSS hiện tại:**
  - `css/03-layout.css:1315`: `body.text-mode #subtitles-scroll-container { max-width: 960px; margin: 0 auto; width: 100%; }`
  - `css/theme-light.css:4241`: `html[data-ui="light"] body.text-mode #subtitles-scroll-container { max-width: 640px !important; margin: 0 auto !important; padding: 28px 24px !important; width: 100% !important; }`
- **JS tham chiếu:**
  - `js/01c-subtitles.js`, `js/01e-translate-ai.js`: Là container hứng toàn bộ nội dung text và câu thoại.
  - `js/01f-lookup.js`: Đăng ký các event listener tra từ điển khi bôi đen / bấm chữ.

---

### 11. `.sub-textmode-container` (Khối chứa đoạn văn bản bài đọc)
- **HTML:**
  - Sinh động bởi JS trong `js/01e-translate-ai.js:62`: `textCardContainer.className = 'sub-textmode-container ...'`
- **CSS hiện tại:**
  - `css/03-layout.css:1320`: `body.text-mode .sub-textmode-container`
  - `css/theme-light.css:2178, 2202, 2213`: CSS cho từ và dòng câu.
  - `css/theme-light.css:4273`: `html[data-ui="light"] body.text-mode .sub-textmode-container { font-family: var(--fs-font-serif, "Literata", Georgia, serif) !important; font-size: 19px !important; line-height: 1.8 !important; color: var(--fs-ink) !important; }`
- **JS tham chiếu:**
  - `js/01e-translate-ai.js:62`: Tạo container và gắn các câu `.sentence-text-line`.

---

### 12. `body.text-mode` (Class trạng thái kích hoạt chế độ Đọc báo / Văn bản)
- **CSS hiện tại:**
  - Xuất hiện ở `css/03-layout.css`, `css/06-view-news.css`, `css/09-text-mode-fix.css`, `css/12-video-timeline.css`, và `css/theme-light.css:4111-4336`.
  - Phụ trách ẩn các thanh điều khiển video, ẩn thanh phân cách resizer, kích hoạt bố cục phòng đọc.
- **JS kích hoạt:**
  - `js/01d-player.js:528` (`openTextSession`): `document.body.classList.add('text-mode')`.
  - `js/01d-player.js:147, 355, 373`: `document.body.classList.remove('text-mode')` khi rời màn hình hoặc đổi chế độ.

---

## PHẦN 2: TỔNG KẾT THAM CHIẾU VỀ `#panel-left` VÀ `#article-side-panel`

| File | Dòng | Thành phần | Chi tiết tham chiếu và mục đích |
|---|---|---|---|
| `partials/view-practice.html` | 190 | `#panel-left` | Thẻ bao chứa video và bảng điều khiển video |
| `partials/view-practice.html` | 192 | `#article-side-panel` | Thẻ `<aside>` thông tin bài viết (bị kẹp bên trong `#panel-left`) |
| `css/03-layout.css` | 77 | `#panel-left` (qua `.split-panel-left`) | `body.text-mode .split-panel-left { display: none !important; }` |
| `css/06-view-news.css` | 133 | `#panel-left` (qua `.split-panel-left`) | `body.text-mode .split-panel-left { display: none !important; }` |
| `css/09-text-mode-fix.css` | 2 | `#panel-left` | `body.text-mode #panel-left { display: none !important; }` |
| `css/theme-light.css` | 4306 | `#panel-left` | `html[data-ui="light"] body.text-mode #panel-left { order: 2 !important; display: flex !important; }` |
| `css/theme-light.css` | 4326 | `#article-side-panel` | `body.text-mode #panel-left > :not(#article-side-panel) { display: none !important; }` |
| `css/theme-light.css` | 4331 | `#article-side-panel` | `html[data-ui="light"] body.text-mode #article-side-panel { display: flex !important; }` |
| `js/01c-subtitles.js` | 992 | `#panel-left` | `initSplitResizer()`: lấy element tính độ rộng khi người dùng kéo thanh resizer ở video mode |
| `js/01d-player.js` | 378 | `#article-side-panel` | `backToInputScreen()`: ẩn thẻ `sidePanel.style.display = 'none'` khi quay về trang chủ |
| `js/01d-player.js` | 558 | `renderArticleSidePanel` | `openTextSession()`: gọi render thẻ thông tin bài đọc |
| `js/01d-player.js` | 564–671 | `#article-side-panel` | `renderArticleSidePanel(...)`: lấy element bằng ID, gán `p.style.display = 'flex'` và render HTML số từ, số câu, từ vựng |

---

## KẾT LUẬN TỪ BƯỚC LISTEN:
1. `#article-side-panel` hoàn toàn độc lập về logic JS: JS chỉ tìm element bằng `document.getElementById('article-side-panel')`, hoàn toàn không quan tâm nó nằm trong hay ngoài `#panel-left`.
2. `#panel-left` thuần túy là container của Video: Khi xem video, `#panel-left` chứa iframe YouTube và các nút điều khiển video. Khi đọc bài (`body.text-mode`), toàn bộ các nút video này đều vô dụng.
3. Việc kẹp `#article-side-panel` vào trong `#panel-left` là sai lệch nguồn gốc, dẫn tới xung đột giữa các rule `display: none !important` cũ và các rule hiển thị mới.
4. Chuyển node `#article-side-panel` ra thành sibling trực tiếp của `#panel-right` bên trong `#split-container` là giải pháp sạch nhất, triệt để nhất, không làm hỏng bất kỳ logic JS nào.
