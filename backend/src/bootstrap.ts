import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export interface ConfigureAppOptions {
  /** Mount the OpenAPI explorer at /api/docs. Off in serverless to cut cold-start cost. */
  swagger?: boolean;
}

/**
 * Applies every cross-cutting concern to a Nest app instance.
 *
 * Both entrypoints call this: `main.ts` (long-running server) and
 * `netlify/functions/api` (serverless). Keeping it in one place is what stops the
 * deployed API from silently disagreeing with local dev — above all the
 * `{ success, data }` envelope added by TransformInterceptor, which the frontend
 * parses on every response.
 */
export function configureApp(
  app: INestApplication,
  { swagger = true }: ConfigureAppOptions = {},
): void {
  const config = app.get(ConfigService);

  // All routes are served under /api (matches the frontend API base URL).
  app.setGlobalPrefix('api');

  // Credentialed CORS cannot use "*" — browsers reject that combination — so an
  // unset CORS_ORIGIN falls back to reflecting the caller's origin instead.
  const corsOrigin = config.get<string>('corsOrigin');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  // Security & parsing middleware.
  app.use(helmet());
  app.use(cookieParser());

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

  if (swagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CENTO Admin API')
      .setDescription('Backend API for the CENTO e-commerce admin dashboard')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }
}
