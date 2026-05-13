import { commonConfig } from './common';
import { devConfig } from './dev';

function getEnvironment() {
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV;
  if (env === 'production') return 'prd';
  if (env === 'staging' || env === 'stg') return 'stg';
  return 'dev';
}

function loadConfig() {
  const environment = getEnvironment();
  
  // 현재는 dev만 구현, 필요시 stg, prd 추가
  const envConfig = devConfig;

  return {
    ...commonConfig,
    ...envConfig,
  };
}

export const config = loadConfig();
