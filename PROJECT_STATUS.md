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
- **Phiên bản hiện tại:** `v2.0.27`
- **Nhánh Git (Branch):** `main` (đồng bộ hoàn toàn với `origin/main`)
- **Commit mới nhất:** `ba376ac` – *feat(contrast): hoàn thành M5b dọn sạch toàn bộ inline style màu trong JS về 0*
- **Trạng thái Git Working Tree:** **Clean 100%** (không có thay đổi chưa commit, không có untracked files thừa)
- **Thời điểm xác minh gần nhất:** `2026-11-03T08:12:00-06:00`
- **Môi trường triển khai:** Vercel Static Hosting (phục vụ trực tiếp từ `index.html` và static assets)

---

## 2. Quality Status (Chất lượng & Kiểm thử thực tế)

*Tất cả số liệu dưới đây đã được xác minh trực tiếp bằng lệnh trong môi trường chạy thực tế:*

- **Kiểm thử đơn vị (Unit Tests):**
  - Lệnh chạy: `node --test tools/*.test.js`
  - Kết quả: **180 / 180 bài test PASS (100%)**, 0 bài fail, thời gian chạy ~880ms.
  - Bộ kiểm thử bao gồm: `contrast-audit.test.js`, `french-utils.test.js`, `schema-v02.test.js`, `vocab-importer.test.js`, `vocab-practice.test.js`, `punct-corrections.test.js`, `punct-manual-merge.test.js`, `extract-prompt-template.test.js`, `theme-init.test.js`, `theme-tokens.test.js`.
- **Kiểm kê mã màu (Color Linting):**
  - Lệnh chạy: `node tools/lint-color.js`
  - Inline style màu trong JavaScript: **0** *(giảm triệt để từ mốc ban đầu 64 về 0)*
  - Class màu Tailwind trong HTML: **0** *(giảm triệt để từ mốc ban đầu 266 về 0)*
  - Mã HEX trong CSS ngoài khối token: **921** *(giảm từ mốc baseline ban đầu 2.362)*
  - Thuộc tính SVG fill/stroke hex: **20**
- **Trạng thái Build Template:**
  - Lệnh chạy: `python3 tools/restructure.py build`
  - Kết quả: **Thành công 100%** – sinh tệp `index.html` hoàn chỉnh với đầy đủ 16 partials và mã băm cache-buster cập nhật.

---

## 3. Milestone Tracker (Tiến độ Lộ trình Chuẩn hóa Màu sắc & Tương phản)

| Module | Tên module & Phạm vi | Trạng thái | Tag / Commit |
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
| **M-Status** | Khởi Tạo Tài Liệu Quản Lý Trạng Thái `PROJECT_STATUS.md` | **Đang thực hiện** | *(Phiên hiện tại)* |
| **M6** | Chuẩn Hóa Trạng Thái Tương Tác & Vòng Sáng Chỉ Thị (Focus Rings) | **Chưa bắt đầu** | *(Kế hoạch tiếp theo)* |
| **M7** | Kiểm Toán Tổng Thể Toàn Diện & Dọn Dẹp Cờ Thừa (Final Audit) | **Chưa bắt đầu** | *(Kế hoạch tiếp theo)* |

---

## 4. Current Focus (Trọng tâm Hiện thời)

- Đã hoàn thành dọn sạch **100% inline styles màu trong JavaScript** (Module M5b, tag `v2.0.27`).
- Đã thiết lập xong tài liệu `PROJECT_STATUS.md` (Module M-Status) phục vụ chuyển giao trạng thái liền mạch.
- Dự án sẵn sàng chuyển tiếp sang **Module M6** (Chuẩn hóa trạng thái tương tác & vòng sáng chỉ thị).

---

## 5. Pending Tasks (Công việc Chờ Thực hiện & Độ ưu tiên)

1. **Ưu tiên 1: Module M6 – Chuẩn hóa trạng thái tương tác & Vòng sáng chỉ thị**
   - Đồng bộ vòng focus (`--fs-focus-ring`) trên tất cả các nút bấm, input, thẻ chip và thanh cuộn.
   - Chuẩn hóa các vòng tiến độ SVG (progress rings) và chỉ báo trạng thái đang chạy.
   - Giải quyết lỗi đo tương phản E14 trong tài liệu kế hoạch.
2. **Ưu tiên 2: Module M7 – Kiểm toán tổng thể & Dọn dẹp cờ thừa**
   - Chạy công cụ kiểm toán toàn diện `node tools/contrast-audit/audit-runner.js`.
   - Rà soát toàn bộ 26 điểm đo tương phản (E01–E26) đảm bảo đạt chuẩn WCAG AA/AAA.
   - Dọn dẹp các cờ thử nghiệm hoặc biến trung gian không còn sử dụng.
   - Phát hành bản phát hành hoàn thiện tổng thể.

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

Khi một AI Agent mới tiếp quản dự án (ví dụ khi người dùng đổi tài khoản Google hoặc mở phiên chat mới):

1. **Bước 1: Đọc tài liệu chỉ dẫn:**
   - Đọc [`AGENTS.md`](./AGENTS.md) để nắm chắc **Quy trình 4 bước bắt buộc** (*Listen & Analyze $\rightarrow$ Propose Plan $\rightarrow$ Wait for Review $\rightarrow$ Execute ONLY on "Đồng ý"*).
   - Đọc [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) (tệp này) để nắm phiên bản, commit, tiến độ module và công việc tiếp theo.
2. **Bước 2: Xác minh trạng thái thực tế bằng lệnh chỉ đọc:**
   ```bash
   git status
   node tools/lint-color.js
   node --test tools/*.test.js
   ```
3. **Bước 3: Tham khảo kiến trúc khi cần:**
   - Nếu cần tìm hiểu về vai trò từng tệp hoặc luồng dữ liệu, tham khảo [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).
4. **Bước 4: Báo cáo & Đề xuất công việc:**
   - Tóm tắt ngắn gọn trạng thái hiện tại với người dùng (ví dụ: *"Dự án đang ở tag v2.0.27, 180 tests PASS, sạch 0 inline style JS, sẵn sàng thực hiện Module M6"*).
   - Xuất trình Module Card cho công việc tiếp theo và **dừng lại chờ người dùng gõ "Đồng ý"**.
5. **Bước 5: Quy tắc duy trì tài liệu:**
   - Khi hoàn thành bất kỳ module nào và trước khi báo cáo nghiệm thu, Agent phải cập nhật các chỉ số mới nhất (commit, tag, kết quả test) vào tệp [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) này.
