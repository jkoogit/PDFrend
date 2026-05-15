# 10. 간편인증 API 연동 매뉴얼 (카카오/네이버/구글)

## 1. 목적
이 문서는 카카오/네이버/구글 간편인증을 서비스에 연동하기 위한 실무 절차(설정/요청/응답/오류/운영체크)를 정리한다.

## 2. 공통 연동 원칙
1. 로그인 식별 기본키는 `provider + provider_key_val`로 사용
2. 이메일은 로그인 필수조건이 아니라 협업/공지 채널로 분리
3. 동일인 자동 병합 금지, 로그인 후 "명시적 계정 연결"로만 통합
4. 토큰/코드/시크릿은 로그 출력 금지

## 3. 사전 준비 절차 (Step-by-Step)

### Step 1. 제공사 앱/프로젝트 생성
- [ ] 카카오 Developers 앱 생성
- [ ] 네이버 Developers 애플리케이션 생성
- [ ] Google Cloud 프로젝트 + OAuth Client 생성
- 산출물: 제공사별 `client_id` / `client_secret`

### Step 2. Redirect URI 환경별 등록
- [ ] dev URI 등록 (예: `https://dev.../auth/callback/{provider}`)
- [ ] stg URI 등록
- [ ] prd URI 등록
- [ ] URI 오탈자/스킴(https) 점검
- 산출물: 제공사 콘솔 캡처/등록표

### Step 3. 동의항목/스코프 확정
- [ ] 최소 스코프 정의(로그인 필수)
- [ ] 이메일/전화번호는 선택 스코프로 분리
- [ ] Google 전화번호 필요 시 `user.phonenumbers.read` 추가 여부 결정
- 산출물: 제공사별 스코프 매핑표

### Step 4. 서버 시크릿/환경변수 구성
- [ ] `KAKAO_CLIENT_ID/SECRET`
- [ ] `NAVER_CLIENT_ID/SECRET`
- [ ] `GOOGLE_CLIENT_ID/SECRET`
- [ ] `OAUTH_REDIRECT_BASE_URL`
- [ ] 운영/스테이징/개발 환경 분리
- 산출물: 환경변수 체크리스트

### Step 5. DB 준비
- [ ] `provider_cd`, `provider_key_val` 저장 컬럼 확인
- [ ] `auth_identities(provider_cd, provider_key_val)` UNIQUE 확인
- [ ] `user_auth_links(user_id, auth_id)` UNIQUE 확인
- [ ] 메타컬럼(`reg_system`, `reg_user_id`, `reg_dtm`, `mod_system`, `mod_user_id`, `mod_dtm`) 확인
- 산출물: 스키마 점검 결과표

### Step 6. 보안 검증 로직 구현 준비
- [ ] `state` 생성/검증 로직 준비(CSRF)
- [ ] (구글) `nonce` 검증 준비
- [ ] 토큰/코드/시크릿 로그 마스킹 적용
- [ ] 콜백 파라미터 화이트리스트 검증
- 산출물: 보안 체크리스트

### Step 7. 에러코드/예외정책 정리
- [ ] `AUTH_STATE_MISMATCH`
- [ ] `AUTH_TOKEN_EXCHANGE_FAILED`
- [ ] `AUTH_PROVIDER_PROFILE_FAILED`
- [ ] `AUTH_IDENTITY_ALREADY_LINKED`
- 산출물: 공통 에러코드 매핑표

### Step 8. 테스트 계정/시나리오 준비
- [ ] 제공사별 테스트 계정 확보
- [ ] 신규가입/재로그인/연결/해제 시나리오 정의
- [ ] 이메일 미인증 상태 로그인 시나리오 정의
- [ ] 타 계정 연결 충돌 시나리오 정의
- 산출물: 인수테스트 시나리오 문서

### Step 9. 스테이징 리허설
- [ ] dev → stg 설정값 일치 검증
- [ ] provider_key 중복/충돌 확인
- [ ] 장애 시 재시도/롤백 절차 점검
- 산출물: 리허설 체크리포트

### Step 10. 운영 오픈 게이트
- [ ] 보안/로그/모니터링 점검 완료
- [ ] 운영자 메뉴얼(인증수단 조회/해제) 배포
- [ ] 비상 연락체계/장애 대응 담당자 지정
- 산출물: 오픈 승인 체크시트

## 4. 제공사별 API 연동

## 4.1 카카오 로그인
### 엔드포인트
- 인가: `https://kauth.kakao.com/oauth/authorize`
- 토큰: `https://kauth.kakao.com/oauth/token`
- 사용자정보: `https://kapi.kakao.com/v2/user/me`

### 최소 연동 절차
1. 인가 요청(`client_id`, `redirect_uri`, `response_type=code`, `state`)
2. 콜백에서 `code/state` 검증
3. 토큰 교환
4. `/v2/user/me` 호출
5. `id`(또는 앱 설정에 따른 식별자) -> `provider_key_val` 저장

### 전화번호/이메일
- `kakao_account.phone_number`는 동의/상태 의존
- 미수신을 정상 케이스로 처리

## 4.2 네이버 로그인
### 엔드포인트
- 인가: `https://nid.naver.com/oauth2.0/authorize`
- 토큰: `https://nid.naver.com/oauth2.0/token`
- 프로필: `https://openapi.naver.com/v1/nid/me`

### 최소 연동 절차
1. 인가 요청(`client_id`, `redirect_uri`, `state`)
2. 콜백 코드 검증 후 토큰 발급
3. `/v1/nid/me` 호출
4. `response.id` -> `provider_key_val` 저장

### 전화번호/이메일
- `response.mobile`, `response.email`은 동의/계정상태 의존

## 4.3 구글 로그인
### 엔드포인트
- OIDC 인가/토큰: Google Identity OAuth 2.0
- 기본 식별: ID Token(`sub`)
- 전화번호(옵션): People API `people.get`

### 최소 연동 절차
1. `openid profile email` 스코프로 로그인
2. ID Token 검증(iss/aud/exp/nonce)
3. `sub`를 `provider_key_val`로 저장
4. 전화번호 필요 시 `user.phonenumbers.read` 추가 동의 후 People API 호출

### 주의
- `sub`는 식별자, 이메일은 보조 정보

## 5. 내부 연동 매핑 규칙
| 항목 | 규칙 |
| :--- | :--- |
| provider_cd | `kakao`, `naver`, `google` |
| provider_key_val | 제공사 고유 식별자(id/sub) |
| 로그인 성공 기준 | `provider_cd + provider_key_val` 매칭 성공 |
| 이메일 처리 | 알림 채널(선택/인증 권장), 로그인 필수조건 아님 |
| 계정 연결 | 로그인 세션에서만 추가 provider 연결 허용 |

## 6. API 오류/예외 처리
1. `state` 불일치 -> 즉시 차단
2. 토큰 교환 실패 -> 재시도 1회 + 사용자 재로그인 안내
3. 사용자정보 API 실패 -> 토큰 무효화 후 재인증 유도
4. 기존 다른 회원에 이미 연결된 provider_key -> 연결 거부 + 안내

## 7. 운영 메뉴얼(운영자)
- 사용자 계정 상세에서 인증수단 목록 조회
- 인증수단 추가/삭제 이력 조회(auth_events)
- 분쟁 시 provider_key 중복 여부 점검
- 이메일은 커뮤니케이션 채널 상태(인증/미인증)만 관리

## 8. 배포 전 점검
- [ ] 각 제공사 Redirect URI 정확히 등록
- [ ] 스테이징 계정으로 로그인/재로그인/연결/삭제 테스트
- [ ] provider_key 중복 시나리오 테스트
- [ ] 이메일 미인증 상태에서도 간편로그인 가능한지 확인

## 9. 참고 문서
- Kakao Login: https://developers.kakao.com/docs/latest/en/kakaologin/rest-api
- Naver Login: https://developers.naver.com/inc/devcenter/downloads/naveridro/naverlogin_docu_ver3.pdf
- Google OIDC: https://developers.google.com/identity/openid-connect/openid-connect
- Google People API: https://developers.google.com/people/api/rest/v1/people/get

### 작성 이력
| 작업일시 | 작업 에이전트 | 내용 한 줄 요약 |
| :--- | :--- | :--- |
| 2026-05-15 00:00 UTC | Codex (GPT-5.3-Codex) | 카카오/네이버/구글 간편인증 API 연동 매뉴얼(절차/예외/운영체크) 작성 |
| 2026-05-15 00:00 UTC | Codex (GPT-5.3-Codex) | 사전 준비 절차를 10단계 체크리스트로 상세화 |
