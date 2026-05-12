# Passport.js 기반 인증 시스템 설계

**작성일:** 2026-05-12  
**버전:** 1.0  
**상태:** 설계 단계

---

## 📌 개요

현재 Manus OAuth 기반 인증 시스템을 **Passport.js 기반 다중 인증 시스템**으로 전환합니다. 이를 통해 카카오, 네이버, 구글, 이메일/비밀번호 등 다양한 인증 방식을 무료로 지원합니다.

### 주요 목표

- ✅ **무료 인증 시스템** - 모든 인증 방식이 무료
- ✅ **다중 OAuth 지원** - 카카오, 네이버, 구글
- ✅ **로컬 인증 지원** - 이메일/비밀번호
- ✅ **기존 호환성** - 기존 사용자 데이터 유지
- ✅ **확장성** - 향후 다른 인증 방식 추가 용이

---

## 🏗️ 아키텍처 설계

### 계층 구조

```
┌─────────────────────────────────────────┐
│         클라이언트 (React)               │
│  - 로그인 페이지                         │
│  - 소셜 로그인 버튼                      │
│  - 이메일 가입 폼                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Express 라우터 (/api/auth)         │
│  - POST /auth/register (이메일 가입)    │
│  - POST /auth/login (이메일 로그인)     │
│  - GET /auth/kakao (카카오 로그인)      │
│  - GET /auth/naver (네이버 로그인)      │
│  - GET /auth/google (구글 로그인)       │
│  - GET /auth/callback (OAuth 콜백)     │
│  - POST /auth/logout (로그아웃)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Passport.js 미들웨어               │
│  - LocalStrategy (이메일/비밀번호)      │
│  - KakaoStrategy (카카오 OAuth)         │
│  - NaverStrategy (네이버 OAuth)         │
│  - GoogleStrategy (구글 OAuth)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      인증 서비스 (AuthService)          │
│  - 사용자 생성/조회                     │
│  - 비밀번호 해싱 (bcrypt)               │
│  - 세션 관리                            │
│  - JWT 토큰 생성                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      데이터베이스 (PostgreSQL)          │
│  - users 테이블 (확장)                  │
│  - sessions 테이블 (선택)               │
└─────────────────────────────────────────┘
```

---

## 📊 인증 흐름

### 1. 이메일/비밀번호 인증 흐름

```
사용자 입력
   ↓
POST /api/auth/register
   ↓
비밀번호 해싱 (bcrypt)
   ↓
사용자 데이터 저장
   ↓
세션 생성
   ↓
쿠키 설정
   ↓
리다이렉트 (/)
```

### 2. 카카오/네이버/구글 OAuth 흐름

```
사용자 클릭 (소셜 로그인 버튼)
   ↓
GET /api/auth/kakao (또는 naver, google)
   ↓
OAuth 제공자로 리다이렉트
   ↓
사용자 승인
   ↓
OAuth 제공자 → 인증 코드 반환
   ↓
GET /api/auth/callback?code=xxx
   ↓
Passport 검증
   ↓
사용자 정보 조회/생성
   ↓
세션 생성
   ↓
쿠키 설정
   ↓
리다이렉트 (/)
```

---

## 🗄️ 데이터베이스 스키마 (확장)

### users 테이블 확장

```sql
ALTER TABLE users ADD COLUMN (
  -- 로컬 인증
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),  -- bcrypt 해시
  
  -- OAuth 인증
  oauth_provider VARCHAR(50),  -- 'kakao', 'naver', 'google'
  oauth_id VARCHAR(255),       -- OAuth 제공자의 사용자 ID
  
  -- 메타데이터
  last_login_at TIMESTAMP,
  login_method VARCHAR(50),    -- 'local', 'kakao', 'naver', 'google'
  
  -- 계정 상태
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id) 
  WHERE oauth_provider IS NOT NULL;
```

---

## 📦 필요한 패키지

```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-kakao": "^1.0.1",
    "passport-naver": "^1.0.6",
    "passport-google-oauth20": "^2.0.0",
    "bcryptjs": "^2.4.3",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.0",
    "dotenv": "^16.3.1"
  }
}
```

---

## 🔐 환경 변수

```bash
# 로컬 인증
JWT_SECRET=your-secret-key

# 카카오 OAuth
KAKAO_CLIENT_ID=your-kakao-app-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

# 네이버 OAuth
NAVER_CLIENT_ID=your-naver-app-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback

# 구글 OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# 세션
SESSION_SECRET=your-session-secret
DATABASE_URL=postgresql://user:password@localhost:5432/pdfrendd
```

---

## 🔄 사용자 모델 확장

### 기존 users 테이블

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  // ... 기존 필드
});
```

### 확장된 users 테이블

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 기본 정보
  name: text("name"),
  email: text("email").unique(),
  
  // 로컬 인증
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  
  // OAuth 인증
  oauthProvider: text("oauth_provider"), // 'kakao', 'naver', 'google'
  oauthId: text("oauth_id"),
  
  // 메타데이터
  loginMethod: text("login_method"), // 'local', 'kakao', 'naver', 'google'
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  
  // 타임스탬프
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 인덱스
export const usersOAuthIndex = uniqueIndex("idx_users_oauth")
  .on(users.oauthProvider, users.oauthId);
```

---

## 🎯 구현 단계

### Phase 1: 기본 설정 (1주)
1. Passport.js 패키지 설치
2. Express 세션 미들웨어 설정
3. PostgreSQL 세션 저장소 설정 (connect-pg-simple)
4. 데이터베이스 스키마 확장

### Phase 2: 로컬 인증 (1주)
1. LocalStrategy 구현
2. 회원가입 API 구현
3. 로그인 API 구현
4. 비밀번호 해싱 (bcrypt)
5. 단위 테스트 작성

### Phase 3: OAuth 인증 (2주)
1. 카카오 OAuth 구현
2. 네이버 OAuth 구현
3. 구글 OAuth 구현
4. OAuth 콜백 처리
5. 통합 테스트 작성

### Phase 4: 통합 및 마이그레이션 (1주)
1. 기존 Manus OAuth 제거
2. 기존 사용자 마이그레이션
3. 로그아웃 API 구현
4. 에러 처리 및 로깅
5. E2E 테스트

### Phase 5: 프론트엔드 연동 (1주)
1. 로그인 페이지 UI 구현
2. 회원가입 페이지 UI 구현
3. 소셜 로그인 버튼 구현
4. 세션 관리 (useAuth 훅)
5. 에러 처리

---

## 🔗 참고 자료

| 항목 | 링크 |
| :---: | :--- |
| **Passport.js** | https://www.passportjs.org/ |
| **카카오 OAuth** | https://developers.kakao.com/docs/latest/ko/kakaologin/common |
| **네이버 OAuth** | https://developers.naver.com/docs/login/overview |
| **구글 OAuth** | https://developers.google.com/identity/protocols/oauth2 |
| **bcryptjs** | https://github.com/dcodeIO/bcrypt.js |
| **express-session** | https://github.com/expressjs/session |

---

## 📝 다음 단계

1. ✅ 아키텍처 설계 완료
2. ⏳ 카카오, 네이버, 구글 OAuth 설정 가이드 작성
3. ⏳ 이메일/비밀번호 로컬 인증 구현 가이드 작성
4. ⏳ Passport.js 통합 구조 및 구현 가이드 작성
5. ⏳ 기존 Manus OAuth 대체 전략 수립
6. ⏳ 개발 로드맵 업데이트

---

**작성자:** jkman  
**상태:** 설계 단계 → 구현 준비 중

