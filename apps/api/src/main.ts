import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { seed } from './prisma/seed';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app, process.env.CORS_ORIGIN);
  if (process.env.AUTO_SEED === 'true') await seed(app.get(PrismaService)); // chỉ seed khi DB còn trống
  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}
bootstrap();
