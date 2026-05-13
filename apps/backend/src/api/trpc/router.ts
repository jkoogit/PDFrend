import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../../infrastructure/database/index_db';
import { users, documents } from '../../infrastructure/database/schema/index_sch';
import { eq, and } from 'drizzle-orm';

const t = initTRPC.create();

export const appRouter = t.router({
  healthCheck: t.procedure.query(() => {
    return { status: 'ok', message: 'PDFrend API is running' };
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
  createDocument: t.procedure
    .input(z.object({
      userId: z.number(),
      title: z.string().min(1),
      content: z.string().optional(),
      fileUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const [newDoc] = await db.insert(documents).values({
        userId: input.userId,
        title: input.title,
        content: input.content,
        fileUrl: input.fileUrl,
      }).returning();
      return newDoc;
    }),

  listDocuments: t.procedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.select().from(documents).where(eq(documents.userId, input.userId));
    }),

  getDocument: t.procedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .query(async ({ input }) => {
      const [doc] = await db.select()
        .from(documents)
        .where(and(eq(documents.id, input.id), eq(documents.userId, input.userId)));
      
      if (!doc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or access denied',
        });
      }
      return doc;
    }),

  updateDocument: t.procedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      fileUrl: z.string().url().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, userId, ...updateData } = input;
      const [updatedDoc] = await db.update(documents)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(documents.id, id), eq(documents.userId, userId)))
        .returning();
      
      if (!updatedDoc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found or access denied',
        });
      }
      return updatedDoc;
    }),

  deleteDocument: t.procedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .mutation(async ({ input }) => {
      const [deletedDoc] = await db.delete(documents)
        .where(and(eq(documents.id, input.id), eq(documents.userId, input.userId)))
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
