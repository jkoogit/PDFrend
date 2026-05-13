# 이슈 리포트: GitHub Actions 워크플로우 푸시 실패 (권한 부족)

## 1. 이슈 개요
- **이슈 번호**: 260513_02
- **발생 일시**: 2026-05-13
- **상태**: 해결 완료 (Resolved)
- **유형**: 보안/권한 (Security/Permission)

## 2. 문제 현상 (Problem)
- `.github/workflows/deploy-dev.yml` 파일을 생성하여 푸시 시도 시 `remote rejected` 오류 발생.
- 오류 메시지: `refusing to allow a Personal Access Token to create or update workflow ... without workflow scope`.

## 3. 원인 분석 (Root Cause)
- 사용 중인 GitHub Personal Access Token(PAT)에 `workflow` 스코프가 누락됨.
- GitHub 보안 정책상 워크플로우 파일을 수정하려면 명시적인 `workflow` 권한이 필요함.

## 4. 해결 방법 (Solution)
- GitHub 계정 설정 > Developer settings > Personal Access Tokens에서 해당 토큰의 스코프에 `workflow`를 체크하여 업데이트함.
- 권한 업데이트 후 정상적으로 푸시 완료.

## 5. 재발 방지 대책
- 향후 새로운 토큰 발급 시 CI/CD 자동화를 위해 `repo`, `workflow`, `admin:repo_hook` 권한을 기본적으로 포함하도록 가이드함.
- 권한 이슈 발생 시 즉시 토큰 스코프를 점검하는 체크리스트 활용.
