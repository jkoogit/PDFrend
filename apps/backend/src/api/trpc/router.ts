import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../../infrastructure/database/index_db';
import { users, documents } from '../../infrastructure/database/schema/index_sch';
import { eq, and } from 'drizzle-orm';

import { signAuthToken, hashPassword, verifyPassword, revokeAuthToken } from './auth_token';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const appRouter = t.router({
  healthCheck: t.procedure.query(() => {
    return { status: 'ok', message: 'PDFrend API is running' };
  }),


  signup: t.procedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const [newUser] = await db.insert(users).values({
          email: input.email,
          name: input.name,
          passwordHash: hashPassword(input.password),
          provider: 'local',
        }).returning();
        if (!newUser) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
        }
        const token = signAuthToken({ userId: newUser.id, email: newUser.email });
        return { token, user: { id: newUser.id, email: newUser.email, name: newUser.name } };
      } catch (error: any) {
        if (error.code === '23505') {
          throw new TRPCError({ code: 'CONFLICT', message: 'User with this email already exists' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to signup' });
      }
    }),

  login: t.procedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }
      const token = signAuthToken({ userId: user.id, email: user.email });
      return { token, user: { id: user.id, email: user.email, name: user.name } };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId));
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    return { id: user.id, email: user.email, name: user.name, provider: user.provider };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.token) revokeAuthToken(ctx.token);
    return { success: true };
  }),

  // User Procedures
  createUser: t.procedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const [newUser] = await db.insert(users).values({
          email: input.email,
          name: input.name,
        }).returning();
        return newUser;
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),

  getUser: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.id));
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      return user;
    }),

  updateUser: t.procedure
    .input(z.object({
      id: z.number(),
      email: z.string().email().optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const [updatedUser] = await db.update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      return updatedUser;
    }),

  deleteUser: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, input.id))
        .returning();
      
      if (!deletedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      return { success: true };
    }),

  // Document Procedures
  createDocument: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().optional(),
      fileUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [newDoc] = await db.insert(documents).values({
        userId: ctx.user.userId,
        title: input.title,
        content: input.content,
        fileUrl: input.fileUrl,
      }).returning();
      return newDoc;
    }),

  listDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.select().from(documents).where(eq(documents.userId, ctx.user.userId));
    }),

  getDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [doc] = await db.select()
        .from(documents)
        .where(and(eq(documents.id, input.id), eq(documents.userId, ctx.user.userId)));
      
      if (!doc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or access denied',
        });
      }
      return doc;
    }),

  updateDocument: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      fileUrl: z.string().url().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const [updatedDoc] = await db.update(documents)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(documents.id, id), eq(documents.userId, ctx.user.userId)))
        .returning();
      
      if (!updatedDoc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or access denied',
        });
      }
      return updatedDoc;
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedDoc] = await db.delete(documents)
        .where(and(eq(documents.id, input.id), eq(documents.userId, ctx.user.userId)))
        .returning();
      
      if (!deletedDoc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or access denied',
        });
      }
      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
