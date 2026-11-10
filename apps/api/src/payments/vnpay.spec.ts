import { buildPaymentUrl, sign, verifySignature, vnpDate } from './vnpay';

describe('vnpay', () => {
  const secret = 'SECRET123';
  const params = { vnp_Amount: 5800000, vnp_Command: 'pay', vnp_OrderInfo: 'Thanh toan don 1', vnp_TxnRef: '1001' };

  it('verify đúng chữ ký', () => {
    expect(verifySignature({ ...params, vnp_SecureHash: sign(params, secret) }, secret)).toBe(true);
  });
  it('từ chối khi sửa dữ liệu (đổi số tiền)', () => {
    expect(verifySignature({ ...params, vnp_Amount: 100, vnp_SecureHash: sign(params, secret) }, secret)).toBe(false);
  });
  it('từ chối khi thiếu chữ ký hoặc sai secret', () => {
    expect(verifySignature(params, secret)).toBe(false);
    expect(verifySignature({ ...params, vnp_SecureHash: sign(params, 'khac') }, secret)).toBe(false);
  });
  it('URL thanh toán chứa vnp_SecureHash và encode khoảng trắng bằng +', () => {
    const url = buildPaymentUrl('https://x/pay', secret, params);
    expect(url).toContain('vnp_OrderInfo=Thanh+toan+don+1');
    expect(url).toMatch(/&vnp_SecureHash=[0-9a-f]{128}$/);
  });
  it('định dạng ngày giờ GMT+7', () => {
    expect(vnpDate(new Date('2026-11-10T00:30:15Z'))).toBe('20261110073015');
  });
});
