# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-04T13:06:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao liền mạch sang phiên làm việc / tài khoản Google mới trong Antigravity.
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit tại thời điểm nạp:** `dfc0c68` (*feat(player): cho phép lưu timestamp vĩnh viễn, bắt mốc video và reset gốc (M-Timeline-Timestamp-Bar)*)
- **Tình trạng Remote:** Đã push toàn bộ lên `origin/main` theo sự đồng ý của người dùng. Trạng thái `up to date with origin/main`.
- **Trạng thái Working Tree:** **Clean 100%** (xác minh thực tế qua `git status --porcelain`).
- **Cảnh báo an toàn Git:**
  - Tuyệt đối **KHÔNG PUSH** commit cục bộ lên remote nếu người dùng chưa ra lệnh rõ ràng bằng văn bản.
  - Tuyệt đối **KHÔNG tự ý reset, checkout hay stash** làm mất commit cục bộ.

---

### 3. Tiến độ & Trạng thái Các Module (Milestone Progress)
- **Release chính thức gần nhất:** `v2.0.27` (Commit `ba376ac`) – Đã tag và push.
- **Module vừa nghiệm thu:**
  - **`M-Timeline-Timestamp-Bar`** (Commit `dfc0c68`): Bổ sung tính năng Lưu timestamp vĩnh viễn (`💾`), Bắt mốc thời gian thực từ video (`⏱️`), Khôi phục mốc gốc YouTube (`↺ Gốc`), Scale lại mốc từng từ karaoke (`words`), và khắc phục triệt để lỗi ép auto-play khi tua mốc.
  - **`M7`**: Kiểm toán tổng thể toàn diện, khóa chặn hồi quy tự động trong `tools/contrast-audit.test.js`, hoàn tất 100% chiến dịch Redesign từ M0 đến M7.
- **Các Module tồn đọng & kế hoạch tiếp theo:**
  - Tính năng và kiểm toán đều hoạt động hoàn hảo. Sẵn sàng đóng gói release hoặc phát triển tính năng mới.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
- **Zero-Bundler & Classic Scripts:** Toàn bộ JavaScript nạp qua `<script src="...">` không dùng `type="module"`, không thêm `defer`/`async` làm hỏng inline event handlers và biến toàn cục.
- **Quy tắc sửa HTML (Post-Split):** Không sửa trực tiếp `index.html`. Mọi sửa đổi phải thực hiện trong `src/index.src.html` hoặc `partials/`, sau đó chạy `python3 tools/restructure.py build` để đồng bộ lại `index.html`.
- **Quy tắc Mã màu Semantic:** Khởi động mặc định luôn là Light Mode (`data-ui="light"`). Bắt buộc dùng CSS variable semantic tokens (`--fs-*`). Tuyệt đối không thêm mã HEX cứng hay inline style màu mới.
- **Bảo mật tuyệt đối:** Không lưu thông tin đăng nhập, mật khẩu, token, API key hay dữ liệu nhạy cảm trong bất kỳ tệp tài liệu nào.

---

### 5. Kết quả Kiểm thử Thực tế & Nợ Kỹ thuật Tại Thời Điểm Bàn Giao
- **Kiểm thử đơn vị (Unit Tests):**
  - Lệnh chạy: `node --test tools/*.test.js`
  - Kết quả thực tế: **190 pass / 0 fail / 0 skipped** (thời gian chạy ~2.1s).
- **Kiểm kê mã màu (`node tools/lint-color.js`):**
  - Inline style màu trong JS: **0** (sạch 100%).
  - Class Tailwind màu trong HTML: **0** (sạch 100%).
  - Inline style màu trong HTML partials: **0** (sạch 100%).
  - Thuộc tính SVG fill/stroke HEX: **0** (sạch 100%).
  - **Mã HEX trong CSS ngoài token:** **921 HEX**.
- **Trạng thái Build:**
  - `python3 tools/restructure.py build`: PASS (0 diff).
  - `python3 tools/restructure.py verify`: Exit code 1 (do so khớp với hash gốc 25/10/2026, bình thường sau khi phát triển tính năng).
  - Inline style màu trong JS: **0** (sạch 100%).
  - Class Tailwind màu trong HTML: **0** (sạch 100%).
  - Inline style màu trong HTML partials: **0** (sạch 100%).
  - Thuộc tính SVG fill/stroke HEX: **0** (sạch 100%).
  - **Mã HEX trong CSS ngoài token:** **921 HEX**.
- **Trạng thái Build:**
  - `python3 tools/restructure.py build`: PASS (0 diff).
  - `python3 tools/restructure.py verify`: Exit code 1 (do so khớp với hash gốc 25/10/2026, bình thường sau khi phát triển tính năng).

---

### 6. Khuyến nghị Cho Agent B Khi Mở Phiên Mới
Khi người dùng gửi tin nhắn đầu tiên (kể cả chỉ là *"Tiếp tục"*, *"Chào bạn"*):
1. **Kiểm tra xác minh chỉ đọc:**
   ```bash
   git status
   git log -1 --oneline
   node tools/lint-color.js
   node --test tools/*.test.js
   ```
2. **Lập Báo cáo Tiếp nhận (Intake Report) ngắn gọn (3-5 dòng):**
   - Xác nhận đã đọc `HANDOVER.md`, `AGENTS.md` và `PROJECT_STATUS.md`.
   - Báo cáo trạng thái Git (Branch `main`, HEAD commit, working tree clean/dirty).
   - Báo cáo kết quả kiểm thử thực tế và xác nhận module đã hoàn thành (`M-Account-Handover-A`).
3. **Đề xuất Module tiếp theo:**
   - Đề xuất triển khai module tiếp theo (ví dụ: `M-Account-Handover-B` hoặc `M5d`).
   - Xuất trình Module Card đầy đủ và **DỪNG LẠI CHỜ TỪ KHÓA "ĐỒNG Ý"**.

---

### 7. ĐIỀU KHOẢN CẤM ĐOÁN AGENT B (MANDATORY PROHIBITIONS)
- ❌ **TUYỆT ĐỐI KHÔNG** tự ý chỉnh sửa bất kỳ tệp tin nào (kể cả source code hay tài liệu) khi người dùng chưa phê duyệt bằng từ khóa chính xác: **"Đồng ý"**.
- ❌ **TUYỆT ĐỐI KHÔNG** tự ý chạy `git push` lên remote.
- ❌ **TUYỆT ĐỐI KHÔNG** tự ý `git commit`, `git stash`, `git reset` hoặc xóa dữ liệu.
- ❌ **TUYỆT ĐỐI KHÔNG** nhảy cóc qua quy trình 4 bước của `AGENTS.md`.
