\# 1. Vấn đề nghiệp vụ (Business Problem)



\## 1.1. Bối cảnh nghiệp vụ



BrewLite là hệ thống quản lý và đặt món dành cho cửa hàng cà phê, được xây dựng nhằm hỗ trợ khách hàng và nhân viên trong quá trình đặt hàng, thanh toán và xử lý đơn hàng.



Trong quy trình bán hàng truyền thống, khách hàng thường phải đến quầy để gọi món. Nhân viên tiếp nhận yêu cầu, tính tiền và theo dõi trạng thái đơn hàng theo cách thủ công. Quy trình này có thể mất nhiều thời gian, đặc biệt vào những giờ cao điểm. Ngoài ra, việc ghi nhận đơn hàng thủ công cũng dễ dẫn đến nhầm lẫn về món uống, sai sót trong tính toán và khó khăn khi quản lý nhiều đơn hàng cùng lúc.



BrewLite được xây dựng nhằm giải quyết những vấn đề trên thông qua một nền tảng trực tuyến, cho phép khách hàng xem thực đơn, tùy chỉnh đồ uống, đặt hàng và thanh toán. Đồng thời, hệ thống hỗ trợ nhân viên quản lý và xử lý đơn hàng hiệu quả hơn.



\## 1.2. Mô tả vấn đề nghiệp vụ



Quy trình đặt hàng thủ công tại cửa hàng cà phê có thể dẫn đến một số vấn đề:



\- Khách hàng phải xếp hàng và chờ đợi để gọi món.

\- Nhân viên có thể ghi nhận sai thông tin đơn hàng hoặc tính sai giá tiền.

\- Khách hàng khó theo dõi trạng thái đơn hàng sau khi đặt.

\- Việc xử lý đơn hàng trở nên khó khăn khi lượng khách tăng cao vào giờ cao điểm.

\- Thiếu hệ thống quản lý tập trung khiến việc quản lý đơn hàng chưa hiệu quả.



Vì vậy, BrewLite được phát triển nhằm cải thiện trải nghiệm đặt hàng của khách hàng, đồng thời hỗ trợ nhân viên cửa hàng quản lý và xử lý đơn hàng một cách nhanh chóng, chính xác và thuận tiện hơn.



\# 2. Xác định các bên liên quan (Stakeholder Identification)



\## 2.1. Bảng các bên liên quan



| Bên liên quan | Vai trò / Mô tả | Nhu cầu và mong đợi chính |

|---|---|---|

| Khách hàng (Customer) | Người sử dụng hệ thống để đặt đồ uống. | Xem thực đơn, tùy chỉnh đồ uống, đặt hàng, thanh toán và theo dõi trạng thái đơn hàng. |

| Nhân viên thu ngân (Cashier) | Nhân viên tiếp nhận và xử lý thông tin đơn hàng của khách. | Xem đơn hàng mới, xác nhận thông tin đơn hàng và xử lý thanh toán. |

| Nhân viên pha chế (Barista) | Nhân viên chịu trách nhiệm chuẩn bị đồ uống. | Xem chi tiết đơn hàng, cập nhật trạng thái chuẩn bị và hoàn thành đơn hàng chính xác. |

| Quản lý cửa hàng (Shop Manager) | Người chịu trách nhiệm quản lý hoạt động của cửa hàng. | Quản lý sản phẩm, giá bán, đơn hàng và theo dõi hoạt động kinh doanh. |

| Quản trị viên hệ thống (System Administrator) | Người chịu trách nhiệm quản lý và duy trì hệ thống. | Quản lý tài khoản người dùng, cấu hình hệ thống và đảm bảo hệ thống hoạt động ổn định. |

| Nhóm phát triển (Development Team) | Nhóm chịu trách nhiệm xây dựng và bảo trì hệ thống BrewLite. | Nắm rõ yêu cầu, triển khai chức năng, kiểm thử và đảm bảo chất lượng phần mềm. |

