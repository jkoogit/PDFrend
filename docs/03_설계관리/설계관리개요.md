# 03. 설계 관리 (Architecture Management)

## 목적

PDFrend 백엔드의 전체 아키텍처, 모듈 구조, 데이터 흐름을 정의하고 관리합니다. 이 문서는 개발 진행 중 아키텍처 변경 사항을 기록하며, 향후 MSA 전환 시에도 참고할 수 있도록 모듈 독립성을 유지합니다.

---

## 1. 전체 시스템 아키텍처

### 1.1 3계층 아키텍처 (3-Tier Architecture)

PDFrend는 다음과 같은 3계층 구조로 설계됩니다:

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│  (React 19 + Tailwind 4 + tRPC Client)                   │
│  - Dashboard, PDF Viewer, Settings UI                    │
└──────────────────┬──────────────────────────────────────┘
                   │ tRPC (Type-safe RPC)
┌──────────────────▼──────────────────────────────────────┐
│                  Business Logic Layer                    │
│  (Express 4 + tRPC 11 + Node.js)                         │
│  - Document Management                                   │
│  - Annotation Processing                                 │
│  - Version Control                                       │
│  - Real-time Sync (WebSocket)                            │
│  - Offline Sync                                          │
│  - Permission & Sharing                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL (Drizzle ORM)
┌──────────────────▼──────────────────────────────────────┐
│                   Data Layer                             │
│  (PostgreSQL 16.13 + JSONB)                              │
│  - Users, Documents, Versions                            │
│  - Annotations (JSONB), Bookmarks                        │
│  - Shares, Categories, Audit Logs                        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 외부 서비스 연동

| 서비스 | 용도 | 상태 |
| :--- | :--- | :---: |
| **Manus OAuth** | 사용자 인증 | ✅ 내장 |
| **PostgreSQL (Cloudtype)** | 주요 데이터 저장소 | ✅ 연동 완료 |
| **S3 (또는 NAS)** | PDF, 이미지 저장소 | 📋 Phase 1 |
| **RabbitMQ** | 비동기 작업 큐 | 📋 Phase 1 |
| **WebSocket** | 실시간 동기화 | 📋 Phase 3 |
| **Tesseract/OCR API** | 텍스트 추출 | 📋 Phase 4 |

---

## 2. 모듈 구조 (Module Decomposition)

### 2.1 백엔드 모듈 분해

```
backend/
├── server/
│   ├── _core/                    # 프레임워크 레벨 (수정 금지)
│   │   ├── index.ts              # Express 서버 진입점
│   │   ├── context.ts            # tRPC 컨텍스트 (인증)
│   │   ├── trpc.ts               # tRPC 라우터 팩토리
│   │   ├── env.ts                # 환경 변수 관리
│   │   ├── oauth.ts              # OAuth 인증 흐름
│   │   ├── cookies.ts            # 세션 쿠키 관리
│   │   ├── llm.ts                # LLM 통합
│   │   ├── voiceTranscription.ts # 음성 인식
│   │   ├── imageGeneration.ts    # 이미지 생성
│   │   ├── map.ts                # 지도 API
│   │   └── notification.ts       # 알림 시스템
│   │
│   ├── db.ts                     # 데이터베이스 쿼리 헬퍼
│   ├── routers.ts                # tRPC 라우터 정의 (기능별)
│   │
│   ├── modules/                  # 기능별 모듈 (Phase 1부터)
│   │   ├── documents/            # 문서 관리
│   │   │   ├── router.ts         # 문서 CRUD API
│   │   │   ├── service.ts        # 비즈니스 로직
│   │   │   ├── schema.ts         # 입출력 스키마
│   │   │   └── utils.ts          # 유틸리티
│   │   │
│   │   ├── annotations/          # 주석 관리
│   │   │   ├── router.ts
│   │   │   ├── service.ts
│   │   │   └── schema.ts
│   │   │
│   │   ├── versions/             # 버전 관리
│   │   │   ├── router.ts
│   │   │   ├── service.ts
│   │   │   └── schema.ts
│   │   │
│   │   ├── sharing/              # 공유 & 권한
│   │   │   ├── router.ts
│   │   │   ├── service.ts
│   │   │   └── schema.ts
│   │   │
│   │   ├── sync/                 # 동기화 (실시간/오프라인)
│   │   │   ├── websocket.ts
│   │   │   ├── conflict.ts
│   │   │   └── schema.ts
│   │   │
│   │   └── storage/              # 파일 저장소
│   │       ├── s3.ts
│   │       ├── pdf-processor.ts
│   │       └── schema.ts
│   │
│   └── *.test.ts                 # 유닛 테스트 (Vitest)
│
├── drizzle/
│   ├── schema.ts                 # ORM 스키마 정의
│   └── migrations/               # 마이그레이션 SQL
│
├── client/                       # React 프론트엔드
│   ├── src/
│   │   ├── pages/                # 페이지 컴포넌트
│   │   ├── components/           # 재사용 컴포넌트
│   │   ├── hooks/                # 커스텀 훅
│   │   ├── lib/                  # 유틸리티
│   │   └── App.tsx               # 라우팅 진입점
│   └── public/                   # 정적 파일
│
├── shared/                       # 공유 상수 & 타입
│   └── const.ts
│
└── package.json
```

### 2.2 모듈 간 의존성 (Dependency Graph)

```
documents (문서 관리)
    ├── depends on: storage (파일 저장)
    ├── depends on: versions (버전 관리)
    └── depends on: sharing (권한 확인)

annotations (주석 관리)
    ├── depends on: documents
    └── depends on: versions

versions (버전 관리)
    ├── depends on: documents
    └── depends on: sync (동기화)

sync (동기화)
    ├── depends on: documents
    ├── depends on: annotations
    └── depends on: versions

sharing (공유 & 권한)
    ├── depends on: documents
    └── depends on: versions

storage (파일 저장소)
    └── independent (S3/NAS 추상화)
```

---

## 3. 데이터 모델 (Data Model)

### 3.1 핵심 테이블 구조

#### users (사용자)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  role ENUM('user', 'admin') DEFAULT 'user',
  storageQuota BIGINT DEFAULT 1073741824,  -- 1GB (Policy-STG-001)
  storageUsed BIGINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### documents (문서)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ownerId INT NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileHash VARCHAR(64),  -- SHA-256 (Policy-OFF-002)
  fileSize BIGINT NOT NULL,
  currentVersionId UUID,
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (currentVersionId) REFERENCES versions(id)
);
```

#### versions (버전)
```sql
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentId UUID NOT NULL REFERENCES documents(id),
  versionNumber INT NOT NULL,
  createdBy INT NOT NULL REFERENCES users(id),
  snapshotData JSONB NOT NULL,  -- 전체 스냅샷
  changeLog JSONB,  -- 변경 이력
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### annotations (주석) - JSONB 활용
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentId UUID NOT NULL REFERENCES documents(id),
  versionId UUID REFERENCES versions(id),
  createdBy INT NOT NULL REFERENCES users(id),
  data JSONB NOT NULL,  -- 주석 데이터 (Policy-DB-001)
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  INDEX idx_document_page (documentId, (data->>'page'))
);
```

#### shares (공유 & 권한)
```sql
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentId UUID NOT NULL REFERENCES documents(id),
  sharedWith INT REFERENCES users(id),
  permission ENUM('view', 'comment', 'edit') DEFAULT 'view',
  expiresAt TIMESTAMP,
  shareToken VARCHAR(64) UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API 설계 (API Contract)

### 4.1 tRPC 라우터 구조

```typescript
appRouter = {
  auth: {
    me: publicProcedure.query(),
    logout: publicProcedure.mutation(),
  },
  
  documents: {
    list: protectedProcedure.query(),
    get: protectedProcedure.query(),
    create: protectedProcedure.mutation(),
    upload: protectedProcedure.mutation(),
    download: protectedProcedure.query(),
    delete: protectedProcedure.mutation(),
  },
  
  annotations: {
    list: protectedProcedure.query(),
    create: protectedProcedure.mutation(),
    update: protectedProcedure.mutation(),
    delete: protectedProcedure.mutation(),
    search: protectedProcedure.query(),
  },
  
  versions: {
    list: protectedProcedure.query(),
    create: protectedProcedure.mutation(),
    restore: protectedProcedure.mutation(),
  },
  
  shares: {
    list: protectedProcedure.query(),
    create: protectedProcedure.mutation(),
    update: protectedProcedure.mutation(),
    delete: protectedProcedure.mutation(),
  },
}
```

---

## 5. 보안 고려사항

### 5.1 인증 & 인가

| 항목 | 구현 | 정책 |
| :--- | :--- | :--- |
| **인증** | Manus OAuth + JWT | 세션 쿠키 (HttpOnly, Secure) |
| **인가** | Role-based (admin/user) | 문서 소유자 확인 |
| **권한** | 공유 권한 (view/comment/edit) | 공유 테이블 검증 |

---

## 6. 성능 최적화 전략

### 6.1 데이터베이스 인덱싱

```sql
CREATE INDEX idx_annotations_document_page 
  ON annotations (documentId, (data->>'page'));

CREATE INDEX idx_versions_document 
  ON versions (documentId, versionNumber DESC);

CREATE INDEX idx_shares_document 
  ON shares (documentId, sharedWith);
```

---

## 7. 설계 변경 이력

| 날짜 | 변경 내용 | 변경자 | ADR |
| :--- | :--- | :--- | :--- |
| 2026-05-12 | 초기 3계층 아키텍처 설계 | jkman | ADR-001 |
| 2026-05-12 | PostgreSQL + JSONB 기반 DB 설계 | jkman | ADR-005 |
| 2026-05-12 | 모듈 분해 및 의존성 정의 | jkman | - |
| 2026-05-12 | Cloudtype PostgreSQL 16.13 연동 확인 | jkman | - |
