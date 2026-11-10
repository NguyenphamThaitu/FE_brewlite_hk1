# Architecture Decision Records (ADR)

> Task 3.1 · Người thực hiện: Quách Văn Trường (trừ ADR-002) · Reviewer: Nguyễn Phạm Thái Tú

Mỗi quyết định kiến trúc quan trọng được ghi thành một ADR ngắn. Không sửa nội dung quyết định
của ADR đã `Accepted`; khi đổi quyết định, tạo ADR mới và đánh dấu ADR cũ là `Superseded by ADR-xxx`.

| ADR | Quyết định | Trạng thái | Người viết |
|-----|-----------|------------|------------|
| [001](001-monorepo.md) | Monorepo `apps/web` + `apps/api` + `docs` | Accepted | Văn Trường |
| [002](002-deploy-platform.md) | Chọn Render làm nền tảng triển khai | Accepted | Thái Tú (nhánh `docs/adr-deploy-platform`) |
| [003](003-postgresql-prisma-migrations.md) | PostgreSQL + Prisma, migration bằng `prisma migrate` | Accepted | Văn Trường |
| [004](004-jwt-authentication.md) | Xác thực stateless bằng JWT, phân quyền theo role | Accepted | Văn Trường |
| [005](005-payment-gateway-idempotency.md) | Thanh toán qua VNPay sandbox, chống xử lý trùng | Accepted, cần cập nhật SRS | Văn Trường |
| [006](006-inventory-transaction-row-locking.md) | Tồn kho theo nguyên liệu, transaction + khóa dòng | Accepted, cần cập nhật SRS | Văn Trường |
| [007](007-ci-cd-github-actions.md) | CI/CD bằng GitHub Actions, image tag theo commit SHA | CI: Accepted · CD: Proposed | Văn Trường |

Các ADR mô tả quyết định **đã hiện thực trong code ở `main`**. Riêng phần CD của ADR-007 là đề xuất,
chờ Thái Tú dựng pipeline. ADR-002 do Thái Tú viết; liên kết sẽ hoạt động sau khi nhánh của Tú được merge.

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
