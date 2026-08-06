/**
 * Netlify Functions entrypoint for the NestJS API.
 *
 * Deliberately plain JavaScript that requires the ALREADY-COMPILED `dist/`
 * output rather than `src/`. NestJS resolves its dependency graph from
 * `emitDecoratorMetadata`, which only `tsc` emits — bundlers such as esbuild
 * silently drop it, producing a build that deploys fine and then fails at
 * runtime with "Nest can't resolve dependencies of ...". Compiling with
 * `nest build` first (see netlify/build.sh) keeps that metadata intact.
 */
const express = require('express');
const serverlessExpress = require('serverless-http');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');

const { AppModule } = require('../../dist/app.module');
const { configureApp } = require('../../dist/bootstrap');

/** Cached across warm invocations. Stores the promise so concurrent cold starts share one boot. */
let handlerPromise;

async function createHandler() {
  const expressApp = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });

  // Same pipes/filters/interceptors as `npm run start:dev`. Swagger is skipped:
  // building the OpenAPI document on every cold start is pure latency here.
  configureApp(app, { swagger: false });

  // No enableShutdownHooks() — it would tear down the Prisma pool between
  // invocations, defeating connection reuse on warm starts.
  await app.init();

  return serverlessExpress(expressApp);
}

/**
 * Netlify may hand us either the original request path (`/api/health`) or the
 * rewritten function path (`/.netlify/functions/api/health`), depending on how
 * the redirect is applied. Nest is mounted under the `/api` global prefix, so
 * normalise both forms to `/api/...` rather than betting on one.
 */
function normalizePath(rawPath) {
  let path = rawPath || '/';
  path = path.replace(/^\/\.netlify\/functions\/api/, '');
  if (!path.startsWith('/api')) {
    path = `/api${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

exports.handler = async (event, context) => {
  if (!handlerPromise) {
    handlerPromise = createHandler().catch((err) => {
      // Let the next invocation retry instead of caching a poisoned boot.
      handlerPromise = undefined;
      throw err;
    });
  }

  const handler = await handlerPromise;
  const path = normalizePath(event.path);

  return handler({ ...event, path, rawUrl: event.rawUrl }, context);
};
