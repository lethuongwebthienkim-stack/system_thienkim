# Spec: Sửa lỗi mất ảnh sau vài giờ do dọn dẹp nháp của Partners, Gallery và TrustBadges

## I. Primer

### 1. TL;DR kiểu Feynman
- **Vấn đề**: Khi bạn tải ảnh lên cho Partners (Đối tác), Gallery (Thư viện) hay TrustBadges (Chứng nhận), ảnh hiển thị bình thường. Nhưng khoảng vài tiếng sau (khoảng 6 tiếng), ảnh tự dưng biến mất và báo lỗi `FileNotFound`.
- **Phát hiện mới**: Các ảnh mới tải lên có thể bị mất **ngay lập tức** sau khi người dùng chuyển trang hoặc làm mới trình duyệt (chưa tới 6 tiếng), trong khi các ảnh cũ đã tải lên trước đó thì chỉ bị mất sau đúng 6 tiếng.
- **Nguyên nhân**: 
  1. Khi tải ảnh lên, frontend đăng ký chúng làm ảnh nháp (draft). Khi người dùng tắt trang hoặc chuyển đi, hook `cleanupTrackedDrafts` tự động quét các ảnh nháp vừa tải trong phiên đó. Nếu ảnh đó không có liên kết (`fileReferences`) trong database, nó sẽ bị xóa **ngay lập tức** (chưa tới 6 tiếng).
  2. Các ảnh đã tải lên từ trước không nằm trong danh sách nháp của phiên hiện tại nên không bị xóa ngay lập tức, mà phải đợi sau 6 tiếng khi cron job quét qua toàn bộ database mới bị xóa.
  3. Khi lưu config, frontend cũ lọc bỏ thuộc tính `storageId` nên backend không thể tạo liên kết `fileReferences`.
- **Cách sửa**: 
  - Lưu và bảo toàn `storageId` cho toàn bộ các ảnh.
  - Tự động khôi phục `storageId` từ URL của ảnh cũ (lấy ID sau `/api/storage/`) khi người dùng mở trang chỉnh sửa (Edit) để tự động sửa chữa dữ liệu cũ mà không cần chạy migration.

### 2. Elaboration & Self-Explanation
Mỗi lần người dùng tải một ảnh lên qua admin dashboard, frontend sẽ gửi file đó lên Convex Storage. File này lúc đầu được coi là "ảnh nháp" (draft upload) và được đăng ký vào bảng `fileDraftUploads` để hệ thống biết nó tồn tại nhưng chưa chắc chắn có dùng hay không.
Khi người dùng bấm "Lưu thay đổi", backend Convex sẽ đồng bộ hóa các liên kết file (`fileReferences`) bằng cách quét qua toàn bộ cấu hình (`config`) của component đó. Nó tìm các thuộc tính `storageId` có trong cấu hình và tạo liên kết tương ứng.
Sau 6 tiếng, một tác vụ nền tự động (`cleanupExpiredDraftUploads`) sẽ quét qua bảng `fileDraftUploads`. Nếu một file nháp đã hết hạn mà không tìm thấy bất kỳ liên kết (`fileReferences`) nào trỏ tới nó, hệ thống sẽ thực hiện xóa vĩnh viễn file đó ra khỏi Convex Storage để tránh rác dữ liệu.
Vì code frontend của Partners, Gallery và TrustBadges khi submit form đã cố tình viết dạng: `.map(item => ({ url: item.url, link: item.link, name: item.name }))` (thiếu `storageId`), database lưu config không có `storageId`. Do đó backend không thể tạo `fileReferences`, dẫn đến việc file ảnh bị xóa nhầm khi tác vụ dọn dẹp chạy qua.
Chúng ta sẽ giải quyết triệt để bằng cách giữ lại trường `storageId` trong toàn bộ quá trình: lúc load config cũ lên, lúc so sánh thay đổi, và lúc lưu config mới.

### 3. Concrete Examples & Analogies
**Ví dụ cụ thể**:
Trước khi sửa:
Config của Partners được lưu:
```json
{
  "items": [
    { "name": "Google", "link": "https://google.com", "url": "https://proud-wolverine-123.convex.site/api/storage/5803236e-4b13-42f0-90bd" }
  ]
}
```
Sau khi sửa (có cơ chế tự phục hồi `storageId` từ URL):
```json
{
  "items": [
    { "name": "Google", "link": "https://google.com", "url": "https://proud-wolverine-123.convex.site/api/storage/5803236e-4b13-42f0-90bd", "storageId": "5803236e-4b13-42f0-90bd" }
  ]
}
```
**Hình ảnh đời thường**:
Giống như bạn gửi một chiếc vali ở tủ gửi đồ tự động của siêu thị (upload ảnh). Siêu thị đưa cho bạn một chiếc vé điện tử ghi số tủ (storageId).
Khi bạn thanh toán tại quầy và quyết định mua hàng (bấm Lưu), bạn cần xuất trình chiếc vé đó để quầy thu ngân dán nhãn xác nhận vali này là của bạn (tạo fileReference).
Nếu bạn không xuất trình vé, siêu thị sẽ coi chiếc vali trong tủ kia là đồ vô chủ bị bỏ quên, và cứ sau mỗi ca làm việc (6 tiếng), bảo vệ sẽ dọn dẹp và vứt chiếc vali đó đi (hệ thống cleanup xóa file).

## II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra logic tải ảnh và lưu ảnh của trang `edit` của Partners và phát hiện code frontend đang lọc bỏ thuộc tính `storageId` trước khi gọi mutation `update` của Convex.
- Đã đối chiếu với hàm `collectConfigStorageIds` trong Convex backend (`convex/homeComponents.ts`) và thấy backend chỉ tìm `record.storageId` trong config để tạo reference. Do config của Partners, Gallery và TrustBadges thiếu `storageId` nên backend không tạo reference.
- Đã xác định cron job `cleanupExpiredDraftUploads` định kỳ 6 tiếng sẽ xóa toàn bộ các file ảnh không có reference này.
- Các route bị ảnh hưởng tương tự:
  - Create Partners: `app/admin/home-components/create/partners/page.tsx`
  - Edit Gallery: `app/admin/home-components/gallery/[id]/edit/page.tsx`
  - Create Gallery: `app/admin/home-components/create/gallery/page.tsx`
  - Edit TrustBadges: `app/admin/home-components/trust-badges/[id]/edit/page.tsx`
  - Create TrustBadges: `app/admin/home-components/create/trust-badges/page.tsx`

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**: Code frontend khi submit config lên database cho 3 component `Partners`, `Gallery`, `TrustBadges` đã map và loại bỏ thuộc tính `storageId` của các item ảnh, đồng thời khi load config cũ lên cũng loại bỏ `storageId`. Thiếu `storageId` trong `config` dẫn đến backend không tạo `fileReferences`, kích hoạt cơ chế dọn dẹp tự động (cleanup) của Convex xóa mất file ảnh sau 6 tiếng.
  - Độ tin cậy nguyên nhân gốc: **High** (Có evidence rõ ràng từ code backend `collectConfigStorageIds` và cron job `cleanupExpiredDraftUploads` kết hợp với code mapping ở client).
- **Giả thuyết đối chứng**:
  - Giả thuyết: Lỗi do Convex storage bị lỗi mất file ngẫu nhiên?
    - Đối chứng: Không đúng, lỗi chỉ xảy ra sau một khoảng thời gian nhất định (thường là 6 tiếng TTL của draft file) và chỉ xảy ra với các ảnh được tải lên ở các component này, trong khi các ảnh của `post` hay `product` (được lưu `storageId` chính xác và có `fileReferences`) thì không bao giờ bị mất.

## IV. Proposal (Đề xuất)
1. Cập nhật logic load dữ liệu (`useEffect` ban đầu) ở các trang Edit để map và giữ lại `storageId` từ config cũ.
2. Thêm hàm helper `extractStorageIdFromUrl` để tự động khôi phục `storageId` từ URL Convex của các ảnh cũ được tải lên trước đây mà chưa có `storageId` trong database.
3. Cập nhật hàm `normalizeItemsForCompare` hoặc logic so sánh (nếu có) để bao gồm `storageId` nhằm tránh việc so sánh bị sai lệch hoặc không nhận diện được thay đổi khi đổi ảnh.
4. Cập nhật logic submit (`handleSubmit` hoặc `onSubmit`) ở tất cả 6 trang (create & edit của Partners, Gallery, TrustBadges) để map cả `storageId` vào cấu trúc `items` gửi lên Convex backend.

## V. Files Impacted (Tệp bị ảnh hưởng)
1. **Sửa**: [app/admin/home-components/partners/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/[id]/edit/page.tsx)
   - Sửa: Dòng load dữ liệu trong `useEffect` để map `storageId` kết hợp khôi phục từ URL.
   - Sửa: Dòng so sánh trong `normalizeItemsForCompare` để thêm `storageId`.
   - Sửa: Dòng submit form trong `handleSubmit` để map `storageId`.
2. **Sửa**: [app/admin/home-components/create/partners/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/create/partners/page.tsx)
   - Sửa: Dòng submit form trong `onSubmit` để map `storageId`.
3. **Sửa**: [app/admin/home-components/gallery/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/gallery/[id]/edit/page.tsx)
   - Sửa: Dòng load dữ liệu trong `useEffect` để map `storageId` kết hợp khôi phục từ URL.
   - Sửa: Dòng submit form trong `handleSubmit` để map `storageId`.
4. **Sửa**: [app/admin/home-components/create/gallery/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/create/gallery/page.tsx)
   - Sửa: Dòng submit form trong `onSubmit` để map `storageId`.
5. **Sửa**: [app/admin/home-components/trust-badges/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/trust-badges/[id]/edit/page.tsx)
   - Sửa: Dòng load dữ liệu trong `useEffect` để map `storageId` kết hợp khôi phục từ URL.
   - Sửa: Dòng submit form trong `handleSubmit` để map `storageId`.
6. **Sửa**: [app/admin/home-components/create/trust-badges/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/create/trust-badges/page.tsx)
   - Sửa: Dòng submit form trong `onSubmit` để map `storageId`.

## VI. Execution Preview (Xem trước thực thi)
1. Sửa logic load/save của Partners Edit Page và Partners Create Page.
2. Sửa logic load/save của Gallery Edit Page và Gallery Create Page.
3. Sửa logic load/save của TrustBadges Edit Page và TrustBadges Create Page.
4. Chạy kiểm tra kiểu tĩnh bằng TypeScript.

## VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra compile TypeScript: Chạy `bunx tsc --noEmit` để đảm bảo code compile thành công không có lỗi type.

## VIII. Todo
- [x] Tạo file spec `.factory/docs/2026-05-27-spec-fix-partners-and-gallery-orphaned-images-after-cleanup.md`.
- [ ] Sửa file `app/admin/home-components/partners/[id]/edit/page.tsx`.
- [ ] Sửa file `app/admin/home-components/create/partners/page.tsx`.
- [ ] Sửa file `app/admin/home-components/gallery/[id]/edit/page.tsx`.
- [ ] Sửa file `app/admin/home-components/create/gallery/page.tsx`.
- [ ] Sửa file `app/admin/home-components/trust-badges/[id]/edit/page.tsx`.
- [ ] Sửa file `app/admin/home-components/create/trust-badges/page.tsx`.
- [ ] Chạy check TypeScript `bunx tsc --noEmit` để xác thực.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cấu hình của Partners, Gallery, và TrustBadges được lưu trữ trong database chứa đầy đủ thuộc tính `storageId` cho từng item ảnh.
- Khi chỉnh sửa và lưu lại, thuộc tính `storageId` cũ không bị mất đi.
- Dự án build thành công không bị lỗi biên dịch TypeScript.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Rất thấp, do `storageId` chỉ là thuộc tính tùy chọn bổ sung trong config JSON. Đối với các dữ liệu cũ không có `storageId`, code vẫn chạy bình thường (fallback).
- **Hoàn tác**: Sử dụng `git checkout` để khôi phục trạng thái cũ của các file đã sửa đổi.

## XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào các component khác không lưu trữ danh sách ảnh dạng array.
- Không sửa đổi logic dọn dẹp của Convex backend.
