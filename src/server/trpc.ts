import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import superjson from 'superjson';
import * as db from '../lib/db';

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  const userId = req.headers['x-user-id'];
  
  let user = null;
  if (userId && typeof userId === 'string') {
    const id = parseInt(userId, 10);
    // In a real app we would verify a JWT
    const dbUser = await db.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id)
    });
    if (dbUser) {
        user = { id: dbUser.id, role: dbUser.role as any, email: dbUser.email || '' };
    }
  }

  return {
    req,
    res,
    user,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return opts.next({
    ctx: {
      user: opts.ctx.user,
    },
  });
});

export const ownerProcedure = protectedProcedure.use(async (opts) => {
    if (opts.ctx.user.role !== 'owner' && opts.ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Owner access required' });
    }
    return opts.next();
});

export const managerProcedure = protectedProcedure.use(async (opts) => {
    const roles: string[] = ['owner', 'admin', 'manager'];
    if (!roles.includes(opts.ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Manager access required' });
    }
    return opts.next();
});

export const technicianProcedure = protectedProcedure.use(async (opts) => {
    const roles: string[] = ['owner', 'admin', 'manager', 'technician'];
    if (!roles.includes(opts.ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Technician access required' });
    }
    return opts.next();
});
