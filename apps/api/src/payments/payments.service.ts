import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
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
  constructor(private prisma: PrismaService, private ordersService: OrdersService, private config: ConfigService) {}

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
   * Tạo link thanh toán VNPay cho đơn.
   * Idempotent: gọi lại khi đã có giao dịch PENDING của đơn thì dùng lại cùng vnp_TxnRef (không tạo giao dịch trùng).
   */
  async createVnpayPayment(userId: number, orderId: number, ipAddr: string) {
    const c = this.cfg();
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== OrderStatus.PENDING_PAYMENT) throw new ConflictException('Đơn hàng không ở trạng thái chờ thanh toán');

    let payment = await this.prisma.payment.findFirst({ where: { orderId, status: PaymentStatus.PENDING }, orderBy: { id: 'desc' } });
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: { orderId, amount: order.totalAmount, method: 'VNPAY', status: PaymentStatus.PENDING, txnRef: `${orderId}${Date.now()}` },
      });
    }
    const now = new Date();
    const paymentUrl = buildPaymentUrl(c.url, c.secret, {
      vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: c.tmn,
      vnp_Amount: payment.amount * 100, // VNPay yêu cầu nhân 100
      vnp_CreateDate: vnpDate(now), vnp_ExpireDate: vnpDate(new Date(now.getTime() + 15 * 60_000)),
      vnp_CurrCode: 'VND', vnp_IpAddr: ipAddr, vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`, vnp_OrderType: 'other',
      vnp_ReturnUrl: c.returnUrl, vnp_TxnRef: payment.txnRef,
    });
    return { paymentId: payment.id, orderId, amount: payment.amount, paymentUrl };
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
      if (success) {
        // Nếu đơn đã bị hủy trước đó thì không chuyển PAID (giao dịch SUCCESS vẫn được ghi để đối soát/hoàn tiền)
        await tx.order.updateMany({ where: { id: payment.orderId, status: OrderStatus.PENDING_PAYMENT }, data: { status: OrderStatus.PAID } });
      } else {
        await this.ordersService.cancelPending(tx, payment.orderId); // thanh toán lỗi → hủy đơn, hoàn nguyên liệu
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
