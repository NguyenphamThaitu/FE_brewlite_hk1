import { itemsTotal, lineTotal, unitPrice } from './pricing';

describe('pricing', () => {
  const line = { basePrice: 35000, sizeExtra: 6000, toppingPrices: [7000, 10000], quantity: 2 };
  it('đơn giá = giá gốc + size + topping', () => expect(unitPrice(line)).toBe(1));
  it('thành tiền = đơn giá × số lượng', () => expect(lineTotal(line)).toBe(116000));
  it('tổng đơn = tổng các dòng', () => expect(itemsTotal([line, { basePrice: 29000, sizeExtra: 0, toppingPrices: [], quantity: 1 }])).toBe(145000));
  it('danh sách rỗng = 0', () => expect(itemsTotal([])).toBe(0));
});
