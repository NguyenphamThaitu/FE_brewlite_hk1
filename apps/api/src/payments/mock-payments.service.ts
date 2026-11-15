import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { changeOrderStatus } from '../orders/order-status';
import { UNPAID } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CardDecision, decideCard, decideWallet, failureMessage, MockMethod } from './mock-payment';

export interface MockPaymentInput {
  orderId: number;
  method: MockMethod;
  card?: { number: string; expiry: string; cvv: string };
}

@Injectable()
export class MockPaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Thanh toán bằng Ví (FR-24) hoặc Thẻ (FR-25) mô phỏng, có kết quả ngay.
   * - Cùng Idempotency-Key → trả lại đúng kết quả lần đầu, không trừ tiền lần hai (FR-26).
   * - Thất bại → Payment FAILED kèm mã lỗi, đơn sang PAYMENT_FAILED, giữ kho để thanh toán lại (FR-27).
   * - Khóa dòng Order (và User khi trừ ví) trong transaction để hai request đồng thời không trả tiền hai lần.
   */
  async pay(userId: number, input: MockPaymentInput, idempotencyKey: string) {
    const replay = await this.findByKey(userId, input, idempotencyKey);
    if (replay) return this.toResponse(replay);

    const order = await this.prisma.order.findFirst({ where: { id: input.orderId, userId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${input.orderId} FOR UPDATE`;
        const fresh = await tx.order.findUniqueOrThrow({ where: { id: input.orderId } });
        if (!UNPAID.includes(fresh.status)) throw new ConflictException('Đơn hàng không ở trạng thái chờ thanh toán');

        let decision: CardDecision;
        if (input.method === 'WALLET') {
          await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
          const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
          decision = decideWallet(user.walletBalance, fresh.totalAmount);
          if (decision.ok) await tx.user.update({ where: { id: userId }, data: { walletBalance: { decrement: fresh.totalAmount } } });
        } else {
          decision = decideCard(input.card!);
        }

        const created = await tx.payment.create({
          data: {
            orderId: fresh.id,
            amount: fresh.totalAmount,
            method: input.method,
            status: decision.ok ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
            txnRef: `${input.method}-${fresh.id}-${randomUUID().slice(0, 8)}`,
            idempotencyKey,
            responseCode: decision.ok ? '00' : decision.code,
            cardLast4: input.method === 'CARD' ? input.card!.number.slice(-4) : null,
            paidAt: decision.ok ? new Date() : null,
          },
        });
        if (decision.ok) {
          await changeOrderStatus(tx, fresh.id, UNPAID, OrderStatus.PAID, userId, 'PAYMENT_SUCCESS');
        } else {
          await changeOrderStatus(tx, fresh.id, [OrderStatus.PENDING_PAYMENT], OrderStatus.PAYMENT_FAILED, userId, 'PAYMENT_FAILED');
        }
        return created;
      });
      return this.toResponse(payment);
    } catch (e) {
      // Hai request cùng key chạy đồng thời: request sau vướng UNIQUE(idempotencyKey) → trả kết quả của request trước
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await this.findByKey(userId, input, idempotencyKey);
        if (again) return this.toResponse(again);
      }
      throw e;
    }
  }

  /** Giao dịch đã tạo bằng key này. Key đã dùng cho đơn, người dùng hoặc phương thức khác → 409. */
  private async findByKey(userId: number, input: MockPaymentInput, idempotencyKey: string) {
    const p = await this.prisma.payment.findUnique({ where: { idempotencyKey }, include: { order: { select: { userId: true } } } });
    if (!p) return null;
    if (p.orderId !== input.orderId || p.order.userId !== userId || p.method !== input.method)
      throw new ConflictException('Idempotency-Key đã được dùng cho yêu cầu thanh toán khác');
    return p;
  }

  private async toResponse(payment: Payment) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: payment.orderId }, include: { user: { select: { walletBalance: true } } } });
    const ok = payment.status === PaymentStatus.SUCCESS;
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      method: payment.method,
      amount: payment.amount,
      paymentStatus: payment.status,
      orderStatus: order.status,
      errorCode: ok ? null : payment.responseCode,
      message: ok ? 'Thanh toán thành công' : failureMessage(payment.responseCode),
      ...(payment.method === 'CARD' ? { cardLast4: payment.cardLast4 } : { walletBalance: order.user.walletBalance }),
    };
  }
}
