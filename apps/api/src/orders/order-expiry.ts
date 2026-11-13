/** Thời hạn thanh toán mặc định của đơn chưa thanh toán (FR-22), đổi bằng ORDER_PAYMENT_TIMEOUT_MINUTES */
export const DEFAULT_PAYMENT_TIMEOUT_MINUTES = 15;
/** Chu kỳ quét đơn quá hạn mặc định, đổi bằng ORDER_EXPIRY_CHECK_INTERVAL_SECONDS (0 = tắt) */
export const DEFAULT_EXPIRY_CHECK_INTERVAL_SECONDS = 60;
/** Link thanh toán VNPay hết hạn sau ngần này phút (vnp_ExpireDate) */
export const VNPAY_LINK_TTL_MINUTES = 15;

/** Đọc số nguyên từ biến môi trường; trống, sai định dạng hoặc nhỏ hơn `min` thì dùng giá trị mặc định */
export function readIntSetting(raw: string | undefined, fallback: number, min: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

export const minutesBefore = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000);
