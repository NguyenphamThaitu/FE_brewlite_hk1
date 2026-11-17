import { decideCard, decideWallet, failureMessage } from './mock-payment';

describe('Thanh toán mô phỏng', () => {
  it('ví đủ tiền thì thành công, thiếu thì báo WALLET_INSUFFICIENT_BALANCE', () => {
    expect(decideWallet(58000, 58000)).toEqual({ ok: true });
    expect(decideWallet(57999, 58000)).toMatchObject({ ok: false, code: 'WALLET_INSUFFICIENT_BALANCE' });
  });

  it('thẻ test thành công', () => {
    expect(decideCard({ number: '4111111111111111' })).toEqual({ ok: true });
    expect(decideCard({ number: '5555555555554444' })).toEqual({ ok: true });
  });

  it('thẻ test bị từ chối / không đủ số dư / số thẻ lạ, kèm lý do', () => {
    expect(decideCard({ number: '4000000000000002' })).toMatchObject({ ok: false, code: 'CARD_DECLINED', message: 'Ngân hàng phát hành thẻ từ chối giao dịch' });
    expect(decideCard({ number: '4000000000009995' })).toMatchObject({ ok: false, code: 'CARD_INSUFFICIENT_FUNDS' });
    expect(decideCard({ number: '1234123412341234' })).toMatchObject({ ok: false, code: 'CARD_NOT_SUPPORTED' });
  });

  it('hạn thẻ không ảnh hưởng kết quả: chỉ số thẻ quyết định', () => {
    for (const expiry of ['11/12', '01/20', '12/99']) {
      expect(decideCard({ number: '4111111111111111', expiry } as { number: string })).toEqual({ ok: true });
      expect(decideCard({ number: '4000000000000002', expiry } as { number: string })).toMatchObject({ code: 'CARD_DECLINED' });
    }
  });

  it('giao dịch cũ có mã CARD_EXPIRED vẫn trả lại đúng thông báo; mã lạ dùng thông báo chung', () => {
    expect(failureMessage('CARD_EXPIRED')).toBe('Thẻ đã hết hạn');
    expect(failureMessage('XYZ')).toBe('Thanh toán thất bại');
  });

  it('ví có số dư lớn hơn số tiền cần thanh toán thì thành công', () => {
    expect(decideWallet(100000, 58000)).toEqual({ ok: true });
  });
  it('ví thiếu đúng 1 đồng thì thanh toán thất bại', () => {
    expect(decideWallet(57999, 58000)).toMatchObject({ ok: false, code: 'WALLET_INSUFFICIENT_BALANCE' });
  });
});
