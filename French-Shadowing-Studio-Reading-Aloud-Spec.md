# Đọc báo: nghe từ, nghe câu, nghe cả bài (đặc tả tính năng + giao diện)

Mockup: https://claude.ai/artifact/WFwmbhGknN9dpFLFPKBP5g, các board **"Đọc báo: nạp bài, lịch sử, bài mẫu"**, **"Đọc báo: phòng đọc"** và **"Đọc báo: nghe từ, câu, cả bài"** (bản sáng cột trái, bản tối cột phải).

> **Đây là TÍNH NĂNG MỚI (có đổi logic JS), khác với việc làm lại giao diện.** Làm ở **nhánh riêng, sau khi** đã tách file và làm xong giao diện Đọc báo. Không trộn hai việc trong một lượt. Quy tắc "không đổi JS" của việc redesign **không áp dụng** cho tài liệu này, nhưng vẫn cấm sửa logic cũ (tra từ, SRS, đồng bộ Cloud).

Bỏ qua RSS (đã loại khỏi phạm vi).

---

## 1. Ba chế độ nghe

| Chế độ | Hành vi |
|---|---|
| **Nghe phần chọn** (từ hoặc cụm từ) | Bôi đen chữ trong bài → hiện thanh nổi **[Nghe] [Tra từ] [Lưu từ]**. Bấm Nghe (hoặc phím R) đọc đúng phần đã chọn. Giữ nguyên hành vi hiện có: bấm một từ thì phát âm từ đó. |
| **Nghe từng câu** | Đọc **một câu rồi dừng**. Bấm vào câu để đọc câu đó; → sang câu sau; ← câu trước; R hoặc Space đọc lại. Hợp cho shadowing: có tuỳ chọn nghỉ giữa các câu để người học nhắc lại. |
| **Nghe cả bài** | Nút **"Nghe cả bài"** trên thanh công cụ. Đọc **liên tục** từ câu đang chọn (hoặc câu đầu) đến hết bài, tô sáng câu đang đọc và tự cuộn theo. Có Tạm dừng, Tiếp tục, Dừng, Câu trước/sau. |

Chuyển chế độ không cần nút riêng: **chế độ được suy ra từ thao tác** (bôi đen = phần chọn; bấm câu = từng câu; bấm "Nghe cả bài" = cả bài). Trong thanh trình phát có công tắc "Dừng sau mỗi câu" để chuyển giữa liên tục và từng câu.

## 2. Giao diện (xem mockup)

### 2.1 Phòng đọc (`#screen-practice` ở `body.text-mode`)
```
THANH TRÊN (cố định): [← Đọc báo] | tiêu đề bài (flex:1) | [Nghe cả bài] | [Song ngữ] | [Aa]
+-------------------------------------------+------------------------+
| CỘT ĐỌC (max 720px, căn giữa)             | THẺ THÔNG TIN 340px    |
|  chip tên báo · N từ · m phút đọc         |  (dính, sticky top 16) |
|  H1 tiêu đề (Literata 30px)               |  Bài viết, tên báo,    |
|  [ảnh minh họa 16:9 nếu có]               |  tự động lưu lịch sử,  |
|  khối câu .sb (mỗi câu một khối):         |  N từ · N câu · phút   |
|    câu Pháp 19px/1.75                     |  Sao chép bài          |
|    dòng dịch Việt 15px muted (nếu bật)    |  Dịch song ngữ         |
|  ...                                      |  Từ vựng quan trọng    |
|  [THANH TRÌNH PHÁT dính đáy cột đọc]      |  + Cài đặt nghe        |
+-------------------------------------------+------------------------+
```
- Thẻ thông tin chính là `#article-side-panel` đang bị ẩn do nằm trong `#panel-left`: cần **chuyển node** sang khung chứa cạnh cột đọc (xem `Layout-Spec`/báo cáo Đọc báo). Dưới 900px thẻ chuyển thành khối gập phía trên bài; thanh trình phát chuyển thành thanh dưới màn hình.
- Cột đọc 720px (khoảng 60–80 ký tự mỗi dòng) thay cho 960px hiện tại.

### 2.2 Trạng thái câu trong bài
| Trạng thái | Style |
|---|---|
| Chưa đọc | Chữ `--fs-ink` |
| **Đang đọc** | Nền `--fs-tint`, **viền trái 4px** `--fs-accent-text` (có cả hình dạng, không chỉ màu), tự cuộn vào giữa |
| Đã đọc | Chữ `--fs-muted` |
| Từ đang phát (nếu có sự kiện boundary) | `.hl` (nền primary) |
| Phần được bôi đen | Nền vàng nhạt (`--g2b/--g2t`) |
| Từ đã lưu | Gạch chân chấm (`.ul`) |

### 2.3 Thanh trình phát (mini player)
Một hàng: **[Câu trước] [Phát/Tạm dừng] [Câu sau] [Dừng]** · "Câu n / N" · thanh tiến độ · chip tốc độ (1.0x) · chip Giọng · chip "Tự cuộn". Nút tròn 44px, nút Phát/Tạm dừng nền primary. Biểu tượng vẽ bằng SVG, có `aria-label`.
Trạng thái: **Sẵn sàng** (hiện số câu và thời lượng ước tính), **Đang đọc**, **Tạm dừng**, **Đang tải âm thanh** (giọng dự phòng), **Lỗi hoặc không có giọng Pháp** (khung lỗi kèm chữ, tự chuyển giọng dự phòng).

### 2.4 Cài đặt nghe (trong thẻ thông tin, hoặc popover từ chip)
Giọng (danh sách giọng `fr-*` của trình duyệt), tốc độ (0.75x / 0.9x / 1.0x / 1.15x), **nghỉ giữa các câu** (0s / 0.5s / 1s), Tự cuộn theo câu đang đọc, Lặp lại câu hiện tại. Lưu tuỳ chọn bằng **một key localStorage mới** (đề xuất `fss_read_prefs`), không đụng key cũ.

### 2.5 Phím tắt (chỉ khi con trỏ không nằm trong ô nhập)
Space phát/tạm dừng · ← → câu trước/sau · R đọc lại câu hoặc phần chọn · Esc dừng. **Space đang được dùng cho "phát âm"** ở màn này; AI phải đọc code hiện có và chọn cách gộp, không làm hai hành vi cùng chạy.

### 2.6 Trang nạp bài và bài mẫu (cập nhật theo mockup)
- 6 thẻ báo: ô logo 44×44 **màu thương hiệu riêng** (RFI đỏ, Le Monde đen, France 24 xanh dương, Le Figaro xanh navy, TV5Monde tím, Courrier International cam; chữ trắng, màu cố định) + tên + mô tả + "Mở trang gốc".
- Khung nhập: ô tiêu đề (bỏ trống thì lấy dòng đầu), textarea, bộ đếm từ, Tải file (.txt .docx .md .html), Xóa trắng, Bắt đầu đọc bài viết.
- **Hàng "Bài đã đọc gần đây"** (`#text-history-container`): thẻ cuộn ngang có tiêu đề, nguồn, số từ, thanh tiến độ.
- **Lưới "Thử đọc bài viết có sẵn"** (`#art-lib-grid`): thẻ có ảnh bìa, chip cấp độ, tiêu đề, tóm tắt hai dòng, số từ và số phút; nút "Xem thêm".

## 3. Thiết kế kỹ thuật

Mở rộng `window.playFrenchAudio` (trong `js/01-core.js`), **không thay thế**; giữ chữ ký hàm cũ để mọi chỗ gọi hiện có không hỏng. Đề xuất module mới `js/read-aloud.js`, nạp sau `01-core.js` và các file câu (`01d-player.js`, `01e-translate-ai.js`).

### 3.1 Máy trạng thái
`idle → playing → paused → playing → idle`; thêm `loading` (đang tải TTS dự phòng) và `error`. Chỉ **một** nguồn phát tại một thời điểm: bắt đầu nguồn mới (bấm câu khác, bôi đen và bấm Nghe, Nghe cả bài) phải **dừng nguồn cũ** (`speechSynthesis.cancel()` và dừng `Audio`).

### 3.2 Hàng đợi theo câu
- Mảng `sentences` hiện có là nguồn dữ liệu. Nghe cả bài = duyệt `i` từ `startIndex`, mỗi câu **một** `SpeechSynthesisUtterance` (`lang='fr-FR'`).
- Câu rất dài (> ~200 ký tự) tách thêm tại dấu phẩy hoặc chấm phẩy. Lý do: Chrome có lỗi dừng giữa chừng với đoạn đọc dài, và TTS dự phòng giới hạn độ dài.
- Chuyển câu trong `onend` của câu trước, có `setTimeout` theo cài đặt "nghỉ giữa các câu". Kiểm tra token phiên (`sessionId`) để các callback cũ không phát tiếp sau khi đã dừng.
- `onerror` với `interrupted`/`canceled` là bình thường khi người dùng chuyển câu: **không** coi là lỗi.

### 3.3 Tạm dừng và tiếp tục
`speechSynthesis.pause()/resume()` không ổn định trên Android Chrome và một số trình duyệt. Cách an toàn: **Tạm dừng = `cancel()` + nhớ chỉ số câu**, Tiếp tục = đọc lại **từ đầu câu đó**.

### 3.4 Phần chọn
Lắng nghe `selectionchange`/`mouseup`/`touchend` trong vùng `.sb`; lấy `window.getSelection().toString()`, bỏ khoảng trắng thừa, giới hạn ~200 ký tự (dài hơn thì đề nghị "Nghe câu"). Hiện thanh nổi **bên trên** vùng chọn (kiểm tra `getBoundingClientRect` để không tràn mép), ẩn khi nhấn ra ngoài. Giữ nguyên popup tra từ Larousse hiện có, thanh nổi chỉ thêm nút Nghe.

### 3.5 Tô sáng từ đang đọc (tuỳ chọn, mức 2)
`utterance.onboundary` (charIndex) chỉ có trên một số giọng (thường Safari/Edge và giọng cục bộ; **giọng "Google Français" trên Chrome thường không phát sự kiện này**). Làm mức 1 (tô sáng câu) trước; mức 2 chỉ bật khi nhận được sự kiện boundary, nếu không thì bỏ qua âm thầm.

### 3.6 Giọng dự phòng
Luồng `Audio` của Google Translate TTS hiện có là điểm yếu: endpoint không chính thức, có thể đổi hoặc chặn, giới hạn ~200 ký tự mỗi lần. Coi là **dự phòng tạm thời**, hiển thị trạng thái "Đang tải..." và thông báo lỗi rõ ràng. Nếu muốn ổn định lâu dài, cân nhắc nguồn TTS có điều khoản rõ ràng (cần quyết định riêng).

### 3.7 iOS và trình duyệt di động
`speechSynthesis` phải được **bắt đầu từ thao tác của người dùng** (đã có cơ chế pre-warm audio; tận dụng). Khi tab bị ẩn hoặc màn hình khoá, iOS ngừng đọc: lưu vị trí câu và hiện nút tiếp tục khi quay lại. Danh sách giọng nạp **bất đồng bộ** (`voiceschanged`): nạp lại và chọn lại giọng đã lưu.

### 3.8 Dọn dẹp
Rời màn đọc, đổi bài, đóng modal, chuyển tab chính: gọi `stop()` và gỡ mọi listener (`selectionchange`, phím tắt) để không rò rỉ hoặc phát tiếng nền.

## 4. Trợ năng
- Nút có `aria-label`; trạng thái phát công bố bằng `aria-live="polite"` **chỉ** khi đổi trạng thái (không đọc từng câu, tránh xung đột với giọng đọc).
- Trạng thái "đang đọc" có viền trái + nền, không chỉ màu. Mục tiêu bấm ≥ 44px.
- `prefers-reduced-motion`: tắt cuộn mượt và hiệu ứng tô sáng chuyển tiếp.

## 5. Trường hợp biên cần kiểm thử
1. Bài rất dài (nghìn câu): bắt đầu nhanh, không dựng hàng đợi cho cả bài một lần (nạp theo cửa sổ vài câu).
2. Câu có chữ viết tắt, số, ký hiệu (`M.`, `3,5`, `%`, `€`): đọc có tự nhiên không.
3. Bấm câu khác khi đang đọc cả bài; bôi đen khi đang đọc; bấm Nghe liên tiếp nhanh.
4. Tạm dừng rồi đổi tốc độ hoặc giọng, rồi Tiếp tục.
5. Không có giọng Pháp; danh sách giọng nạp chậm; mất mạng khi dùng giọng dự phòng.
6. Bật song ngữ: **chỉ đọc tiếng Pháp**, không đọc dòng dịch Việt.
7. iOS Safari và Android Chrome: bắt đầu, khoá màn hình, quay lại.
8. Chuyển bài, quay lại bài cũ (`textDocHash`): vị trí nghe có khôi phục không (tuỳ chọn, không bắt buộc).
9. Không làm hỏng tra từ, lưu từ, SRS, đồng bộ Cloud.

## 6. Thứ tự làm đề xuất
1. **Giao diện Đọc báo** (chuyển `#article-side-panel`, cột đọc 720, hàng lịch sử, lưới bài mẫu) theo mockup.
2. **Mức 1 của tính năng nghe:** Nghe câu và Nghe phần chọn (ít rủi ro nhất).
3. **Nghe cả bài** với hàng đợi theo câu, thanh trình phát, tạm dừng bằng cancel.
4. Cài đặt nghe (giọng, tốc độ, nghỉ giữa câu, tự cuộn, lặp câu) và lưu tuỳ chọn.
5. Mức 2: tô sáng từ đang đọc; sau đó cân nhắc dùng chung cho Đọc sách.

## 7. Prompt mẫu cho AI (theo quy trình Listen → Plan → Review → Execute)

```
NHIỆM VỤ: Thêm tính năng NGHE vào màn Đọc báo theo file Reading-Aloud-Spec.md và mockup (board "Đọc báo: nghe từ, câu, cả bài"). Đây là tính năng mới, làm trên nhánh feature/read-aloud, tách khỏi việc redesign.

RÀNG BUỘC: Không đổi logic cũ (tra từ Larousse, lưu từ, SRS, Supabase sync, luyện tập, TCF). Mở rộng window.playFrenchAudio, KHÔNG đổi chữ ký. Không sửa file ngoài phạm vi sau khi tôi duyệt kế hoạch. Báo nguyên văn kết quả lệnh.

LISTEN: Đọc js/01-core.js (playFrenchAudio, giọng Pháp, pre-warm iOS), js/01d-player.js (enterTextShadowing, openTextSession, splitProseIntoSentences), js/01e-translate-ai.js (render .sentence-text-line, click/hover từ), và nơi xử lý phím Space/click từ ở màn text-mode. Liệt kê: mọi handler đang gắn phím Space/Arrow; chỗ render câu (selector); cách chọn giọng; nơi lưu tuỳ chọn.
PLAN: Đề xuất (a) file js/read-aloud.js và thứ tự nạp, (b) hàm công khai (start, pause, resume, stop, next, prev, speakSelection), (c) cách gộp phím tắt không xung đột, (d) chỗ gắn thanh trình phát và thanh nổi, (e) key localStorage mới. Chỉ rõ rủi ro iOS và Chrome.
REVIEW: Dừng chờ tôi duyệt.
EXECUTE (theo thứ tự mục 6 của spec, từng mức một, sau mỗi mức dừng để tôi kiểm thử):
 Mức 1: Nghe phần chọn + Nghe từng câu.
 Mức 2: Nghe cả bài + thanh trình phát.
 Mức 3: Cài đặt nghe + lưu tuỳ chọn.
Mỗi mức: liệt kê file và hàm đã thêm/đổi, chạy `node --check`, và checklist kiểm thử tôi cần tự làm.
```
