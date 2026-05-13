import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import { appRouter } from './api/trpc/router';
import { createContext } from './api/trpc/context';
import { config } from './config/loader';

const app = express();
const port = process.env.PORT || 4000;

// Config 기반 CORS 설정 적용
app.use(cors(config.cors));
app.use(express.json());

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: config.environment 
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port} in ${config.environment} mode (Env: ${config.systemEnv})`);
});
