# 이슈 #2: DB 스키마 설계 및 Drizzle ORM 설정 (PostgreSQL 전환)

## 1. 문제 상황 및 목표
- Cloudtype의 PostgreSQL 환경에 맞춰 데이터베이스 연동을 위한 ORM 도입.
- 사용자(User) 및 문서(Document) 관리를 위한 초기 스키마 설계.
- 중복된 프로젝트 폴더 구조 정리 및 최적화.

## 2. 작업 내용
- **패키지 전환**: `mysql2` 제거 후 `pg` (node-postgres) 및 `@types/pg` 설치.
- **스키마 정의 (PostgreSQL)**:
    - `users`: id(serial), email(varchar), name(varchar), createdAt, updatedAt
    - `documents`: id(serial), userId(integer, FK), title, content, fileUrl, status, createdAt, updatedAt
- **설정 파일 수정**: `drizzle.config.ts`의 dialect를 `postgresql`로 변경.
- **모노레포 구조 전환**: 향후 프론트엔드 확장 및 서비스 독립성을 고려하여 pnpm 워크스페이스 기반의 모노레포 구조로 전환. 백엔드 소스는 `apps/backend`로 이동.
- **파일명 규칙 적용**: 식별 용이성을 위해 진입점 파일에 `index_` 접두어 적용 (`index_svr.ts`, `index_db.ts`, `index_sch.ts`).

## 3. 의사결정
- **DB 선택**: PostgreSQL (Cloudtype 프리티어 서비스 활용).
- **구조 최적화**: 확장성을 고려하여 pnpm 워크스페이스 기반의 모노레포 구조를 채택하고, 백엔드와 프론트엔드를 `apps/` 하위에서 독립적으로 관리하도록 설계.

## 4. 향후 계획
- `DATABASE_URL` 환경 변수를 통한 실제 DB 연결 테스트.
- tRPC 라우터에서 DB 스키마를 활용한 CRUD 기능 구현.
