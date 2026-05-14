import { appRouter } from './api/trpc/router';

async function runTests() {
  console.log('🚀 Starting Runtime API Tests...');

  const publicCaller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: null,
    token: undefined,
  });

  try {
    const health = await publicCaller.healthCheck();
    console.log('✅ Health Check:', health);

    console.log('🧪 Testing signup...');
    const signupResult = await publicCaller.signup({
      email: 'auth-test@example.com',
      password: 'password1234',
      name: 'Auth Test User',
    });
    console.log('✅ Signup:', signupResult.user.email);

    console.log('🧪 Testing login...');
    const loginResult = await publicCaller.login({
      email: 'auth-test@example.com',
      password: 'password1234',
    });
    console.log('✅ Login token issued:', !!loginResult.token);

    const privateCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { userId: loginResult.user.id, email: loginResult.user.email, exp: Math.floor(Date.now() / 1000) + 60 },
      token: loginResult.token,
    });

    const me = await privateCaller.me();
    console.log('✅ Me:', me.email);

    const logout = await privateCaller.logout();
    console.log('✅ Logout:', logout.success);
  } catch (error: any) {
    console.log('❌ Test Error (Expected if DB is not connected):', error.message);
  }
}

runTests();
