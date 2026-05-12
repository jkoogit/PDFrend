# 06. 로컬 개발 환경 설정 - IntelliJ IDEA

## 1. 개요
본 문서는 **IntelliJ IDEA**를 사용하여 PDFrend 프로젝트를 개발하기 위한 최적의 설정 가이드를 제공합니다.

## 2. 필수 플러그인 설치
1. **Node.js**: Node.js 지원 및 디버깅
2. **TypeScript**: TypeScript 언어 지원
3. **Prettier**: 코드 포맷팅 자동화
4. **ESLint**: 코드 린팅 및 오류 감지
5. **Database Navigator** (또는 내장 Database 도구): PostgreSQL 연결 관리

## 3. 프로젝트 설정
### 3.1 Node.js 및 npm 설정
- `Settings` > `Languages & Frameworks` > `Node.js`
- **Node interpreter**: 설치된 Node.js 20+ 경로 선택
- **Package manager**: `npm` 선택

### 3.2 TypeScript 설정
- `Settings` > `Languages & Frameworks` > `TypeScript`
- **TypeScript**: `node_modules/typescript` 경로 자동 인식 확인
- **Recompile on changes**: 체크 권장

### 3.3 Prettier 설정 (자동 포맷팅)
- `Settings` > `Languages & Frameworks` > `JavaScript` > `Prettier`
- **Prettier package**: `node_modules/prettier` 선택
- **Run on save**: 체크 (파일 저장 시 자동 정렬)

## 4. 실행 및 디버깅
### 4.1 Run Configuration 설정
1. `Add Configuration` > `npm`
2. **Command**: `run`
3. **Scripts**: `dev`
4. **Environment variables**: `.env.local`의 내용을 참고하여 필요한 변수 추가

### 4.2 디버깅 모드
- `dev` 스크립트 옆의 벌레 아이콘(Debug)을 클릭하여 중단점(Breakpoint)을 활용한 디버깅이 가능합니다.

## 5. 데이터베이스 연결
- 오른쪽 `Database` 탭 > `+` > `Data Source` > `PostgreSQL`
- **Host**: `localhost`
- **User/Password**: `pdfrend_dev` / `local_dev_password`
- **Database**: `pdfrendd`
