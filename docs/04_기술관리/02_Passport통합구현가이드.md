# Passport.js 통합 구조 및 구현 가이드

**작성일:** 2026-05-12  
**버전:** 1.0  
**상태:** 통합 구현 가이드

---

## 📌 개요

이 문서는 Passport.js의 모든 인증 전략(LocalStrategy, KakaoStrategy, NaverStrategy, GoogleStrategy)을 통합하여 하나의 일관된 인증 시스템으로 구축하는 방법을 설명합니다.

---

## 🏗️ 통합 아키텍처

### 폴더 구조

```
server/
├── _core/
│   ├── passport/
│   │   ├── index.ts              # Passport 초기화
│   │   ├── strategies/
│   │   │   ├── local.ts          # LocalStrategy
│   │   │   ├── kakao.ts          # KakaoStrategy
│   │   │   ├── naver.ts          # NaverStrategy
│   │   │   └── google.ts         # GoogleStrategy
│   │   ├── serializers.ts        # 직렬화/역직렬화
│   │   └── callbacks.ts          # 공통 콜백
│   ├── routes/
│   │   └── auth.ts               # Express 라우터
│   ├── session.ts                # 세션 설정
│   └── middleware.ts             # 인증 미들웨어
├── db.ts                         # 데이터베이스 헬퍼
└── routers.ts                    # tRPC 라우터
```

---

## 💻 구현 코드

### 1. Passport 초기화

**파일: `server/_core/passport/index.ts`**

```typescript
import passport from 'passport';
import { localStrategy } from './strategies/local';
import { kakaoStrategy } from './strategies/kakao';
import { naverStrategy } from './strategies/naver';
import { googleStrategy } from './strategies/google';
import { serializeUser, deserializeUser } from './serializers';

// 전략 등록
passport.use('local', localStrategy);
passport.use('kakao', kakaoStrategy);
passport.use('naver', naverStrategy);
passport.use('google', googleStrategy);

// 직렬화
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

export default passport;
```

### 2. LocalStrategy 구현

**파일: `server/_core/passport/strategies/local.ts`**

```typescript
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import * as db from '../../db';

export const localStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      const user = await db.getUserByEmail(email);

      if (!user || !user.passwordHash) {
        return done(null, false, {
          message: '이메일 또는 비밀번호가 잘못되었습니다.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return done(null, false, {
          message: '이메일 또는 비밀번호가 잘못되었습니다.',
        });
      }

      if (!user.isActive) {
        return done(null, false, {
          message: '비활성화된 계정입니다.',
        });
      }

      await db.updateUserLastLogin(user.id);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);
```

### 3. KakaoStrategy 구현

**파일: `server/_core/passport/strategies/kakao.ts`**

```typescript
import { Strategy as KakaoStrategy } from 'passport-kakao';
import * as db from '../../db';
import { ENV } from '../../env';

export const kakaoStrategy = new KakaoStrategy(
  {
    clientID: ENV.kakaoClientId,
    clientSecret: ENV.kakaoClientSecret,
    callbackURL: ENV.kakaoCallbackUrl,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile._json.kakao_account?.email;
      const name = profile.displayName;
      const oauthId = profile.id;

      // 기존 사용자 조회
      let user = await db.getUserByOAuth('kakao', oauthId);

      if (!user) {
        // 새 사용자 생성
        user = await db.createUser({
          email,
          name,
          oauthProvider: 'kakao',
          oauthId,
          loginMethod: 'kakao',
          isActive: true,
        });
      } else {
        // 기존 사용자 업데이트
        await db.updateUserLastLogin(user.id);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);
```

### 4. NaverStrategy 구현

**파일: `server/_core/passport/strategies/naver.ts`**

```typescript
import { Strategy as NaverStrategy } from 'passport-naver';
import * as db from '../../db';
import { ENV } from '../../env';

export const naverStrategy = new NaverStrategy(
  {
    clientID: ENV.naverClientId,
    clientSecret: ENV.naverClientSecret,
    callbackURL: ENV.naverCallbackUrl,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.email;
      const name = profile.displayName;
      const oauthId = profile.id;

      let user = await db.getUserByOAuth('naver', oauthId);

      if (!user) {
        user = await db.createUser({
          email,
          name,
          oauthProvider: 'naver',
          oauthId,
          loginMethod: 'naver',
          isActive: true,
        });
      } else {
        await db.updateUserLastLogin(user.id);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);
```

### 5. GoogleStrategy 구현

**파일: `server/_core/passport/strategies/google.ts`**

```typescript
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as db from '../../db';
import { ENV } from '../../env';

export const googleStrategy = new GoogleStrategy(
  {
    clientID: ENV.googleClientId,
    clientSecret: ENV.googleClientSecret,
    callbackURL: ENV.googleCallbackUrl,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const oauthId = profile.id;

      let user = await db.getUserByOAuth('google', oauthId);

      if (!user) {
        user = await db.createUser({
          email,
          name,
          oauthProvider: 'google',
          oauthId,
          loginMethod: 'google',
          isActive: true,
        });
      } else {
        await db.updateUserLastLogin(user.id);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);
```

### 6. 직렬화/역직렬화

**파일: `server/_core/passport/serializers.ts`**

```typescript
import * as db from '../db';

export async function serializeUser(user: any, done: Function) {
  done(null, user.id);
}

export async function deserializeUser(id: string, done: Function) {
  try {
    const user = await db.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
}
```

### 7. Express 라우터

**파일: `server/_core/routes/auth.ts`**

```typescript
import { Express, Request, Response } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import * as db from '../../db';

export function registerAuthRoutes(app: Express) {
  // ============ 로컬 인증 ============

  // 회원가입
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: '필수 정보를 입력하세요' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다' });
      }

      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: '이미 가입된 이메일입니다' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await db.createUser({
        email,
        name,
        passwordHash,
        loginMethod: 'local',
        isActive: true,
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error('[Auth] Register failed', error);
      res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다' });
    }
  });

  // 로컬 로그인
  app.post(
    '/api/auth/login',
    passport.authenticate('local', {
      failureRedirect: '/api/auth/login-failed',
    }),
    (req: Request, res: Response) => {
      res.json({ success: true, user: req.user });
    }
  );

  // ============ OAuth 인증 ============

  // 카카오 로그인
  app.get('/api/auth/kakao', passport.authenticate('kakao'));

  app.get(
    '/api/auth/kakao/callback',
    passport.authenticate('kakao', {
      failureRedirect: '/login?error=kakao',
    }),
    (req: Request, res: Response) => {
      res.redirect('/');
    }
  );

  // 네이버 로그인
  app.get('/api/auth/naver', passport.authenticate('naver'));

  app.get(
    '/api/auth/naver/callback',
    passport.authenticate('naver', {
      failureRedirect: '/login?error=naver',
    }),
    (req: Request, res: Response) => {
      res.redirect('/');
    }
  );

  // 구글 로그인
  app.get(
    '/api/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login?error=google',
    }),
    (req: Request, res: Response) => {
      res.redirect('/');
    }
  );

  // ============ 공통 ============

  // 로그인 실패
  app.get('/api/auth/login-failed', (req: Request, res: Response) => {
    res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다' });
  });

  // 로그아웃
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다' });
      }
      res.json({ success: true });
    });
  });

  // 현재 사용자
  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증되지 않은 사용자입니다' });
    }
    res.json({ user: req.user });
  });
}
```

### 8. Express 앱 설정

**파일: `server/index.ts`**

```typescript
import express from 'express';
import passport from './passport';
import { sessionMiddleware } from './_core/session';
import { registerAuthRoutes } from './_core/routes/auth';

const app = express();

// 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 미들웨어
app.use(sessionMiddleware);

// Passport 미들웨어
app.use(passport.initialize());
app.use(passport.session());

// 인증 라우터
registerAuthRoutes(app);

// tRPC 라우터
// ... 다른 라우터들

export default app;
```

---

## 🗄️ 데이터베이스 헬퍼

**파일: `server/db.ts`**

```typescript
import * as schema from '../drizzle/schema';
import { db } from './db-client';
import { eq, and } from 'drizzle-orm';

// 이메일로 사용자 조회
export async function getUserByEmail(email: string) {
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email));
  return users[0];
}

// ID로 사용자 조회
export async function getUserById(id: string) {
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  return users[0];
}

// OAuth로 사용자 조회
export async function getUserByOAuth(provider: string, oauthId: string) {
  const users = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.oauthProvider, provider),
        eq(schema.users.oauthId, oauthId)
      )
    );
  return users[0];
}

// 사용자 생성
export async function createUser(data: {
  email?: string;
  name?: string;
  passwordHash?: string;
  oauthProvider?: string;
  oauthId?: string;
  loginMethod: string;
  isActive: boolean;
}) {
  const [user] = await db
    .insert(schema.users)
    .values({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      oauthProvider: data.oauthProvider,
      oauthId: data.oauthId,
      loginMethod: data.loginMethod,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return user;
}

// 마지막 로그인 시간 업데이트
export async function updateUserLastLogin(userId: string) {
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, userId));
}
```

---

## 🧪 통합 테스트

**파일: `server/auth.integration.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import * as db from './db';

describe('Authentication Integration', () => {
  const testUsers = {
    local: {
      email: 'local@example.com',
      password: 'TestPassword123!',
      name: 'Local User',
    },
    oauth: {
      email: 'oauth@example.com',
      name: 'OAuth User',
      oauthProvider: 'kakao',
      oauthId: 'kakao-12345',
    },
  };

  beforeAll(async () => {
    // 정리
    await db.deleteUserByEmail(testUsers.local.email);
    await db.deleteUserByEmail(testUsers.oauth.email);
  });

  afterAll(async () => {
    // 정리
    await db.deleteUserByEmail(testUsers.local.email);
    await db.deleteUserByEmail(testUsers.oauth.email);
  });

  it('로컬 사용자를 생성하고 로그인할 수 있어야 함', async () => {
    // 1. 사용자 생성
    const passwordHash = await bcrypt.hash(testUsers.local.password, 10);
    const user = await db.createUser({
      email: testUsers.local.email,
      name: testUsers.local.name,
      passwordHash,
      loginMethod: 'local',
      isActive: true,
    });

    expect(user.email).toBe(testUsers.local.email);

    // 2. 비밀번호 검증
    const isValid = await bcrypt.compare(
      testUsers.local.password,
      user.passwordHash
    );
    expect(isValid).toBe(true);

    // 3. 사용자 조회
    const retrievedUser = await db.getUserByEmail(testUsers.local.email);
    expect(retrievedUser?.id).toBe(user.id);
  });

  it('OAuth 사용자를 생성하고 조회할 수 있어야 함', async () => {
    // 1. 사용자 생성
    const user = await db.createUser({
      email: testUsers.oauth.email,
      name: testUsers.oauth.name,
      oauthProvider: testUsers.oauth.oauthProvider,
      oauthId: testUsers.oauth.oauthId,
      loginMethod: testUsers.oauth.oauthProvider,
      isActive: true,
    });

    expect(user.oauthProvider).toBe(testUsers.oauth.oauthProvider);

    // 2. OAuth로 조회
    const retrievedUser = await db.getUserByOAuth(
      testUsers.oauth.oauthProvider,
      testUsers.oauth.oauthId
    );
    expect(retrievedUser?.id).toBe(user.id);
  });

  it('같은 이메일로 로컬과 OAuth 사용자를 구분할 수 있어야 함', async () => {
    const email = 'multi@example.com';

    // 1. 로컬 사용자 생성
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const localUser = await db.createUser({
      email,
      name: 'Local User',
      passwordHash,
      loginMethod: 'local',
      isActive: true,
    });

    // 2. 동일 이메일의 OAuth 사용자 생성
    const oauthUser = await db.createUser({
      email,
      name: 'OAuth User',
      oauthProvider: 'kakao',
      oauthId: 'kakao-99999',
      loginMethod: 'kakao',
      isActive: true,
    });

    // 3. 이메일로 조회 (최신 사용자)
    const byEmail = await db.getUserByEmail(email);
    expect(byEmail).toBeDefined();

    // 4. OAuth로 조회
    const byOAuth = await db.getUserByOAuth('kakao', 'kakao-99999');
    expect(byOAuth?.id).toBe(oauthUser.id);

    // 정리
    await db.deleteUserByEmail(email);
  });
});
```

---

## 🔐 보안 체크리스트

| 항목 | 확인 |
| :---: | :--- |
| **비밀번호 해싱** | ✅ bcrypt 10 라운드 |
| **세션 저장소** | ✅ PostgreSQL |
| **쿠키 보안** | ✅ HttpOnly, Secure, SameSite |
| **HTTPS** | ✅ 운영 환경에서 필수 |
| **입력 검증** | ✅ 이메일, 비밀번호 검증 |
| **에러 메시지** | ✅ 일반적인 메시지 |
| **CSRF 방지** | ✅ SameSite=Strict |
| **OAuth 상태 검증** | ✅ state 파라미터 |

---

## 📝 환경 변수 정리

```bash
# 로컬 인증
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# 카카오
KAKAO_CLIENT_ID=your-kakao-id
KAKAO_CLIENT_SECRET=your-kakao-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

# 네이버
NAVER_CLIENT_ID=your-naver-id
NAVER_CLIENT_SECRET=your-naver-secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback

# 구글
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/pdfrendd

# 환경
NODE_ENV=development
```

---

## 🚀 구현 체크리스트

- [ ] Passport 초기화 및 전략 등록
- [ ] LocalStrategy 구현 및 테스트
- [ ] KakaoStrategy 구현 및 테스트
- [ ] NaverStrategy 구현 및 테스트
- [ ] GoogleStrategy 구현 및 테스트
- [ ] Express 라우터 구현
- [ ] 세션 저장소 설정
- [ ] 데이터베이스 헬퍼 구현
- [ ] 통합 테스트 작성
- [ ] 프론트엔드 로그인 UI 구현
- [ ] 보안 검토 및 테스트
- [ ] 배포 준비

---

**작성자:** jkman  
**상태:** 통합 구현 가이드 완료

