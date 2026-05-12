export const devConfig = {
  environment: 'development',
  nodeEnv: 'development',
  logging: {
    level: 'debug',
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
};
