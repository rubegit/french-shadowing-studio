# BẢN CHỤP TRẠNG THÁI DỰ ÁN (PROJECT STATUS)
## French Shadowing Studio (FSS)

> **Mục đích tài liệu:** Cung cấp thông tin trạng thái tức thời, kết quả kiểm thử thực tế và kế hoạch công việc tiếp theo cho các phiên làm việc mới của AI Assistant.
> **Quy tắc bảo trì:** Cập nhật tệp này ở bước nghiệm thu cuối cùng của mỗi module phát triển.
> **Tài liệu tham chiếu:**
> - Quy tắc làm việc & quy trình 4 bước: xem [`AGENTS.md`](./AGENTS.md)
> - Kiến trúc hệ thống & sơ đồ phân bổ tệp: xem [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)
> - Lịch sử thay đổi qua các bản phát hành: xem [`CHANGELOG.md`](./CHANGELOG.md)
> - Biên bản bàn giao phiên & công cụ vòng đời context: xem [`HANDOVER.md`](./HANDOVER.md) và [`AUTOMATIC_CONTEXT_LIFECYCLE_AUDIT.md`](./AUTOMATIC_CONTEXT_LIFECYCLE_AUDIT.md)

---

## 1. Project Snapshot (Ảnh chụp Dự án)

- **Tên dự án:** French Shadowing Studio
- **Phiên bản phát hành gần nhất:** `v2.0.27`
- **Current HEAD Commit:** `68c520b` (*feat(audio): M40 redesign audio cloud sync architecture, status badges, and error reporting*)
- **Nhánh Git (Branch):** `main`
- **Trạng thái Git Working Tree:** Triển khai hoàn tất Module M41 (`tools/handover.js`, `tools/handover.test.js`)
- **Môi trường triển khai:** Vercel Static Hosting (phục vụ trực tiếp từ `index.html` và static assets)
- **Thời điểm cập nhật:** `2026-11-07T09:38:00-06:00`

---

## 2. Quality Status (Chất lượng & Kiểm thử thực tế)

*Tất cả số liệu dưới đây đã được xác minh trực tiếp bằng lệnh trong môi trường chạy thực tế:*

- **Kiểm thử đơn vị (Unit Tests):**
  - Lệnh chạy: `node --test tools/*.test.js`
  - Kết quả: **355 / 355 bài test PASS (100%)**, 0 bài fail, 0 skipped, thời gian chạy ~3.7s.
  - Bộ kiểm thử bao gồm: `contrast-audit.test.js`, `focus-rings.test.js`, `sentence-timestamp-edit.test.js`, `userscript-embed-guard.test.js`, `supabase-article-count.test.js`, `article-audio.test.js`, `article-sync.test.js`, `french-utils.test.js`, `schema-v02.test.js`, `vocab-importer.test.js`, `vocab-practice.test.js`, `punct-corrections.test.js`, `punct-manual-merge.test.js`, `extract-prompt-template.test.js`, `theme-init.test.js`, `theme-tokens.test.js`, `article-seamless-player.test.js`, `supabase-audio-sync.test.js`, `handover.test.js`.
- **Kiểm kê mã màu (Color Linting via `node tools/lint-color.js`):**
  - Inline style màu trong JavaScript: **0**
  - Class màu Tailwind trong HTML: **0**
  - Inline style màu trong HTML partials: **0**
  - Thuộc tính SVG fill/stroke HEX: **0**
  - Mã HEX trong CSS ngoài khối token: **921** *(giữ nguyên hạn ngạch $\le 921$)*
- **Kiểm toán độ tương phản (Contrast Audit):**
  - Lệnh chạy: `node tools/contrast-audit/audit-runner.js`
  - Bản chất: Công cụ tính toán độ tương phản trên danh mục mẫu tĩnh gồm 25 cặp màu (`KNOWN_ERROR_CATALOG`) để duy trì tệp `baseline.json`.
- **Trạng thái Build & Verify Template:**
  - Lệnh Build: `python3 tools/restructure.py build`
    - Kết quả: **PASS (100%)** – Lắp ráp hoàn chỉnh `index.html` từ `src/index.src.html` và 16 partials; kết quả tạo ra **0 Git diff**.
  - Lệnh Verify: `python3 tools/restructure.py verify`
    - Kết quả: **Exit code 1** (`KHÁC bản gốc` 25/10/2026, tất yếu sau khi thêm các tính năng và token mới).

---

## 3. Milestone Tracker (Tiến độ Lộ trình Phát triển)

| Module | Tên module & Phạm vi | Trạng thái | Tag / Commit |
|---|---|---|---|
| **M0–M7** | Chuẩn Hóa Màu Sắc, WCAG AAA Token & Trạng Thái Tương Tác | **Đã hoàn thành** | `v2.0.12` – `v2.0.27` |
| **M8–M9.1** | Căn Mốc Thời Gian Tự Động, Fuzzy Auto-Align & Sổ Từ Vựng | **Đã hoàn thành** | `330d91e` – `f94f144` |
| **M10–M23** | Bài Đọc Song Ngữ, Chế Độ Chép Chính Tả, Shadowing Bài Báo & Timestamps | **Đã hoàn thành** | Commit `7a88...` – `280d...` |
| **M24–M26** | Sửa Lỗi Hard SRS Loop, Trần 365 Ngày & Chỉ Tiêu Từ Mới Mỗi Ngày | **Đã hoàn thành** | Commit `c4b1...` |
| **M27–M32** | Acoustic Forced Alignment MMS_FA, Whisper Aligner & Chia Câu Đa Tầng | **Đã hoàn thành** | `offline_aligner/` |
| **M33** | Thanh Audio Player Bài Báo, Nút Bản Dịch Tròn & Điều Khiển Phát Câu | **Đã hoàn thành** | `029da30` |
| **M34** | Đồng Bộ 100% Player Video Sang Bài Báo & Seamless UI Hòa Trộn 3 Tầng | **Đã hoàn thành** | `b08cb21` |
| **M35** | Đồng Bộ Thẻ Bài Báo "Văn Bản Bạn Đã Luyện" Sang Cấu Trúc `.art-sample-row` | **Đã hoàn thành** | `4df7618` |
| **M36** | Lưới Bài Báo Đa Cột, Xóa Bài Mẫu & Accordion Thu Gọn Khung Nhập Bài | **Đã hoàn thành** | `e18e001` |
| **M37** | Khắc Phục Triệt Để CSS Display Khung Nhập Bài Báo Thu Gọn | **Đã hoàn thành** | `32e2978` |
| **M38** | Nhận Diện & Gán Cấp Độ CEFR (A1–C2), Bảo Toàn MP3 Upload Supabase | **Đã hoàn thành** | `68c520b` |
| **M39** | Quét & Đẩy Hàng Loạt Audio MP3 Từ IndexedDB Lên Cloud Storage | **Đã hoàn thành** | `68c520b` |
| **M40** | Tái Thiết Kế Kiến Trúc Audio Cloud Sync, Huy Hiệu Trạng Thái & Báo Lỗi | **Đã hoàn thành** | `68c520b` |
| **M41** | Bộ Công Cụ Vòng Đời Context & Session Handover Tự Động (`tools/handover.js`) | **Đã hoàn thành** | `tools/handover.js` |

---

## 4. Current Focus (Trọng tâm Hiện thời)

- **Module M41 hoàn tất:** Hệ thống quản lý vòng đời context và session handover đã được chuẩn hóa với công cụ `tools/handover.js`:
  - Context Telemetry đọc ngược chunk (`MEASURED` / `ESTIMATED` / `UNKNOWN`).
  - Khóa Mutex nguyên tử PID + `lstart` macOS + UUID chống race condition.
  - Ghi 5 bước nguyên tử APFS (`tmp -> fsync -> bak -> rename -> post-verify`).
  - Hệ thống checkpoint 2 tầng: Lightweight (<60ms) và Full Validation.
  - Toàn bộ 355/355 unit tests PASS (100%).
- **Claude-Mem đã gỡ bỏ hoàn toàn:** Triệt tiêu hoàn toàn độ trễ hook và log spam.

---

## 5. Technical Decisions (Các Quyết định Kỹ thuật Bắt buộc)

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
4. **Quy tắc Quản lý Context & Bàn giao:**
   - Sử dụng lệnh `node tools/handover.js status` để giám sát context.
   - Khi context vượt 85% hoặc khi đổi tài khoản, chạy `node tools/handover.js checkpoint` để ghi chép an toàn vào `HANDOVER.md`.
   - Incoming Agent luôn chạy `node tools/handover.js verify` và xuất trình Intake Report trước khi bắt đầu công việc mới.
