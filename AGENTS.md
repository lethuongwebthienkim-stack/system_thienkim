# I. Core & Quality Principles
- Trả lời bằng Tiếng Việt có dấu. Tuân thủ KISS, YAGNI, DRY, Rails CoC. Không mở rộng scope. Ưu tiên sửa đổi nhỏ, dễ rollback.
- **System Design:** Correctness đến từ thiết kế đơn giản, invariant rõ, data model chặt. Ưu tiên timeout, fail-fast, backpressure ở hot path. Tránh job phục hồi nặng.
- **Clean-by-construction:** Đọc kỹ, bám pattern sẵn có. Tự review tĩnh (typing, null-safety, edge cases) trước bàn giao.

# II. Automation Harness & Safety Rules (Pre-Commit Guardrails)
- **Cấm tự ý chạy lint/unit test diện rộng.** Verification runtime/integration do tester phụ trách.
- **Self-Repair Limit:** Khi chạy compile tĩnh (`tsc --noEmit`) lỗi, Agent chỉ được phép tự sửa (retry) tối đa 02 lần. Lần thứ 3 vẫn lỗi bắt buộc dừng và hỏi ý kiến User.
- **CLI Sandbox:** Cấm chạy các lệnh tải file không rõ nguồn gốc (`curl`, `wget`) hoặc tự ý cài package lạ. Cài package mới phải đề xuất và so sánh bundle size trước.
- **Pre-Commit Verification:** Trước khi commit, Agent chỉ được chạy kiểm tra cú pháp cục bộ trên file thay đổi (`npx oxlint <file_path>` hoặc `eslint` file đó). Cấm quét toàn dự án.

# III. Audit & Root Cause Protocol (DARE)
- Trigger Audit khi gặp: fix, bug, lỗi, root cause, spec, optimize, refactor.
- Quy trình: Audit → Root Cause → Fix/Proposal → Verify. Bắt buộc trả lời 4/8 câu hỏi sau trước khi kết luận Root Cause (bắt buộc #1, #3, #6, #8):
  1. Triệu chứng quan sát là gì (expected vs actual)?
  2. Có tái hiện ổn định không? điều kiện tối thiểu?
  3. Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
  4. Tiêu chí pass/fail sau khi sửa?
- DARE (khi phức tạp): Audit (Phân tích lỗi) → Decompose (Vẽ Problem Graph dạng nhánh) → Analyze → Reflect → Execute (Thực thi kèm Thought/Action/Reflection).

# IV. Spec Mode & AskUser Quality Rules
- **Decision & AskUser:** Chỉ hỏi khi ảnh hưởng behavior/API/UX/scope/cost. Đề xuất 2-4 option thực sự khác nhau kèm Confidence % và Tradeoff ngắn.
- **Spec Tiers (Phân cấp Spec):**
  - **Tier 1 (Trivial - Sửa <3 file, logic cực đơn giản):** Miễn viết Spec. Tóm tắt 3 câu trong chat (Đổi gì, Tại sao, Ảnh hưởng gì) và làm luôn.
  - **Tier 2 (Medium - Luồng cục bộ):** Viết Spec rút gọn gồm: `# I. Primer`, `# IV. Proposal`, `# V. Files Impacted`, `# VII. Verification Plan`.
  - **Tier 3 (Complex - Schema, kiến trúc):** Viết Spec đầy đủ 12 mục La Mã lưu tại `.factory/docs` (quy định đánh số: La Mã -> Số -> Chữ cái).
- **Mermaid:** Chỉ dùng `flowchart` (luồng logic), `sequenceDiagram` (tương tác actor), `stateDiagram-v2` (lifecycle). Nhãn dưới 20 ký tự.

# V. Execution, DB & Data Ops Rules
- **Execution & Commit:** Đọc Next.js route từ URL localhost. Commit ngay khi xong kèm `.factory/docs` (nếu có). Âm báo bắt buộc khi xong task: `powershell -c "(New-Object -ComObject SAPI.SpVoice).Speak('Done, Sir.')"`.
- **Convex Real Data Ops:** Ưu tiên sửa dữ liệu thật qua query/mutation/action có sẵn. Xác định chính xác deployment, module, record trước khi patch tối thiểu. Không đổi schema để tiện thao tác tay. Đưa ra bằng chứng before/after rõ ràng.
- **7 Nguyên tắc DB Bandwidth:** Filter ở DB (không fetch ALL rồi lọc ở JS); Không N+1; Luôn có index phù hợp; Luôn limit + pagination (default 20, max 100–500); Chỉ lấy data cần thiết (projection); Load song song bằng Promise.all; Ưu tiên read guidelines ở `convex/_generated/ai/guidelines.md`.
