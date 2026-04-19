/**
 * Auth.js v5 — purely JWT-based (no database adapter needed).
 * Admin credentials are stored in ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Pure JWT sessions — no DB adapter required
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const adminEmail    = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are not set.');
        }

        if (
          parsed.data.email.trim()    !== adminEmail.trim() ||
          parsed.data.password.trim() !== adminPassword.trim()
        ) {
          return null;
        }

        return { id: 'admin', email: adminEmail, name: 'Admin' };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session }) {
      // Returning true allows access; false redirects to signIn page.
      return !!session?.user;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  jwt: { maxAge: 30 * 24 * 60 * 60 },
});
