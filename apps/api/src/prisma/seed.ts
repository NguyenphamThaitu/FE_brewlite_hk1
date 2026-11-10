import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';

/** Dữ liệu mẫu: nguyên liệu + công thức + size + topping + 1 tài khoản nhân viên. Chỉ chạy khi DB còn trống. */
export async function seed(prisma: PrismaClient, staffPassword = process.env.STAFF_PASSWORD || 'Staff@123') {
  if ((await prisma.product.count()) > 0) return false;
  const passwordHash = await bcrypt.hash(staffPassword, 10);

  await prisma.$transaction(async (tx) => {
    const ing = (name: string, unit: string, quantity: number) => tx.ingredient.create({ data: { name, unit, quantity } });
    const coffee = await ing('Cà phê hạt', 'g', 5000);
    const milk = await ing('Sữa tươi', 'ml', 20000);
    const condensed = await ing('Sữa đặc', 'g', 5000);
    const tea = await ing('Trà đen', 'g', 3000);
    const peach = await ing('Đào ngâm', 'g', 2000);
    const matcha = await ing('Bột matcha', 'g', 1500);
    const sugar = await ing('Đường', 'g', 8000);
    const pearl = await ing('Trân châu', 'g', 4000);
    const jelly = await ing('Thạch dừa', 'g', 3000);
    const cheese = await ing('Kem cheese', 'g', 2500);

    const drink = (name: string, description: string, basePrice: number, recipe: [{ id: number }, number][]) =>
      tx.product.create({
        data: { name, description, basePrice, recipe: { create: recipe.map(([i, quantity]) => ({ ingredientId: i.id, quantity })) } },
      });
    await drink('Cà phê sữa đá', 'Cà phê phin đậm vị, sữa đặc', 29000, [[coffee, 18], [condensed, 30]]);
    await drink('Bạc xỉu', 'Nhiều sữa, ít cà phê', 32000, [[coffee, 10], [milk, 120], [condensed, 20]]);
    await drink('Trà đào cam sả', 'Trà đen, đào ngâm, thơm mát', 39000, [[tea, 8], [peach, 40], [sugar, 15]]);
    await drink('Trà sữa trân châu', 'Trà sữa truyền thống', 35000, [[tea, 10], [milk, 150], [sugar, 20]]);
    await drink('Matcha latte', 'Matcha Nhật pha sữa tươi', 45000, [[matcha, 8], [milk, 200], [sugar, 10]]);

    await tx.size.createMany({
      data: [
        { name: 'S', extraPrice: 0, recipeMultiplier: 1 },
        { name: 'M', extraPrice: 6000, recipeMultiplier: 1.25 },
        { name: 'L', extraPrice: 10000, recipeMultiplier: 1.5 },
      ],
    });
    await tx.topping.createMany({
      data: [
        { name: 'Trân châu đen', price: 7000, ingredientId: pearl.id, ingredientQty: 40 },
        { name: 'Thạch dừa', price: 6000, ingredientId: jelly.id, ingredientQty: 30 },
        { name: 'Kem cheese', price: 10000, ingredientId: cheese.id, ingredientQty: 35 },
      ],
    });
    await tx.user.create({ data: { email: 'staff@brewlite.local', fullName: 'Nhân viên quầy', role: Role.STAFF, passwordHash } });
  });
  return true;
}

if (require.main === module) {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  seed(prisma)
    .then((done) => console.log(done ? 'Đã seed dữ liệu mẫu' : 'Đã có dữ liệu, bỏ qua seed'))
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
