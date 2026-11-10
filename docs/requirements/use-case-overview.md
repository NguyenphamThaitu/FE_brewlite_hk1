# Sơ đồ use-case tổng quát – BrewLite

> Task 1.2, mục 5 · Người thực hiện: Quách Văn Trường · Reviewer: Quách Anh Vũ
> Nguồn sơ đồ: [`docs/diagrams/usecase-overview.puml`](../diagrams/usecase-overview.puml)
> Phạm vi theo [`scope-assumptions-risks.md`](scope-assumptions-risks.md) (ứng dụng web, không làm mobile/PWA).

![Sơ đồ use-case tổng quát](../diagrams/usecase-overview.svg)

## 1. Tác nhân

| Tác nhân | Loại | Mô tả | Stakeholder tương ứng |
|----------|------|-------|-----------------------|
| Khách vãng lai | Chính | Chưa đăng nhập: xem menu, chọn size/topping, dùng giỏ hàng, đăng ký, đăng nhập. | Khách hàng |
| Khách hàng (đã đăng nhập) | Chính | Kế thừa khách vãng lai; đặt đơn, thanh toán, xem lịch sử, theo dõi và hủy đơn. | Khách hàng |
| Nhân viên quầy (`STAFF`) | Chính | Xem các đơn cần xử lý, cập nhật trạng thái pha chế. | Thu ngân, Barista |
| Quản lý cửa hàng | Chính | Kế thừa nhân viên quầy; quản lý menu và khuyến mãi (mở rộng). | Quản lý cửa hàng |
| Cổng thanh toán (VNPay sandbox) | Phụ (hệ thống) | Nhận yêu cầu thanh toán, trả kết quả thành công/thất bại qua IPN và Return URL. | Đơn vị thanh toán |

Quản trị viên hệ thống và nhóm phát triển là stakeholder nhưng không tương tác với chức năng
nghiệp vụ nên không phải tác nhân trên sơ đồ.

## 2. Danh sách use-case

| Mã | Use-case | Tác nhân | Phạm vi | Yêu cầu | API |
|----|----------|----------|---------|---------|-----|
| UC-01 | Đặt và thanh toán đơn hàng | Khách hàng, Cổng thanh toán | MVP | FR-05, FR-06 | `POST /orders`, `POST /payments/vnpay`, `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return` |
| UC-02 | Xem menu | Khách vãng lai | MVP | FR-01 | `GET /products` |
| UC-03 | Xem chi tiết, chọn size và topping | Khách vãng lai | MVP | FR-02 | `GET /products/:id` |
| UC-04 | Quản lý giỏ hàng (thêm/sửa/xóa, tính tổng) | Khách vãng lai | MVP | FR-03 | Không gọi API, giỏ hàng lưu ở frontend |
| UC-05 | Đăng ký | Khách vãng lai | MVP | FR-04 | `POST /auth/register` |
| UC-06 | Đăng nhập (nhận JWT) | Khách vãng lai | MVP | FR-04 | `POST /auth/login` |
| UC-07 | Xem lịch sử và chi tiết đơn | Khách hàng | MVP | FR-07 | `GET /orders`, `GET /orders/:id` |
| UC-08 | Theo dõi trạng thái đơn (tải lại hoặc polling) | Khách hàng | MVP | FR-08 | `GET /orders/:id` |
| UC-09 | Hủy đơn chưa thanh toán | Khách hàng | MVP | FR-08 | `POST /orders/:id/cancel` |
| UC-10 | Áp mã khuyến mãi | Khách hàng | Mở rộng | FR-09 (đề xuất) | Chưa có |
| UC-11 | Xem và cập nhật trạng thái pha chế | Nhân viên quầy | MVP | FR-08 | `GET /orders`, `PATCH /orders/:id/status` |
| UC-12 | Quản lý menu và khuyến mãi | Quản lý cửa hàng | Mở rộng | Chưa có mã | Chưa có |

UC-01 là use-case trọng tâm, được đặc tả chi tiết ở Task 1.3 và dùng cho sequence diagram ở
Task 2.2. Mã UC-01 khớp với mẫu ma trận truy vết của đề bài (`UC-01 Thanh toán`). Cột API lấy từ
code đã merge vào `main`.

## 3. Quan hệ giữa các use-case

| Quan hệ | Ý nghĩa |
|---------|---------|
| UC-01, UC-07, UC-09, UC-11 `<<include>>` Xác thực JWT | Bắt buộc có JWT hợp lệ (API trả 401 nếu thiếu). Khách chưa đăng nhập được chuyển sang UC-06 rồi quay lại. |
| UC-08 `<<extend>>` UC-07 | Từ lịch sử/chi tiết đơn, khách theo dõi trạng thái hiện tại. |
| UC-10 `<<extend>>` UC-01 | Nhập mã khuyến mãi khi đặt đơn, không bắt buộc (mở rộng). |
| Khách hàng kế thừa Khách vãng lai | Mọi use-case của khách vãng lai đều dùng được khi đã đăng nhập. |
| Quản lý cửa hàng kế thừa Nhân viên quầy | Quản lý làm được mọi việc của nhân viên quầy. |

## 4. Ghi chú cần thống nhất

- **FR-01 → FR-04** chưa có trong SRS. Bảng trên giả định thứ tự: menu, chi tiết sản phẩm, giỏ
  hàng, xác thực (PR #6 cũng ghi FR-01, FR-02 cho menu và chi tiết). Người viết SRS các mục này giữ
  đúng thứ tự, hoặc báo để cập nhật bảng.
- **FR-09 (đề xuất):** khuyến mãi và điểm thưởng. Tài liệu phạm vi xếp vào mở rộng nhưng SRS chưa có
  mã. Cần người phụ trách SRS/MoSCoW xác nhận.
- Cột API theo code hiện tại. SRS FR-06, FR-07 (PR #1) đang ghi API khác (`POST /payments`,
  `GET /orders/me`). Chi tiết ở mục 4 của [`class-domain.md`](../diagrams/class-domain.md).
