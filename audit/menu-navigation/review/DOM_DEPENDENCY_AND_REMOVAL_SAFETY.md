# PHÂN TÍCH PHỤ THUỘC & KẾ HOẠCH DỌN DẸP DOM AN TOÀN
## (DOM DEPENDENCY & REMOVAL SAFETY PLAN)
### Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/review/DOM_DEPENDENCY_AND_REMOVAL_SAFETY.md`  
**Ngày thực hiện:** 2026-11-07  
**Vai trò:** Principal Frontend Architect & QA Automation Engineer  
**Chế độ thực thi:** STRICT READ-ONLY REVIEW (Không sửa mã nguồn)  

---

## 1. DANH SÁCH CÁC KHỐI DOM ẨN ĐƯỢC PHÂN TÍCH

Báo cáo audit ban đầu đề xuất xóa bỏ một số khối HTML lớn trong `partials/view-practice.html` vì thấy thuộc tính `style="display:none !important;"`. Bản phân tích này lập bản đồ toàn bộ các mối phụ thuộc chéo trong JavaScript, CSS và kiểm thử tự động trước khi cho phép bất kỳ thao tác xóa nào.

Các phần tử được phân tích:
1. `#practice-header-tools` (dòng 58–200 trong `partials/view-practice.html`)
2. `#sub-search-bar` (dòng 664–699 trong `partials/view-practice.html`)
3. `#sub-search-input` (thẻ trùng lặp tại dòng 671 trong `partials/view-practice.html`)
4. `#fs-wrap`, `#fs-btn`, `#fs-pop` (nằm trong `#practice-header-tools`)
5. `#btn-copy-transcript` & `#btn-share` (nằm trong `#sub-search-bar`)

---

## 2. MA TRẬN PHÂN LOẠI TRẠNG THÁI & PHỤ THUỘC (DEPENDENCY CLASSIFICATION)

| ID Phần tử | Phân loại Trạng thái | Số lượng Tham chiếu (Refs) | Chi tiết Tệp & Dòng mã Tham chiếu | Hậu quả nếu Xóa ngay lập tức (Side Effects) |
|---|---|---|---|---|
| `#practice-header-tools` | **LEGACY WITH CRITICAL DEPENDENCY** | **11 tham chiếu** | - `js/03-practice-engine.js:241`<br>- `css/07-practice-modes.css:434, 440, 444`<br>- `css/14-subtitle-card.css:82, 259`<br>- `css/theme-light.css:3280, 11903`<br>- `partials/view-practice.html:59` | **SẬP ỨNG DỤNG NGAY LẬP TỨC:** Hàm `$('practice-header-tools').classList.toggle(...)` tại dòng 241 của `03-practice-engine.js` sẽ quăng lỗi `TypeError: Cannot read properties of null (reading 'classList')` mỗi khi người dùng đổi chế độ học (từ mặc định sang chép chính tả hoặc shadowing). |
| `#sub-search-bar` | **LEGACY WITH RUNTIME DEPENDENCY** | **9 tham chiếu** | - `js/01g-vocab-list.js:2572`<br>- `js/08-responsive-height.js:7, 34, 45`<br>- `css/14-subtitle-card.css:23, 24`<br>- `css/theme-light.css:2567, 5286, 11925, 11927`<br>- `partials/view-practice.html:664` | `js/01g-vocab-list.js` tại dòng 2587 gọi `if (searchBar) searchBar.style.display = '';`. Nếu xóa không kiểm soát, hàm đo chiều cao responsive `08-responsive-height.js` có thể gặp lỗi khi ResizeObserver đăng ký phần tử null. |
| `#sub-search-input` (Dòng 671) | **DUPLICATE ID (SAFE TO REMOVE)** | **10 tham chiếu** (Cả 2 thẻ) | - Line 438: Đang hoạt động tích cực trong `#sub-search-expandable`.<br>- Line 671: Nằm trong `#sub-search-bar` bị ẩn vĩnh viễn. | Xóa thẻ ở dòng 671 là **AN TOÀN TUYỆT ĐỐI**, vì `getElementById` trong JS luôn ưu tiên thẻ ở dòng 438. Việc xóa giúp ứng dụng tuân thủ chuẩn W3C HTML5. |
| `#fs-wrap`, `#fs-btn`, `#fs-pop` | **HIDDEN TRIGGER WITH ACTIVE POPUP** | **12 tham chiếu** | - `js/04-vt-helper.js:3`<br>- `css/07-practice-modes.css:417-421, 490, 521`<br>- `css/theme-light.css:416, 429, 3319`<br>- Gọi bởi `toggleTextSizePanel(event)` từ Sandwich Menu | **HỎNG TÍNH NĂNG ĐỔI CỠ CHỮ & GIÃN DÒNG:** Hộp thoại `#fs-pop` nằm bên trong `#fs-wrap`. Khi người dùng bấm "Cỡ chữ & Giãn dòng" trong Sandwich menu, JS vẫn gọi `toggleTextSizePanel` để hiển thị `#fs-pop`. Nếu xóa `#practice-header-tools` sẽ làm mất luôn `#fs-pop`! |
| `#btn-copy-transcript` | **ACTIVE HANDLER IN HIDDEN DOM** | **4 tham chiếu** | - `js/01e-translate-ai.js:237`<br>- `css/theme-light.css:2589, 2597`<br>- `partials/view-practice.html:679` | `copyTranscript()` kiểm tra `const btn = document.getElementById('btn-copy-transcript');` để thêm class `.copied`. Mã hoạt động hoàn hảo, chỉ có nút bấm đang bị giấu trong DOM. |
| `#btn-share` | **ACTIVE HANDLER IN HIDDEN DOM** | **4 tham chiếu** | - `css/03-layout.css:1401`<br>- `css/theme-light.css:2590, 2598`<br>- `partials/view-practice.html:690`<br>- Gọi bởi `shareCurrentVideo()` trong `01g-vocab-list.js:3343` | Mã chia sẻ video và nạp `#share-modal` hoạt động bình thường; chỉ có nút bấm bị giấu trong DOM ẩn. |

---

## 3. SƠ ĐỒ ĐỒ THỊ PHỤ THUỘC (DEPENDENCY GRAPH)

```mermaid
graph TD
    subgraph HTML_View_Practice [partials/view-practice.html]
        PHT["#practice-header-tools (style='display:none !important')"]
        PHT --> FSWrap["#fs-wrap"]
        FSWrap --> FSBtn["#fs-btn"]
        FSWrap --> FSPop["#fs-pop (Cửa sổ Cỡ chữ & Giãn dòng)"]
        PHT --> CSIpa["#cs-ipa"]
        PHT --> BtnKaraoke["#btn-toggle-karaoke"]
        PHT --> BtnBilingual["#btn-toggle-bilingual"]
        PHT --> BtnAutoStop["#btn-toggle-autostop"]
        PHT --> BtnAutoScroll["#btn-toggle-autoscroll"]
        PHT --> BtnPunct["#btn-punct"]
        PHT --> BtnKeyVocab["#btn-keyvocab"]
        PHT --> BtnTcfExam["#btn-tcf-exam"]

        SSBar["#sub-search-bar (style='display:none !important')"]
        SSBar --> SSInputDup["#sub-search-input (Duplicate ID)"]
        SSBar --> BtnCopy["#btn-copy-transcript"]
        SSBar --> BtnShare["#btn-share"]
    end

    subgraph JavaScript_Dependencies [JavaScript Engine Code]
        JS_Engine["js/03-practice-engine.js"] -->|$('practice-header-tools').classList.toggle| PHT
        JS_Engine -->|$('cs-ipa')| CSIpa
        JS_Sandwich["Sandwich Menu: toggleTextSizePanel()"] -->|Mở popup| FSPop
        JS_VocabList["js/01g-vocab-list.js"] -->|document.getElementById| SSBar
        JS_VocabList -->|document.getElementById| BtnKaraoke
        JS_VocabList -->|document.getElementById| BtnAutoScroll
        JS_RespHeight["js/08-responsive-height.js"] -->|document.getElementById| SSBar
        JS_TranslateAI["js/01e-translate-ai.js"] -->|copyTranscript()| BtnCopy
        JS_Share["js/01g-vocab-list.js: shareCurrentVideo()"] -->|Kích hoạt modal| BtnShare
    end

    style PHT fill:#ffcccc,stroke:#ff0000,stroke-width:2px;
    style SSBar fill:#ffcccc,stroke:#ff0000,stroke-width:2px;
    style FSPop fill:#ccffcc,stroke:#00aa00,stroke-width:2px;
```

---

## 4. ĐIỀU KIỆN TIÊN QUYẾT & QUY TRÌNH DỌN DẸP AN TOÀN (REMOVAL SAFETY CONDITIONS)

Tuyệt đối không được xóa `#practice-header-tools` hoặc `#sub-search-bar` trong giai đoạn đầu. Mọi thao tác dọn dẹp bắt buộc phải tuân thủ nghiêm ngặt **Quy trình Di chuyển 4 bước (4-Step Migration Protocol)**:

### Bước 1: Di dời các phần tử còn hoạt động (Extract Active Children)
- **Tách `#fs-pop` ra khỏi `#practice-header-tools`:** Di chuyển khối `#fs-pop` ra làm một popover độc lập nằm trực tiếp trong `#screen-practice`, neo vào vị trí nút bấm của Sandwich Menu.
- **Xử lý các nút Copy và Share:** Nếu có quyết định khôi phục, di dời `#btn-copy-transcript` và `#btn-share` lên `#sub-panel-hd`. Nếu quyết định loại bỏ, xóa hàm cập nhật class trong `js/01e-translate-ai.js`.

### Bước 2: Khử tham chiếu trong JavaScript (Decouple JS References)
- Trong `js/03-practice-engine.js:241`:
  Sửa từ:
  ```javascript
  $('practice-header-tools').classList.toggle('pv-tools-hidden', v !== 'default');
  ```
  Thành (phòng thủ null-safe):
  ```javascript
  const pht = $('practice-header-tools');
  if (pht) pht.classList.toggle('pv-tools-hidden', v !== 'default');
  ```
- Trong `js/01g-vocab-list.js:2572`:
  Xóa bỏ dòng gán `searchBar.style.display = ''` không cần thiết.
- Trong `js/08-responsive-height.js:7`:
  Kiểm tra null an toàn trước khi gọi `ro.observe(bar)`.

### Bước 3: Dọn dẹp DOM trong HTML Partial (Purge from Source HTML)
- Chỉ sau khi Bước 1 và Bước 2 đã hoàn tất và được xác minh, mới tiến hành xóa bỏ markup thừa trong `partials/view-practice.html`.
- Chạy lệnh build bắt buộc: `python3 tools/restructure.py build`.

### Bước 4: Kiểm thử Nghiệm thu & Rollback (Verification & Rollback)
- **Lệnh kiểm thử:**
  - `node --test tools/*.test.js` (Bảo đảm 355/355 test PASS).
  - Mở phòng luyện tập trên trình duyệt, chuyển đổi qua lại giữa 3 chế độ (Mặc định, Shadowing, Chép chính tả): Console phải sạch sẽ 0 lỗi đỏ.
  - Bấm nút "Cỡ chữ & Giãn dòng" trong Sandwich menu: Hộp thoại `#fs-pop` vẫn phải mở ra bình thường và điều chỉnh cỡ chữ được.
- **Kế hoạch Rollback:**
  - Nếu xuất hiện bất kỳ lỗi null pointer nào trong console, rollback ngay lập tức tệp `partials/view-practice.html` và các file JS tương ứng bằng Git.
