# User 도메인 테스트 케이스

## 📋 개요

이 문서는 User 도메인의 모든 테스트 케이스를 정의합니다. 단위 테스트부터 통합 테스트, E2E 테스트까지 체계적으로 정리되어 있습니다.

---

## 🎯 테스트 범위

**테스트 대상:**
- User 엔티티 및 값 객체
- UserDomainService
- UserApplicationService
- UserRepositoryImpl
- User tRPC 라우터

**테스트 환경:**
- 단위 테스트: Mock 사용
- 통합 테스트: 테스트 데이터베이스 (pdfrendd)
- E2E 테스트: 전체 스택

---

## 🧪 단위 테스트 (Unit Tests)

### 1. User 엔티티 테스트

**파일:** `server/domains/user/entities/User.test.ts`

#### TC-U-001: 사용자 생성 - 정상 데이터

```typescript
describe('User Entity - Creation', () => {
  it('TC-U-001: should create user with valid data', () => {
    // Given: 유효한 사용자 데이터
    const userData = {
      openId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user' as const,
    };

    // When: 사용자 생성
    const user = User.create(userData);

    // Then: 사용자가 올바르게 생성됨
    expect(user.id).toBeDefined();
    expect(user.openId).toBe('user-123');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe('user');
    expect(user.storageQuota).toBe(1073741824); // 1GB
    expect(user.storageUsed).toBe(0);
    expect(user.createdAt).toBeDefined();
  });
});
```

**테스트 항목:**
- [ ] 사용자 ID 생성 확인
- [ ] 모든 필드 값 확인
- [ ] 기본값 설정 확인 (저장소 할당량 1GB)
- [ ] 타임스탬프 생성 확인

---

#### TC-U-002: 사용자 생성 - 필수 필드 누락

```typescript
describe('User Entity - Validation', () => {
  it('TC-U-002: should throw error when required fields are missing', () => {
    // Given: 필수 필드가 누락된 데이터
    const invalidData = {
      openId: 'user-123',
      // name 누락
      email: 'john@example.com',
    };

    // When/Then: 에러 발생
    expect(() => {
      User.create(invalidData as any);
    }).toThrow('User name is required');
  });
});
```

**테스트 항목:**
- [ ] name 필드 누락 시 에러
- [ ] openId 필드 누락 시 에러
- [ ] 에러 메시지 명확성 확인

---

#### TC-U-003: 파일 업로드 가능 여부 - 할당량 내

```typescript
describe('User Entity - Storage Management', () => {
  it('TC-U-003: should allow file upload when within quota', () => {
    // Given: 저장소 할당량 내의 사용자
    const user = User.create({
      openId: 'user-123',
      name: 'John Doe',
      storageQuota: 1000000, // 1MB
      storageUsed: 300000,   // 300KB
    });

    // When: 파일 업로드 가능 여부 확인 (200KB 파일)
    const canUpload = user.canUploadFile(200000);

    // Then: 업로드 가능
    expect(canUpload).toBe(true);
  });
});
```

**테스트 항목:**
- [ ] 할당량 내 파일 업로드 가능
- [ ] 정확한 계산 확인
- [ ] 경계값 테스트 (정확히 남은 용량만큼)

---

#### TC-U-004: 파일 업로드 가능 여부 - 할당량 초과

```typescript
it('TC-U-004: should prevent file upload when exceeding quota', () => {
  // Given: 저장소 할당량 초과 상황
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
    storageQuota: 1000000, // 1MB
    storageUsed: 900000,   // 900KB
  });

  // When/Then: 업로드 불가 (200KB 파일)
  expect(() => {
    user.canUploadFile(200000);
  }).toThrow('Storage quota exceeded');
});
```

**테스트 항목:**
- [ ] 할당량 초과 시 에러 발생
- [ ] 에러 메시지 명확성
- [ ] 경계값 테스트 (초과 1바이트)

---

#### TC-U-005: 저장소 사용량 업데이트

```typescript
it('TC-U-005: should update storage usage correctly', () => {
  // Given: 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
    storageUsed: 0,
  });

  // When: 저장소 사용량 업데이트
  user.updateStorageUsed(500000); // 500KB 추가

  // Then: 사용량 업데이트 확인
  expect(user.storageUsed).toBe(500000);
});
```

**테스트 항목:**
- [ ] 저장소 사용량 증가 확인
- [ ] 누적 계산 확인
- [ ] 음수 값 처리

---

#### TC-U-006: 사용자 역할 변경

```typescript
it('TC-U-006: should change user role', () => {
  // Given: 일반 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
    role: 'user',
  });

  // When: 역할 변경
  user.changeRole('admin');

  // Then: 역할 변경 확인
  expect(user.role).toBe('admin');
});
```

**테스트 항목:**
- [ ] user → admin 변경
- [ ] admin → user 변경
- [ ] 유효하지 않은 역할 거부

---

### 2. StorageInfo 값 객체 테스트

**파일:** `server/domains/user/value-objects/StorageInfo.test.ts`

#### TC-U-007: 저장소 정보 생성 - 정상

```typescript
describe('StorageInfo Value Object', () => {
  it('TC-U-007: should create StorageInfo with valid data', () => {
    // Given: 유효한 저장소 정보
    const storage = new StorageInfo(1000000, 300000);

    // Then: 값 객체 생성 확인
    expect(storage.quota).toBe(1000000);
    expect(storage.used).toBe(300000);
    expect(storage.remaining).toBe(700000);
    expect(storage.usagePercentage).toBe(30);
  });
});
```

**테스트 항목:**
- [ ] 저장소 할당량 확인
- [ ] 사용량 확인
- [ ] 남은 용량 계산 확인
- [ ] 사용률 계산 확인

---

#### TC-U-008: 저장소 정보 생성 - 사용량 초과

```typescript
it('TC-U-008: should throw error when used exceeds quota', () => {
  // When/Then: 사용량 > 할당량
  expect(() => {
    new StorageInfo(1000000, 1500000);
  }).toThrow('Used storage cannot exceed quota');
});
```

**테스트 항목:**
- [ ] 사용량 > 할당량 시 에러
- [ ] 에러 메시지 명확성

---

### 3. UserDomainService 테스트

**파일:** `server/domains/user/services/UserDomainService.test.ts`

#### TC-U-009: 사용자 생성 서비스

```typescript
describe('UserDomainService', () => {
  let service: UserDomainService;

  beforeEach(() => {
    service = new UserDomainService();
  });

  it('TC-U-009: should create user through domain service', () => {
    // Given: 사용자 생성 요청
    const input = {
      openId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    // When: 사용자 생성
    const user = service.createUser(input);

    // Then: 사용자 생성 확인
    expect(user.id).toBeDefined();
    expect(user.openId).toBe('user-123');
    expect(user.storageQuota).toBe(1073741824);
  });
});
```

**테스트 항목:**
- [ ] 사용자 생성 확인
- [ ] 기본 저장소 할당량 설정 확인
- [ ] 타임스탬프 설정 확인

---

#### TC-U-010: 저장소 할당량 검증

```typescript
it('TC-U-010: should validate storage quota before file upload', () => {
  // Given: 저장소 할당량 거의 다 찬 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
    storageQuota: 1000000,
    storageUsed: 950000,
  });

  // When/Then: 100MB 파일 업로드 불가
  expect(() => {
    service.validateFileUpload(user, 100000000);
  }).toThrow('Insufficient storage quota');
});
```

**테스트 항목:**
- [ ] 할당량 검증 로직
- [ ] 에러 메시지 명확성
- [ ] 경계값 테스트

---

---

## 🔗 통합 테스트 (Integration Tests)

### 1. UserRepositoryImpl 통합 테스트

**파일:** `server/infrastructure/repositories/UserRepositoryImpl.test.ts`

#### TC-I-001: 사용자 저장 및 조회

```typescript
describe('UserRepositoryImpl Integration', () => {
  let repository: UserRepositoryImpl;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    repository = new UserRepositoryImpl(testDb);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it('TC-I-001: should save and retrieve user by id', async () => {
    // Given: 새로운 사용자
    const user = User.create({
      openId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    });

    // When: 사용자 저장
    await repository.save(user);

    // Then: 사용자 조회 확인
    const retrieved = await repository.findById(user.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.openId).toBe('user-123');
    expect(retrieved?.name).toBe('John Doe');
  });
});
```

**테스트 항목:**
- [ ] 데이터베이스 저장 확인
- [ ] 데이터 조회 확인
- [ ] 데이터 무결성 확인

---

#### TC-I-002: OpenId로 사용자 조회

```typescript
it('TC-I-002: should find user by openId', async () => {
  // Given: 저장된 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
  });
  await repository.save(user);

  // When: OpenId로 조회
  const retrieved = await repository.findByOpenId('user-123');

  // Then: 사용자 조회 확인
  expect(retrieved).toBeDefined();
  expect(retrieved?.id).toBe(user.id);
});
```

**테스트 항목:**
- [ ] OpenId 유니크 제약 확인
- [ ] 조회 성능 확인
- [ ] 존재하지 않는 OpenId 처리

---

#### TC-I-003: 사용자 정보 업데이트

```typescript
it('TC-I-003: should update user information', async () => {
  // Given: 저장된 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
  });
  await repository.save(user);

  // When: 사용자 정보 업데이트
  user.updateName('Jane Doe');
  await repository.update(user);

  // Then: 업데이트 확인
  const updated = await repository.findById(user.id);
  expect(updated?.name).toBe('Jane Doe');
});
```

**테스트 항목:**
- [ ] 데이터 업데이트 확인
- [ ] 타임스탬프 업데이트 확인
- [ ] 다른 필드 변경 없음 확인

---

#### TC-I-004: 사용자 삭제

```typescript
it('TC-I-004: should delete user', async () => {
  // Given: 저장된 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
  });
  await repository.save(user);

  // When: 사용자 삭제
  await repository.delete(user.id);

  // Then: 삭제 확인
  const deleted = await repository.findById(user.id);
  expect(deleted).toBeNull();
});
```

**테스트 항목:**
- [ ] 데이터 삭제 확인
- [ ] 삭제 후 조회 불가 확인
- [ ] 외래키 제약 확인

---

### 2. UserApplicationService 통합 테스트

**파일:** `server/applications/UserApplicationService.test.ts`

#### TC-I-005: 사용자 등록

```typescript
describe('UserApplicationService Integration', () => {
  let service: UserApplicationService;
  let repository: UserRepositoryImpl;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    repository = new UserRepositoryImpl(testDb);
    service = new UserApplicationService(repository);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it('TC-I-005: should register new user', async () => {
    // Given: 사용자 등록 요청
    const input = {
      openId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    // When: 사용자 등록
    const result = await service.registerUser(input);

    // Then: 등록 확인
    expect(result.id).toBeDefined();
    expect(result.openId).toBe('user-123');
    expect(result.storageQuota).toBe(1073741824);

    // And: 데이터베이스에 저장됨
    const saved = await repository.findById(result.id);
    expect(saved).toBeDefined();
  });
});
```

**테스트 항목:**
- [ ] 사용자 등록 확인
- [ ] 데이터베이스 저장 확인
- [ ] DTO 변환 확인

---

#### TC-I-006: 사용자 프로필 조회

```typescript
it('TC-I-006: should get user profile', async () => {
  // Given: 등록된 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  });
  await repository.save(user);

  // When: 프로필 조회
  const profile = await service.getUserProfile(user.id);

  // Then: 프로필 조회 확인
  expect(profile.id).toBe(user.id);
  expect(profile.name).toBe('John Doe');
  expect(profile.email).toBe('john@example.com');
});
```

**테스트 항목:**
- [ ] 프로필 정보 조회 확인
- [ ] 민감한 정보 필터링 확인
- [ ] 존재하지 않는 사용자 처리

---

#### TC-I-007: 사용자 프로필 업데이트

```typescript
it('TC-I-007: should update user profile', async () => {
  // Given: 등록된 사용자
  const user = User.create({
    openId: 'user-123',
    name: 'John Doe',
  });
  await repository.save(user);

  // When: 프로필 업데이트
  const updated = await service.updateUserProfile(user.id, {
    name: 'Jane Doe',
    email: 'jane@example.com',
  });

  // Then: 업데이트 확인
  expect(updated.name).toBe('Jane Doe');
  expect(updated.email).toBe('jane@example.com');
});
```

**테스트 항목:**
- [ ] 프로필 업데이트 확인
- [ ] 부분 업데이트 처리
- [ ] 유효성 검증

---

### 3. tRPC 라우터 통합 테스트

**파일:** `server/routers/user.test.ts`

#### TC-I-008: user.me 엔드포인트

```typescript
describe('User tRPC Router Integration', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase();
    await testDb.setup();

    // Mock 인증된 사용자
    const mockUser = User.create({
      id: 1,
      openId: 'user-123',
      name: 'John Doe',
    });
    await new UserRepositoryImpl(testDb).save(mockUser);

    caller = appRouter.createCaller({
      db: testDb,
      user: { id: 1, role: 'user' },
    });
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it('TC-I-008: should get current user info', async () => {
    // When: user.me 호출
    const result = await caller.user.me();

    // Then: 현재 사용자 정보 반환
    expect(result.id).toBe(1);
    expect(result.openId).toBe('user-123');
    expect(result.name).toBe('John Doe');
  });
});
```

**테스트 항목:**
- [ ] 인증된 사용자 정보 반환
- [ ] 인증되지 않은 사용자 거부
- [ ] 응답 형식 확인

---

#### TC-I-009: user.profile 엔드포인트

```typescript
it('TC-I-009: should get user profile through tRPC', async () => {
  // When: user.profile 호출
  const result = await caller.user.profile();

  // Then: 사용자 프로필 반환
  expect(result.id).toBe(1);
  expect(result.name).toBe('John Doe');
  expect(result.storageUsed).toBe(0);
});
```

**테스트 항목:**
- [ ] 프로필 정보 반환
- [ ] 저장소 정보 포함
- [ ] 권한 검증

---

#### TC-I-010: user.updateProfile 엔드포인트

```typescript
it('TC-I-010: should update user profile through tRPC', async () => {
  // When: user.updateProfile 호출
  const result = await caller.user.updateProfile({
    name: 'Jane Doe',
    email: 'jane@example.com',
  });

  // Then: 업데이트된 프로필 반환
  expect(result.name).toBe('Jane Doe');
  expect(result.email).toBe('jane@example.com');
});
```

**테스트 항목:**
- [ ] 프로필 업데이트 확인
- [ ] 입력 검증
- [ ] 응답 형식 확인

---

---

## 🌐 E2E 테스트 (End-to-End Tests)

### 1. 사용자 가입 시나리오

**파일:** `e2e/user-registration.test.ts`

#### TC-E2E-001: 완전한 사용자 가입 흐름

```typescript
describe('User Registration E2E', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:3000');
  });

  it('TC-E2E-001: should complete user registration flow', async () => {
    // 1. 로그인 페이지 접근
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*login/);

    // 2. OAuth 로그인 (Mock)
    await page.click('[data-testid="oauth-login-button"]');
    // OAuth 팝업 처리...

    // 3. 프로필 설정
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.click('[data-testid="save-profile-button"]');

    // 4. 대시보드 확인
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-name"]')).toContainText('John Doe');

    // 5. 저장소 정보 확인
    const storageQuota = await page.locator('[data-testid="storage-quota"]').textContent();
    expect(storageQuota).toContain('1 GB');
  });
});
```

**테스트 항목:**
- [ ] 로그인 페이지 접근
- [ ] OAuth 로그인 완료
- [ ] 프로필 정보 입력
- [ ] 대시보드 접근
- [ ] 사용자 정보 표시
- [ ] 저장소 정보 표시

---

#### TC-E2E-002: 프로필 정보 수정

```typescript
it('TC-E2E-002: should update user profile', async () => {
  // Given: 로그인된 상태
  await page.goto('http://localhost:3000/dashboard');

  // When: 프로필 수정 페이지 접근
  await page.click('[data-testid="settings-button"]');
  await page.click('[data-testid="profile-tab"]');

  // And: 프로필 정보 수정
  await page.fill('[data-testid="name-input"]', 'Jane Doe');
  await page.fill('[data-testid="email-input"]', 'jane@example.com');
  await page.click('[data-testid="save-button"]');

  // Then: 수정 완료 메시지
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

  // And: 대시보드에서 업데이트 확인
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.locator('[data-testid="user-name"]')).toContainText('Jane Doe');
});
```

**테스트 항목:**
- [ ] 설정 페이지 접근
- [ ] 프로필 정보 수정
- [ ] 저장 확인
- [ ] UI 업데이트 확인

---

---

## 📊 테스트 실행 결과

### 테스트 실행 명령어

```bash
# 모든 User 도메인 테스트 실행
pnpm test user

# 단위 테스트만 실행
pnpm test user --grep "Unit"

# 통합 테스트만 실행
pnpm test user --grep "Integration"

# E2E 테스트 실행
pnpm test:e2e user

# 커버리지 리포트
pnpm test user --coverage
```

### 예상 테스트 결과

| 테스트 유형 | 테스트 수 | 예상 통과 | 커버리지 |
| :---: | :--- | :--- | :--- |
| **단위 테스트** | 30 | 30 | 98% |
| **통합 테스트** | 15 | 15 | 95% |
| **E2E 테스트** | 5 | 5 | 90% |
| **총합** | 50 | 50 | 95% |

---

## ✅ 테스트 체크리스트

### 개발 중
- [ ] 모든 단위 테스트 작성
- [ ] 모든 통합 테스트 작성
- [ ] 테스트 모두 통과
- [ ] 커버리지 95% 이상

### 코드 리뷰 전
- [ ] 테스트 코드 검토
- [ ] 엣지 케이스 테스트 확인
- [ ] 테스트 이름 명확성 확인
- [ ] 테스트 격리 확인

### 배포 전
- [ ] 전체 테스트 실행
- [ ] E2E 테스트 실행
- [ ] 커버리지 리포트 확인
- [ ] 성능 테스트 실행

---

**작성자:** jkman  
**작성일:** 2026-05-12  
**버전:** 1.0.0

