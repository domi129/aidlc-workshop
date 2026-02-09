# Admin Unit - NFR Design Patterns

## Overview
Admin Unit의 NFR 요구사항을 충족하기 위한 디자인 패턴을 정의합니다.

---

## 1. Resilience Patterns

### 1.1 Lambda Error Handling Pattern
**Pattern**: Try-Catch with Standard Error Response

**Implementation**:
```typescript
export const handler = async (event: APIGatewayEvent) => {
  try {
    // Business logic
    const result = await processRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return handleError(error);
  }
};

function handleError(error: any) {
  const errorResponse = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An error occurred',
      statusCode: error.statusCode || 500
    }
  };
  
  return {
    statusCode: errorResponse.error.statusCode,
    body: JSON.stringify(errorResponse)
  };
}
```

**Benefits**:
- 일관된 에러 응답 형식
- 클라이언트 친화적 에러 메시지
- 스택 트레이스 노출 방지

---

### 1.2 DynamoDB Error Handling Pattern
**Pattern**: Immediate Failure (Fail Fast)

**Implementation**:
```typescript
async function queryOrders(storeId: string) {
  try {
    const result = await dynamodb.query({
      TableName: 'Orders',
      IndexName: 'storeId-createdAt-index',
      KeyConditionExpression: 'storeId = :storeId',
      ExpressionAttributeValues: {
        ':storeId': storeId
      }
    }).promise();
    
    return result.Items;
  } catch (error) {
    // Immediate failure - no retry
    throw {
      code: 'DATABASE_ERROR',
      message: 'Failed to query orders',
      statusCode: 500,
      originalError: error
    };
  }
}
```

**Benefits**:
- 빠른 실패 감지
- 단순한 에러 처리 로직
- 클라이언트가 재시도 결정

**Trade-offs**:
- 일시적 에러에도 즉시 실패
- 재시도 로직 없음

---

## 2. Scalability Patterns

### 2.1 SSE Connection Management Pattern
**Pattern**: In-Memory Map with Event Broadcasting

**Implementation**:
```typescript
// Connection registry (in-memory)
const connections = new Map<string, Response>();

// SSE handler
export const sseHandler = async (event: any) => {
  const connectionId = generateConnectionId();
  const storeId = extractStoreId(event);
  
  // Setup SSE response
  const response = setupSSEResponse();
  
  // Register connection
  connections.set(connectionId, {
    response,
    storeId,
    connectedAt: Date.now()
  });
  
  // Send initial data
  sendInitialOrders(connectionId, storeId);
  
  // Keep connection alive
  const heartbeatInterval = setInterval(() => {
    sendHeartbeat(connectionId);
  }, 30000);
  
  // Cleanup on disconnect
  response.on('close', () => {
    connections.delete(connectionId);
    clearInterval(heartbeatInterval);
  });
  
  return response;
};

// Event broadcasting
export function broadcastOrderEvent(storeId: string, event: any) {
  connections.forEach((conn, id) => {
    if (conn.storeId === storeId) {
      sendEvent(id, event);
    }
  });
}
```

**Benefits**:
- 단순한 구현
- 낮은 지연 시간
- MVP에 적합

**Limitations**:
- Lambda 인스턴스별 연결 관리
- 인스턴스 간 이벤트 공유 불가
- 스케일링 시 일부 관리자는 이벤트 수신 지연

**Workaround**:
- 주문 생성/수정 시 모든 Lambda 인스턴스에 이벤트 전파 (DynamoDB Streams 또는 애플리케이션 레벨)

---

### 2.2 Lambda Concurrency Pattern
**Pattern**: Unreserved Concurrency

**Configuration**:
- Reserved concurrency: None
- Provisioned concurrency: None
- Default account limit: 1000 concurrent executions

**Benefits**:
- 자동 스케일링
- 비용 효율적
- 관리 부담 최소

**Capacity Planning**:
- Expected concurrent admins: 5-20
- Expected concurrent Lambda executions: 10-50
- Buffer: 기본 제한(1000) >> 필요(50)

---

## 3. Performance Patterns

### 3.1 DynamoDB Query Optimization Pattern
**Pattern**: GSI-Based Queries

**Implementation**:
```typescript
// Efficient query using GSI
async function getOrdersByStore(storeId: string) {
  return dynamodb.query({
    TableName: 'Orders',
    IndexName: 'storeId-createdAt-index',
    KeyConditionExpression: 'storeId = :storeId',
    ExpressionAttributeValues: {
      ':storeId': storeId
    },
    ScanIndexForward: false, // Descending order
    Limit: 100
  }).promise();
}

// Projection to reduce data transfer
async function getOrderSummaries(storeId: string) {
  return dynamodb.query({
    TableName: 'Orders',
    IndexName: 'storeId-createdAt-index',
    KeyConditionExpression: 'storeId = :storeId',
    ProjectionExpression: 'orderId, orderNumber, totalAmount, #status, createdAt',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':storeId': storeId
    }
  }).promise();
}
```

**Benefits**:
- < 100ms 쿼리 시간
- 효율적인 데이터 전송
- 비용 최적화

---

### 3.2 Lambda Cold Start Mitigation Pattern
**Pattern**: Accept Cold Starts (MVP)

**Rationale**:
- Cold start: ~500ms (256MB Lambda)
- Warm execution: ~200ms
- 첫 요청만 영향
- MVP에서 허용 가능

**Future Optimization** (if needed):
- Provisioned concurrency (비용 증가)
- Scheduled warming (복잡도 증가)

---

### 3.3 API Response Optimization Pattern
**Pattern**: Minimal Payload

**Implementation**:
```typescript
// Return only necessary fields
function formatOrderResponse(order: Order) {
  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    items: order.items.map(item => ({
      menuName: item.menuName,
      quantity: item.quantity,
      subtotal: item.subtotal
    })),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt
  };
  // Exclude: storeId, sessionId, internal fields
}
```

**Benefits**:
- 빠른 응답 시간
- 낮은 데이터 전송 비용
- 클라이언트 파싱 부담 감소

---

## 4. Security Patterns

### 4.1 JWT Token Management Pattern
**Pattern**: Hybrid Storage (Client + Server)

**Implementation**:
```typescript
// Login: Store token in both places
async function login(username: string, password: string, storeId: string) {
  // Authenticate
  const admin = await authenticateAdmin(username, password, storeId);
  
  // Create session
  const sessionId = generateUUID();
  const expiresAt = Date.now() + 16 * 60 * 60 * 1000; // 16 hours
  
  await dynamodb.put({
    TableName: 'AdminSessions',
    Item: {
      sessionId,
      adminId: admin.adminId,
      storeId: admin.storeId,
      expiresAt,
      createdAt: Date.now()
    }
  }).promise();
  
  // Generate JWT
  const token = jwt.sign(
    { adminId: admin.adminId, storeId: admin.storeId, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '16h' }
  );
  
  return {
    token, // Client stores in localStorage
    admin,
    expiresAt
  };
}

// Verification: Stateless (JWT only)
async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // No session table lookup
  } catch (error) {
    throw { code: 'UNAUTHORIZED', message: 'Invalid token', statusCode: 401 };
  }
}
```

**Benefits**:
- 빠른 검증 (세션 조회 불필요)
- 세션 추적 가능 (AdminSessions 테이블)
- 토큰 무효화 가능 (필요 시 세션 삭제)

---

### 4.2 RBAC Implementation Pattern
**Pattern**: Middleware-Based Authorization

**Implementation**:
```typescript
// Authorization middleware
function requireRole(...allowedRoles: string[]) {
  return async (event: APIGatewayEvent, context: any, next: Function) => {
    const token = extractToken(event);
    const decoded = await verifyToken(token);
    
    // Get admin role
    const admin = await getAdmin(decoded.adminId);
    
    if (!allowedRoles.includes(admin.role)) {
      throw {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        statusCode: 403
      };
    }
    
    // Attach admin to context
    context.admin = admin;
    return next();
  };
}

// Usage
export const deleteOrder = [
  requireRole('Admin'), // Only Admin can delete
  async (event: APIGatewayEvent, context: any) => {
    const orderId = event.pathParameters.orderId;
    await orderService.deleteOrder(orderId);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }
];

export const updateOrderStatus = [
  requireRole('Admin', 'Manager'), // Admin or Manager
  async (event: APIGatewayEvent, context: any) => {
    // Implementation
  }
];
```

**Benefits**:
- 재사용 가능한 권한 체크
- 명확한 권한 정의
- 쉬운 유지보수

---

### 4.3 S3 Image Access Pattern
**Pattern**: Presigned URLs

**Implementation**:
```typescript
// Generate presigned URL for upload
async function generateUploadUrl(storeId: string, fileName: string) {
  const key = `menus/${storeId}/${generateUUID()}.${getExtension(fileName)}`;
  
  const presignedUrl = s3.getSignedUrl('putObject', {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 300, // 5 minutes
    ContentType: 'image/jpeg' // or image/png
  });
  
  return {
    uploadUrl: presignedUrl,
    imageUrl: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  };
}

// Generate presigned URL for download (optional)
async function generateDownloadUrl(imageKey: string) {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET,
    Key: imageKey,
    Expires: 3600 // 1 hour
  });
}
```

**Benefits**:
- 보안 (버킷 비공개 유지)
- 직접 업로드 (Lambda 프록시 불필요)
- 임시 접근 (만료 시간 제어)

---

### 4.4 Data Encryption Pattern
**Pattern**: AWS Managed Encryption

**Configuration**:
- DynamoDB: Default encryption (AWS managed keys)
- S3: SSE-S3 (Server-Side Encryption)
- In-transit: HTTPS (TLS 1.2+)

**Implementation**:
```typescript
// DynamoDB - encryption enabled by default
// No code changes needed

// S3 - enable default encryption
const s3Config = {
  Bucket: process.env.S3_BUCKET,
  ServerSideEncryption: 'AES256' // SSE-S3
};
```

**Benefits**:
- 자동 암호화
- 추가 비용 없음
- 관리 부담 최소

---

## 5. Integration Patterns

### 5.1 Event Broadcasting Pattern
**Pattern**: Application-Level Event Propagation

**Implementation**:
```typescript
// After order creation/update
async function createOrder(orderData: any) {
  // Save to DynamoDB
  const order = await saveOrder(orderData);
  
  // Broadcast to all SSE connections
  broadcastOrderEvent(order.storeId, {
    type: 'order-created',
    data: order
  });
  
  return order;
}

async function updateOrderStatus(orderId: string, newStatus: string) {
  // Update in DynamoDB
  const order = await updateOrder(orderId, newStatus);
  
  // Broadcast to all SSE connections
  broadcastOrderEvent(order.storeId, {
    type: 'order-updated',
    data: order
  });
  
  return order;
}
```

**Limitations**:
- 이벤트는 동일 Lambda 인스턴스의 연결에만 전달
- 다른 인스턴스의 연결은 폴링으로 업데이트 확인 필요

**Acceptable for MVP**:
- 5-20명 관리자 규모에서 대부분 동일 인스턴스 사용
- 최악의 경우 5초 지연 (클라이언트 폴링)

---

## Pattern Summary

| Category | Pattern | Complexity | MVP Fit |
|----------|---------|------------|---------|
| Resilience | Try-Catch Error Handling | Low | ✓ |
| Resilience | Immediate Failure | Low | ✓ |
| Scalability | In-Memory SSE Connections | Low | ✓ |
| Scalability | Unreserved Concurrency | Low | ✓ |
| Performance | GSI-Based Queries | Low | ✓ |
| Performance | Accept Cold Starts | Low | ✓ |
| Performance | Minimal Payload | Low | ✓ |
| Security | Hybrid JWT Storage | Medium | ✓ |
| Security | Middleware RBAC | Medium | ✓ |
| Security | Presigned URLs | Medium | ✓ |
| Security | AWS Managed Encryption | Low | ✓ |

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: NFR Design Patterns 정의 완료
