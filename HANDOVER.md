# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-04T19:25:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao liền mạch chuỗi giải pháp Hình thái học Tiếng Pháp (French Morphology) & Căn mốc tự động an toàn (Safe Auto-alignment) qua bộ benchmark 94 ca.
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit tại thời điểm nạp:** (Sắp commit M14c)
- **Tình trạng Remote:** Ahead of `origin/main` by 7 commits:
  1. `d8ca44d` - `fix(vocab): M11.1 word boundary regex in fallback align and reset stale hs/he`
  2. `f79edc4` - `feat(morphology): M13a French Morphology Core (verbs, regular orthography, irregular roots & derivations)`
  3. `42058df` - `feat(vocab): M14a intelligent findVariantSpan highlighting & XSS safe escaping`
  4. `c7fada5` - `feat(morphology): M13b plural nouns, feminine adjectives & multi-word phrase expansion`
  5. `715279c` - `feat(vocab): M14b safe auto-align with scoring, MULTIPLE rejection & golden tests`
  6. `10efb80` - `docs: update HANDOVER.md after completing French Morphology & Safe Alignment (M11.1-M14b)`
  7. *(M14c commit)* - `feat(vocab): M14c benchmark 94 cases 100% precision, explicit elision boundary & homograph priority`
- **Trạng thái Working Tree:** **Clean 100%** (xác minh thực tế qua `git status --porcelain`).
- **Cảnh báo an toàn Git:**
  - Tuyệt đối **KHÔNG PUSH** commit cục bộ lên remote nếu người dùng chưa ra lệnh rõ ràng bằng văn bản.
  - Tuyệt đối **KHÔNG tự ý reset, checkout hay stash** làm mất commit cục bộ.

---

### 3. Tiến độ & Trạng thái Các Module (Milestone Progress)
- **Chuỗi Morphology & Safe Highlighting/Alignment hoàn thành trọn vẹn:**
  - **`M11.1`** (Commit `d8ca44d`): Regex ranh giới từ `(^|[^\p{L}'’])word(?=$|[^\p{L}'’])` giải quyết triệt để lỗi `va` khớp nhầm `cravate/carnaval`, reset toạ độ cũ `hs/he` về 0 khi sang câu mới.
  - **`M13a`** (Commit `f79edc4`): French Morphology Core cho động từ (Nhóm 1 quy tắc kèm biến đổi chính tả, Nhóm 2, Nhóm 3 với >300 động từ bất quy tắc và tiếp đầu ngữ, tra cứu ngược homograph).
  - **`M14a`** (Commit `42058df`): Tô sáng thông minh `findVariantSpan`, ưu tiên leftmost-longest match, khử nhiễu trợ động từ cực ngắn, an toàn XSS tuyệt đối.
  - **`M13b`** (Commit `c7fada5`): Mở rộng hình thái học cho Danh từ số nhiều, Tính từ 4 dạng giống/số, và Cụm từ nhiều chữ.
  - **`M14b`** (Commit `715279c`): Chấm điểm câu `scoreSentenceForVocab`, từ chối gán nhầm (`MULTIPLE` tie rejection), hoàn tác an toàn `undoAutoAlignVocabTimestamps()`.
  - **`M14c`** (Đang nghiệm thu):
    - Khắc phục triệt để rủi ro gán sai (`WRONG_ASSIGNMENT = 0` trên 94 ca benchmark, Precision lần gán đạt 100% = 66/66).
    - Ranh giới lược âm hai nhánh tường minh `(?<=(?:^|[^\p{L}'’])(?:c|d|j|l|m|n|s|t|qu|jusqu|lorsqu|puisqu|quoiqu)['’])` chặn nuốt nhầm từ giả (`quelqu'un`, `aujourd'hui`) và khớp đúng (`m'évite`, `jusqu'à`).
    - Bảng `HOMOGRAPH_PRIORITY = { 'suis': 'être' }` chặn `suivre` gán nhầm câu; luật `saved-form-priority` ưu tiên dạng lưu chính xác (`deviennent`, `froid`, `rouge`) thắng mở rộng lemma.
    - Span phản thân chuẩn hóa chỉ lấy động từ nòng cốt (`rend`, `abonner à`), bỏ đại từ.
    - Bổ sung họ động từ `-cevoir`, `suffire`, bóc tách mạo từ danh từ (`un/une/le/la/l'`), giữ dạng ngắn trong cụm từ ghép (`ai mal à`).
- **Bộ kiểm thử tự động:**
  - `node tools/run-benchmark-94.js`: **94 / 94 ĐẠT (100.00%)**, **66 gán đúng**, **0 gán sai**, **28 từ chối đúng**.
  - `node --test tools/*.test.js`: **249 / 249 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
- **Zero-Bundler & Classic Scripts:** Toàn bộ JavaScript nạp qua `<script src="...">` không dùng `type="module"`, không thêm `defer`/`async`.
- **Ràng buộc âm thanh bài báo:** Chỉ cho phép tải lên duy nhất tệp định dạng `.mp3`, không hỗ trợ định dạng khác.
- **Quy tắc sửa HTML (Post-Split):** Không sửa trực tiếp `index.html`. Mọi sửa đổi phải thực hiện trong `src/index.src.html` hoặc `partials/`, sau đó chạy `python3 tools/restructure.py build` để đồng bộ lại `index.html`.
- **Quy tắc Mã màu Semantic:** Khởi động mặc định luôn là Light Mode (`data-ui="light"`). Bắt buộc dùng CSS variable semantic tokens (`--fs-*`). Tuyệt đối không thêm mã HEX cứng hay inline style màu mới.
- **Bảo mật tuyệt đối:** Không lưu thông tin đăng nhập, mật khẩu, token, API key hay dữ liệu nhạy cảm trong bất kỳ tệp tài liệu nào.
