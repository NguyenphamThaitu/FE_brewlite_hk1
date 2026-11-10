# ADR-003: PostgreSQL + Prisma, migration bằng `prisma migrate`

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: NFR-14, NFR-16, Task 5.2, class diagram (`docs/diagrams/class-domain.puml`)

## Bối cảnh

Đề bài bắt buộc PostgreSQL. Hệ thống cần transaction cho tạo đơn và trừ kho, ràng buộc duy nhất
cho email và mã giao dịch, và database phải tái tạo được bằng migration/seed ở local, CI và
production (NFR-14).

## Quyết định

- ORM: **Prisma** (client `engineType = "client"` với `@prisma/adapter-pg`). Schema ở
  `apps/api/prisma/schema.prisma`.
- Thay đổi schema: `prisma migrate dev --name <tên>` ở local, commit thư mục
  `apps/api/prisma/migrations` (hiện có `init` và `drop_cart_item`).
- Production và docker-compose: container API chạy `npx prisma migrate deploy` trước
  `node dist/main.js` (`apps/api/Dockerfile`). Lệnh này chỉ áp dụng migration đã commit, không sinh
  migration mới, không reset dữ liệu.
- Seed: hàm `seed()` trong `apps/api/src/prisma/seed.ts`, gọi khi khởi động nếu `AUTO_SEED=true`.
  Hàm chỉ chạy khi bảng `Product` còn trống nên chạy lại không nhân đôi dữ liệu. Dữ liệu mẫu gồm
  nguyên liệu, công thức, 5 đồ uống, size S/M/L, 3 topping và 1 tài khoản `STAFF`.
- Tiền tệ lưu bằng số nguyên VNĐ (`Int`); lượng nguyên liệu dùng `Decimal(12,2)`.
- Ràng buộc đặt ở database: `@unique` cho `User.email`, `Payment.txnRef`; khóa ngoại kèm
  `onDelete: Cascade` cho `OrderItem`, `Payment`, `ProductIngredient`.

## Hệ quả

- Lịch sử migration nằm trong Git, review được qua PR như mã nguồn.
- Kiểu TypeScript sinh từ schema, giảm lỗi lệch tên cột giữa API và database.
- Migration lỗi thì API không khởi động, health check không đạt, nền tảng giữ bản cũ (ADR-007).
- Chỉ thêm migration mới, không sửa migration đã merge. Thay đổi phá vỡ (đổi tên/xóa cột) làm
  hai bước qua hai bản phát hành để rollback ứng dụng không làm hỏng database.
- `OrderItem` lưu bản chụp `productName`, `sizeName`, `toppings`, `unitPrice` và không có khóa ngoại
  tới `Product`, để đơn cũ giữ nguyên khi menu đổi giá hoặc ngừng bán.

## Phương án đã cân nhắc

- **TypeORM:** quen thuộc với NestJS nhưng migration sinh tự động dễ lệch, kiểu trả về kém chặt.
- **SQL thuần:** kiểm soát tốt nhưng tốn công viết truy vấn và kiểu dữ liệu.
- **Seed bằng lệnh riêng trong CI/CD:** tách bạch hơn, nhưng gói miễn phí của Render không có
  pre-deploy command nên chọn seed lúc khởi động, có điều kiện.
