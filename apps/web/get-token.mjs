process.env.DATABASE_URL = 'postgresql://postgres.vwcyrdozwxuuaymiethk:RockPaperSessior%401234@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const g = await p.guest.findFirst();
console.log(g ? JSON.stringify({ token: g.token, name: g.name, table: g.tableNumber }) : 'NO_GUESTS');
await p.$disconnect();
