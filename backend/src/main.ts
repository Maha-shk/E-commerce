import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const logger = new Logger('Bootstrap');

  // Shared with the Netlify function so both behave identically. See bootstrap.ts.
  configureApp(app);

  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('port') ?? 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API ready on http://localhost:${port}/api`);
  logger.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

void bootstrap();
