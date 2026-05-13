# 02. CORS 심화 및 MSA 대응 가이드

## 개요
본 문서는 서비스 확장 및 MSA(Microservices Architecture) 환경을 대비하여, 다양한 도메인과 서브시스템 간의 안전한 통신을 위한 CORS(Cross-Origin Resource Sharing) 설정 전략을 다룹니다.

## 1. CORS의 핵심 원리
CORS는 브라우저가 보안을 위해 '다른 출처(Origin)'의 리소스 접근을 제한하는 정책입니다. 여기서 출처(Origin)는 **프로토콜(http/https), 도메인(pdfrend.com), 포트(4000)**의 조합을 의미하며, 이 중 하나라도 다르면 다른 출처로 인식됩니다.

## 2. 서비스 확장을 위한 CORS 전략

### 2.1 특정 도메인 허용 (Allowlist)
운영 환경에서는 보안을 위해 모든 도메인(`*`)을 허용하지 않고, 신뢰할 수 있는 도메인 목록만 허용해야 합니다.

```typescript
const allowedOrigins = [
  'https://pdfrend.com',          // 메인 서비스
  'https://admin.pdfrend.com',    // 관리자 서비스
  'http://localhost:3000'         // 로컬 개발 환경
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
```

### 2.2 서브도메인 동적 허용 (Regex)
MSA 환경에서 서브도메인이 유동적으로 늘어날 경우, 정규표현식을 사용하여 효율적으로 관리할 수 있습니다.

```typescript
// pdfrend.com으로 끝나는 모든 서브도메인 허용
const corsOptions = {
  origin: /.*\.pdfrend\.com$/
};
```

## 3. MSA 환경에서의 통신 구분

### 3.1 브라우저 to 서버 (CORS 필요)
사용자의 브라우저에서 여러 마이크로서비스(Auth, Storage, API 등)를 직접 호출할 때는 각 서비스마다 적절한 CORS 설정이 필요합니다.

### 3.2 서버 to 서버 (CORS 불필요)
마이크로서비스 간의 내부 통신(예: API 서버가 Auth 서버에 토큰 검증 요청)은 브라우저를 거치지 않으므로 CORS 정책의 영향을 받지 않습니다. 이때는 API Key나 내부 네트워크 보안(VPC 등)을 통해 보안을 강화합니다.

## 4. 학습 포인트
- **보안 최소 권한 원칙**: 꼭 필요한 도메인만 허용하는 것이 보안의 기본입니다.
- **Preflight 요청**: 브라우저는 실제 요청 전 `OPTIONS` 메서드를 통해 서버가 CORS를 허용하는지 먼저 확인합니다. 서버는 이에 대해 적절한 응답을 주어야 합니다.
