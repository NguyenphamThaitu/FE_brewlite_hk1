# ADR-009: Frontend là web Next.js mobile-first, không làm PWA

- Trạng thái: Accepted (cần lưu bằng chứng xác nhận của giảng viên, rủi ro R6)
- Ngày: 2026-11-13
- Làm rõ: ADR-001 (dòng "`apps/web`: Next.js, mobile-first/PWA")
- Liên quan: NFR-12 trong `srs.md` (Hỗ trợ PWA), [`scope-assumptions-risks.md`](../../requirements/scope-assumptions-risks.md) mục 1.3, mục 2 và R6

## Bối cảnh

Đề bài yêu cầu frontend dùng Next.js "theo hướng mobile-first/PWA" và không được thay thế Next.js,
NestJS, PostgreSQL. Trong repo hiện có ba thông tin chưa thống nhất:

- `scope-assumptions-risks.md` xếp "ứng dụng mobile native và PWA" vào out-of-scope, theo yêu cầu
  của giảng viên, và ghi rủi ro R6 "giảng viên chưa xác nhận việc bỏ mobile/PWA".
- `srs.md` vẫn có NFR-12 "Hỗ trợ PWA" mức Should, tiêu chí: có manifest, service worker, xem menu
  khi mất mạng.
- ADR-001 ghi `apps/web` là "mobile-first/PWA".

Code `apps/web` hiện không có web app manifest hay service worker.

## Quyết định

- `apps/web` là ứng dụng web Next.js **responsive theo hướng mobile-first**: bố cục thiết kế cho màn
  hình điện thoại trước, chạy trên trình duyệt di động và máy tính.
- **Không làm PWA** trong Assignment 2: không có manifest, service worker, cache offline hay cài đặt
  lên màn hình chính.
- Next.js vẫn là framework frontend, nên không vi phạm quy định "không thay thế ba thành phần bắt buộc".

## Hệ quả

- Giảm khối lượng cho hai Sprint, tập trung vào luồng bắt buộc Xem menu → Đặt đơn → Thanh toán →
  Theo dõi đơn.
- Tránh lỗi khó phát hiện của service worker: trình duyệt giữ bản cache cũ của giao diện hoặc dữ liệu
  menu sau mỗi lần deploy.
- Người dùng không cài được ứng dụng lên màn hình chính và không xem được menu khi mất mạng.
- NFR-12 trong `srs.md` cần chuyển sang **Won't** cho khớp với tài liệu phạm vi. Việc này thuộc người
  phụ trách SRS/NFR, ghi lại ở đây để nhóm chốt.
- Rủi ro R6: cần lưu tin nhắn/email xác nhận của giảng viên vào repo như tài liệu phạm vi đã nêu.
- Nếu sau này làm PWA: thêm `app/manifest.ts` của Next.js và một service worker chỉ cache khung giao
  diện và `GET /products`, đồng thời viết ADR mới thay thế ADR này.

## Phương án đã cân nhắc

- **Làm PWA đầy đủ** (manifest, service worker qua thư viện như Serwist): đáp ứng NFR-12, nhưng tốn
  thời gian, thêm rủi ro cache sai sau deploy, và đã nằm ngoài phạm vi đã chốt.
- **Chỉ thêm manifest, không có service worker**: không đạt tiêu chí "xem menu khi mất mạng" của
  NFR-12, nên vẫn không đáp ứng yêu cầu mà còn tạo ấn tượng sai là đã có PWA.
