import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import superjson from 'superjson';

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  // Mock auth for "rebuild" demo - assume User 1 (Admin) is logged in if ANY header is present, or just always for dev convenience?
  // User asked to "works outside manus". Simplest is auto-login or mock.
  // I'll return a fixed user for now to allow testing without Implementing OAuth.
  return {
    req,
    res,
    user: { id: 1, role: 'owner', email: 'owner@example.com' }, // Mock user
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
