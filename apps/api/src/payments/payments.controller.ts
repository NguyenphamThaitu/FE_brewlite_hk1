import { Body, Controller, Get, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsInt } from 'class-validator';
import { Request } from 'express';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../common/current-user';
import { PaymentsService } from './payments.service';

class CreateVnpayDto {
  @IsInt() orderId: number;
}

@Controller('payments/vnpay')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Khách bấm "Thanh toán": trả về paymentUrl để frontend redirect sang VNPay */
  @Post() @HttpCode(200) @UseGuards(JwtAuthGuard)
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateVnpayDto, @Req() req: Request) {
    const ip = (req.ip || '127.0.0.1').replace('::ffff:', '').replace('::1', '127.0.0.1');
    return this.payments.createVnpayPayment(u.id, dto.orderId, ip);
  }

  /** VNPay (server) gọi về để xác nhận kết quả – cấu hình IPN URL này trên cổng merchant */
  @Get('ipn')
  async ipn(@Query() q: Record<string, string>) {
    const r = await this.payments.handleVnpayResult(q);
    return { RspCode: r.rspCode, Message: r.message };
  }

  /** Trình duyệt được VNPay chuyển về frontend; frontend gửi nguyên query string lên đây để biết kết quả */
  @Get('return')
  async return(@Query() q: Record<string, string>) {
    const r = await this.payments.handleVnpayResult(q);
    const ok = r.rspCode === '00' || r.rspCode === '02';
    return {
      success: ok && r.paymentStatus === 'SUCCESS',
      orderId: r.orderId ?? null,
      message: !ok ? 'Chữ ký/giao dịch không hợp lệ' : r.paymentStatus === 'SUCCESS' ? 'Thanh toán thành công' : 'Thanh toán thất bại, đơn hàng đã được hủy',
    };
  }
}
