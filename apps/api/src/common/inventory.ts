export interface RecipeLine { ingredientId: number; quantity: number }
export interface DrinkLine {
  recipe: RecipeLine[];            // công thức 1 ly size chuẩn
  sizeMultiplier: number;          // hệ số theo size
  toppings: RecipeLine[];          // nguyên liệu của các topping (1 phần mỗi ly)
  quantity: number;                // số ly
}

/** Tổng nguyên liệu cần cho các ly: (công thức × hệ số size + topping) × số ly. Làm tròn 2 chữ số. */
export function requiredIngredients(lines: DrinkLine[]): Map<number, number> {
  const need = new Map<number, number>();
  const add = (id: number, q: number) => need.set(id, Math.round(((need.get(id) ?? 0) + q) * 100) / 100);
  for (const l of lines) {
    for (const r of l.recipe) add(r.ingredientId, r.quantity * l.sizeMultiplier * l.quantity);
    for (const t of l.toppings) add(t.ingredientId, t.quantity * l.quantity);
  }
  return need;
}

/** Trả về danh sách nguyên liệu thiếu (rỗng = đủ hàng). */
export function findShortages(need: Map<number, number>, stock: Map<number, { name: string; quantity: number; unit: string }>) {
  const out: { ingredientId: number; name: string; need: number; available: number; unit: string }[] = [];
  for (const [id, q] of need) {
    const s = stock.get(id);
    if (!s || s.quantity < q) out.push({ ingredientId: id, name: s?.name ?? `#${id}`, need: q, available: s?.quantity ?? 0, unit: s?.unit ?? '' });
  }
  return out;
}
