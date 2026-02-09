# Admin Unit - Logical Components

## Overview
Admin Unit의 논리적 컴포넌트 및 인프라 요소를 정의합니다.

---

## 1. API Layer Components

### 1.1 Single Lambda Architecture
**Component**: Unified Admin API Lambda

**Structure**:
```
admin-api-lambda/
├── handlers/
│   ├── authHandler.ts       # POST /auth/login, /auth/refresh
│   ├── orderHandler.ts      # GET/PATCH/DELETE /orders/*
│   ├── tableHandler.ts      # POST /tables/*/complete
│   └── menuHandler.ts       # GET/POST/PUT/DELETE /menus/*
├── services/
│   ├── authService.ts
│   ├── orderService.ts
│   ├── tableService.ts
│   └── menuService.ts
├── repositories/
│   ├── adminRepository.ts
│   ├── orderRepository.ts
│   ├── tableRepository.ts
│   └── menuRepository.ts
├── middleware/
│   ├── authMiddleware.ts
│   └── rbacMiddleware.ts
├── utils/
│   ├── errorHandler.ts
│   └── responseFormatter.ts
└── index.ts                 # Main handler with routing
```

**Routing Logic**:
```typescript
export const handler = async (event: APIGatewayEvent) => {
  const { httpMethod, path } = event;
  
  // Route to appropriate handler
  if (path.startsWith('/auth')) {
    return authHandler(event);
  } else if (path.startsWith('/orders')) {
    return orderHandler(event);
  } else if (path.startsWith('/tables')) {
    return tableHandler(event);
  } else if (path.startsWith('/menus')) {
    return menuHandler(event);
  }
  
  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
```

**Benefits**:
- 단순한 배포 (하나의 Lambda)
- 공유 코드 재사용 용이
- 낮은 관리 부담

**Trade-offs**:
- 큰 패키지 크기
- 모든 엔드포인트가 동일한 리소스 공유

---

### 1.2 SSE Lambda Component
**Component**: SSE Streaming Lambda

**Structure**:
```
admin-sse-lambda/
├── handlers/
│   └── sseHandler.ts        # SSE connection handler
├── services/
│   ├── connectionService.ts # Connection management
│   └── eventService.ts      # Event broadcasting
├── repositories/
│   └── orderRepository.ts   # Order queries
└── index.ts                 # SSE handler
```

**Lambda Function URL Configuration**:
- Invoke mode: RESPONSE_STREAM
- Auth type: AWS_IAM (with custom authorizer)
- CORS: Enabled

**Connection Lifecycle**:
```typescript
export const handler = awslambda.streamifyResponse(
  async (event, responseStream) => {
    const metadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    };
    
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    
    // Register connection
    const connectionId = registerConnection(responseStream, event);
    
    // Send initial data
    await sendInitialOrders(connectionId);
    
    // Keep alive
    const heartbeat = setInterval(() => {
      sendHeartbeat(connectionId);
    }, 30000);
    
    // Wait for disconnect
    await waitForDisconnect(connectionId);
    
    // Cleanup
    clearInterval(heartbeat);
    unregisterConnection(connectionId);
  }
);
```

---

## 2. Service Layer Components

### 2.1 Authentication Service
**Responsibilities**:
- 관리자 로그인 처리
- JWT 토큰 생성 및 검증
- 세션 관리

**Key Methods**:
```typescript
class AuthService {
  async login(username: string, password: string, storeId: string): Promise<LoginResponse>
  async verifyToken(token: string): Promise<DecodedToken>
  async refreshToken(token: string): Promise<RefreshResponse>
  async logout(sessionId: string): Promise<void>
}
```

---

### 2.2 Order Service
**Responsibilities**:
- 주문 조회 및 필터링
- 주문 상태 변경
- 주문 삭제
- SSE 이벤트 발행

**Key Methods**:
```typescript
class OrderService {
  async getOrdersByStore(storeId: string): Promise<Order[]>
  async getOrderById(orderId: string): Promise<Order>
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order>
  async deleteOrder(orderId: string): Promise<void>
  async broadcastOrderEvent(storeId: string, event: OrderEvent): Promise<void>
}
```

---

### 2.3 Table Service
**Responsibilities**:
- 테이블 세션 관리
- 세션 종료 및 이력 이동
- 과거 주문 조회

**Key Methods**:
```typescript
class TableService {
  async completeSession(tableId: string, sessionId: string): Promise<void>
  async getOrderHistory(tableId: string, filters: HistoryFilters): Promise<OrderHistory[]>
  async archiveOrders(sessionId: string): Promise<number>
}
```

---

### 2.4 Menu Service
**Responsibilities**:
- 메뉴 CRUD 작업
- 이미지 업로드 URL 생성
- 메뉴 순서 관리

**Key Methods**:
```typescript
class MenuService {
  async getMenusByStore(storeId: string): Promise<Menu[]>
  async createMenu(menuData: CreateMenuInput): Promise<Menu>
  async updateMenu(menuId: string, updates: UpdateMenuInput): Promise<Menu>
  async deleteMenu(menuId: string): Promise<void>
  async generateUploadUrl(storeId: string, fileName: string): Promise<UploadUrlResponse>
}
```

---

## 3. Data Access Layer Components

### 3.1 Repository Pattern
**Components**:
- AdminRepository
- OrderRepository
- TableRepository
- MenuRepository
- OrderHistoryRepository

**Example Implementation**:
```typescript
class OrderRepository {
  private tableName = 'Orders';
  
  async findByStore(storeId: string): Promise<Order[]> {
    const result = await dynamodb.query({
      TableName: this.tableName,
      IndexName: 'storeId-createdAt-index',
      KeyConditionExpression: 'storeId = :storeId',
      ExpressionAttributeValues: { ':storeId': storeId },
      ScanIndexForward: false
    }).promise();
    
    return result.Items as Order[];
  }
  
  async findById(orderId: string): Promise<Order | null> {
    const result = await dynamodb.get({
      TableName: this.tableName,
      Key: { orderId }
    }).promise();
    
    return result.Item as Order || null;
  }
  
  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    // Implementation
  }
  
  async delete(orderId: string): Promise<void> {
    await dynamodb.delete({
      TableName: this.tableName,
      Key: { orderId }
    }).promise();
  }
}
```

---

## 4. Infrastructure Components

### 4.1 AWS Lambda Functions

**Admin API Lambda**:
- Function name: `table-order-admin-api`
- Runtime: Node.js 18.x
- Memory: 256MB
- Timeout: 30s
- Environment variables:
  - JWT_SECRET
  - DYNAMODB_REGION
  - S3_BUCKET
  - S3_REGION

**SSE Lambda**:
- Function name: `table-order-admin-sse`
- Runtime: Node.js 18.x
- Memory: 256MB
- Timeout: 900s (15 minutes)
- Invoke mode: RESPONSE_STREAM
- Environment variables:
  - JWT_SECRET
  - DYNAMODB_REGION

---

### 4.2 API Gateway

**REST API**:
- Name: `table-order-admin-api`
- Endpoint type: Regional
- Stage: `prod`

**Routes**:
```
POST   /auth/login
POST   /auth/refresh
GET    /orders
PATCH  /orders/{orderId}/status
DELETE /orders/{orderId}
POST   /tables/{tableId}/complete
GET    /tables/{tableId}/history
GET    /menus
POST   /menus
PUT    /menus/{menuId}
DELETE /menus/{menuId}
POST   /menus/upload-url
```

**Authorizer**:
- Type: Lambda authorizer
- Token source: Authorization header
- Caching: 300s

---

### 4.3 DynamoDB Tables

**Stores**:
- PK: storeId
- Attributes: storeName, createdAt, updatedAt

**Admins**:
- PK: adminId
- GSI: storeId-username-index
- Attributes: storeId, username, passwordHash, role, email, createdAt

**AdminSessions**:
- PK: sessionId
- GSI: adminId-index
- TTL: expiresAt
- Attributes: adminId, storeId, token, expiresAt, createdAt

**Tables**:
- PK: tableId
- GSI: storeId-tableNumber-index
- Attributes: storeId, tableNumber, tablePassword, currentSessionId, sessionStartTime

**Orders**:
- PK: orderId
- GSI: storeId-createdAt-index, tableId-sessionId-index
- Attributes: storeId, tableId, sessionId, orderNumber, items, totalAmount, status, createdAt, updatedAt

**Menus**:
- PK: menuId
- GSI: storeId-category-index
- Attributes: storeId, menuName, price, description, category, imageUrl, displayOrder, isAvailable

**OrderHistory**:
- PK: historyId
- GSI: tableId-archivedAt-index
- TTL: expiresAt (90 days)
- Attributes: orderId, storeId, tableId, sessionId, orderNumber, items, totalAmount, status, createdAt, archivedAt

---

### 4.4 S3 Bucket

**Bucket Configuration**:
- Name: `table-order-menu-images-{account-id}`
- Region: ap-northeast-2
- Encryption: SSE-S3
- Versioning: Disabled
- Public access: Blocked
- CORS: Enabled (for presigned URLs)

**Folder Structure**:
```
menus/
  ├── {storeId}/
  │   ├── {uuid}.jpg
  │   ├── {uuid}.png
  │   └── ...
```

---

### 4.5 CloudWatch Logs

**Log Groups**:
- `/aws/lambda/table-order-admin-api`
- `/aws/lambda/table-order-admin-sse`
- Retention: 30 days

---

## 5. Component Interaction Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────────────────────────────────────┐
│         API Gateway (REST API)              │
│  ┌────────────────────────────────────────┐ │
│  │  Lambda Authorizer (JWT Verification)  │ │
│  └────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       │ Invoke
       │
┌──────▼──────────────────────────────────────┐
│      Admin API Lambda (Single Function)     │
│  ┌────────────────────────────────────────┐ │
│  │  Handlers (Auth, Order, Table, Menu)   │ │
│  ├────────────────────────────────────────┤ │
│  │  Services (Business Logic)             │ │
│  ├────────────────────────────────────────┤ │
│  │  Repositories (Data Access)            │ │
│  └────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       │ SDK Calls
       │
┌──────▼──────────────────────────────────────┐
│           AWS Services                      │
│  ┌────────────┐  ┌────────────┐            │
│  │ DynamoDB   │  │     S3     │            │
│  │ (7 tables) │  │  (Images)  │            │
│  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────┘


┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTPS (SSE)
       │
┌──────▼──────────────────────────────────────┐
│    SSE Lambda (Function URL)                │
│  ┌────────────────────────────────────────┐ │
│  │  Connection Management (In-Memory Map) │ │
│  ├────────────────────────────────────────┤ │
│  │  Event Broadcasting                    │ │
│  ├────────────────────────────────────────┤ │
│  │  Heartbeat (30s interval)              │ │
│  └────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       │ Query
       │
┌──────▼──────────────────────────────────────┐
│           DynamoDB (Orders)                 │
└─────────────────────────────────────────────┘
```

---

## 6. Deployment Components

### 6.1 Lambda Deployment Package
**Structure**:
```
deployment-package.zip
├── dist/                    # Compiled TypeScript
│   ├── handlers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── utils/
│   └── index.js
├── node_modules/            # Dependencies
│   ├── aws-sdk/
│   ├── bcrypt/
│   ├── jsonwebtoken/
│   └── uuid/
└── package.json
```

**Build Script**:
```bash
#!/bin/bash
# Build TypeScript
npm run build

# Install production dependencies
npm ci --production

# Create deployment package
zip -r deployment-package.zip dist/ node_modules/ package.json

# Upload to Lambda
aws lambda update-function-code \
  --function-name table-order-admin-api \
  --zip-file fileb://deployment-package.zip
```

---

## Component Summary

| Component | Type | Purpose | Complexity |
|-----------|------|---------|------------|
| Admin API Lambda | Compute | API 처리 | Medium |
| SSE Lambda | Compute | 실시간 이벤트 | Medium |
| API Gateway | API | HTTP 라우팅 | Low |
| DynamoDB Tables (7) | Database | 데이터 저장 | Medium |
| S3 Bucket | Storage | 이미지 저장 | Low |
| CloudWatch Logs | Monitoring | 로그 저장 | Low |
| Lambda Authorizer | Security | JWT 검증 | Low |

**Total Components**: 13 logical components

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Logical Components 정의 완료
