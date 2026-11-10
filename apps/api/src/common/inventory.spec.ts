import { findShortages, requiredIngredients } from './inventory';

describe('tồn kho theo nguyên liệu', () => {
  const recipe = [{ ingredientId: 1, quantity: 10 }, { ingredientId: 2, quantity: 100 }];

  it('nhân công thức với hệ số size và số ly', () => {
    const need = requiredIngredients([{ recipe, sizeMultiplier: 1.5, toppings: [], quantity: 2 }]);
    expect(need.get(1)).toBe(30);
    expect(need.get(2)).toBe(300);
  });
  it('topping không nhân theo size, chỉ nhân theo số ly', () => {
    const need = requiredIngredients([{ recipe, sizeMultiplier: 1.5, toppings: [{ ingredientId: 3, quantity: 40 }], quantity: 3 }]);
    expect(need.get(3)).toBe(120);
  });
  it('cộng dồn nguyên liệu dùng chung giữa các ly', () => {
    const need = requiredIngredients([
      { recipe, sizeMultiplier: 1, toppings: [], quantity: 1 },
      { recipe: [{ ingredientId: 1, quantity: 5 }], sizeMultiplier: 1, toppings: [], quantity: 2 },
    ]);
    expect(need.get(1)).toBe(20);
  });
  it('phát hiện nguyên liệu thiếu', () => {
    const need = new Map([[1, 30], [2, 50]]);
    const stock = new Map([[1, { name: 'Cà phê', quantity: 20, unit: 'g' }], [2, { name: 'Sữa', quantity: 50, unit: 'ml' }]]);
    const s = findShortages(need, stock);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ ingredientId: 1, need: 30, available: 20 });
  });
  it('đủ hàng khi lượng cần bằng lượng còn', () => {
    expect(findShortages(new Map([[2, 50]]), new Map([[2, { name: 'Sữa', quantity: 50, unit: 'ml' }]]))).toEqual([]);
  });
});
