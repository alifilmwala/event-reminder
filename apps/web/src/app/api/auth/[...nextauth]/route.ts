/**
 * NextAuth v5 route handler — mounts at /api/auth/[...nextauth]
 */
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
