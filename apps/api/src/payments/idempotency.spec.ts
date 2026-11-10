import { BadRequestException } from '@nestjs/common';
import { requireIdempotencyKey } from './idempotency';

describe('requireIdempotencyKey', () => {
  it('nhận UUID và trả về key đã cắt khoảng trắng', () => {
    expect(requireIdempotencyKey(' 3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f ')).toBe('3f2b8c1e-9d4a-4c6b-8e2f-1a2b3c4d5e6f');
  });
  it('lấy giá trị đầu tiên khi header bị gửi lặp', () => {
    expect(requireIdempotencyKey(['key_12345', 'khac_6789'])).toBe('key_12345');
  });
  it('thiếu header hoặc rỗng → 400', () => {
    for (const v of [undefined, '', '   ']) expect(() => requireIdempotencyKey(v)).toThrow(BadRequestException);
    expect(() => requireIdempotencyKey(undefined)).toThrow('Thiếu header Idempotency-Key');
  });
  it('sai định dạng → 400', () => {
    for (const v of ['ngan', 'co dau cach 123', 'ký-tự-lạ-123', 'x'.repeat(101)])
      expect(() => requireIdempotencyKey(v)).toThrow('Idempotency-Key không hợp lệ');
  });
});
