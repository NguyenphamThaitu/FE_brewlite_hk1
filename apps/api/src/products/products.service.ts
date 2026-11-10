import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ProductWithRecipe = Prisma.ProductGetPayload<{ include: { recipe: { include: { ingredient: true } } } }>;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /** Món "còn hàng" khi mọi nguyên liệu trong công thức còn đủ cho ít nhất 1 ly (nhân hệ số size nếu có). */
  private isAvailable(p: ProductWithRecipe, multiplier = 1) {
    return p.recipe.every((r) => Number(r.ingredient.quantity) >= Number(r.quantity) * multiplier);
  }

  async findAll() {
    const list = await this.prisma.product.findMany({
      where: { isActive: true }, include: { recipe: { include: { ingredient: true } } }, orderBy: { id: 'asc' },
    });
    return list.map((p) => ({
      id: p.id, name: p.name, description: p.description, basePrice: p.basePrice, imageUrl: p.imageUrl,
      category: p.category, available: this.isAvailable(p),
    }));
  }

  async findOne(id: number) {
    const p = await this.prisma.product.findFirst({ where: { id, isActive: true }, include: { recipe: { include: { ingredient: true } } } });
    if (!p) throw new NotFoundException('Không tìm thấy sản phẩm');
    const sizes = await this.prisma.size.findMany({ orderBy: { id: 'asc' } });
    const toppings = await this.prisma.topping.findMany({ include: { ingredient: true }, orderBy: { id: 'asc' } });
    return {
      id: p.id, name: p.name, description: p.description, basePrice: p.basePrice, imageUrl: p.imageUrl, category: p.category,
      available: this.isAvailable(p),
      sizes: sizes.map((s) => ({ id: s.id, name: s.name, extraPrice: s.extraPrice, available: this.isAvailable(p, Number(s.recipeMultiplier)) })),
      toppings: toppings.map((t) => ({ id: t.id, name: t.name, price: t.price, available: Number(t.ingredient.quantity) >= Number(t.ingredientQty) })),
    };
  }
}
