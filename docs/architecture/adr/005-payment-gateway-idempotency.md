# ADR-005: Cổng thanh toán mô phỏng và thanh toán idempotent

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: FR-06, FR-08, UC-01, sequence diagram checkout

## Bối cảnh

Đề bài yêu cầu thanh toán Ví/Thẻ mô phỏng. Khi mạng chập chờn hoặc người dùng bấm "Xác nhận trả"
nhiều lần, client có thể gửi lại cùng một yêu cầu; hệ thống không được trừ tiền hay tạo giao dịch
hai lần.

## Quyết định

- `PaymentGateway` là interface trong module `payments`; bản hiện thực `MockPaymentGateway` trả
  kết quả thành công/thất bại sau độ trễ ngắn. Có cách ép thất bại để kiểm thử (ví dụ trường
  `simulateFail` trong DTO, chỉ bật ngoài production, hoặc số thẻ thử nghiệm quy ước).
- `POST /payments` bắt buộc header `Idempotency-Key` (UUID do frontend sinh một lần cho mỗi lượt
  thanh toán và giữ nguyên khi gửi lại).
- Xử lý:
  1. Đã có `Payment` với key này: nếu thuộc cùng đơn của cùng người dùng thì trả lại kết quả cũ,
     không gọi gateway; nếu thuộc đơn khác thì trả `409 Conflict`.
  2. Kiểm tra quyền sở hữu đơn và trạng thái hợp lệ để thanh toán (theo FR-06, FR-08).
  3. Gọi gateway, sau đó trong **một transaction**: tạo `Payment`, chuyển trạng thái đơn bằng
     cập nhật có điều kiện (`WHERE status IN (...)`), trừ tồn kho đã giữ chỗ, cộng điểm thưởng.
  4. Hai request cùng key chạy đồng thời: ràng buộc `UNIQUE(idempotencyKey)` làm request thứ hai
     lỗi khi insert; API bắt lỗi này và trả lại `Payment` đã lưu.

## Hệ quả

- Gửi lại cùng key luôn cho cùng kết quả, đáp ứng tiêu chí "gửi 2 lần cùng Idempotency-Key chỉ
  tạo 1 giao dịch".
- Thay cổng thật (MoMo/VNPay/Stripe) chỉ cần hiện thực lại `PaymentGateway`.
- Hạn chế: gateway mô phỏng không có webhook bất đồng bộ; nếu dùng cổng thật cần thêm bước xác
  nhận qua callback.

## Phương án đã cân nhắc

- **Chặn bấm lặp chỉ ở frontend:** không đủ, vì request có thể được gửi lại ở tầng mạng.
- **Dùng `orderId` làm khóa idempotent:** không phân biệt được lần thử lại hợp lệ sau
  `PAYMENT_FAILED` với lần gửi trùng.
