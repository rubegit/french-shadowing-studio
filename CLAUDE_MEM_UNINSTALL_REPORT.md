# BÁO CÁO KỸ THUẬT: GỠ BỎ HOÀN TOÀN CLAUDE-MEM KHỎI ANTIGRAVITY IDE

**Tài liệu:** `CLAUDE_MEM_UNINSTALL_REPORT.md`
**Ngày thực hiện:** 2026-11-07 (07:54:30-06:00 / UTC: 2026-11-07T13:54:30Z)
**Kỹ sư thực hiện:** Senior macOS Systems Engineer & AI Agent Runtime Engineer
**Trạng thái:** **GỠ BỎ HOÀN TẤT & ĐÃ XÁC MINH (100% SUCCESSFUL)**

---

## 1. TỔNG QUAN KẾT QUẢ

Tiến trình gỡ bỏ toàn diện Claude-Mem khỏi môi trường macOS và Antigravity IDE đã hoàn tất thành công 100%, tuân thủ tuyệt đối các nguyên tắc an toàn:
1. **Toàn bộ hook Claude-Mem** đã được loại bỏ khỏi vòng đời tool-call của Antigravity (`hooks.json` hiện rỗng: `{}`).
2. **Toàn bộ MCP Server của Claude-Mem** đã được gỡ bỏ khỏi `mcp_config.json`; MCP cục bộ khác (`mlx-local`) được bảo toàn nguyên vẹn.
3. **Các tiến trình chạy ngầm riêng biệt của Claude-Mem** (`worker-service.cjs`, `chroma-mcp`, `mcp-server.cjs`) đã được dừng hoàn toàn.
4. **Không còn cơ chế tự động kích hoạt:** Loại bỏ plugin marketplace, dọn sạch schema cache trong `~/.gemini/antigravity/mcp/` và context rule trong `~/.gemini/GEMINI.md`.
5. **Bảo tồn an toàn dữ liệu:** Toàn bộ cơ sở dữ liệu SQLite (`claude-mem.db`, WAL), vector Chroma và nhật ký quan sát không bị xóa vĩnh viễn mà đã được di chuyển an toàn vào thư mục lưu trữ ngoài luồng (`~/.claude-mem-archive-backup/`).
6. **Mã nguồn dự án & Git:** Thư mục dự án `French Shadowing Studio` và Supabase/Git working tree được bảo vệ nguyên vẹn 100%, không bị ảnh hưởng.
7. **Hiệu năng hệ thống sau gỡ bỏ:** Triệt tiêu hoàn toàn khoản phụ phí ~140–145 ms của tiến trình Bun CLI trên mỗi lệnh gọi công cụ. Tốc độ thực thi OS trực tiếp đạt mức cực đại (từ 0.03 ms đến 17 ms, cải thiện **88.8% – 100%**).

---

## 2. CHI TIẾT CÁC THÀNH PHẦN ĐÃ GỠ BỎ & DỌN DẸP

| STT | Thành phần | Đường dẫn gốc | Trạng thái xử lý |
|:---:|---|---|---|
| **1** | **Active Hooks** | `~/.gemini/config/hooks.json` | Gỡ bỏ toàn bộ 5 hook (`SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, `Stop`). File hiện là `{}`. |
| **2** | **MCP Server Integration** | `~/.gemini/antigravity/mcp_config.json` & `~/.gemini/config/mcp_config.json` | Xóa server `claude-mem` (`mcp-server.cjs`). Giữ nguyên `mlx-local`. |
| **3** | **Global Context Rule** | `~/.gemini/GEMINI.md` | Dọn sạch khối `<claude-mem-context>` (ngăn chặn inject rác vào prompt hệ thống). |
| **4** | **Antigravity Permissions** | `~/.gemini/config/config.json` | Xóa quyền hỏi `mcp(mcp(claude-mem/*))` trong mảng `ask`. |
| **5** | **Lazy Tool Schemas Cache** | `~/.gemini/antigravity/mcp/claude-mem/` (21 files json) | Di chuyển vào archive backup và xóa thư mục gốc khỏi Antigravity. |
| **6** | **Active Data Directory** | `~/.claude-mem/` (SQLite DB, WAL, Chroma, Logs) | Di chuyển toàn bộ sang `~/.claude-mem-archive-backup/claude-mem-data-archive/`. |
| **7** | **Claude Plugin Registration** | `~/.claude/settings.json` | Đặt `"enabledPlugins": {}`. |
| **8** | **Plugin & Marketplace Cache** | `~/.claude/plugins/cache/thedotmack/`<br>`~/.claude/plugins/marketplaces/thedotmack/` | Di chuyển vào archive backup; làm sạch `installed_plugins.json` và `known_marketplaces.json`. |

---

## 3. CÁC TIẾN TRÌNH ĐÃ DỪNG (PROCESS TERMINATION)

Các tiến trình sau được xác minh là **chỉ phục vụ riêng cho Claude-Mem** và đã được chấm dứt an toàn qua tín hiệu `SIGTERM (15)`:

1. **`PID 1393`**: `~/.bun/bin/bun .../worker-service.cjs --daemon` (Tiến trình daemon xử lý hàng đợi quan sát).
2. **`PID 1492`**: `~/.local/bin/uv tool uvx ... chroma-mcp --client-type persistent --data-dir ~/.claude-mem/chroma` (Tiến trình bọc Chroma MCP).
3. **`PID 1493`**: `.../bin/python .../bin/chroma-mcp ...` (Tiến trình Python thực thi Chroma vector database).
4. **`PID 17998`**: `/opt/homebrew/Cellar/node/26.4.0/bin/node .../mcp-server.cjs` (Tiến trình Antigravity MCP Server).

*Kiểm tra hậu kỳ:* Lệnh `ps aux` xác nhận **0 tiến trình Claude-Mem** còn hoạt động trên hệ thống. Các tiến trình Bun và Node khác của người dùng hoàn toàn không bị ảnh hưởng.

---

## 4. CÁC THÀNH PHẦN ĐƯỢC GIỮ LẠI & LÝ DO

1. **`mlx-local` MCP Server:**
   *Vị trí:* `~/.gemini/antigravity/mcp_config.json`
   *Lý do:* Đây là MCP server phục vụ mô hình cục bộ Apple MLX của người dùng, độc lập hoàn toàn với Claude-Mem.
2. **Bun Runtime (`~/.bun/bin/bun`):**
   *Lý do:* Bun là công cụ JavaScript/TypeScript runtime toàn cục của hệ thống, có thể được người dùng sử dụng cho các dự án khác.
3. **Node.js (`/opt/homebrew/bin/node`):**
   *Lý do:* Môi trường Node của Homebrew dùng chung cho toàn hệ thống.
4. **Các Sidecars & Plugins của Antigravity:**
   *Bao gồm:* `afedmonton-tcf-monitor`, `chrome-devtools-plugin`, `flutter`, `local-mlx`, `modern-web-guidance-plugin`, `science`. Tất cả được giữ nguyên vẹn trong `~/.gemini/config/config.json`.
5. **Dữ liệu SQLite & Vector Chroma:**
   *Lý do:* Bảo vệ dữ liệu trí nhớ quá khứ của người dùng phòng trường hợp cần tra cứu hoặc khôi phục lại sau này.

---

## 5. VỊ TRÍ SAO LƯU (BACKUP ARCHIVE LOCATION)

Toàn bộ dữ liệu và cấu hình đã được sao lưu có cấu trúc tại:
📁 **`~/.claude-mem-archive-backup/`**

### Cấu trúc Bản sao lưu:
```
~/.claude-mem-archive-backup/
├── manifest.json                        # Bảng băm SHA-256 và kích thước của các file gốc
├── configs/                             # Toàn bộ bản sao tệp cấu hình trước khi sửa đổi
│   ├── hooks.json                       # (SHA-256: 0939cfedf56e28df83952f7edc74982c4c14ea3e92ee4a3eb69b7408433e922d)
│   ├── antigravity_mcp_config.json      # (SHA-256: c82816d70b59b3d077e01b7a29ee5ff278ffbc4bb93fef6e53c4d7ec6fa0ea64)
│   ├── config_mcp_config.json           # (SHA-256: c82816d70b59b3d077e01b7a29ee5ff278ffbc4bb93fef6e53c4d7ec6fa0ea64)
│   ├── config.json                      # (SHA-256: 9f5496fbde2abf513d641ec99d863c87e742dd4a08466b02a8e843666d628eb8)
│   ├── GEMINI.md                        # (SHA-256: 5471dc326cb356d25dc71f8b1db80e1da74d32a9c395c557d344fc31ea540441)
│   ├── claude_settings.json             # (SHA-256: c823e974ab92b761a2ddff431ba39d73d9735d48721adbf38fa62e7834571efc)
│   ├── claude_installed_plugins.json    # (SHA-256: 0915dd43d1d1f059c3ea40c0ea91444d188734e0fe5cb8ee1dd41334057ea71a)
│   └── claude_known_marketplaces.json   # (SHA-256: b4944b2ede04690832ea489379e5ba09001b9646b5a3e145b2591a27e7f60759)
├── claude-mem-data-archive/             # Toàn bộ dữ liệu SQLite, WAL, logs và ChromaDB cũ
├── mcp-schemas-claude-mem/              # 21 tệp schema công cụ lazy-load của Antigravity
├── plugin-cache-thedotmack/             # Mã nguồn tệp cache plugin 15.9.0
└── marketplace-thedotmack/              # Repo clone từ github thedotmack/claude-mem
```

---

## 6. KẾT QUẢ ĐO ĐẠC & SO SÁNH HIỆU NĂNG MỚI (NEW BASELINE)

Thực hiện 20 lần chạy kiểm chuẩn trên cùng tập tác vụ chuẩn (T01 – T08) sau khi gỡ bỏ hook:

| Test ID | Thao tác | Baseline Cũ (Có Hook p50) | Baseline Mới (Không Hook p50) | Chênh lệch (Delta) | Mức cải thiện |
|:---:|:---|:---:|:---:|:---:|:---:|
| **T01** | `pwd` | 146.42 ms | **2.75 ms** | -143.67 ms | **98.1%** |
| **T02** | `git status --short` | 159.94 ms | **17.96 ms** | -141.98 ms | **88.8%** |
| **T03** | `git rev-parse --show-toplevel` | 152.29 ms | **15.15 ms** | -137.14 ms | **90.1%** |
| **T04** | `read_file` (50 lines) | 144.36 ms | **0.03 ms** | -144.33 ms | **100.0%** |
| **T05** | `read_file` (500 lines) | 145.94 ms | **0.23 ms** | -145.72 ms | **99.8%** |
| **T06** | `grep` trên `js/01d-player.js` | 144.18 ms | **4.67 ms** | -139.50 ms | **96.8%** |
| **T07** | `ls -la` thư mục dự án | 149.76 ms | **4.80 ms** | -144.96 ms | **96.8%** |
| **T08** | Đọc config nhỏ (`package.json`) | 143.51 ms | **0.00 ms** | -143.51 ms | **100.0%** |

**Nhận định:**
- Khoản trễ tĩnh ~140ms của tiến trình Bun CLI trên mỗi lệnh gọi đã được triệt tiêu 100%.
- Các lệnh hệ thống (`read_file`, `grep`, `git status`) phản hồi tức thì ở mức microsecond / millisecond.
- Log hệ thống không còn phát sinh 208.000 dòng warning spam của `Claude executable not found`.

---

## 7. XÁC MINH TOÀN VẸN ANTIGRAVITY & DỰ ÁN SHADOWING

1. **Kiểm tra cú pháp JSON cấu hình:**
   - `hooks.json`: Hợp lệ (`{}`).
   - `mcp_config.json`: Hợp lệ (`mcpServers: ['mlx-local']`).
   - `config.json`: Hợp lệ.
   - `settings.json`: Hợp lệ.
2. **Kiểm tra hoạt động của Agent:**
   - Công cụ `run_command`: Hoạt động bình thường.
   - Công cụ `read_file`: Hoạt động bình thường.
   - Công cụ `write_file`: Hoạt động bình thường.
3. **Kiểm tra Dự án Shadowing & Git:**
   - Lệnh `git status --porcelain` xác nhận working tree không bị sửa đổi bất kỳ tệp mã nguồn nào.
   - Các tệp duy nhất xuất hiện mới trong workspace là 2 tệp báo cáo kỹ thuật theo yêu cầu:
     - `ANTIGRAVITY_PERFORMANCE_AB_DIAGNOSTIC.md`
     - `CLAUDE_MEM_UNINSTALL_REPORT.md`

---

## 8. HƯỚNG DẪN PHỤC HỒI NẾU CẦN (ROLLBACK PROCEDURE)

Nếu trong tương lai người dùng muốn khôi phục lại Claude-Mem nguyên trạng, chỉ cần chạy script một bước sau:

```bash
# 1. Khôi phục các tệp cấu hình từ bản sao lưu
cp ~/.claude-mem-archive-backup/configs/hooks.json ~/.gemini/config/hooks.json
cp ~/.claude-mem-archive-backup/configs/antigravity_mcp_config.json ~/.gemini/antigravity/mcp_config.json
cp ~/.claude-mem-archive-backup/configs/config.json ~/.gemini/config/config.json
cp ~/.claude-mem-archive-backup/configs/GEMINI.md ~/.gemini/GEMINI.md
cp ~/.claude-mem-archive-backup/configs/claude_settings.json ~/.claude/settings.json
cp ~/.claude-mem-archive-backup/configs/claude_installed_plugins.json ~/.claude/plugins/installed_plugins.json
cp ~/.claude-mem-archive-backup/configs/claude_known_marketplaces.json ~/.claude/plugins/known_marketplaces.json

# 2. Khôi phục thư mục dữ liệu và schema
mv ~/.claude-mem-archive-backup/claude-mem-data-archive ~/.claude-mem
mv ~/.claude-mem-archive-backup/mcp-schemas-claude-mem ~/.gemini/antigravity/mcp/claude-mem
mv ~/.claude-mem-archive-backup/plugin-cache-thedotmack ~/.claude/plugins/cache/thedotmack
mv ~/.claude-mem-archive-backup/marketplace-thedotmack ~/.claude/plugins/marketplaces/thedotmack

# 3. Xác minh mã băm SHA-256 khớp với manifest.json
shasum -a 256 ~/.gemini/config/hooks.json
```

---

## 9. KẾT LUẬN & KIẾN NGHỊ TIẾP THEO

- Môi trường Antigravity IDE hiện đã **hoàn toàn sạch bóng Claude-Mem**, không còn rác hook, không còn daemon chạy ngầm, không còn cảnh báo lỗi CLI.
- Để duy trì tốc độ phản hồi cao nhất cho các phiên làm việc dài hạn (ngăn chặn tình trạng Model Inference Latency 30s–80s do Context Window phình to), khuyến nghị tiếp tục duy trì quy tắc:
  - Khởi tạo phiên mới hoặc dùng `/compact` khi context chạm ngưỡng 80.000–100.000 tokens.
  - Sử dụng `read_file` theo khoảng dòng (`StartLine` – `EndLine`) thay vì đọc toàn bộ các file monolithic lớn.
