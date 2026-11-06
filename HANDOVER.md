# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-06T08:17:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất các module M21 (Article Audio Sidebar UI), M22 (Article Sentence Audio Controller Card), M23 (Article Timestamp Live Sync), và M24 (Vocab Highlight & Span Self-healing for Multiple Choice, Cloze, and Flashcards).
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `3b42cfa` - `fix(vocab): M24 resolve target word span and fix highlight offset bug in quiz and flashcard`
- **Tình trạng Remote:** Up-to-date with `origin/main`.
- **Trạng thái Working Tree:** **Clean 100%**.

---

### 3. Tiến độ & Trạng thái Các Module Gần Nhất
- **M21** (Commit `adf90fd` - Đã push):
  - Chuyển tên file audio và nút "Sync AI" từ trình phát audio sang cột phải dưới nút "Đổi audio" trong giao diện đọc bài báo.
- **M22** (Commit `043f66a` - Đã push):
  - Tái tạo thẻ điều khiển câu âm thanh bài báo `#art-cs-card` với giao diện đối chiếu chuẩn: thanh token từ karaoke, nút Câu trước / Câu sau, công tắc Tự dừng, và các mốc thời gian căn chỉnh.
- **M23** (Commit `be89ade` & `4faea74` - Đã push):
  - Khắc phục hiển thị và đồng bộ hóa thời gian thực (`live tick`) cho ô mốc thời gian `<< 0:00.00 >> << 0:04.96 >>` trong chế độ đọc bài báo (`isTextMode`).
- **M24** (Commit `3b42cfa` - Đã push):
  - Khắc phục lỗi highlight lệch vị trí và rách từ trong chế độ trắc nghiệm (Multiple Choice), điền từ (Cloze) và thẻ từ (Flashcard).
  - Tích hợp cơ chế tự phục hồi 4 tầng `resolveTargetWordSpan` và `checkWordMatches`, không tin tưởng mù quáng tọa độ `hs..he` cũ bị lệch.
- **Bộ kiểm thử tự động:**
  - `node --test tools/*.test.js`: **294 / 294 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
1. **Quy tắc HTML Build:** Tuyệt đối không sửa tay `index.html`. Sửa qua `src/index.src.html` và chạy `python3 tools/restructure.py build`.
2. **Ngân sách màu sắc:** Ngân sách HEX cố định ở mức 921, không thêm bất kỳ inline style màu nào trong JS hoặc HTML.
3. **Cơ chế so khớp từ vựng:** Luôn dùng `resolveTargetWordSpan` từ `js/vocab-practice.js` phối hợp với `findVariantSpan` và `FrenchMorphology` để tìm kiếm và làm nổi bật/che từ một cách an toàn.
