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

/**
 * Parse the request body that serverless-http handed us.
 *
 * serverless-http builds a fake IncomingMessage with `complete: true` and
 * assigns the raw body straight onto `req.body` as a Buffer. body-parser 2.x
 * (what Express 5 / Nest 11 use) opens with:
 *
 *     if (onFinished.isFinished(req)) { next(); return }
 *
 * and `isFinished` is true precisely because `complete` is set — so Nest's JSON
 * parser bails without ever running, and the untouched Buffer reaches the
 * ValidationPipe. class-transformer then indexes the Buffer's bytes, which is
 * why every request failed with "property 0 should not exist, property 1 …".
 *
 * body-parser 1.x guarded on `req._body` instead, which is why this pairing used
 * to work. Doing the parse here, ahead of Nest's parser, restores it; the
 * downstream parser still no-ops, leaving this result in place.
 */
function parseServerlessBody(req, res, next) {
  const raw = req.body;
  if (!Buffer.isBuffer(raw)) return next();

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  const isForm = contentType.includes('application/x-www-form-urlencoded');

  // Any other content type (text/plain, multipart, binary) is one Nest registers
  // no parser for. A normal Express server leaves req.body unset in that case,
  // so do the same instead of letting a Buffer through — otherwise the
  // ValidationPipe indexes its bytes and reports "property 0 should not exist"
  // rather than the real field errors. The bytes stay reachable via rawBody.
  if (!isJson && !isForm) {
    req.rawBody = raw;
    req.body = undefined;
    return next();
  }

  const text = raw.toString('utf8');
  if (text.length === 0) {
    // GET/DELETE arrive as an empty Buffer; an empty object matches what a
    // normal Express request would produce.
    req.body = {};
    return next();
  }

  if (isForm) {
    req.body = Object.fromEntries(new URLSearchParams(text));
    return next();
  }

  try {
    req.body = JSON.parse(text);
  } catch {
    // Mirror the AllExceptionsFilter envelope so clients get one error shape.
    res.status(400).json({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Malformed JSON in request body',
      path: req.url,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
}

async function createHandler() {
  const expressApp = express();

  // Registered before NestFactory.create so it precedes Nest's own parser
  // middleware, which is added during app.init().
  expressApp.use(parseServerlessBody);

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
