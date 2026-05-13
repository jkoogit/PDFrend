import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

export const appRouter = t.router({
  healthCheck: t.procedure.query(() => {
    return { status: 'ok', message: 'PDFrend API is running' };
  }),
});

export type AppRouter = typeof appRouter;
