# Service Layer Design

**선택된 패턴**: Controller → Domain Service → Repository

이 패턴은 비즈니스 로직을 Domain Service에 집중시키고, Controller는 HTTP 요청/응답 처리만, Repository는 데이터 접근만 담당합니다.

---

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Layer                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Controllers                             │  │
│  │  - Request validation                             │  │
│  │  - Response formatting                            │  │
│  │  - HTTP status codes                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Domain Services                           │  │
│  │  - Business rules                                 │  │
│  │  - Validation logic                               │  │
│  │  - Orchestration                                  │  │
│  │  - Transaction management                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Repositories                            │  │
│  │  - DynamoDB operations                            │  │
│  │  - Query optimization                             │  │
│  │  - Data mapping                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Domain Services

### 1. AuthService

**Purpose**: 인증 및 권한 관리

**Responsibilities**:
- JWT 토큰 생성 및 검증
- 비밀번호 해싱 및 비교
- 테이블 및 관리자 인증 로직
- 세션 관리

**Dependencies**:
- StoreRepository: 매장 정보 조회
- TableRepository: 테이블 정보 조회
- JWT library: 토큰 생성/검증
- bcrypt library: 비밀번호 해싱

**Key Methods**:
```typescript
authenticateTable(storeId, tableNumber, tablePassword): Promise<AuthResult>
authenticateAdmin(storeId, username, password): Promise<AuthResult>
generateToken(payload, expiresIn): string
verifyToken(token): TokenPayload | null
hashPassword(password): Promise<string>
comparePassword(password, hash): Promise<boolean>
```

**Business Rules**:
- JWT 토큰 만료 시간: 16시간
- 비밀번호 해싱: bcrypt, salt rounds 10
- 토큰 페이로드: { userId, role, storeId, tableId (optional) }

---

### 2. MenuService

**Purpose**: 메뉴 관리 비즈니스 로직

**Responsibilities**:
- 메뉴 CRUD 비즈니스 로직
- 메뉴 데이터 유효성 검증
- 카테고리 관리
- 메뉴 정렬 로직

**Dependencies**:
- MenuRepository: 메뉴 데이터 접근

**Key Methods**:
```typescript
createMenu(menu: CreateMenuDto): Promise<MenuItem>
updateMenu(menuId, menu: UpdateMenuDto): Promise<MenuItem>
deleteMenu(menuId): Promise<void>
getMenusByCategory(storeId, category?): Promise<MenuItem[]>
validateMenu(menu): ValidationResult
```

**Business Rules**:
- 메뉴명: 필수, 1-100자
- 가격: 필수, 0 이상
- 카테고리: 필수
- 이미지 URL: 선택사항, URL 형식 검증
- 메뉴 정렬: displayOrder 필드 기준

---

### 3. OrderService

**Purpose**: 주문 관리 비즈니스 로직

**Responsibilities**:
- 주문 생성 및 검증
- 주문 상태 관리
- 주문 번호 생성
- 총 금액 계산
- 주문 삭제 로직

**Dependencies**:
- OrderRepository: 주문 데이터 접근
- MenuRepository: 메뉴 정보 조회 (가격 검증)
- SSEService: 실시간 주문 업데이트 브로드캐스트

**Key Methods**:
```typescript
createOrder(orderData: CreateOrderDto): Promise<Order>
updateOrderStatus(orderId, status): Promise<Order>
deleteOrder(orderId): Promise<void>
getOrdersBySession(tableId, sessionId): Promise<Order[]>
generateOrderNumber(): string
calculateTotalAmount(items): number
```

**Business Rules**:
- 주문 번호 형식: ORD-YYYYMMDD-XXX (예: ORD-20260209-001)
- 주문 상태: pending → preparing → completed
- 총 금액 = Σ(item.price × item.quantity)
- 주문 생성 시 SSE 브로드캐스트
- 주문 삭제 시 테이블 총 주문액 재계산

**Orchestration**:
```typescript
async createOrder(orderData) {
  // 1. 메뉴 가격 검증
  await this.validateMenuPrices(orderData.items);
  
  // 2. 총 금액 계산
  const totalAmount = this.calculateTotalAmount(orderData.items);
  
  // 3. 주문 번호 생성
  const orderNumber = this.generateOrderNumber();
  
  // 4. 주문 생성
  const order = await this.orderRepository.create({
    ...orderData,
    orderNumber,
    totalAmount,
    status: 'pending',
    createdAt: new Date()
  });
  
  // 5. SSE 브로드캐스트
  this.sseService.broadcastOrderUpdate(order);
  
  return order;
}
```

---

### 4. TableService

**Purpose**: 테이블 및 세션 관리 비즈니스 로직

**Responsibilities**:
- 테이블 세션 생성 및 종료
- 세션 ID 생성
- 주문 이력 이동 로직
- 테이블 상태 관리

**Dependencies**:
- TableRepository: 테이블 데이터 접근
- OrderRepository: 주문 데이터 접근
- OrderHistoryRepository: 주문 이력 데이터 접근

**Key Methods**:
```typescript
completeSession(tableId): Promise<CompleteSessionResult>
generateSessionId(): string
getTableInfo(tableId): Promise<TableInfo>
```

**Business Rules**:
- 세션 ID: UUID v4
- 세션 종료 시:
  1. 현재 세션의 모든 주문을 OrderHistory로 이동
  2. 새 세션 ID 생성
  3. 테이블 현재 주문 목록 및 총 주문액 0으로 리셋

**Orchestration**:
```typescript
async completeSession(tableId) {
  // 1. 현재 세션 정보 조회
  const table = await this.tableRepository.findById(tableId);
  const currentSessionId = table.sessionId;
  
  // 2. 현재 세션 주문 조회
  const orders = await this.orderRepository.findBySession(tableId, currentSessionId);
  
  // 3. 주문 이력으로 이동
  for (const order of orders) {
    await this.orderHistoryRepository.create({
      ...order,
      completedAt: new Date()
    });
  }
  
  // 4. 현재 주문 삭제
  for (const order of orders) {
    await this.orderRepository.delete(order.orderId);
  }
  
  // 5. 새 세션 ID 생성
  const newSessionId = this.generateSessionId();
  
  // 6. 테이블 업데이트
  await this.tableRepository.update(tableId, {
    sessionId: newSessionId,
    currentOrders: [],
    totalAmount: 0
  });
  
  return { success: true, newSessionId };
}
```

---

### 5. SSEService

**Purpose**: Server-Sent Events 실시간 통신 관리

**Responsibilities**:
- SSE 클라이언트 연결 관리
- 주문 업데이트 브로드캐스트
- 연결 유지 (heartbeat)
- 클라이언트 재연결 처리

**Dependencies**:
- None (독립적인 서비스)

**Key Methods**:
```typescript
addClient(clientId, res): void
removeClient(clientId): void
broadcastOrderUpdate(order): void
sendHeartbeat(): void
```

**Business Rules**:
- Heartbeat 간격: 30초
- 연결 타임아웃: 60초
- 이벤트 타입: 'order-created', 'order-updated', 'order-deleted'
- 데이터 형식: JSON

**Implementation Details**:
```typescript
class SSEService {
  private clients: Map<string, Response> = new Map();
  
  addClient(clientId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    this.clients.set(clientId, res);
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  }
  
  broadcastOrderUpdate(order: Order) {
    const data = JSON.stringify({
      type: 'order-created',
      order
    });
    
    this.clients.forEach((res) => {
      res.write(`data: ${data}\n\n`);
    });
  }
}
```

---

## Service Interactions

### Order Creation Flow

```
Customer → OrderController.createOrder()
              ↓
          OrderService.createOrder()
              ↓
          ┌─────────────────────────┐
          │ 1. Validate menu prices │
          │    (MenuRepository)     │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 2. Calculate total      │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 3. Generate order number│
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 4. Create order         │
          │    (OrderRepository)    │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 5. Broadcast SSE        │
          │    (SSEService)         │
          └─────────────────────────┘
              ↓
          Response to Customer
```

### Table Session Completion Flow

```
Manager → TableController.completeSession()
              ↓
          TableService.completeSession()
              ↓
          ┌─────────────────────────┐
          │ 1. Get current session  │
          │    (TableRepository)    │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 2. Get session orders   │
          │    (OrderRepository)    │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 3. Move to history      │
          │    (OrderHistoryRepo)   │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 4. Delete current orders│
          │    (OrderRepository)    │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 5. Generate new session │
          └─────────────────────────┘
              ↓
          ┌─────────────────────────┐
          │ 6. Update table         │
          │    (TableRepository)    │
          └─────────────────────────┘
              ↓
          Response to Manager
```

---

## Service Layer Benefits

**Separation of Concerns**:
- Controllers: HTTP 계층만 담당
- Services: 비즈니스 로직 집중
- Repositories: 데이터 접근만 담당

**Testability**:
- 각 서비스를 독립적으로 단위 테스트 가능
- Repository를 Mock으로 대체하여 테스트

**Reusability**:
- 동일한 비즈니스 로직을 여러 Controller에서 재사용
- 서비스 간 조합 가능

**Maintainability**:
- 비즈니스 로직 변경 시 Service만 수정
- 명확한 책임 분리로 코드 이해 용이

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 서비스 레이어 설계 완료
