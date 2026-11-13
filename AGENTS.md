# Shadowing Project - Supplementary AI Assistant Guidelines

> **Quan trọng:** Tệp này chứa các quy tắc bổ sung riêng biệt cho dự án **Shadowing**. Mọi AI Assistant (Antigravity, ChatGPT/Codex...) khi làm việc trong dự án này bắt buộc phải kế thừa và tuân thủ tuyệt đối quy trình làm việc cốt lõi 4 bước, quy tắc mã nguồn và bảng từ khóa được quy định tại [../AGENTS.md](../AGENTS.md).

---

## 1. Quy tắc chỉnh sửa HTML/CSS/JS sau khi tách (Post-split Workflow)

* **Không sửa tay `index.html`:** Tệp `index.html` hiện là tệp được sinh tự động bởi công cụ build. Mọi thay đổi cấu trúc hoặc nội dung HTML bắt buộc phải thực hiện trong `src/index.src.html` hoặc các tệp tương ứng trong `partials/`.
* **Lệnh build bắt buộc:** Sau khi chỉnh sửa bất kỳ tệp HTML nào trong `src/` hoặc `partials/`, phải chạy lệnh:
  ```bash
  python3 tools/restructure.py build
  ```
  để cập nhật lại `index.html`. Luôn commit cả `index.html` lên repository để Vercel phục vụ trực tiếp mà không cần bước build server.
* **Chỉnh sửa CSS & JS:** Sửa trực tiếp trong các tệp module tương ứng tại `css/` và `js/`. Tuyệt đối giữ nguyên tính chất classic script (không tự ý đổi sang `type="module"`, không thêm `defer`/`async` làm hỏng inline event handlers và biến toàn cục).

---

## 2. Account Handover & Intake Workflow (Quy trình Bàn giao & Tiếp nhận Tài khoản)

Quy trình chuẩn hóa việc chuyển giao ca làm việc giữa các tài khoản Google / phiên làm việc trong Antigravity IDE:

### 2.1. Chuẩn bị bàn giao (Outgoing Agent - Agent A)
Khi người dùng yêu cầu chuẩn bị bàn giao (ví dụ: *"chuẩn bị bàn giao tài khoản"*, *"lập bàn giao"*...):
1. **Kiểm tra trạng thái thực tế tại chỗ:** Chạy các lệnh kiểm tra Git (`git status`, `git branch`, `git log -1`) và các lệnh kiểm thử hiện hành.
2. **Cập nhật `HANDOVER.md` qua công cụ tự động hóa:** Chạy lệnh `node tools/handover.js checkpoint --full` để thực hiện quy trình ghi nguyên tử 5 bước (Mutex Lock với PID + macOS `lstart`, kiểm tra hash SHA-256 lạc quan, sao lưu `.bak`, ghi tệp tạm trên cùng phân vùng APFS, `fsyncSync` và atomic rename, kèm xác minh toàn vẹn hậu kỳ). Tuyệt đối không sửa tay gây thiếu các đề mục bắt buộc hoặc làm mất lịch sử M24–M40.
3. **Xử lý Working Tree:**
   - Nếu working tree sạch: Ghi nhận trạng thái clean dựa trên kết quả lệnh thực tế.
   - Nếu working tree có thay đổi chưa commit (dirty): Liệt kê trung thực danh sách tệp bị thay đổi và cảnh báo người dùng. **TUYỆT ĐỐI KHÔNG tự ý commit, stash, reset hoặc xóa file.**
4. **Nguyên tắc an toàn:**
   - Tuyệt đối không tự ý `git push`.
   - Tuyệt đối không lưu mật khẩu, token, API key hay thông tin bảo mật vào tài liệu bàn giao.
   - Luôn kiểm tra context usage bằng `node tools/handover.js status` để bảo đảm hoàn tất bàn giao trước khi vượt ngưỡng 85%.

### 2.2. Tự động tiếp nhận khi mở phiên mới (Incoming Agent - Agent B)
1. **Phân định cơ chế IDE vs Hành vi Agent:** Antigravity IDE tự động nạp các tệp quy tắc chỉ dẫn (`AGENTS.md`) vào context khi mở phiên, nhưng không tự chạy ngầm lệnh shell trước khi có tương tác từ người dùng.
2. **Quy tắc tự kích hoạt:** Ngay khi nhận được tin nhắn đầu tiên của người dùng (kể cả chỉ là lời chào ngắn gọn như *"tiếp tục"*, *"chào bạn"*, *"bắt đầu"* mà không cần prompt dài):
   - Chủ động kiểm tra sự tồn tại và tính toàn vẹn của `HANDOVER.md` bằng `node tools/handover.js verify`.
   - Kiểm tra mức độ chiếm dụng context ban đầu bằng `node tools/handover.js status`.
   - Đọc kỹ `HANDOVER.md`, `AGENTS.md` và `PROJECT_STATUS.md`.
   - Chạy các lệnh xác minh trạng thái chỉ đọc (`git status`, `git log -1`, `node tools/lint-color.js`, `node --test tools/*.test.js`).
   - Lập **Báo cáo Tiếp nhận (Intake Report)** ngắn gọn (3-5 dòng) gửi tới người dùng.
   - Xuất trình Module Card cho công việc tiếp theo và **DỪNG LẠI chờ từ khóa "Đồng ý"**.
3. **Điều khoản cấm đoán:** `HANDOVER.md` chỉ là tài liệu ngữ cảnh, **KHÔNG PHẢI GIẤY PHÉP THỰC THI**. Agent B tuyệt đối không được viết code hoặc sửa đổi tệp khi chưa có từ khóa "Đồng ý" từ người dùng.
