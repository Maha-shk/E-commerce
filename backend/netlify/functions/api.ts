import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from 'serverless-http';
import express from 'express';
import { Handler } from '@netlify/functions';
import { AppModule } from '../../src/app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

let cachedHandler: Handler;

async function bootstrap(): Promise<Handler> {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter, {
        logger: ['error', 'warn'],
    });

    app.use(helmet());
    app.use(cookieParser());
    app.enableCors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    });

    app.setGlobalPrefix('api');
    await app.init();

    return serverlessExpress(expressApp) as Handler;
}

export const handler: Handler = async (event, context) => {
    if (!cachedHandler) {
        cachedHandler = await bootstrap();
    }
    return cachedHandler(event, context);
};