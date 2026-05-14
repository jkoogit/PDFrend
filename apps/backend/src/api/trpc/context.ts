import * as trpcExpress from '@trpc/server/adapters/express';
import { verifyAuthToken } from './auth_token';

export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const user = token ? verifyAuthToken(token) : null;

  return {
    req,
    res,
    user,
    token,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
