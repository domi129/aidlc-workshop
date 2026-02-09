# Admin Unit - Tech Stack Decisions

## Overview
Admin Unit의 기술 스택 선택 및 근거를 문서화합니다.

---

## 1. Runtime and Language

### 1.1 Lambda Runtime
**Decision**: Node.js 18.x

**Rationale**:
- **Stability**: LTS (Long Term Support) 버전으로 안정성 보장
- **Compatibility**: AWS Lambda 공식 지원
- **Ecosystem**: 풍부한 npm 패키지 생태계
- **Performance**: V8 엔진 최적화
- **Team Familiarity**: 팀의 Node.js 경험

**Alternatives Considered**:
- Node.js 20.x: 최신 LTS이지만 AWS Lambda 지원 초기 단계
- Python: 고려했으나 팀 경험 부족
- Java: Cold start 시간 길어서 제외

**Version Details**:
- Node.js: 18.x (18.19.0 이상)
- npm: 9.x
- TypeScript: 5.x (컴파일 타겟: ES2022)

---

### 1.2 Programming Language
**Decision**: TypeScript

**Rationale**:
- **Type Safety**: 컴파일 타임 타입 체크
- **IDE Support**: 자동 완성, 리팩토링 지원
- **Code Quality**: 타입 정의로 코드 가독성 향상
- **JavaScript Compatibility**: 기존 JavaScript 라이브러리 사용 가능

**TypeScript Configuration**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Note**: strict mode 비활성화 (MVP 단순화)

---

## 2. Compute

### 2.1 Lambda Configuration
**Decision**: 256MB memory

**Rationale**:
- **Cost vs Performance**: 256MB는 비용과 성능의 균형점
- **CPU Allocation**: 메모리에 비례하여 CPU 할당 (256MB = ~0.4 vCPU)
- **Cold Start**: 256MB에서 cold start ~500ms
- **Warm Execution**: 256MB에서 실행 시간 ~200ms

**Memory Sizing Analysis**:
- 128MB: 너무 느림 (cold start 1s+)
- 256MB: 적절 (cold start ~500ms) ✓
- 512MB: 과도 (비용 2배, 성능 향상 미미)
- 1024MB+: 불필요 (간단한 CRUD 작업)

**Lambda Settings**:
- Memory: 256MB
- Timeout: 30초 (API), 900초 (SSE)
- Ephemeral storage: 512MB (기본값)
- Reserved concurrency: 없음 (자동 스케일링)

---

### 2.2 Lambda Concurrency
**Decision**: Unreserved (자동 스케일링)

**Rationale**:
- **Cost Optimization**: Reserved concurrency 비용 없음
- **Flexibility**: 트래픽 변동에 자동 대응
- **Sufficient Limit**: 기본 제한(1000)으로 충분 (예상 최대 20-50 동시 실행)

**Concurrency Calculation**:
- 동시 관리자: 20명
- 요청당 실행 시간: 200ms
- 초당 요청: 20명 × 1 req/s = 20 req/s
- 필요 동시 실행: 20 × 0.2s = 4 instances
- **여유**: 기본 제한(1000) >> 필요(4)

---

## 3. API Layer

### 3.1 API Gateway Type
**Decision**: REST API

**Rationale**:
- **Feature Rich**: 풍부한 기능 (인증, 캐싱, 요청 검증)
- **Standard**: 업계 표준 REST API
- **Compatibility**: 기존 도구 및 라이브러리 호환성
- **SSE Support**: Server-Sent Events 지원

**Alternatives Considered**:
- HTTP API: 저비용이지만 기능 제한 (SSE 미지원)
- WebSocket API: 양방향 통신 불필요 (SSE로 충분)

**API Gateway Configuration**:
- Protocol: HTTPS only
- Endpoint type: Regional
- Throttling: 기본 제한 (10,000 req/s)
- Caching: 비활성화 (비용 절감)

---

### 3.2 API Design
**Decision**: RESTful API

**Principles**:
- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- JSON request/response
- Standard HTTP status codes

**API Structure**:
```
/api/admin/auth/login          POST
/api/admin/orders              GET
/api/admin/orders/stream       GET (SSE)
/api/admin/orders/:id/status   PATCH
/api/admin/orders/:id          DELETE
/api/admin/tables/:id/complete POST
/api/admin/menus               GET, POST
/api/admin/menus/:id           PUT, DELETE
```

---

## 4. Database

### 4.1 DynamoDB Capacity Mode
**Decision**: On-demand

**Rationale**:
- **Auto-scaling**: 트래픽 변동에 자동 대응
- **No Capacity Planning**: 용량 계획 불필요
- **Cost Effective**: 낮은 트래픽에서 비용 효율적
- **Simplicity**: 관리 부담 최소화

**Cost Comparison** (예상 월 사용량):
- On-demand: $10-20 (사용량 기반)
- Provisioned (5 RCU, 5 WCU): $2.50 + 초과 비용
- **결론**: On-demand가 단순하고 안전

**Capacity Estimates**:
- 읽기: 1,000 req/day × 4KB = 4,000 RCU/day
- 쓰기: 500 req/day × 1KB = 500 WCU/day
- On-demand 비용: ~$15/month

---

### 4.2 DynamoDB Table Design
**Decision**: Multi-table design (7 tables)

**Tables**:
1. Stores
2. Admins
3. AdminSessions (TTL enabled)
4. Tables
5. Orders
6. Menus
7. OrderHistory (TTL enabled)

**Rationale**:
- **Simplicity**: 각 엔티티를 독립적으로 관리
- **Clarity**: 명확한 데이터 모델
- **MVP Appropriate**: 단일 테이블 설계의 복잡도 불필요

**Alternatives Considered**:
- Single table design: 복잡하고 MVP에 과도

---

### 4.3 DynamoDB Indexes
**Decision**: GSI (Global Secondary Index) 사용

**Indexes**:
- Admins: storeId-username-index
- AdminSessions: adminId-index
- Tables: storeId-tableNumber-index
- Orders: storeId-createdAt-index, tableId-sessionId-index
- Menus: storeId-category-index
- OrderHistory: tableId-archivedAt-index

**Rationale**:
- **Query Efficiency**: 빠른 조회 패턴 지원
- **Cost**: GSI 비용 낮음 (On-demand)
- **Flexibility**: 다양한 쿼리 패턴 지원

---

## 5. Storage

### 5.1 S3 Storage Class
**Decision**: Standard

**Rationale**:
- **Frequent Access**: 메뉴 이미지는 자주 접근
- **Low Latency**: 빠른 응답 시간 필요
- **Simplicity**: 계층화 관리 불필요

**Cost Analysis**:
- 예상 이미지 수: 100-500개
- 평균 이미지 크기: 500KB
- 총 스토리지: 50-250MB
- 월 비용: $0.01-0.05 (무시 가능)

**Alternatives Considered**:
- Intelligent-Tiering: 최소 크기 128KB, 관리 비용 추가
- Standard-IA: 자주 접근하므로 부적합

---

### 5.2 S3 Configuration
**Settings**:
- Versioning: 비활성화 (비용 절감)
- Encryption: SSE-S3 (기본 암호화)
- Public access: 차단 (presigned URL 사용)
- Lifecycle policy: 없음 (영구 보관)

**Access Pattern**:
- Upload: Lambda를 통한 프록시 업로드
- Download: CloudFront 또는 S3 직접 접근 (선택사항)

---

## 6. Monitoring and Logging

### 6.1 CloudWatch Logs
**Decision**: 30일 보관

**Rationale**:
- **Cost Balance**: 30일은 비용과 유용성의 균형
- **Debugging**: 최근 1개월 로그로 충분
- **Compliance**: MVP에서 장기 보관 불필요

**Cost Analysis**:
- 예상 로그: 1GB/day
- 30일 보관: 30GB
- 월 비용: ~$5

**Alternatives Considered**:
- 7일: 너무 짧음 (디버깅 어려움)
- 90일: 과도 (비용 3배)
- Never expire: 불필요 (비용 증가)

---

### 6.2 CloudWatch Metrics
**Decision**: Basic metrics only (no custom metrics)

**Rationale**:
- **Cost Savings**: Custom metrics 비용 높음
- **MVP Simplicity**: 기본 메트릭으로 충분
- **No Monitoring**: 알림 없으므로 custom metrics 불필요

**Available Metrics**:
- Lambda: Invocations, Duration, Errors, Throttles
- DynamoDB: ConsumedReadCapacity, ConsumedWriteCapacity
- API Gateway: Count, Latency, 4XXError, 5XXError

---

## 7. Development Tools

### 7.1 Code Quality Tools
**Tools**:
- ESLint: JavaScript/TypeScript 린팅
- Prettier: 코드 포맷팅
- TypeScript Compiler: 타입 체크

**Configuration**:
```json
// .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}

// .prettierrc.json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

### 7.2 Package Management
**Decision**: npm

**Rationale**:
- **Standard**: Node.js 기본 패키지 매니저
- **Compatibility**: 모든 패키지 지원
- **Simplicity**: 추가 도구 불필요

**Alternatives Considered**:
- yarn: 고려했으나 npm으로 충분
- pnpm: 디스크 절약 불필요

---

### 7.3 Build Tool
**Decision**: TypeScript Compiler (tsc)

**Rationale**:
- **Simplicity**: 추가 빌드 도구 불필요
- **Native**: TypeScript 기본 컴파일러
- **Sufficient**: Lambda 배포에 충분

**Build Process**:
```bash
npm run build  # tsc 실행
npm run deploy # AWS CLI로 배포
```

**Alternatives Considered**:
- Webpack: 과도 (번들링 불필요)
- esbuild: 빠르지만 MVP에 불필요

---

## 8. Authentication and Authorization

### 8.1 JWT Library
**Decision**: jsonwebtoken

**Rationale**:
- **Standard**: 가장 널리 사용되는 JWT 라이브러리
- **Mature**: 안정적이고 검증됨
- **Simple**: 사용하기 쉬움

**JWT Configuration**:
```typescript
{
  algorithm: 'HS256',
  expiresIn: '16h',
  issuer: 'table-order-admin'
}
```

---

### 8.2 Password Hashing
**Decision**: bcrypt

**Rationale**:
- **Security**: 업계 표준 해싱 알고리즘
- **Slow**: 무차별 대입 공격 방어
- **Salt**: 자동 salt 생성

**Bcrypt Configuration**:
```typescript
{
  saltRounds: 10  // 2^10 iterations
}
```

---

## 9. Real-time Communication

### 9.1 SSE Implementation
**Decision**: Native Node.js HTTP response streaming

**Rationale**:
- **Simplicity**: 추가 라이브러리 불필요
- **Lambda Support**: Lambda response streaming 지원
- **Standard**: SSE는 HTTP 표준

**Implementation**:
```typescript
response.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
});

response.write(`data: ${JSON.stringify(event)}\n\n`);
```

**Alternatives Considered**:
- WebSocket: 양방향 통신 불필요
- Polling: 비효율적

---

## 10. Deployment

### 10.1 Deployment Method
**Decision**: AWS CLI + Manual scripts

**Rationale**:
- **Simplicity**: CI/CD 구축 불필요
- **Cost**: 무료 (CI/CD 서비스 비용 없음)
- **Control**: 배포 과정 완전 제어

**Deployment Script**:
```bash
#!/bin/bash
# build
npm run build

# package
zip -r function.zip dist/ node_modules/

# deploy
aws lambda update-function-code \
  --function-name admin-api \
  --zip-file fileb://function.zip
```

---

### 10.2 Infrastructure as Code
**Decision**: None (Manual AWS Console)

**Rationale**:
- **MVP Simplicity**: IaC 구축 시간 절약
- **Small Scale**: 리소스 수 적음 (수동 관리 가능)
- **Learning Curve**: IaC 학습 불필요

**Alternatives Considered**:
- AWS SAM: 고려했으나 MVP에 과도
- Terraform: 고려했으나 학습 곡선 높음
- CDK: 고려했으나 복잡도 높음

**Future Consideration**: 프로덕션 단계에서 IaC 도입 검토

---

## Tech Stack Summary

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| Runtime | Node.js | 18.x | Stable LTS |
| Language | TypeScript | 5.x | Type safety |
| Compute | AWS Lambda | - | Serverless |
| API | API Gateway REST | - | Feature rich |
| Database | DynamoDB | - | NoSQL, On-demand |
| Storage | S3 Standard | - | Frequent access |
| Auth | JWT + bcrypt | - | Standard security |
| Logging | CloudWatch Logs | 30 days | Cost balance |
| Code Quality | ESLint + Prettier | - | Standard tools |
| Deployment | AWS CLI | - | Manual, simple |

---

## Dependencies

### Production Dependencies
```json
{
  "dependencies": {
    "aws-sdk": "^2.1500.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/node": "^18.19.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Tech Stack Decisions 정의 완료
