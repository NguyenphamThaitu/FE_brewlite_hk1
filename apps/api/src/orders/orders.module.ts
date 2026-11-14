import { Module } from '@nestjs/common';
import { OrderExpiryService } from './order-expiry.service';
import { OrdersController, StaffOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({ controllers: [OrdersController, StaffOrdersController], providers: [OrdersService, OrderExpiryService], exports: [OrdersService] })
export class OrdersModule {}
