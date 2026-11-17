# Sprint Review và Sprint Retrospective – BrewLite

_Cập nhật nội dung rà soát đến ngày 17/11/2026._

# 1. Sprint Review

## 1.1. Sprint 1

### 1.1.1. Mục tiêu

Thiết lập nền tảng phát triển dự án BrewLite, hoàn thiện cấu trúc repository, tài liệu ban đầu, chức năng menu và quy trình kiểm tra mã nguồn tự động.

### 1.1.2. Kết quả thực hiện

Các công việc chính thuộc Sprint 1:

- Thiết lập repository và cấu trúc thư mục dự án.
- Đưa tài liệu Task 1–3 vào thư mục `docs`.
- Thiết lập Branch Strategy và quy ước làm việc nhóm.
- Hoàn thiện README, `.gitignore` và `.env.example`.
- Xây dựng Product API, dữ liệu seed và API tests.
- Xây dựng giao diện Menu và Component Tests.
- Thiết lập CI Pipeline cho Pull Request.
- Chuẩn bị minh chứng CI thành công và thất bại.
- Quản lý Issue Board và Product Backlog cho Sprint 1–2.

### 1.1.3. Đánh giá kết quả

Sprint 1 đã thiết lập được nền tảng cần thiết cho quá trình phát triển BrewLite. Repository có cấu trúc rõ ràng, các thành viên có quy ước làm việc chung, chức năng menu và Product API được xây dựng, đồng thời quy trình CI hỗ trợ kiểm tra chất lượng mã nguồn trước khi merge.

## 1.2. Sprint 2

### 1.2.1. Mục tiêu

Phát triển các chức năng nghiệp vụ chính của BrewLite, tích hợp frontend với backend, hoàn thiện quy trình đặt hàng và thanh toán, kiểm thử và chuẩn bị triển khai hệ thống.

### 1.2.2. Kết quả thực hiện

Các công việc chính thuộc Sprint 2:

- Xây dựng Product Detail và Cart.
- Xây dựng chức năng đăng ký, đăng nhập và xác thực JWT ở backend.
- Hoàn thiện màn hình Login và Register ở frontend.
- Xây dựng backend xử lý Orders, Payments và Order Status.
- Hoàn thiện Checkout và Order History ở frontend.
- Hoàn thiện Backend Validation, Error Handling và Health Endpoint.
- Bổ sung Unit Tests và Integration Tests.
- Xây dựng End-to-End Test cho luồng đặt hàng.
- Hoàn thiện Migration, Seed và Docker Compose.
- Thiết lập CD Pipeline và triển khai Production.
- Cấu hình Production Environment và bảo mật hệ thống.
- Viết tài liệu Deployment và hướng dẫn Rollback.
- Chuẩn bị Release, Version Tag, Release Notes, Demo và Sprint Review/Retrospective.

### 1.2.3. Các chức năng và thay đổi bổ sung ngày 17/11/2026

Trong quá trình rà soát và hoàn thiện hệ thống, nhóm đã bổ sung và điều chỉnh một số chức năng:

- Cấp số dư ví mô phỏng mặc định 1.000.000 VND cho tài khoản mới.
- Hiển thị số dư ví của khách hàng và ngăn thanh toán bằng ví khi số dư không đủ.
- Bổ sung trang theo dõi đơn hàng, tự động cập nhật trạng thái bằng cơ chế polling.
- Liên kết chức năng theo dõi đơn hàng từ trang lịch sử và khu vực xác nhận đơn hàng.
- Điều chỉnh quyền hủy đơn chưa thanh toán: chỉ chủ sở hữu đơn hàng được thực hiện thao tác hủy.
- Hoàn thiện API dành cho nhân viên để xem danh sách đơn hàng và cập nhật trạng thái đơn.
- Điều chỉnh kết quả thanh toán thẻ mô phỏng dựa trên số thẻ kiểm thử; không sử dụng hạn thẻ và CVV để quyết định kết quả.
- Bổ sung kiểm thử cho quyền hủy đơn, lưu giá sản phẩm tại thời điểm đặt hàng và xử lý yêu cầu đồng thời.

### 1.2.4. Kết quả kiểm thử và triển khai

- Báo cáo kiểm thử API ghi nhận 47/47 Integration Tests đạt tại commit `0cd0501`.
- Bổ sung kiểm thử End-to-End bằng Playwright trên trình duyệt Chrome thật cho luồng đặt hàng và theo dõi đơn.
- Kiểm thử Playwright tại PR #84 ghi nhận 1 test đạt.
- CI/CD trên nhánh `main` hoạt động thành công theo kết quả rà soát ngày 17/11/2026.
- Frontend, API và API Health Check trên môi trường Production trả về HTTP 200 tại thời điểm rà soát.
- Bổ sung tài liệu triển khai, hướng dẫn Rollback và minh chứng triển khai.

### 1.2.5. Đánh giá kết quả

Sprint 2 đã xây dựng và tích hợp các chức năng nghiệp vụ chính, từ xác thực người dùng, xem sản phẩm, giỏ hàng, đặt hàng, thanh toán đến lịch sử và theo dõi đơn hàng. Hệ thống có các kiểm thử frontend, backend, integration và kiểm thử trên trình duyệt thật, đồng thời đã được triển khai trên môi trường Production.

Tuy nhiên, tại thời điểm cập nhật tài liệu, hai công việc Release và Demo/Review/Retrospective tương ứng với Issue #45 và #46 vẫn đang được tiếp tục hoàn thiện. Vì vậy, chưa xem toàn bộ công việc bàn giao cuối cùng là đã hoàn tất.

## 1.3. Đánh giá chung

Qua hai Sprint, BrewLite đã hình thành hệ thống đặt hàng trực tuyến với các chức năng chính dành cho khách hàng và nhân viên. Các thành phần frontend, backend và cơ sở dữ liệu đã được tích hợp, có quy trình kiểm thử và triển khai tự động.

Những công việc còn lại tập trung vào hoàn thiện phiên bản phát hành, tài liệu Release Notes và chuẩn bị Demo, tổng kết Sprint trước khi bàn giao.

---

# 2. Sprint Retrospective

## 2.1. Sprint 1

### Những điểm làm tốt

- Các thành viên có phân công nhiệm vụ và trách nhiệm tương đối rõ ràng.
- Nhóm thiết lập quy ước Git, sử dụng nhánh làm việc riêng và Pull Request.
- Các chức năng ban đầu được chia nhỏ, giúp thuận tiện cho việc phát triển và kiểm thử.
- Có quy trình CI để phát hiện lỗi trước khi hợp nhất mã nguồn.

### Những vấn đề gặp phải

- Việc thống nhất tài liệu và cấu trúc repository cần được rà soát nhiều lần.
- Một số nội dung tài liệu cần điều chỉnh để nhất quán với phạm vi và yêu cầu thực tế.
- Việc cập nhật tiến độ trên Issue Board cần được thực hiện thường xuyên hơn.

## 2.2. Sprint 2

### Những điểm làm tốt

- Các chức năng frontend và backend được phát triển theo từng phần rồi tích hợp vào hệ thống chung.
- Nhóm bổ sung kiểm thử cho các nghiệp vụ quan trọng như đặt hàng, thanh toán, tồn kho và xác thực.
- Quy trình CI/CD hỗ trợ kiểm tra và triển khai hệ thống.
- Các thành viên phối hợp xử lý những vấn đề phát sinh khi tích hợp và rà soát sản phẩm.

### Những vấn đề gặp phải

- Một số chức năng frontend và backend cần điều chỉnh để thống nhất API và cấu trúc dữ liệu.
- Quá trình kiểm thử phát hiện các trường hợp nghiệp vụ cần bổ sung hoặc điều chỉnh.
- Một số tài liệu chưa được cập nhật kịp thời theo thay đổi trong mã nguồn.
- Một số Issue đã được đóng trước khi các tiêu chí bàn giao tương ứng hoàn tất.
- Việc kiểm thử luồng nghiệp vụ trên trình duyệt thật cần được bổ sung để tăng độ tin cậy so với kiểm thử giao diện bằng dữ liệu giả lập.

## 2.3. Hướng cải thiện

- Thống nhất API, cấu trúc dữ liệu và mã định danh yêu cầu trước khi triển khai các chức năng liên quan.
- Cập nhật trạng thái công việc thường xuyên trên GitHub Project.
- Chỉ đóng Issue khi các tiêu chí chấp nhận đã được đáp ứng.
- Tạo Pull Request sớm để các thành viên có thời gian review.
- Kiểm thử từng chức năng trước khi tích hợp vào nhánh chung.
- Đối chiếu tài liệu với mã nguồn sau mỗi thay đổi nghiệp vụ quan trọng.
- Bổ sung kiểm thử End-to-End trên trình duyệt thật cho những luồng người dùng quan trọng.
- Trao đổi sớm khi phát sinh lỗi hoặc có thay đổi ảnh hưởng đến phần việc của thành viên khác.

## 2.4. Kết luận Retrospective

Qua hai Sprint, nhóm rút ra kinh nghiệm về phân chia công việc, quản lý mã nguồn, kiểm thử, cập nhật tài liệu và phối hợp trong quá trình phát triển phần mềm.

Những kinh nghiệm này cần được áp dụng trong giai đoạn hoàn thiện và bàn giao BrewLite, đặc biệt là việc đồng bộ trạng thái công việc, bảo đảm tiêu chí chấp nhận và duy trì tính nhất quán giữa sản phẩm với tài liệu.

---

# 3. Tổng kết

Sprint 1 tập trung xây dựng nền tảng dự án, chức năng menu và quy trình làm việc nhóm. Sprint 2 tập trung hoàn thiện các chức năng nghiệp vụ, kiểm thử, tích hợp và triển khai hệ thống.

Đến ngày 17/11/2026, các chức năng chính của BrewLite đã được phát triển và tích hợp. Nhóm tiếp tục hoàn thiện Release, Demo và các nội dung tổng kết trước khi bàn giao phiên bản cuối cùng.