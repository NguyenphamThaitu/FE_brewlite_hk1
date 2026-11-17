# Architecture Decision Records (ADR)

> Task 3.1 · Người thực hiện: Quách Văn Trường (ADR-001, ADR-003 → ADR-010; ADR-002 do Thái Tú viết) · Reviewer: Nguyễn Phạm Thái Tú

Mỗi quyết định kiến trúc quan trọng được ghi thành một ADR ngắn. Không sửa nội dung quyết định
của ADR đã `Accepted`; khi đổi quyết định, tạo ADR mới và đánh dấu ADR cũ là `Superseded by ADR-xxx`.

| ADR | Quyết định | Trạng thái | Người viết |
|-----|-----------|------------|------------|
| [001](001-monorepo.md) | Monorepo `apps/web` + `apps/api` + `docs` | Accepted | Văn Trường |
| [002](002-deploy-platform.md) | Chọn Render làm nền tảng triển khai | Accepted | Thái Tú (PR #8) |
| [003](003-postgresql-prisma-migrations.md) | PostgreSQL + Prisma, migration bằng `prisma migrate` | Accepted | Văn Trường |
| [004](004-jwt-authentication.md) | Xác thực stateless bằng JWT, phân quyền theo role | Accepted | Văn Trường |
| [005](005-payment-gateway-idempotency.md) | Thanh toán qua VNPay sandbox, chống xử lý trùng | Superseded một phần by ADR-008 | Văn Trường |
| [006](006-inventory-transaction-row-locking.md) | Tồn kho theo nguyên liệu, transaction + khóa dòng | Accepted | Văn Trường |
| [007](007-ci-cd-github-actions.md) | CI/CD bằng GitHub Actions, image tag theo commit SHA | Accepted (CI: PR #4, #21 · CD: PR #57) | Văn Trường |
| [008](008-simulated-wallet-card-payment.md) | Thanh toán Ví/Thẻ mô phỏng, `Idempotency-Key`, trạng thái `PAYMENT_FAILED` | Accepted (PR #16, #18; cập nhật 17/11) | Văn Trường |
| [009](009-web-mobile-first-without-pwa.md) | Frontend web Next.js mobile-first, không làm PWA | Accepted (chờ lưu xác nhận của giảng viên) | Văn Trường |
| [010](010-config-health-logging.md) | Cấu hình qua biến môi trường, `GET /health` kiểm tra DB, log ra stdout | Accepted | Văn Trường |

Các ADR mô tả quyết định **đã hiện thực trong code** (ADR-001 → 010), kể cả phần CD của ADR-007
(pipeline `cd.yml` do Thái Tú dựng ở PR #57). ADR-002 do Thái Tú viết (đã merge ở PR #8).

## Tài liệu khác trong thư mục này

Các tệp sau nằm cùng thư mục nhưng không thuộc danh sách ADR ở trên (không theo mẫu ADR; hai tệp trùng số
thứ tự với ADR-009, ADR-010):

| Tệp | Nội dung | Người viết |
|-----|----------|------------|
| [`009-adr-render-deployment.md`](009-adr-render-deployment.md) | Nền tảng triển khai production trên Render (cùng chủ đề ADR-002) | Tuấn Vỹ |
| [`010-architecture-overview.md`](010-architecture-overview.md) | Tổng quan kiến trúc | Tuấn Vỹ |
| [`011-deployment-traceability.md`](011-deployment-traceability.md) | Ma trận truy vết triển khai (Task 3.2) | Tuấn Vỹ |
| [`architectural-approaches.md`](architectural-approaches.md) | Mô tả kiến trúc backend, dữ liệu, thanh toán, vận hành (Task 3.1) | Hữu Mẫn |

## Mẫu ADR

```markdown
# ADR-XXX: <Tên quyết định>

- Trạng thái: Proposed | Accepted | Superseded by ADR-YYY
- Ngày: YYYY-MM-DD
- Liên quan: FR-xx, NFR-xx, ADR-yyy

## Bối cảnh
## Quyết định
## Hệ quả
## Phương án đã cân nhắc
```
