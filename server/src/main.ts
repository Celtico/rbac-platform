import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
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

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('API REST RBAC MVC OAuth2')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
