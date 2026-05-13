import { commonConfig } from './common';
import { localConfig } from './local';

function getEnvironment() {
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV;
  if (env === 'production') return 'prd';
  if (env === 'staging' || env === 'stg') return 'stg';
  return 'local';
}

function loadConfig() {
  const environment = getEnvironment();
  
  // 현재는 dev만 구현, 필요시 stg, prd 추가
  const envConfig = localConfig;

  return {
    ...commonConfig,
    ...envConfig,
  };
}

export const config = loadConfig();
