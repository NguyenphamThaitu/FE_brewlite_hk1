import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_EXPIRY_CHECK_INTERVAL_SECONDS,
  DEFAULT_PAYMENT_TIMEOUT_MINUTES,
  minutesBefore,
  readIntSetting,
  VNPAY_LINK_TTL_MINUTES,
} from './order-expiry';
import { OrdersService, UNPAID } from './orders.service';

/**
 * Tự hủy đơn chưa thanh toán quá hạn và hoàn kho (FR-22).
 * Quét định kỳ trong tiến trình API; chạy nhiều instance vẫn an toàn vì mỗi đơn chỉ hủy được một lần.
 */
@Injectable()
export class OrderExpiryService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  readonly timeoutMinutes: number;
  private readonly intervalSeconds: number;

  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
    config: ConfigService,
  ) {
    this.timeoutMinutes = readIntSetting(config.get<string>('ORDER_PAYMENT_TIMEOUT_MINUTES'), DEFAULT_PAYMENT_TIMEOUT_MINUTES, 1);
    this.intervalSeconds = readIntSetting(config.get<string>('ORDER_EXPIRY_CHECK_INTERVAL_SECONDS'), DEFAULT_EXPIRY_CHECK_INTERVAL_SECONDS, 0);
  }

  onApplicationBootstrap() {
    if (!this.intervalSeconds) return; // 0 = tắt quét định kỳ (integration test gọi expireOverdue trực tiếp)
    this.timer = setInterval(() => void this.tick(), this.intervalSeconds * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return; // lần quét trước chưa xong thì bỏ qua lượt này
    this.running = true;
    try {
      await this.expireOverdue();
    } catch (e) {
      this.logger.error(`Quét đơn quá hạn thanh toán bị lỗi: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /**
   * Hủy các đơn PENDING_PAYMENT/PAYMENT_FAILED tạo quá `timeoutMinutes` phút, hoàn kho, ghi lịch sử AUTO_EXPIRED.
   * Bỏ qua đơn đang có link VNPay còn hiệu lực để khách vừa trả tiền không bị hủy đơn.
   * Trả về id các đơn đã hủy.
   */
  async expireOverdue(now = new Date()): Promise<number[]> {
    const overdue = await this.prisma.order.findMany({
      where: {
        status: { in: UNPAID },
        createdAt: { lt: minutesBefore(now, this.timeoutMinutes) },
        payments: { none: { status: PaymentStatus.PENDING, createdAt: { gt: minutesBefore(now, VNPAY_LINK_TTL_MINUTES) } } },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 100,
    });

    const cancelled: number[] = [];
    for (const { id } of overdue)
      if (await this.prisma.$transaction((tx) => this.orders.cancelPending(tx, id, null, 'AUTO_EXPIRED'))) cancelled.push(id);

    if (cancelled.length) this.logger.log(`Tự hủy ${cancelled.length} đơn quá hạn thanh toán, đã hoàn kho: #${cancelled.join(', #')}`);
    return cancelled;
  }
}
