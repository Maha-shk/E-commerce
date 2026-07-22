import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // All routes are served under /api (matches the frontend API base URL).
  app.setGlobalPrefix('api');

  // Security & parsing middleware.
  app.use(helmet());
  app.use(cookieParser());

  // Allow the Next.js frontend to call the API with credentials (cookies).
  app.enableCors({
    origin: config.get<string>('corsOrigin')?.split(',') ?? true,
    credentials: true,
  });

  // Validate + transform every incoming DTO; strip unknown properties.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Consistent error + success envelopes and per-request logging.
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  app.enableShutdownHooks();

  // OpenAPI docs at /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CENTO Admin API')
    .setDescription('Backend API for the CENTO e-commerce admin dashboard')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API ready on http://localhost:${port}/api`);
  logger.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

void bootstrap();
