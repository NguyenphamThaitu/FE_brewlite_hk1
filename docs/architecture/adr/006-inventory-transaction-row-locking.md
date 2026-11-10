# ADR-006: Transaction và optimistic locking cho tồn kho

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: FR-05, FR-06, FR-08, class diagram (`Product.version`, `Ingredient.version`)

## Bối cảnh

Nhiều khách có thể đặt cùng một món cùng lúc. Hệ thống không được bán vượt tồn kho, và khi tạo
đơn thất bại thì không để lại bản ghi dở dang (FR-05).

## Quyết định

- Tạo đơn chạy trong một transaction Prisma (`$transaction`): kiểm tra tồn kho, tạo `Order` và
  `OrderItem`, tạo giữ chỗ tồn kho.
- Mỗi bản ghi tồn kho có cột `version`. Cập nhật dạng:
  `UPDATE ... SET reservedQty = reservedQty + :n, version = version + 1
   WHERE id = :id AND version = :v AND stock - reservedQty >= :n`.
  Nếu số dòng bị ảnh hưởng là 0 thì có người khác vừa cập nhật: thử lại tối đa 3 lần, sau đó trả
  lỗi "không đủ tồn kho" và rollback toàn bộ transaction.
- Giữ chỗ có hạn (`Order.reservationExpiresAt`, 10 phút theo FR-05). Khi `PAID` thì giữ chỗ
  chuyển `CONSUMED` và trừ kho thật; khi hủy hoặc hết hạn thì `RELEASED`.

## Hệ quả

- Không khóa bảng, phù hợp lượng truy cập nhỏ của cửa hàng, ít xung đột.
- Có thể chứng minh bằng integration test: N request đồng thời cho món còn ít hơn N phần chỉ tạo
  được đúng số đơn bằng tồn kho.
- Khi xung đột nhiều, request phải thử lại nên chậm hơn; chấp nhận được trong phạm vi bài tập.

## Phương án đã cân nhắc

- **Pessimistic locking (`SELECT ... FOR UPDATE`):** đơn giản về logic nhưng Prisma không hỗ trợ
  trực tiếp, phải dùng SQL thuần; khóa lâu khi transaction gọi dịch vụ ngoài.
- **Chỉ kiểm tra tồn kho rồi trừ, không khóa:** lỗi race condition, bán vượt tồn kho.
