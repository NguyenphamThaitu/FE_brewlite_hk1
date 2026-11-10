# Sơ đồ use-case tổng quát – BrewLite

> Task 1.2, mục 5 · Người thực hiện: Quách Văn Trường · Reviewer: Quách Anh Vũ
> Nguồn sơ đồ: [`docs/diagrams/usecase-overview.puml`](../diagrams/usecase-overview.puml)

![Sơ đồ use-case tổng quát](../diagrams/usecase-overview.svg)

## 1. Tác nhân

| Tác nhân | Loại | Mô tả |
|----------|------|-------|
| Khách vãng lai | Chính | Người dùng chưa đăng nhập: xem menu, chọn tùy chọn, dùng giỏ hàng, đăng ký, đăng nhập. |
| Khách hàng (đã đăng nhập) | Chính | Kế thừa toàn bộ quyền của khách vãng lai; được đặt đơn, thanh toán, xem lịch sử, theo dõi và hủy đơn. |
| Nhân viên quầy (Barista) | Chính | Cập nhật trạng thái pha chế. Ngoài phạm vi MVP. |
| Quản lý cửa hàng | Chính | Kế thừa quyền nhân viên quầy; quản lý sản phẩm, khuyến mãi, tồn kho. Ngoài phạm vi MVP. |
| Payment Service | Phụ (hệ thống) | Cổng thanh toán Ví/Thẻ mô phỏng, trả kết quả thành công hoặc thất bại. |

## 2. Danh sách use-case

| Mã | Use-case | Tác nhân | Phạm vi | Yêu cầu liên quan |
|----|----------|----------|---------|-------------------|
| UC-01 | Đặt và thanh toán đơn hàng | Khách hàng, Payment Service | MVP | FR-05, FR-06 |
| UC-02 | Xem menu | Khách vãng lai | MVP | FR-01 |
| UC-03 | Xem chi tiết và chọn size/topping | Khách vãng lai | MVP | FR-02 |
| UC-04 | Quản lý giỏ hàng (thêm/sửa/xóa, tính tổng) | Khách vãng lai | MVP | FR-03 |
| UC-05 | Đăng ký | Khách vãng lai | MVP | FR-04 |
| UC-06 | Đăng nhập (nhận JWT) | Khách vãng lai | MVP | FR-04 |
| UC-07 | Xem lịch sử và chi tiết đơn | Khách hàng | MVP | FR-07 |
| UC-08 | Theo dõi trạng thái đơn | Khách hàng | MVP | FR-08 |
| UC-09 | Hủy đơn (khi `PENDING`/`PAYMENT_FAILED`) | Khách hàng | MVP | FR-08 |
| UC-10 | Áp mã khuyến mãi | Khách hàng | MVP – Should | FR-09 (đề xuất) |
| UC-11 | Cập nhật trạng thái pha chế | Nhân viên quầy | Mở rộng | FR-08 |
| UC-12 | Quản lý sản phẩm, khuyến mãi, tồn kho | Quản lý cửa hàng | Mở rộng | Ngoài MVP |

UC-01 là use-case trọng tâm, được đặc tả chi tiết ở Task 1.3 và dùng cho sequence diagram ở
Task 2.2. Mã UC-01 khớp với mẫu ma trận truy vết của đề bài (`UC-01 Thanh toán → FR-05`).

## 3. Quan hệ giữa các use-case

| Quan hệ | Ý nghĩa |
|---------|---------|
| UC-01, UC-07, UC-09 `<<include>>` Xác thực JWT | Bắt buộc có JWT hợp lệ; nếu chưa đăng nhập, hệ thống chuyển sang UC-06 rồi quay lại. |
| UC-10 `<<extend>>` UC-01 | Khách có thể nhập mã khuyến mãi trong lúc đặt đơn; không bắt buộc. |
| UC-08 `<<extend>>` UC-07 | Từ màn hình lịch sử/chi tiết đơn, khách theo dõi trạng thái hiện tại. |
| Khách hàng kế thừa Khách vãng lai | Mọi use-case của khách vãng lai đều dùng được khi đã đăng nhập. |
| Quản lý cửa hàng kế thừa Nhân viên quầy | Quản lý làm được mọi việc của nhân viên quầy. |

## 4. Ghi chú cần thống nhất

- Mã FR-01 → FR-04 giả định theo thứ tự nhóm yêu cầu của đề bài (menu, chi tiết sản phẩm, giỏ
  hàng, xác thực). Người viết SRS các mục này giữ đúng thứ tự, hoặc báo để cập nhật bảng trên.
- **FR-09 (đề xuất):** áp mã khuyến mãi và cộng điểm thưởng sau khi đơn `PAID` (Task 10 của
  Assignment 1). SRS hiện chưa có mã cho yêu cầu này; cần người phụ trách SRS xác nhận.
- Phạm vi UC-11, UC-12 lấy theo tài liệu Assignment 1 (chức năng nhân viên quầy nằm ngoài MVP).
  Nếu `context-and-scope.md` thay đổi phạm vi, cập nhật lại cột *Phạm vi*.
