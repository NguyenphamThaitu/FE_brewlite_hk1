import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { MockPaymentsController } from './mock-payments.controller';
import { MockPaymentsService } from './mock-payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({ imports: [OrdersModule], controllers: [PaymentsController, MockPaymentsController], providers: [PaymentsService, MockPaymentsService] })
export class PaymentsModule {}
