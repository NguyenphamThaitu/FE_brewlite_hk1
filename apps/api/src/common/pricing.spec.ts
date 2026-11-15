import { itemsTotal, lineTotal, unitPrice } from './pricing';

describe('pricing', () => {
  const line = { basePrice: 35000, sizeExtra: 6000, toppingPrices: [7000, 10000], quantity: 2 };
  it('đơn giá = giá gốc + size + topping', () => expect(unitPrice(line)).toBe(58000));
  it('thành tiền = đơn giá × số lượng', () => expect(lineTotal(line)).toBe(116000));
  it('tổng đơn = tổng các dòng', () => expect(itemsTotal([line, { basePrice: 29000, sizeExtra: 0, toppingPrices: [], quantity: 1 }])).toBe(145000));
  it('danh sách rỗng = 0', () => expect(itemsTotal([])).toBe(0));


  it('giá sản phẩm không có size cộng thêm hoặc topping', () => {
    expect(unitPrice({ basePrice: 29000, sizeExtra: 0, toppingPrices: [] })).toBe(29000);
  });
  it('nhiều topping được cộng đầy đủ vào đơn giá', () => {
    expect(unitPrice({ basePrice: 30000, sizeExtra: 5000, toppingPrices: [3000, 4000, 6000] })).toBe(48000);
  });
  it('số lượng bằng 0 thì thành tiền bằng 0', () => {
    expect(lineTotal({ ...line, quantity: 0 })).toBe(0);
  });
  it('tổng đơn gồm nhiều dòng và giữ đúng số tiền từng dòng', () => {
    expect(itemsTotal([
      { basePrice: 20000, sizeExtra: 5000, toppingPrices: [3000], quantity: 2 },
      { basePrice: 35000, sizeExtra: 0, toppingPrices: [], quantity: 1 },
      { basePrice: 25000, sizeExtra: 5000, toppingPrices: [5000], quantity: 3 },
    ])).toBe(196000);
  });
});
