# 카카오, 네이버, 구글 OAuth 설정 가이드

**작성일:** 2026-05-12  
**버전:** 1.0  
**상태:** 설정 가이드

---

## 📌 개요

이 문서는 카카오, 네이버, 구글 OAuth 2.0 인증을 설정하는 단계별 가이드입니다. 모든 서비스는 **무료**이며, 개발자 등록만으로 시작할 수 있습니다.

---

## 🎯 카카오 OAuth 설정

### 1단계: 카카오 개발자 등록

1. [카카오 개발자 센터](https://developers.kakao.com/) 방문
2. **로그인** (카카오 계정 필요)
3. **내 애플리케이션** → **애플리케이션 추가하기**
4. 앱 이름 입력 (예: "PDFrend")
5. **생성** 클릭

### 2단계: 앱 정보 확인

1. 생성된 앱 클릭
2. **앱 설정** → **일반** 탭
3. **REST API 키** 복사 (이것이 `KAKAO_CLIENT_ID`)
4. **보안** 탭 → **Client Secret** 확인 (이것이 `KAKAO_CLIENT_SECRET`)

### 3단계: OAuth 리다이렉트 URI 설정

1. **제품 설정** → **카카오 로그인** 클릭
2. **활성화 설정**에서 **ON** 으로 변경
3. **Redirect URI** 추가
   - 개발: `http://localhost:3000/api/auth/kakao/callback`
   - 운영: `https://yourdomain.com/api/auth/kakao/callback`
4. **저장** 클릭

### 4단계: 환경 변수 설정

```bash
KAKAO_CLIENT_ID=your-rest-api-key
KAKAO_CLIENT_SECRET=your-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback
```

### 5단계: 테스트 사용자 추가 (선택)

1. **앱 설정** → **일반** → **테스트 사용자 관리**
2. 테스트 사용자 추가 (개발 중 사용)

---

## 🎯 네이버 OAuth 설정

### 1단계: 네이버 개발자 등록

1. [네이버 개발자 센터](https://developers.naver.com/) 방문
2. **로그인** (네이버 계정 필요)
3. **애플리케이션** → **애플리케이션 등록**
4. 앱 이름 입력 (예: "PDFrend")
5. **사용 API**: 네이버 로그인 선택
6. **등록** 클릭

### 2단계: 앱 정보 확인

1. 등록된 앱 클릭
2. **기본 정보** 탭
3. **Client ID** 복사 (이것이 `NAVER_CLIENT_ID`)
4. **Client Secret** 복사 (이것이 `NAVER_CLIENT_SECRET`)

### 3단계: 리다이렉트 URI 설정

1. **API 설정** 탭
2. **네이버 로그인** → **Redirect URI 설정**
3. URI 추가
   - 개발: `http://localhost:3000/api/auth/naver/callback`
   - 운영: `https://yourdomain.com/api/auth/naver/callback`
4. **저장** 클릭

### 4단계: 환경 변수 설정

```bash
NAVER_CLIENT_ID=your-client-id
NAVER_CLIENT_SECRET=your-client-secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback
```

### 5단계: 테스트 (선택)

네이버는 별도 테스트 계정 설정이 필요 없으며, 네이버 계정으로 직접 테스트 가능합니다.

---

## 🎯 구글 OAuth 설정

### 1단계: Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 방문
2. **로그인** (Google 계정 필요)
3. **프로젝트 선택** → **새 프로젝트**
4. 프로젝트 이름 입력 (예: "PDFrend")
5. **만들기** 클릭

### 2단계: OAuth 동의 화면 설정

1. **API 및 서비스** → **OAuth 동의 화면**
2. **User Type** 선택: **외부** (테스트 용도)
3. **만들기** 클릭
4. 필수 정보 입력:
   - **앱 이름**: PDFrend
   - **사용자 지원 이메일**: your-email@gmail.com
   - **개발자 연락처 정보**: your-email@gmail.com
5. **저장 및 계속** 클릭

### 3단계: 테스트 사용자 추가 (선택)

1. **테스트 사용자** 탭
2. **사용자 추가**
3. 테스트할 Google 계정 이메일 입력
4. **저장** 클릭

### 4단계: OAuth 2.0 클라이언트 ID 생성

1. **API 및 서비스** → **사용자 인증 정보**
2. **사용자 인증 정보 만들기** → **OAuth 2.0 클라이언트 ID**
3. **애플리케이션 유형**: 웹 애플리케이션
4. **이름**: PDFrend OAuth Client
5. **승인된 리다이렉트 URI** 추가:
   - 개발: `http://localhost:3000/api/auth/google/callback`
   - 운영: `https://yourdomain.com/api/auth/google/callback`
6. **만들기** 클릭

### 5단계: 클라이언트 정보 확인

1. 생성된 클라이언트 ID 클릭
2. **클라이언트 ID** 복사 (이것이 `GOOGLE_CLIENT_ID`)
3. **클라이언트 보안 비밀** 복사 (이것이 `GOOGLE_CLIENT_SECRET`)

### 6단계: 환경 변수 설정

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 7단계: Google+ API 활성화 (선택)

1. **API 및 서비스** → **라이브러리**
2. "Google+ API" 검색
3. **활성화** 클릭

---

## 🔐 보안 체크리스트

| 항목 | 확인 | 주의사항 |
| :---: | :--- | :--- |
| **Client Secret** | ✅ | 절대 공개하지 말 것 (환경 변수로만 관리) |
| **Redirect URI** | ✅ | 정확하게 설정 (프로토콜, 도메인, 경로 모두 일치) |
| **HTTPS** | ✅ | 운영 환경에서는 반드시 HTTPS 사용 |
| **테스트 계정** | ✅ | 개발 중에만 사용, 운영 전 제거 |
| **권한 범위** | ✅ | 필요한 최소 권한만 요청 |

---

## 📝 환경 변수 정리

### .env.local (개발 환경)

```bash
# 카카오
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

# 네이버
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback

# 구글
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# 세션
SESSION_SECRET=your-session-secret-key
JWT_SECRET=your-jwt-secret-key

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/pdfrendd
```

### .env.production (운영 환경)

```bash
# 카카오
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=https://yourdomain.com/api/auth/kakao/callback

# 네이버
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_CALLBACK_URL=https://yourdomain.com/api/auth/naver/callback

# 구글
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# 세션
SESSION_SECRET=your-strong-session-secret-key
JWT_SECRET=your-strong-jwt-secret-key

# 데이터베이스
DATABASE_URL=postgresql://user:password@prod-db:5432/pdfrend
```

---

## 🧪 테스트 방법

### 로컬 테스트

```bash
# 1. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 위의 값들 입력

# 2. 의존성 설치
pnpm install

# 3. 서버 시작
pnpm dev

# 4. 브라우저에서 테스트
# http://localhost:3000/login
```

### 각 OAuth 제공자별 테스트

| 제공자 | 테스트 계정 | 테스트 방법 |
| :---: | :--- | :--- |
| **카카오** | 테스트 사용자 계정 | 개발자 센터에서 추가한 계정으로 로그인 |
| **네이버** | 네이버 계정 | 실제 네이버 계정으로 로그인 |
| **구글** | Google 계정 | 테스트 사용자로 추가한 계정으로 로그인 |

---

## 🚨 문제 해결

### "Redirect URI mismatch" 오류

**원인:** 설정한 Redirect URI와 실제 콜백 URL이 일치하지 않음

**해결:**
1. 개발자 센터에서 설정한 URI 확인
2. 코드의 콜백 URL과 정확히 일치하는지 확인 (프로토콜, 도메인, 경로)
3. 특수 문자나 공백이 없는지 확인

### "Invalid client_id" 오류

**원인:** Client ID가 잘못되었거나 환경 변수가 설정되지 않음

**해결:**
1. 환경 변수 파일 확인
2. Client ID 복사 시 공백이나 특수 문자 확인
3. 서버 재시작

### "Permission denied" 오류

**원인:** 테스트 사용자가 아니거나 권한 설정이 잘못됨

**해결:**
1. 테스트 사용자로 추가되었는지 확인
2. OAuth 동의 화면 설정 확인
3. 권한 범위 확인

---

## 📚 참고 자료

| 서비스 | 문서 링크 |
| :---: | :--- |
| **카카오** | https://developers.kakao.com/docs/latest/ko/kakaologin/common |
| **네이버** | https://developers.naver.com/docs/login/overview |
| **구글** | https://developers.google.com/identity/protocols/oauth2 |

---

**작성자:** jkman  
**상태:** 설정 가이드 완료

