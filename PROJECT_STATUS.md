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
- **Current HEAD Commit:** `a809e71` (*feat(userscript): chặn hiển thị nút trên embed/studio, bỏ nhãn version trên giao diện (M-Userscript-No-Embed)*)
- **Nhánh Git (Branch):** `main`
- **Trạng thái Git Working Tree:** Clean 100%
- **Môi trường triển khai:** Vercel Static Hosting (phục vụ trực tiếp từ `index.html` và static assets)
- **Thời điểm cập nhật:** `2026-11-04T13:18:00-06:00`

---

## 2. Quality Status (Chất lượng & Kiểm thử thực tế)

*Tất cả số liệu dưới đây đã được xác minh trực tiếp bằng lệnh trong môi trường chạy thực tế:*

- **Kiểm thử đơn vị (Unit Tests):**
  - Lệnh chạy: `node --test tools/*.test.js`
  - Kết quả: **193 / 193 bài test PASS (100%)**, 0 bài fail, thời gian chạy ~2.1s.
  - Bộ kiểm thử bao gồm: `contrast-audit.test.js`, `focus-rings.test.js`, `sentence-timestamp-edit.test.js`, `userscript-embed-guard.test.js`, `french-utils.test.js`, `schema-v02.test.js`, `vocab-importer.test.js`, `vocab-practice.test.js`, `punct-corrections.test.js`, `punct-manual-merge.test.js`, `extract-prompt-template.test.js`, `theme-init.test.js`, `theme-tokens.test.js`.
- **Kiểm kê mã màu (Color Linting via `node tools/lint-color.js`):**
  - Inline style màu trong JavaScript: **0**
  - Class màu Tailwind trong HTML: **0**
  - Inline style màu trong HTML partials: **0**
  - Thuộc tính SVG fill/stroke HEX: **0**
  - Mã HEX trong CSS ngoài khối token: **921** *(giữ nguyên hạn ngạch $\le 921$)*
- **Kiểm toán độ tương phản (Contrast Audit):**
  - Lệnh chạy: `node tools/contrast-audit/audit-runner.js`
  - Bản chất: Công cụ tính toán độ tương phản trên danh mục mẫu tĩnh gồm 25 cặp màu (`KNOWN_ERROR_CATALOG` từ Bảng 4 của Kế hoạch gốc) để duy trì tệp `baseline.json`.
- **Trạng thái Build & Verify Template:**
  - Lệnh Build: `python3 tools/restructure.py build`
    - Kết quả: **PASS (100%)** – Lắp ráp hoàn chỉnh `index.html` từ `src/index.src.html` và 16 partials; kết quả tạo ra **0 Git diff**.
  - Lệnh Verify: `python3 tools/restructure.py verify`
    - Kết quả: **Exit code 1** (`KHÁC bản gốc` 25/10/2026, tất yếu sau khi thêm các tính năng và token mới).

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
| **M-Status** | Thiết lập & Hiệu chỉnh Tài Liệu Trạng Thái `PROJECT_STATUS.md` | **Đã hoàn thành** | `9e2ea06` + `2f02b09` |
| **M-Account-Handover-A** | Thiết lập Cơ chế & Biên bản Bàn giao Tài khoản Động (`HANDOVER.md`) | **Đã hoàn thành** | `f28088b` + `3c8594c` |
| **M-Account-Handover-B** | Tạo Agent Skill `/fss-handover` Điều Phối Bàn Giao & Tiếp Nhận | **Đã hoàn thành** | `4b1a8d0` |
| **M5d** | Dọn Dẹp 100% Inline Styles Màu & SVG HEX Trong HTML Partials | **Đã hoàn thành** | `01e8373` + `7e87543` + `61c89f2` |
| **M6** | Chuẩn Hóa Trạng Thái Tương Tác & Vòng Sáng Chỉ Thị (Focus Rings) | **Đã hoàn thành** | `e77366c` |
| **M7** | Kiểm Toán Tổng Thể Toàn Diện & Khóa Chặn Hồi Quy (Final Audit) | **Đã hoàn thành** | `580edc2` |
| **M-Timeline-Timestamp-Bar** | Lưu Timestamp Vĩnh Viễn, Bắt Mốc Thời Gian Thực, Khôi Phục Mốc Gốc & Sửa Lỗi Play Forward | **Đã hoàn thành** | `dfc0c68` |
| **M-Userscript-No-Embed** | Chặn Nút Userscript Trong Iframe Embed & Xóa Nhãn Version Khỏi Giao Diện | **Đã hoàn thành** | `a809e71` |

---

## 4. Current Focus (Trọng tâm Hiện thời)

- **Chiến dịch Chuẩn hóa Redesign & Tiếp cận (Accessibility & Theme Redesign) đã hoàn thành 100% qua tất cả các Milestone từ M0 đến M7:**
  - 100% Inline styles màu trong JavaScript: **0**
  - 100% Inline styles màu trong HTML partials: **0**
  - 100% Thuộc tính SVG fill/stroke HEX: **0**
  - 100% Class màu Tailwind trong HTML: **0**
  - Mã HEX trong CSS ngoài khối token: giữ nguyên hạn ngạch **$\le 921$**.
  - Toàn bộ 187/187 unit tests PASS (100%).
  - Bản build `index.html` đồng bộ hoàn toàn với `src/index.src.html` và partials (0 diff).
- Dự án đã hoàn toàn sạch nợ kỹ thuật màu sắc và sẵn sàng cho các tính năng tiếp theo hoặc phát hành chính thức.

---

## 5. Pending Tasks (Công việc Chờ Thực hiện & Thứ tự Ưu tiên)

1. **Đóng gói & Phát hành Release mới (nếu có yêu cầu từ người dùng):**
   - Tag phiên bản mới và push lên remote khi người dùng yêu cầu bằng văn bản.
2. **Sẵn sàng tiếp nhận các yêu cầu tính năng hoặc cải tiến mới:**
   - Tiếp tục duy trì các bài test tự động và quy tắc Post-Split Workflow.

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

1. **Bước 1: Đọc tài liệu chỉ dẫn bắt buộc:**
   - Đọc [`HANDOVER.md`](./HANDOVER.md) để nắm ngay biên bản bàn giao và trạng thái tức thời của phiên trước.
   - Hướng dẫn Agent mới: Đọc kỹ các điều khoản và khuyến nghị trong [`HANDOVER.md`](./HANDOVER.md) trước khi bắt đầu.
   - Đọc [`AGENTS.md`](./AGENTS.md) để nắm chắc **Quy trình 4 bước bắt buộc** (*Listen & Analyze $\rightarrow$ Propose Plan $\rightarrow$ Wait for Review $\rightarrow$ Execute ONLY on "Đồng ý"*).
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
