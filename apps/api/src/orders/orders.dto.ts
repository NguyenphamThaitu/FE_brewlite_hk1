import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/** Nhân viên chỉ được đẩy đơn đã thanh toán đi tiếp theo đúng thứ tự */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PAID]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.COMPLETED,
};

export class UpdateStatusDto {
  @IsIn([OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED], { message: 'Trạng thái không hợp lệ' })
  status: OrderStatus;
}

/** Một dòng trong giỏ hàng do frontend gửi lên. Không nhận giá từ client – giá luôn tính lại theo DB. */
export class OrderItemDto {
  @IsInt() productId: number;
  @IsInt() sizeId: number;
  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) toppingIds?: number[];
  @IsInt() @Min(1, { message: 'Số lượng tối thiểu là 1' }) @Max(20, { message: 'Tối đa 20 ly mỗi dòng' }) quantity: number;
}

export class CreateOrderDto {
  @IsArray() @ArrayMinSize(1, { message: 'Giỏ hàng đang trống' }) @ArrayMaxSize(50, { message: 'Tối đa 50 dòng mỗi đơn' })
  @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
