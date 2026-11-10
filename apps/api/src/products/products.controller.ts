import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}
  @Get() list() { return this.products.findAll(); }
  @Get(':id') detail(@Param('id', ParseIntPipe) id: number) { return this.products.findOne(id); }
}
