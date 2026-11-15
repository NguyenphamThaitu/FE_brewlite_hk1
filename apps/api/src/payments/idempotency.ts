import { BadRequestException } from '@nestjs/common';

/** Key do frontend sinh một lần cho mỗi lượt bấm thanh toán (ví dụ UUID v4) và gửi lại y nguyên khi retry. */
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

/** Kiểm tra header Idempotency-Key (FR-26): thiếu hoặc sai định dạng thì trả 400. */
export function requireIdempotencyKey(raw: string | string[] | undefined): string {
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (!key?.trim()) throw new BadRequestException('Thiếu header Idempotency-Key');
  if (!KEY_PATTERN.test(key.trim()))
    throw new BadRequestException('Idempotency-Key không hợp lệ (8–100 ký tự: chữ, số, - hoặc _)');
  return key.trim();
}
