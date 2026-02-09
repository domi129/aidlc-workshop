# Component Dependencies

이 문서는 컴포넌트 간 의존성 관계, 통신 패턴, 데이터 흐름을 정의합니다.

---

## Dependency Matrix

### Frontend Dependencies

#### Customer Domain

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| MenuList | - API Client (React Query)<br>- CartStore (Zustand) | - HTTP GET /api/menus<br>- Store action: addItem() |
| MenuCard | - CartStore (Zustand) | - Store action: addItem() |
| Cart | - CartStore (Zustand)<br>- API Client (React Query) | - Store state: items, total<br>- HTTP POST /api/orders |
| OrderHistory | - API Client (React Query) | - HTTP GET /api/orders |
| AutoLogin | - API Client<br>- AuthStore (Zustand) | - HTTP POST /api/auth/table-login<br>- Store action: setAuth() |

#### Admin Domain

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| OrderDashboard | - SSE Client (eventsource-polyfill)<br>- API Client (React Query) | - SSE /api/orders/stream<br>- HTTP GET /api/orders |
| TableCard | - OrderStore (Zustand) | - Store state: orders |
| OrderDetailModal | - API Client (React Query) | - HTTP GET /api/orders<br>- HTTP PATCH /api/orders/:id/status<br>- HTTP DELETE /api/orders/:id<br>- HTTP POST /api/tables/:id/complete-session |
| MenuManagement | - API Client (React Query) | - HTTP GET /api/menus<br>- HTTP POST /api/menus<br>- HTTP PUT /api/menus/:id<br>- HTTP DELETE /api/menus/:id |
| LoginForm | - API Client<br>- AuthStore (Zustand) | - HTTP POST /api/auth/admin-login<br>- Store action: setAuth() |

#### Shared Components

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| Button | None | Props only |
| Modal | None | Props only |
| ErrorBoundary | None | React error boundary |

---

### Backend Dependencies

#### Controllers

| Controller | Depends On | Communication Pattern |
|------------|------------|----------------------|
| AuthController | - AuthService | - Method calls |
| MenuController | - MenuService | - Method calls |
| OrderController | - OrderService<br>- SSEService | - Method calls<br>- Event broadcast |
| TableController | - TableService | - Method calls |

#### Domain Services

| Service | Depends On | Communication Pattern |
|---------|------------|----------------------|
| AuthService | - StoreRepository<br>- TableRepository<br>- JWT library<br>- bcrypt library | - Repository method calls<br>- Library function calls |
| MenuService | - MenuRepository | - Repository method calls |
| OrderService | - OrderRepository<br>- MenuRepository<br>- SSEService | - Repository method calls<br>- Service method calls |
| TableService | - TableRepository<br>- OrderRepository<br>- OrderHistoryRepository | - Repository method calls |
| SSEService | None | - Direct HTTP response writes |

#### Repositories

| Repository | Depends On | Communication Pattern |
|------------|------------|----------------------|
| StoreRepository | - DynamoDB Client | - AWS SDK calls |
| TableRepository | - DynamoDB Client | - AWS SDK calls |
| MenuRepository | - DynamoDB Client | - AWS SDK calls |
| OrderRepository | - DynamoDB Client | - AWS SDK calls |
| OrderHistoryRepository | - DynamoDB Client | - AWS SDK calls |

---

## Communication Patterns

### 1. Frontend → Backend (HTTP)

**Pattern**: React Query + Axios

```typescript
// Example: Fetching menus
const { data: menus } = useQuery({
  queryKey: ['menus', storeId, category],
  queryFn: () => apiClient.get(`/api/menus?storeId=${storeId}&category=${category}`)
});
```

**Benefits**:
- 자동 캐싱
- 자동 재시도
- 로딩/에러 상태 관리
- 백그라운드 리페칭

---

### 2. Frontend State Management (Zustand)

**Pattern**: Global state store

```typescript
// CartStore example
interface CartStore {
  items: CartItem[];
  addItem: (menu: MenuItem) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (menu) => set((state) => ({
    items: [...state.items, { ...menu, quantity: 1 }]
  })),
  // ... other actions
  total: 0
}));
```

**Benefits**:
- 간단한 API
- TypeScript 지원
- 미들웨어 지원
- DevTools 통합

---

### 3. Real-time Communication (SSE)

**Pattern**: Server-Sent Events

```typescript
// Frontend: SSE Client
const eventSource = new EventSource('/api/orders/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'order-created') {
    // Update UI with new order
    updateOrderList(data.order);
  }
};

// Backend: SSE Server
app.get('/api/orders/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  sseService.addClient(clientId, res);
});
```

**Benefits**:
- 단방향 실시간 통신
- HTTP 기반 (방화벽 친화적)
- 자동 재연결
- 간단한 구현

---

### 4. Backend Service Layer

**Pattern**: Controller → Service → Repository

```typescript
// Controller
class OrderController {
  constructor(private orderService: OrderService) {}
  
  async createOrder(req, res) {
    const order = await this.orderService.createOrder(req.body);
    res.json(order);
  }
}

// Service
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private sseService: SSEService
  ) {}
  
  async createOrder(orderData) {
    const order = await this.orderRepository.create(orderData);
    this.sseService.broadcastOrderUpdate(order);
    return order;
  }
}

// Repository
class OrderRepository {
  async create(order) {
    return await dynamoDBClient.put({ TableName: 'Orders', Item: order });
  }
}
```

**Benefits**:
- 명확한 책임 분리
- 테스트 용이성
- 재사용성
- 유지보수성

---

## Data Flow Diagrams

### Customer Order Flow

```
┌─────────────┐
│  Customer   │
│   Browser   │
└──────┬──────┘
       │ 1. Browse menus
       ↓
┌─────────────────────┐
│   MenuList          │
│   Component         │
└──────┬──────────────┘
       │ 2. GET /api/menus
       ↓
┌─────────────────────┐
│  MenuController     │
└──────┬──────────────┘
       │ 3. getMenus()
       ↓
┌─────────────────────┐
│   MenuService       │
└──────┬──────────────┘
       │ 4. findByStore()
       ↓
┌─────────────────────┐
│  MenuRepository     │
└──────┬──────────────┘
       │ 5. DynamoDB Query
       ↓
┌─────────────────────┐
│    DynamoDB         │
└──────┬──────────────┘
       │ 6. Return menus
       ↓
    (Response flows back up)
       ↓
┌─────────────────────┐
│   Customer adds     │
│   to cart (local)   │
└──────┬──────────────┘
       │ 7. Zustand store update
       ↓
┌─────────────────────┐
│   Cart Component    │
└──────┬──────────────┘
       │ 8. Checkout
       │ POST /api/orders
       ↓
┌─────────────────────┐
│  OrderController    │
└──────┬──────────────┘
       │ 9. createOrder()
       ↓
┌─────────────────────┐
│   OrderService      │
└──────┬──────────────┘
       │ 10. create()
       ↓
┌─────────────────────┐
│  OrderRepository    │
└──────┬──────────────┘
       │ 11. DynamoDB Put
       ↓
┌─────────────────────┐
│    DynamoDB         │
└──────┬──────────────┘
       │ 12. Order created
       ↓
┌─────────────────────┐
│   SSEService        │
│   broadcasts        │
└─────────────────────┘
```

---

### Admin Real-time Monitoring Flow

```
┌─────────────┐
│   Manager   │
│   Browser   │
└──────┬──────┘
       │ 1. Open dashboard
       ↓
┌─────────────────────┐
│  OrderDashboard     │
│   Component         │
└──────┬──────────────┘
       │ 2. Connect SSE
       │ GET /api/orders/stream
       ↓
┌─────────────────────┐
│  OrderController    │
└──────┬──────────────┘
       │ 3. streamOrders()
       ↓
┌─────────────────────┐
│   SSEService        │
│   addClient()       │
└──────┬──────────────┘
       │ 4. Keep connection open
       │
       │ (Meanwhile, customer creates order)
       │
       ↓
┌─────────────────────┐
│   OrderService      │
│   createOrder()     │
└──────┬──────────────┘
       │ 5. broadcastOrderUpdate()
       ↓
┌─────────────────────┐
│   SSEService        │
└──────┬──────────────┘
       │ 6. Send SSE event
       ↓
┌─────────────────────┐
│  OrderDashboard     │
│   (receives event)  │
└──────┬──────────────┘
       │ 7. Update UI
       │ (new order appears)
       ↓
┌─────────────────────┐
│   Manager sees      │
│   new order         │
└─────────────────────┘
```

---

## Dependency Rules

### Frontend Rules

1. **Domain Isolation**: Customer와 Admin 도메인은 서로 의존하지 않음
2. **Shared Components**: 공통 컴포넌트는 도메인에 의존하지 않음
3. **Store Isolation**: 각 도메인은 독립적인 Zustand store 사용
4. **API Client**: 모든 HTTP 요청은 React Query를 통해 처리

### Backend Rules

1. **Layered Architecture**: Controller → Service → Repository 순서 준수
2. **No Skip**: Controller가 Repository를 직접 호출하지 않음
3. **Service Independence**: Service는 다른 Service를 호출 가능 (순환 의존 금지)
4. **Repository Isolation**: Repository는 다른 Repository를 호출하지 않음

---

## Circular Dependency Prevention

### Detected Potential Cycles

**None** - 현재 설계에서 순환 의존성 없음

### Prevention Strategies

1. **Layered Architecture**: 명확한 계층 구조로 순환 방지
2. **Dependency Injection**: 생성자 주입으로 의존성 명시
3. **Interface Segregation**: 필요한 메서드만 의존
4. **Event-Driven**: SSE를 통한 느슨한 결합

---

## Integration Points

### Frontend ↔ Backend

| Integration Point | Protocol | Data Format |
|-------------------|----------|-------------|
| Menu API | HTTP REST | JSON |
| Order API | HTTP REST | JSON |
| Auth API | HTTP REST | JSON |
| Table API | HTTP REST | JSON |
| Real-time Updates | SSE | JSON (event stream) |

### Backend ↔ Database

| Integration Point | Protocol | Data Format |
|-------------------|----------|-------------|
| DynamoDB | AWS SDK | DynamoDB JSON |

---

## Error Propagation

### Frontend Error Handling

```
Component Error
    ↓
ErrorBoundary (catches React errors)
    ↓
Display error UI

API Error
    ↓
React Query error state
    ↓
Component displays error message
```

### Backend Error Handling

```
Repository Error
    ↓
Service catches and wraps
    ↓
Controller catches
    ↓
ErrorMiddleware
    ↓
HTTP error response
```

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 컴포넌트 의존성 정의 완료
