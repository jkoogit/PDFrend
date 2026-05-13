# 이슈 리포트: Cloudtype 배포 실패 (Git 서브모듈 이슈)

## 1. 이슈 개요
- **이슈 번호**: 260513_01
- **발생 일시**: 2026-05-13
- **상태**: 해결 완료 (Resolved)
- **유형**: 인프라/배포 (Infrastructure/Deployment)

## 2. 문제 현상 (Problem)
- Cloudtype 빌드 과정에서 `"/package.json" not found` 오류 발생하며 배포 실패.
- GitHub 레포지토리에서 `src/backend` 폴더가 화살표 아이콘으로 표시되며 내부 파일 접근 불가.

## 3. 원인 분석 (Root Cause)
- `src/backend` 폴더 내부에서 별도의 `git init`이 실행되어 중첩된 Git 저장소(Nested Repo) 또는 서브모듈로 인식됨.
- 상위 레포지토리는 해당 폴더의 커밋 해시만 관리하고 실제 파일 내용은 추적하지 않음.
- 이로 인해 Cloudtype 빌드 서버가 해당 폴더 내부의 `package.json` 및 소스 코드를 가져오지 못함.

## 4. 해결 방법 (Solution)
1. `src/backend/.git` 디렉토리 삭제.
2. Git 캐시에서 해당 폴더 정보 제거: `git rm -r --cached src/backend`.
3. 일반 폴더로 다시 추가: `git add src/backend`.
4. 변경 사항 커밋 및 푸시.

## 5. 재발 방지 대책
- 프로젝트 내부 폴더에서 개별적인 `git init` 실행 금지.
- 폴더 아이콘에 화살표가 생기는 경우 즉시 서브모듈 여부 확인.
- 배포 전 GitHub 웹 인터페이스를 통해 폴더 구조 및 파일 접근성 최종 확인.
