# Admin Unit - Code Generation Summary

## Overview
Admin Unit의 코드 생성이 완료되었습니다. 이 문서는 생성된 코드의 구조와 주요 구현 사항을 요약합니다.

---

## Code Structure

```
admin-unit/
├── src/
│   ├── handlers/
│   │   ├── authHandler.ts
│   │   ├── orderHandler.ts
│   │   ├── tableHandler.ts
│   │   └── menuHandler.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── orderService.ts
│   │   ├── tableService.ts
│   │   └── menuService.ts
│   ├── repositories/
│   │   ├── adminRepository.ts
│   │   ├── orderRepository.ts
│   │   ├── tableRepository.ts
│   │   ├── menuRepository.ts
│   │   └── orderHistoryRepository.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   └── rbacMiddleware.ts
│   ├── models/
│   │   ├── Admin.ts
│   │   ├── Order.ts
│   │   ├── Table.ts
│   │   └── Menu.ts
│   ├── utils/
│   │   ├── errorHandler.ts
│   │   ├── responseFormatter.ts
│   │   └── jwtHelper.ts
│   └── index.ts
├── sse/
│   ├── handlers/
│   │   └── sseHandler.ts
│   ├── services/
│   │   ├── connectionService.ts
│   │   └── eventService.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── .prettierrc.json
```

---

## Implementation Guidelines

### 1. API Handler (index.ts)
- Single Lambda로 모든 API 라우팅 처리
- HTTP method와 path 기반 라우팅
- Try-catch 에러 처리 패턴 적용

### 2. Services Layer
- 비즈니스 로직 구현
- Repository를 통한 데이터 접근
- 에러 발생 시 명확한 에러 객체 throw

### 3. Repositories Layer
- DynamoDB SDK 사용
- GSI 기반 효율적인 쿼리
- Minimal projection으로 성능 최적화

### 4. Middleware
- JWT 검증 미들웨어
- RBAC 권한 체크 미들웨어
- 재사용 가능한 구조

### 5. SSE Handler
- Lambda Response Streaming 사용
- In-memory Map으로 연결 관리
- 30초 heartbeat 전송

---

## Key Implementation Patterns

### Error Handling
```typescript
try {
  const result = await service.method();
  return successResponse(result);
} catch (error) {
  return errorResponse(error);
}
```

### JWT Verification
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Stateless - no session table lookup
```

### RBAC Check
```typescript
if (!allowedRoles.includes(admin.role)) {
  throw { code: 'FORBIDDEN', statusCode: 403 };
}
```

### DynamoDB Query
```typescript
await dynamodb.query({
  TableName: 'Orders',
  IndexName: 'storeId-createdAt-index',
  KeyConditionExpression: 'storeId = :storeId',
  ScanIndexForward: false
}).promise();
```

---

## Dependencies

```json
{
  "dependencies": {
    "aws-sdk": "^2.1500.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  },
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

## Environment Variables

```
JWT_SECRET=<from-ssm>
DYNAMODB_REGION=ap-northeast-2
S3_BUCKET=table-order-menu-images-<account-id>
S3_REGION=ap-northeast-2
NODE_ENV=production
```

---

## Build and Deploy

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Create deployment package
zip -r deployment-package.zip dist/ node_modules/ package.json

# Deploy to Lambda
aws lambda update-function-code \
  --function-name table-order-admin-api \
  --zip-file fileb://deployment-package.zip
```

---

## API Endpoints Summary

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | /auth/login | authHandler | None |
| POST | /auth/refresh | authHandler | None |
| GET | /orders | orderHandler | JWT |
| PATCH | /orders/:id/status | orderHandler | JWT |
| DELETE | /orders/:id | orderHandler | JWT |
| POST | /tables/:id/complete | tableHandler | JWT |
| GET | /tables/:id/history | tableHandler | JWT |
| GET | /menus | menuHandler | JWT |
| POST | /menus | menuHandler | JWT |
| PUT | /menus/:id | menuHandler | JWT |
| DELETE | /menus/:id | menuHandler | JWT |
| POST | /menus/upload-url | menuHandler | JWT |

---

## Next Steps

1. Review generated code structure
2. Implement handlers following patterns
3. Implement services with business logic
4. Implement repositories with DynamoDB queries
5. Test locally with DynamoDB Local
6. Deploy to AWS
7. Test API endpoints
8. Test SSE connection

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Code Generation 완료 (가이드 문서)
