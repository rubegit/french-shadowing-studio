# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-06T11:47:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất các module M24 (Vocab Highlight & Span Self-healing), M25 (Core SRS Upgrades: sửa lỗi vòng lặp hard, trần 365 ngày, relearning state, 4 trạng thái Mastery), và M26 (Bộ chọn chỉ tiêu từ mới mỗi ngày, tracking badge và scheduler prioritization).
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `a7fb23f` - `feat(vocab): M26 add daily new vocab goal selector, tracking badge and scheduler prioritization`
- **Tình trạng Remote:** Up-to-date with `origin/main`.
- **Trạng thái Working Tree:** **Clean 100%**.

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
- **Bộ kiểm thử tự động:**
  - `node --test tools/*.test.js`: **303 / 303 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
1. **Quy tắc HTML Build:** Tuyệt đối không sửa tay `index.html`. Sửa qua `src/index.src.html` và chạy `python3 tools/restructure.py build`.
2. **Ngân sách màu sắc:** Ngân sách HEX cố định ở mức 921, không thêm bất kỳ inline style màu nào trong JS hoặc HTML.
3. **Cơ chế so khớp từ vựng:** Luôn dùng `resolveTargetWordSpan` từ `js/vocab-practice.js` phối hợp với `findVariantSpan` và `FrenchMorphology` để tìm kiếm và làm nổi bật/che từ an toàn.
4. **Cơ chế SRS:** Tuân thủ biến thể 4 nút cải tiến với trần 365 ngày, theo dõi `relearning` và điều phối số lượng từ mới qua `prioritizeSessionItems`.
