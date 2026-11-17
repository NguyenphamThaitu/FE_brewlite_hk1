-- Ví mô phỏng: tài khoản mới được cấp sẵn 1.000.000đ thay vì 200.000đ.
-- Chỉ đổi giá trị mặc định cho tài khoản tạo sau migration này; số dư của tài khoản đã có giữ nguyên.
ALTER TABLE "User" ALTER COLUMN "walletBalance" SET DEFAULT 1000000;
