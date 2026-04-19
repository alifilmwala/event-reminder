/**
 * Middleware — protects all /dashboard, /guests, /upload, /schedule, /whatsapp routes.
 * Unauthenticated users are redirected to /login.
 */
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/guests/:path*',
    '/upload/:path*',
    '/schedule/:path*',
    '/settings/:path*',
    '/whatsapp/:path*',
  ],
};
