# Manus OAuth 대체 전략 및 마이그레이션 가이드

**작성일:** 2026-05-12  
**버전:** 1.0  
**상태:** 마이그레이션 전략

---

## 📌 개요

현재 프로젝트는 Manus OAuth를 사용하고 있지만, Passport.js 기반의 다중 인증 시스템(카카오, 네이버, 구글, 이메일)으로 전환합니다. 이 문서는 기존 Manus OAuth 코드를 제거하고 새로운 인증 시스템으로 마이그레이션하는 전략을 설명합니다.

---

## 🔄 마이그레이션 전략

### Phase 1: 준비 단계 (1주)
1. Passport.js 패키지 설치
2. 새로운 인증 시스템 구현
3. 기존 Manus OAuth 코드 분석
4. 데이터베이스 스키마 확장

### Phase 2: 병렬 운영 (1주)
1. 새로운 인증 시스템 배포 (별도 엔드포인트)
2. 기존 Manus OAuth 유지
3. 사용자에게 새로운 로그인 방식 안내
4. 모니터링 및 버그 수정

### Phase 3: 마이그레이션 (1주)
1. 기존 사용자 데이터 마이그레이션
2. 기존 Manus OAuth 엔드포인트 비활성화
3. 새로운 인증 시스템으로 완전 전환
4. 롤백 계획 준비

### Phase 4: 정리 (1주)
1. 기존 Manus OAuth 코드 제거
2. 문서 업데이트
3. 배포 및 모니터링
4. 성능 최적화

---

## 🗄️ 데이터베이스 마이그레이션

### 1단계: 스키마 확장

```sql
-- 기존 users 테이블에 새로운 컬럼 추가
ALTER TABLE users ADD COLUMN (
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  login_method VARCHAR(50),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id) 
  WHERE oauth_provider IS NOT NULL;

-- 세션 테이블 생성
CREATE TABLE session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON session (expire);
```

### 2단계: 기존 사용자 마이그레이션

```sql
-- Manus OAuth 사용자를 새로운 스키마로 마이그레이션
UPDATE users 
SET 
  login_method = 'manus_oauth',
  oauth_provider = 'manus',
  oauth_id = open_id,
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE open_id IS NOT NULL AND oauth_id IS NULL;

-- 마이그레이션 확인
SELECT COUNT(*) as migrated_users FROM users WHERE oauth_provider = 'manus';
```

### 3단계: 데이터 검증

```sql
-- 마이그레이션 후 데이터 검증
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN oauth_provider = 'manus' THEN 1 END) as manus_users,
  COUNT(CASE WHEN oauth_provider = 'kakao' THEN 1 END) as kakao_users,
  COUNT(CASE WHEN oauth_provider = 'naver' THEN 1 END) as naver_users,
  COUNT(CASE WHEN oauth_provider = 'google' THEN 1 END) as google_users,
  COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as local_users
FROM users;
```

---

## 💻 코드 마이그레이션

### 1단계: 기존 Manus OAuth 코드 분석

**기존 파일: `server/_core/oauth.ts`**

```typescript
// 제거할 코드
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    
    // ... Manus OAuth 로직
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    // ... 사용자 생성/업데이트
  });
}
```

### 2단계: 새로운 인증 시스템으로 교체

**새 파일: `server/_core/routes/auth.ts`**

```typescript
// Passport.js 기반 인증 라우터로 교체
import passport from 'passport';

export function registerAuthRoutes(app: Express) {
  // 로컬 인증
  app.post('/api/auth/register', ...);
  app.post('/api/auth/login', passport.authenticate('local'), ...);
  
  // OAuth 인증
  app.get('/api/auth/kakao', passport.authenticate('kakao'), ...);
  app.get('/api/auth/naver', passport.authenticate('naver'), ...);
  app.get('/api/auth/google', passport.authenticate('google'), ...);
  
  // 공통
  app.post('/api/auth/logout', ...);
  app.get('/api/auth/me', ...);
}
```

### 3단계: SDK 코드 제거

**제거할 파일:**
- `server/_core/sdk.ts` - Manus SDK 제거
- `server/_core/oauth.ts` - Manus OAuth 라우터 제거
- `server/_core/types/manusTypes.ts` - Manus 타입 정의 제거

**유지할 파일:**
- `server/_core/env.ts` - 환경 변수 설정 (업데이트)
- `server/_core/context.ts` - tRPC 컨텍스트 (업데이트)

---

## 🔄 병렬 운영 전략

### 기존 Manus OAuth 엔드포인트 (유지)

```typescript
// 기존 엔드포인트 유지 (호환성)
app.get("/api/oauth/callback", async (req: Request, res: Response) => {
  // 기존 Manus OAuth 로직
  // 사용자를 새로운 스키마로 자동 마이그레이션
  const user = await db.getUserByOAuth('manus', openId);
  if (!user) {
    // 새로운 스키마로 사용자 생성
    await db.createUser({
      oauthProvider: 'manus',
      oauthId: openId,
      loginMethod: 'manus_oauth',
      // ...
    });
  }
});
```

### 새로운 Passport 엔드포인트 (추가)

```typescript
// 새로운 엔드포인트
app.post('/api/auth/login', passport.authenticate('local'), ...);
app.get('/api/auth/kakao', passport.authenticate('kakao'), ...);
// ...
```

---

## 📊 마이그레이션 체크리스트

### 준비 단계
- [ ] Passport.js 패키지 설치
- [ ] 환경 변수 설정 (카카오, 네이버, 구글)
- [ ] 데이터베이스 스키마 확장
- [ ] 새로운 인증 시스템 구현
- [ ] 단위 테스트 작성

### 배포 전
- [ ] 통합 테스트 완료
- [ ] 성능 테스트 완료
- [ ] 보안 검토 완료
- [ ] 롤백 계획 수립
- [ ] 모니터링 설정

### 마이그레이션 실행
- [ ] 기존 사용자 데이터 백업
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 데이터 검증
- [ ] 새로운 시스템 배포
- [ ] 모니터링 시작

### 마이그레이션 후
- [ ] 기존 Manus OAuth 엔드포인트 비활성화
- [ ] 기존 코드 제거
- [ ] 문서 업데이트
- [ ] 성능 최적화
- [ ] 사용자 피드백 수집

---

## 🚨 롤백 계획

### 롤백 시나리오

**시나리오 1: 데이터 마이그레이션 실패**
```sql
-- 마이그레이션 되돌리기
UPDATE users 
SET 
  oauth_provider = NULL,
  oauth_id = NULL,
  login_method = NULL
WHERE oauth_provider = 'manus' AND oauth_id IS NOT NULL;
```

**시나리오 2: 새로운 인증 시스템 오류**
```typescript
// 기존 Manus OAuth로 복구
app.get("/api/oauth/callback", manusOAuthHandler);
```

**시나리오 3: 데이터 손상**
```bash
# 백업에서 복구
psql -U user -d pdfrendd < backup.sql
```

---

## 📝 마이그레이션 스크립트

**파일: `scripts/migrate-auth.mjs`**

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting authentication migration...');
    
    // 1. 스키마 확장
    console.log('Step 1: Extending schema...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS (
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        login_method VARCHAR(50),
        last_login_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    
    // 2. 기존 사용자 마이그레이션
    console.log('Step 2: Migrating existing users...');
    const result = await client.query(`
      UPDATE users 
      SET 
        login_method = 'manus_oauth',
        oauth_provider = 'manus',
        oauth_id = open_id,
        is_active = TRUE
      WHERE open_id IS NOT NULL AND oauth_id IS NULL;
    `);
    console.log(`Migrated ${result.rowCount} users`);
    
    // 3. 인덱스 생성
    console.log('Step 3: Creating indexes...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
    `);
    
    // 4. 검증
    console.log('Step 4: Validating migration...');
    const validation = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN oauth_provider = 'manus' THEN 1 END) as manus_users
      FROM users;
    `);
    console.log('Validation result:', validation.rows[0]);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
```

---

## 🧪 마이그레이션 테스트

**파일: `server/migration.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Authentication Migration', () => {
  it('기존 Manus OAuth 사용자를 새로운 스키마로 마이그레이션할 수 있어야 함', async () => {
    // 1. 기존 형식의 사용자 생성
    const user = await db.createUser({
      oauthProvider: 'manus',
      oauthId: 'manus-user-123',
      loginMethod: 'manus_oauth',
      isActive: true,
    });

    expect(user.oauthProvider).toBe('manus');
    expect(user.oauthId).toBe('manus-user-123');

    // 2. 새로운 형식으로 조회
    const retrievedUser = await db.getUserByOAuth('manus', 'manus-user-123');
    expect(retrievedUser?.id).toBe(user.id);
  });

  it('새로운 인증 방식과 기존 Manus OAuth를 함께 지원해야 함', async () => {
    // 1. 로컬 사용자 생성
    const localUser = await db.createUser({
      email: 'local@example.com',
      passwordHash: 'hashed-password',
      loginMethod: 'local',
      isActive: true,
    });

    // 2. Manus OAuth 사용자 생성
    const manusUser = await db.createUser({
      oauthProvider: 'manus',
      oauthId: 'manus-456',
      loginMethod: 'manus_oauth',
      isActive: true,
    });

    // 3. 카카오 OAuth 사용자 생성
    const kakaoUser = await db.createUser({
      email: 'kakao@example.com',
      oauthProvider: 'kakao',
      oauthId: 'kakao-789',
      loginMethod: 'kakao',
      isActive: true,
    });

    // 4. 각각 조회 가능
    expect(await db.getUserById(localUser.id)).toBeDefined();
    expect(await db.getUserByOAuth('manus', 'manus-456')).toBeDefined();
    expect(await db.getUserByOAuth('kakao', 'kakao-789')).toBeDefined();
  });
});
```

---

## 📋 마이그레이션 실행 절차

### 1. 마이그레이션 전 확인

```bash
# 백업 생성
pg_dump -U user -d pdfrendd > backup_before_migration.sql

# 현재 사용자 수 확인
psql -U user -d pdfrendd -c "SELECT COUNT(*) FROM users;"
```

### 2. 마이그레이션 실행

```bash
# 마이그레이션 스크립트 실행
pnpm run migrate:auth

# 또는 SQL 직접 실행
psql -U user -d pdfrendd < migration.sql
```

### 3. 마이그레이션 후 검증

```bash
# 마이그레이션된 사용자 확인
psql -U user -d pdfrendd -c "
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN oauth_provider = 'manus' THEN 1 END) as manus_users
  FROM users;
"
```

### 4. 롤백 (필요시)

```bash
# 백업에서 복구
psql -U user -d pdfrendd < backup_before_migration.sql
```

---

## 🎯 성공 기준

- ✅ 모든 기존 사용자가 새로운 스키마로 마이그레이션됨
- ✅ 새로운 인증 시스템이 정상 작동함
- ✅ 기존 Manus OAuth 사용자가 로그인 가능함
- ✅ 새로운 OAuth 사용자가 가입 가능함
- ✅ 로컬 인증 사용자가 가입 가능함
- ✅ 성능 저하가 없음
- ✅ 보안 취약점이 없음

---

**작성자:** jkman  
**상태:** 마이그레이션 전략 완료

