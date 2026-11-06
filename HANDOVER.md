# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-06T13:40:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất các module M24 (Vocab Highlight & Span Self-healing), M25 (Core SRS Upgrades), M26 (Daily New Vocab Goal Selector & Scheduler Prioritization), M27 (Acoustic Forced Alignment qua Wav2Vec2 CTC), và M28 (Bộ căn chỉnh Whisper độc lập & Công cụ đối chiếu so sánh CTC vs Whisper).
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `5b7a772` - `docs: update HANDOVER.md with M27 acoustic forced aligner approval`
- **Tình trạng Remote:** Up-to-date with `origin/main`.
- **Trạng thái Working Tree:** **Clean 100%** (`offline_aligner/` được bảo toàn an toàn trong `.gitignore`).

---

### 3. Tiến độ & Trạng thái Các Module Gần Nhất
- **M24** (Commit `3b42cfa` - Đã push):
  - Khắc phục lỗi highlight lệch vị trí và rách từ trong chế độ trắc nghiệm, điền từ và flashcard.
  - Tích hợp cơ chế tự phục hồi 4 tầng `resolveTargetWordSpan` và `checkWordMatches`.
- **M25** (Commit `0022bfc` - Đã push):
  - Khắc phục bẫy toán học kẹt chu kỳ của nút "Hard" (`Math.max(interval + 1, Math.round(interval * 1.2))`).
  - Thêm trần tối đa `max_interval = 365` ngày vào `srsCompute`.
  - Bổ sung cơ chế `relearning` & `lapses` khi đánh giá `again` thay vì xóa sạch dấu vết học tập.
  - Bổ sung việc gộp `srs` (chọn bản ghi có `reps` cao nhất) trong `deduplicateVocabItems` tại `vocab-practice.js`.
  - Cập nhật phân loại 4 trạng thái trên thanh Mastery Bar (Mới lưu, Đang củng cố, Đã ghi nhớ, Cần học lại).
- **M26** (Commit `a7fb23f` - Đã push):
  - Thêm dropdown chọn chỉ tiêu từ mới mỗi ngày (`10 | 20 | 30 | 40 | 50 | Tự điền | Không giới hạn`).
  - Lưu cấu hình vào `localStorage` (`fss_daily_new_vocab_limit`).
  - Theo dõi số lượng từ mới đã học trong ngày hôm nay theo ngày dương lịch.
  - Hiển thị badge tiến độ từ mới hôm nay trên thanh Mastery (`🎯 Hôm nay: X/Y từ mới`), tự đổi màu khi hoàn thành.
  - Bộ lập lịch (`prioritizeSessionItems`) tự động lọc bỏ từ mới và tập trung ôn tập khi đã đạt chỉ tiêu hôm nay.
- **M27** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Triển khai bộ Acoustic Forced Alignment tiếng Pháp chuyên dụng bằng Torchaudio `MMS_FA` (Wav2Vec2 CTC) chạy tối ưu trên Metal GPU (`mps`).
  - Tự động chuẩn hóa từ vựng tiếng Pháp (bảo toàn nháy đơn `'`, ligature `œ`, `æ`, gọt dấu phụ khi nạp từ điển CTC), không chạy ASR $\rightarrow$ triệt tiêu hoàn toàn ảo giác (hallucination) do từ đồng âm.
- **M28** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Triển khai `offline_aligner/whisper_aligner.py` độc lập bằng Apple MLX Whisper / OpenAI Whisper.
  - Triển khai `offline_aligner/compare_aligners.py` chạy tiến trình độc lập cách ly Metal Context, xuất báo cáo đối sánh tốc độ và độ chính xác mốc thời gian, tạo 2 file `_ctc.json` và `_whisper.json`.
- **Bộ kiểm thử tự động:**
  - `node --test tools/*.test.js`: **303 / 303 PASS (100%)**.
  - `python3 offline_aligner/test_alignment.py`: **PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
1. **Quy tắc HTML Build:** Tuyệt đối không sửa tay `index.html`. Sửa qua `src/index.src.html` và chạy `python3 tools/restructure.py build`.
2. **Ngân sách màu sắc:** Ngân sách HEX cố định ở mức 921, không thêm bất kỳ inline style màu nào trong JS hoặc HTML.
3. **Cơ chế so khớp từ vựng:** Luôn dùng `resolveTargetWordSpan` từ `js/vocab-practice.js` phối hợp với `findVariantSpan` và `FrenchMorphology` để tìm kiếm và làm nổi bật/che từ an toàn.
4. **Cơ chế SRS:** Tuân thủ biến thể 4 nút cải tiến với trần 365 ngày, theo dõi `relearning` và điều phối số lượng từ mới qua `prioritizeSessionItems`.
5. **Cơ chế Đồng bộ Audio Ngoại tuyến:** Thư mục `offline_aligner/` nằm trong `.gitignore` để phục vụ căn chỉnh audio cục bộ trên máy của người dùng, sử dụng engine CTC làm mặc định với độ chính xác tuyệt đối và cung cấp công cụ so sánh đối đầu `compare_aligners.py`.
