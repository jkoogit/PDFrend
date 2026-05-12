# 04. 도메인 주도 설계(DDD) 기반 모듈 아키텍처

## 목적

이 문서는 PDFrend 백엔드의 **도메인 주도 설계(Domain-Driven Design, DDD)** 기반 아키텍처를 정의합니다. 각 도메인은 **독립적인 비즈니스 경계**를 가지며, 향후 마이크로서비스 아키텍처(MSA)로 전환할 때 자연스럽게 분리될 수 있도록 설계됩니다.

---

## 1. DDD 핵심 개념

### 1.1 도메인 분해 원칙

PDFrend의 비즈니스 도메인은 다음과 같이 분해됩니다:

| 도메인 | 설명 | 책임 | 상태 |
| :---: | :--- | :--- | :---: |
| **User Domain** | 사용자 관리 및 인증 | 사용자 등록, 프로필, 권한 관리 | Phase 1 |
| **Document Domain** | 문서 생명주기 관리 | 문서 CRUD, 메타데이터, 상태 관리 | Phase 1 |
| **Version Domain** | 버전 관리 및 이력 | 버전 생성, 복원, 변경 추적 | Phase 1 |
| **Annotation Domain** | 주석 및 협업 | 주석 CRUD, 스레드, 해결 상태 | Phase 2 |
| **Sharing Domain** | 공유 및 권한 | 공유 설정, 권한 관리, 만료 | Phase 1 |
| **Sync Domain** | 실시간 동기화 | 충돌 해결, 오프라인 동기화 | Phase 3 |
| **Storage Domain** | 파일 저장소 | S3/NAS 추상화, 파일 처리 | Phase 1 |
| **Audit Domain** | 감시 및 로깅 | 작업 로그, 감시 추적 | Phase 2 |

### 1.2 DDD 계층 구조

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│          (React Client + tRPC Client)                    │
└──────────────────┬──────────────────────────────────────┘
                   │ tRPC (Type-safe RPC)
┌──────────────────▼──────────────────────────────────────┐
│              Application Layer                           │
│  (Use Cases, Orchestration, tRPC Routers)               │
│  - User Application Service                             │
│  - Document Application Service                         │
│  - Version Application Service                          │
│  - Annotation Application Service                       │
│  - Sharing Application Service                          │
│  - Sync Application Service                             │
│  - Storage Application Service                          │
│  - Audit Application Service                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Domain Layer (비즈니스 로직)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ User Domain                                     │   │
│  │ - User Entity, Value Objects                   │   │
│  │ - User Repository, User Service                │   │
│  │ - User Business Rules                          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Document Domain                                 │   │
│  │ - Document Entity, Document Aggregate Root     │   │
│  │ - Document Repository, Document Service        │   │
│  │ - Document Business Rules                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Version Domain                                  │   │
│  │ - Version Entity, Snapshot Value Object        │   │
│  │ - Version Repository, Version Service          │   │
│  │ - Version Business Rules                       │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Other Domains...]                             │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL (Drizzle ORM)
┌──────────────────▼──────────────────────────────────────┐
│              Infrastructure Layer                       │
│  - Database (PostgreSQL)                               │
│  - ORM (Drizzle)                                        │
│  - External Services (S3, OAuth, etc.)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 각 도메인의 상세 설계

### 2.1 User Domain (사용자 도메인)

**비즈니스 경계:**
- 사용자 생명주기 관리 (가입, 프로필, 삭제)
- 인증 및 권한 관리
- 저장소 할당량 관리

**핵심 개념:**

```typescript
// Entity: User (집합의 루트)
class User {
  id: number;
  openId: string;  // Manus OAuth ID
  name: string;
  email: string;
  role: 'admin' | 'user';
  storageQuota: bigint;  // 할당된 저장소 (바이트)
  storageUsed: bigint;   // 사용된 저장소 (바이트)
  createdAt: Date;
  updatedAt: Date;

  // 비즈니스 메서드
  canUploadFile(fileSize: bigint): boolean {
    return this.storageUsed + fileSize <= this.storageQuota;
  }

  getRemainingQuota(): bigint {
    return this.storageQuota - this.storageUsed;
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }
}

// Value Object: StorageQuota
class StorageQuota {
  total: bigint;
  used: bigint;

  getPercentage(): number {
    return (Number(this.used) / Number(this.total)) * 100;
  }

  isExceeded(): boolean {
    return this.used > this.total;
  }
}
```

**저장소 계약:**

```typescript
interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByOpenId(openId: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: number): Promise<void>;
  updateStorageUsed(userId: number, delta: bigint): Promise<void>;
}
```

**도메인 서비스:**

```typescript
class UserDomainService {
  async registerUser(openId: string, name: string, email: string): Promise<User>;
  async updateStorageQuota(userId: number, newQuota: bigint): Promise<void>;
  async validateStorageCapacity(userId: number, requiredSpace: bigint): Promise<boolean>;
}
```

---

### 2.2 Document Domain (문서 도메인)

**비즈니스 경계:**
- 문서 생명주기 (생성, 업로드, 아카이브, 삭제)
- 문서 메타데이터 관리
- 문서 상태 전이

**핵심 개념:**

```typescript
// Value Object: DocumentMetadata
class DocumentMetadata {
  title: string;
  fileName: string;
  fileHash: string;  // SHA-256
  fileSize: bigint;
  mimeType: string;
  uploadedAt: Date;
  lastModifiedAt: Date;
}

// Entity: Document (집합의 루트)
class Document {
  id: UUID;
  ownerId: number;
  metadata: DocumentMetadata;
  currentVersionId: UUID;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;

  // 비즈니스 메서드
  canBeModifiedBy(userId: number): boolean {
    return this.ownerId === userId;
  }

  archive(): void {
    if (this.status !== 'active') {
      throw new Error('Only active documents can be archived');
    }
    this.status = 'archived';
  }

  restore(): void {
    if (this.status !== 'archived') {
      throw new Error('Only archived documents can be restored');
    }
    this.status = 'active';
  }

  getFileSize(): bigint {
    return this.metadata.fileSize;
  }
}

// Aggregate Root Pattern
class DocumentAggregate {
  document: Document;
  versions: Version[];
  shares: Share[];

  getCurrentVersion(): Version {
    return this.versions.find(v => v.id === this.document.currentVersionId)!;
  }

  getSharedUsers(): number[] {
    return this.shares.map(s => s.sharedWith).filter(Boolean);
  }
}
```

**저장소 계약:**

```typescript
interface DocumentRepository {
  findById(id: UUID): Promise<Document | null>;
  findByOwnerId(ownerId: number): Promise<Document[]>;
  save(document: Document): Promise<void>;
  delete(id: UUID): Promise<void>;
  updateStatus(id: UUID, status: string): Promise<void>;
}
```

**도메인 서비스:**

```typescript
class DocumentDomainService {
  async createDocument(
    ownerId: number,
    metadata: DocumentMetadata
  ): Promise<Document>;

  async uploadNewVersion(
    documentId: UUID,
    userId: number,
    newMetadata: DocumentMetadata
  ): Promise<void>;

  async validateDocumentOwnership(
    documentId: UUID,
    userId: number
  ): Promise<boolean>;
}
```

---

### 2.3 Version Domain (버전 도메인)

**비즈니스 경계:**
- 버전 생성 및 관리
- 변경 이력 추적
- 버전 복원

**핵심 개념:**

```typescript
// Value Object: VersionSnapshot
class VersionSnapshot {
  data: Record<string, any>;  // JSONB 저장
  checksum: string;  // 무결성 검증

  getChecksum(): string {
    // SHA-256 계산
    return crypto.createHash('sha256')
      .update(JSON.stringify(this.data))
      .digest('hex');
  }
}

// Value Object: ChangeLog
class ChangeLog {
  changes: Array<{
    type: 'add' | 'modify' | 'delete';
    path: string;
    oldValue?: any;
    newValue?: any;
    timestamp: Date;
  }>;

  getSummary(): string {
    return `${this.changes.length} changes`;
  }
}

// Entity: Version (집합의 루트)
class Version {
  id: UUID;
  documentId: UUID;
  versionNumber: number;
  createdBy: number;
  snapshot: VersionSnapshot;
  changeLog: ChangeLog;
  createdAt: Date;

  // 비즈니스 메서드
  isValid(): boolean {
    return this.snapshot.checksum === this.snapshot.getChecksum();
  }

  getVersionLabel(): string {
    return `v${this.versionNumber}`;
  }
}
```

**저장소 계약:**

```typescript
interface VersionRepository {
  findById(id: UUID): Promise<Version | null>;
  findByDocumentId(documentId: UUID): Promise<Version[]>;
  save(version: Version): Promise<void>;
  getLatestVersion(documentId: UUID): Promise<Version | null>;
  getVersionByNumber(documentId: UUID, versionNumber: number): Promise<Version | null>;
}
```

**도메인 서비스:**

```typescript
class VersionDomainService {
  async createVersion(
    documentId: UUID,
    userId: number,
    snapshot: VersionSnapshot,
    changeLog: ChangeLog
  ): Promise<Version>;

  async restoreVersion(
    documentId: UUID,
    versionId: UUID,
    userId: number
  ): Promise<void>;

  async getVersionHistory(documentId: UUID): Promise<Version[]>;

  async compareVersions(versionId1: UUID, versionId2: UUID): Promise<Diff>;
}
```

---

### 2.4 Annotation Domain (주석 도메인)

**비즈니스 경계:**
- 주석 생성, 수정, 삭제
- 주석 스레드 관리
- 주석 해결 상태 추적

**핵심 개념:**

```typescript
// Value Object: AnnotationContent
class AnnotationContent {
  type: 'highlight' | 'note' | 'drawing' | 'stamp';
  text?: string;
  color?: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  page: number;
}

// Entity: Annotation (집합의 루트)
class Annotation {
  id: UUID;
  documentId: UUID;
  versionId: UUID;
  createdBy: number;
  content: AnnotationContent;
  resolved: boolean;
  replies: AnnotationReply[];
  createdAt: Date;
  updatedAt: Date;

  // 비즈니스 메서드
  canBeModifiedBy(userId: number): boolean {
    return this.createdBy === userId;
  }

  resolve(): void {
    this.resolved = true;
  }

  addReply(userId: number, text: string): AnnotationReply {
    const reply = new AnnotationReply(UUID.generate(), userId, text);
    this.replies.push(reply);
    return reply;
  }

  getThreadLength(): number {
    return this.replies.length + 1;  // 원본 + 답변
  }
}

// Value Object: AnnotationReply
class AnnotationReply {
  id: UUID;
  userId: number;
  text: string;
  createdAt: Date;

  constructor(id: UUID, userId: number, text: string) {
    this.id = id;
    this.userId = userId;
    this.text = text;
    this.createdAt = new Date();
  }
}
```

**저장소 계약:**

```typescript
interface AnnotationRepository {
  findById(id: UUID): Promise<Annotation | null>;
  findByDocumentId(documentId: UUID): Promise<Annotation[]>;
  findByPage(documentId: UUID, page: number): Promise<Annotation[]>;
  save(annotation: Annotation): Promise<void>;
  delete(id: UUID): Promise<void>;
  findUnresolved(documentId: UUID): Promise<Annotation[]>;
}
```

---

### 2.5 Sharing Domain (공유 도메인)

**비즈니스 경계:**
- 공유 설정 및 권한 관리
- 공유 토큰 생성 및 검증
- 공유 만료 관리

**핵심 개념:**

```typescript
// Value Object: SharePermission
class SharePermission {
  level: 'view' | 'comment' | 'edit';

  canView(): boolean {
    return ['view', 'comment', 'edit'].includes(this.level);
  }

  canComment(): boolean {
    return ['comment', 'edit'].includes(this.level);
  }

  canEdit(): boolean {
    return this.level === 'edit';
  }

  isHigherThan(other: SharePermission): boolean {
    const levels = ['view', 'comment', 'edit'];
    return levels.indexOf(this.level) > levels.indexOf(other.level);
  }
}

// Entity: Share (집합의 루트)
class Share {
  id: UUID;
  documentId: UUID;
  sharedWith: number | null;  // null이면 공개 링크
  permission: SharePermission;
  shareToken: string | null;  // 공개 링크용
  expiresAt: Date | null;
  createdAt: Date;

  // 비즈니스 메서드
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isPublic(): boolean {
    return this.sharedWith === null && this.shareToken !== null;
  }

  canBeAccessedBy(userId: number): boolean {
    if (this.isExpired()) return false;
    if (this.isPublic()) return true;
    return this.sharedWith === userId;
  }
}
```

**저장소 계약:**

```typescript
interface ShareRepository {
  findById(id: UUID): Promise<Share | null>;
  findByDocumentId(documentId: UUID): Promise<Share[]>;
  findByToken(token: string): Promise<Share | null>;
  save(share: Share): Promise<void>;
  delete(id: UUID): Promise<void>;
  findExpiredShares(): Promise<Share[]>;
}
```

**도메인 서비스:**

```typescript
class SharingDomainService {
  async shareDocument(
    documentId: UUID,
    sharedWith: number,
    permission: SharePermission
  ): Promise<Share>;

  async createPublicLink(
    documentId: UUID,
    permission: SharePermission,
    expiresIn?: number
  ): Promise<Share>;

  async validateAccess(
    documentId: UUID,
    userId: number
  ): Promise<boolean>;

  async revokeShare(shareId: UUID): Promise<void>;

  async cleanupExpiredShares(): Promise<void>;
}
```

---

### 2.6 Sync Domain (동기화 도메인)

**비즈니스 경계:**
- 실시간 동기화 (WebSocket)
- 오프라인 동기화
- 충돌 해결

**핵심 개념:**

```typescript
// Value Object: SyncOperation
class SyncOperation {
  id: UUID;
  type: 'insert' | 'update' | 'delete';
  path: string;
  value?: any;
  timestamp: number;  // 클라이언트 타임스탬프
  clientId: string;   // 클라이언트 식별자

  getOperationHash(): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(this))
      .digest('hex');
  }
}

// Value Object: ConflictResolution
class ConflictResolution {
  strategy: 'last-write-wins' | 'client-wins' | 'server-wins' | 'merge';
  resolvedAt: Date;
  resolvedBy: 'system' | 'user';
  userDecision?: any;

  isAutomatic(): boolean {
    return this.resolvedBy === 'system';
  }
}

// Entity: SyncState (집합의 루트)
class SyncState {
  documentId: UUID;
  userId: number;
  clientId: string;
  lastSyncedVersion: number;
  pendingOperations: SyncOperation[];
  conflicts: ConflictResolution[];
  lastSyncedAt: Date;

  // 비즈니스 메서드
  addOperation(operation: SyncOperation): void {
    this.pendingOperations.push(operation);
  }

  hasPendingOperations(): boolean {
    return this.pendingOperations.length > 0;
  }

  hasConflicts(): boolean {
    return this.conflicts.length > 0;
  }

  clearPendingOperations(): void {
    this.pendingOperations = [];
  }
}
```

**저장소 계약:**

```typescript
interface SyncStateRepository {
  findByDocumentAndClient(
    documentId: UUID,
    clientId: string
  ): Promise<SyncState | null>;

  save(syncState: SyncState): Promise<void>;
  getPendingOperations(documentId: UUID): Promise<SyncOperation[]>;
  recordConflict(conflict: ConflictResolution): Promise<void>;
}
```

---

### 2.7 Storage Domain (저장소 도메인)

**비즈니스 경계:**
- 파일 저장 및 검색
- 파일 처리 (PDF, 이미지)
- 저장소 추상화 (S3, NAS)

**핵심 개념:**

```typescript
// Value Object: FileReference
class FileReference {
  key: string;  // S3/NAS 경로
  url: string;  // 접근 URL
  mimeType: string;
  size: bigint;
  hash: string;  // SHA-256
  uploadedAt: Date;

  isExpired(expirationDays: number = 30): boolean {
    const expirationDate = new Date(this.uploadedAt);
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    return new Date() > expirationDate;
  }
}

// Entity: StorageObject (집합의 루트)
class StorageObject {
  id: UUID;
  documentId: UUID;
  fileReference: FileReference;
  uploadedBy: number;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;

  // 비즈니스 메서드
  canBeDeletedBy(userId: number): boolean {
    return this.uploadedBy === userId;
  }

  archive(): void {
    this.status = 'archived';
  }

  delete(): void {
    this.status = 'deleted';
  }
}
```

**저장소 계약:**

```typescript
interface StorageRepository {
  findById(id: UUID): Promise<StorageObject | null>;
  findByDocumentId(documentId: UUID): Promise<StorageObject[]>;
  save(storageObject: StorageObject): Promise<void>;
  delete(id: UUID): Promise<void>;
}

interface StorageProvider {
  upload(key: string, data: Buffer, mimeType: string): Promise<FileReference>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string, expiresIn?: number): Promise<string>;
}
```

---

### 2.8 Audit Domain (감시 도메인)

**비즈니스 경계:**
- 작업 로그 기록
- 감시 추적
- 감사 보고서 생성

**핵심 개념:**

```typescript
// Value Object: AuditAction
class AuditAction {
  type: 'create' | 'read' | 'update' | 'delete' | 'share' | 'download';
  resourceType: 'document' | 'annotation' | 'version' | 'share';
  resourceId: UUID;
  changes?: Record<string, any>;
  timestamp: Date;

  getDescription(): string {
    return `${this.type.toUpperCase()} ${this.resourceType}`;
  }
}

// Entity: AuditLog (집합의 루트)
class AuditLog {
  id: UUID;
  userId: number;
  action: AuditAction;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: Date;

  // 비즈니스 메서드
  isSuccessful(): boolean {
    return this.status === 'success';
  }

  isSuspicious(): boolean {
    // 의심스러운 활동 감지 로직
    return false;
  }
}
```

**저장소 계약:**

```typescript
interface AuditLogRepository {
  save(log: AuditLog): Promise<void>;
  findByUserId(userId: number, limit?: number): Promise<AuditLog[]>;
  findByResourceId(resourceId: UUID, limit?: number): Promise<AuditLog[]>;
  findByDateRange(from: Date, to: Date): Promise<AuditLog[]>;
  generateReport(userId: number, from: Date, to: Date): Promise<AuditReport>;
}
```

---

## 3. 도메인 간 상호작용

### 3.1 도메인 이벤트 (Domain Events)

도메인 간 느슨한 결합을 위해 **도메인 이벤트** 패턴을 사용합니다:

```typescript
// 도메인 이벤트 정의
abstract class DomainEvent {
  id: UUID;
  aggregateId: UUID;
  timestamp: Date;
  version: number;
}

class DocumentCreatedEvent extends DomainEvent {
  documentId: UUID;
  ownerId: number;
  title: string;
}

class DocumentVersionUploadedEvent extends DomainEvent {
  documentId: UUID;
  versionId: UUID;
  uploadedBy: number;
  fileSize: bigint;
}

class DocumentSharedEvent extends DomainEvent {
  documentId: UUID;
  sharedWith: number;
  permission: string;
}

// 이벤트 퍼블리셔
interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}

// 예: 문서 공유 시 감시 로그 기록
class AuditEventHandler {
  async handle(event: DocumentSharedEvent): Promise<void> {
    const auditLog = new AuditLog(
      UUID.generate(),
      event.sharedWith,
      new AuditAction('share', 'document', event.documentId),
      // ...
    );
    await this.auditLogRepository.save(auditLog);
  }
}
```

### 3.2 도메인 간 의존성 관리

```
User Domain (독립적)
  ↓
Document Domain (User 참조)
  ├─ Version Domain (Document 참조)
  ├─ Annotation Domain (Document, Version 참조)
  ├─ Sharing Domain (Document 참조)
  └─ Storage Domain (Document 참조)
  
Sync Domain (Document, Version, Annotation 참조)
Audit Domain (모든 도메인의 이벤트 구독)
```

---

## 4. 폴더 구조 (DDD 기반)

```
backend/
├── server/
│   ├── _core/                          # 프레임워크 레벨 (수정 금지)
│   │   ├── index.ts
│   │   ├── context.ts
│   │   ├── trpc.ts
│   │   ├── env.ts
│   │   ├── oauth.ts
│   │   ├── cookies.ts
│   │   ├── llm.ts
│   │   ├── voiceTranscription.ts
│   │   ├── imageGeneration.ts
│   │   ├── map.ts
│   │   └── notification.ts
│   │
│   ├── domains/                        # 도메인 레이어
│   │   ├── user/
│   │   │   ├── entities/
│   │   │   │   └── User.ts
│   │   │   ├── valueObjects/
│   │   │   │   └── StorageQuota.ts
│   │   │   ├── repositories/
│   │   │   │   └── UserRepository.ts
│   │   │   ├── services/
│   │   │   │   └── UserDomainService.ts
│   │   │   └── events/
│   │   │       └── UserRegisteredEvent.ts
│   │   │
│   │   ├── document/
│   │   │   ├── entities/
│   │   │   │   ├── Document.ts
│   │   │   │   └── DocumentAggregate.ts
│   │   │   ├── valueObjects/
│   │   │   │   └── DocumentMetadata.ts
│   │   │   ├── repositories/
│   │   │   │   └── DocumentRepository.ts
│   │   │   ├── services/
│   │   │   │   └── DocumentDomainService.ts
│   │   │   └── events/
│   │   │       ├── DocumentCreatedEvent.ts
│   │   │       └── DocumentDeletedEvent.ts
│   │   │
│   │   ├── version/
│   │   │   ├── entities/
│   │   │   │   └── Version.ts
│   │   │   ├── valueObjects/
│   │   │   │   ├── VersionSnapshot.ts
│   │   │   │   └── ChangeLog.ts
│   │   │   ├── repositories/
│   │   │   │   └── VersionRepository.ts
│   │   │   ├── services/
│   │   │   │   └── VersionDomainService.ts
│   │   │   └── events/
│   │   │       └── VersionCreatedEvent.ts
│   │   │
│   │   ├── annotation/
│   │   │   ├── entities/
│   │   │   │   ├── Annotation.ts
│   │   │   │   └── AnnotationReply.ts
│   │   │   ├── valueObjects/
│   │   │   │   └── AnnotationContent.ts
│   │   │   ├── repositories/
│   │   │   │   └── AnnotationRepository.ts
│   │   │   ├── services/
│   │   │   │   └── AnnotationDomainService.ts
│   │   │   └── events/
│   │   │       └── AnnotationCreatedEvent.ts
│   │   │
│   │   ├── sharing/
│   │   │   ├── entities/
│   │   │   │   └── Share.ts
│   │   │   ├── valueObjects/
│   │   │   │   └── SharePermission.ts
│   │   │   ├── repositories/
│   │   │   │   └── ShareRepository.ts
│   │   │   ├── services/
│   │   │   │   └── SharingDomainService.ts
│   │   │   └── events/
│   │   │       └── DocumentSharedEvent.ts
│   │   │
│   │   ├── sync/
│   │   │   ├── entities/
│   │   │   │   └── SyncState.ts
│   │   │   ├── valueObjects/
│   │   │   │   ├── SyncOperation.ts
│   │   │   │   └── ConflictResolution.ts
│   │   │   ├── repositories/
│   │   │   │   └── SyncStateRepository.ts
│   │   │   ├── services/
│   │   │   │   └── SyncDomainService.ts
│   │   │   └── events/
│   │   │       └── SyncConflictEvent.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── entities/
│   │   │   │   └── StorageObject.ts
│   │   │   ├── valueObjects/
│   │   │   │   └── FileReference.ts
│   │   │   ├── repositories/
│   │   │   │   └── StorageRepository.ts
│   │   │   ├── providers/
│   │   │   │   ├── S3StorageProvider.ts
│   │   │   │   └── NasStorageProvider.ts
│   │   │   ├── services/
│   │   │   │   └── StorageDomainService.ts
│   │   │   └── events/
│   │   │       └── FileUploadedEvent.ts
│   │   │
│   │   └── audit/
│   │       ├── entities/
│   │       │   └── AuditLog.ts
│   │       ├── valueObjects/
│   │       │   └── AuditAction.ts
│   │       ├── repositories/
│   │       │   └── AuditLogRepository.ts
│   │       ├── services/
│   │       │   └── AuditDomainService.ts
│   │       └── events/
│   │           └── AuditLogCreatedEvent.ts
│   │
│   ├── applications/                   # 애플리케이션 레이어
│   │   ├── user/
│   │   │   ├── UserApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── RegisterUserRequest.ts
│   │   │   │   └── UserResponse.ts
│   │   │   └── useCases/
│   │   │       ├── RegisterUserUseCase.ts
│   │   │       └── GetUserProfileUseCase.ts
│   │   │
│   │   ├── document/
│   │   │   ├── DocumentApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── CreateDocumentRequest.ts
│   │   │   │   └── DocumentResponse.ts
│   │   │   └── useCases/
│   │   │       ├── CreateDocumentUseCase.ts
│   │   │       └── UploadDocumentUseCase.ts
│   │   │
│   │   ├── version/
│   │   │   ├── VersionApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── CreateVersionRequest.ts
│   │   │   │   └── VersionResponse.ts
│   │   │   └── useCases/
│   │   │       ├── CreateVersionUseCase.ts
│   │   │       └── RestoreVersionUseCase.ts
│   │   │
│   │   ├── annotation/
│   │   │   ├── AnnotationApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── CreateAnnotationRequest.ts
│   │   │   │   └── AnnotationResponse.ts
│   │   │   └── useCases/
│   │   │       ├── CreateAnnotationUseCase.ts
│   │   │       └── ResolveAnnotationUseCase.ts
│   │   │
│   │   ├── sharing/
│   │   │   ├── SharingApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── ShareDocumentRequest.ts
│   │   │   │   └── ShareResponse.ts
│   │   │   └── useCases/
│   │   │       ├── ShareDocumentUseCase.ts
│   │   │       └── CreatePublicLinkUseCase.ts
│   │   │
│   │   ├── sync/
│   │   │   ├── SyncApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── SyncRequest.ts
│   │   │   │   └── SyncResponse.ts
│   │   │   └── useCases/
│   │   │       ├── SyncChangesUseCase.ts
│   │   │       └── ResolveConflictUseCase.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── StorageApplicationService.ts
│   │   │   ├── dtos/
│   │   │   │   ├── UploadFileRequest.ts
│   │   │   │   └── FileResponse.ts
│   │   │   └── useCases/
│   │   │       ├── UploadFileUseCase.ts
│   │   │       └── DownloadFileUseCase.ts
│   │   │
│   │   └── audit/
│   │       ├── AuditApplicationService.ts
│   │       ├── dtos/
│   │       │   ├── AuditLogResponse.ts
│   │       │   └── AuditReportRequest.ts
│   │       └── useCases/
│   │           └── GenerateAuditReportUseCase.ts
│   │
│   ├── infrastructure/                 # 인프라 레이어
│   │   ├── persistence/
│   │   │   ├── UserRepositoryImpl.ts
│   │   │   ├── DocumentRepositoryImpl.ts
│   │   │   ├── VersionRepositoryImpl.ts
│   │   │   ├── AnnotationRepositoryImpl.ts
│   │   │   ├── ShareRepositoryImpl.ts
│   │   │   ├── SyncStateRepositoryImpl.ts
│   │   │   ├── StorageRepositoryImpl.ts
│   │   │   └── AuditLogRepositoryImpl.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── S3StorageProviderImpl.ts
│   │   │   └── NasStorageProviderImpl.ts
│   │   │
│   │   ├── events/
│   │   │   ├── DomainEventPublisherImpl.ts
│   │   │   └── EventHandlers.ts
│   │   │
│   │   └── external/
│   │       ├── OAuthProvider.ts
│   │       └── EmailService.ts
│   │
│   ├── routers.ts                      # tRPC 라우터 (API 엔드포인트)
│   ├── db.ts                           # Drizzle ORM 쿼리 헬퍼
│   └── *.test.ts                       # 유닛 테스트
│
├── drizzle/
│   ├── schema.ts
│   └── migrations/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── App.tsx
│   └── public/
│
├── shared/
│   └── const.ts
│
└── package.json
```

---

## 5. 설계 원칙 및 의도

### 5.1 도메인 경계 명확화

각 도메인은 **명확한 비즈니스 경계**를 가지며, 다음 원칙을 따릅니다:

1. **단일 책임**: 각 도메인은 하나의 비즈니스 개념만 담당
2. **응집도**: 도메인 내 엔티티, 값 객체, 저장소가 강하게 응집
3. **느슨한 결합**: 도메인 간 의존성은 도메인 이벤트를 통해 관리
4. **독립성**: 각 도메인은 독립적으로 테스트 및 배포 가능

### 5.2 계층별 책임

| 계층 | 책임 | 예시 |
| :---: | :--- | :--- |
| **Domain** | 비즈니스 규칙 | "문서는 소유자만 수정 가능" |
| **Application** | 유스케이스 조율 | "문서 업로드 → 버전 생성 → 감시 로그" |
| **Infrastructure** | 기술 구현 | "PostgreSQL 쿼리 실행" |

### 5.3 향후 마이크로서비스 전환 경로

이 설계는 향후 다음과 같이 마이크로서비스로 전환 가능합니다:

```
Phase 1-2 (현재): 모놀리식 (모든 도메인이 하나의 프로세스)
   ↓
Phase 3-4: 도메인별 서비스 분리
   - User Service (포트 3001)
   - Document Service (포트 3002)
   - Annotation Service (포트 3003)
   - Sync Service (포트 3004)
   - Storage Service (포트 3005)
   - Audit Service (포트 3006)
   ↓
각 서비스는 독립적인 데이터베이스 사용
도메인 이벤트는 메시지 큐(RabbitMQ)를 통해 전달
```

---

## 6. 설계 변경 이력

| 날짜 | 변경 내용 | 변경자 | ADR |
| :--- | :--- | :--- | :--- |
| 2026-05-12 | DDD 기반 도메인 모듈 아키텍처 정의 | jkman | ADR-007 |
| 2026-05-12 | 8개 도메인 설계 및 계층 구조 정의 | jkman | - |
| 2026-05-12 | 도메인 이벤트 패턴 도입 | jkman | - |
| 2026-05-12 | 폴더 구조 및 명명 규칙 정의 | jkman | - |

---
