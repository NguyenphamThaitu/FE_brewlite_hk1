# Class diagram mức domain – BrewLite

> Task 2.3 · Người thực hiện: Quách Văn Trường · Reviewer: Trần Minh Trí
> Nguồn: [`class-domain.puml`](class-domain.puml) · Kết xuất: [`class-domain.svg`](class-domain.svg)

![Class diagram mức domain](class-domain.svg)

## 1. Các lớp

| Lớp | Vai trò | Yêu cầu |
|-----|---------|---------|
| `User` | Tài khoản khách hàng/nhân viên; mật khẩu lưu dạng băm; số điểm thưởng hiện có. | FR-04, FR-09 |
| `Product` | Đồ uống trên menu: giá gốc, ảnh, danh mục, tồn kho, `version` cho optimistic locking. | FR-01, FR-02 |
| `Order` | Đơn hàng; giữ trạng thái và tổng tiền đã tính ở backend. | FR-05, FR-07, FR-08 |
| `OrderItem` | Một dòng trong đơn: sản phẩm, size, topping, số lượng, đơn giá tại thời điểm đặt. | FR-05 |
| `Payment` | Một lần thanh toán Ví/Thẻ mô phỏng, khóa duy nhất `idempotencyKey`. | FR-06 |
| `Promotion` | Mã giảm giá theo phần trăm, giới hạn lượt dùng và thời gian hiệu lực. | FR-09 |
| `LoyaltyTransaction` | Lịch sử cộng/trừ điểm thưởng, gắn với đơn phát sinh. | FR-09 |
| `Ingredient`, `RecipeItem`, `StockReservation` | Tồn kho nguyên liệu theo công thức từng size; giữ chỗ khi tạo đơn. | FR-05, FR-08 |

## 2. Quan hệ và multiplicity

| Quan hệ | Multiplicity | Giải thích |
|---------|--------------|------------|
| User – Order | 1 – 0..* | Mỗi đơn thuộc đúng một khách; khách có thể chưa có đơn. |
| Order ◆ OrderItem | 1 – 1..* (composition) | Đơn phải có ít nhất 1 món (FR-05: giỏ rỗng trả 400); xóa đơn thì xóa dòng. |
| OrderItem → Product | 0..* – 1 | Mỗi dòng tham chiếu một sản phẩm. |
| Order – Payment | 1 – 0..* | Cho phép thử lại sau `PAYMENT_FAILED`; tối đa một `Payment` `SUCCESS`. |
| Order → Promotion | 0..* – 0..1 | Mỗi đơn áp tối đa một mã. |
| User ◆ LoyaltyTransaction | 1 – 0..* | Điểm hiện có bằng tổng điểm các giao dịch. |
| LoyaltyTransaction → Order | 0..* – 0..1 | Điểm `EARN` gắn với đơn; điều chỉnh thủ công không cần đơn. |
| Product ◆ RecipeItem → Ingredient | 1 – 0..* – 1 | Định lượng nguyên liệu theo từng size. |
| Order ◆ StockReservation → Ingredient | 1 – 0..* – 1 | Giữ chỗ khi tạo đơn; `CONSUMED` khi `PAID`, `RELEASED` khi hủy/hết hạn. |

## 3. Enum trạng thái

| Enum | Giá trị | Ghi chú |
|------|---------|---------|
| `OrderStatus` | `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` | Chuyển trạng thái theo FR-08, kiểm tra bằng `assertTransition()`. |
| `PaymentMethod` | `E_WALLET`, `BANK_CARD` | Tên giống FR-06. |
| `PaymentStatus` | `SUCCESS`, `FAILED` | |
| `Size` | `S`, `M`, `L` | Phụ thu theo size, tính trong `Product.priceFor()`. |
| `Role` | `CUSTOMER`, `STAFF`, `ADMIN` | `STAFF` cho nhân viên quầy (UC-11, phần mở rộng). |
| `LoyaltyType` | `EARN`, `REDEEM`, `REVERSE` | `REVERSE` hoàn điểm khi đơn đã cộng điểm bị hủy. |
| `ReservationStatus` | `RESERVED`, `CONSUMED`, `RELEASED` | |

## 4. Đối chiếu với SRS và mô hình dữ liệu

- Thuộc tính tối thiểu của đề Assignment 1 (Product, User, Order, OrderItem, Payment) đều có mặt.
- Tổng tiền: `Order.total = subtotal - discount`, `OrderItem.lineTotal = unitPrice × qty`; tính
  lại ở backend, không tin giá do client gửi (FR-05).
- `Order` không chứa thông tin thẻ/ví; `Payment` chỉ lưu phương thức và kết quả mô phỏng.
- Khi viết migration Prisma ở Sprint 2, tên bảng/cột bám theo sơ đồ này. Mọi khác biệt phải
  cập nhật sơ đồ trong cùng pull request.
