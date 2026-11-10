export interface PricedLine {
  basePrice: number;
  sizeExtra: number;
  toppingPrices: number[];
  quantity: number;
}
export const unitPrice = (l: Pick<PricedLine, 'basePrice' | 'sizeExtra' | 'toppingPrices'>) =>
  l.basePrice + l.sizeExtra + l.toppingPrices.reduce((a, b) => a + b, 0);
export const lineTotal = (l: PricedLine) => unitPrice(l) * l.quantity;
export const itemsTotal = (lines: PricedLine[]) => lines.reduce((s, l) => s + lineTotal(l), 0);
