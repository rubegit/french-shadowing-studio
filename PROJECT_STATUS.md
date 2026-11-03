# BẢN CHỤP TRẠNG THÁI DỰ ÁN (PROJECT STATUS)
## French Shadowing Studio (FSS)

> **Mục đích tài liệu:** Cung cấp thông tin trạng thái tức thời, kết quả kiểm thử thực tế và kế hoạch công việc tiếp theo cho các phiên làm việc mới của AI Assistant.  
> **Quy tắc bảo trì:** Cập nhật tệp này ở bước nghiệm thu cuối cùng của mỗi module phát triển.  
> **Tài liệu tham chiếu:**  
> - Quy tắc làm việc & quy trình 4 bước: xem [`AGENTS.md`](./AGENTS.md)  
> - Kiến trúc hệ thống & sơ đồ phân bổ tệp: xem [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)  
> - Lịch sử thay đổi qua các bản phát hành: xem [`CHANGELOG.md`](./CHANGELOG.md)

---

## 1. Project Snapshot (Ảnh chụp Dự án)

- **Tên dự án:** French Shadowing Studio
- **Phiên bản phát hành gần nhất:** `v2.0.27` (Commit `ba376ac`)
- **Current HEAD Commit:** `2f02b09` (M-Status-Fix đã nghiệm thu; đang triển khai `M-Account-Handover-A`)
- **Nhánh Git (Branch):** `main`
- **Trạng thái Git Working Tree:** Đang triển khai `M-Account-Handover-A` (chỉ sửa/tạo tài liệu bàn giao, không sửa source code)
- **Môi trường triển khai:** Vercel Static Hosting (phục vụ trực tiếp từ `index.html` và static assets)
- **Thời điểm cập nhật:** `2026-11-03T09:08:00-06:00`

---

## 2. Quality Status (Chất lượng & Kiểm thử thực tế)

*Tất cả số liệu dưới đây đã được xác minh trực tiếp bằng lệnh trong môi trường chạy thực tế:*

- **Kiểm thử đơn vị (Unit Tests):**
  - Lệnh chạy: `node --test tools/*.test.js`
  - Kết quả: **180 / 180 bài test PASS (100%)**, 0 bài fail, thời gian chạy ~880ms.
  - Bộ kiểm thử bao gồm: `contrast-audit.test.js`, `french-utils.test.js`, `schema-v02.test.js`, `vocab-importer.test.js`, `vocab-practice.test.js`, `punct-corrections.test.js`, `punct-manual-merge.test.js`, `extract-prompt-template.test.js`, `theme-init.test.js`, `theme-tokens.test.js`.
- **Kiểm kê mã màu (Color Linting via `node tools/lint-color.js`):**
  - Inline style màu trong JavaScript: **0** *(đã dọn sạch toàn bộ từ mốc ban đầu 64 ở M5a, M5b)*
  - Class màu Tailwind trong HTML: **0** *(đã dọn sạch 100% từ mốc ban đầu 266 ở M3a, M3b, M3c)*
  - **Nợ kỹ thuật còn tồn đọng trong HTML partials:** **40 inline color styles** *(kế hoạch ban đầu ghi 41, chênh lệch 1 style do `modal-vocab-import.html` đã được dọn sạch trong đợt M3c/M4a)*:
    - `partials/view-home.html`: 18
    - `partials/view-guide.html`: 7
    - `partials/view-book.html`: 4
    - `partials/modal-book-translate.html`: 3
    - `partials/view-translate.html`: 3
    - `partials/view-vocab.html`: 2
    - `partials/modal-share.html`: 1
    - `partials/modal-book-import.html`: 1
    - `partials/modal-bilingual.html`: 1
  - **Nợ kỹ thuật SVG:** **20 thuộc tính `fill`/`stroke` HEX** trong các biểu tượng SVG tại partials.
  - **Mã HEX trong CSS ngoài khối token:** **921** *(đã giảm từ mốc ban đầu 2.362 qua các đợt M4a–M4f)*.
- **Kiểm toán độ tương phản (Contrast Audit):**
  - Lệnh chạy: `node tools/contrast-audit/audit-runner.js`
  - Bản chất: Công cụ tính toán độ tương phản trên danh mục mẫu tĩnh gồm 25 cặp màu (`KNOWN_ERROR_CATALOG` từ Bảng 4 của Kế hoạch gốc) để duy trì tệp `baseline.json`. Đây là công cụ đo đạc đối chiếu danh mục lỗi mẫu, **chưa phải là công cụ dynamic runtime audit** quét toàn bộ DOM động khi ứng dụng đang chạy.
- **Trạng thái Build & Verify Template:**
  - Lệnh Build: `python3 tools/restructure.py build`
    - Kết quả: **PASS (100%)** – Lắp ráp hoàn chỉnh `index.html` từ `src/index.src.html` và 16 partials; kết quả tạo ra **0 Git diff**, chứng minh bản build hoàn toàn đồng bộ với mã nguồn partials.
  - Lệnh Verify: `python3 tools/restructure.py verify`
    - Kết quả: **Exit code 1** (`KHÁC bản gốc`).
    - Giải thích kỹ thuật: Lệnh so khớp SHA-256 của chuỗi lắp ráp với `original_sha256` trong `tools/split-manifest.json` (lưu snapshot của `index.html` nguyên khối tại thời điểm tách module ngày 25/10/2026). Sau ngày 25/10, dự án đã bổ sung liên tục các tính năng mới (SRS, TCF, token CSS ngữ nghĩa...), do đó việc khác biệt với bản gốc lịch sử 25/10 là hoàn toàn tất yếu.

---

## 3. Milestone Tracker (Tiến độ Lộ trình Chuẩn hóa Màu sắc & Tương phản)

| Module | Tên module & Phạm vi theo Kế hoạch gốc | Trạng thái | Tag / Commit |
|---|---|---|---|
| **M0** | Sửa Khởi Động Theme Mặc Định (Light Mode deterministic) | **Đã hoàn thành** | `v2.0.12` (`76383fc`) |
| **M1** | Bộ Đo Tự Động & Khóa Chặn CI (`lint-color.js`, `contrast-audit`) | **Đã hoàn thành** | `v2.0.13` (`5388647`) |
| **M2** | Bộ Token Chuẩn WCAG AAA (`theme-light.css`, `04-view-reader.css`) | **Đã hoàn thành** | `v2.0.14` (`7a62899`) |
| **M3a** | Chuẩn Hóa Class Màu Tailwind Cho Các Modal (`modal-*.html`) | **Đã hoàn thành** | `v2.0.15` (`f982276`) |
| **M3b** | Chuẩn Hóa Class Màu Tailwind Cho View Luyện Tập & Dịch | **Đã hoàn thành** | `v2.0.16` (`9626954`) |
| **M3c** | Dọn Sạch Hoàn Toàn 100% Class Màu Tailwind Trong Toàn Bộ HTML | **Đã hoàn thành** | `v2.0.17` (`dfc6307`) |
| **M4a** | Chuẩn Hóa CSS Thẻ Phụ Đề, Điều Khiển Video & Timeline | **Đã hoàn thành** | `v2.0.18` (`b72915b`) |
| **M4b** | Chuẩn Hóa CSS Chế Độ Chép Chính Tả (Dictation) & Shadowing | **Đã hoàn thành** | `v2.0.19` (`687ccc8`) |
| **M4c** | Chuẩn Hóa CSS Bố Cục Phòng Luyện & Video Control Bar | **Đã hoàn thành** | `v2.0.20` (`d250401`) |
| **M4d** | Chuẩn Hóa CSS Luyện Từ Vựng SRS (`vocab-practice.css`) | **Đã hoàn thành** | `v2.0.21` (`7a71d1a`) |
| **M4e** | Chuẩn Hóa CSS Base & Giao Diện Dịch, Điều Khiển Mặc Định | **Đã hoàn thành** | `v2.0.22` (`6a8b2b5`) |
| **M4-fix** | Sửa Lỗi Hiển Thị Nền Xuyên Thấu & Kiểu Dáng Sandwich Menu | **Đã hoàn thành** | `v2.0.23` (`3976524`) |
| **M4f** | Chuẩn Hóa CSS Phòng Thi TCF Canada (`tcf-exam.css`) | **Đã hoàn thành** | `v2.0.24` (`528d679`) |
| **M5a** | Dọn Dẹp Inline Styles Màu Trong `js/vocab-practice.js` | **Đã hoàn thành** | `v2.0.25` (`8379385`) |
| **M5-fix** | Sửa Độ Tương Phản Chip Câu Ghép, Pill Từ Trọng Tâm & Gợi Ý SRS | **Đã hoàn thành** | `v2.0.26` (`06a85fe`) |
| **M5b** | Dọn Dẹp Dứt Điểm Toàn Bộ Inline Styles Màu Trong Các File JS Còn Lại | **Đã hoàn thành** | `v2.0.27` (`ba376ac`) |
| **M-Status** | Thiết lập & Hiệu chỉnh Tài Liệu Trạng Thái `PROJECT_STATUS.md` | **Đã nghiệm thu** | `2f02b09` (nghiệm thu bởi người dùng) |
| **M-Account-Handover-A** | Thiết lập Cơ chế & Biên bản Bàn giao Tài khoản Động (`HANDOVER.md`) | **Đã triển khai, chờ nghiệm thu** | *(commit hiện tại)* |
| **M5d** | Dọn Dẹp Inline Styles Màu & SVG HEX Trong HTML Partials *(Kế hoạch gốc)* | **Chưa thực hiện (Pending)** | *(Tồn đọng 40 inline styles & 20 SVG HEX)* |
| **M6** | Chuẩn Hóa Trạng Thái Tương Tác & Vòng Sáng Chỉ Thị (Focus Rings) | **Chưa bắt đầu (Dự kiến)** | *(Kế hoạch tiếp theo)* |
| **M7** | Kiểm Toán Tổng Thể Toàn Diện & Dọn Dẹp Cờ Thừa (Final Audit) | **Chưa bắt đầu (Dự kiến)** | *(Kế hoạch tiếp theo)* |

---

## 4. Current Focus (Trọng tâm Hiện thời)

- Đã dọn sạch triệt để **100% Tailwind color classes trong HTML** và **100% inline styles màu trong JavaScript**.
- Đang hoàn tất nghiệm thu cơ chế bàn giao tài khoản động **`M-Account-Handover-A`** (`HANDOVER.md` & `AGENTS.md`) làm cơ sở chuyển giao ca minh bạch.
- **Hiện trạng nợ kỹ thuật cần xử lý:**
  - Dự án **chưa sạch màu tuyệt đối**. Vẫn còn tồn tại **40 inline color styles** trong các HTML partials và **20 thuộc tính SVG HEX** (thuộc phạm vi của milestone **M5d** trong Kế hoạch gốc).
  - Vẫn còn **921 mã HEX** trong các file CSS ngoài vùng định nghĩa token.

---

## 5. Pending Tasks (Công việc Chờ Thực hiện & Thứ tự Ưu tiên)

1. **Ưu tiên 1: Nghiệm thu hoàn tất M-Account-Handover-A**
   - Đảm bảo cơ chế bàn giao tự động động và biên bản `HANDOVER.md` đạt chuẩn.
2. **Ưu tiên 2: Triển khai Milestone M5d – Dọn dẹp Inline Styles trong HTML Partials & SVG**
   - Xóa bỏ 40 inline color styles trong 9 partials (`view-home`: 18, `view-guide`: 7, `view-book`: 4, `modal-book-translate`: 3, `view-translate`: 3, `view-vocab`: 2, `modal-share`: 1, `modal-book-import`: 1, `modal-bilingual`: 1).
   - Thay thế 20 thuộc tính SVG `fill`/`stroke` HEX bằng `currentColor` hoặc semantic classes.
   - Chạy `python3 tools/restructure.py build` sau khi chỉnh sửa HTML.
3. **Ưu tiên 3: Triển khai Milestone M6 – Chuẩn hóa trạng thái tương tác & Vòng sáng chỉ thị (Focus Rings)**
   - Đồng bộ vòng focus (`--fs-focus-ring`) trên các nút bấm, input, chip và thanh cuộn.
   - Chuẩn hóa các vòng tiến độ SVG (progress rings) và chỉ báo trạng thái đang chạy.
   - Giải quyết lỗi đo tương phản E14 trong tài liệu kế hoạch.
4. **Ưu tiên 4: Triển khai Milestone M7 – Kiểm toán tổng thể & Dọn dẹp cờ thừa**
   - Rà soát toàn bộ 26 điểm đo tương phản (E01–E26) theo chuẩn WCAG AA/AAA.
   - Dọn dẹp các cờ thử nghiệm hoặc biến trung gian thừa.
   - Đóng gói và phát hành bản chuẩn hóa toàn diện.

---

## 6. Technical Decisions (Các Quyết định Kỹ thuật Bắt buộc)

1. **Quy tắc sửa HTML (Post-Split Rule):**
   - Tuyệt đối **không sửa tay `index.html`**. Mọi thay đổi HTML bắt buộc thực hiện trong `src/index.src.html` hoặc `partials/`.
   - Sau khi sửa, bắt buộc chạy:
     ```bash
     python3 tools/restructure.py build
     ```
   - Luôn commit cả `index.html` lên repository để Vercel phục vụ trực tiếp.
2. **Quy tắc Classic Scripts (Zero-Bundler):**
   - Giữ nguyên toàn bộ mã JavaScript ở dạng Classic Scripts (nạp qua `<script src="...">` không dùng `type="module"`).
   - Không tự ý thêm `defer` hoặc `async` làm sai lệch thứ tự nạp hoặc phá hỏng các inline handler `onclick="..."` và biến toàn cục.
3. **Quy tắc Màu sắc & Tương phản:**
   - Khởi động mặc định luôn là **Light Mode** (`data-ui="light"`).
   - Màu sắc bắt buộc sử dụng CSS Variables Semantic Tokens (`--fs-*`) trong `css/theme-light.css`.
   - Tuyệt đối không đưa thêm mã màu HEX cứng hoặc inline style `style="color:..."` vào mã JS hay HTML.

---

## 7. Agent Handover Guide (Hướng dẫn Tiếp nhận cho AI Agent Mới)

Khi một AI Agent mới tiếp quản dự án (khi đổi tài khoản Google hoặc mở phiên chat mới):

1. **Bước 1: Đọc tài liệu chỉ dẫn & biên bản bàn giao:**
   - Đọc [`HANDOVER.md`](./HANDOVER.md) (nếu tồn tại) để nắm ngay ngữ cảnh bàn giao tức thời của phiên trước.
   - Đọc [`AGENTS.md`](./AGENTS.md) để nắm chắc **Quy trình 4 bước bắt buộc** và Mục 7 về quy trình tiếp nhận phiên làm việc.
   - Đọc [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) (tệp này) để nắm rõ phiên bản, commit, tiến độ module, nợ kỹ thuật thực tế và công việc tiếp theo.
2. **Bước 2: Xác minh trạng thái thực tế bằng các lệnh chỉ đọc:**
   ```bash
   git status
   node tools/lint-color.js
   node --test tools/*.test.js
   ```
3. **Bước 3: Tham khảo kiến trúc khi cần:**
   - Tra cứu kiến trúc hệ thống, vai trò tệp và luồng dữ liệu tại [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).
4. **Bước 4: Báo cáo & Đề xuất công việc:**
   - Báo cáo trung thực hiện trạng: Release v2.0.27, 180 tests PASS, sạch JS inline styles & HTML Tailwind, nhưng còn tồn đọng 40 inline styles trong HTML partials và 20 SVG HEX (Milestone M5d).
   - Xuất trình Module Card cho công việc tiếp theo và **dừng lại chờ người dùng gõ chính xác "Đồng ý"**.
5. **Bước 5: Quy tắc duy trì tài liệu:**
   - Khi hoàn thành bất kỳ module nào và trước khi báo cáo nghiệm thu, Agent bắt buộc cập nhật các chỉ số mới nhất (commit, tag, kết quả test, nợ kỹ thuật) vào tệp [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) này.
