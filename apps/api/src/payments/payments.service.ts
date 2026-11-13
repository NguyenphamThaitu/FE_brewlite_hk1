import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { VNPAY_LINK_TTL_MINUTES } from '../orders/order-expiry';
import { changeOrderStatus } from '../orders/order-status';
import { UNPAID } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaymentUrl, verifySignature, vnpDate } from './vnpay';

export interface VnpResult {
  rspCode: '00' | '01' | '02' | '04' | '97';
  message: string;
  orderId?: number;
  paymentStatus?: PaymentStatus;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private cfg() {
    const tmn = this.config.get<string>('VNPAY_TMN_CODE');
    const secret = this.config.get<string>('VNPAY_HASH_SECRET');
    if (!tmn || !secret) throw new ServiceUnavailableException('VNPay chưa được cấu hình (VNPAY_TMN_CODE / VNPAY_HASH_SECRET)');
    return {
      tmn, secret,
      url: this.config.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: this.config.get<string>('VNPAY_RETURN_URL') || 'http://localhost:3000/payment/result',
    };
  }

  /**
   * Tạo link thanh toán VNPay cho đơn đang PENDING_PAYMENT hoặc PAYMENT_FAILED (thanh toán lại).
   * Idempotent (FR-26):
   *  - Gửi lại cùng Idempotency-Key → trả lại đúng giao dịch đã tạo, không tạo giao dịch mới.
   *  - Key đã dùng cho đơn khác hoặc người khác → 409.
   *  - Đơn đang có giao dịch PENDING → dùng lại giao dịch đó (cùng vnp_TxnRef), tránh hai link cùng trừ tiền.
   *  - Khóa dòng Order trong transaction để hai request đồng thời không tạo hai giao dịch PENDING.
   */
  async createVnpayPayment(userId: number, orderId: number, ipAddr: string, idempotencyKey: string) {
    const c = this.cfg();
    const replay = await this.findByKey(userId, orderId, idempotencyKey);
    if (replay) return this.toResponse(c, replay, ipAddr);

    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    let payment: Payment;
    try {
      payment = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
        const fresh = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
        if (!UNPAID.includes(fresh.status)) throw new ConflictException('Đơn hàng không ở trạng thái chờ thanh toán');
        const pending = await tx.payment.findFirst({ where: { orderId, status: PaymentStatus.PENDING }, orderBy: { id: 'desc' } });
        if (pending) return pending;
        return tx.payment.create({
          data: { orderId, amount: fresh.totalAmount, method: 'VNPAY', status: PaymentStatus.PENDING, txnRef: `${orderId}${Date.now()}`, idempotencyKey },
        });
      });
    } catch (e) {
      // Hai request cùng key chạy đồng thời: request sau vướng UNIQUE(idempotencyKey) → trả giao dịch của request trước
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await this.findByKey(userId, orderId, idempotencyKey);
        if (again) return this.toResponse(c, again, ipAddr);
      }
      throw e;
    }
    return this.toResponse(c, payment, ipAddr);
  }

  /** Giao dịch đã tạo bằng key này (nếu có). Key thuộc đơn hoặc người dùng khác → 409. */
  private async findByKey(userId: number, orderId: number, idempotencyKey: string) {
    const p = await this.prisma.payment.findUnique({ where: { idempotencyKey }, include: { order: { select: { userId: true } } } });
    if (!p) return null;
    if (p.orderId !== orderId || p.order.userId !== userId) throw new ConflictException('Idempotency-Key đã được dùng cho đơn hàng khác');
    return p;
  }

  /** Giao dịch còn PENDING thì kèm link VNPay; đã có kết quả thì chỉ trả trạng thái (không mở link mới). */
  private toResponse(c: ReturnType<PaymentsService['cfg']>, payment: Payment, ipAddr: string) {
    const base = { paymentId: payment.id, orderId: payment.orderId, amount: payment.amount, paymentStatus: payment.status };
    if (payment.status !== PaymentStatus.PENDING) return base;
    const now = new Date();
    const paymentUrl = buildPaymentUrl(c.url, c.secret, {
      vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: c.tmn,
      vnp_Amount: payment.amount * 100, // VNPay yêu cầu nhân 100
      vnp_CreateDate: vnpDate(now), vnp_ExpireDate: vnpDate(new Date(now.getTime() + VNPAY_LINK_TTL_MINUTES * 60_000)),
      vnp_CurrCode: 'VND', vnp_IpAddr: ipAddr, vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${payment.orderId}`, vnp_OrderType: 'other',
      vnp_ReturnUrl: c.returnUrl, vnp_TxnRef: payment.txnRef,
    });
    return { ...base, paymentUrl };
  }

  /**
   * Xử lý kết quả VNPay (dùng chung cho IPN và Return URL).
   * An toàn khi bị gọi nhiều lần: chỉ giao dịch PENDING mới được xử lý, các lần sau trả mã 02.
   */
  async handleVnpayResult(query: Record<string, any>): Promise<VnpResult> {
    const { secret } = this.cfg();
    if (!verifySignature(query, secret)) return { rspCode: '97', message: 'Invalid signature' };

    const payment = await this.prisma.payment.findUnique({ where: { txnRef: String(query.vnp_TxnRef) } });
    if (!payment) return { rspCode: '01', message: 'Order not found' };
    if (Number(query.vnp_Amount) !== payment.amount * 100) return { rspCode: '04', message: 'Invalid amount' };

    const success = query.vnp_ResponseCode === '00' && (query.vnp_TransactionStatus ?? '00') === '00';
    const newStatus = success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    const processed = await this.prisma.$transaction(async (tx) => {
      // UPDATE có điều kiện: chỉ giao dịch còn PENDING mới được xử lý, gọi lại nhiều lần vẫn an toàn
      const res = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: newStatus,
          responseCode: String(query.vnp_ResponseCode ?? ''),
          vnpTransactionNo: query.vnp_TransactionNo ? String(query.vnp_TransactionNo) : null,
          paidAt: success ? new Date() : null,
        },
      });
      if (!res.count) return false;
      // IPN do VNPay gọi nên người đổi trạng thái là hệ thống (changedById = null)
      if (success) {
        // Nếu đơn đã bị hủy trước đó thì không chuyển PAID (giao dịch SUCCESS vẫn được ghi để đối soát/hoàn tiền)
        await changeOrderStatus(tx, payment.orderId, UNPAID, OrderStatus.PAID, null, 'PAYMENT_SUCCESS');
      } else {
        // Thanh toán lỗi → PAYMENT_FAILED, giữ nguyên kho để khách thanh toán lại hoặc tự hủy đơn (FR-27)
        await changeOrderStatus(tx, payment.orderId, [OrderStatus.PENDING_PAYMENT], OrderStatus.PAYMENT_FAILED, null, 'PAYMENT_FAILED');
      }
      return true;
    });

    if (!processed) {
      const cur = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
      return { rspCode: '02', message: 'Order already confirmed', orderId: payment.orderId, paymentStatus: cur.status };
    }
    return { rspCode: '00', message: 'Confirm Success', orderId: payment.orderId, paymentStatus: newStatus };
  }
}
