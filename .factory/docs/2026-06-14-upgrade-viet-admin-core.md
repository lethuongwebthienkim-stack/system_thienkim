# I. Primer

## 1. TL;DR kiểu Feynman
* **Mục tiêu chính**: Nâng cấp toàn bộ mã nguồn của dự án này lên phiên bản mới nhất từ kho mã nguồn chung (Viet Admin Core) mà không làm mất hoặc hỏng dữ liệu hiện tại trên Convex DB.
* **Cách thực hiện Phase 1 (Code)**: Sử dụng cơ chế Git Squash Merge để kéo toàn bộ code mới từ Core đè hoàn toàn lên code cũ. Chạy kiểm tra lỗi kiểu dữ liệu (`tsc`) và cú pháp (`oxlint`) để đảm bảo code sạch trước khi lưu lại (commit).
* **Cách thực hiện Phase 2 (Dữ liệu)**: Sử dụng các công cụ quét cấu trúc dữ liệu có sẵn để xem cơ sở dữ liệu cũ có bị thiếu trường thông tin nào so với code mới hay không. Nếu thiếu, dùng các hàm cập nhật (backfill) có sẵn để bổ sung đầy đủ giá trị mặc định cho dữ liệu cũ.

## 2. Elaboration & Self-Explanation
Hệ thống Viet Admin được thiết kế theo mô hình "Một Core, nhiều DB khách hàng". Khi Core được cải tiến, chúng ta cần đưa các cải tiến đó vào dự án này. 
Để làm việc này an toàn:
* Chúng ta không merge thủ công từng file vì dễ sót và gây lỗi. Chúng ta ép Git nhận toàn bộ code mới từ Core (`checkout --theirs`).
* Sau khi code mới được áp dụng, trình biên dịch TypeScript và Linter sẽ quét toàn bộ dự án để tìm và sửa các lỗi không tương thích.
* Cơ sở dữ liệu Convex cũ vẫn giữ nguyên, nhưng cấu trúc dữ liệu (Schema) của code mới có thể yêu cầu thêm các trường mới. Chúng ta chạy một hàm quét dữ liệu (`scanDataContracts`) để phát hiện các bản ghi cũ thiếu trường mới, sau đó kích hoạt các hàm xử lý dữ liệu đã viết sẵn trong code mới để bổ sung tự động (backfill). Điều này đảm bảo dữ liệu luôn nhất quán mà không cần can thiệp thủ công vào cơ sở dữ liệu.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Code Core mới thêm tính năng ẩn sản phẩm bằng cách đọc trường `isArchived` (boolean) trong bảng `products`. Cơ sở dữ liệu cũ của chúng ta chưa có trường này. Khi code mới chạy, nó sẽ đọc sản phẩm và bị lỗi vì trường này nhận giá trị `undefined`. Hàm backfill sẽ quét qua tất cả sản phẩm cũ và ghi thêm trường `isArchived: false` vào, giúp code mới hoạt động trơn tru.
* **Ẩn dụ**: Việc này giống như bạn nâng cấp phần mềm trò chơi trên điện thoại. Bản cập nhật mới bổ sung thêm tính năng lưu trữ thành tích trực tuyến. Trò chơi sau khi cài đặt mới sẽ tự động quét danh sách thành tích cũ ngoại tuyến của bạn và đồng bộ (backfill) chúng lên máy chủ để bạn không bị mất tiến trình chơi game.

# II. Audit Summary (Tóm tắt kiểm tra)
* Trạng thái Git hiện tại: Working tree sạch, ở nhánh `master`.
* Môi trường Convex: Đã kiểm tra `.env.local`, cấu hình trỏ tới `CONVEX_DEPLOYMENT=dev:incredible-hamster-348` (thuộc dự án `system-thienkim`). Đây đúng là DB cần nâng cấp.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân cần nâng cấp)**: Mã nguồn hiện tại của dự án đã cũ, thiếu các tối ưu và tính năng mới từ kho Core chung.
* **Giả thuyết đối chứng**: Nếu nâng cấp bằng cách merge thông thường hoặc sửa code thủ công từng phần, khả năng cao sẽ xảy ra conflict nghiêm trọng ở các file cấu hình lớn hoặc mismatch giữa API Convex (schema) và Client. Sử dụng Squash Merge + `--theirs` là giải pháp an toàn và nhanh nhất để đồng bộ 100% code Core.

# IV. Proposal (Đề xuất)
Thực hiện đúng quy trình 2 Phase của người dùng:
1. **Phase 1**: Thêm remote Core, chạy Squash Merge, giải quyết triệt để lỗi type và lint, commit code.
2. **Phase 2**: Quét Contract dữ liệu Convex, chạy backfill qua các mutation/action có sẵn để xử lý tất cả các trường missing/recommended.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa/Thêm**: Hầu hết các file trong codebase (app, components, convex, lib, types, package.json...) do đồng bộ hoàn toàn từ Core sang.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm remote tạm: `git remote add core-update "E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs"`
2. Fetch dữ liệu: `git fetch core-update`
3. Merge: `git merge --squash core-update/main --allow-unrelated-histories`
4. Ghi đè toàn bộ: `git checkout --theirs .` và `git add .`
5. Cài đặt dependencies: `bun install`
6. Kiểm tra lỗi kiểu: `bunx tsc --noEmit 2>&1 | Select-Object -First 30`
7. Sửa lỗi linter: `bunx oxlint --type-aware --type-check --fix` cho tới khi sạch.
8. Commit code.
9. Xóa remote tạm.
10. Chạy thử `bun run dev` kiểm tra runtime.
11. Quét DB Convex và backfill dữ liệu thiếu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Type Check**: `bunx tsc --noEmit` phải trả về 0 lỗi.
* **Linter**: `bunx oxlint` phải chạy thành công không có lỗi/cảnh báo chưa được sửa.
* **Runtime**: Khởi động app thành công, các route admin và client hoạt động tốt.
* **DB Verification**: `dataManager:scanDataContracts` trả về 0 issue.

# VIII. Todo
* [ ] Thêm remote `core-update` và fetch.
* [ ] Squash merge và checkout `--theirs .`.
* [ ] Chạy `bun install` để đồng bộ node_modules.
* [ ] Kiểm tra lỗi type (`tsc --noEmit`), sửa nếu có.
* [ ] Kiểm tra và sửa lỗi lint (`oxlint --fix`).
* [ ] Commit code đồng bộ Core mới.
* [ ] Dọn dẹp remote tạm.
* [ ] Khởi chạy local server `bun run dev` để verify runtime.
* [ ] Quét DB Convex để tìm missing/recommended fields.
* [ ] Chạy các mutation backfill tương ứng để chuẩn hóa dữ liệu.
* [ ] Quét lại để xác nhận 0 issue dữ liệu.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Dự án chạy trên code mới hoàn toàn mà không có lỗi compile (Type/Lint).
* Không có dữ liệu cũ nào bị hỏng hay mất mát trên Convex DB.
* Quá trình scan contract dữ liệu báo cáo 0 lỗi.
* Các surface Products, Home Components, Settings render đúng.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Nếu code Core bị lỗi nghiêm trọng hoặc không tương thích ngược.
* **Hoàn tác**: Sử dụng `git reset --hard HEAD` trước khi commit hoặc rollback về commit gốc trước khi nâng cấp. Do git working tree sạch, việc rollback rất đơn giản.

# XI. Out of Scope (Ngoài phạm vi)
* Không tự viết thêm tính năng, không tự thay đổi schema DB ngoài các hàm backfill có sẵn trong codebase.

# XII. Open Questions (Câu hỏi mở)
* Không có.
