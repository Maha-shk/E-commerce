import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from 'serverless-http';
import express from 'express';
import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { AppModule } from '../../src/app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

let cachedHandler: (event: HandlerEvent, context: HandlerContext) => Promise<any>;

async function bootstrap() {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter, {
        logger: ['error', 'warn'],
    });

    app.use(helmet());
    app.use(cookieParser());
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    });

    app.setGlobalPrefix('api');
    await app.init();

    return serverlessExpress(expressApp);
}

export const handler: Handler = async (event, context) => {
    if (!cachedHandler) {
        cachedHandler = await bootstrap();
    }
    const result = await cachedHandler(event, context);
    return result as HandlerResponse;
};