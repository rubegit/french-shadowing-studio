---
name: fss-handover
description: >-
  Chuẩn bị bàn giao hoặc tự động tiếp nhận dự án French Shadowing Studio (FSS) giữa các tài khoản Google hoặc các phiên làm việc trong Antigravity. Kích hoạt khi người dùng gõ /fss-handover, /handover, hoặc các câu lệnh tự nhiên: "chuẩn bị bàn giao", "bàn giao dự án", "bàn giao tài khoản", "tiếp nhận dự án", "tiếp tục dự án từ phiên trước". Hỗ trợ 2 chế độ: Prep (Bàn giao - cập nhật HANDOVER.md) và Intake (Tiếp nhận - xác minh Git, lập Intake Report, đề xuất Module Card và chờ "Đồng ý").
---

# FSS Handover Skill (`/fss-handover`)

Skill hỗ trợ chuyển giao ca làm việc liền mạch giữa các tài khoản Google / phiên làm việc trong Antigravity IDE cho dự án French Shadowing Studio (FSS).

> **ĐIỀU KHOẢN AN TOÀN BẮT BUỘC (MANDATORY SAFETY RULES):**
> 1. [`AGENTS.md`](../../../AGENTS.md) là tài liệu có thẩm quyền cao nhất quy định hành vi của AI Assistant. Skill này kế thừa toàn bộ Mục 7 của `AGENTS.md` và không có quyền vượt qua quy trình 4 bước.
> 2. Skill này **CHỈ LÀ CÔNG CỤ ĐIỀU PHỐI TRẠNG THÁI (ORCHESTRATOR)**, tuyệt đối **KHÔNG CẤP QUYỀN VIẾT HAY SỬA ĐỔI SOURCE CODE**.
> 3. [`HANDOVER.md`](../../../HANDOVER.md) chỉ là tài liệu ngữ cảnh, **KHÔNG PHẢI GIẤY PHÉP THỰC THI**. Agent tiếp nhận bắt buộc phải chờ người dùng phê duyệt bằng chính xác từ khóa **"Đồng ý"** trước khi sửa code.
> 4. Không được giả định lịch sử hội thoại của tài khoản cũ là dữ liệu có thể truy cập; toàn bộ ngữ cảnh bàn giao phải dựa trên các tệp tài liệu trong workspace và kết quả lệnh thực tế.
> 5. Tuyệt đối **KHÔNG tự ý push** lên remote và không thay đổi Git history.

---

## 0. Quy tắc Xử lý Tham số & Phân định Chế độ (Mode Dispatcher)

Khi người dùng kích hoạt lệnh `/fss-handover`:

* **Trường hợp KHÔNG chỉ định rõ chế độ** (chỉ gõ `/fss-handover`, `/handover` hoặc câu nói chung chung):
  - **TUYỆT ĐỐI KHÔNG** tự động chạy chế độ Prep.
  - **TUYỆT ĐỐI KHÔNG** tự ý ghi hoặc sửa đổi bất kỳ tệp tin nào trên đĩa.
  - Phản hồi ngay và hỏi người dùng để xác nhận:
    *"Bạn muốn thực hiện chế độ nào: **1. Prep (Chuẩn bị bàn giao dự án)** hay **2. Intake (Tiếp nhận dự án từ phiên trước)**?"*
  - Chỉ tiến hành thực hiện sau khi người dùng xác định rõ chế độ mong muốn.
* **Trường hợp ĐÃ CHỈ ĐỊNH RÕ chế độ** (ví dụ: `/fss-handover prep`, *"chuẩn bị bàn giao"* $\rightarrow$ Chế độ A; `/fss-handover intake`, *"tiếp nhận dự án"* $\rightarrow$ Chế độ B): Thực hiện ngay quy trình tương ứng dưới đây.

---

## Chế độ A: Prep — Chuẩn bị Bàn giao (Outgoing Agent - Agent A)

*Chỉ thực hiện ghi tệp khi người dùng thực sự yêu cầu thực hiện Prep.*

1. **Đọc và đối chiếu tài liệu hiện hành:**
   - Đọc toàn bộ [`HANDOVER.md`](../../../HANDOVER.md) hiện tại.
   - Đối chiếu với [`AGENTS.md`](../../../AGENTS.md) Mục 7.1 và [`PROJECT_STATUS.md`](../../../PROJECT_STATUS.md).
   - **Bảo toàn thông tin:** Giữ nguyên cấu trúc các phần, các quyết định kỹ thuật đã phê duyệt, lịch sử các module đã nghiệm thu và mọi thông tin còn hiệu lực.
   - Không tự ý xóa các nội dung quan trọng; nếu có thông tin chưa rõ hiệu lực, giữ lại và đánh dấu rõ là *"Cần xác minh"*.
2. **Kiểm tra trạng thái Git thực tế tại chỗ:**
   - Chạy: `git branch --show-current`
   - Chạy: `git log -1 --pretty=format:"%h %s (%cd)"`
   - Chạy: `git status -sb`
   - Chạy: `git status --porcelain`
3. **Chạy kiểm tra chất lượng thực tế tại chỗ & Xử lý trạng thái kiểm tra:**
   - Chạy: `node tools/lint-color.js`
   - Chạy: `node --test tools/*.test.js`
   - **Xử lý trạng thái lệnh kiểm tra:**
     - Phân định rõ 4 trạng thái kiểm tra cho từng lệnh:
       + `PASS`: Lệnh chạy hoàn tất và đạt yêu cầu.
       + `FAIL`: Lệnh chạy nhưng phát hiện lỗi hoặc trả về mã lỗi (exit code khác 0).
       + `NOT RUN`: Lệnh chưa được thực hiện.
       + `INCOMPLETE`: Lệnh đã chạy nhưng không hoàn tất hoặc bị gián đoạn.
     - Khi cập nhật [`HANDOVER.md`](../../../HANDOVER.md), bắt buộc phải ghi rõ trạng thái của từng lệnh kiểm tra (`PASS`, `FAIL`, `NOT RUN` hoặc `INCOMPLETE`):
       + Với `FAIL`: Ghi rõ tên lệnh, exit code (nếu xác định được) và thông tin lỗi.
       + Với `NOT RUN`: Ghi rõ lệnh chưa được thực hiện.
       + Với `INCOMPLETE`: Ghi rõ lệnh không hoàn tất hoặc bị gián đoạn cùng nguyên nhân (nếu xác định được).
     - Tuyệt đối **KHÔNG được bỏ qua** bất kỳ lệnh kiểm tra nào có trạng thái khác `PASS` trong báo cáo bàn giao.
     - Tuyệt đối **KHÔNG tự suy diễn kết quả PASS** khi lệnh chưa chạy, bị lỗi hoặc không hoàn tất.
     - Tuyệt đối **KHÔNG tuyên bố toàn bộ kiểm tra thành công** nếu có bất kỳ trạng thái nào khác `PASS` (`FAIL`, `NOT RUN` hoặc `INCOMPLETE`).
4. **Cập nhật `HANDOVER.md` bằng công cụ tự động hóa:**
   - Chạy lệnh: `node tools/handover.js checkpoint --full`
   - Lệnh này tự động thực hiện quy trình ghi nguyên tử 5 bước:
     + Chiếm khóa Mutex `HANDOVER.md.lock` (kiểm tra PID và macOS `lstart`, chống PID reuse).
     + Kiểm tra mã băm SHA-256 lạc quan.
     + Tạo bản sao lưu dự phòng an toàn `HANDOVER.md.bak`.
     + Ghi tệp tạm thời trên cùng phân vùng APFS và ép ghi `fsyncSync`.
     + Đổi tên nguyên tử (`atomic rename`) và chạy xác minh tính toàn vẹn hậu kỳ (Post-write Verification).
   - **Xử lý Working Tree:**
     - Nếu working tree sạch: Ghi nhận trạng thái clean dựa trên kết quả lệnh thực tế.
     - Nếu có thay đổi chưa commit (dirty): Liệt kê trung thực danh sách tệp bị thay đổi và cảnh báo người dùng.
5. **Nguyên tắc an toàn bắt buộc:**
   - **TUYỆT ĐỐI KHÔNG** tự ý `git commit`, `git stash`, `git reset` hoặc xóa file trong quá trình chuẩn bị bàn giao.
   - **TUYỆT ĐỐI KHÔNG** chạy `git push`.
   - Không lưu mật khẩu, token, API key hay dữ liệu bảo mật vào tài liệu.
6. **Báo cáo hoàn tất:** Tóm tắt ngắn gọn trạng thái đã cập nhật trong `HANDOVER.md` cho người dùng.

---

## Chế độ B: Intake — Tiếp nhận Dự án (Incoming Agent - Agent B)

1. **Đọc tài liệu ngữ cảnh bắt buộc:**
   - Đọc [`HANDOVER.md`](../../../HANDOVER.md) để nắm trọn vẹn snapshot phiên trước.
   - Đọc [`AGENTS.md`](../../../AGENTS.md) Mục 7.2.
   - Đọc [`PROJECT_STATUS.md`](../../../PROJECT_STATUS.md) và [`PROJECT_STRUCTURE.md`](../../../PROJECT_STRUCTURE.md).
2. **Xác minh trạng thái thực tế bằng các lệnh chỉ đọc:**
   - Chạy: `node tools/handover.js verify` (xác minh tính toàn vẹn của file bàn giao, kiểm tra kích thước, mã băm và các section bắt buộc).
   - Chạy: `node tools/handover.js status` (kiểm tra context telemetry thực tế, đo lường mức độ sử dụng context ban đầu).
   - Chạy: `git branch --show-current` (xác định chính xác branch hiện tại).
   - Chạy: `git status --porcelain` (kiểm tra trạng thái working tree dạng máy đọc được).
   - Chạy: `git log -1 --oneline`
   - Chạy: `node tools/lint-color.js`
   - Chạy: `node --test tools/*.test.js`
3. **Đối chiếu thực tế với `HANDOVER.md`:**
   - So khớp commit HEAD và branch thực tế với snapshot trong `HANDOVER.md`.
   - Đối chiếu danh sách tệp từ `git status --porcelain` với mục working tree trong `HANDOVER.md`. Nếu phát hiện khác biệt, phải báo cáo trung thực trạng thái Git thực tế hiện tại, tuyệt đối không mặc nhiên tin vào snapshot cũ.
4. **Xuất trình Báo cáo Tiếp nhận (Intake Report) ngắn gọn (3–5 dòng):**
   - Xác nhận đã đọc tài liệu bàn giao.
   - Báo cáo branch, commit HEAD hiện tại và tình trạng working tree (kèm danh sách tệp tồn đọng nếu có).
   - Báo cáo kết quả kiểm thử thực tế và module vừa hoàn thành.
5. **Đề xuất Module Card cho công việc tiếp theo:**
   - Xuất trình Module Card đầy đủ (Files, DoD, Verify command).
   - **DỪNG LẠI và chờ người dùng phê duyệt bằng chính xác từ khóa "Đồng ý"**.
   - Tuyệt đối không tự ý viết code hay sửa tệp trước khi có xác nhận.
