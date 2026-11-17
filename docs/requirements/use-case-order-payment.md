

# Đặc tả Use Case chi tiết: Đặt đơn và thanh toán



## 1. Thông tin Use Case



| Thuộc tính | Mô tả |
|---|---|
| Mã Use Case chi tiết | UC-01 |
| Nhóm Use Case tương ứng trong SRS | UC-04 |
| Tên Use Case | Đặt đơn và thanh toán |
| Tác nhân chính | Khách hàng |
| Tác nhân hỗ trợ | Payment Gateway (mô phỏng Ví/Thẻ) |
| Mục tiêu | Cho phép khách hàng tạo đơn hàng và hoàn tất thanh toán thành công. |
| Mức độ ưu tiên | Must Have |



## 2. Trigger



Khách hàng đã đăng nhập chọn xác nhận đặt hàng và thanh toán từ giỏ hàng.



## 3. Điều kiện tiên quyết



- Khách hàng đã đăng nhập thành công.

- Hệ thống đang hoạt động bình thường.

- Giỏ hàng có ít nhất một sản phẩm.



## 4. Hậu điều kiện



### 4.1. Trường hợp thành công



- Đơn hàng được lưu vào cơ sở dữ liệu.

- Tồn kho của các sản phẩm được cập nhật.

- Thông tin tên và giá sản phẩm tại thời điểm đặt hàng được lưu trong đơn.

- Giao dịch thanh toán được ghi nhận với trạng thái `SUCCESS`.

- Trạng thái đơn hàng được cập nhật thành `PAID`.

- Giỏ hàng được làm rỗng.

- Khách hàng nhận được thông tin xác nhận đơn hàng.



### 4.2. Trường hợp thất bại



- Giao dịch thanh toán được ghi nhận với trạng thái `FAILED`.

- Trạng thái đơn hàng được cập nhật thành `PAYMENT_FAILED`.

- Giỏ hàng của khách hàng được giữ lại.

- Khách hàng có thể thử thanh toán lại.



## 5. Luồng sự kiện chính (Main Success Scenario)



1. Khách hàng kiểm tra các sản phẩm trong giỏ hàng và xác nhận đặt hàng.

2. Hệ thống kiểm tra tính hợp lệ của giỏ hàng và tình trạng tồn kho của sản phẩm.

3. Hệ thống tính tổng tiền đơn hàng ở phía backend.

4. Hệ thống tạo đơn hàng với trạng thái `PENDING_PAYMENT` và lưu snapshot tên, giá sản phẩm tại thời điểm đặt hàng.

5. Hệ thống trừ số lượng tồn kho trong cùng một giao dịch cơ sở dữ liệu với thao tác tạo đơn hàng.

6. Khách hàng chọn phương thức thanh toán (`WALLET` hoặc `CARD`).

7. Khách hàng xác nhận thanh toán.

8. Hệ thống gửi yêu cầu thanh toán đến Payment Gateway.

9. Payment Gateway trả về kết quả thanh toán thành công.

10. Hệ thống ghi nhận giao dịch thanh toán với trạng thái `SUCCESS`.

11. Hệ thống cập nhật trạng thái đơn hàng thành `PAID`.

12. Hệ thống hiển thị thông tin xác nhận đơn hàng cho khách hàng và làm rỗng giỏ hàng.



## 6. Luồng thay thế và ngoại lệ



### A1. Giỏ hàng trống



- Tại bước 1, hệ thống phát hiện giỏ hàng không có sản phẩm.

- Hệ thống hiển thị thông báo lỗi.

- Khách hàng được yêu cầu thêm sản phẩm trước khi đặt hàng.



### A2. Sản phẩm không đủ tồn kho



- Tại bước 2, hệ thống phát hiện số lượng tồn kho không đủ.

- Hệ thống hủy toàn bộ giao dịch tạo đơn và cập nhật tồn kho.

- Hệ thống hiển thị thông báo về tình trạng không đủ hàng.

- Khách hàng cập nhật lại giỏ hàng.



### A3. Thanh toán thất bại



- Tại bước 9, Payment Gateway trả về kết quả thanh toán thất bại.

- Hệ thống ghi nhận giao dịch thanh toán với trạng thái `FAILED`.

- Hệ thống cập nhật trạng thái đơn hàng thành `PAYMENT_FAILED`.

- Hệ thống thông báo lý do thanh toán thất bại cho khách hàng.

- Giỏ hàng của khách hàng được giữ lại.

- Khách hàng có thể thử thanh toán lại.



### A4. Yêu cầu thanh toán bị gửi trùng



- Khách hàng gửi lại cùng một yêu cầu thanh toán với cùng `Idempotency-Key`.

- Hệ thống kiểm tra `Idempotency-Key`.

- Hệ thống trả về kết quả thanh toán trước đó mà không xử lý thêm một giao dịch thanh toán mới.



## 7. Quy tắc nghiệp vụ



- Chỉ khách hàng đã xác thực mới được phép đặt đơn.

- Tổng tiền đơn hàng phải được tính toán ở phía backend.

- Khách hàng chỉ được thanh toán cho đơn hàng của chính mình.

- Chỉ đơn hàng có trạng thái `PENDING_PAYMENT` hoặc `PAYMENT_FAILED` mới được phép thanh toán.

- Hệ thống phải ngăn chặn việc xử lý thanh toán trùng lặp thông qua `Idempotency-Key`.



## 8. Yêu cầu chức năng liên quan



- FR-18: Yêu cầu đăng nhập khi đặt đơn.

- FR-19: Tạo đơn hàng từ giỏ hàng.

- FR-20: Kiểm tra và trừ tồn kho khi tạo đơn.

- FR-21: Lưu snapshot giá và tên sản phẩm tại thời điểm đặt.

- FR-24: Thanh toán bằng Ví mô phỏng.

- FR-25: Thanh toán bằng Thẻ mô phỏng.

- FR-26: Idempotency khi gửi lại yêu cầu thanh toán.

- FR-27: Xử lý thanh toán thất bại và cho phép thử lại.

- FR-29: Hiển thị xác nhận đơn sau khi thanh toán thành công.
