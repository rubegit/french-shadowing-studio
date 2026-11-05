# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-04T20:15:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất chuỗi Hình thái học Tiếng Pháp (M13-M14c), Cầu nối Âm thanh Bài báo (M15a) và Đồng bộ Đám mây Supabase Storage (M15b).
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `7600ec7` - `feat(storage): M15b Supabase Storage cloud sync for article audios, auto upload & download`
- **Tình trạng Remote:** Ahead of `origin/main` by 1 commit (`7600ec7`). (Commit M14c `7b6b51a` và M15a `8481d0c` đã push thành công).
- **Trạng thái Working Tree:** **Clean 100%**.
- **Cảnh báo an toàn Git:**
  - Tuyệt đối **KHÔNG PUSH** commit cục bộ lên remote nếu người dùng chưa ra lệnh rõ ràng bằng văn bản.
  - Tuyệt đối **KHÔNG tự ý reset, checkout hay stash** làm mất commit cục bộ.

---

### 3. Tiến độ & Trạng thái Các Module (Milestone Progress)
- **M14c** (Commit `7b6b51a` - Đã push):
  - Ranh giới lược âm hai nhánh tường minh `(?<=(?:^|[^\p{L}'’])(?:c|d|j|l|m|n|s|t|qu|jusqu|lorsqu|puisqu|quoiqu)['’])`.
  - Homograph priority (`suis` $\rightarrow$ `être`), saved-form-priority, span phản thân chỉ lấy động từ nòng cốt.
  - Bộ benchmark 94 ca: 94/94 OK (100%), Precision lần gán đạt 100% (66/66), 0 gán sai.
- **M15a** (Commit `8481d0c` - Đã push):
  - Nút `🎧 Audio video` phát đúng trích đoạn audio bài báo từ IndexedDB/audio element, tự dừng sau thời lượng quy định.
  - Fallback tức thì sang giọng đọc TTS Pháp cả câu nếu bài báo chưa có file MP3, loại bỏ hoàn toàn hiện tượng treo 10s.
  - Tự động dừng cuối câu (`sentenceAutoStop`) khi phát MP3 bài báo trong Reader Mode.
  - Gán `t_known = false` khi lưu từ bài báo chưa có file âm thanh.
- **M15b** (Commit `7600ec7` - Đã nghiệm thu):
  - Khởi tạo Storage Bucket `article-audios` kèm 4 RLS policies cô lập dữ liệu theo `auth.uid()`.
  - Tự động upload file MP3 bài báo lên Supabase Storage khi người dùng nạp audio.
  - Tự động tải từ Supabase Storage về IndexedDB khi mở bài báo ở máy mới (Cloud-to-Local Auto Fetch & Cache).
- **Bộ kiểm thử tự động:**
  - `node tools/run-benchmark-94.js`: **94 / 94 ĐẠT (100.00%)**, **66 gán đúng**, **0 gán sai**, **28 từ chối đúng**.
  - `node --test tools/*.test.js`: **256 / 256 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
- **Zero-Bundler & Classic Scripts:** Toàn bộ JavaScript nạp qua `<script src="...">` không dùng `type="module"`, không thêm `defer`/`async`.
- **Ràng buộc âm thanh bài báo:** Chỉ cho phép tải lên duy nhất tệp định dạng `.mp3`, không hỗ trợ định dạng khác.
- **Quy tắc sửa HTML (Post-Split):** Không sửa trực tiếp `index.html`. Mọi sửa đổi phải thực hiện trong `src/index.src.html` hoặc `partials/`, sau đó chạy `python3 tools/restructure.py build` để đồng bộ lại `index.html`.
- **Quy tắc Mã màu Semantic:** Khởi động mặc định luôn là Light Mode (`data-ui="light"`). Bắt buộc dùng CSS variable semantic tokens (`--fs-*`). Tuyệt đối không thêm mã HEX cứng hay inline style màu mới.
- **Bảo mật tuyệt đối:** Không lưu thông tin đăng nhập, mật khẩu, token, API key hay dữ liệu nhạy cảm trong bất kỳ tệp tài liệu nào.
