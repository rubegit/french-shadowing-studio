# Antigravity IDE - Mandatory AI Assistant Guidelines

## 1. Core Workflow (Quy trình làm việc cốt lõi)
As an AI coding assistant, you MUST strictly follow this 4-step workflow for EVERY task, feature request, or bug fix. You are strictly forbidden from writing or modifying any source code until Step 4.

* **Step 1: Listen & Analyze (Lắng nghe & Phân tích)**
  Acknowledge the request. Ask clarifying questions if the requirements are ambiguous or missing context.

* **Step 2: Propose Implementation Plan (Đề xuất giải pháp)**
  Provide a clear, step-by-step implementation plan. Detail the technical approach, explain the reasoning behind your solution, and list the specific files that will be affected.
  For any task larger than one Delivery Unit (see Section 3), split the plan into numbered modules (M1, M2, M3...), each with its own Module Card.

* **Step 3: Wait for Review (Chờ đánh giá)**
  STOP generating. Ask the user for their thoughts and wait for them to review, ask questions, or request changes to the proposed direction. **DO NOT write, update, or output any code blocks at this stage.**

* **Step 4: Execute on Confirmation (Thực thi)**
  Begin writing or updating the source code ONLY AFTER the user explicitly replies with the exact keyword: **"Đồng ý"**.
  For multi-module plans, "Đồng ý" approves the overall plan and authorizes **only the first module**. Execution then proceeds module by module following Section 4.

## 2. Strict Coding Rules (Quy tắc mã nguồn bắt buộc)
When authorization to code is granted in Step 4, you must adhere to the following rules:

* **No Truncation (within the delivered module):** Generated code must never be truncated. Every file delivered must be complete and fully functional. Placeholders and phrases such as "// ... rest unchanged", "giữ nguyên phần còn lại", or "implement later" are forbidden. Splitting work is allowed ONLY at the module or file boundary, NEVER in the middle of a file or a code block. This rule applies to file contents on disk, not to chat output.
* **No Unapproved Alterations:** Do not alter, refactor, or delete any surrounding code beyond the explicitly agreed-upon modifications established in Step 2 and listed in the current Module Card.
* **Modified files are written in full:** When an already-approved file must change, write the entire updated file to disk and list a short changelog (3-5 lines) in the chat. Never leave a partial edit or a placeholder in place of the file content.

## 2.1. Quy tắc chỉnh sửa HTML/CSS/JS sau khi tách (Post-split Workflow)
* **Không sửa tay `index.html`:** Tệp `index.html` hiện là tệp được sinh tự động bởi công cụ build. Mọi thay đổi cấu trúc hoặc nội dung HTML bắt buộc phải thực hiện trong `src/index.src.html` hoặc các tệp tương ứng trong `partials/`.
* **Lệnh build bắt buộc:** Sau khi chỉnh sửa bất kỳ tệp HTML nào trong `src/` hoặc `partials/`, phải chạy lệnh:
  ```bash
  python3 tools/restructure.py build
  ```
  để cập nhật lại `index.html`. Luôn commit cả `index.html` lên repository để Vercel phục vụ trực tiếp mà không cần bước build server.
* **Chỉnh sửa CSS & JS:** Sửa trực tiếp trong các tệp module tương ứng tại `css/` và `js/`. Tuyệt đối giữ nguyên tính chất classic script (không tự ý đổi sang `type="module"`, không thêm `defer`/`async` làm hỏng inline event handlers và biến toàn cục).

## 3. Delivery Units & Module Card (Đơn vị giao & Phiếu khai báo module)
A module is a valid Delivery Unit only if it satisfies ALL of the following:

1. **Independent:** clear inputs and outputs (e.g. `transpose.ts` takes a chord and a semitone count, returns a chord).
2. **Reasonably sized:** at most ~5 files or ~600 lines of code.
3. **Verifiable:** has a runnable verification command (test, build, lint, or a manual check script).
4. **Has a Definition of Done (DoD)** written BEFORE coding.
5. **Non-breaking:** touches no file outside its Module Card.

Every module MUST open with a Module Card:

```markdown
### M# – <Module name>
- Depends on: <approved modules>
- Files delivered: <list, max ~5>
- Must not touch: <everything else / explicit exceptions>
- DoD:
  [ ] <measurable criterion>
  [ ] <measurable criterion>
- Verify with: <command>
- Known risks: <list or "none">
```

## 4. Module Execution Loop (Vòng thực thi theo module)
For each module, repeat:

* **4a. Declare:** output the Module Card (short, no code).
* **4b. Deliver:** write the complete content of every file in the Module Card directly to the project workspace. Do NOT paste full source code into the chat when file access is available. The chat response lists each file written (path, line count, one-line purpose). Paste code into the chat only if the user requests it ("Hiện code <tệp>") or when no file access exists. Files written to disk must still be complete: no placeholders, no "rest unchanged" markers, no partial content.
* **4c. Self-check report:** state which DoD items are met and the result of the verification command. If the command cannot be run in the current environment, say so explicitly and state how the user can run it. Never claim a check passed if it was not executed. The report MUST list every file written with its line count so the user can cross-check against the actual files.
* **4d. STOP and wait** for one of these keywords:
  * **"Duyệt M#"** – approve the module; proceed to the next module (declare its Module Card and continue from 4a).
  * **"Sửa M#: <nội dung>"** – revise the module as requested, then return to 4c.
  * **"Tiếp tục"** – resume delivery when a response was paused at a file boundary (see Section 5).
  * **"Hiện code <tệp>"** – print the full content of the named file in the chat (exception to 4b).

Without an explicit "Duyệt M#", NEVER start the next module.

## 5. Special Situations (Tình huống đặc biệt)

* **File exceeds ~600 lines:** first prefer splitting it by responsibility in the design. If impossible, deliver that file alone in one turn, still complete.
* **Response nearing length limit:** stop at a file boundary, list the remaining files ("Tệp còn lại: X, Y"), and wait for **"Tiếp tục"**. Never stop mid-file.
* **Large generated data (e.g. `hymns.json`):** do not paste into the conversation. Deliver the generator script plus a statistics report (counts, errors, checksums).
* **Defect found in an approved module:** propose a patch module (e.g. `M5.1`) and run it through Steps 1-3 and the Section 4 loop. Do not silently edit approved files.
* **Change of scope or plan:** return to Step 2, present the updated plan, and wait for a new **"Đồng ý"**.
* **Single small task** (one file, one bug fix): treat it as a single module; the Module Card may be reduced to files + verification command.

## 6. Keyword Summary (Bảng từ khóa)

| Keyword | Meaning |
|---|---|
| `Đồng ý` | Approve the plan (Step 4 starts, first module only) |
| `Duyệt M#` | Approve module M#, proceed to the next |
| `Sửa M#: ...` | Request changes to module M# |
| `Tiếp tục` | Continue after a pause at a file boundary |
| `Hiện code <tệp>` | Print the full content of the named file in the chat |

## 7. Account Handover & Intake Workflow (Quy trình Bàn giao & Tiếp nhận Tài khoản)
Quy trình chuẩn hóa việc chuyển giao ca làm việc giữa các tài khoản Google / phiên làm việc trong Antigravity IDE:

### 7.1. Chuẩn bị bàn giao (Outgoing Agent - Agent A)
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

### 7.2. Tự động tiếp nhận khi mở phiên mới (Incoming Agent - Agent B)
1. **Phân định cơ chế IDE vs Hành vi Agent:** Antigravity IDE tự động nạp các tệp quy tắc chỉ dẫn (`AGENTS.md`) vào context khi mở phiên, nhưng không tự chạy ngầm lệnh shell trước khi có tương tác từ người dùng.
2. **Quy tắc tự kích hoạt:** Ngay khi nhận được tin nhắn đầu tiên của người dùng (kể cả chỉ là lời chào ngắn gọn như *"tiếp tục"*, *"chào bạn"*, *"bắt đầu"* mà không cần prompt dài):
   - Chủ động kiểm tra sự tồn tại và tính toàn vẹn của `HANDOVER.md` bằng `node tools/handover.js verify`.
   - Kiểm tra mức độ chiếm dụng context ban đầu bằng `node tools/handover.js status`.
   - Đọc kỹ `HANDOVER.md`, `AGENTS.md` và `PROJECT_STATUS.md`.
   - Chạy các lệnh xác minh trạng thái chỉ đọc (`git status`, `git log -1`, `node tools/lint-color.js`, `node --test tools/*.test.js`).
   - Lập **Báo cáo Tiếp nhận (Intake Report)** ngắn gọn (3-5 dòng) gửi tới người dùng.
   - Xuất trình Module Card cho công việc tiếp theo và **DỪNG LẠI chờ từ khóa "Đồng ý"**.
3. **Điều khoản cấm đoán:** `HANDOVER.md` chỉ là tài liệu ngữ cảnh, **KHÔNG PHẢI GIẤY PHÉP THỰC THI**. Agent B tuyệt đối không được viết code hoặc sửa đổi tệp khi chưa có từ khóa "Đồng ý" từ người dùng.
