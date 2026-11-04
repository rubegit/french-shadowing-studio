# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-04T11:22:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao liền mạch sang phiên làm việc / tài khoản Google mới trong Antigravity.
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit tại thời điểm nạp:** `e77366c` (*feat(a11y): chuẩn hóa trạng thái tương tác, scrollbars và focus rings theo WCAG (M6)*)
- **Tình trạng Remote:** Đang đi trước `origin/main` 4 commits (`01e8373`, `7e87543`, `61c89f2`, `e77366c`), **chưa push lên remote** theo yêu cầu bảo lưu cục bộ của người dùng.
- **Trạng thái Working Tree:** **Clean 100%** (xác minh thực tế qua `git status --porcelain`).
- **Cảnh báo an toàn Git:**
  - Tuyệt đối **KHÔNG PUSH** commit cục bộ lên remote nếu người dùng chưa ra lệnh rõ ràng bằng văn bản.
  - Tuyệt đối **KHÔNG tự ý reset, checkout hay stash** làm mất commit cục bộ.

---

### 3. Tiến độ & Trạng thái Các Module (Milestone Progress)
- **Release chính thức gần nhất:** `v2.0.27` (Commit `ba376ac`) – Đã tag và push.
- **Module vừa nghiệm thu:**
  - **`M6`** (Commit `e77366c`): Chuẩn hóa trạng thái tương tác & vòng sáng chỉ thị (Focus Rings WCAG AAA/AA, custom scrollbars contrast >= 3:1, tactile press feedback scale 0.98, disabled controls, 186/186 tests PASS). Đã nghiệm thu chính thức với từ khóa *"Duyệt M6"*.
- **Các Module tồn đọng & kế hoạch tiếp theo:**
  - **`M7` (Chuẩn bị triển khai):** Kiểm toán toàn diện tổng thể 26 điểm đo tương phản và dọn dẹp cờ thừa.

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
  - Kết quả thực tế: **186 pass / 0 fail / 0 skipped** (thời gian chạy ~900ms).
- **Kiểm kê mã màu (`node tools/lint-color.js`):**
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
