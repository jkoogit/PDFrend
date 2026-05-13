import { appRouter } from './api/trpc/router';
import { createContext } from './api/trpc/context';

async function runTests() {
  console.log('🚀 Starting Runtime API Tests...');
  
  const caller = appRouter.createCaller({} as any);

  try {
    // 1. Health Check
    const health = await caller.healthCheck();
    console.log('✅ Health Check:', health);

    // 2. Create User (Test)
    // 실제 DB가 없으므로 에러가 발생할 것이나, 로직 진입 여부를 확인
    console.log('🧪 Testing createUser...');
    const user = await caller.createUser({ email: 'test@example.com', name: 'Test User' });
    console.log('✅ User Created:', user);

  } catch (error: any) {
    console.log('❌ Test Error (Expected if DB is not connected):', error.message);
  }
}

runTests();
