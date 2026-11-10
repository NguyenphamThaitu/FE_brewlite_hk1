# Sơ đồ use-case tổng quát – BrewLite

> Task 1.2, mục 5 · Người thực hiện: Quách Văn Trường · Reviewer: Quách Anh Vũ
> Nguồn sơ đồ: [`docs/diagrams/usecase-overview.puml`](../diagrams/usecase-overview.puml)

![Sơ đồ use-case tổng quát](../diagrams/usecase-overview.svg)

## 0. Tài liệu làm căn cứ

| Tài liệu | Người viết | Trạng thái (10/11) | Dùng cho |
|----------|-----------|--------------------|----------|
| [`scope-assumptions-risks.md`](scope-assumptions-risks.md) | Thái Tú | Đã merge (PR #7) | Phạm vi MVP / mở rộng, chỉ làm web, thanh toán mô phỏng Ví/Thẻ |
| [`context-and-scope.md`](context-and-scope.md) | Anh Vũ | Đã merge (PR #10, #11) | Danh sách stakeholder → tác nhân |
| [`use-case-order-payment.md`](use-case-order-payment.md) | Anh Vũ | Đã merge (PR #10) | UC-01 và tác nhân Payment Gateway |
| [`srs.md`](srs.md) (FR-05 → FR-08) | Minh Trí | Đã merge (PR #1) | Đặt đơn, thanh toán, lịch sử, trạng thái, hủy đơn, vai trò nhân viên |
| `ssr.md` (FR-01 → FR-38) | Hữu Mẫn | Nhánh `Man`, chưa mở PR | Menu, chi tiết sản phẩm, giỏ hàng, xác thực |

## 1. Tác nhân

| Tác nhân | Loại | Mô tả | Stakeholder tương ứng (context-and-scope) |
|----------|------|-------|-------------------------------------------|
| Khách vãng lai | Chính | Chưa đăng nhập: xem menu, xem chi tiết, chọn size/topping, dùng giỏ hàng, đăng ký, đăng nhập. | Khách hàng |
| Khách hàng (đã đăng nhập) | Chính | Kế thừa khách vãng lai; đặt đơn, thanh toán, xem lịch sử, theo dõi và hủy đơn. | Khách hàng |
| Nhân viên quầy | Chính | Cập nhật trạng thái đơn đã thanh toán (pha chế, sẵn sàng, hoàn tất). | Nhân viên thu ngân, Nhân viên pha chế |
| Quản lý cửa hàng | Chính | Kế thừa nhân viên quầy; quản lý menu (mở rộng). | Quản lý cửa hàng |
| Payment Gateway (mô phỏng Ví/Thẻ) | Phụ (hệ thống) | Nhận yêu cầu thanh toán, trả kết quả thành công hoặc thất bại. | Đơn vị thanh toán |

Quản trị viên hệ thống, nhóm phát triển và giảng viên nghiệm thu là stakeholder nhưng không thao tác
chức năng nghiệp vụ nên không phải tác nhân trên sơ đồ.

## 2. Danh sách use-case

| Mã | Use-case | Tác nhân | Phạm vi | Yêu cầu liên quan (nguồn) |
|----|----------|----------|---------|---------------------------|
| UC-01 | Đặt và thanh toán đơn hàng | Khách hàng, Payment Gateway | MVP | FR-05, FR-06 (Minh Trí) · FR-25 → FR-27 (Hữu Mẫn) |
| UC-02 | Xem menu | Khách vãng lai | MVP | FR-01 → FR-08 (Hữu Mẫn) |
| UC-03 | Xem chi tiết, chọn size và topping | Khách vãng lai | MVP | FR-09 → FR-16 (Hữu Mẫn) |
| UC-04 | Quản lý giỏ hàng | Khách vãng lai | MVP | FR-17 → FR-24 (Hữu Mẫn) |
| UC-05 | Đăng ký | Khách vãng lai | MVP | FR-28, FR-29 (Hữu Mẫn) |
| UC-06 | Đăng nhập | Khách vãng lai | MVP | FR-30 → FR-33, FR-36 (Hữu Mẫn) |
| UC-07 | Xem lịch sử và chi tiết đơn | Khách hàng | MVP | FR-07 (Minh Trí) |
| UC-08 | Theo dõi trạng thái đơn (tải lại trang hoặc polling) | Khách hàng | MVP | FR-08, quy tắc 5 (Minh Trí) |
| UC-09 | Hủy đơn khi chưa thanh toán xong | Khách hàng | MVP | FR-08, quy tắc 3 (Minh Trí) |
| UC-10 | Áp mã khuyến mãi | Khách hàng | Mở rộng | Chưa có FR |
| UC-11 | Cập nhật trạng thái đơn | Nhân viên quầy | MVP | FR-08, quy tắc 1 (Minh Trí) |
| UC-12 | Quản lý menu | Quản lý cửa hàng | Mở rộng | Chưa có FR |

Căn cứ phạm vi: tài liệu phạm vi xếp "Nhân viên/quản lý cập nhật trạng thái đơn" vào MVP; "Khuyến mãi"
và "Quản lý menu cho quản lý cửa hàng" vào phạm vi mở rộng. Căn cứ khách vãng lai: FR-17, FR-35 của
Hữu Mẫn ghi menu, chi tiết và giỏ hàng dùng được khi chưa đăng nhập.

UC-01 khớp mã và tên với đặc tả chi tiết của Anh Vũ ([`use-case-order-payment.md`](use-case-order-payment.md)) và với mẫu ma trận truy vết của đề
(`UC-01 Thanh toán`).

## 3. Quan hệ giữa các use-case

| Quan hệ | Ý nghĩa | Căn cứ |
|---------|---------|--------|
| UC-01, UC-07, UC-09, UC-11 `<<include>>` Xác thực JWT | Bắt buộc đã đăng nhập; chưa đăng nhập thì chuyển sang UC-06. | FR-05, FR-07 (Trí); FR-25, FR-35 (Mẫn) |
| UC-08 `<<extend>>` UC-07 | Từ lịch sử/chi tiết đơn, khách xem trạng thái hiện tại. | FR-07, FR-08 (Trí) |
| UC-10 `<<extend>>` UC-01 | Nhập mã khuyến mãi khi đặt đơn, không bắt buộc. | Tài liệu phạm vi (mở rộng) |
| Khách hàng kế thừa Khách vãng lai | Mọi use-case của khách vãng lai đều dùng được khi đã đăng nhập. | |
| Quản lý cửa hàng kế thừa Nhân viên quầy | Quản lý làm được mọi việc của nhân viên quầy. | FR-08: nhân viên/quản trị cập nhật trạng thái |

## 4. Vấn đề cần người phụ trách SRS xử lý

1. **Trùng mã FR.** `ssr.md` của Hữu Mẫn dùng FR-01 → FR-38, trong đó FR-05 → FR-08 trùng với
   FR-05 → FR-08 của Minh Trí nhưng là yêu cầu khác. Nhóm cần thống nhất cách đánh số (ví dụ Mẫn
   giữ FR-01 → FR-04 theo 4 nhóm chức năng, hoặc Trí đổi sang dải số khác). Sau khi chốt, cột
   *Yêu cầu liên quan* ở mục 2 sẽ được cập nhật theo.
2. **Khuyến mãi (UC-10) và quản lý menu (UC-12)** chưa có mã FR.
3. `ssr.md` có yêu cầu dựa trên mã nguồn Assignment 1 (vai trò `ADMIN`, topping "Đậm cafe", API
   `/inventory/...`). Các yêu cầu này không khớp với tài liệu phạm vi và code Assignment 2, nên chưa
   đưa vào sơ đồ.
