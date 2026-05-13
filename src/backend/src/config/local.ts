export const localConfig = {
  environment: 'local',
  nodeEnv: 'local',
  logging: {
    level: 'debug',
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
};
