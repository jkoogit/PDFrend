# 01. 정책 관리 (Policy Management)

## 목적
서비스 운영 원칙 및 기술 표준을 정의하고, 모든 관련 문서에서 참조할 수 있도록 관리합니다.

## 정책 목록

| Policy ID | 정책명 | 설명 | 관련 문서 |
| :--- | :--- | :--- | :--- |
| Policy-STG-001 | 기본 사용자 할당 용량 | 신규 가입 사용자에게 기본 용량을 할당합니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md) |
| Policy-STG-002 | 사용자별 용량 설정 및 제한 | 관리자가 사용자별 용량을 설정하고, 초과 시 업로드를 제한합니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md), [화면정의서](/home/ubuntu/PDFrend_UI_Definition_v2.md), [프로세스 정의서](/home/ubuntu/PDFrend_Process_Definition_v2.md) |
| Policy-STG-003 | 공유 문서 용량 계산 정책 | 공유받은 문서는 사용자 용량 계산에 포함하지 않습니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md), [화면정의서](/home/ubuntu/PDFrend_UI_Definition_v2.md) |
| Policy-VER-001 | 버전 관리 모델 | Git 방식의 브랜치/머지 모델을 도입합니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md), [프로세스 정의서](/home/ubuntu/PDFrend_Process_Definition_v2.md) |
| Policy-VER-002 | 자동 저장 및 체크포인트 | 실시간 저장 및 명시적 버전 생성 정책을 따릅니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md), [프로세스 정의서](/home/ubuntu/PDFrend_Process_Definition_v2.md) |
| Policy-VER-003 | 동시 작업자 처리 (버전 생성 시) | 버전 생성 시 타 작업자에게 알림 후 자동 업데이트합니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md), [프로세스 정의서](/home/ubuntu/PDFrend_Process_Definition_v2.md) |
| Policy-OFF-001 | 오프라인 동기화 충돌 해결 | Last Write Wins와 Conflict UI를 통해 충돌을 해결합니다. | [프로세스 정의서](/home/ubuntu/PDFrend_Process_Definition_v2.md) |
| Policy-OFF-002 | 문서 메타정보 활용 | 파일 해시 대신 문서 내 메타정보로 동일성, 최신성을 판단합니다. | [프로세스 정의서](/home/ubuntu/PDFrend_Process_Definition_v2.md) |
| Policy-DB-001 | 주석 및 목차 데이터 저장 | PostgreSQL JSONB 타입을 활용하여 주석/목차를 저장합니다. | [기획서](/home/ubuntu/PDFrend_PRD_v2.md) |

## 정책 변경 이력

| 날짜 | 변경 내용 | 변경자 |
| :--- | :--- | :--- |
| 2026-05-12 | 초기 정책 수립 | Manus AI |
