import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLoggerService } from './logger/app-logger.service';
import * as fs from 'fs';
import { join } from 'path';

async function bootstrap() {
  /*
  const uploadDir = join(process.cwd(), 'uploads');
  console.log(`### Checking uploads directory: ${uploadDir} ###`);
  if (!fs.existsSync(uploadDir)) {
    console.log(`### Creating uploads directory: ${uploadDir} ###`);
    fs.mkdirSync(uploadDir, { recursive: true });
  } else {
    const files = fs.readdirSync(uploadDir);
    console.log(
      `### Uploads directory exists. Current contents: ${files.length} files. ###`,
    );
    console.log(`### Files in uploads: ${files.join(', ')} ###`);
  }

  const dataDir = join(process.cwd(), 'data');
  console.log(`### Checking data directory: ${dataDir} ###`);
  if (!fs.existsSync(dataDir)) {
    console.log(`### Creating data directory: ${dataDir} ###`);
    fs.mkdirSync(dataDir, { recursive: true });
  }*/

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useWebSocketAdapter(new IoAdapter(app));

  const appLogger = app.get(AppLoggerService);
  app.useLogger(appLogger);

  const isProd = process.env.NODE_ENV === 'production';

  // Security headers. CSP is left disabled because the SPA + uploads are served
  // from this same origin and a strict default policy would break them; enable
  // a tailored CSP separately if needed.
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS: only reflect explicitly allowed origins (never `origin: true` with
  // credentials). Same-origin and non-browser requests send no Origin header
  // and are always allowed. Configure via CORS_ORIGINS (comma-separated) or
  // CLIENT_URL; in dev the Vite/localhost origins are added automatically.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? process.env.CLIENT_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!isProd) {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
  }
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  // Swagger is exposed only outside production to avoid leaking the full API
  // surface publicly (set SWAGGER_ENABLED=true to force it on).
  if (!isProd || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('API REST RBAC MVC OAuth2')
      .setDescription('The API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(3000);
}
bootstrap();
