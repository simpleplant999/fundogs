import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

const EXPO_WEB_DEV_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'] as const;

function parseAllowedOrigins(raw: string | undefined): string[] {
  const fromEnv = raw
    ? raw
        .split(',')
        .map((s) => s.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    : [];
  if (!fromEnv.length) {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...EXPO_WEB_DEV_ORIGINS,
    ];
  }
  /** When FRONTEND_ORIGIN lists only Next.js, Expo Web (default port 8081) would fail CORS — merge it in dev. */
  if (process.env.NODE_ENV !== 'production') {
    return [...new Set([...fromEnv, ...EXPO_WEB_DEV_ORIGINS])];
  }
  return fromEnv;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    index: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_ORIGIN);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/+$/, '');
      callback(null, allowedOrigins.includes(normalized));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
