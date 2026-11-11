# ADR-008: Thanh toán Ví/Thẻ mô phỏng, Idempotency-Key và trạng thái PAYMENT_FAILED

- Trạng thái: Accepted (hiện thực ở PR #16)
- Ngày: 2026-11-11
- Thay thế một phần: ADR-005 (phương thức thanh toán chính, cách xử lý thanh toán lỗi, cách chống trùng)
- Liên quan: FR-24, FR-25, FR-26, FR-27, FR-39, NFR-16, NFR-23, UC-01, class diagram (`Payment`, `User`)

## Bối cảnh

ADR-005 chọn VNPay sandbox làm cổng thanh toán duy nhất. SRS đã chốt (PR #15) lại yêu cầu khác:

- FR-24, FR-25 (Must): thanh toán bằng **Ví** và **Thẻ mô phỏng** qua `POST /payments`, có kết quả
  thành công/thất bại kiểm soát được; không lưu dữ liệu thẻ đầy đủ.
- FR-26 (Must): gửi lặp cùng `Idempotency-Key` chỉ tạo một giao dịch, chỉ trừ tiền một lần.
- FR-27 (Must): thanh toán lỗi thì đơn không mất mà chuyển `PAYMENT_FAILED`, cho phép thử lại.
- FR-39: thanh toán thật qua VNPay, MoMo, Stripe nằm ngoài phạm vi; chỉ dùng thanh toán mô phỏng.

## Quyết định

- **Phương thức chính là mô phỏng**: `POST /payments` (JWT), body `{ orderId, method, card? }`,
  `method` là `WALLET` hoặc `CARD`. Kết quả trả ngay trong response, không cần callback.
  - Ví: mỗi `User` có `walletBalance` (mặc định 200.000đ). Đủ tiền thì trừ ví; thiếu thì
    `FAILED`, mã `WALLET_INSUFFICIENT_BALANCE`.
  - Thẻ: kết quả theo số thẻ test cố định (`4111111111111111`, `5555555555554444` thành công;
    `4000000000000002` bị từ chối; `4000000000009995` không đủ số dư; thẻ hết hạn bị từ chối).
    Chỉ lưu 4 số cuối (`Payment.cardLast4`), không lưu số thẻ đầy đủ, hạn thẻ hay CVV.
- **Chống trùng bằng header `Idempotency-Key`** (bắt buộc, 8–100 ký tự) cho cả `POST /payments` và
  `POST /payments/vnpay`:
  - lưu vào `Payment.idempotencyKey` có ràng buộc `UNIQUE`;
  - gửi lại cùng key → trả lại đúng giao dịch và kết quả cũ, không trừ tiền lần hai;
  - key đã dùng cho đơn, người dùng hoặc phương thức khác → `409`;
  - hai request cùng key chạy đồng thời: request sau vướng `UNIQUE` và nhận kết quả của request trước.
- **Khóa dòng** `Order` (và `User` khi trừ ví) bằng `SELECT ... FOR UPDATE` trong transaction, để hai
  lần bấm khác key không cùng thanh toán một đơn.
- **Thanh toán lỗi** → `Payment` `FAILED` kèm mã lỗi, đơn `PENDING_PAYMENT → PAYMENT_FAILED`, giữ
  nguyên kho. Khách thanh toán lại bằng key mới (thành công thì `PAID`) hoặc tự hủy đơn để hoàn kho.
  Đơn đã `PAID` không thanh toán lại được (`409`).
- **VNPay sandbox giữ lại như phương thức bổ sung** (code đã có từ PR #3), dùng chung `Idempotency-Key`
  và trạng thái `PAYMENT_FAILED`. Thiếu cấu hình `VNPAY_*` thì chỉ các endpoint `/payments/vnpay` trả `503`,
  Ví/Thẻ mô phỏng vẫn chạy.

## Hệ quả

- Đáp ứng đúng chữ "thanh toán Ví/Thẻ mô phỏng" của đề và FR-24 → FR-27; demo và test không cần
  mạng hay tài khoản merchant.
- Integration test (`apps/api/test/flow.int-spec.ts`) kiểm tra: ví đủ/thiếu tiền, gửi lặp cùng key
  không trừ tiền lần hai, thẻ bị từ chối/hết hạn, DB không chứa số thẻ đầy đủ, thanh toán lại sau lỗi.
- Frontend phải sinh một `Idempotency-Key` mới cho mỗi lần bấm "Thanh toán" (ví dụ
  `crypto.randomUUID()`) và gửi lại y nguyên khi retry do lỗi mạng.
- Thêm migration `20261111090000_wallet_card_payment` (`User.walletBalance`, `Payment.cardLast4`).
- Có hai đường thanh toán (mô phỏng và VNPay). Nếu nhóm muốn đúng hẳn FR-39 thì có thể bỏ VNPay mà
  không ảnh hưởng luồng mô phỏng.

## Phương án đã cân nhắc

- **Chỉ giữ VNPay sandbox (ADR-005):** gần cổng thật nhưng trái FR-24, FR-25, FR-39; demo phụ thuộc
  mạng và tài khoản merchant.
- **Trả HTTP 402 khi thanh toán thất bại:** rõ nghĩa hơn, nhưng gửi lặp cùng key phải trả đúng kết quả
  cũ, nên thống nhất trả `200` kèm `paymentStatus = FAILED` và `errorCode`.
