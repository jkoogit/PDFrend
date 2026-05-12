# 05. 다중 데이터베이스 관리 전략

## 목적

이 문서는 PDFrend의 **다중 데이터베이스 관리 전략**을 정의합니다. 개발(dev), 검증(stg), 운영(prd) 환경별로 독립적인 데이터베이스를 운영하며, 각 환경의 데이터 무결성과 격리를 보장합니다.

---

## 1. 다중 데이터베이스 구성

### 1.1 데이터베이스 명명 규칙

PDFrend는 다음과 같이 **3개의 독립적인 데이터베이스**를 운영합니다:

| 환경 | 데이터베이스명 | 용도 | 데이터 특성 |
| :---: | :--- | :--- | :--- |
| **Development** | `pdfrendd` | 개발자 로컬 개발 및 기능 테스트 | 테스트 데이터, 자유로운 수정 |
| **Staging** | `pdfrends` | QA 검증 및 통합 테스트 | 실제 데이터와 유사한 구조, 읽기 전용 권장 |
| **Production** | `pdfrend` | 실제 사용자 데이터 저장소 | 실제 데이터, 백업 필수, 엄격한 접근 제어 |

### 1.2 데이터베이스 연결 정보

**Cloudtype PostgreSQL 기반 구성:**

```
Host: cloudtype-postgres.example.com
Port: 5432
SSL: Required (sslmode=require)

Development (pdfrendd):
  - User: pdfrend_dev
  - Password: ${DEV_DB_PASSWORD}
  - Database: pdfrendd
  - Replica: None (로컬 개발용)

Staging (pdfrends):
  - User: pdfrend_stg
  - Password: ${STG_DB_PASSWORD}
  - Database: pdfrends
  - Replica: pdfrends_replica (읽기 전용)

Production (pdfrend):
  - User: pdfrend_prd
  - Password: ${PRD_DB_PASSWORD}
  - Database: pdfrend
  - Replica: pdfrend_replica (읽기 전용)
  - Backup: Daily (UTC 02:00)
  - Retention: 30 days
```

---

## 2. 데이터베이스 마이그레이션 전략

### 2.1 마이그레이션 흐름

PDFrend는 **단방향 승격 모델(Promotion Model)**을 따릅니다:

```
개발자 로컬 (SQLite)
    ↓
    [drizzle-kit generate] → migration SQL 생성
    ↓
Development (pdfrendd) - 테스트
    ↓
    [스키마 검증 완료]
    ↓
Staging (pdfrends) - QA 검증
    ↓
    [데이터 무결성 검증 완료]
    ↓
Production (pdfrend) - 실제 배포
```

### 2.2 마이그레이션 실행 절차

**1단계: 로컬 개발 환경에서 스키마 변경**

```bash
# 1. 로컬 SQLite에서 스키마 수정
# drizzle/schema.ts 편집

# 2. 마이그레이션 SQL 생성
pnpm drizzle-kit generate

# 3. 생성된 SQL 파일 검토
cat drizzle/migrations/0001_*.sql

# 4. 로컬 테스트
pnpm test
```

**2단계: Development 환경 마이그레이션**

```bash
# 1. 마이그레이션 SQL 실행 (webdev_execute_sql 사용)
# 예: CREATE TABLE users (...)

# 2. 스키마 검증
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

# 3. 데이터 무결성 확인
SELECT COUNT(*) FROM users;
```

**3단계: Staging 환경 마이그레이션**

```bash
# 1. Development과 동일한 마이그레이션 SQL 실행
# 2. 데이터 동기화 (선택사항)
# 3. QA 검증 시작
```

**4단계: Production 환경 마이그레이션**

```bash
# 1. 백업 생성 (자동)
# 2. 마이그레이션 SQL 실행 (점진적, 다운타임 최소화)
# 3. 롤백 계획 준비
# 4. 모니터링 강화
```

### 2.3 마이그레이션 버전 관리

Drizzle Kit을 사용하여 마이그레이션을 관리합니다:

```
drizzle/migrations/
├── 0001_initial_schema.sql
├── 0002_add_annotations_table.sql
├── 0003_add_sharing_table.sql
├── 0004_add_audit_log_table.sql
└── meta/
    └── _journal.json
```

**_journal.json 예시:**

```json
{
  "version": "5",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "5",
      "when": 1715506800000,
      "tag": "0001_initial_schema",
      "breakpoints": false
    },
    {
      "idx": 1,
      "version": "5",
      "when": 1715507200000,
      "tag": "0002_add_annotations_table",
      "breakpoints": false
    }
  ]
}
```

---

## 3. 환경별 데이터 관리

### 3.1 Development 환경 (pdfrendd)

**특성:**
- 개발자 로컬 환경에서 자유로운 스키마 변경
- 테스트 데이터 자유로운 생성/삭제
- 격리된 환경 (다른 개발자와 영향 없음)

**데이터 정책:**
- 테스트 데이터만 포함
- 실제 사용자 데이터 금지
- 매일 초기화 가능

**접근 권한:**
- 개발자: 전체 접근 (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP)
- 자동화: 마이그레이션 실행 (CREATE, ALTER)

### 3.2 Staging 환경 (pdfrends)

**특성:**
- QA 검증 환경
- 실제 데이터와 유사한 구조 (마스킹된 실제 데이터 또는 합성 데이터)
- 읽기 전용 복제본 제공

**데이터 정책:**
- 마스킹된 실제 데이터 또는 합성 데이터
- 개발자는 읽기만 가능 (SELECT)
- QA는 제한된 쓰기 권한 (INSERT, UPDATE)

**접근 권한:**
- 개발자: 읽기 전용 (SELECT)
- QA: 읽기/쓰기 (SELECT, INSERT, UPDATE)
- 자동화: 마이그레이션 실행 (CREATE, ALTER)

**데이터 동기화:**
- 주기: 주 1회 (금요일 22:00 UTC)
- 방식: Production에서 마스킹 후 복사
- 마스킹 규칙:
  - 이메일: `user+HASH@example.com`
  - 이름: `User_HASH`
  - 민감 정보: 제거 또는 더미값

### 3.3 Production 환경 (pdfrend)

**특성:**
- 실제 사용자 데이터
- 엄격한 접근 제어
- 자동 백업 및 복제

**데이터 정책:**
- 실제 사용자 데이터만 포함
- 개발자는 읽기 전용 (SELECT, 감시 목적)
- 운영팀만 쓰기 권한 (긴급 상황)

**접근 권한:**
- 개발자: 읽기 전용 (SELECT)
- 운영팀: 제한된 쓰기 (UPDATE, DELETE - 감시 로그 필수)
- 자동화: 마이그레이션 실행 (CREATE, ALTER - 검증 필수)

**백업 정책:**
- 빈도: 매일 02:00 UTC
- 보관: 30일
- 테스트: 주 1회 복구 테스트
- 암호화: AES-256

---

## 4. 데이터 동기화 및 일관성

### 4.1 환경 간 데이터 흐름

```
Production (pdfrend)
    ↓ [마스킹]
Staging (pdfrends)
    ↓ [선택적 복사]
Development (pdfrendd)
```

### 4.2 동기화 절차

**1. Production → Staging (주 1회)**

```sql
-- 1. Staging 백업
BACKUP DATABASE pdfrends TO 's3://backup/pdfrends_backup.sql';

-- 2. Production 데이터 추출 (마스킹 포함)
SELECT 
  id,
  CONCAT('user_', MD5(email)) AS email,
  CONCAT('User_', MD5(name)) AS name,
  role,
  storage_quota,
  storage_used,
  created_at,
  updated_at
FROM pdfrend.users;

-- 3. Staging에 삽입
INSERT INTO pdfrends.users (...)
SELECT ... FROM pdfrend.users;

-- 4. 무결성 검증
SELECT COUNT(*) FROM pdfrends.users;
```

**2. Staging → Development (선택사항)**

개발자가 필요시 수동으로 요청:

```bash
# 1. Staging 데이터 추출
pg_dump -h staging-db -U pdfrend_stg -d pdfrends > staging_dump.sql

# 2. Development에 로드
psql -h localhost -U pdfrend_dev -d pdfrendd < staging_dump.sql

# 3. 로컬 테스트
pnpm test
```

---

## 5. 스키마 버전 관리

### 5.1 버전 추적

각 환경의 스키마 버전을 추적합니다:

```sql
-- schema_version 테이블 (모든 환경)
CREATE TABLE schema_version (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  installed_on TIMESTAMP DEFAULT NOW(),
  execution_time INT  -- 밀리초
);

-- 예시
INSERT INTO schema_version (version, description, execution_time)
VALUES ('0001_initial_schema', 'Initial schema setup', 1250);

INSERT INTO schema_version (version, description, execution_time)
VALUES ('0002_add_annotations_table', 'Add annotations table for collaboration', 850);
```

### 5.2 스키마 검증 쿼리

```sql
-- 현재 스키마 버전 확인
SELECT version, installed_on 
FROM schema_version 
ORDER BY installed_on DESC 
LIMIT 1;

-- 마이그레이션 이력 확인
SELECT version, description, installed_on, execution_time
FROM schema_version
ORDER BY installed_on;

-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 컬럼 목록 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'documents'
ORDER BY ordinal_position;
```

---

## 6. 롤백 전략

### 6.1 롤백 시나리오

**시나리오 1: Development 환경 롤백**

```bash
# 1. 로컬 SQLite 롤백 (git 사용)
git checkout HEAD~1 drizzle/schema.ts

# 2. 마이그레이션 SQL 재생성
pnpm drizzle-kit generate

# 3. 테스트
pnpm test
```

**시나리오 2: Staging 환경 롤백**

```sql
-- 1. 백업에서 복구
RESTORE DATABASE pdfrends FROM 's3://backup/pdfrends_backup_before_migration.sql';

-- 2. 데이터 무결성 검증
SELECT COUNT(*) FROM pdfrends.users;
```

**시나리오 3: Production 환경 롤백 (긴급)**

```sql
-- 1. 자동 백업에서 복구 (Cloudtype 제공)
-- Cloudtype 대시보드에서 "Restore from Backup" 선택

-- 2. 데이터 무결성 검증
SELECT COUNT(*) FROM pdfrend.users;

-- 3. 모니터링 강화
-- 감시 로그 확인
SELECT * FROM audit_log 
WHERE action_type = 'ROLLBACK' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 7. 마이그레이션 체크리스트

### 7.1 마이그레이션 전 확인사항

- [ ] 스키마 변경사항 검토 (코드 리뷰)
- [ ] 마이그레이션 SQL 테스트 (Development)
- [ ] 롤백 계획 수립
- [ ] 백업 생성 (Staging, Production)
- [ ] 모니터링 준비 (로그, 메트릭)
- [ ] 팀 공지 (예정된 다운타임)

### 7.2 마이그레이션 후 확인사항

- [ ] 스키마 버전 확인
- [ ] 데이터 무결성 검증 (행 수, 제약조건)
- [ ] 애플리케이션 정상 작동 확인
- [ ] 감시 로그 검토
- [ ] 성능 메트릭 모니터링
- [ ] 사용자 피드백 수집

---

## 8. 데이터베이스 성능 최적화

### 8.1 인덱싱 전략

```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_annotations_document_id ON annotations(document_id);
CREATE INDEX idx_annotations_page ON annotations((data->>'page'));
CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_shares_document_id ON shares(document_id);

-- 복합 인덱스 (자주 함께 조회되는 컬럼)
CREATE INDEX idx_annotations_document_page 
ON annotations(document_id, (data->>'page'));

CREATE INDEX idx_versions_document_number 
ON versions(document_id, version_number DESC);
```

### 8.2 쿼리 최적화

```sql
-- 나쁜 예: N+1 쿼리 문제
SELECT * FROM documents WHERE owner_id = 1;
-- 각 문서마다 버전 조회
SELECT * FROM versions WHERE document_id = ?;

-- 좋은 예: JOIN 사용
SELECT d.*, v.*
FROM documents d
LEFT JOIN versions v ON d.id = v.document_id
WHERE d.owner_id = 1
ORDER BY d.created_at DESC;
```

### 8.3 연결 풀 설정

```typescript
// Drizzle ORM 연결 풀 설정
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 20,  // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);
```

---

## 9. 모니터링 및 알림

### 9.1 모니터링 메트릭

| 메트릭 | 임계값 | 알림 |
| :---: | :--- | :--- |
| **디스크 사용률** | > 80% | 즉시 |
| **연결 수** | > 15/20 | 경고 |
| **쿼리 응답시간** | > 1초 | 경고 |
| **백업 실패** | 매일 | 즉시 |
| **복제 지연** | > 10초 | 경고 |

### 9.2 모니터링 쿼리

```sql
-- 현재 연결 수
SELECT count(*) FROM pg_stat_activity;

-- 느린 쿼리 (1초 이상)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 테이블 크기
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 10. 설계 변경 이력

| 날짜 | 변경 내용 | 변경자 | ADR |
| :--- | :--- | :--- | :--- |
| 2026-05-12 | 다중 데이터베이스 관리 전략 수립 | jkman | ADR-008 |
| 2026-05-12 | 마이그레이션 흐름 및 절차 정의 | jkman | - |
| 2026-05-12 | 환경별 데이터 정책 정의 | jkman | - |
| 2026-05-12 | 롤백 및 복구 전략 수립 | jkman | - |

---
