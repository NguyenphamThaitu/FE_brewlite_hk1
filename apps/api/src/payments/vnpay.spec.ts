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


  it('chữ ký không phụ thuộc thứ tự thuộc tính đầu vào', () => {
    const reordered = { vnp_TxnRef: '1001', vnp_OrderInfo: 'Thanh toan don 1', vnp_Command: 'pay', vnp_Amount: 5800000 };
    expect(sign(reordered, secret)).toBe(sign(params, secret));
  });
  it('chấp nhận chữ ký viết hoa và bỏ qua vnp_SecureHashType', () => {
    const hash = sign(params, secret).toUpperCase();
    expect(verifySignature({ ...params, vnp_SecureHash: hash, vnp_SecureHashType: 'แบบทดสอบ' }, secret)).toBe(true);
  });
  it('từ chối khi thay đổi mã giao dịch sau khi ký', () => {
    expect(verifySignature({
      ...params,
      vnp_TxnRef: '1002',
      vnp_SecureHash: sign(params, secret),
    }, secret)).toBe(false);
  });
  it('lọc tham số rỗng khỏi URL thanh toán', () => {
    const url = buildPaymentUrl('https://x/pay', secret, { ...params, vnp_Extra: '' });
    expect(url).not.toContain('vnp_Extra=');
    expect(url).toContain('vnp_SecureHash=');
  });
  it('định dạng đúng thời điểm sát mốc chuyển ngày theo GMT+7', () => {
    expect(vnpDate(new Date('2026-11-10T17:00:00Z'))).toBe('20261111000000');
  });
});
