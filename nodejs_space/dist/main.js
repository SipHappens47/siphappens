"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
        exposedHeaders: ['Authorization'],
        maxAge: 3600,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const swaggerPath = 'api-docs';
    const config = new swagger_1.DocumentBuilder()
        .setTitle('SipHappens API')
        .setDescription('Semi-private social spirit journal mobile app backend')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    app.use(`/${swaggerPath}`, (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        next();
    });
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
    swagger_1.SwaggerModule.setup(swaggerPath, app, document, {
        customCss,
        customSiteTitle: 'SipHappens API',
        customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🥃</text></svg>',
    });
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Swagger documentation: ${await app.getUrl()}/${swaggerPath}`);
}
bootstrap();
//# sourceMappingURL=main.js.map