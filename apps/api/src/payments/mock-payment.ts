/**
 * Thanh toán mô phỏng (FR-24 Ví, FR-25 Thẻ): không gọi ngân hàng thật.
 * Kết quả thẻ được quyết định theo số thẻ test cố định để kiểm thử lặp lại được.
 */
export const MOCK_METHODS = ['WALLET', 'CARD'] as const;
export type MockMethod = (typeof MOCK_METHODS)[number];

export type CardDecision = { ok: true } | { ok: false; code: string; message: string };

const FAILURE_MESSAGES: Record<string, string> = {
  CARD_DECLINED: 'Thẻ bị ngân hàng từ chối',
  CARD_INSUFFICIENT_FUNDS: 'Thẻ không đủ số dư',
  CARD_EXPIRED: 'Thẻ đã hết hạn',
  CARD_NOT_SUPPORTED: 'Chỉ chấp nhận số thẻ test của môi trường mô phỏng',
  WALLET_INSUFFICIENT_BALANCE: 'Số dư ví không đủ',
};

/** Thông báo cho mã lỗi (dùng cả khi trả lại kết quả cũ từ Payment.responseCode). */
export const failureMessage = (code: string | null) => FAILURE_MESSAGES[code ?? ''] ?? 'Thanh toán thất bại';
const fail = (code: string): CardDecision => ({ ok: false, code, message: failureMessage(code) });

/** Số thẻ test: null = thành công, chuỗi = mã lỗi. Số thẻ khác (đúng định dạng) bị từ chối. */
export const TEST_CARDS: Record<string, string | null> = {
  '4111111111111111': null,
  '5555555555554444': null,
  '4000000000000002': 'CARD_DECLINED',
  '4000000000009995': 'CARD_INSUFFICIENT_FUNDS',
};

/** expiry dạng MM/YY. Thẻ còn hạn đến hết tháng ghi trên thẻ. */
export function isExpired(expiry: string, now = new Date()): boolean {
  const [mm, yy] = expiry.split('/').map(Number);
  return now >= new Date(2000 + yy, mm, 1); // ngày 1 của tháng kế tiếp
}

export function decideCard(card: { number: string; expiry: string }, now = new Date()): CardDecision {
  if (isExpired(card.expiry, now)) return fail('CARD_EXPIRED');
  if (!(card.number in TEST_CARDS)) return fail('CARD_NOT_SUPPORTED');
  const code = TEST_CARDS[card.number];
  return code ? fail(code) : { ok: true };
}

export function decideWallet(balance: number, amount: number): CardDecision {
  return balance >= amount ? { ok: true } : fail('WALLET_INSUFFICIENT_BALANCE');
}
