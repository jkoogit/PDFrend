# 06. 의사결정 관리 (Decision Management - ADR)

## 목적
프로젝트의 중요한 기술적, 설계적 의사결정 과정을 기록하고, 그 배경, 대안, 결과 및 영향 등을 명확히 문서화하여 향후 프로젝트 진행에 참고할 수 있도록 합니다.

## 의사결정 기록 (Architecture Decision Records - ADR)

| ADR ID | 제목 | 결정일 | 결정자 | 상태 |
| :--- | :--- | :--- | :--- | :--- |
| ADR-001 | 문서 관리 플랫폼 선정 | 2026-05-12 | Manus AI | Accepted |
| ADR-002 | 백엔드 기술 스택 선정 (코프링) | 2026-05-12 | Manus AI | Accepted |
| ADR-003 | 저비용 인프라 구성 방안 | 2026-05-12 | Manus AI | Accepted |

## ADR-001: 문서 관리 플랫폼 선정
*   **결정**: GitHub 기반의 Docs-as-Code 전략 (GitHub Wiki, GitHub Projects, `/docs` 폴더 활용)
*   **배경**: 성장 중심의 개발 철학에 맞춰 코드와 문서의 일치성, Git 워크플로우 학습, Manus의 활용성 등을 고려.
*   **대안**: Notion, Self-hosted Wiki (Wiki.js 등)
*   **영향**: 초기 설정 및 학습 비용 발생 가능하나, 장기적으로 문서 관리의 효율성 및 개발 문화에 긍정적 영향.

## ADR-002: 백엔드 기술 스택 선정 (코프링)
*   **결정**: 코프링 (Kotlin + Spring Boot)으로 백엔드 구현
*   **배경**: 생산성, 안정성, 성능, Spring 생태계 활용 이점. 기존 Node.js/Python 대비 JVM 기반의 안정성 확보.
*   **대안**: Node.js, Python (Flask/Django)
*   **영향**: Kotlin 및 코루틴 학습 필요. Spring Boot 최신 버전 호환성 관리 필요.

## ADR-003: 저비용 인프라 구성 방안
*   **결정**: NAS 또는 Ubuntu 서버에 Docker 컨테이너 기반으로 PostgreSQL, RabbitMQ, 백엔드 애플리케이션 배포
*   **배경**: 클라우드 비용 절감, 데이터 주권 확보. 초기 개인 프로젝트 운영에 적합.
*   **대안**: 클라우드 서비스 (AWS S3, RDS, EC2 등)
*   **영향**: 가용성, 확장성, 보안, 유지보수 측면에서 추가적인 노력 필요. 향후 클라우드 전환 고려.
