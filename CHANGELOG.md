# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án French Shadowing Studio sẽ được ghi nhận tại tệp này.

---

## [v2.0.0] - 2026-11-02 (Giai đoạn 1)

### Điểm mới & Nâng cấp chính

- **Kiến trúc dữ liệu 3 lớp & Định danh bất biến:**
  - Nâng cấp cấu trúc dữ liệu lên Schema V0.2 với `item_id` bất biến (dạng `type:norm_key`).
  - Phân tách 3 lớp dữ liệu rõ ràng: mục từ cốt lõi (Core Vocab Item), các ngữ cảnh xuất hiện theo nguồn (Contexts / Occurrences), và tiến độ ôn tập (SRS & Skills).
  - Khắc phục triệt để hiện tượng trùng lặp thẻ từ giữa các video/nguồn học khác nhau.

- **Một cổng nhập liệu duy nhất & Prompt trích xuất khuôn mẫu v3:**
  - Quy tụ toàn bộ luồng nạp từ vựng vào một Modal Import duy nhất với 4 chế độ: Xem trước (Dry-run), Thêm nguồn (`ADD_SOURCE`), Thay thế (`REPLACE_ALL`), và Khôi phục sao lưu phẳng (`RESTORE_FLAT`).
  - Hỗ trợ nạp hàng loạt nhiều tệp `.txt` (định dạng 2A) và `.json` (định dạng 2B) cùng lúc.
  - Tự động điền dữ liệu an toàn vào Prompt khuôn mẫu v3 kèm thuật toán căn chỉnh phụ đề thời gian thực theo video đang mở.

- **Bộ tiện ích ngôn ngữ tiếng Pháp (`french-utils.js`) & Kiểm thử toàn diện:**
  - Xây dựng bộ quy tắc mạo từ (xác định, bất định, bộ phận), quy tắc lược âm (*élision*), rút gọn giới từ (*contraction*), số nhiều (*pluralisation*), và chuẩn hóa dấu câu tiếng Pháp.
  - Hàm điền khung đục lỗ tự động `fillFrame` hỗ trợ kiểm soát mạo từ và giống của danh từ.
  - Thiết lập bộ 128 ca kiểm thử đơn vị tự động chạy trong môi trường Node.js không phụ thuộc trình duyệt ngoài.

- **Chế độ Luyện Dịch Việt → Pháp (`translate`):**
  - Luyện dịch câu phản xạ xuôi dựa trên ví dụ song ngữ của thẻ từ.
  - Chấm điểm thông minh qua `normalizeTranslateAnswer` (chuẩn hóa nháy cong/thẳng, dấu phụ, dấu câu kết thúc) và hiển thị phân tích khác biệt từ (`computeWordDiff`).
  - Thuật toán SM-2 độc lập cập nhật vào `skills.translate`, bảo toàn 100% `item.srs`.
  - Phím tắt Enter chuỗi 2 bước, gợi ý đa tầng (đếm từ, gạch chữ cái đầu, câu mẫu), và nút "Báo đáp án này cũng đúng" lưu vào `extra_accepted`.

- **Chế độ Luyện Sắp xếp câu (`reorder`):**
  - Tokenizer tách câu tiếng Pháp thành 3–15 thẻ từ có mã định danh riêng, viết thường chữ cái đầu (trừ tên riêng) để chống lộ từ đầu.
  - Giao diện thân thiện di động với thao tác chạm chip từ, hỗ trợ phím số 1–9 trên desktop và phím Backspace để lùi từ.
  - Chấm điểm bằng cách ghép chuỗi (tự nhiên chấp nhận hoán vị của các từ đồng dạng) và tô màu trực quan vị trí đúng/sai.
  - Thuật toán SM-2 độc lập cập nhật vào `skills.reorder` (bảo toàn 100% `item.srs`).

- **Sandwich Menu Hub linh hoạt (Single Source of Truth):**
  - Thay thế thanh tab cố định bằng menu Sandwich gọn gàng, tự động sinh từ đối tượng cấu hình `MODE_METADATA` cho đủ 6 chế độ luyện tập.
  - Bộ điều khiển cỡ chữ A− / A+ linh hoạt 4 mức (Nhỏ, Vừa, Lớn, Rất lớn) lưu trạng thái vào `localStorage`.

- **Kiểm soát Đồng bộ Đám mây & Đăng xuất an toàn:**
  - Bổ sung huy hiệu trạng thái Cloud Sync trên màn hình xem trước Import (nhận biết đã đăng nhập hay chỉ lưu cục bộ).
  - Tùy chọn "Chỉ lưu cục bộ (chưa đẩy lên cloud)" cho phép kiểm tra nạp dữ liệu ngoại tuyến mà không gọi `pushAll`.
  - Cấu hình an toàn `REQUIRE_BACKUP_BEFORE_REPLACE = false` trong giai đoạn phát triển.
  - Tích hợp bản vá đăng xuất toàn cầu (Global Signout Hotfix): thu hồi phiên làm việc trên server và hủy các bộ hẹn giờ đồng bộ ngầm.

---

### Chưa có / Để sau (Kế hoạch các giai đoạn tiếp theo)

- **M43-A:** Sinh thẻ tombstone khi người dùng chọn chế độ Thay thế (`REPLACE_ALL`).
- **M43-E:** Hộp thoại/nhóm xác nhận hồi sinh các mục từ đã bị xóa trước đó khi nạp nguồn mới.
- **Cơ chế Leech:** Tự động phát hiện và đình chỉ/gắn nhãn các thẻ nhớ sai quá N lần liên tiếp.
- **Phiên học trộn (Mixed Session):** Chế độ ôn tập hỗn hợp đan xen các dạng câu hỏi (trắc nghiệm, điền từ, dịch, sắp xếp) trong cùng một lượt.
- **Giới hạn mục mới mỗi ngày (Daily New Limit):** Cài đặt số lượng thẻ mới tối đa được nạp vào học mỗi ngày.
- **SRS cho Dictation & Shadowing:** Tích hợp theo dõi tiến độ lặp lại ngắt quãng cho các câu luyện trong trình phát video.
- **Màn hình Enrich:** Công cụ hỗ trợ AI tự động bổ sung hàng loạt khung câu (`frame`), vị trí thay thế (`slot`), giống từ (`gender`) cho kho từ vựng.
- **Các dạng bài luyện tiếp theo:**
  - Dạng C: Thay từ vào khung mẫu (Slot substitution).
  - Dạng G: Đóng vai đối thoại theo ngữ cảnh (Roleplay).
  - Dạng H: Biến đổi câu và chia thì/ngôi động từ (Conjugation / Transformation).
  - Dạng I: Tìm và sửa lỗi sai trong câu (Spot the mistake).
- **Kiểm thử thực tế Mobile 380px:** Rà soát thao tác thực tế trên bàn phím ảo của các thiết bị màn hình nhỏ.
