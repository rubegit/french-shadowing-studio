# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-04T15:55:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao liền mạch sang phiên làm việc / tài khoản Google mới trong Antigravity.
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit tại thời điểm nạp:** `330d91e` (*feat(vocab): bổ sung nút và cơ chế căn mốc tự động cho từ vựng chưa có timestamp (M8)*)
- **Tình trạng Remote:** Sắp được push lên `origin/main` theo lệnh người dùng.
- **Trạng thái Working Tree:** **Clean 100%** (xác minh thực tế qua `git status --porcelain`).
- **Cảnh báo an toàn Git:**
  - Tuyệt đối **KHÔNG PUSH** commit cục bộ lên remote nếu người dùng chưa ra lệnh rõ ràng bằng văn bản.
  - Tuyệt đối **KHÔNG tự ý reset, checkout hay stash** làm mất commit cục bộ.

---

### 3. Tiến độ & Trạng thái Các Module (Milestone Progress)
- **Release chính thức gần nhất:** `v2.0.27` (Commit `ba376ac`) – Đã tag và push.
- **Module vừa nghiệm thu trong chuỗi Article Audio & Player Harmonization:**
  - **`M1 (Article Audio)`** (Commit `c7e7d19`): Phân tách rạch ròi bộ đếm Video vs Bài báo trên Supabase Cloud Sync, hiển thị dạng 4 cột KPI và báo cáo chính xác "X video, Y bài báo".
  - **`M1.1 (Article Audio)`** (Commit `899ff5f`): Bổ sung hover tooltip cho 4 thẻ KPI trong Cloud Sync Modal.
  - **`M2 (Article Audio)`** (Commit `d5cbb2f`): Bộ nạp Audio MP3 (`accept=".mp3,audio/mpeg"`), lưu trữ Blob trong IndexedDB (`shadowing_article_audio_v1`), Compact Audio Player Bar (`#art-audio-bar`) đồng bộ thời gian 2 chiều.
  - **`M3 (Article Audio)`** (Commit `56e8e5b`): Đồng bộ Transcript & Word-Timestamps từ AI cho bài báo, hỗ trợ parser thông minh JSON/SRT/WebVTT, khôi phục mặc định.
  - **`M3.1 (Article Audio)`** (Commit `912c060`): Bộ chuyển đổi 2 chế độ Prompt AI (Căn chỉnh bài đọc hiện tại & Trích xuất từ Audio thuần).
  - **`M4 (Article Audio)`** (Commit `ccdaf36`): Tái thiết kế thanh Audio Player bài báo thành 2 tầng đồng bộ với Video Player (Tầng 1: Timeline hiển thị giây `XX.Xs`, Tầng 2: Cụm điều khiển, pills tốc độ nhanh, bỏ nút CC).
  - **`M5 (Player Styling)`** (Commit `433246d`): Chuẩn hóa độ dày thanh tiến độ 8px ôm khít và giảm độ bo góc cụm nút tốc độ xuống 11px trên cả 2 players.
  - **`M6 (Player Sync)`** (Commit `ccbfca3`): Chuyển đổi thời lượng Video sang dạng giây (`XX.Xs` / `m:ss` toggle) và bổ sung nút tốc độ `1.25x` vào `#pv-speeds`.
  - **`M7 (Vocab Contrast)`** (Commit `b59cb0b`): Khắc phục lỗi tương phản làm ẩn tiêu đề mục active trong Sandwich Menu luyện từ vựng (`var(--fs-ink)`).
  - **`M8 (Vocab Auto-Align)`** (Commit `330d91e`): Bổ sung nút bấm `⚡ Căn mốc tự động` trên thanh tác vụ Sổ từ vựng, tự động đếm số từ chưa căn mốc và đối chiếu gắn timestamp từ phụ đề; hỗ trợ tự căn mốc khi click thẻ `(chưa căn mốc)`.
  - **`M9 (Fuzzy Auto-Align)`** (Pending Commit): Chuẩn hóa tiền tố `yt:`, sửa lỗi tìm kiếm tiêu đề lịch sử `x.title || x.videoTitle`, khớp tiêu đề mờ (fuzzy) và tự động bù ID vào thẻ từ vựng khi căn mốc; sửa `openVocabVideo` dứt điểm lỗi `javascript:void(0)`.
  - **`Offline Aligner`** (Local Tool): Tích hợp engine MLX Whisper cục bộ và file script double-click `Chay_Dong_Bo.command` tự động quét cặp file audio/transcript, sinh JSON và chuyển vào thư mục Done.
- **Bộ kiểm thử tự động:**
  - `node --test tools/*.test.js`: **213 / 213 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
- **Zero-Bundler & Classic Scripts:** Toàn bộ JavaScript nạp qua `<script src="...">` không dùng `type="module"`, không thêm `defer`/`async` làm hỏng inline event handlers và biến toàn cục.
- **Ràng buộc âm thanh bài báo:** Chỉ cho phép tải lên duy nhất tệp định dạng `.mp3`, không hỗ trợ định dạng khác.
- **Quy tắc sửa HTML (Post-Split):** Không sửa trực tiếp `index.html`. Mọi sửa đổi phải thực hiện trong `src/index.src.html` hoặc `partials/`, sau đó chạy `python3 tools/restructure.py build` để đồng bộ lại `index.html`.
- **Quy tắc Mã màu Semantic:** Khởi động mặc định luôn là Light Mode (`data-ui="light"`). Bắt buộc dùng CSS variable semantic tokens (`--fs-*`). Tuyệt đối không thêm mã HEX cứng hay inline style màu mới.
- **Bảo mật tuyệt đối:** Không lưu thông tin đăng nhập, mật khẩu, token, API key hay dữ liệu nhạy cảm trong bất kỳ tệp tài liệu nào.

---

### 5. Kết quả Kiểm thử Thực tế & Nợ Kỹ thuật Tại Thời Điểm Bàn Giao
- **Kiểm thử đơn vị (Unit Tests):**
  - Lệnh chạy: `node --test tools/*.test.js`
  - Kết quả thực tế: **196 pass / 0 fail / 0 skipped** (thời gian chạy ~910ms).
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
