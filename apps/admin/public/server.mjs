import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const apiOrigin = new URL(
  process.env.ADMIN_API_ORIGIN ??
    'https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net',
);
if (apiOrigin.protocol !== 'https:' && apiOrigin.hostname !== 'localhost') {
  throw new Error('ADMIN_API_ORIGIN must use HTTPS outside localhost.');
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function setSecurityHeaders(request, response) {
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.blob.core.windows.net https://placeholder.com",
      `connect-src 'self' ${apiOrigin.origin}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  );
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  const forwardedProto = request.headers['x-forwarded-proto'];
  const externalProto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  if (request.socket.encrypted || externalProto?.split(',')[0].trim() === 'https') {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
}

function respond(response, status, message) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

const server = createServer(async (request, response) => {
  setSecurityHeaders(request, response);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    respond(response, 405, 'Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    respond(response, 400, 'Invalid request path');
    return;
  }

  if (pathname === '/server.mjs') {
    respond(response, 404, 'Not found');
    return;
  }

  let filePath = resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    respond(response, 404, 'Not found');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = resolve(filePath, 'index.html');
    }
  } catch {
    if (extname(pathname)) {
      respond(response, 404, 'Not found');
      return;
    }
    filePath = resolve(root, 'index.html');
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      respond(response, 404, 'Not found');
      return;
    }

    response.statusCode = 200;
    response.setHeader(
      'Content-Type',
      contentTypes[extname(filePath)] ?? 'application/octet-stream',
    );
    response.setHeader('Content-Length', fileStat.size);
    response.setHeader('Cache-Control', 'no-cache');
    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', (error) => {
      console.error('Unable to stream admin asset.', error);
      if (!response.headersSent) {
        respond(response, 500, 'Unable to serve asset');
      } else {
        response.destroy(error);
      }
    });
    stream.pipe(response);
  } catch (error) {
    console.error('Unable to read admin asset.', error);
    respond(response, 500, 'Unable to serve asset');
  }
});

const port = Number(process.env.PORT ?? process.env.WEBSITE_PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}
server.listen(port, '0.0.0.0');
