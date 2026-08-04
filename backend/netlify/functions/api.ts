import { Handler } from '@netlify/functions';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../../src/app.module';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Cache for the NestJS app to reuse across invocations
let cachedApp: express.Application = null;
let isInitializing = false;

async function getNestApp() {
  if (cachedApp) {
    return cachedApp;
  }

  // Wait if another request is initializing
  if (isInitializing) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return getNestApp();
  }

  isInitializing = true;

  try {
    const expressApp = express();

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: false, // Disable logging for serverless
      }
    );

    // Set global prefix for API routes
    app.setGlobalPrefix('api');

    // Enable CORS for all origins (configure properly in production)
    app.enableCors({
      origin: true,
      credentials: true,
    });

    // Security middleware
    (app as any).use(helmet());
    (app as any).use(cookieParser());

    // Validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );

    await app.init();

    cachedApp = expressApp;
    isInitializing = false;
    return expressApp;
  } catch (error) {
    isInitializing = false;
    throw error;
  }
}

export const handler: Handler = async (event, context) => {
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  }

  try {
    const app = await getNestApp();

    // Create Express-compatible request object
    const req: any = {
      method: event.httpMethod,
      url: event.path,
      headers: { ...event.headers },
      body: event.body ? JSON.parse(event.body) : {},
      query: event.queryStringParameters || {},
      path: event.path,
      // Add Netlify-specific context
      netlify: { context },
    };

    // Express-compatible response object
    let statusCode = 200;
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    };
    const responseBody: any[] = [];

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseBody.push(JSON.stringify(data));
        headers['Content-Type'] = 'application/json';
        return res;
      },
      send: (data: any) => {
        if (typeof data === 'object') {
          responseBody.push(JSON.stringify(data));
          headers['Content-Type'] = 'application/json';
        } else {
          responseBody.push(data);
        }
        return res;
      },
      setHeader: (name: string, value: string | string[]) => {
        headers[name] = Array.isArray(value) ? value[0] : value;
        return res;
      },
      getHeader: (name: string) => headers[name],
    };

    // Process request through NestJS app
    await new Promise((resolve, reject) => {
      app(req, res as any, (err: any) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    // Ensure response is complete
    if (responseBody.length === 0 && statusCode === 200) {
      responseBody.push(JSON.stringify({ message: 'OK' }));
    }

    return {
      statusCode,
      headers,
      body: responseBody[0] || '',
    };

  } catch (error) {
    console.error('Error in Netlify function:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};