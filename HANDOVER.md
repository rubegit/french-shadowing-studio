# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-06T16:48:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất các module M24 (Vocab Highlight & Span Self-healing), M25 (Core SRS Upgrades), M26 (Daily New Vocab Goal Selector & Scheduler Prioritization), M27 (Acoustic Forced Alignment qua Wav2Vec2 CTC), M28 (Bộ căn chỉnh Whisper độc lập & So sánh đối đầu), M29 (Tích hợp 1-click Dual Engine Chay_Dong_Bo.command), M30 (Tái cấu trúc thư mục done/[Tên_bài]/Json & txtMp3), M31 (Tinh giản thư mục Json), M32 (Bộ chia câu tự động đa tầng & xuất JSON đa segment theo từng câu cho CTC Aligner), M33 (Audio Player Bar & Điều khiển phát câu bài báo), và M34 (Đồng bộ 100% Player Video sang Bài báo & Seamless UI).
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `029da30` - `feat(player): M33 add article audio player bar, circular translation toggle, and sentence play control`
- **Tình trạng Remote:** Up-to-date with `origin/main`.
- **Trạng thái Working Tree:** Có thay đổi của M34 đã nghiệm thu và build hoàn tất.

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
- **M34** (Đồng bộ 100% Player Video sang Bài báo & Seamless UI - Đã nghiệm thu):
  - Bê nguyên vẹn cấu trúc và CSS của `#pv-ctl` sang `#art-player-bar` (`.pc`, `.tl`, `.pc-r1`): cố định 2 hàng, ô nhập tốc độ giới hạn gọn gàng `calc(3ch - 2px)` (~75px), tuyệt đối không bao giờ rớt dòng.
  - Nút dịch tròn kích thước `41px × 41px` bo góc `11px` chuẩn theo `.cc-btn`.
  - Triển khai Seamless UI hòa trộn 3 tầng: tầng trên bo góc đỉnh `16px 16px 0 0`, tầng giữa phẳng `0`, tầng dưới bo góc đáy `0 0 16px 16px`, toàn bộ `margin-bottom: 0 !important` xóa sạch rãnh hở cam.
  - Vùng phụ đề bài báo tràn viền `width: 100%`, `max-width: none`, đệm trên `padding-top: 28px` và thanh cuộn tùy biến tiệp màu nền.
- **M35** (Đồng bộ Thẻ bài báo "Văn bản Bạn Đã Luyện" theo mẫu Thẻ đọc bài có sẵn - Đã hoàn thành):
  - Chuyển đổi toàn bộ thẻ bài báo trong hàng "Văn bản Bạn Đã Luyện" sang cấu trúc `.art-sample-row` giống hệt hàng bài mẫu bên dưới: tiêu đề in đậm (tối đa 2 dòng), huy hiệu cấp độ CEFR (`B1`, `A2`...) dạng pill mềm mại, trích dẫn ngắn 2 dòng (`snippet preview`), đường gạch nét đứt và footer thống kê số từ, số câu, trạng thái song ngữ.
  - Loại bỏ hoàn toàn hộp màu xanh thô kệch (`.txt-thumb`), dấu nháy kép `“` và việc lặp lại tiêu đề 2 lần.
  - Nút xóa thùng rác (`yt-card-remove`) được đặt gọn gàng cạnh huy hiệu cấp độ ở góc trên bên phải, xóa bài an toàn và không bị che khuất.
  - Bổ sung hộp thoại hỏi xác nhận (`confirm`) chi tiết trước khi xóa bất kỳ bài đọc/video nào để chống bấm nhầm: người dùng bấm Cancel/Hủy sẽ hủy lệnh xóa an toàn; nêu rõ tên bài và lưu ý tự động backup song ngữ nếu có.
  - Đồng bộ `artCardHTML` trong `js/01d-player.js` sang cấu trúc `.art-sample-row`.
- **M36** (Lưới bài báo đã luyện, xóa bài mẫu và thu gọn ô nhập bài báo - Đã hoàn thành):
  - Xóa bỏ hoàn toàn mục "Thử đọc bài viết có sẵn" (`#art-lib-grid`) khỏi giao diện trang chủ `partials/view-home.html`.
  - Chuyển đổi hàng "Văn bản Bạn Đã Luyện" từ thanh cuộn ngang Netflix row đơn hàng sang lưới Responsive Grid đa cột (`art-history-grid` sử dụng `.art-sample-list`), tự động dàn 1 cột trên mobile và 2–3 cột trên desktop.
  - Thu gọn mặc định khung "Nhập hoặc dán bài báo tiếng Pháp" thành một thanh accordion gọn gàng (`.txt-collapsible-card`), nhấn vào thì trượt mở form ra, tự động mở khi tải file.
  - Tự động xóa sạch nội dung trong các ô tiêu đề, textarea, file audio đính kèm và thu gọn form sau khi bấm "Bắt đầu đọc bài viết" để người dùng không phải xóa thủ công khi quay lại.
- **M37** (Khắc phục triệt để lỗi CSS thu gọn khung nhập bài báo - Đã hoàn thành):
  - Khắc phục xung đột CSS `!important`: Thiết lập rule rõ ràng `.txt-collapsible-card:not(.is-expanded) .txt-collapse-body { display: none !important; }` để ẩn triệt để 100% tất cả các ô input, textarea, nút file và nút "Bắt đầu đọc bài viết" khi ở trạng thái thu gọn.
  - Khi có class `.is-expanded`: mở form bằng `display: flex !important;` hiển thị trọn vẹn và xoay mũi tên chỉ báo.
  - Cập nhật hàm `toggleTextInputCollapse` toggle đồng bộ class `.is-expanded`, class `.hidden`, style inline và nội dung nhãn chỉ dẫn `(Bấm để thu gọn)` / `(Bấm để mở khung nhập bài)`.
- **Bộ kiểm thử tự động:**
  - 319 bài kiểm thử tự động toàn diện chạy qua `node --test tools/*.test.js` đạt 319/319 passed 100%.
  - Ngân sách mã màu giữ nguyên mức 921 mã hex, 0 inline colors, 0 Tailwind colors (`node tools/lint-color.js`).
  - Ngân sách mã màu giữ nguyên mức 921 mã hex, 0 inline colors, 0 Tailwind colors (`node tools/lint-color.js`).
  - Ngân sách mã màu giữ nguyên mức 921 mã hex, 0 inline colors, 0 Tailwind colors (`node tools/lint-color.js`).
  - `node --test tools/*.test.js`: **308 / 308 PASS (100%)**.
  - `node tools/lint-color.js`: **921 / 921 HEX**, **0 inline style**, **0 tailwind color**.

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
1. **Quy tắc HTML Build:** Tuyệt đối không sửa tay `index.html`. Sửa qua `src/index.src.html` và chạy `python3 tools/restructure.py build`.
2. **Ngân sách màu sắc:** Ngân sách HEX cố định ở mức 921, không thêm bất kỳ inline style màu nào trong JS hoặc HTML.
3. **Cơ chế so khớp từ vựng:** Luôn dùng `resolveTargetWordSpan` từ `js/vocab-practice.js` phối hợp với `findVariantSpan` và `FrenchMorphology` để tìm kiếm và làm nổi bật/che từ an toàn.
4. **Cơ chế SRS:** Tuân thủ biến thể 4 nút cải tiến với trần 365 ngày, theo dõi `relearning` và điều phối số lượng từ mới qua `prioritizeSessionItems`.
5. **Cơ chế Đồng bộ Audio Ngoại tuyến:** Thư mục `offline_aligner/` nằm trong `.gitignore`, cấu trúc phân cấp `done/[Tên_bài]/Json` và `txtMp3`, mặc định xuất JSON dạng đa segment theo từng câu (`--segment-mode sentence`).
