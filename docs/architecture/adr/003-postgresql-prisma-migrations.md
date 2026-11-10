# ADR-003: PostgreSQL + Prisma, migration bằng `prisma migrate`

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: Task 3.1, Task 5.2, class diagram (`docs/diagrams/class-domain.puml`)

## Bối cảnh

Đề bài bắt buộc PostgreSQL. Hệ thống cần transaction cho tạo đơn/trừ kho, ràng buộc duy nhất cho
`Payment.idempotencyKey`, và database phải tái tạo được bằng migration/seed ở local, CI và
production.

## Quyết định

- ORM: **Prisma**. Schema khai báo trong `apps/api/prisma/schema.prisma`, bám theo class diagram.
- Thay đổi schema: `prisma migrate dev --name <tên>` ở local, commit thư mục `prisma/migrations`.
- Production và CI: chỉ chạy `prisma migrate deploy` (áp dụng migration đã commit, không sinh
  migration mới, không reset dữ liệu).
- Seed: `prisma db seed` idempotent (dùng `upsert`), chạy lại nhiều lần không nhân đôi dữ liệu.
- Tiền tệ lưu bằng số nguyên VNĐ (`Int`) để tránh sai số dấu phẩy động.
- Ràng buộc nghiệp vụ quan trọng đặt ở database: `@unique` cho `email`, `idempotencyKey`;
  khóa ngoại cho mọi quan hệ trong class diagram.

## Hệ quả

- Lịch sử migration nằm trong Git, review được qua PR như mã nguồn.
- Kiểu TypeScript sinh tự động từ schema, giảm lỗi lệch tên cột giữa API và database.
- Migration chỉ được thêm, không sửa migration đã merge. Thay đổi phá vỡ (đổi tên/xóa cột) làm
  theo hai bước: thêm cột mới và chuyển dữ liệu, rồi mới xóa cột cũ ở bản phát hành sau, để
  rollback ứng dụng không làm hỏng database.

## Phương án đã cân nhắc

- **TypeORM:** quen thuộc với NestJS nhưng migration sinh tự động dễ lệch, kiểu trả về kém chặt.
- **SQL thuần + node-pg-migrate:** kiểm soát tốt nhưng tốn công viết truy vấn và kiểu dữ liệu.
