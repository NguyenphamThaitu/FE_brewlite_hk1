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


  it('chấp nhận key có độ dài tối thiểu 8 ký tự', () => {
    expect(requireIdempotencyKey('12345678')).toBe('12345678');
  });
  it('chấp nhận key có độ dài tối đa 100 ký tự', () => {
    const key = 'a'.repeat(100);
    expect(requireIdempotencyKey(key)).toBe(key);
  });
  it('từ chối key ngắn hơn 8 ký tự hoặc dài hơn 100 ký tự', () => {
    expect(() => requireIdempotencyKey('1234567')).toThrow(BadRequestException);
    expect(() => requireIdempotencyKey('a'.repeat(101))).toThrow(BadRequestException);
  });
  it('từ chối mảng header rỗng hoặc phần tử đầu tiên rỗng', () => {
    expect(() => requireIdempotencyKey([])).toThrow(BadRequestException);
    expect(() => requireIdempotencyKey(['', 'valid_key_123'])).toThrow(BadRequestException);
  });
  it('chấp nhận ký tự gạch dưới và gạch ngang', () => {
    expect(requireIdempotencyKey('order_123-abc')).toBe('order_123-abc');
  });
});
