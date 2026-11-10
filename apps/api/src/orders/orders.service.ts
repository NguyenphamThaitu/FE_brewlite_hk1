import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { AuthUser } from '../common/current-user';
import { DrinkLine, findShortages, requiredIngredients } from '../common/inventory';
import { itemsTotal, lineTotal, PricedLine, unitPrice } from '../common/pricing';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, NEXT_STATUS } from './orders.dto';

const HIDE_INTERNAL = { ingredientUsage: true } as const;

/** Đơn chưa thanh toán xong: còn được thanh toán (lại) hoặc hủy để hoàn kho */
export const UNPAID: OrderStatus[] = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED];

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo đơn từ danh sách món do frontend gửi lên (giỏ hàng lưu ở client, API không lưu giỏ).
   * Server KHÔNG tin giá từ client: kiểm tra món/size/topping rồi tính lại giá theo DB.
   * Một transaction: khóa nguyên liệu → kiểm tra đủ kho → trừ kho → tạo đơn (PENDING_PAYMENT).
   * Bất kỳ bước nào lỗi thì rollback, kho không bị trừ.
   */
  async create(userId: number, dto: CreateOrderDto) {
    const orderId = await this.prisma.$transaction(async (tx) => {
      const productIds = [...new Set(dto.items.map((i) => i.productId))];
      const sizeIds = [...new Set(dto.items.map((i) => i.sizeId))];
      const toppingIds = [...new Set(dto.items.flatMap((i) => i.toppingIds ?? []))];

      const products = await tx.product.findMany({ where: { id: { in: productIds } }, include: { recipe: true } });
      const sizes = await tx.size.findMany({ where: { id: { in: sizeIds } } });
      const toppings = toppingIds.length ? await tx.topping.findMany({ where: { id: { in: toppingIds } } }) : [];
      const pById = new Map(products.map((p) => [p.id, p]));
      const sById = new Map(sizes.map((x) => [x.id, x]));
      const tById = new Map(toppings.map((t) => [t.id, t]));

      const priced: PricedLine[] = [];
      const lines: DrinkLine[] = [];
      const itemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      for (const i of dto.items) {
        const product = pById.get(i.productId);
        if (!product) throw new NotFoundException(`Sản phẩm #${i.productId} không tồn tại`);
        if (!product.isActive) throw new BadRequestException(`Sản phẩm "${product.name}" đã ngừng bán`);
        const size = sById.get(i.sizeId);
        if (!size) throw new BadRequestException(`Size #${i.sizeId} không hợp lệ`);
        const ts = (i.toppingIds ?? []).map((id) => {
          const t = tById.get(id);
          if (!t) throw new BadRequestException(`Topping #${id} không hợp lệ`);
          return t;
        });

        const line: PricedLine = { basePrice: product.basePrice, sizeExtra: size.extraPrice, toppingPrices: ts.map((t) => t.price), quantity: i.quantity };
        priced.push(line);
        lines.push({
          recipe: product.recipe.map((x) => ({ ingredientId: x.ingredientId, quantity: Number(x.quantity) })),
          sizeMultiplier: Number(size.recipeMultiplier),
          toppings: ts.map((t) => ({ ingredientId: t.ingredientId, quantity: Number(t.ingredientQty) })),
          quantity: i.quantity,
        });
        itemsData.push({
          productId: product.id, productName: product.name, sizeName: size.name,
          toppings: ts.map((t) => ({ id: t.id, name: t.name, price: t.price })),
          unitPrice: unitPrice(line), quantity: i.quantity, lineTotal: lineTotal(line),
        });
      }

      const need = requiredIngredients(lines);
      const ids = [...need.keys()].sort((a, b) => a - b);

      // Khóa các dòng nguyên liệu (theo thứ tự id để tránh deadlock) rồi mới đọc & kiểm tra
      if (ids.length) await tx.$queryRaw`SELECT "id" FROM "Ingredient" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`;
      const stock = await tx.ingredient.findMany({ where: { id: { in: ids } } });
      const shortages = findShortages(need, new Map(stock.map((s) => [s.id, { name: s.name, unit: s.unit, quantity: Number(s.quantity) }])));
      if (shortages.length)
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: 'Không đủ nguyên liệu: ' + shortages.map((s) => `${s.name} (cần ${s.need}${s.unit}, còn ${s.available}${s.unit})`).join('; '),
          shortages,
        });
      for (const [ingId, q] of need) await tx.ingredient.update({ where: { id: ingId }, data: { quantity: { decrement: q } } });

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount: itemsTotal(priced),
          ingredientUsage: Object.fromEntries([...need].map(([k, v]) => [String(k), v])),
          items: { create: itemsData },
        },
      });
      return order.id;
    });
    return this.findOneFor({ id: userId, role: Role.CUSTOMER, email: '' }, orderId);
  }

  /**
   * Hủy đơn chưa thanh toán xong (PENDING_PAYMENT hoặc PAYMENT_FAILED) → CANCELLED và hoàn kho.
   * Chỉ chạy một lần nhờ UPDATE có điều kiện.
   */
  async cancelPending(tx: Prisma.TransactionClient, orderId: number): Promise<boolean> {
    const res = await tx.order.updateMany({ where: { id: orderId, status: { in: UNPAID } }, data: { status: OrderStatus.CANCELLED } });
    if (!res.count) return false;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    const usage = order.ingredientUsage as Record<string, number>;
    for (const ingId of Object.keys(usage).map(Number).sort((a, b) => a - b))
      await tx.ingredient.update({ where: { id: ingId }, data: { quantity: { increment: usage[String(ingId)] } } });
    return true;
  }

  async cancelMine(user: AuthUser, orderId: number) {
    await this.findOneFor(user, orderId);
    const ok = await this.prisma.$transaction((tx) => this.cancelPending(tx, orderId));
    if (!ok) throw new ConflictException('Chỉ hủy được đơn chưa thanh toán');
    return this.findOneFor(user, orderId);
  }

  /** Lịch sử đơn của chính người đang đăng nhập (kể cả nhân viên), mới nhất trước. */
  listMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      omit: HIDE_INTERNAL,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /** Khách xem đơn của mình; nhân viên xem tất cả. */
  list(user: AuthUser, status?: OrderStatus) {
    const where: Prisma.OrderWhereInput = user.role === Role.STAFF ? {} : { userId: user.id };
    if (status) where.status = status;
    return this.prisma.order.findMany({ where, include: { items: true }, omit: HIDE_INTERNAL, orderBy: { id: 'desc' } });
  }

  async findOneFor(user: AuthUser, id: number) {
    const o = await this.prisma.order.findUnique({ where: { id }, include: { items: true, payments: true }, omit: HIDE_INTERNAL });
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (user.role !== Role.STAFF && o.userId !== user.id) throw new ForbiddenException('Đây không phải đơn hàng của bạn');
    return o;
  }

  async updateStatus(id: number, next: OrderStatus) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (NEXT_STATUS[o.status] !== next) throw new BadRequestException(`Không thể chuyển đơn từ ${o.status} sang ${next}`);
    const res = await this.prisma.order.updateMany({ where: { id, status: o.status }, data: { status: next } });
    if (!res.count) throw new ConflictException('Đơn vừa được cập nhật bởi người khác, vui lòng tải lại');
    return this.prisma.order.findUniqueOrThrow({ where: { id }, include: { items: true }, omit: HIDE_INTERNAL });
  }
}
