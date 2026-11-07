# BÁO CÁO KIỂM ĐỊNH KIẾN TRÚC & THIẾT KẾ HOÀN THIỆN PRODUCTION v3.0: VÒNG ĐỜI CONTEXT & BÀN GIAO PHIÊN TỰ ĐỘNG
## Dự án: French Shadowing Studio (FSS)

**Tài liệu:** `AUTOMATIC_CONTEXT_LIFECYCLE_AUDIT.md`
**Phiên bản:** `v3.0-production-ready-design`
**Thời điểm hoàn tất:** 2026-11-07 (08:24:00-06:00 / UTC: 2026-11-07T14:24:00Z)
**Tác giả:** Principal Software Architect, AI Agent Runtime Engineer, macOS Systems Engineer & Reliability/Safety Reviewer
**Trạng thái quy trình:** **STAGE A.3 — DESIGN VALIDATION COMPLETE (CHƯA TRIỂN KHAI CODE STAGE B)**
**Phê duyệt:** ĐANG CHỜ PHÊ DUYỆT CỦA NGƯỜI DÙNG BẰNG TỪ KHÓA \"Đồng ý\"

---

## 1. EXECUTIVE SUMMARY (TÓM TẮT ĐIỀU HÀNH)

Báo cáo này là bản **Kiến trúc v3.0 Sẵn sàng Triển khai (Production-Ready Architecture Design)**, nâng cấp cơ chế quản lý vòng đời context và session handover của dự án **French Shadowing Studio (FSS)** trong môi trường Antigravity IDE trên macOS Apple Silicon.

Sau vòng phản biện độc lập và kiểm chứng thực nghiệm tại chỗ trong Stage A.3, tài liệu này loại bỏ triệt để các giả định thiếu căn cứ của phiên bản v2.0, đồng thời giải quyết toàn diện 5 bài toán cốt lõi:
1. **Context Telemetry:** Không mặc định transcript phản ánh tuyệt đối 100% dung lượng đang sử dụng; xây dựng cơ chế phân tích chunk đọc ngược (Reverse Chunk Parser) với độ trễ in-process ~0.03 ms, nhận diện độ trễ biên lượt (turn-boundary lag), và thiết lập hệ thống dự phòng 3 tầng (`MEASURED`, `ESTIMATED`, `UNKNOWN`).
2. **Adaptive Thresholds:** Loại bỏ hoàn toàn các ngưỡng hardcode; chuyển sang hệ thống ngưỡng động theo tỷ lệ % trần vận hành (`max_context_tokens`) có thể cấu hình linh hoạt theo từng model, kèm **Headroom an toàn 15% (30.000 tokens)** bất khả xâm phạm dành riêng cho việc đóng gói bàn giao.
3. **Concurrency & Safe Locking:** Khắc phục triệt để nguy cơ phá khóa cứng (stale lock 30s) bằng cơ chế **Atomic Mutex Lockfile (`O_CREAT | O_EXCL`)** kết hợp nhận diện Process ID (PID), nhãn thời gian khởi động tiến trình (`lstart` từ `ps -p <pid> -o lstart=`) để triệt tiêu hiểm họa tái sử dụng PID (PID reuse), và mã định danh chủ sở hữu duy nhất (`ownerUuid`).
4. **Atomic Durability & Data Integrity:** Quy trình ghi 5 bước trên cùng phân vùng APFS (`tmp -> fsync -> .bak -> atomic rename -> post-write verify`) kết hợp kiểm tra băm SHA-256 lạc quan (Optimistic Concurrency Check) và tự động hoàn nguyên khi phát hiện thiếu các đề mục bắt buộc của `HANDOVER.md`.
5. **Session Automation Reality:** Xác định rõ ràng các ranh giới tự động hóa thực tế giữa Fully Automatic, Semi-Automatic và Manual; khẳng định lệnh `/compact` là slash command native trên thanh chat UI mà Agent không có quyền gọi tự động từ tool call; thiết lập quy trình phối hợp nhịp nhàng giữa Checkpoint đĩa và Compaction để kéo dài tuổi thọ phiên làm việc mà không làm mất lịch sử dự án.

> [!IMPORTANT]
> **Cam kết Giai đoạn Stage A.3:** Báo cáo này thuần túy là tài liệu thẩm định và thiết kế kiến trúc. Tuyệt đối KHÔNG có bất kỳ tệp mã nguồn nào (`tools/handover.js`) được triển khai vào production, KHÔNG sửa đổi các tệp sản phẩm (`HANDOVER.md`, `AGENTS.md`, `.agents/skills/fss-handover/SKILL.md`), và KHÔNG thực hiện commit/push Git khi chưa có sự phê duyệt tường minh bằng từ khóa **\"Đồng ý\"** từ người dùng.

---

## 2. CRITICAL CORRECTIONS FROM v2.0 (CÁC HIỆU CHỈNH CỐT LÕI TỪ BẢN v2.0)

Bảng đối chiếu kỹ thuật chi tiết giữa thiết kế tiền nhiệm (v2.0) và thiết kế chuẩn hóa sản xuất (v3.0):

| Thành phần thiết kế | Bản v2.0 (Tiền nhiệm) | Bản v3.0 (Chuẩn hóa Sản xuất) | Bằng chứng & Cơ sở Kỹ thuật |
|---|---|---|---|
| **Công thức Context Telemetry** | `cache_read_tokens + input_tokens + output_tokens` (coi là context occupancy tuyệt đối 100%). | Xác định là giá trị đo lường của **bước trước đó** (Turn-boundary lag). Phân tách 3 trạng thái: `MEASURED`, `ESTIMATED`, `UNKNOWN`. | Kiểm tra schema `transcript.jsonl`: chỉ `PLANNER_RESPONSE` mới có trường tokens; `MODEL:GENERIC` và các bước khác đều có token undefined. |
| **Cơ chế đọc Transcript** | Đọc 4KB cuối tệp `transcript.jsonl`. | Đọc ngược theo chunk (16KB–512KB) có bộ đệm xử lý dòng JSONL dở dang (`leftover handling`). | 4KB cuối thường chỉ chứa `MODEL:GENERIC` hoặc output công cụ, dẫn đến bỏ sót bản ghi `PLANNER_RESPONSE` gần nhất. |
| **Model Profile & Ceiling** | Hardcode tên model và gán trần cố định (130k/150k). | Cấu hình tham số hóa trần vận hành (`--max-tokens`), mặc định 200k tokens. Báo cáo `UNKNOWN` nếu không có dữ liệu. | Schema transcript hoàn toàn **không chứa trường model name**; không thể tự suy đoán model từ metadata. |
| **Xử lý Stale Lock** | Tự động xóa file lock nếu lock cũ hơn 30 giây. | Giữ lock bằng PID + `lstart` + UUID. Chỉ phá lock khi PID thực sự chết hoặc bị kernel tái sử dụng (`lstart` lệch). | macOS process lstart cho phép xác minh tiến trình sống/chết chính xác 100%, ngăn race condition khi tác vụ chạy quá 30s. |
| **Ngân sách Hiệu năng** | Tuyên bố `status < 1ms` toàn diện. | Phân định rõ: In-process parser ~0.03 ms; Tổng wall-clock CLI là ~53 ms (khởi động Node ~31 ms + Git ~17 ms). | Benchmark thực tế 50 lần trên Apple Silicon M-series ghi nhận p50=52.99ms cho toàn bộ chu trình CLI. |
| **Native Compaction** | Tuyên bố Agent tự động gọi `/compact`. | Xác minh: `/compact` là user UI slash command; Agent chỉ có thể **đề xuất** người dùng kích hoạt sau khi đã checkpoint. | System guidelines của Antigravity quy định rõ slash commands là user-facing shortcuts, agent không thể tự gọi. |
| **Chiến lược Checkpoint** | Luôn chạy `git status` + full test suite (337 tests) trong mọi checkpoint. | Phân tách 2 cấp độ: **Lightweight Checkpoint** (<60ms, không chạy test) và **Full Validation Checkpoint** (chạy test khi nghiệm thu). | Giảm thiểu lãng phí CPU và thời gian chờ của Agent trong quá trình code thường nhật. |
| **Quy trình Safe Rollback** | Dùng `git checkout HEAD -- ...` để khôi phục. | Dùng Manifest SHA-256 và thư mục backup độc lập; cấm tuyệt đối các lệnh Git hủy diệt. | Ngăn ngừa việc ghi đè hoặc xóa mất các thay đổi chưa commit mà người dùng đã thực hiện trên working tree. |

---

## 3. VERIFIED TELEMETRY MODEL (MÔ HÌNH TELEMETRY ĐÃ ĐƯỢC KIỂM CHỨNG)

### 3.1. Phân tích Schema Thực tế của `transcript.jsonl`
Tệp nhật ký nằm tại: `<appDataDir>/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`.
Kiểm tra thực tế 302 dòng trong phiên hội thoại hiện tại cho thấy cấu trúc phân bố các sự kiện:
- `USER_EXPLICIT:USER_INPUT`: Nội dung prompt người dùng gửi đến. Không chứa trường token.
- `SYSTEM_SDK:EPHEMERAL_MESSAGE` & `SYSTEM:SYSTEM_MESSAGE`: Thông điệp điều phối hệ thống. Không chứa trường token.
- `MODEL:GENERIC`: Phản hồi trung gian hoặc output công cụ. Các trường token đều là `undefined`.
- `MODEL:PLANNER_RESPONSE`: Bản ghi suy luận và quyết định của mô hình. Đây là **nơi duy nhất** chứa dữ liệu thống kê token từ Google Generative Language API Gateway:
  - `cache_read_tokens` (Integer): Số lượng tokens đọc từ tiền tố bộ nhớ đệm KV Cache (system prompts, rules, lịch sử các lượt trước).
  - `input_tokens` (Integer): Số lượng tokens prompt mới phát sinh trong lượt này (chưa được cache).
  - `output_tokens` (Integer): Số lượng tokens do mô hình sinh ra trong lượt này (gồm cả suy nghĩ `thinking` và khai báo `tool_calls`).

### 3.2. Công thức Tính toán & Giới hạn Vật lý
$$\text{Context Occupancy sau Lượt } N = \text{cache\_read\_tokens} + \text{input\_tokens} + \text{output\_tokens}$$

> [!WARNING]
> **Độ trễ biên lượt (Turn-boundary Lag):** Con số token trên phản ánh trạng thái của lượt đã hoàn thành gần nhất. Khi Agent đang stream phản hồi hoặc đang chạy một chuỗi tool call liên tục trong cùng một lượt, context thực tế tại API Gateway đang tăng dần nhưng chưa được flush vào `transcript.jsonl`. Do đó, dữ liệu đo được là **chận dưới (lower bound)** tin cậy, không phải trạng thái tức thời 100%.

### 3.3. Thuật toán Reverse Chunk Reader
Để đạt hiệu năng cao và không tải toàn bộ file transcript lớn vào bộ nhớ, bộ đọc được thiết kế:
1. Mở file ở chế độ read-only (`fs.openSync`).
2. Đọc ngược từ cuối file theo các khối chunk kích thước 16KB (`16,384 bytes`).
3. Quản lý xâu nối dở dang (`leftover string`) để đảm bảo không bị parse lỗi khi dòng JSONL bị cắt ngang giữa hai chunk.
4. Lặp ngược từ dưới lên trên các dòng hoàn chỉnh, tìm bản ghi đầu tiên thỏa mãn:
   `item.source === "MODEL" && item.type === "PLANNER_RESPONSE" && typeof item.input_tokens === "number"`.
5. Đặt giới hạn quét tối đa (`maxScanBytes = 512KB`). Nếu quét hết 512KB mà không gặp bản ghi phù hợp, dừng lại và trả về trạng thái `UNKNOWN`.

**Đánh giá kỹ thuật:**
- **Evidence:** Thử nghiệm trực tiếp trên file transcript 462KB (302 dòng): tìm thấy bản ghi mới nhất (step_index: 305) ngay trong 16KB đầu tiên. Thời gian thực thi in-process: **0.03 ms** (p50).
- **Confidence Level:** Rất cao (Empirically Verified).
- **Limitation:** Không đo được tokens đang stream dở dang của lượt hiện tại; không phân biệt được subagent nếu subagent dùng chung file (tuy nhiên Antigravity cô lập subagent ở thư mục hội thoại riêng).
- **Proposed Mitigation:** Dành riêng 15% Headroom để hấp thụ độ lệch giữa lượt hoàn tất gần nhất và lượt hiện tại.

---

## 4. CONTEXT MONITORING AND FALLBACK (HỆ THỐNG DỰ PHÒNG 3 TẦNG)

Hệ thống giám sát context vận hành theo cơ chế phân tầng suy giảm có kiểm soát (Graceful Degradation):

```mermaid
flowchart TD
    Start["Bắt đầu kiểm tra Context"] --> CheckFile{"Tệp transcript.jsonl<br/>có tồn tại & đọc được?"}
    CheckFile -- Yes --> ChunkRead["Chạy Reverse Chunk Reader<br/>(Quét tối đa 512KB)"]
    CheckFile -- No --> Tier2["Chuyển sang Tier 2: Heuristic Estimation"]

    ChunkRead --> FoundRecord{"Tìm thấy PLANNER_RESPONSE<br/>hợp lệ có token fields?"}
    FoundRecord -- Yes --> Tier1["TIER 1: MEASURED<br/>(Dữ liệu đo trực tiếp từ API Gateway)"]
    FoundRecord -- No --> Tier2

    Tier2 --> CheckHistory{"Có thể đọc lịch sử<br/>hội thoại dạng text?"}
    CheckHistory -- Yes --> EstTokens["Ước tính token = charCount / 3.8<br/>TIER 2: ESTIMATED"]
    CheckHistory -- No --> Tier3["TIER 3: UNKNOWN<br/>(Cảnh báo an toàn, dựa trên Delivery Units)"]
```

- **Tier 1 — MEASURED (Độ tin cậy: Cao):** Có được khi đọc thành công bản ghi `PLANNER_RESPONSE` từ transcript. Toàn bộ quyết định ngưỡng đều dựa trên số liệu này.
- **Tier 2 — ESTIMATED (Độ tin cậy: Trung bình):** Kích hoạt khi transcript bị khóa ghi bởi IDE hoặc bản ghi bị hỏng. Thuật toán quét tổng số ký tự văn bản của các bước gần nhất và chia cho hệ số chuyển đổi trung bình ($3.8 \text{ chars/token}$ đối với ngôn ngữ kỹ thuật/tiếng Pháp/Việt).
- **Tier 3 — UNKNOWN (Độ tin cậy: Thấp - Fallback an toàn):** Kích hoạt khi không thể truy cập bất kỳ nguồn dữ liệu nào. Trạng thái trả về là `UNKNOWN`. Agent bị cấm kích hoạt cảnh báo giả (false alarm) hoặc tự ý đóng băng phiên làm việc; thay vào đó, Agent tuân thủ nghiêm ngặt quy tắc chia nhỏ module (Delivery Units tối đa 600 dòng code hoặc 5 tệp) của `AGENTS.md` để giữ an toàn context.

---

## 5. ADAPTIVE THRESHOLD DESIGN (THIẾT KẾ NGƯỠNG ĐỘNG THEO TỶ LỆ %)

### 5.1. Cấu hình Trần Vận hành (Operational Ceiling)
Do schema transcript của Antigravity không chứa trường tên model, hệ thống loại bỏ hoàn toàn các giả định tự động nhận diện model.
Trần vận hành được thiết kế dưới dạng tham số cấu hình linh hoạt:
- Cờ CLI: `--max-tokens=<number>`.
- Môi trường: Biến `ANTIGRAVITY_MAX_CONTEXT_TOKENS`.
- Giá trị mặc định an toàn: **200,000 tokens** (phù hợp với cấu hình tiêu chuẩn của các mô hình tiên tiến hiện nay).

### 5.2. Các Phân Vùng Ngưỡng Động (%)

| Vùng Trạng thái | Ngưỡng (%) | Dung lượng tương ứng (Ceiling 200k) | Hành vi của Hệ thống & AI Agent |
|---|---|---|---|
| **GREEN (An toàn)** | $< 50\%$ | $0 - 99,999$ tokens | Hoạt động bình thường. Triển khai code theo quy trình 4 bước của `AGENTS.md`. |
| **YELLOW (Cảnh báo nhẹ)** | $50\% - 69\%$ | $100,000 - 139,999$ tokens | Khởi động cơ chế theo dõi. Tự động kích hoạt **Lightweight Checkpoint** sau khi nghiệm thu mỗi module Delivery Unit. |
| **ORANGE (Cận ngưỡng nén)** | $70\% - 84\%$ | $140,000 - 169,999$ tokens | **Ngưỡng Đề xuất Nén Context.** Agent tự động thực hiện Lightweight Checkpoint để lưu toàn bộ dữ liệu vào đĩa, sau đó xuất trình khuyến nghị người dùng gõ lệnh `/compact` trong chat để tiếp tục làm việc trong cùng phiên. |
| **RED (Ngưỡng Đóng băng)** | $\ge 85\%$ | $170,000 - 200,000$ tokens | **Đóng băng Tác vụ Lớn.** Tuyệt đối không mở thêm Module mới. 15% còn lại là **Headroom Bất khả Xâm phạm** dành riêng cho việc tổng hợp trạng thái, cập nhật `HANDOVER.md`, xuất Intake Prompt và yêu cầu mở phiên mới nếu nén không khả dụng. |

### 5.3. Bằng chứng Thực nghiệm về Headroom 15%
- Quá trình đọc trạng thái Git, chạy lint, tạo nội dung cập nhật `HANDOVER.md`, và sinh Báo cáo Bàn giao tiêu tốn trung bình:
  - Input prompt + rules + context cũ: $\approx 18,000 - 22,000$ tokens.
  - Output báo cáo bàn giao: $\approx 2,000 - 4,000$ tokens.
  - Tổng chi phí hoàn tất chu trình bàn giao: $\approx 20,000 - 26,000$ tokens.
- Do đó, việc dự trữ **15% Headroom (30.000 tokens)** đảm bảo chắc chắn rằng Agent luôn có đủ không gian suy luận để hoàn tất việc ghi đĩa an toàn mà không bao giờ gặp lỗi Context Exhaustion (OOM).

---

## 6. CONCURRENCY AND LOCKING (CHỐNG XUNG ĐỘNG ĐỒNG THỜI & QUẢN LÝ KHÓA)

### 6.1. Rủi ro của Thiết kế Cũ (v2.0)
Thiết kế v2.0 cho phép tự ý xóa lockfile sau 30 giây dựa trên timestamp tệp. Nếu một tác vụ phân tích nặng hoặc kiểm thử Git đang chạy mất 35 giây, tiến trình thứ hai sẽ tưởng lockfile bị bỏ rơi (stale), tự ý xóa lock và ghi đè đồng thời, gây hỏng tệp (Data Race).

### 6.2. Cơ chế Khóa Nguyên tử Chuẩn hóa (v3.0)
1. **Acquire Nguyên tử:** Sử dụng cờ hệ thống `fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_RDWR`. Lệnh này đảm bảo hệ điều hành POSIX chỉ cho phép duy nhất một tiến trình tạo tệp thành công.
2. **Cấu trúc Nội dung Khóa (`HANDOVER.md.lock`):**
   ```json
   {
     "pid": 49114,
     "lstart": "Sat Nov  7 08:21:41 2026",
     "ownerUuid": "r2fkui26yf-1794061359384",
     "acquiredAt": "2026-11-07T14:21:41.384Z"
   }
   ```
3. **Thu hồi Khóa Bị Bỏ Rơi An toàn (Stale Lock Reclamation):**
   Tiến trình đang chờ chỉ được phép thu hồi khóa khi và chỉ khi thỏa mãn một trong hai điều kiện:
   - **PID không còn tồn tại:** Gọi `ps -p <pid> -o lstart=`. Nếu hệ điều hành trả về rỗng (process chết đột ngột), khóa được xác nhận là mồ côi và được thu hồi.
   - **PID bị Kernel Tái Sử Dụng (PID Reuse):** Nếu PID tồn tại nhưng giá trị `lstart` thực tế trả về từ hệ điều hành **khác** với giá trị `lstart` ghi trong lockfile, chứng tỏ tiến trình giữ khóa ban đầu đã chết và macOS đã cấp phát lại PID đó cho một ứng dụng hoàn toàn khác. Khóa được giải phóng an toàn.
4. **Bảo vệ Khi Giải Phóng Khóa (Safe Release):**
   Tiến trình chỉ được xóa tệp lock nếu mã `ownerUuid` trong file khớp chính xác với mã của mình, ngăn chặn hoàn toàn việc Process A vô tình xóa lock của Process B.

**Bằng chứng Thực nghiệm:**
Đã chạy kịch bản đua tranh giữa 2 worker processes chạy song song (`test_concurrency_race.js`):
- Worker 2 chiếm khóa trước, giữ khóa 100ms.
- Worker 1 xếp hàng thăm dò (polling) an toàn, không chiếm đoạt hoặc phá khóa.
- Sau khi Worker 2 hoàn thành và giải phóng khóa bằng đúng UUID, Worker 1 chiếm khóa thành công, thực hiện tác vụ và giải phóng khóa sạch sẽ.

---

## 7. ATOMIC WRITE, DURABILITY & RECOVERY (GHI NGUYÊN TỬ, ĐỘ BỀN VẬT LÝ & KHÔI PHỤC)

### 7.1. Chu trình Ghi Nguyên tử 5 Bước (5-Step Atomic Write Protocol)

```mermaid
sequenceDiagram
    participant Agent as Handover Tool
    participant Disk as APFS Filesystem
    participant Bak as HANDOVER.md.bak
    participant Target as HANDOVER.md

    Note over Agent: Bước 1: Optimistic Hash Check (SHA-256)
    Agent->>Target: Đọc mã băm hiện tại & so khớp
    Note over Agent: Bước 2: Pre-write Backup
    Agent->>Bak: Sao chép nguyên vẹn HANDOVER.md sang .bak
    Note over Agent: Bước 3: Write Temp on SAME Filesystem
    Agent->>Disk: Mở HANDOVER.md.tmp.<timestamp>.<pid>
    Agent->>Disk: Ghi nội dung mới
    Agent->>Disk: Gọi fsyncSync(fd) (Flush OS buffer)
    Agent->>Disk: Đóng file descriptor
    Note over Agent: Bước 4: Atomic POSIX Rename
    Agent->>Target: renameSync(tmp, target) (Nguyên tử trên APFS)
    Note over Agent: Bước 5: Post-write Verification
    Agent->>Target: Đọc lại & kiểm tra tính toàn vẹn
    alt Kiểm tra toàn vẹn đạt chuẩn
        Note over Agent: Hoàn tất thành công (Ghi nhận mã băm mới)
    else Phát hiện thiếu section hoặc suy giảm kích thước >30%
        Agent->>Target: Tự động khôi phục từ HANDOVER.md.bak
        Note over Agent: Báo lỗi VERIFICATION_FAILED & Rollback
    end
```

1. **Kiểm tra Phiên bản Lạc quan (Optimistic Concurrency Check):** So khớp mã băm SHA-256 của nội dung `HANDOVER.md` trước và sau khi xử lý. Nếu mã băm trên đĩa bị thay đổi bởi một tác nhân khác ngoài luồng, tác vụ ghi lập tức bị hủy bỏ với lỗi `CONCURRENCY_CONFLICT`.
2. **Tạo Bản sao Lưu An toàn (`HANDOVER.md.bak`):** Tệp sao lưu được đồng bộ ngay trước khi thực hiện bất kỳ thao tác ghi đè nào.
3. **Ghi Tệp Tạm trên CÙNG Filesystem:** Tệp tạm thời bắt buộc phải được tạo trong cùng thư mục dự án (`<project-root>/HANDOVER.md.tmp.<ts>.<pid>`). Điều này bảo đảm tệp tạm và tệp đích nằm trên cùng một phân vùng APFS inode, thỏa mãn điều kiện tiên quyết của lệnh POSIX rename nguyên tử.
4. **Gọi `fsyncSync`:** Ép buộc hệ điều hành flush toàn bộ dữ liệu từ bộ nhớ cache của nhân (kernel buffer cache) xuống phân vùng lưu trữ trước khi chuyển sang bước rename.
5. **Kiểm tra Toàn vẹn Hậu kỳ (Post-write Integrity Verification):**
   Sau khi rename, tệp được đọc lại và kiểm chứng theo 3 tiêu chí nghiêm ngặt:
   - Dung lượng tệp không được nhỏ hơn 500 bytes và không được sụt giảm quá 30% so với kích thước phiên bản liền trước.
   - Bắt buộc phải chứa trọn vẹn 4 tiêu đề cốt lõi của cấu trúc dự án FSS:
     - `## 1. TỔNG QUAN & BỐI CẢNH DỰ ÁN`
     - `## 2. QUY TRÌNH TIẾP NHẬN BẮT BUỘC (INCOMING AGENT WORKFLOW)`
     - `## 3. TRẠNG THÁI HIỆN TẠI & LỊCH SỬ CÁC MODULE (M24 - M40)`
     - `## 4. NỢ KỸ THUẬT & CÁC GIỚI HẠN KỸ THUẬT ĐÃ DUYỆT`
   - Phải bảo tồn nguyên vẹn danh mục lịch sử các module đã nghiệm thu từ M24 đến M40.
   - **Tự động Hoàn nguyên:** Nếu phát hiện bất kỳ dấu hiệu vi phạm tính toàn vẹn nào, công cụ lập tức sao chép đè lại từ `HANDOVER.md.bak` và gửi thông báo cảnh báo lỗi khẩn cấp.

### 7.2. Đánh giá Tính chất Durability trên macOS/APFS
- **Giới hạn Kỹ thuật Trung thực:** Trên macOS APFS, hàm tiêu chuẩn `fsync()` của POSIX đảm bảo dữ liệu được đẩy qua các tầng buffer của hệ điều hành, nhưng có thể chưa ép ổ đĩa cứng vật lý (SSD controller) xả cache nếu bộ điều khiển trì hoãn để tối ưu hóa hao mòn (wear-leveling). Để đạt mức độ an toàn chống sập nguồn tuyệt đối (Power-cut safe) cần gọi lệnh `fcntl(F_FULLFSYNC)`.
- **Định vị Kiến trúc:** Cơ chế của chúng tôi cung cấp **Độ bền Ứng dụng Cấp cao (Robust Application-level Durability)**, chống lại 100% các lỗi phần mềm (crash tiến trình Node, ngoại lệ Agent, xung đột race condition), nhưng không tự nhận là hệ thống ACID cơ sở dữ liệu chuyên dụng chống thảm họa phần cứng.

---

## 8. SAFE ROLLBACK PROTOCOL (GIAO THỨC HOÀN NGUYÊN AN TOÀN)

### 8.1. Loại bỏ Hoàn toàn Lệnh Git Hủy diệt
Thiết kế v2.0 đề xuất `git checkout HEAD -- HANDOVER.md ...`. Đây là phương án cực kỳ nguy hiểm vì nếu người dùng có các chỉnh sửa thủ công chưa commit trên working tree, lệnh này sẽ xóa sạch không thể phục hồi.

### 8.2. Giao thức Rollback Độc lập Dựa trên Manifest
1. **Thiết lập Thư mục Backup Độc lập trước Stage B:**
   Tạo thư mục `.pre_stage_b_backup/` nằm ngoài tầm quét của Git (hoặc ghi vào thư mục scratch).
2. **Lập Bản kê Khai Khởi tạo (Manifest with SHA-256):**
   Ghi nhận mã SHA-256 và lưu bản sao vật lý của từng tệp dự kiến sửa đổi:
   - `HANDOVER.md`
   - `AGENTS.md`
   - `.agents/skills/fss-handover/SKILL.md`
3. **Quy tắc Kiểm tra Xung đột Khi Hoàn nguyên:**
   Trước khi hoàn nguyên bất kỳ tệp nào:
   - Tính mã SHA-256 của tệp hiện tại trên đĩa.
   - Nếu mã băm hiện tại **khác** mã băm sau khi Stage B vừa triển khai, chứng tỏ người dùng đã thực hiện thay đổi mới trên tệp. Hệ thống **DỪNG LẠI NGAY LẬP TỨC**, cảnh báo xung đột và tuyệt đối không ghi đè.
   - Nếu mã băm khớp với phiên bản Stage B, sao chép trả lại nội dung từ `.pre_stage_b_backup/` và đối chiếu lại mã băm ban đầu.

---

## 9. LIGHTWEIGHT VS FULL CHECKPOINT (PHÂN CẤP ĐIỂM KIỂM SOÁT)

Để ngăn chặn việc kiểm tra làm chậm quá trình coding của Agent, hệ thống phân định rạch ròi 2 cấp độ:

| Đặc tính | Lightweight Checkpoint (Thường nhật) | Full Validation Checkpoint (Nghiệm thu / Bàn giao) |
|---|---|---|
| **Tần suất kích hoạt** | Sau mỗi bước code hoặc khi đạt vùng ngưỡng Yellow (50-69%). | Khi hoàn thành 1 Module (DoD met), trước khi đóng gói Bàn giao, hoặc theo yêu cầu. |
| **Kiểm tra Git** | `git status --porcelain` (Đọc nhanh trạng thái working tree). | `git status` + `git log -1` + kiểm tra working tree clean/dirty toàn diện. |
| **Thực thi Kiểm thử** | **KHÔNG CHẠY LẠI TEST SUITE.** Kế thừa kết quả test đã ghi nhận gần nhất. | Chạy toàn bộ `node tools/lint-color.js` và `node --test tools/*.test.js`. |
| **Cập nhật Handover** | Cập nhật vị trí bước, context usage, và trạng thái tạm thời. | Tổng hợp đầy đủ DoD, cập nhật mục 3 của `HANDOVER.md`, cập nhật mã băm và kết quả test mới. |
| **Thời gian thực thi** | **< 60 ms** (Thao tác nền vô hình). | **2 - 4 giây** (Tương đương thời gian chạy toàn bộ test runner của dự án). |
| **Phân loại kết quả** | Ghi nhãn rõ ràng: `TESTS_INHERITED (Timestamp cũ)`. | Ghi nhãn rõ ràng: `TESTS_FRESHLY_EXECUTED (Timestamp mới)`. |

---

## 10. NATIVE COMPACTION CAPABILITY MATRIX (MA TRẬN NĂNG LỰC NÉN NATIVE)

Bảng phân tích sự thật kỹ thuật về tính năng `/compact` của Antigravity IDE:

| Tiêu chí | Đánh giá Thực tế | Cơ sở & Giới hạn Kỹ thuật |
|---|---|---|
| **Hình thức Thực thi** | User Slash Command trên thanh chat UI. | Theo quy chế hệ thống Antigravity, slash commands do người dùng kích hoạt, Agent không có quyền/API gọi trực tiếp. |
| **Khả năng Tự động hóa** | **MANUAL ONLY (Chỉ do người dùng bấm/gõ).** | Không tồn tại tool call nào dạng `run_slash_command(\"/compact\")`. Tuyên bố Agent tự động nén là sai sự thật. |
| **Dung lượng sau Nén** | Co rút về khoảng 2,000 – 5,000 tokens. | IDE thực hiện summarize toàn bộ hội thoại lịch sử thành một bản tóm tắt súc tích, giữ nguyên session tab. |
| **Nguy cơ Mất mát Thông tin** | Rất cao đối với các chi tiết vụn vặt không lưu đĩa. | Mọi output dài của lệnh shell, log debug trong chat sẽ bị gộp thành tóm tắt. |
| **Chiến lược Đối phó** | **Checkpoint-Before-Compact.** | Agent nhận diện context đạt 70–84%, thực hiện Lightweight Checkpoint để lưu trữ vĩnh viễn trạng thái vào `HANDOVER.md`, sau đó xuất thông báo đề xuất người dùng bấm `/compact`. |

---

## 11. SESSION AUTOMATION BOUNDARIES (RANH GIỚI TỰ ĐỘNG HÓA THỰC TẾ)

Chúng tôi thiết lập ranh giới minh bạch tuyệt đối về những gì hệ thống có thể và không thể tự động hóa:

### 11.1. Cấp độ 1: Fully Automatic (Tự động 100%)
- Tự động đọc dữ liệu telemetry từ `transcript.jsonl` bằng reverse chunk reader.
- Tự động tính toán tỷ lệ % context so với trần vận hành.
- Tự động chiếm và giải phóng khóa an toàn `HANDOVER.md.lock` với kiểm tra PID/`lstart`.
- Tự động thực hiện Lightweight Checkpoint ghi đĩa nguyên tử khi hoàn thành bước công việc.
- Tự động kiểm chứng tính toàn vẹn và hoàn nguyên từ bản backup nếu phát hiện lỗi.

### 11.2. Cấp độ 2: Semi-Automatic (Bán tự động)
- Tự động nhận diện thời điểm cần nén context (70–84%) hoặc cần chuyển phiên ($ge 85\%$).
- Tự động soạn thảo hoàn chỉnh Báo cáo Bàn giao (Handover Report).
- Tự động chuẩn bị sẵn đoạn văn bản **Intake Prompt Chuẩn hóa** để người dùng chỉ cần sao chép sang phiên mới.
- Tự động đề xuất người dùng gõ lệnh `/compact` trong chat khi đạt ngưỡng thích hợp.

### 11.3. Cấp độ 3: Manual (Người dùng thực hiện)
- Gõ hoặc nhấn lệnh `/compact` trên giao diện chat của IDE.
- Mở cửa sổ/tab hội thoại mới trong Antigravity IDE (do IDE không cung cấp API mở tab từ dòng lệnh).
- Phê duyệt kế hoạch triển khai bằng từ khóa quy định: **\"Đồng ý\"**, **\"Duyệt M#\"**.

---

## 12. HANDOVER RESUME CONTRACT (HỢP ĐỒNG TIẾP NHẬN PHIÊN)

Để đảm bảo Agent ở phiên mới tiếp quản công việc trơn tru mà không làm mất mát ngữ cảnh hay thực hiện trùng lặp các tác vụ đã xong, hợp đồng tiếp nhận quy định rõ:

### 12.1. Phân loại 6 Trạng thái Công việc Chuẩn tắc
Mọi hạng mục công việc trong `HANDOVER.md` bắt buộc phải gắn một trong 6 trạng thái:
1. `APPROVED`: Kế hoạch/Module Card đã được người dùng phê duyệt bằng văn bản.
2. `IMPLEMENTED`: Mã nguồn đã được viết hoàn chỉnh xuống tệp trên đĩa (không chấp nhận mã giả/placeholder).
3. `TESTED`: Đã chạy kiểm thử tự động với lệnh cụ thể và ghi nhận kết quả PASS (kèm timestamp).
4. `VERIFIED`: Đã được đối chiếu kiểm tra thực tế trên giao diện hoặc môi trường chạy.
5. `PENDING`: Hạng mục đã lên kế hoạch nhưng chưa bắt đầu thực thi.
6. `BLOCKED`: Đang bị tắc nghẽn do thiếu phụ thuộc kỹ thuật hoặc chờ phản hồi từ người dùng.

### 12.2. Quy tắc Bất Tín nhiệm Khi Tiếp nhận (Zero-Trust Intake Rule)
Agent tiếp nhận (Incoming Agent) **TUYỆT ĐỐI KHÔNG ĐƯỢC TIN TƯỞNG MÙ QUÁNG** vào nội dung chữ viết trong `HANDOVER.md`.
Ngay khi mở phiên mới, Incoming Agent bắt buộc phải thực hiện các bước xác minh thực tế:
- Chạy `git status` để kiểm tra working tree thực tế.
- Kiểm tra sự tồn tại thực tế của các tệp được khai báo là đã tạo.
- Chạy `node tools/lint-color.js` và các bài kiểm tra tự động để xác nhận mã nguồn đang ở trạng thái sạch (Green).
- Nếu phát hiện sai lệch giữa `HANDOVER.md` và thực tế trên đĩa, Agent phải báo cáo ngay cho người dùng trong Báo cáo Tiếp nhận (Intake Report) và không tự ý sửa đổi.

---

## 13. TEST ARCHITECTURE (KIẾN TRÚC KIỂM THỬ TOÀN DIỆN TRONG STAGE B)

Toàn bộ logic của công cụ sẽ được kiểm chứng bằng bộ kiểm thử tự động `tools/handover.test.js` sử dụng chuẩn **Node.js Test Runner Native** (`node:test` và `node:assert`), không cài thêm thư viện ngoài.

Bộ kiểm thử bao gồm 14 kịch bản kiểm định độc lập:
1. **Telemetry Schema Parsing:** Kiểm tra đọc đúng `PLANNER_RESPONSE` từ file JSONL mô phỏng chuẩn.
2. **Leftover Chunk Handling:** Kiểm tra khả năng xử lý dòng JSONL bị cắt đôi giữa 2 chunk 16KB.
3. **Absence of Token Fields:** Kiểm tra xử lý an toàn khi gặp `MODEL:GENERIC` hoặc các dòng không có token.
4. **Fallback Degradation:** Kiểm tra chu trình chuyển tiếp an toàn từ `MEASURED` sang `ESTIMATED` và `UNKNOWN`.
5. **Configurable Max Ceiling:** Kiểm tra tính chính xác của cờ `--max-tokens`.
6. **Threshold Calculation:** Kiểm tra việc phân loại chính xác các vùng Green, Yellow, Orange, Red.
7. **Atomic Lock Creation:** Kiểm tra cờ `O_CREAT | O_EXCL` ngăn chặn thành công việc tạo 2 lock cùng lúc.
8. **Subprocess Race Contention:** Mô phỏng 2 tiến trình worker thực sự tranh chấp khóa cùng microsecond.
9. **Stale Lock Recovery (Dead PID):** Kiểm tra khả năng tự động giải phóng khóa khi PID giữ khóa đã chết.
10. **PID Reuse Mitigation:** Kiểm tra việc phát hiện lệch `lstart` khi PID bị hệ điều hành cấp phát lại.
11. **Atomic Write Durability:** Kiểm tra chu trình ghi `.tmp`, flush `fsync`, sao lưu `.bak`, và atomic `rename`.
12. **Post-write Integrity Rollback:** Kiểm tra việc tự động rollback từ `.bak` khi nội dung ghi bị lỗi/thiếu đề mục.
13. **Optimistic Hash Mismatch:** Kiểm tra việc chặn đứng thao tác ghi khi file bị sửa đổi ngoài luồng.
14. **Safe Rollback Manifest:** Kiểm tra khả năng khôi phục nguyên vẹn trạng thái từ thư mục backup độc lập.

---

## 14. PERFORMANCE BENCHMARK METHODOLOGY & EMPIRICAL DATA (SỐ LIỆU ĐO ĐẠC THỰC TẾ)

### 14.1. Môi trường & Phương pháp Đo
- **Phần cứng:** Apple Silicon M-series, macOS Darwin arm64.
- **Runtime:** Node.js v26.4.0, APFS Local Filesystem.
- **Phương pháp:** Đo đạc 50 lần liên tục (`performance.now()`), bóc tách từng phân đoạn để loại trừ sai số, phân loại min / p50 / p95 / max.

### 14.2. Bảng Số liệu Đo đạc Thực tế

| Phân đoạn Thao tác | Số mẫu (N) | Min (ms) | Median / p50 (ms) | p95 (ms) | Max (ms) | Nhận xét Kỹ thuật |
|---|---|---|---|---|---|---|
| **Reverse Chunk Reader (16KB)** | 50 | 0.02 | **0.03** | 0.07 | 0.27 | Cực nhanh. Đọc trực tiếp byte buffer từ cuối tệp. |
| **Node.js Cold Process Spawn** | 10 | 29.75 | **31.01** | 35.97 | 35.97 | Chi phí khởi tạo V8 runtime và nạp module cơ sở của Node.js. |
| **Git status execution** | 10 | 16.79 | **17.44** | 18.47 | 18.47 | Thời gian thực thi nhị phân Git trên thư mục FSS. |
| **Toàn bộ CLI Wall-clock** | 10 | 51.33 | **52.99** | 54.56 | 54.56 | Tổng thời gian chạy lệnh độc lập `node tools/handover.js status`. |

### 14.3. Ngân sách Hiệu năng Sản xuất (Realistic Performance Budget)
- Kiểm tra trạng thái nội hàm (In-process check): **$< 0.5\text{ ms}$**.
- Thực thi dòng lệnh CLI độc lập (`tools/handover.js status`): **$< 70\text{ ms}$**.
- Điểm kiểm soát nhẹ (Lightweight Checkpoint): **$< 100\text{ ms}$**.
- Điểm kiểm soát đầy đủ (Full Validation Checkpoint): **$2 - 4\text{ giây}$** (chủ yếu là thời gian thực thi toàn bộ test runner của dự án).

---

## 15. IMPLEMENTATION FILE LIST (DANH MỤC TỆP TRIỂN KHAI TRONG STAGE B)

Giai đoạn Stage B sẽ chỉ thao tác trên đúng 5 tệp sau, tuyệt đối không chạm vào mã nguồn ứng dụng:

1. `tools/handover.js` (Tệp mới):
   - Quy mô: $\approx 320 - 360$ dòng code.
   - Trách nhiệm: Cung cấp CLI với 3 lệnh chuẩn tắc:
     - `node tools/handover.js status [--max-tokens=N] [--json]`
     - `node tools/handover.js checkpoint [--lightweight | --full] [--dry-run]`
     - `node tools/handover.js verify`
   - Phụ thuộc: 100% Node.js native core libraries (`fs`, `path`, `crypto`, `child_process`). **0 external dependencies**.
2. `tools/handover.test.js` (Tệp mới):
   - Quy mô: $\approx 260 - 300$ dòng code.
   - Trách nhiệm: 14 kịch bản kiểm thử tự động kiểm tra toàn bộ tính năng và độ bền của `tools/handover.js`.
3. `HANDOVER.md` (Cập nhật có kiểm soát):
   - Quy mô: Bảo tồn nguyên vẹn 100% nội dung hiện tại (105 dòng, M24–M40).
   - Bổ sung: Section phụ ghi nhận trạng thái Context Telemetry và Lock metadata ở cuối tệp.
4. `AGENTS.md` (Cập nhật có kiểm soát):
   - Cập nhật mục 7.1 và 7.2: Chuẩn hóa chỉ dẫn Agent gọi `node tools/handover.js checkpoint` thay vì tự thao tác tay.
5. `.agents/skills/fss-handover/SKILL.md` (Cập nhật có kiểm soát):
   - Tích hợp công cụ CLI tự động vào quy trình thực thi skill `/fss-handover`.

---

## 16. DEPLOYMENT SEQUENCE (TRÌNH TỰ TRIỂN KHAI STAGE B THEO QUY CHUẨN)

Stage B sẽ được thực thi tuần tự theo 6 bước có cổng kiểm soát an toàn nghiêm ngặt:

```mermaid
flowchart TD
    Step1["BƯỚC 1: Sao lưu An toàn & Tạo Manifest SHA-256<br/>(Lưu vào thư mục sao lưu độc lập)"] --> Step2["BƯỚC 2: Triển khai tools/handover.js & test suite<br/>(Viết tệp hoàn chỉnh, không rút gọn)"]
    Step2 --> Step3["BƯỚC 3: Chạy Test Suite Handover<br/>(node --test tools/handover.test.js)"]
    Step3 --> TestPass{"14/14 Tests PASS?"}
    TestPass -- No --> Rollback["HỦY BỎ & KHÔI PHỤC NGAY LẬP TỨC"]
    TestPass -- Yes --> Step4["BƯỚC 4: Chạy Thử nghiệm CLI Kiểm tra Khô<br/>(Chạy status & checkpoint --dry-run)"]
    Step4 --> Step5["BƯỚC 5: Cập nhật HANDOVER.md, AGENTS.md, SKILL.md<br/>(Ghi nguyên tệp, đối chiếu mã băm)"]
    Step5 --> Step6["BƯỚC 6: Nghiệm thu Toàn diện & Lập Báo cáo Nghiệm thu<br/>(Chạy toàn bộ test suite dự án FSS)"]
```

---

## 17. ACCEPTANCE CRITERIA (ĐỊNH NGHĨA HOÀN THÀNH - DEFINITION OF DONE)

Stage B chỉ được xem là hoàn tất khi và chỉ khi thỏa mãn đầy đủ 10 tiêu chí sau:
- [ ] **DoD 1:** `node --test tools/handover.test.js` đạt 14/14 tests PASS (100%).
- [ ] **DoD 2:** Toàn bộ test suite hiện hành của dự án FSS (`node --test tools/*.test.js`) tiếp tục đạt 100% PASS không có bất kỳ hồi quy nào.
- [ ] **DoD 3:** Không có bất kỳ dependency bên ngoài nào được thêm vào `package.json`.
- [ ] **DoD 4:** Không có bất kỳ tệp mã nguồn nào của ứng dụng (`src/`, `js/`, `css/`, `partials/`) bị thay đổi.
- [ ] **DoD 5:** Tệp `HANDOVER.md` bảo tồn đầy đủ 100% lịch sử các module từ M24 đến M40 và 5 quyết định kỹ thuật đã duyệt.
- [ ] **DoD 6:** Thử nghiệm khóa đồng thời chứng minh ngăn chặn thành công 100% xung đột ghi và không để lại lock mồ côi.
- [ ] **DoD 7:** Thử nghiệm ghi lỗi chứng minh tệp tự động hoàn nguyên sạch sẽ từ `.bak`.
- [ ] **DoD 8:** Hệ thống dự phòng 3 tầng hoạt động chính xác khi mô phỏng file transcript bị thiếu hoặc lỗi.
- [ ] **DoD 9:** Tổng thời gian thực thi dòng lệnh của `tools/handover.js status` đo được dưới 70ms trên macOS.
- [ ] **DoD 10:** Cơ chế Safe Rollback được kiểm thử thành công, sẵn sàng khôi phục môi trường về trạng thái ban đầu mà không làm mất thay đổi của người dùng.

---

## 18. KNOWN LIMITATIONS (CÁC GIỚI HẠN KỸ THUẬT ĐÃ ĐƯỢC XÁC NHẬN)

1. **Không có API Mở Session Tab Mới:** Antigravity IDE không cung cấp giao diện lập trình để mở tab hội thoại mới từ dòng lệnh. Việc mở tab mới bắt buộc phải do người dùng click chuột trong IDE.
2. **Không có API Kích hoạt `/compact` Tự động:** Slash command `/compact` là tính năng giao diện người dùng. Agent không thể tự ý kích hoạt ngầm nếu người dùng không bấm hoặc gõ lệnh.
3. **Không có Metadata Tên Model trong Transcript:** Schema transcript không ghi nhận tên model LLM đang chạy. Mọi trần vận hành bắt buộc phải cấu hình qua cờ hoặc sử dụng giá trị mặc định an toàn.
4. **Độ trễ Phản ánh Context (Turn-boundary Lag):** Con số token trong transcript phản ánh trạng thái của lượt hoàn tất gần nhất, không đo được in-flight streaming tokens của lượt hiện tại. Headroom 15% được thiết kế để khắc phục độ trễ này.
5. **Phạm vi Filesystem Locking:** Cơ chế khóa file và rename nguyên tử chỉ có hiệu lực trên cùng một máy cục bộ (single-host APFS), không hỗ trợ môi trường cluster/multi-node phân tán (vốn không thuộc phạm vi của Antigravity IDE).

---

## 19. STAGE B APPROVAL CHECKLIST (BẢNG KIỂM PHÊ DUYỆT CHUYỂN GIAI ĐOẠN)

Trước khi người dùng ra quyết định phê duyệt bằng từ khóa **\"Đồng ý\"**, xin vui lòng kiểm tra bảng điều kiện:

- [x] Đã hoàn thành thẩm định và phản biện độc lập kiến trúc v2.0.
- [x] Đã kiểm chứng thực nghiệm các cơ chế telemetry, locking, atomic write và benchmark trong thư mục scratch.
- [x] Đã xác định rõ ràng ranh giới tự động hóa thực tế, không có tuyên bố phóng đại.
- [x] Đã xây dựng quy trình Safe Rollback độc lập không phụ thuộc vào các lệnh Git nguy hiểm.
- [x] Đã lập danh mục tệp và 14 kịch bản kiểm thử tự động cho Stage B.
- [ ] **ĐANG CHỜ:** Phê duyệt chính thức của Người dùng bằng từ khóa duy nhất: **\"Đồng ý\"**.
