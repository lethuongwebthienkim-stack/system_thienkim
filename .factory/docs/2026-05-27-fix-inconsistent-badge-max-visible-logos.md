# I. Primer

## 1. TL;DR kiểu Feynman
- Ở trang quản lý, giao diện Preview (Xem trước) hiển thị tối đa 20 logo vì nó sử dụng giá trị mặc định của thuộc tính `maxVisible`.
- Ở ngoài Site thực (Trang chủ thực tế), phần hiển thị layout Badge lại truyền cứng `maxVisible={6}`, giới hạn chỉ cho phép tối đa 6 logo hiển thị và chạy hiệu ứng lặp đi lặp lại.
- Nếu danh sách đối tác thực tế có nhiều hơn 6 logo (ví dụ 10 cái), người dùng chỉ xem được 6 cái đầu tiên ở site thực trong khi ở preview vẫn xem được đầy đủ.
- Giải pháp: Loại bỏ giới hạn cứng `maxVisible={6}` ở ComponentRenderer trên site thực hoặc đổi thành `maxVisible={20}` để đồng bộ và nhất quán với Preview.

## 2. Elaboration & Self-Explanation
Badge layout của Home Component Partners hoạt động như một dải truyền (Marquee) tự động chạy vòng lặp vô hạn (Infinite Loop Auto-scroll) sử dụng CSS Animation. Để hiệu ứng chạy mượt mà và hiển thị đầy đủ danh sách, component `PartnersBadgeShared` cần có tham số `maxVisible` đủ lớn để cắt danh sách đối tác thực tế.
Tuy nhiên, có sự không nhất quán giữa hai nơi sử dụng:
- Trong `PartnersPreview.tsx` (sử dụng trong trang tạo/sửa admin): không truyền `maxVisible` cho `PartnersBadgeShared`, nên nó sử dụng giá trị mặc định là 20.
- Trong `ComponentRenderer.tsx` (render trên site thực): lại truyền cứng `maxVisible={6}`.
Sự không nhất quán này dẫn đến việc site thực chỉ hiển thị tối đa 6 đối tác rồi lặp lại, trong khi preview hiển thị đầy đủ đến 20 đối tác. Khi sửa đổi, ta sẽ loại bỏ hoặc tăng `maxVisible` lên 20 trên site thực để đồng bộ hoàn toàn với Preview.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Cửa hàng có 10 đối tác. Ở trang admin (Preview), dải logo chạy hiển thị đầy đủ 10 đối tác (từ 1 đến 10) sau đó quay lại 1. Nhưng ngoài trang chủ thực tế (Site thực), dải logo chỉ chạy từ 1 đến 6 rồi đột ngột quay trở lại 1, làm mất đi 4 đối tác cuối cùng (7, 8, 9, 10).
- **Phép so sánh ẩn dụ**: Giống như bạn đang chạy một máy chiếu slide hình ảnh. Trong phòng thử nghiệm (Preview), máy được thiết lập để chiếu hết cả 20 bức ảnh trong cuộn phim. Nhưng khi mang ra rạp chiếu phim (Site thực), người chiếu phim lại đặt giới hạn chỉ chiếu 6 bức đầu tiên rồi bắt đầu lại từ đầu, khiến khán giả bỏ lỡ các bức ảnh phía sau.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file [PartnersBadgeShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersBadgeShared.tsx):
  - Giá trị mặc định của `maxVisible` là 20: `maxVisible = 20`.
  - Biến `visibleItems` được cắt dựa trên `maxVisible`: `const visibleItems = items.slice(0, maxVisible)`.
- Đã kiểm tra file [PartnersPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersPreview.tsx):
  - Khi render `PartnersBadgeShared` tại `renderBadgeStyle`, thuộc tính `maxVisible` không được truyền, do đó sử dụng mặc định là 20.
- Đã kiểm tra file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx):
  - Tại dòng 3538: `PartnersBadgeShared` được gọi với `maxVisible={6}`. Đây là nguyên nhân trực tiếp làm giới hạn số lượng logo hiển thị ngoài site thực.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc)**: Việc gán cứng thuộc tính `maxVisible={6}` khi gọi `PartnersBadgeShared` trong `ComponentRenderer.tsx` khiến site thực bị giới hạn ở 6 logo. Trong khi đó, `PartnersPreview.tsx` không truyền thuộc tính này, dẫn đến nó nhận giá trị mặc định là 20 trong `PartnersBadgeShared.tsx`. Sự lệch pha này gây ra lỗi không nhất quán dữ liệu hiển thị (Data Inconsistency) giữa Preview và Site thực.
- **Counter-Hypothesis (Giả thuyết đối chứng)**: Nếu chúng ta không sửa `ComponentRenderer.tsx` mà sửa giá trị mặc định của `PartnersBadgeShared.tsx` thành 6, lỗi không nhất quán sẽ biến mất nhưng số lượng logo tối đa hiển thị sẽ bị giảm xuống còn 6 ở cả hai nơi, điều này vi phạm yêu cầu của người dùng là muốn xoay đủ hết logo (người dùng thử nghiệm với nhiều logo hơn 6). Do đó, giải pháp đúng đắn duy nhất là gỡ bỏ giới hạn `6` ở `ComponentRenderer.tsx` (hoặc nâng lên 20) để khớp với Preview.

# IV. Proposal (Đề xuất)
- **Đề xuất**: Thay đổi file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx), tìm đoạn render style `badge` của component `Partners` (dòng 3538) và thay thế `maxVisible={6}` thành `maxVisible={20}` hoặc loại bỏ hẳn để sử dụng giá trị mặc định 20 của `PartnersBadgeShared`. Để an toàn và đồng bộ tối đa với Grid Layout (cũng dùng `maxVisible={20}`), chúng ta sẽ gỡ bỏ `maxVisible={6}` hoặc thay thành `maxVisible={20}`. Chúng tôi đề xuất đổi thành `maxVisible={20}` để khớp hoàn toàn với các phần render layout khác ở ComponentRenderer.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx)
  - Vai trò hiện tại: Render các component của home-component ngoài trang chủ (site thực).
  - Thay đổi: Thay đổi thuộc tính `maxVisible={6}` thành `maxVisible={20}` (hoặc loại bỏ nó) khi gọi `PartnersBadgeShared` để đồng bộ hiển thị tối đa 20 logo giống như Preview.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ vị trí cần sửa trong file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx) (dòng 3524-3545).
2. Thực hiện thay thế `maxVisible={6}` thành `maxVisible={20}` trong file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx).
3. Chạy lệnh kiểm tra TypeScript `bunx tsc --noEmit` (giới hạn output bằng cách pipe qua Select-Object) để đảm bảo không lỗi kiểu dữ liệu.
4. Tiến hành commit thay đổi kèm theo file spec này.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm chứng tĩnh (Static Verification)**:
  - Chạy lệnh: `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để xác nhận toàn bộ dự án build thành công không lỗi cú pháp hoặc kiểu dữ liệu sau khi sửa.
- **Kiểm chứng thủ công (Manual Verification)**:
  - Yêu cầu Tester/User chạy môi trường phát triển local (hoặc deploy staging).
  - Thêm một Home Component loại Partners với layout là `Badge`, cấu hình danh sách đối tác có khoảng 8-10 logo.
  - Kiểm tra xem ở Preview có xoay vòng đầy đủ các logo hay không.
  - Kiểm tra xem ngoài Site thực (trang chủ) có hiển thị đầy đủ và xoay vòng tất cả logo hay không (vượt quá 6 cái cũ).

# VIII. Todo
- [ ] Thay đổi thuộc tính `maxVisible` từ `6` thành `20` trong [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx) cho layout `PartnersBadgeShared`.
- [ ] Chạy kiểm tra tĩnh TypeScript.
- [ ] Commit code và spec vào git local.
- [ ] Phát âm thanh báo hoàn thành task.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout `Badge` của Home Component Partners hiển thị và xoay vòng đầy đủ tối đa 20 logo ở cả trang Preview (trong Admin Edit/Create) và Site thực (ngoài Trang chủ).
- Dự án compile thành công bằng `bunx tsc --noEmit` mà không có bất kỳ lỗi nào liên quan đến thay đổi này.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Hầu như bằng không vì đây chỉ là thay đổi một tham số số lượng hiển thị tối đa của một component UI độc lập.
- **Hoàn tác (Rollback)**: `git checkout -- components/site/ComponentRenderer.tsx` để khôi phục lại trạng thái cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Việc thay đổi các layout khác của Partners (Grid, Marquee, Carousel...) không thuộc phạm vi xử lý của task này.
- Việc thay đổi các hiệu ứng animation CSS của Badge layout không thuộc phạm vi xử lý.

# XII. Open Questions (Câu hỏi mở)
- Không có câu hỏi mở nào.
