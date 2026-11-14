\# Release Notes – BrewLite



\## Task 5 – Frontend Checkout



\### Các chức năng được bổ sung

\- Tích hợp thanh toán mô phỏng bằng ví điện tử và thẻ ngân hàng.

\- Bổ sung kiểm tra dữ liệu thẻ ở frontend: số thẻ 16 chữ số, hạn thẻ đúng định dạng MM/YY, thẻ chưa hết hạn và CVV 3 chữ số.

\- Hiển thị thông báo tương ứng khi thanh toán thành công hoặc thất bại.

\- Lưu thông tin đơn hàng đang chờ thanh toán để hỗ trợ thử thanh toán lại.

\- Sử dụng Idempotency Key để hạn chế xử lý thanh toán trùng lặp.

\- Tự động xóa giỏ hàng sau khi thanh toán thành công.

\- Điều hướng chức năng Lịch sử đơn hàng đến trang `/orders`.



\### Kiểm thử đã thực hiện

\- Thanh toán bằng ví điện tử thành công.

\- Thanh toán bằng thẻ hợp lệ thành công.

\- Kiểm tra số thẻ sai định dạng.

\- Kiểm tra hạn thẻ sai định dạng và thẻ hết hạn.

\- Kiểm tra CVV sai định dạng.

\- Kiểm tra thẻ bị ngân hàng từ chối.

\- Kiểm tra thẻ không đủ số dư.

\- Chạy `npm.cmd run build`: thành công, TypeScript không có lỗi.



\### Lưu ý

\- Thanh toán thẻ hiện tại là thanh toán mô phỏng phục vụ kiểm thử, không phải giao dịch thẻ ngân hàng thực tế.

\- Quá trình build có cảnh báo Next.js phát hiện nhiều file `package-lock.json`; cảnh báo không làm build thất bại.



