/**
 * main.ts — Application Entry Point
 *
 * Bootstraps the NestJS application:
 *  - Creates the Nest app instance
 *  - Configures CORS (allows localhost, *.vercel.app, and any CLIENT_URL/FRONTEND_URL env vars)
 *  - Applies a global ValidationPipe (strips unknown fields, validates all DTOs)
 *  - Sets the global API prefix: all routes are under /api/...
 *  - Binds to 0.0.0.0 so it works on cloud platforms (Railway, Render, Fly.io)
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Collect all explicitly configured frontend origins
  const configuredOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
  ]
    .filter(Boolean)
    .map((o) => o!.trim().replace(/\/$/, ''));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, server-to-server, same-origin)
      if (!origin) return callback(null, true);

      const norm = origin.replace(/\/$/, '');

      const allowed =
        // Any localhost / 127.0.0.1 (dev)
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(norm) ||
        // Any *.vercel.app preview URL
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(norm) ||
        // Explicitly configured origins
        configuredOrigins.includes(norm) ||
        // If no origins configured, allow everything (fallback for misconfigured deploys)
        configuredOrigins.length === 0;

      if (allowed) return callback(null, true);

      callback(new Error(`CORS: origin "${norm}" is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global validation ──────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ── Global prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Listen ─────────────────────────────────────────────────────────────────
  const port = process.env.PORT || 3001;
  // Use '0.0.0.0' so the app binds on all interfaces — required for most cloud platforms
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Progressly Backend running on port ${port}`);
}
bootstrap();
