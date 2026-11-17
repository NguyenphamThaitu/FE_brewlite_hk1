# 1. Vấn đề nghiệp vụ (Business Problem)

## 1.1. Bối cảnh nghiệp vụ

BrewLite là hệ thống quản lý và đặt món dành cho cửa hàng cà phê, được xây dựng nhằm hỗ trợ khách hàng và nhân viên trong quá trình đặt hàng, thanh toán và xử lý đơn hàng.

Trong quy trình bán hàng truyền thống, khách hàng thường phải đến quầy để gọi món. Nhân viên tiếp nhận yêu cầu, tính tiền và theo dõi trạng thái đơn hàng theo cách thủ công. Quy trình này có thể mất nhiều thời gian, đặc biệt vào những giờ cao điểm. Ngoài ra, việc ghi nhận đơn hàng thủ công cũng dễ dẫn đến nhầm lẫn về món uống, sai sót trong tính toán và khó khăn khi quản lý nhiều đơn hàng cùng lúc.

BrewLite được xây dựng nhằm giải quyết những vấn đề trên thông qua một nền tảng trực tuyến, cho phép khách hàng xem thực đơn, tùy chỉnh đồ uống, đặt hàng và thanh toán. Đồng thời, hệ thống hỗ trợ nhân viên quản lý và xử lý đơn hàng hiệu quả hơn.

## 1.2. Mô tả vấn đề nghiệp vụ

Quy trình đặt hàng thủ công tại cửa hàng cà phê có thể dẫn đến một số vấn đề:

- Khách hàng phải xếp hàng và chờ đợi để gọi món.

- Nhân viên có thể ghi nhận sai thông tin đơn hàng hoặc tính sai giá tiền.

- Khách hàng khó theo dõi trạng thái đơn hàng sau khi đặt.

- Việc xử lý đơn hàng trở nên khó khăn khi lượng khách tăng cao vào giờ cao điểm.

- Thiếu hệ thống quản lý tập trung khiến việc quản lý đơn hàng chưa hiệu quả.

Vì vậy, BrewLite được phát triển nhằm cải thiện trải nghiệm đặt hàng của khách hàng, đồng thời hỗ trợ nhân viên cửa hàng quản lý và xử lý đơn hàng một cách nhanh chóng, chính xác và thuận tiện hơn.

# 2. Xác định các bên liên quan (Stakeholder Identification)

## 2.1. Bảng các bên liên quan

| Bên liên quan | Vai trò / Mô tả | Nhu cầu và mong đợi chính |
|---|---|---|
| Khách hàng (Customer) | Người sử dụng hệ thống để đặt đồ uống. | Xem thực đơn, tùy chỉnh đồ uống, đặt hàng, thanh toán và theo dõi trạng thái đơn hàng. |
| Nhân viên thu ngân (Cashier) | Nhân viên tiếp nhận và xử lý thông tin đơn hàng của khách. | Xem đơn hàng mới, xác nhận thông tin đơn hàng và xử lý thanh toán. |
| Nhân viên pha chế (Barista) | Nhân viên chịu trách nhiệm chuẩn bị đồ uống. | Xem chi tiết đơn hàng, cập nhật trạng thái chuẩn bị và hoàn thành đơn hàng chính xác. |
| Quản lý cửa hàng (Shop Manager) | Người chịu trách nhiệm quản lý hoạt động của cửa hàng. | Quản lý sản phẩm, giá bán, đơn hàng và theo dõi hoạt động kinh doanh. |
| Quản trị viên hệ thống (System Administrator) | Người chịu trách nhiệm quản lý và duy trì hệ thống. | Quản lý tài khoản người dùng, cấu hình hệ thống và đảm bảo hệ thống hoạt động ổn định. |
| Nhóm phát triển (Development Team) | Nhóm chịu trách nhiệm xây dựng và bảo trì hệ thống BrewLite. | Nắm rõ yêu cầu, triển khai chức năng, kiểm thử và đảm bảo chất lượng phần mềm. |
| Giảng viên (Instructor) | Người đưa ra yêu cầu bài tập và đánh giá kết quả thực hiện dự án. | Đảm bảo hệ thống đáp ứng yêu cầu bài tập, đánh giá tài liệu và sản phẩm của nhóm. |
| Cổng thanh toán mô phỏng (Mock Payment Gateway) | Hệ thống bên ngoài hỗ trợ xử lý các giao dịch thanh toán mô phỏng. | Tiếp nhận yêu cầu thanh toán và trả về kết quả giao dịch thành công hoặc thất bại. |

# 3. Phạm vi dự án (Project Scope)

## 3.1. Phạm vi thực hiện (In-scope)

Trong phiên bản MVP, BrewLite tập trung vào các chức năng chính:

- Xem thực đơn đồ uống và chi tiết sản phẩm, bao gồm size và topping.

- Quản lý giỏ hàng và tính tổng tiền.

- Đăng ký, đăng nhập và xác thực người dùng bằng JWT.

- Tạo đơn hàng và thanh toán mô phỏng bằng ví hoặc thẻ.

- Xem xác nhận đơn hàng, trạng thái đơn hàng và lịch sử đơn hàng.

- Hỗ trợ nhân viên, quản lý cập nhật trạng thái đơn hàng.

- Kiểm tra dữ liệu ở frontend và backend.

- Triển khai hệ thống web, API và kiểm tra tình trạng hoạt động của API.

## 3.2. Phạm vi mở rộng (Out-of-scope for MVP / Future Scope)

Các chức năng có thể xem xét phát triển thêm khi có đủ thời gian và nguồn lực:

- Khuyến mãi và tích điểm khách hàng.

- Quản lý menu dành cho quản lý cửa hàng.

- Thông báo trạng thái đơn hàng theo thời gian thực.

## 3.3. Ngoài phạm vi dự án (Out-of-scope)

- Ứng dụng mobile native và PWA; dự án chỉ triển khai ứng dụng web theo xác nhận của giảng viên.

- Thanh toán thật thông qua các cổng thanh toán bên ngoài; hệ thống chỉ sử dụng thanh toán mô phỏng.

- Giao hàng, theo dõi shipper và bản đồ.

- Quản lý kho nâng cao và báo cáo doanh thu.

- Hỗ trợ đa ngôn ngữ và đa chi nhánh.

# 4. Giả định (Assumptions)

- Giảng viên xác nhận dự án chỉ cần ứng dụng web, không yêu cầu mobile native hoặc PWA.

- Dịch vụ thanh toán mô phỏng có thể trả về kết quả thành công hoặc thất bại để phục vụ kiểm thử.

- Mỗi đơn hàng được gắn với một khách hàng đã đăng nhập.

- Hệ thống phục vụ một cửa hàng và sử dụng VND làm đơn vị tiền tệ.

- Nền tảng triển khai miễn phí đáp ứng nhu cầu demo và đánh giá bài tập.

- Người dùng truy cập hệ thống bằng các trình duyệt web hiện đại.

# 5. Ràng buộc (Constraints)

- \*\*Thời gian:\*\* Dự án được thực hiện trong thời gian ngắn, với nhóm gồm 6 thành viên.

- \*\*Ngân sách:\*\* Không có kinh phí riêng; ưu tiên sử dụng các dịch vụ và công cụ miễn phí.

- \*\*Công nghệ:\*\* Sử dụng Next.js, NestJS, PostgreSQL, Docker và GitHub Actions.

- \*\*Quy trình:\*\* Thực hiện các Task theo thứ tự từ Task 1 đến Task 5; các thay đổi cần có lịch sử commit/PR rõ ràng và PR phải vượt qua CI trước khi merge.

- \*\*Bảo mật:\*\* Không đưa thông tin bí mật (secret) vào repository; cơ sở dữ liệu không được public trực tiếp.

# 6. Rủi ro dự án (Project Risks)

| Mã | Rủi ro | Mức độ | Biện pháp giảm thiểu |
|---|---|---|---|
| R1 | Không đủ thời gian hoàn thành các chức năng | Cao | Phân chia công việc song song, ưu tiên yêu cầu quan trọng theo MoSCoW. |
| R2 | Triển khai gặp lỗi do biến môi trường, CORS hoặc cơ sở dữ liệu | Cao | Triển khai sớm, kiểm tra và triển khai lại nhiều lần. |
| R3 | Giới hạn của các dịch vụ miễn phí ảnh hưởng đến demo | Cao | Kiểm tra giới hạn dịch vụ, chuẩn bị dữ liệu và script seed để khôi phục khi cần. |
| R4 | Xung đột mã nguồn khi nhiều thành viên cùng phát triển | Trung bình | Mỗi thành viên làm việc trên nhánh riêng, tạo PR nhỏ và thực hiện review chéo. |
| R5 | Tài liệu không nhất quán với mã nguồn | Trung bình | Đối chiếu các sơ đồ, đặc tả và traceability với chức năng đã triển khai. |
| R6 | Chưa có xác nhận rõ ràng về việc bỏ mobile/PWA | Cao | Lưu bằng chứng xác nhận của giảng viên trong repository. |
| R7 | Lộ thông tin bí mật trong repository hoặc log CI | Cao | Sử dụng `.gitignore`, biến môi trường và GitHub Secrets. |
| R8 | Thành viên vắng mặt hoặc không hoàn thành công việc đúng hạn | Cao | Phân công người review, chia sẻ kiến thức và chuẩn bị người hỗ trợ dự phòng. |

\*\*Tài liệu tham chiếu:\*\* Nội dung chi tiết về phạm vi, giả định, ràng buộc và rủi ro được trình bày tại \[scope-assumptions-risks.md](./scope-assumptions-risks.md).
