# Architecture Decision Records (ADR)

> Task 3.1 · Người thực hiện: Quách Văn Trường · Reviewer: Nguyễn Phạm Thái Tú

Mỗi quyết định kiến trúc quan trọng được ghi thành một ADR ngắn. Không sửa nội dung quyết định
của ADR đã `Accepted`; khi đổi quyết định, tạo ADR mới và đánh dấu ADR cũ là `Superseded by ADR-xxx`.

| ADR | Quyết định | Trạng thái |
|-----|-----------|------------|
| [001](001-monorepo.md) | Monorepo `apps/web` + `apps/api` + `docs` | Accepted |
| [002](002-deploy-render.md) | Triển khai production trên Render, image Docker lưu ở GHCR | Proposed |
| [003](003-postgresql-prisma-migrations.md) | PostgreSQL + Prisma, migration bằng `prisma migrate` | Accepted |
| [004](004-jwt-authentication.md) | Xác thực stateless bằng JWT, mật khẩu băm bcrypt | Accepted |
| [005](005-mock-payment-idempotency.md) | Cổng thanh toán mô phỏng + `Idempotency-Key` | Accepted |
| [006](006-inventory-transaction-optimistic-locking.md) | Transaction + optimistic locking cho tồn kho | Accepted |
| [007](007-ci-cd-github-actions.md) | CI/CD bằng GitHub Actions, tag image theo commit SHA | Proposed |

`Proposed` nghĩa là chờ người phụ trách (Thái Tú – nền tảng deploy và pipeline) xác nhận.

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
