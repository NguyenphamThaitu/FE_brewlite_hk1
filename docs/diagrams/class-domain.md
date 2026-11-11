# Class diagram mức domain – BrewLite

> Task 2.3 · Người thực hiện: Quách Văn Trường · Reviewer: Trần Minh Trí
> Nguồn: [`class-domain.puml`](class-domain.puml) · Kết xuất: [`class-domain.svg`](class-domain.svg)
> Bám theo mô hình dữ liệu đã merge vào `main`: [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)

![Class diagram mức domain](class-domain.svg)

## 1. Các lớp

| Lớp | Vai trò | Yêu cầu / use-case |
|-----|---------|--------------------|
| `User` | Tài khoản khách hàng hoặc nhân viên; mật khẩu lưu dạng băm. | FR-04, UC-05, UC-06 |
| `Product` | Đồ uống trên menu: giá gốc, mô tả, ảnh, danh mục, còn bán hay không. | FR-01, FR-02, UC-02, UC-03 |
| `Size` | Size S/M/L: phụ thu và hệ số nhân công thức (S = 1; M = 1,25; L = 1,5). | FR-02, UC-03 |
| `Topping` | Topping có giá và lượng nguyên liệu dùng cho một phần. | FR-02, UC-03 |
| `Ingredient` | Nguyên liệu trong kho, `quantity` là lượng còn lại. | FR-05, UC-01 |
| `ProductIngredient` | Công thức: một ly size chuẩn cần bao nhiêu nguyên liệu. | FR-05 |
| `Order` | Đơn hàng: trạng thái, tổng tiền tính ở server, lượng nguyên liệu đã trừ để hoàn kho khi hủy. | FR-05, FR-07, FR-08, UC-01, UC-07 → UC-09, UC-11 |
| `OrderItem` | Một dòng trong đơn; lưu bản chụp tên món, size, topping, đơn giá tại thời điểm đặt. | FR-05, UC-01 |
| `Payment` | Một giao dịch thanh toán qua VNPay sandbox, khóa duy nhất `txnRef`. | FR-06, UC-01 |
| `Promotion` *(mở rộng)* | Mã giảm giá: mã, phần trăm giảm, hạn dùng, giới hạn và số lượt đã dùng. | FR-36 (SRS của Tuấn Vỹ), UC-10 |
| `LoyaltyTransaction` *(mở rộng)* | Một lần cộng điểm thưởng khi đơn chuyển `PAID`. | FR-37 (SRS của Tuấn Vỹ); FR-06, FR-07 trong `srs.md` |

`Promotion` và `LoyaltyTransaction` là hai lớp đề bài bắt buộc có trong class diagram. Theo
[`scope-assumptions-risks.md`](../requirements/scope-assumptions-risks.md), đây là phạm vi mở rộng nên
**chưa có trong `schema.prisma`**. Trên sơ đồ, hai lớp này tô xám, gắn nhãn `<<mở rộng>>`, quan hệ vẽ nét đứt.
Thuộc tính của hai lớp này chỉ lấy từ yêu cầu của Assignment 2: FR-36, FR-37 trong SRS của Tuấn Vỹ (nhánh `docs-srs-only`, chờ merge) và mục cộng điểm thưởng ở FR-06, FR-07 của `srs.md`. Khi SRS được merge với số khác, cột yêu cầu sẽ cập nhật theo.

## 2. Quan hệ và multiplicity

| Quan hệ | Multiplicity | Giải thích |
|---------|--------------|------------|
| User – Order | 1 – 0..* | Mỗi đơn thuộc đúng một khách (`Order.userId`). |
| Order ◆ OrderItem | 1 – 1..* (composition) | Đơn có ít nhất 1 món (DTO chặn giỏ rỗng); xóa đơn thì xóa dòng (`onDelete: Cascade`). |
| OrderItem ⇢ Product | 0..* – 1 | Chỉ lưu `productId` kèm bản chụp tên và giá, **không có khóa ngoại**, để đơn cũ giữ nguyên khi menu thay đổi. |
| Order ◆ Payment | 1 – 0..* | Mỗi lần tạo link thanh toán mới là một `Payment`; xóa đơn thì xóa giao dịch. |
| Product – ProductIngredient – Ingredient | 1 – 0..* – 1 | Bảng công thức, khóa chính `(productId, ingredientId)`. |
| Topping → Ingredient | 0..* – 1 | Mỗi topping tiêu hao một loại nguyên liệu. |
| Order ⇢ Ingredient | phụ thuộc | `ingredientUsage` lưu `{ ingredientId: lượng đã trừ }` để hoàn kho. |
| Order ⇢ Promotion *(mở rộng)* | 0..* – 0..1 | Mỗi đơn áp tối đa một mã. |
| User ◆ LoyaltyTransaction *(mở rộng)* | 1 – 0..* | Điểm hiện có bằng tổng `points`. |
| LoyaltyTransaction ⇢ Order *(mở rộng)* | 0..1 – 1 | Mỗi đơn `PAID` sinh tối đa một giao dịch cộng điểm; đơn bị hủy không sinh điểm (FR-37). |

`Size` không có quan hệ khóa ngoại tới `OrderItem`: đơn lưu `sizeName` dạng bản chụp.

## 3. Enum trạng thái

| Enum | Giá trị | Ghi chú |
|------|---------|---------|
| `OrderStatus` | `PENDING_PAYMENT`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` | Chuyển trạng thái theo ghi chú trên sơ đồ. `COMPLETED`, `CANCELLED` là trạng thái kết thúc. |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` | Chỉ giao dịch `PENDING` mới được cập nhật kết quả. |
| `Role` | `CUSTOMER`, `STAFF` | `STAFF` xem mọi đơn và đẩy trạng thái pha chế. |

Chuyển trạng thái đơn trong code:
- `PENDING_PAYMENT → PAID`: VNPay báo thành công (`payments.service.ts`).
- `PENDING_PAYMENT → CANCELLED`: khách hủy hoặc thanh toán lỗi; hoàn kho theo `ingredientUsage` (`OrdersService.cancelPending`).
- `PAID → PREPARING → READY → COMPLETED`: chỉ `STAFF`, đúng thứ tự (`NEXT_STATUS` trong `orders.dto.ts`).

## 4. Đối chiếu với SRS – các điểm nhóm cần chốt

Sơ đồ này bám theo **code đã merge**. SRS FR-05 → FR-08 (PR #1, chưa merge) và góp ý trên PR #1
đang mô tả khác code ở các điểm sau. Theo tiêu chí nghiệm thu Task 2, sơ đồ, SRS và mô hình dữ
liệu phải khớp nhau, nên nhóm cần chọn một bên rồi sửa bên còn lại.

| Điểm | SRS (PR #1) | Code `main` và sơ đồ này |
|------|-------------|---------------------------|
| Trạng thái chờ thanh toán | `PENDING` | `PENDING_PAYMENT` |
| Thanh toán lỗi | Đơn sang `PAYMENT_FAILED`, giữ đơn để thử lại | Không có `PAYMENT_FAILED`; đơn bị `CANCELLED` và hoàn kho |
| Tồn kho | `Product.stock`, trừ theo số ly | Theo nguyên liệu: `Ingredient`, công thức × hệ số size |
| Cổng thanh toán | Mock Ví (`E_WALLET`) / Thẻ (`BANK_CARD`) | VNPay sandbox, `method = "VNPAY"` |
| Chống trùng thanh toán | Header `Idempotency-Key` | Dùng lại `txnRef` của `Payment` `PENDING`; cập nhật có điều kiện khi nhận kết quả |
| API thanh toán | `POST /payments` hoặc `POST /orders/:id/pay` | `POST /payments/vnpay`, `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return` |
| Lịch sử đơn | `GET /orders/me` | `GET /orders` (khách thấy đơn của mình, STAFF thấy tất cả) |
| Khách hủy đơn | Khi `PENDING` hoặc `PAYMENT_FAILED` | Chỉ khi `PENDING_PAYMENT` |
| Vai trò | `CUSTOMER`, `STAFF`, `ADMIN` | `CUSTOMER`, `STAFF` |

Đề xuất: sửa SRS theo code (ít việc hơn và code đã có integration test), trừ hai điểm đề bài yêu
cầu rõ: thanh toán "Ví/Thẻ mô phỏng" và idempotency. Nếu nhóm quyết định đổi code theo SRS, sơ đồ
này sẽ được cập nhật trong cùng PR đó.
