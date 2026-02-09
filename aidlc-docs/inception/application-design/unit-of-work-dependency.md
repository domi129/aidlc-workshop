# Unit of Work Dependencies

## Dependency Strategy

**선택된 전략**: API 기반 (Unit 간 HTTP API로만 통신)

**특징**:
- Customer Unit과 Admin Unit은 동일한 백엔드 API를 공유
- 프론트엔드 도메인 간 직접 의존 없음
- 백엔드는 Monolith이므로 내부적으로 Service 간 직접 호출 가능

---

## Dependency Matrix

### Frontend Dependencies

| From Unit | To Unit | Dependency Type | Description |
|-----------|---------|-----------------|-------------|
| Customer Frontend | Backend API | HTTP REST | 메뉴 조회, 주문 생성/조회 |
| Admin Frontend | Backend API | HTTP REST + SSE | 주문 모니터링, 메뉴 관리, 테이블 관리 |
| Customer Frontend | Admin Frontend | None | 독립적, 의존 없음 |
| Admin Frontend | Customer Frontend | None | 독립적, 의존 없음 |

### Backend Dependencies

| From Component | To Component | Dependency Type | Description |
|----------------|--------------|-----------------|-------------|
| OrderService | SSEService | Direct Call | 주문 생성 시 SSE 브로드캐스트 |
| TableService | OrderRepository | Direct Call | 세션 종료 시 주문 조회 |
| TableService | OrderHistoryRepository | Direct Call | 주문 이력 저장 |
| All Services | Repositories | Direct Call | 데이터 접근 |
| All Controllers | Services | Direct Call | 비즈니스 로직 호출 |

---

## Integration Points

### 1. Customer → Backend API

**Authentication**:
```
Customer Frontend → POST /api/auth/table-login → AuthController → AuthService
```

**Menu Browsing**:
```
Customer Frontend → GET /api/menus → MenuController → MenuService → MenuRepository
```

**Order Creation**:
```
Customer Frontend → POST /api/orders → OrderController → OrderService → OrderRepository
                                                        ↓
                                                    SSEService (broadcast)
```

**Order History**:
```
Customer Frontend → GET /api/orders → OrderController → OrderService → OrderRepository
```

---

### 2. Admin → Backend API

**Authentication**:
```
Admin Frontend → POST /api/auth/admin-login → AuthController → AuthService
```

**Real-time Monitoring**:
```
Admin Frontend → GET /api/orders/stream (SSE) → OrderController → SSEService
                                                                      ↑
                                                    (receives broadcasts from OrderService)
```

**Order Management**:
```
Admin Frontend → PATCH /api/orders/:id/status → OrderController → OrderService
Admin Frontend → DELETE /api/orders/:id → OrderController → OrderService
```

**Table Management**:
```
Admin Frontend → POST /api/tables/:id/complete-session → TableController → TableService
                                                                              ↓
                                                          OrderRepository, OrderHistoryRepository
```

**Menu Management**:
```
Admin Frontend → POST/PUT/DELETE /api/menus → MenuController → MenuService → MenuRepository
```

---

## Data Flow

### Customer Order Flow

```
1. Customer browses menus
   Customer Frontend → GET /api/menus → MenuRepository → DynamoDB

2. Customer adds to cart (local)
   Customer Frontend → CartStore (Zustand, LocalStorage)

3. Customer creates order
   Customer Frontend → POST /api/orders → OrderRepository → DynamoDB
                                        ↓
                                    SSEService.broadcast()

4. Admin receives real-time update
   SSEService → Admin Frontend (SSE connection)
```

### Admin Table Session Completion Flow

```
1. Admin completes table session
   Admin Frontend → POST /api/tables/:id/complete-session → TableService

2. TableService orchestrates
   TableService → OrderRepository.findBySession()
                ↓
   TableService → OrderHistoryRepository.create() (for each order)
                ↓
   TableService → OrderRepository.delete() (for each order)
                ↓
   TableService → TableRepository.update() (new session ID)

3. Response to Admin
   TableService → TableController → Admin Frontend
```

---

## Shared Dependencies

### Both Units Depend On

**Shared Backend Services**:
- AuthService (인증)
- StoreRepository (매장 정보)

**Shared Middleware**:
- AuthMiddleware (JWT 검증)
- ErrorMiddleware (에러 처리)
- LoggerMiddleware (로깅)

**Shared Data Models**:
- Store, Table, Menu, Order, OrderHistory

**Shared Frontend**:
- Button, Modal, ErrorBoundary (UI 컴포넌트)
- API Client (React Query)
- Types (TypeScript 타입)

---

## Circular Dependency Prevention

### Current Status
**No circular dependencies detected**

### Prevention Strategies
1. **Layered Architecture**: Controller → Service → Repository (단방향)
2. **Frontend Isolation**: Customer와 Admin 도메인 완전 분리
3. **Event-Driven**: SSE를 통한 느슨한 결합
4. **Shared Module**: 공통 코드는 shared 모듈로 분리

---

## Deployment Dependencies

**Deployment Model**: Monolith (단일 배포)

**Deployment Order**:
1. Backend API 배포
2. Customer Frontend 배포 (S3 + CloudFront)
3. Admin Frontend 배포 (S3 + CloudFront)

**Note**: Monolith이므로 실제로는 전체를 한 번에 배포

---

## Testing Dependencies

### Unit Testing
- **Customer Unit**: 독립 테스트 (Backend API를 Mock)
- **Admin Unit**: 독립 테스트 (Backend API를 Mock)

### Integration Testing
- Customer Unit + Backend API
- Admin Unit + Backend API
- SSE 통신 테스트 (Customer 주문 → Admin 수신)

### E2E Testing
- 전체 시스템 E2E 테스트
- Customer 주문 → Admin 모니터링 → 상태 변경 플로우

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Unit 의존성 정의 완료
