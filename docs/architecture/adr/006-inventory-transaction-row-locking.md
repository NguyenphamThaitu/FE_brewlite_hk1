# ADR-006: Tồn kho theo nguyên liệu, transaction và khóa dòng khi đặt đơn

- Trạng thái: Accepted (đã hiện thực ở PR #3; điều kiện hủy đơn cập nhật theo ADR-008 ở PR #16)
- Ngày: 2026-11-10
- Liên quan: FR-03, FR-20, FR-22, FR-34, NFR-15, UC-01, UC-09, class diagram (`Ingredient`, `ProductIngredient`)

## Bối cảnh

Nhiều khách có thể đặt cùng lúc khi nguyên liệu sắp hết. Hệ thống không được bán vượt tồn kho, và
khi tạo đơn thất bại thì không để lại đơn dở dang hay kho bị trừ sai (FR-20, NFR-15).

## Quyết định

- Tồn kho quản lý theo **nguyên liệu**: lượng cần = công thức (`ProductIngredient.quantity`) ×
  `Size.recipeMultiplier` × số ly, cộng nguyên liệu của topping (`Topping.ingredientQty`).
- `POST /orders` chạy trong một `prisma.$transaction`:
  1. đọc món, size, topping từ DB và tính lại giá (không tin giá client gửi);
  2. tính tổng nguyên liệu cần;
  3. khóa các dòng `Ingredient` liên quan bằng `SELECT ... FOR UPDATE`, **theo thứ tự id tăng dần**
     để tránh deadlock;
  4. thiếu nguyên liệu thì trả `409 Conflict` kèm danh sách thiếu, rollback toàn bộ;
  5. đủ thì trừ kho, tạo `Order` `PENDING_PAYMENT`, lưu `ingredientUsage` để hoàn kho sau này.
- Khách hủy đơn chưa thanh toán xong: `UPDATE` có điều kiện
  `status IN (PENDING_PAYMENT, PAYMENT_FAILED)` rồi cộng lại kho theo `ingredientUsage`. Điều kiện này
  bảo đảm chỉ hoàn kho một lần. Thanh toán lỗi không hủy đơn mà giữ kho để khách thanh toán lại (ADR-008).
- Nhân viên đổi trạng thái: `UPDATE ... WHERE status = <trạng thái đã đọc>`. Nếu không có dòng nào
  được cập nhật (người khác vừa đổi) thì trả `409`. Đây là kiểu optimistic concurrency.

## Hệ quả

- Integration test "đồng thời: chỉ đủ nguyên liệu cho 1 đơn → đúng 1 đơn thành công" chứng minh
  không bán vượt kho.
- Khóa dòng chỉ giữ trong lúc tạo đơn (không gọi dịch vụ ngoài trong transaction), nên thời gian
  khóa ngắn.
- Kho bị trừ ngay khi tạo đơn. Đơn chưa thanh toán bỏ dở sẽ giữ nguyên liệu đến khi bị hủy. Hiện
  chưa có cơ chế tự hủy đơn quá hạn (FR-22, Should); nếu làm, thêm job hủy đơn `PENDING_PAYMENT`
  quá 15 phút, dùng lại hàm hủy đơn có điều kiện ở trên.
- SRS (FR-20) chỉ yêu cầu "kiểm tra và trừ tồn kho"; tồn kho theo nguyên liệu là cách hiện thực chi
  tiết hơn, vẫn đáp ứng FR-03 (món hết nguyên liệu thì đặt bị `409`).
- NFR-15 yêu cầu test 20 request đồng thời với tồn kho cho 5 đơn; test hiện có kiểm tra trường hợp
  chỉ đủ cho 1 đơn, cùng cơ chế khóa.

## Phương án đã cân nhắc

- **Tồn kho theo sản phẩm (`Product.stock`) + optimistic locking bằng cột `version`:** đơn giản hơn,
  khớp SRS hiện tại, nhưng không phản ánh việc nhiều món dùng chung nguyên liệu, và phải tự viết
  vòng thử lại khi xung đột.
- **Kiểm tra rồi trừ mà không khóa:** lỗi race condition, bán vượt kho.
