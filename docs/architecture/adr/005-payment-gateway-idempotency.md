# ADR-005: Thanh toán qua VNPay sandbox, chống xử lý trùng

- Trạng thái: Superseded một phần by [ADR-008](008-simulated-wallet-card-payment.md) (2026-11-11).
  Còn hiệu lực: luồng VNPay sandbox (ký HMAC, IPN/Return dùng chung hàm, cập nhật có điều kiện).
  Đã thay: phương thức chính là Ví/Thẻ mô phỏng, chống trùng bằng `Idempotency-Key`, thanh toán lỗi
  chuyển `PAYMENT_FAILED` thay vì hủy đơn.
- Ngày: 2026-11-10
- Liên quan: FR-26, FR-27, FR-39, NFR-16, UC-01

> Phần dưới giữ nguyên nội dung lúc quyết định để truy vết. Số FR trong mục "Hệ quả" là số của bản
> SRS cũ (PR #1), trước khi SRS được đánh số lại ở PR #15.

## Bối cảnh

Đề bài yêu cầu thanh toán không tiền mặt mô phỏng. Khi mạng chập chờn, người dùng bấm lặp, hoặc
cổng thanh toán gọi lại kết quả nhiều lần, hệ thống không được tạo giao dịch trùng hay cập nhật
đơn hai lần.

## Quyết định

- Dùng **môi trường sandbox của VNPay** (không phát sinh tiền thật) thay cho dịch vụ mock tự viết.
  Cấu hình qua `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL`. Thiếu cấu
  hình thì API trả `503`.
- Luồng:
  1. `POST /payments/vnpay` (cần JWT): chỉ nhận đơn của chính khách và đang `PENDING_PAYMENT`, tạo
     `Payment` `PENDING` với `txnRef` duy nhất, trả `paymentUrl` có chữ ký HMAC để frontend chuyển
     sang VNPay.
  2. VNPay gọi `GET /payments/vnpay/ipn` (server-to-server); trình duyệt quay về frontend, frontend
     gọi `GET /payments/vnpay/return`. Cả hai dùng chung một hàm xử lý.
  3. Kiểm tra chữ ký, `txnRef` và số tiền. Sai thì từ chối, đơn không đổi.
  4. Trong **một transaction**: cập nhật `Payment` bằng điều kiện `status = PENDING`. Thành công thì
     đơn `PENDING_PAYMENT → PAID`; thất bại thì hủy đơn và hoàn nguyên liệu.
- Chống trùng:
  - Gọi lại `POST /payments/vnpay` khi đã có `Payment` `PENDING` thì dùng lại cùng `txnRef`, không tạo
    giao dịch mới.
  - Kết quả gửi lặp (IPN và Return, hoặc VNPay gọi lại) chỉ được xử lý một lần nhờ cập nhật có điều
    kiện; các lần sau trả mã `02` (đã xác nhận).
  - Nếu đơn đã bị hủy trước khi tiền về, giao dịch `SUCCESS` vẫn được ghi để đối soát, đơn không
    chuyển `PAID`.

## Hệ quả

- Có integration test cho: không tạo giao dịch trùng, IPN gọi lại không xử lý lần hai, chữ ký hoặc
  số tiền sai bị từ chối, thanh toán lỗi thì hủy đơn và hoàn kho (`apps/api/test/flow.int-spec.ts`).
- Gần với cổng thật hơn mock: có ký số, IPN, Return URL.
- **Khác với tài liệu hiện tại, cần nhóm chốt:**
  - SRS FR-06 và NFR-17 mô tả mock Ví (`E_WALLET`) / Thẻ (`BANK_CARD`) với header `Idempotency-Key`.
    Code dùng VNPay và `txnRef`.
  - Thanh toán lỗi: SRS chuyển đơn sang `PAYMENT_FAILED` để thử lại; code hủy đơn, khách phải đặt lại.
  - Đề bài ghi "thanh toán Ví/Thẻ mô phỏng". Nếu giữ VNPay, SRS và buổi demo cần nói rõ khách chọn
    phương thức (thẻ/ví) ngay trên trang VNPay sandbox để giảng viên không hiểu nhầm là thiếu chức năng.
- **Rủi ro deploy:** cần đăng ký tài khoản merchant sandbox. IPN URL phải là URL công khai của API
  production (cấu hình trên trang merchant). Thiếu cấu hình thì luồng thanh toán trên production
  không chạy.

## Phương án đã cân nhắc

- **Mock gateway tự viết + `Idempotency-Key`** (theo SRS FR-06): đơn giản, test được
  không cần mạng, đúng chữ "Ví/Thẻ mô phỏng" của đề; nhưng không có ký số và callback như cổng thật.
- **Chỉ chặn bấm lặp ở frontend:** không đủ, vì request và callback có thể lặp ở tầng mạng.
