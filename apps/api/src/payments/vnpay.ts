import { createHmac, timingSafeEqual } from 'crypto';

export type VnpParams = Record<string, string | number>;

/** Sắp xếp theo key, encode value kiểu VNPay (khoảng trắng → +) */
function buildQuery(params: VnpParams): string {
  return Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k])).replace(/%20/g, '+')}`)
    .join('&');
}

export const sign = (params: VnpParams, secret: string) =>
  createHmac('sha512', secret).update(Buffer.from(buildQuery(params), 'utf-8')).digest('hex');

/** yyyyMMddHHmmss theo giờ Việt Nam (GMT+7) */
export function vnpDate(d: Date): string {
  return new Date(d.getTime() + 7 * 3600_000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

export function buildPaymentUrl(baseUrl: string, secret: string, params: VnpParams): string {
  const secureHash = sign(params, secret);
  return `${baseUrl}?${buildQuery(params)}&vnp_SecureHash=${secureHash}`;
}

export function verifySignature(query: Record<string, any>, secret: string): boolean {
  const { vnp_SecureHash, ...rest } = query;
  delete rest.vnp_SecureHashType;
  if (typeof vnp_SecureHash !== 'string') return false;
  const expected = Buffer.from(sign(rest as VnpParams, secret));
  const given = Buffer.from(vnp_SecureHash.toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}
