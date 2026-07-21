import { defineMiddleware } from 'astro:middleware';
import { hasValidBasicAuth, isProtectedPath } from './utils/auth';

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  if (isProtectedPath(url.pathname)) {
    const trustedProxy = request.headers.get('x-docs-authenticated') === 'true';
    const validBasic = hasValidBasicAuth(
      request.headers.get('authorization'),
      process.env.DOCS_INTERNAL_USER,
      process.env.DOCS_INTERNAL_PASSWORD,
    );
    if (!trustedProxy && !validBasic) {
      return new Response('Autenticação necessária.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Documentação interna do #Sustenido"' },
      });
    }
  }

  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
  return response;
});
