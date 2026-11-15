import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/current-user';
import { OrderStatus, Role } from '@prisma/client';
import { CreateOrderDto, MyOrdersQueryDto, StaffOrdersQueryDto, UpdateStatusDto } from './orders.dto';
import { OrdersService } from './orders.service';

/** Màn hình quầy: nhân viên xem đơn đã thanh toán và lọc theo trạng thái (FR-33). Khách gọi nhận 403. */
@Controller('staff/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffOrdersController {
  constructor(private orders: OrdersService) {}

  @Get() @Roles(Role.STAFF)
  list(@Query() q: StaffOrdersQueryDto) { return this.orders.listForStaff(q.status); }
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  /** Đặt đơn: frontend gửi danh sách món trong giỏ (giỏ hàng lưu ở client), API tự tính lại giá */
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateOrderDto) { return this.orders.create(u.id, dto); }
  @Get() list(@CurrentUser() u: AuthUser, @Query('status') status?: OrderStatus) { return this.orders.list(u, status); }
  /** Lịch sử đơn của tôi, có phân trang (FR-30). Đặt trước ':id' để 'me' không bị hiểu là id */
  @Get('me') mine(@CurrentUser() u: AuthUser, @Query() q: MyOrdersQueryDto) { return this.orders.listMine(u.id, q.page, q.limit); }
  @Get(':id') detail(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.orders.findOneFor(u, id); }
  @Post(':id/cancel') cancel(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.orders.cancelMine(u, id); }
  @Patch(':id/status') @Roles(Role.STAFF)
  status(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) { return this.orders.updateStatus(u, id, dto.status); }
}
