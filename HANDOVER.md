# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-06T15:30:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất các module M24 (Vocab Highlight & Span Self-healing), M25 (Core SRS Upgrades), M26 (Daily New Vocab Goal Selector & Scheduler Prioritization), M27 (Acoustic Forced Alignment qua Wav2Vec2 CTC), M28 (Bộ căn chỉnh Whisper độc lập & So sánh đối đầu), M29 (Tích hợp 1-click Dual Engine Chay_Dong_Bo.command), M30 (Tái cấu trúc thư mục done/[Tên_bài]/Json & txtMp3), M31 (Tinh giản thư mục Json), M32 (Bộ chia câu tự động đa tầng & xuất JSON đa segment theo từng câu cho CTC Aligner), và M33 (Audio Player Bar & Điều khiển phát câu bài báo).
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `c2e2f87` - `docs: update HANDOVER.md with M32 sentence-level segmentation approval`
- **Tình trạng Remote:** Up-to-date with `origin/main`.
- **Trạng thái Working Tree:** Có thay đổi của M33 đã nghiệm thu và build hoàn tất.

---

### 3. Tiến độ & Trạng thái Các Module Gần Nhất
- **M24 – M26** (Đã commit & push lên `origin/main`):
  - Khắc phục highlight lệch vị trí, sửa lỗi vòng lặp hard SRS, thêm trần 365 ngày, relearning tracking, và bộ chọn chỉ tiêu từ mới mỗi ngày kèm badge trực quan.
- **M27 – M29** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Triển khai công nghệ Acoustic Forced Alignment tiếng Pháp dùng Torchaudio `MMS_FA` (Wav2Vec2 CTC) tối ưu Metal GPU trên chip Mac M-series.
  - Triển khai Whisper Aligner độc lập và công cụ đối chiếu tốc độ/độ lệch `compare_aligners.py`.
  - Tích hợp chạy kép 1-click trong `Chay_Dong_Bo.command`.
- **M30 – M31** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Tái cấu trúc toàn bộ thư mục `done/` theo từng bài: `done/[Tên_bài]/Json/` và `done/[Tên_bài]/txtMp3/`.
  - Tinh giản trong `Json/` chỉ lưu đúng 2 file sạch đẹp: `[Tên_bài]_ctc.json` (bản chuẩn nạp học) và `[Tên_bài]_whisper.json` (bản so sánh).
- **M32** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Bổ sung bộ chia câu đa tầng: ưu tiên file câu rời `--sentences-file`, hoặc tự động chia câu thông minh theo ngắt đoạn `\n+|\s{2,}` và kết câu tiếng Pháp `(?<=[.!?])\s+`.
  - Giữ nguyên tiêu đề bài báo thành Segment 1 riêng biệt, không ngắt ở `:`, `;`, `,` hay số thập phân.
  - Gán chỉ số câu cho token trước khi chạy CTC Viterbi, nhóm lại theo câu với `startTime = words[0].startTime`, `endTime = words[-1].endTime`.
  - Tự động in báo cáo kiểm tra 6 bước ra console (bài mẫu đạt chính xác 62 segments, 688 từ, thời gian hợp lệ 100%).
- **M33** (Giao diện Audio Player & Điều khiển phát câu bài báo - Đã nghiệm thu):
  - Tích hợp thanh Player `#art-player-bar` phía trên thẻ câu: hiển thị tiến trình, thời gian hiện tại / tổng thời lượng, thanh trượt tua, nút thu âm, ô nhập tốc độ và dải nút chọn nhanh tốc độ (0.5x, 0.75x, 0.9x, 1.0x, 1.25x).
  - Thay thế nút chữ "CC" bằng icon tròn bản dịch (hai mũi tên xoay tròn lồng chữ `文` và `A`): khi Bật có nền xanh nhạt (`var(--fs-tint)`), icon chữ xanh đậm (`var(--fs-accent-text)`); khi Tắt có nền trắng (`var(--fs-surface-card)`), icon màu xanh đậm.
  - Thêm nút Play/Stop câu hiện tại (`#art-cs-play`) vào hàng điều hướng trước nút Tự dừng theo thứ tự: `< Câu trước | [Play/Stop] | Tự dừng | Câu sau >`.
- **Bộ kiểm thử tự động:**
  - `node --test tools/*.test.js`: **307 / 307 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
1. **Quy tắc HTML Build:** Tuyệt đối không sửa tay `index.html`. Sửa qua `src/index.src.html` và chạy `python3 tools/restructure.py build`.
2. **Ngân sách màu sắc:** Ngân sách HEX cố định ở mức 921, không thêm bất kỳ inline style màu nào trong JS hoặc HTML.
3. **Cơ chế so khớp từ vựng:** Luôn dùng `resolveTargetWordSpan` từ `js/vocab-practice.js` phối hợp với `findVariantSpan` và `FrenchMorphology` để tìm kiếm và làm nổi bật/che từ an toàn.
4. **Cơ chế SRS:** Tuân thủ biến thể 4 nút cải tiến với trần 365 ngày, theo dõi `relearning` và điều phối số lượng từ mới qua `prioritizeSessionItems`.
5. **Cơ chế Đồng bộ Audio Ngoại tuyến:** Thư mục `offline_aligner/` nằm trong `.gitignore`, cấu trúc phân cấp `done/[Tên_bài]/Json` và `txtMp3`, mặc định xuất JSON dạng đa segment theo từng câu (`--segment-mode sentence`).
