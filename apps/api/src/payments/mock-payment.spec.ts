import { decideCard, decideWallet, isExpired } from './mock-payment';

describe('Thanh toán mô phỏng', () => {
  const now = new Date('2026-11-11T10:00:00Z');

  it('ví đủ tiền thì thành công, thiếu thì báo WALLET_INSUFFICIENT_BALANCE', () => {
    expect(decideWallet(58000, 58000)).toEqual({ ok: true });
    expect(decideWallet(57999, 58000)).toMatchObject({ ok: false, code: 'WALLET_INSUFFICIENT_BALANCE' });
  });

  it('thẻ test thành công', () => {
    expect(decideCard({ number: '4111111111111111', expiry: '12/30' }, now)).toEqual({ ok: true });
    expect(decideCard({ number: '5555555555554444', expiry: '11/26' }, now)).toEqual({ ok: true });
  });

  it('thẻ test bị từ chối / không đủ số dư / số thẻ lạ', () => {
    expect(decideCard({ number: '4000000000000002', expiry: '12/30' }, now)).toMatchObject({ ok: false, code: 'CARD_DECLINED' });
    expect(decideCard({ number: '4000000000009995', expiry: '12/30' }, now)).toMatchObject({ ok: false, code: 'CARD_INSUFFICIENT_FUNDS' });
    expect(decideCard({ number: '1234123412341234', expiry: '12/30' }, now)).toMatchObject({ ok: false, code: 'CARD_NOT_SUPPORTED' });
  });

  it('thẻ hết hạn: còn dùng được trong tháng ghi trên thẻ, sang tháng sau thì hết hạn', () => {
    expect(isExpired('11/26', now)).toBe(false);
    expect(isExpired('10/26', now)).toBe(true);
    expect(decideCard({ number: '4111111111111111', expiry: '10/26' }, now)).toMatchObject({ ok: false, code: 'CARD_EXPIRED' });
  });
});
