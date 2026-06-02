import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for image uploads (10MB for JSON payloads with base64 images)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS with proper configuration
  app.enableCors({
    origin: true, // Accept all origins (use true instead of '*' when credentials are enabled)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 3600,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const swaggerPath = 'api-docs';
  const config = new DocumentBuilder()
    .setTitle('SipHappens API')
    .setDescription('Semi-private social spirit journal mobile app backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add no-cache middleware for Swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Custom CSS for Swagger UI
  const customCss = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { 
      font-size: 36px; 
      color: #1a1a1a;
      font-weight: 600;
    }
    .swagger-ui .info .description { 
      font-size: 16px;
      color: #4a4a4a;
      line-height: 1.6;
    }
    .swagger-ui .scheme-container {
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
    }
    .swagger-ui .opblock {
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
    }
    .swagger-ui .opblock .opblock-summary {
      border-radius: 8px;
    }
    .swagger-ui .btn {
      border-radius: 6px;
    }
    body {
      margin: 0;
      background: #ffffff;
    }
  `;

  SwaggerModule.setup(swaggerPath, app, document, {
    customCss,
    customSiteTitle: 'SipHappens API',
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🥃</text></svg>',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/${swaggerPath}`);
}
bootstrap();
