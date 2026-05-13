import { commonConfig } from './common';
import { developConfig } from './develop';

/**
 * 시스템 인프라 환경(Environment)과 소프트웨어 동작 모드(Mode)를 분리하여 관리합니다.
 * - Environment: dev, stg, main (인프라/브랜치 기준)
 * - Mode: develop, production (소프트웨어 동작 기준)
 */
function getSystemEnv() {
  return process.env.ENVIRONMENT || 'dev'; // 기본값 dev
}

function loadConfig() {
  const systemEnv = getSystemEnv();
  
  // 현재는 모든 환경에서 developConfig를 기반으로 사용하되, 
  // 향후 환경별 차이가 필요하면 여기서 분기 처리합니다.
  const envConfig = developConfig;

  return {
    ...commonConfig,
    ...envConfig,
    systemEnv, // 시스템 구분값 추가
  };
}

export const config = loadConfig();
