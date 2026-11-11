import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDefined, IsIn, IsInt, Matches, ValidateIf, ValidateNested } from 'class-validator';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../common/current-user';
import { requireIdempotencyKey } from './idempotency';
import { MOCK_METHODS, MockMethod } from './mock-payment';
import { MockPaymentsService } from './mock-payments.service';

class CardDto {
  @Matches(/^\d{16}$/, { message: 'Số thẻ phải gồm 16 chữ số' }) number: string;
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Hạn thẻ phải có dạng MM/YY' }) expiry: string;
  @Matches(/^\d{3}$/, { message: 'CVV phải gồm 3 chữ số' }) cvv: string;
}

class MockPaymentDto {
  @IsInt() orderId: number;
  @IsIn(MOCK_METHODS, { message: 'method phải là WALLET hoặc CARD' }) method: MockMethod;
  @ValidateIf((o: MockPaymentDto) => o.method === 'CARD')
  @IsDefined({ message: 'Thanh toán CARD cần thông tin thẻ (card)' })
  @ValidateNested()
  @Type(() => CardDto)
  card?: CardDto;
}

@Controller('payments')
export class MockPaymentsController {
  constructor(private payments: MockPaymentsService) {}

  /**
   * Thanh toán Ví/Thẻ mô phỏng, trả kết quả ngay (FR-24, FR-25).
   * Bắt buộc header Idempotency-Key (FR-26). Thất bại vẫn trả 200 với paymentStatus FAILED và errorCode,
   * để gửi lặp cùng key luôn nhận lại đúng kết quả lần đầu.
   */
  @Post() @HttpCode(200) @UseGuards(JwtAuthGuard)
  pay(@CurrentUser() u: AuthUser, @Body() dto: MockPaymentDto, @Headers('idempotency-key') key?: string) {
    return this.payments.pay(u.id, dto, requireIdempotencyKey(key));
  }
}
