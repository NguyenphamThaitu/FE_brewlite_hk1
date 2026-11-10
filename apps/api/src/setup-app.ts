import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/** Cấu hình dùng chung cho main.ts và test, để test chạy đúng như production */
export function setupApp(app: INestApplication, corsOrigin?: string) {
  app.use(helmet());
  app.enableCors({ origin: corsOrigin?.split(',') ?? true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}
